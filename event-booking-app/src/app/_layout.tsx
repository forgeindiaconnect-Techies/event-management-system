import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="home" />
      <Stack.Screen name="explore" />
      <Stack.Screen name="event-detail" />
    </Stack>
  );
}
