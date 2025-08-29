import { supabase } from '../supabase';


// I want to pull the customer_id
export async function getUserProfile(userId) {
    const { data, error }  = await supabase
                                    .from('customers')
                                    .select('*')
                                    .eq('auth_user_id', userId)
                                    .single();
    if (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
    return data;
}

export async function insertUserHPcontact(customerid, number) {
    const { data, error } = await supabase
                                .from("customer_contacts")
                                .insert([
                                    {
                                        customer_id: customerid,
                                        kind: "mobile",
                                        value: number
                                    }
                                ]);
    if (error) {
        console.error("Error inserting new contact", error);
        return null;
    }
}

// Placeholder check
export async function checkPaynowLinked(customerid) {
  const { data, error } = await supabase
    .from("customer_contacts")
    .select("value")
    .eq("customer_id", customerid)
    .maybeSingle(); // use maybeSingle if only one row expected

  if (error) {
    console.error("checkPaynowLinked error:", error);
    return false; // safe fallback
  }

  // return true if value exists and is not an empty string
  return !!(data && data.value);
}