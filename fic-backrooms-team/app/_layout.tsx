import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SessionProvider, useSession } from './session';

function RootLayoutNav() {
  const { session, isLoading } = useSession();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inProtectedGroup = segments[0] === '(tabs)';
    
    if (!session && inProtectedGroup) {
      // Redirect to the login page.
      router.replace('/login');
    } else if (session && (!segments[0] || segments[0] === 'login' || segments[0] === 'signup')) {
      // Redirect away from the login/signup page to (tabs).
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      <Stack.Screen name="profile" options={{ title: 'My Profile' }} />
      <Stack.Screen name="invite-organizer" options={{ title: 'Invite Organizer' }} />
      <Stack.Screen name="invite-staff" options={{ title: 'Invite Staff' }} />
      <Stack.Screen name="create-event" options={{ title: 'Create Event' }} />
      <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Stack.Screen name="reports" options={{ title: 'Reports' }} />
      <Stack.Screen name="attendees" options={{ title: 'Attendees' }} />
      <Stack.Screen name="attendance" options={{ title: 'Attendance' }} />
      <Stack.Screen name="tickets" options={{ title: 'Scan Tickets' }} />
      <Stack.Screen name="certificates" options={{ title: 'Certificates' }} />
      <Stack.Screen name="help" options={{ title: 'Help' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="team-assignment" options={{ title: 'Team Assignment' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SessionProvider>
        <RootLayoutNav />
        <StatusBar style="light" />
      </SessionProvider>
    </GestureHandlerRootView>
  );
}
