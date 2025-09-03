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

export async function getAccountByPhone(proxyNumber) {
    // console.error('Searching for account with proxy number:', proxyNumber);
    const phone = String(proxyNumber).trim();

    const { data, error } = await supabase
        .from('paynow_proxies')
        .select('*')
        .eq('proxy_value', phone)
        .maybeSingle();

    if (error) {
        console.error('Error fetching account by phone:', error);
        return null;
    }

    if (!data || !data.account_id) {
        console.error('No account found for proxy number:', proxyNumber);
        return null;
    }

    console.log('Found proxy data:', data);

    const accountIdFound = data.account_id;

    const { data: accData, error: accError } = await supabase
        .from('accounts')
        .select('*')
        .eq('account_id', accountIdFound)
        .maybeSingle();

    if (accError) {
        console.error('Error fetching account details:', accError);
        return null;
    }

    return accData;
}