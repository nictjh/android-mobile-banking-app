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