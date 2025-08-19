import { supabase } from '../supabase';

export async function transferFunds(fromAccNo, toAccNo, amount) {
    try {

        // Pre-checks, get the fromAccount and toAccount data
        const { data: fromAccount, error: fromError } = await supabase
            .from('accounts')
            .select('account_id, account_number, current_balance')
            .eq('account_number', fromAccNo)
            .single();

        if (fromError) throw fromError;
        if (!fromAccount) throw new Error('Sender account not found');

        const { data: toAccount, error: toError } = await supabase
            .from('accounts')
            .select('account_id, account_number, current_balance')
            .eq('account_number', toAccNo)
            .single();

        if (toError) throw toError;
        if (!toAccount) throw new Error('Receiver account not found');

        if (fromAccount.current_balance < amount) {
        throw new Error('Insufficient funds');
        }

        // Update balances
        const { error: updateFromError } = await supabase
            .from('accounts')
            .update({ current_balance: fromAccount.current_balance - amount })
            .eq('account_id', fromAccount.account_id);

        if (updateFromError) throw updateFromError;

        const { error: updateToError } = await supabase
            .from('accounts')
            .update({ current_balance: toAccount.current_balance + amount })
            .eq('account_id', toAccount.account_id);

        if (updateFromError) throw updateFromError;

        // Update transactions tables
        const { error: txnError } = await supabase.from('transactions').insert([
            {
                account_id: fromAccount.account_id,
                booking_datetime: new Date().toISOString(),
                amount,
                currency: 'SGD',
                credit_debit: 'Debit',
                description: `Transfer to ${toAccNo}`,
                transaction_type: 'Online Transfer',
                status: 'Booked'
            },
            {
                account_id: toAccount.account_id,
                booking_datetime: new Date().toISOString(),
                amount,
                currency: 'SGD',
                credit_debit: 'Credit',
                description: `Transfer from ${fromAccNo}`,
                transaction_type: 'Online Transfer',
                status: 'Booked'
            }
        ]);

        if (txnError) throw txnError;

        // Insert balance snapshot for tracking purposes
        const { error: balError } = await supabase.from('balances').insert([
            {
                account_id: fromAccount.account_id,
                balance_type: 'InterimAvailable',
                amount: fromAccount.current_balance - amount,
                currency: 'SGD',
                credit_debit: 'Debit',
                reference_date: new Date().toISOString()
            },
            {
                account_id: toAccount.account_id,
                balance_type: 'InterimAvailable',
                amount: toAccount.current_balance + amount,
                currency: 'SGD',
                credit_debit: 'Credit',
                reference_date: new Date().toISOString()
            }
        ]);

        if (balError) throw balError;
        return {
            success: true,
            message: `Transfer $${amount} from ${fromAccNo} to ${toAccNo} completed successfully`,
        };

    } catch (error) {
        console.error('Transfer error:', error);
        return {
            success: false,
            message: error.message || 'An error occurred during the transfer'
        };
    }
}