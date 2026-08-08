import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';

// Exactly matching the webapp's EVENT_CATEGORIES
const CATEGORIES = [
  { label: 'All Events',           icon: 'apps-outline',           keywords: [] },
  { label: 'Education',            icon: 'school-outline',         keywords: ['education', 'college fest', 'seminar', 'workshop', 'symposium', 'webinar', 'conference'] },
  { label: 'Technology & Startup', icon: 'laptop-outline',         keywords: ['technology', 'technical', 'tech', 'hackathon', 'coding', 'software', 'ai', 'startup', 'product launch'] },
  { label: 'Business & Career',    icon: 'briefcase-outline',      keywords: ['business', 'corporate', 'career', 'job fair', 'career fair', 'placement', 'training', 'networking', 'alumni', 'exhibition', 'expo'] },
  { label: 'Health & Fitness',     icon: 'fitness-outline',        keywords: ['health', 'medical', 'fitness', 'wellness', 'yoga', 'marathon', 'cycling', 'zumba', 'gym', 'blood donation'] },
  { label: 'Food & Lifestyle',     icon: 'restaurant-outline',     keywords: ['food', 'cooking', 'restaurant', 'catering', 'lifestyle'] },
  { label: 'Music & Entertainment',icon: 'musical-notes-outline',  keywords: ['music', 'concert', 'festival', 'dj', 'dance', 'comedy', 'film', 'movie', 'show', 'cultural', 'entertainment'] },
  { label: 'Sports',               icon: 'trophy-outline',         keywords: ['sport', 'physical', 'tournament', 'championship', 'game'] },
  { label: 'Community & Social',   icon: 'people-outline',         keywords: ['community', 'public awareness', 'charity', 'donation', 'social', 'meetup'] },
];

function eventMatchesCategory(event: any, category: typeof CATEGORIES[0]) {
  if (category.label === 'All Events') return true;
  const text = `${event.eventType || ''} ${event.eventName || ''}`.toLowerCase();
  return category.keywords.some((kw) => text.includes(kw));
}

