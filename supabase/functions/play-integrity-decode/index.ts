const must = (v, name)=>{
  if (!v || !v.trim()) throw new Error(`Missing env: ${name}`);
  return v;
};
const SA_EMAIL = must(Deno.env.get("GCP_SA_EMAIL"), "GCP_SA_EMAIL");
const SA_PRIVATE_KEY_PEM = must(Deno.env.get("GCP_SA_PRIVATE_KEY"), "GCP_SA_PRIVATE_KEY");
const TOKEN_AUD = Deno.env.get("GCP_TOKEN_AUD") || "https://oauth2.googleapis.com/token";
const TOKEN_SCOPE = Deno.env.get("GCP_TOKEN_SCOPE") || "https://www.googleapis.com/auth/playintegrity";
const PACKAGE_NAME = must(Deno.env.get("PACKAGE_NAME"), "PACKAGE_NAME");
function b64url(u8) {
  return btoa(String.fromCharCode(...u8)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
async function importPKCS8(pem) {
  const start = "-----BEGIN PRIVATE KEY-----";
  const end = "-----END PRIVATE KEY-----";
  if (!pem.includes(start) || !pem.includes(end)) {
    throw new Error("Private key PEM missing BEGIN/END headers");
  }
  const der = Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "")), (c)=>c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", der.buffer, {
    name: "RSASSA-PKCS1-v1_5",
    hash: "SHA-256"
  }, false, [
    "sign"
  ]);
}
async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const enc = new TextEncoder();
  const headerB64 = b64url(enc.encode(JSON.stringify({
    alg: "RS256",
    typ: "JWT"
  })));
  const claimB64 = b64url(enc.encode(JSON.stringify({
    iss: SA_EMAIL,
    scope: TOKEN_SCOPE,
    aud: TOKEN_AUD,
    exp: now + 3600,
    iat: now
  })));
  const input = `${headerB64}.${claimB64}`;
  const key = await importPKCS8(SA_PRIVATE_KEY_PEM);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(input));
  const jwt = `${input}.${b64url(new Uint8Array(sig))}`;
  const res = await fetch(TOKEN_AUD, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`OAuth token error ${res.status}: ${text}`);
  }
  const json = JSON.parse(text);
  return json.access_token;
}
Deno.serve(async (req)=>{
  const jsonHeaders = {
    "Content-Type": "application/json"
  };
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        error: "Method Not Allowed"
      }), {
        status: 405,
        headers: jsonHeaders
      });
    }
    let body;
    try {
      body = await req.json();
    } catch  {
      return new Response(JSON.stringify({
        error: "Bad JSON"
      }), {
        status: 400,
        headers: jsonHeaders
      });
    }
    const integrityToken = body?.integrityToken;
    if (!integrityToken) {
      return new Response(JSON.stringify({
        error: "Missing integrityToken"
      }), {
        status: 400,
        headers: jsonHeaders
      });
    }
    // 1) Mint Google OAuth token
    let accessToken;
    try {
      accessToken = await getAccessToken();
    } catch (e) {
      console.error("Stage: oauth", e);
      return new Response(JSON.stringify({
        stage: "oauth",
        error: String(e)
      }), {
        status: 502,
        headers: jsonHeaders
      });
    }
    // 2) Call Decode Integrity
    const url = `https://playintegrity.googleapis.com/v1/${encodeURIComponent(PACKAGE_NAME)}:decodeIntegrityToken`;
    const g = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        integrity_token: integrityToken
      })
    });
    const text = await g.text();
    if (!g.ok) {
      console.error("Stage: decode", g.status, text);
      return new Response(JSON.stringify({
        stage: "decode",
        status: g.status,
        body: text
      }), {
        status: 502,
        headers: jsonHeaders
      });
    }
    return new Response(text, {
      headers: jsonHeaders
    });
  } catch (e) {
    console.error("Stage: top-level", e);
    return new Response(JSON.stringify({
      stage: "top-level",
      error: String(e)
    }), {
      status: 500,
      headers: jsonHeaders
    });
  }
});
