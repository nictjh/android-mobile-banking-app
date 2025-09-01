import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
// Import the paynow checking
import { transferFunds } from '../../lib/services/transferService';
import { getAccountByPhone } from '../../lib/services/paynowService';

    export default function PaynowQuery() {
    const router = useRouter();
    const { userAccNumber, userAccBalance, recipientPhone } = useLocalSearchParams();

    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [accountFound, setAccountFound] = useState(false);
    const [accountDetails, setAccountDetails] = useState(null);
    const [transferAmount, setTransferAmount] = useState('');

    const performPhoneLookup = async (num) => {
        const numberToLookup = num || phoneNumber;

        if (!numberToLookup.trim()) {
            Alert.alert('Error', 'Please enter a phone number');
        return;
        }

        if (numberToLookup.length !== 8) { // assume SG 8-digit mobile
            Alert.alert('Error', 'Phone number must be 8 digits');
        return;
        }

        setLoading(true);
        try {
        const details = await getAccountByPhone(numberToLookup);

        if (details) {
            setAccountDetails(details);
            setAccountFound(true);
        } else {
            Alert.alert('Not Found', 'No PayNow account linked to this phone number');
            setAccountFound(false);
            setAccountDetails(null);
        }
        } catch (err) {
            console.error('Phone lookup error:', err);
            Alert.alert('Error', 'Failed to resolve PayNow account');
            setAccountFound(false);
            setAccountDetails(null);
        } finally {
            setLoading(false);
        }
    };

    const executeTransfer = async () => {
        const amount = parseFloat(transferAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid transfer amount');
        return;
        }

        if (userAccBalance && parseFloat(userAccBalance) < amount) {
            Alert.alert('Insufficient Balance', `You only have $${parseFloat(userAccBalance).toFixed(2)} available.`);
        return;
        }

        Alert.alert(
        'Confirm Transfer',
        `Transfer $${amount.toFixed(2)} from your account (${userAccNumber}) to ${accountDetails.account_number} (linked to ${phoneNumber})?`,
        [
            { text: 'Cancel', style: 'cancel' },
            {
            text: 'Confirm',
            onPress: async () => {
                try {
                setLoading(true);
                const result = await transferFunds(userAccNumber, accountDetails.account_number, amount);
                if (result.success) {
                    Alert.alert('Success', `Transfer of $${amount.toFixed(2)} completed successfully!`);
                }
                resetForm();
                } catch (error) {
                console.error('Transfer error:', error);
                Alert.alert('Transfer Failed', error.message || 'Error during transfer');
                } finally {
                setLoading(false);
                }
            }
            }
        ]
        );
    };

    const resetForm = () => {
        setPhoneNumber('');
        setAccountFound(false);
        setAccountDetails(null);
        setTransferAmount('');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Back */}
                <View style={styles.backButtonContainer}>
                <TouchableOpacity onPress={() => router.push('/home')} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                </View>

                <View style={styles.header}>
                <Text style={styles.title}>PayNow Transfer</Text>
                </View>

                {/* From Account */}
                {userAccNumber && (
                <View style={styles.userAccountSection}>
                    <Text style={styles.sectionTitle}>From Your Account</Text>
                    <View style={styles.userAccountCard}>
                    <Text style={styles.userAccountNumber}>{userAccNumber}</Text>
                    <Text style={styles.userAccountBalance}>
                        Available: ${parseFloat(userAccBalance || 0).toFixed(2)}
                    </Text>
                    </View>
                </View>
                )}

                {!accountFound ? (
                /* Lookup Section */
                <View style={styles.lookupSection}>
                    <Text style={styles.sectionTitle}>Enter Recipient Phone</Text>
                    <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Mobile Number</Text>
                    <TextInput
                        style={styles.textInput}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        placeholder="91234567"
                        keyboardType="phone-pad"
                        maxLength={8}
                    />
                    <Text style={styles.helperText}>Enter 8-digit Singapore mobile number</Text>
                    </View>

                    <TouchableOpacity
                    style={[styles.lookupButton, loading && styles.buttonDisabled]}
                    onPress={() => performPhoneLookup()}
                    disabled={loading}
                    >
                    <Text style={styles.lookupButtonText}>
                        {loading ? 'Checking...' : 'Check PayNow'}
                    </Text>
                    </TouchableOpacity>
                </View>
                ) : (
                /* Transfer Section */
                <View style={styles.transferSection}>
                    {/* Resolved Account */}
                    <View style={styles.accountCard}>
                    <Text style={styles.cardTitle}>Recipient PayNow Account</Text>
                    <Text style={styles.accountNumber}>{accountDetails.account_number}</Text>
                    <Text style={styles.accountType}>{accountDetails.account_type} - {accountDetails.sub_type}</Text>
                    <Text style={styles.currency}>{accountDetails.currency}</Text>
                    </View>

                    {/* Amount */}
                    <View style={styles.amountSection}>
                    <Text style={styles.sectionTitle}>Transfer Amount</Text>
                    <View style={styles.amountInputContainer}>
                        <Text style={styles.currencySymbol}>$</Text>
                        <TextInput
                        style={styles.amountInput}
                        value={transferAmount}
                        onChangeText={setTransferAmount}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        />
                        <Text style={styles.currencyCode}>SGD</Text>
                    </View>
                    </View>

                    <TouchableOpacity
                    style={[
                        styles.transferButton,
                        transferAmount.length > 0 && parseFloat(transferAmount) > 0
                        ? styles.transferButtonActive
                        : styles.transferButtonDisabled
                    ]}
                    onPress={executeTransfer}
                    disabled={!(transferAmount.length > 0 && parseFloat(transferAmount) > 0)}
                    >
                    <Text style={[
                        styles.transferButtonText,
                        transferAmount.length > 0 && parseFloat(transferAmount) > 0 && styles.transferButtonTextActive
                    ]}>
                        Execute PayNow
                    </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
                    <Text style={styles.resetButtonText}>Start New Transfer</Text>
                    </TouchableOpacity>
                </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}


    const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 24,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        paddingTop: 24,
        paddingBottom: 16,
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#3b82f6',
        fontWeight: '500',
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1f2937',
        marginLeft: 16,
    },
    userAccountSection: {
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    userAccountCard: {
        backgroundColor: '#e0f2fe',
        padding: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#0284c7',
        marginBottom: 16,
    },
    userAccountNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0c4a6e',
        marginBottom: 4,
    },
    userAccountBalance: {
        fontSize: 14,
        color: '#075985',
    },
    lookupSection: {
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 16,
    },
    inputContainer: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#ffffff',
    },
    helperText: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    lookupButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#9ca3af',
    },
    lookupButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    transferSection: {
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    accountCard: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
        marginBottom: 8,
    },
    accountNumber: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    accountType: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 2,
    },
    currency: {
        fontSize: 12,
        color: '#6b7280',
    },
    amountSection: {
        marginBottom: 24,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    currencySymbol: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 18,
        fontWeight: '500',
        color: '#1f2937',
    },
    currencyCode: {
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 8,
    },

    transferButton: {
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    transferButtonDisabled: {
        backgroundColor: '#e5e7eb',
    },
    transferButtonActive: {
        backgroundColor: '#10b981',
    },
    transferButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#9ca3af',
    },
    transferButtonTextActive: {
        color: '#ffffff',
    },
    resetButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    resetButtonText: {
        fontSize: 14,
        color: '#6b7280',
        textDecoration: 'underline',
    },
});