export default function LandingScreen() {
  const [activeCategory, setActiveCategory] = useState('All Events');
  const [searchQuery, setSearchQuery] = useState('');

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<string>('Locating...');
  const [userCity, setUserCity] = useState<string>('');

  useEffect(() => {
    // Fetch Location
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setUserLocation('Location permission denied');
          return;
        }
        let loc = await Location.getCurrentPositionAsync({});
        let address = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (address && address.length > 0) {
          const city = address[0].city || address[0].region || '';
          setUserCity(city);
          setUserLocation(city || 'Unknown Location');
        } else {
          setUserLocation('Location found');
        }
      } catch (error) {
        console.log('Error fetching location:', error);
        setUserLocation('Location unavailable');
      }
    })();

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

  // Map raw API events to UI shape — keep createdAt & startDateTime for sorting
  const parsedEvents = useMemo(() => events.map(e => ({
    id: e.id?.toString() || '',
    title: e.eventName || 'Untitled Event',
    date: e.startDateTime
      ? new Date(e.startDateTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Upcoming',
    price: e.paid ? `₹${Number(e.ticketPrice || 0).toLocaleString('en-IN')}` : 'Free',
    location: e.venue || (e.eventMode === 'VIRTUAL' ? 'Online' : 'Venue TBA'),
    image: e.bannerUrl || null,
    eventType: e.eventType || '',
    eventName: e.eventName || '',
    // Raw timestamps for sorting
    createdAt: e.createdAt ? new Date(e.createdAt).getTime() : 0,
    startDateTimeRaw: e.startDateTime ? new Date(e.startDateTime).getTime() : Infinity,
  })), [events]);

  // Apply category filter (same keyword logic as webapp)
  const currentCategory = CATEGORIES.find(c => c.label === activeCategory) ?? CATEGORIES[0];
  let filteredEvents = parsedEvents.filter(e => eventMatchesCategory(e, currentCategory));

  // Apply search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredEvents = filteredEvents.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) ||
      e.eventType.toLowerCase().includes(q)
    );
  }

  // Featured: 3 most recently published (newest createdAt first)
  const sortedByNewest = [...filteredEvents].sort((a, b) => b.createdAt - a.createdAt);
  const featuredIds = new Set(sortedByNewest.slice(0, 3).map(e => e.id));

  // Local city boost: within featured, put local events first
  let featured = sortedByNewest.slice(0, 3);
  if (userCity) {
    const city = userCity.toLowerCase();
    featured = [...featured].sort((a, b) => {
      const aLocal = (a.location || '').toLowerCase().includes(city);
      const bLocal = (b.location || '').toLowerCase().includes(city);
      if (aLocal && !bLocal) return -1;
      if (!aLocal && bLocal) return 1;
      return 0;
    });
  }

  // Upcoming: remaining events sorted by soonest startDateTime
  let upcoming = filteredEvents
    .filter(e => !featuredIds.has(e.id))
    .sort((a, b) => a.startDateTimeRaw - b.startDateTimeRaw);

  // Local city boost for upcoming too
  if (userCity) {
    const city = userCity.toLowerCase();
    upcoming = [...upcoming].sort((a, b) => {
      const aLocal = (a.location || '').toLowerCase().includes(city);
      const bLocal = (b.location || '').toLowerCase().includes(city);
      if (aLocal && !bLocal) return -1;
      if (!aLocal && bLocal) return 1;
      return 0;
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fe" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, Alex 👋</Text>
            <Text style={styles.headerTitle}>Find Amazing Events</Text>
            <View style={styles.userLocationRow}>
              <Ionicons name="location" size={14} color="#6b3ce4" />
              <Text style={styles.userLocationText}>{userLocation}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileBtn}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop' }} 
              style={styles.profileImg} 
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#a0a5ba" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search for events, venues..."
            placeholderTextColor="#a0a5ba"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.label;
            return (
              <TouchableOpacity 
                key={cat.label} 
                style={[styles.categoryBtn, isActive && styles.categoryBtnActive]}
                onPress={() => setActiveCategory(cat.label)}
              >
                <Ionicons 
                  name={cat.icon as any} 
                  size={18} 
                  color={isActive ? '#ffffff' : '#6b7280'} 
                  style={styles.categoryIcon} 
                />
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color="#6b3ce4" style={{ marginTop: 40 }} />
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={52} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptySubtitle}>
              {events.length === 0
                ? 'No published events available right now.'
                : `No events match "${activeCategory}".`}
            </Text>
          </View>
        ) : (
          <>
            {/* Featured Events */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured</Text>
              <TouchableOpacity onPress={() => router.push('/explore')}><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.featuredContainer}
              decelerationRate="fast"
              snapToInterval={296}
            >
              {featured.map(event => (
                <TouchableOpacity key={event.id} style={styles.featuredCard} onPress={() => router.push({ pathname: '/event-detail', params: { id: event.id } })}>
                  {event.image ? (
                    <Image source={{ uri: event.image }} style={styles.featuredImage} />
                  ) : (
                    <View style={[styles.featuredImage, styles.featuredImagePlaceholder]} />
                  )}
                  <View style={styles.featuredOverlay} />
                  <View style={styles.priceTag}>
                    <Text style={styles.priceTagText}>{event.price}</Text>
                  </View>
                  <View style={styles.featuredContent}>
                    <Text style={styles.featuredDate}>{event.date}</Text>
                    <Text style={styles.featuredTitle} numberOfLines={2}>{event.title}</Text>
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={14} color="#e2e8f0" />
                      <Text style={styles.locationText}>{event.location}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Upcoming Events */}
            {upcoming.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Upcoming Events</Text>
                  <TouchableOpacity onPress={() => router.push('/explore')}><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
                </View>

                <View style={styles.upcomingContainer}>
                  {upcoming.map(event => (
                    <TouchableOpacity key={event.id} style={styles.upcomingCard} onPress={() => router.push({ pathname: '/event-detail', params: { id: event.id } })}>
                      {event.image ? (
                        <Image source={{ uri: event.image }} style={styles.upcomingImage} />
                      ) : (
                        <View style={[styles.upcomingImage, styles.upcomingImagePlaceholder]} />
                      )}
                      <View style={styles.upcomingContent}>
                        <Text style={styles.upcomingDate}>{event.date}</Text>
                        <Text style={styles.upcomingTitle} numberOfLines={1}>{event.title}</Text>
                        <Text style={styles.upcomingPrice}>{event.price}</Text>
                      </View>
                      <TouchableOpacity style={styles.bookmarkBtn}>
                        <Ionicons name="bookmark-outline" size={20} color="#6b3ce4" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fe',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  userLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  userLocationText: {
    fontSize: 13,
    color: '#6b3ce4',
    marginLeft: 4,
    fontWeight: '500',
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  profileImg: {
    width: '100%',
    height: '100%',
  },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    height: 52,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingLeft: 44,
    paddingRight: 16,
    fontSize: 15,
    color: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  searchIcon: {
    position: 'absolute',
    left: 36,
    zIndex: 1,
  },
  filterBtn: {
    width: 52,
    height: 52,
    backgroundColor: '#6b3ce4',
    borderRadius: 16,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6b3ce4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  categoryBtnActive: {
    backgroundColor: '#6b3ce4',
    borderColor: '#6b3ce4',
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryTextActive: {
    color: '#ffffff',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#6b3ce4',
    fontWeight: '600',
  },

  featuredContainer: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 32,
  },
  featuredCard: {
    width: 280,
    height: 340,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  priceTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceTagText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6b3ce4',
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 40,
  },
  featuredDate: {
    color: '#a5b4fc',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  featuredTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 30,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#e2e8f0',
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '500',
  },

  upcomingContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  upcomingCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  upcomingImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  upcomingContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  upcomingDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b3ce4',
    marginBottom: 4,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  upcomingPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  bookmarkBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  featuredImagePlaceholder: {
    backgroundColor: '#1e1b4b',
  },
  upcomingImagePlaceholder: {
    backgroundColor: '#e5e7eb',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
