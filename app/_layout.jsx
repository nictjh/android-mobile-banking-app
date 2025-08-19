import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Simple authentication protection
  useEffect(() => {
    if (isLoading) return;

    const currentRoute = segments[0];
    const protectedRoutes = ['home', 'userinfo', 'localAccCheck', 'scanScreen'];

    if (!isAuthenticated && protectedRoutes.includes(currentRoute)) {
      router.replace('/');
    } else if (isAuthenticated && (currentRoute === 'index' || !currentRoute)) {
      router.replace('/home');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return null; // Or a loading screen component
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="signup"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name="home"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />

      <Stack.Screen
        name="userinfo"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="localAccCheck"
        options={{
          headerShown: false,
          gestureEnabled: false, // Disable swipe back gesture
        }}
      />

        <Stack.Screen
            name="scanScreen"
            options={{
                headerShown: false,
                gestureEnabled: false, // Disable swipe back gesture
            }}
        />

    </Stack>
  );
}
