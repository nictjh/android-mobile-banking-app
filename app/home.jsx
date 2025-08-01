import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
            router.replace('/');
            }
        };

        checkSession(); // on mount

        const interval = setInterval(checkSession, 1000); // check every 1 seconds

        return () => clearInterval(interval); // cleanup
    }, []);


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
