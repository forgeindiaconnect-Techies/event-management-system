import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { WishlistProvider } from '../context/WishlistContext';
import { ThemeProvider } from '../context/ThemeContext';
import { MovieBookingProvider } from '../context/MovieBookingContext';
import { registerForPushNotificationsAsync } from '../services/notificationService';

export default function Layout() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);
  return (
    <ThemeProvider>
      <WishlistProvider>
        <MovieBookingProvider>
          <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="home" />
            <Stack.Screen name="search" />
            <Stack.Screen name="explore" />
            <Stack.Screen name="event-detail" />
            <Stack.Screen name="wishlist" />
            <Stack.Screen name="movie-detail" />
            <Stack.Screen name="movie-showtimes" />
            <Stack.Screen name="movie-seat-layout" />
            <Stack.Screen name="movie-checkout" />
            <Stack.Screen name="movie-ticket" />
            <Stack.Screen name="my-tickets" />
            <Stack.Screen name="contact" />
            <Stack.Screen name="terms" />
          </Stack>
        </MovieBookingProvider>
      </WishlistProvider>
    </ThemeProvider>
  );
}
