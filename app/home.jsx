import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { getUserProfile } from '../lib/services/userService.js';
import { createPOSBAccount, getAccountDetails } from '../lib/services/accService.js';
import { checkPaynowLinked } from '../lib/services/userService.js';

    export default function Home() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [customerData, setCustomerData] = useState(null);
    const [customerId, setCustomerId] = useState(null);
    const [accountDetails, setAccountDetails] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => { // This will run on component mount
        const fetchUserAndCustomerData = async () => {
            try {
                console.log('Starting fetchUserAndCustomerData...');

                // Get current session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                console.log('Session result:', { session: !!session, user: !!session?.user, error: sessionError });

                if (sessionError) {
                    console.error('Error getting session:', sessionError);
                    router.replace('/');
                    return;
                }

                if (!session?.user) {
                    console.log('No session or user found, redirecting to login');
                    router.replace('/');
                    return;
                }

                console.log('User ID:', session.user.id);
                setUser(session.user);

                // Fetch customer data using the user ID
                console.log('Fetching customer profile...');
                const customerData = await getUserProfile(session.user.id);
                console.log('Customer data result:', customerData);

                if (customerData) {
                    setCustomerData(customerData);
                    setCustomerId(customerData.customer_id);
                    console.log('Customer ID set to:', customerData.customer_id);
                } else {
                    console.log('No customer data found');
                    setError('Could not find customer profile');
                }

                setLoading(false);
            } catch (err) {
                console.error('Error in fetchUserAndCustomerData:', err);
                setError('An error occurred while loading user data');
                setLoading(false);
            }
        };

        fetchUserAndCustomerData();
    }, []);

    // Function to refresh account details
    const refreshAccountDetails = useCallback(async () => {
        if (customerId) {
            try {
                console.log('Refreshing account details for customer ID:', customerId);
                const details = await getAccountDetails(customerId);
                setAccountDetails(details);
                if (details) {
                    console.log('Account details refreshed:', details);
                } else {
                    console.log('No account found for customer - user needs to create an account');
                }
            } catch (error) {
                console.error('Error refreshing account details:', error);
                setAccountDetails(null);
            }
        }
    }, [customerId]);

    useEffect(() => { // This useEffect will run when customerId changes
        refreshAccountDetails();
    }, [customerId, refreshAccountDetails]);

    // Refresh account details when screen comes into focus (e.g., returning from transfer page)
    useFocusEffect(
        useCallback(() => {
            if (customerId) {
                console.log('Screen focused, refreshing account details...');
                refreshAccountDetails();
            }
        }, [customerId, refreshAccountDetails])
    );

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            router.replace('/'); // Redirect to login page
        }
    };

    // Show loading while checking session
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // If no user (shouldn't happen due to redirect, but safety check)
    if (!user) {
        return null;
    }

    const handlePayNow = async () => {
        try {
            const { linked: isLinked, value: linkedValue } = await checkPaynowLinked(customerId);

            if (isLinked) {
            // Already linked -> go to manage/use page
            console.log("##################### PayNow already linked, navigating to query screen " + accountDetails?.account_number);
            router.push({
                pathname: "/paynow/paynowQuery",   // or your final PayNow screen
                params: {
                    userAccNumber: accountDetails?.account_number ?? null,
                    userAccBalance: accountDetails?.current_balance ?? null,
                    recipientPhone: linkedValue,
                },
            });
            } else {
            // Not linked yet -> go to link flow
            router.push({
                pathname: "/paynow/paynowScreen",
                params: {
                    userAccNumber: accountDetails?.account_number ?? null,
                    userAccBalance: accountDetails?.current_balance ?? null,
                    customerid: customerId,
                    accountid : accountDetails.account_id
                },
            });
            }
        } catch (err) {
            console.error("handlePayNow error:", err);
        }
    };

    const handleScanPay = () => {
        console.log('Scan & Pay pressed');
        if (accountDetails) {
            router.push({
                pathname: '/scanScreen',
                params: {
                    userAccountNumber: accountDetails.account_number,
                    userAccountBalance: accountDetails.current_balance,
                }
            });
        } else {
            router.push('/scanScreen');
        }

    };

    const handleFundTransfer = () => {
        // Navigate to local transfer page with user's account info
        if (accountDetails) {
            router.push({
                pathname: '/localAccCheck',
                params: {
                    userAccountNumber: accountDetails.account_number,
                    userAccountBalance: accountDetails.current_balance,
                }
            });
        } else {
            router.push('/localAccCheck');
        }
    };

    const handleAccounts = async () => {
        console.log('Accounts pressed');
        console.log('Customer ID:', customerId);

        if (!customerId) {
            console.error('No customer ID available');
            setError('Customer ID not found. Please try logging out and back in.');
            return;
        }

        try {
            setLoading(true);
            const account = await createPOSBAccount(customerId);
            console.log('Account created successfully:', account);

            // Refresh account details after successful creation
            if (account) {
                const updatedDetails = await getAccountDetails(customerId);
                setAccountDetails(updatedDetails);
                console.log('Account details refreshed:', updatedDetails);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error creating account:', error);
            setError('Failed to create account: ' + error.message);
            setLoading(false);
        }
    };

    const handleCards = () => {
        // TODO: Add Cards application functionality
        console.log('Cards pressed');
    };

    const handleUpdateParticulars = () => {
        // Navigate to user info page
        router.push('/userinfo');
    };

    const handleChangeUserPin = () => {
        // TODO: Add Change User ID/Pin functionality
        console.log('Change User ID/Pin pressed');
    };

    const handleCloseProfile = () => {
        // TODO: Add Close Bank Profile functionality
        console.log('Close Bank Profile pressed');
    };

    return (
        <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
        >
            <View style={styles.headerLogOut}>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.header}>
                <Text style={styles.welcomeText}>Welcome Back</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
            </View>

            {/* Account Balance Card */}
            <View style={styles.balanceCard}>
                {accountDetails ? (
                    <>
                        <Text style={styles.balanceLabel}>Account Balance</Text>
                        <Text style={styles.balanceAmount}>
                            ${parseFloat(accountDetails.current_balance).toFixed(2)}
                        </Text>
                        <Text style={styles.accountNumber}>
                            {accountDetails.account_number}
                        </Text>
                    </>
                ) : (
                    <>
                        <Text style={styles.balanceLabel}>Welcome to Zentra Banking</Text>
                        <Text style={styles.noAccountMessage}>
                            You don't have an account yet
                        </Text>
                        <Text style={styles.noAccountSubtext}>
                            Create your first account to start banking with us
                        </Text>
                        <TouchableOpacity
                            style={styles.createAccountButton}
                            onPress={handleAccounts}
                        >
                            <Text style={styles.createAccountButtonText}>Create Account</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Quick Actions Card */}
            <View style={styles.actionsCard}>
                <Text style={styles.actionsTitle}>Quick Actions</Text>
                <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={handlePayNow}>
                    <View style={styles.actionIconPlaceholder}>
                    <Text style={styles.actionIconText}>💳</Text>
                    </View>
                    <Text style={styles.actionText}>PayNow</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleScanPay}>
                    <View style={styles.actionIconPlaceholder}>
                    <Text style={styles.actionIconText}>📱</Text>
                    </View>
                    <Text style={styles.actionText}>Scan & Pay</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleFundTransfer}>
                    <View style={styles.actionIconPlaceholder}>
                    <Text style={styles.actionIconText}>💸</Text>
                    </View>
                    <Text style={styles.actionText}>Fund Transfer</Text>
                </TouchableOpacity>
                </View>
            </View>

            {/* Apply Card */}
            <View style={styles.actionsCard}>
                <Text style={styles.actionsTitle}>Apply</Text>
                <View style={styles.applyContainer}>
                <TouchableOpacity style={styles.applyButton} onPress={handleAccounts}>
                    <View style={styles.actionIconPlaceholder}>
                    <Text style={styles.actionIconText}>🏦</Text>
                    </View>
                    <Text style={styles.actionText}>Accounts</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.applyButton} onPress={handleCards}>
                    <View style={styles.actionIconPlaceholder}>
                    <Text style={styles.actionIconText}>💳</Text>
                    </View>
                    <Text style={styles.actionText}>Cards</Text>
                </TouchableOpacity>
                </View>
            </View>

            {/* Profile Card */}
            <View style={styles.actionsCard}>
                <Text style={styles.actionsTitle}>Profile</Text>
                <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={handleUpdateParticulars}>
                    <View style={styles.actionIconPlaceholder}>
                    <Text style={styles.actionIconText}>✏️</Text>
                    </View>
                    <Text style={styles.actionText}>Update Particulars</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleChangeUserPin}>
                    <View style={styles.actionIconPlaceholder}>
                    <Text style={styles.actionIconText}>🔐</Text>
                    </View>
                    <Text style={styles.actionText}>Change User ID/Pin</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleCloseProfile}>
                    <View style={styles.actionIconPlaceholder}>
                    <Text style={styles.actionIconText}>❌</Text>
                    </View>
                    <Text style={styles.actionText}>Close Bank Profile</Text>
                </TouchableOpacity>
                </View>
            </View>
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
        paddingBottom: 24, // Add bottom padding for better scrolling
    },
    headerLogOut: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    header: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1f2937',
    },
    userEmail: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#6b7280',
    },
    logoutButton: {
        padding: 8,
    },
    logoutText: {
        fontSize: 16,
        color: '#ef4444',
        fontWeight: '500',
    },
    balanceCard: {
        backgroundColor: '#ffffff',
        marginHorizontal: 24,
        marginTop: 20,
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
        width: 0,
        height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    balanceLabel: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    accountNumber: {
        fontSize: 14,
        color: '#9ca3af',
    },
    noAccountMessage: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    noAccountSubtext: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 16,
    },
    createAccountButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
    },
    createAccountButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    actionsCard: {
        backgroundColor: '#ffffff',
        marginHorizontal: 24,
        marginTop: 20,
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
        width: 0,
        height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    actionsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 20,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    applyContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    actionButton: {
        alignItems: 'center',
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 8,
    },
    applyButton: {
        alignItems: 'center',
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 16,
        maxWidth: '45%',
    },
    actionIconPlaceholder: { // Makes it consistent across buttons
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionIconText: {
        fontSize: 20,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        textAlign: 'center',
    },
});
