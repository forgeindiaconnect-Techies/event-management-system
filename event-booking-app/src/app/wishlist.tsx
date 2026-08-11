import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';

export default function WishlistScreen() {
  const { likedEvents, toggleLike } = useWishlist();
  const { isDarkMode, colors } = useTheme();
  
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real events from API
    fetch('https://event-management-system-y9fa.onrender.com/api/events/public/status/PUBLISHED')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setEvents(data);
        else if (data && data.events) setEvents(data.events);
      })
      .catch(err => console.log('Failed to fetch events:', err))
      .finally(() => setLoading(false));
  }, []);

  const parsedEvents = useMemo(() => events.map(e => ({
    id: e.id?.toString() || '',
    title: e.eventName || 'Untitled Event',
    date: e.startDateTime
      ? new Date(e.startDateTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : 'Upcoming',
    price: e.paid ? `₹${Number(e.ticketPrice || 0).toLocaleString('en-IN')}` : 'Free',
    location: e.venue || (e.eventMode === 'VIRTUAL' ? 'Online' : 'Bengaluru'),
    image: e.bannerUrl || null,
  })), [events]);

  const wishlistEvents = parsedEvents.filter(e => likedEvents.has(e.id));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.surface }]} onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/home'); } }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Wishlist</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : wishlistEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-dislike-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Your Wishlist is Empty</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Like some events to see them here.</Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/home')}>
              <Text style={styles.exploreBtnText}>Explore Events</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {wishlistEvents.map(event => (
              <TouchableOpacity key={event.id} style={[styles.trendingCard, { backgroundColor: colors.card }]} onPress={() => router.push({ pathname: '/event-detail', params: { id: event.id } })}>
                <ImageBackground 
                  source={{ uri: event.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop' }} 
                  style={styles.trendingImage}
                  imageStyle={{ borderRadius: 20 }}
                >
                  <TouchableOpacity style={styles.bookmarkBadge} onPress={() => toggleLike(event.id)}>
                    <Ionicons name="heart" size={16} color="#FF0000" />
                  </TouchableOpacity>
                  
                  <View style={[styles.trendingInfoBox, { backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)' }]}>
                    <Text style={[styles.trendingTitle, { color: colors.text }]} numberOfLines={2}>{event.title}</Text>
                    <View style={styles.trendingDetailsRow}>
                      <View style={styles.trendingDetailItem}>
                        <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                        <Text style={[styles.trendingDetailText, { color: colors.textMuted }]}>{event.date}</Text>
                      </View>
                      <View style={styles.trendingDetailItem}>
                        <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                        <Text style={[styles.trendingDetailText, { color: colors.textMuted }]}>{event.location}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.trendingActionRow}>
                      <Text style={[styles.trendingPrice, { color: colors.text }]}>{event.price}</Text>
                      <TouchableOpacity 
                        style={styles.bookNowBtn}
                        onPress={() => router.push({ pathname: '/event-detail', params: { id: event.id } })}
                      >
                        <Text style={styles.bookNowBtnText}>Book Now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomNav, { backgroundColor: colors.surface }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/home')}>
          <Ionicons name="home-outline" size={24} color={colors.text} />
          <Text style={[styles.navText, { color: colors.text }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/explore')}>
          <Ionicons name="compass-outline" size={24} color={colors.text} />
          <Text style={[styles.navText, { color: colors.text }]}>Explore</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="heart" size={24} color={colors.primary} />
          <Text style={[styles.navText, { color: colors.primary }]}>Wishlist</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="ticket-outline" size={24} color={colors.text} />
          <Text style={[styles.navText, { color: colors.text }]}>My Tickets</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F3F6',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E9EAEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2636',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 20,
  },
  trendingCard: {
    width: '100%',
    height: 322,
    borderRadius: 20,
    backgroundColor: '#F9F7FD',
    overflow: 'hidden',
  },
  trendingImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bookmarkBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(5, 24, 97, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendingInfoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 12,
    padding: 16,
    borderRadius: 16,
  },
  trendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2636',
    marginBottom: 12,
  },
  trendingDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  trendingDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingDetailText: {
    fontSize: 14,
    color: '#837C8D',
  },
  trendingActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendingPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C2636',
  },
  bookNowBtn: {
    backgroundColor: '#7931ED',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bookNowBtnText: {
    color: '#E5E5E5',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2636',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7C848D',
    marginBottom: 30,
  },
  exploreBtn: {
    backgroundColor: '#7931ED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  exploreBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2C2636',
  },
});
