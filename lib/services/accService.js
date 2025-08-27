import { supabase } from '../supabase';
import { Alert } from 'react-native';

// Helper function to generate account number
function generateAccountNumber() {
    const branchCode = '001';

    // Generate 8 random digits
    let randomDigits = '';
    for (let i = 0; i < 8; i++) {
        randomDigits += Math.floor(Math.random() * 10).toString();
    }

    return branchCode + randomDigits;
}

export async function createPOSBAccount(customerId) {

    // Do a check to see if account already exists if so return
    const { data: existingAccount, error: existingError } = await supabase
        .from('account_parties')
        .select('*')
        .eq('customer_id', customerId)
        .single();

        if (existingAccount) {
          console.log('Account already exists:', existingAccount);
          Alert.alert('Account Creation', 'You already have an account.');
          return existingAccount;
        }


    // Account Doesnt exist, proceed to create a new account and link customer
    // Generate a unique account number
    const accountNumber = generateAccountNumber();

    const { data: account, error: accountError } = await supabase
        .from('accounts')
        .insert([{
            account_number: accountNumber,
            product_id: '2fcf256d-50b4-4cd2-a83b-0b5668c5fd3d',
            currency: 'SGD',
            status: 'enabled',
            account_type: 'Personal',
            sub_type: 'Savings',
            current_balance: 0.00
        }])
        .select()
        .single();

    if (accountError) throw accountError;

    // Link customer as PrimaryOwner
    const { error: partyError } = await supabase
        .from('account_parties')
        .insert([{
            account_id: account.account_id,
            customer_id: customerId,
            role: 'PrimaryOwner'
        }]);

    if (partyError) throw partyError;
    Alert.alert('Account Creation', 'Your account has been created successfully!');
    return account;
}

export async function getAccountDetails(customerId) {
    // First, get the account_id from account_parties table
    const { data: accountParty, error: partyError } = await supabase
        .from('account_parties')
        .select('account_id')
        .eq('customer_id', customerId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

    if (partyError) {
        console.error('Error fetching account party:', partyError);
        return null;
    }

    if (!accountParty) {
        console.log('No account found for customer:', customerId);
        return null;
    }

    // Then get the account details using the account_id
    const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('*')
        .eq('account_id', accountParty.account_id)
        .single();

    if (accountError) {
        console.error('Error fetching account details:', accountError);
        return null;
    }

    return account;
}

export async function getAccountDetailsByNumber(accountNumber) {
    const { data: account, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('account_number', accountNumber)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

    if (error) {
        console.error('Error fetching account by number:', error);
        return null;
    }

    return account;
}

