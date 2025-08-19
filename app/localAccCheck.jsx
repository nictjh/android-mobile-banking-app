import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { getAccountDetailsByNumber } from '../lib/services/accService.js';
import { transferFunds } from '../lib/services/transferService.js';

export default function LocalAccCheck() {
  const router = useRouter();
  const { userAccountNumber, userAccountBalance, recipientAccountNumber } = useLocalSearchParams();
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountFound, setAccountFound] = useState(false);
  const [accountDetails, setAccountDetails] = useState(null);
  const [transferAmount, setTransferAmount] = useState('');

  // Auto-lookup account if recipientAccountNumber is provided (from QR scan)
  useEffect(() => {
    if (recipientAccountNumber && recipientAccountNumber.trim()) {
      console.log('Auto-looking up account from parameter:', recipientAccountNumber);
      setAccountNumber(recipientAccountNumber);
      // Automatically trigger lookup
      performAccountLookup(recipientAccountNumber);
    }
  }, [recipientAccountNumber]);

  const performAccountLookup = async (accountNum) => {
    const numberToLookup = accountNum || accountNumber;
    
    if (!numberToLookup.trim()) {
      Alert.alert('Error', 'Please enter an account number');
      return;
    }

    if (numberToLookup.length !== 11) {
      Alert.alert('Error', 'Account number must be 11 digits');
      return;
    }

    setLoading(true);
    try {
      console.log('Looking up account:', numberToLookup);

      const details = await getAccountDetailsByNumber(numberToLookup);

      if (details) {
        setAccountDetails(details);
        setAccountFound(true);
        console.log('Account found:', details);
      } else {
        Alert.alert('Account Not Found', 'No account exists with this number');
        setAccountFound(false);
        setAccountDetails(null);
      }

    } catch (error) {
      console.error('Error looking up account:', error);
      Alert.alert('Error', 'Account not found or error occurred');
      setAccountFound(false);
      setAccountDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountLookup = async () => {
    await performAccountLookup();
  };

  const handleAmountChange = (amount) => {
    setTransferAmount(amount);
  };

  const executeTransfer = async () => {
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid transfer amount');
      return;
    }

    // Check if user has sufficient balance
    if (userAccountBalance && parseFloat(userAccountBalance) < amount) {
      Alert.alert('Insufficient Balance', `You only have $${parseFloat(userAccountBalance).toFixed(2)} available.`);
      return;
    }

    Alert.alert(
      'Confirm Transfer',
      `Transfer $${amount.toFixed(2)} from your account (${userAccountNumber}) to ${accountDetails.account_number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setLoading(true);

              // Use the transferFunds service with sender account number and recipient account number
              const result = await transferFunds(userAccountNumber, accountDetails.account_number, amount);

              if (result.success) {
                Alert.alert('Success', `Transfer of $${amount.toFixed(2)} completed successfully!`);
                console.log('Transfer completed:', result);
              }

              // Reset form
              resetForm();
            } catch (error) {
              console.error('Transfer error:', error);
              Alert.alert('Transfer Failed', error.message || 'An error occurred during transfer');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setAccountNumber('');
    setAccountFound(false);
    setAccountDetails(null);
    setTransferAmount('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity onPress={() => router.push('/home')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
            <Text style={styles.title}>Local Transfer</Text>
        </View>

        {/* User's Account Information */}
        {userAccountNumber && (
          <View style={styles.userAccountSection}>
            <Text style={styles.sectionTitle}>From Your Account</Text>
            <View style={styles.userAccountCard}>
              <Text style={styles.userAccountNumber}>{userAccountNumber}</Text>
              <Text style={styles.userAccountBalance}>
                Available: ${parseFloat(userAccountBalance || 0).toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {!accountFound ? (
          /* Account Lookup Section */
          <View style={styles.lookupSection}>
            <Text style={styles.sectionTitle}>Enter Recipient Account</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Account Number</Text>
              <TextInput
                style={styles.textInput}
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="00112345678"
                keyboardType="numeric"
                maxLength={11}
              />
              <Text style={styles.helperText}>Enter 11-digit account number</Text>
            </View>

            <TouchableOpacity
              style={[styles.lookupButton, loading && styles.buttonDisabled]}
              onPress={handleAccountLookup}
              disabled={loading}
            >
              <Text style={styles.lookupButtonText}>
                {loading ? 'Checking...' : 'Check Account'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Transfer Section */
          <View style={styles.transferSection}>
            {/* Account Details Card */}
            <View style={styles.accountCard}>
              <Text style={styles.cardTitle}>Recipient Account</Text>
              <Text style={styles.accountNumber}>{accountDetails.account_number}</Text>
              <Text style={styles.accountType}>{accountDetails.account_type} - {accountDetails.sub_type}</Text>
              <Text style={styles.currency}>{accountDetails.currency}</Text>
            </View>

            {/* Transfer Amount */}
            <View style={styles.amountSection}>
              <Text style={styles.sectionTitle}>Transfer Amount</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={transferAmount}
                  onChangeText={handleAmountChange}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
                <Text style={styles.currencyCode}>SGD</Text>
              </View>
            </View>

            {/* Transfer Button */}
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
                Execute Transfer
              </Text>
            </TouchableOpacity>

            {/* Reset Button */}
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
