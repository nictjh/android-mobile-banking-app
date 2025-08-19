import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserProfile } from '../lib/services/userService';

export default function UserInfo() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [customerData, setCustomerData] = useState(null);
    const [customerId, setCustomerId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserAndCustomerData = async () => {
        try {
            // Get current session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session?.user) {
                router.replace('/');
                return;
            }

            setUser(session.user);

            // Use your userService with user.id directly
            const customerData = await getUserProfile(session.user.id);

            if (customerData) {
                setCustomerData(customerData);
                setCustomerId(customerData.customer_id); // Extract customer_id from the data
            } else {
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

    if (loading) {
        return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading user information...</Text>
            </View>
        </SafeAreaView>
        );
    }

    if (error) {
        return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            </View>
        </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

            {/* Header */}
            <View style={styles.header}>
            <Text style={styles.headerTitle}>User Information</Text>
            </View>

            {/* Auth User Info Card */}
            <View style={styles.card}>
            <Text style={styles.cardTitle}>Authentication Details</Text>
            {user && (
                <>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Auth User ID:</Text>
                    <Text style={styles.value}>{user.id}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>{user.email}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Email Verified:</Text>
                    <Text style={styles.value}>{user.email_confirmed_at ? 'Yes' : 'No'}</Text>
                </View>
                </>
            )}
            </View>

            {/* Customer ID Card */}
            <View style={styles.card}>
            <Text style={styles.cardTitle}>Customer Profile</Text>
            <View style={styles.infoRow}>
                <Text style={styles.label}>Customer ID:</Text>
                <Text style={styles.valueHighlight}>{customerId || 'Not found'}</Text>
            </View>
            </View>

            {/* Customer Data Card */}
            {customerData && (
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Customer Details</Text>
                <View style={styles.infoRow}>
                <Text style={styles.label}>Legal Name:</Text>
                <Text style={styles.value}>{customerData.legal_name || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                <Text style={styles.label}>Birth Date:</Text>
                <Text style={styles.value}>{customerData.birth_date || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                <Text style={styles.label}>National ID:</Text>
                <Text style={styles.value}>{customerData.national_id_number || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                <Text style={styles.label}>Country:</Text>
                <Text style={styles.value}>{customerData.residency_country || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                <Text style={styles.label}>Customer Type:</Text>
                <Text style={styles.value}>{customerData.customer_type || 'N/A'}</Text>
                </View>
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
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#6b7280',
        marginTop: 12,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#ffffff',
        marginHorizontal: 24,
        marginTop: 16,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
        width: 0,
        height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    label: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
        flex: 1,
    },
    value: {
        fontSize: 14,
        color: '#1f2937',
        flex: 2,
        textAlign: 'right',
    },
    valueHighlight: {
        fontSize: 14,
        color: '#2563eb',
        fontWeight: '600',
        flex: 2,
        textAlign: 'right',
    },
    //   debugCard: {
    //     backgroundColor: '#f3f4f6',
    //     marginHorizontal: 24,
    //     marginTop: 16,
    //     padding: 16,
    //     borderRadius: 8,
    //     borderWidth: 1,
    //     borderColor: '#e5e7eb',
    //   },
    //   debugTitle: {
    //     fontSize: 14,
    //     fontWeight: '600',
    //     color: '#6b7280',
    //     marginBottom: 8,
    //   },
    //   debugText: {
    //     fontSize: 12,
    //     color: '#6b7280',
    //     fontFamily: 'monospace',
    //     marginBottom: 4,
    //   },
});
