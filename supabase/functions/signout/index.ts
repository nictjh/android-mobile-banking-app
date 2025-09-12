// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
// const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// // One admin client is sufficient for DB + auth user lookup
// const adminClient = createClient(supabaseUrl, serviceRoleKey, {
//   auth: { autoRefreshToken: false, persistSession: false },
// });

// Deno.serve(async (req) => {
//   try {
//     const { device_id } = await req.json();
//     if (!device_id) {
//       return new Response(JSON.stringify({ error: "Missing device_id" }), { status: 400 });
//     }

//     const authHeader = req.headers.get("Authorization") ?? "";
//     const jwt = authHeader.replace("Bearer ", "").trim();
//     if (!jwt) {
//       return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401 });
//     }

//     // Verify access token -> get user
//     const { data: { user }, error: userError } = await adminClient.auth.getUser(jwt);
//     if (userError || !user) {
//       return new Response(JSON.stringify({ error: "Invalid access token" }), { status: 401 });
//     }

//     // Ensure this device/session exists and isn't already revoked
//     const { data: deviceRow, error: dbError } = await adminClient
//       .from("auth_devices")
//       .select("*")
//       .eq("user_id", user.id)
//       .eq("device_id", device_id)
//       .eq("revoked", false)
//       .single();

//     if (dbError || !deviceRow) {
//       return new Response(JSON.stringify({ error: "Device/session not found" }), { status: 403 });
//     }

//     // ✅ Correct: logout with the USER access token (global sign-out)
//     const resp = await fetch(`${supabaseUrl}/auth/v1/logout`, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${jwt}`,
//         apikey: serviceRoleKey,
//       },
//     });

//     if (!resp.ok) {
//       const text = await resp.text();
//       // 404 previously came from calling a non-existent admin route
//       return new Response(JSON.stringify({ error: text || "Logout failed" }), { status: 500 });
//     }

//     // Mark this device-row revoked for audit
//     const { error: updateError } = await adminClient
//       .from("auth_devices")
//       .update({ revoked: true })
//       .eq("id", deviceRow.id);

//     if (updateError) {
//       return new Response(JSON.stringify({ error: "Failed to update device record" }), { status: 500 });
//     }

//     return new Response(JSON.stringify({ success: true }), {
//       status: 200,
//       headers: { "Content-Type": "application/json" },
//     });

//   } catch (err) {
//     return new Response(JSON.stringify({ error: err.message }), {
//       status: 400,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// });


import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Admin client for DB + auth
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Helper: insert audit log
async function logEvent(user_id: string | null, device_id: string | null, status: "success" | "failure", details: Record<string, unknown>) {
  await adminClient.from("auth_audit_logs").insert({
    user_id,
    device_id,
    action: "SIGNOUT",
    status,
    details,
  });
}

Deno.serve(async (req) => {
  try {
    const { device_id } = await req.json();
    if (!device_id) {
      await logEvent(null, null, "failure", { reason: "missing device_id" });
      return new Response(JSON.stringify({ error: "Missing device_id" }), { status: 400 });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "").trim();
    if (!jwt) {
      await logEvent(null, device_id, "failure", { reason: "missing auth header" });
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401 });
    }

    // Verify access token
    const { data: { user }, error: userError } = await adminClient.auth.getUser(jwt);
    if (userError || !user) {
      await logEvent(null, device_id, "failure", { reason: "invalid access token", error: userError });
      return new Response(JSON.stringify({ error: "Invalid access token" }), { status: 401 });
    }

    // Ensure device binding
    const { data: deviceRow, error: dbError } = await adminClient
      .from("auth_devices")
      .select("*")
      .eq("user_id", user.id)
      .eq("device_id", device_id)
      .eq("revoked", false)
      .single();

    if (dbError || !deviceRow) {
      await logEvent(user.id, device_id, "failure", { reason: "device not found" });
      return new Response(JSON.stringify({ error: "Device/session not found" }), { status: 403 });
    }

    // Call Supabase logout with user's access token
    const resp = await fetch(`${supabaseUrl}/auth/v1/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        apikey: serviceRoleKey,
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      await logEvent(user.id, device_id, "failure", { reason: "logout failed", response: text });
      return new Response(JSON.stringify({ error: text }), { status: 500 });
    }

    // Mark device row revoked
    await adminClient
      .from("auth_devices")
      .update({ revoked: true })
      .eq("id", deviceRow.id);

    await logEvent(user.id, device_id, "success", { message: "logout completed" });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    await logEvent(null, null, "failure", { reason: "exception", error: err.message });
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
