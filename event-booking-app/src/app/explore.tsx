import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  ImageBackground,
} from 'react-native';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';

const BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

const CATEGORIES = [
  { label: 'All Events',           icon: 'apps-outline',           keywords: [] },
  { label: 'Education',            icon: 'school-outline',         keywords: ['education', 'college fest', 'seminar', 'workshop', 'symposium', 'webinar', 'conference'] },
  { label: 'Technology & Start up', icon: 'laptop-outline',         keywords: ['technology', 'technical', 'tech', 'hackathon', 'coding', 'software', 'ai', 'startup', 'product launch'] },
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
  return category.keywords.some((k) => text.includes(k));
}

function formatDate(dateTime: string | null) {
  if (!dateTime) return 'Date TBA';
  return new Date(dateTime).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatMode(mode: string) {
  if (!mode) return '';
  return mode.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function ExploreScreen() {
  const { likedEvents, toggleLike } = useWishlist();
  const { isDarkMode, colors } = useTheme();
  
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Events');

  useEffect(() => {
    fetch(`${BASE_URL}/events/public/status/PUBLISHED`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setEvents(data);
        else if (data?.events) setEvents(data.events);
      })
      .catch((err) => console.log('Failed to load events:', err))
      .finally(() => setLoading(false));
  }, []);

  const currentCategory = CATEGORIES.find((c) => c.label === activeCategory)!;

  let filteredEvents = events.filter((e) => {
    const endDateTimeRaw = e.endDateTime ? new Date(e.endDateTime).getTime() : Infinity;
    const status = e.status || "PUBLISHED";
    if (endDateTimeRaw < Date.now() || status === "COMPLETED") return false;

    const matchesCategory = eventMatchesCategory(e, currentCategory);
    const matchesSearch =
      !search ||
      (e.eventName || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.venue || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.eventType || '').toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  const isRegistrationClosed = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline).getTime() < Date.now();
  };

  filteredEvents.sort((a, b) => {
    const aClosed = isRegistrationClosed(a.registrationDeadline);
    const bClosed = isRegistrationClosed(b.registrationDeadline);

    // Push closed registrations to the end
    if (aClosed && !bClosed) return 1;
    if (!aClosed && bClosed) return -1;

    // Sort remaining events by furthest in the future (many days to run)
    const aTime = new Date(a.startDateTime || 0).getTime();
    const bTime = new Date(b.startDateTime || 0).getTime();
    return bTime - aTime;
  });
  
  // Group into rows of 10
  const eventRows: any[][] = [];
  for (let i = 0; i < filteredEvents.length; i += 10) {
    eventRows.push(filteredEvents.slice(i, i + 10));
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/home'); } }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>All Events</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search events, venues..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <View style={{ paddingBottom: 16 }}>
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
                style={[styles.categoryBtn, { backgroundColor: isDarkMode ? colors.card : '#E9EAEC' }, isActive && styles.categoryBtnActive]}
                onPress={() => setActiveCategory(cat.label)}
              >
                <View style={[styles.categoryIconWrap, { backgroundColor: isDarkMode ? colors.surface : '#FFFFFF' }]}>
                  <Ionicons name={cat.icon as any} size={16} color={isActive ? (isDarkMode ? '#FFFFFF' : '#2C2636') : colors.icon} />
                </View>
                <Text style={[styles.categoryText, { color: colors.text }, isActive && styles.categoryTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results Count */}
      {!loading && (
        <View style={styles.resultsRow}>
          <Text style={[styles.resultsText, { color: colors.textMuted }]}>
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      {/* Events List */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      ) : filteredEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={56} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No events found</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Try a different search or category.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {eventRows.map((row, rowIndex) => (
            <ScrollView 
              key={`row-${rowIndex}`} 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingHorizontal: 20, gap: 16, marginBottom: 24 }}
            >
              {row.map((e) => {
                const isPaid = e.paid;
                const price = isPaid ? `₹${Number(e.ticketPrice || 0).toLocaleString('en-IN')}` : 'Free';
                const dateStr = formatDate(e.startDateTime);
                const locationStr = e.eventMode === 'VIRTUAL' ? 'Online' : e.venue || 'Venue TBA';
                const imageUrl = e.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop';
                const id = e.id?.toString() || '';
                const title = e.eventName || 'Untitled Event';

                return (
                  <TouchableOpacity key={id} style={[styles.trendingCard, { backgroundColor: colors.card }]} onPress={() => router.push({ pathname: '/event-detail', params: { id } })}>
                    <ImageBackground 
                      source={{ uri: imageUrl }} 
                      style={styles.trendingImage}
                      imageStyle={{ borderRadius: 20 }}
                    >
                      <TouchableOpacity style={styles.bookmarkBadge} onPress={() => toggleLike(id)}>
                        <Ionicons name={likedEvents.has(id) ? "heart" : "heart-outline"} size={16} color={likedEvents.has(id) ? "#FF0000" : "#FFF"} />
                      </TouchableOpacity>
                      
                      <View style={[styles.trendingInfoBox, { backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)' }]}>
                        <Text style={[styles.trendingTitle, { color: colors.text }]} numberOfLines={2}>{title}</Text>
                        <View style={styles.trendingDetailsRow}>
                          <View style={styles.trendingDetailItem}>
                            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                            <Text style={[styles.trendingDetailText, { color: colors.textMuted }]}>{dateStr}</Text>
                          </View>
                          <View style={[styles.trendingDetailItem, { flex: 1 }]}>
                            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                            <Text style={[styles.trendingDetailText, { color: colors.textMuted, flexShrink: 1 }]} numberOfLines={1}>{locationStr}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.trendingActionRow}>
                          <Text style={[styles.trendingPrice, { color: colors.text }]} numberOfLines={1}>{price}</Text>
                          <TouchableOpacity 
                            style={styles.bookNowBtn}
                            onPress={() => router.push({ pathname: '/event-detail', params: { id } })}
                          >
                            <Text style={styles.bookNowBtnText}>Book Now</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fe',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  clearBtn: { paddingLeft: 8 },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9EAEC',
    paddingLeft: 6,
    paddingRight: 16,
    borderRadius: 24,
    height: 44,
  },
  categoryBtnActive: {
    backgroundColor: '#7931ED',
  },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#2C2636',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#E2E2E2',
  },
  resultsRow: {
    paddingHorizontal: 22,
    paddingBottom: 10,
  },
  resultsText: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#9ca3af', marginTop: 6 },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  trendingCard: {
    width: 289,
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
  }
});
