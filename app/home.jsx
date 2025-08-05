import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            try {
            // Force Supabase to re-check the session (flush memory → disk)
            await supabase.auth.refreshSession();

            const { data, error } = await supabase.auth.getSession();
            console.log("Checking session:", data.session, error?.message);

            if (!data.session) {
                router.replace('/');
            }
            } catch (err) {
            console.error("Unexpected error during session check:", err);
            router.replace('/');
            }
        };

        checkSession(); // Initial check on mount

        const interval = setInterval(checkSession, 1000); // Aggressive check every second
        return () => clearInterval(interval); // Cleanup
    }, [router]);


  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.replace('/'); // Redirect to login page
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You have successfully logged in!</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'lightgreen', // Added line
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
});
