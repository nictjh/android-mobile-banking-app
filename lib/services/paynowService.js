import { supabase } from '../supabase';

export async function insertNewProxy(customerid, accountid, proxyNumber, proxyType) {
    const { data, error } = await supabase
        .from('paynow_proxies')
        .insert([{
            customer_id: customerid,
            account_id: accountid,
            proxy_type: proxyType,
            proxy_value: proxyNumber
        }]);

    if (error) {
        console.error('Error inserting new proxy:', error);
        return null;
    }
    console.log('Inserted new proxy:', data);
}