import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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

const BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

const CATEGORIES = [
  { label: 'All Events', icon: 'apps-outline', keywords: [] },
  { label: 'Education', icon: 'school-outline', keywords: ['education', 'college', 'seminar', 'workshop', 'symposium', 'webinar', 'conference'] },
  { label: 'Technology', icon: 'laptop-outline', keywords: ['technology', 'tech', 'hackathon', 'coding', 'software', 'ai', 'startup'] },
  { label: 'Business', icon: 'briefcase-outline', keywords: ['business', 'corporate', 'career', 'networking', 'exhibition'] },
  { label: 'Health', icon: 'fitness-outline', keywords: ['health', 'medical', 'fitness', 'wellness', 'yoga', 'marathon'] },
  { label: 'Music', icon: 'musical-notes-outline', keywords: ['music', 'concert', 'festival', 'dj', 'dance', 'cultural', 'entertainment'] },
  { label: 'Sports', icon: 'trophy-outline', keywords: ['sport', 'tournament', 'championship', 'game'] },
  { label: 'Community', icon: 'people-outline', keywords: ['community', 'charity', 'social', 'meetup'] },
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
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Events');

  useEffect(() => {
    fetch(`${BASE_URL}/events/public/status/PUBLISHED`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEvents(data);
        else if (data?.events) setEvents(data.events);
      })
      .catch((err) => console.log('Failed to load events:', err))
      .finally(() => setLoading(false));
  }, []);

  const currentCategory = CATEGORIES.find((c) => c.label === activeCategory)!;

  const filteredEvents = events.filter((e) => {
    const matchesCategory = eventMatchesCategory(e, currentCategory);
    const matchesSearch =
      !search ||
      (e.eventName || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.venue || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.eventType || '').toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fe" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Events</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events, venues..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesRow}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.label;
          return (
            <TouchableOpacity
              key={cat.label}
              style={[styles.categoryChip, isActive && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat.label)}
            >
              <Ionicons
                name={cat.icon as any}
                size={14}
                color={isActive ? '#fff' : '#6b7280'}
              />
              <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results Count */}
      {!loading && (
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      {/* Events List */}
      {loading ? (
        <ActivityIndicator size="large" color="#6b3ce4" style={{ marginTop: 60 }} />
      ) : filteredEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={56} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No events found</Text>
          <Text style={styles.emptyText}>Try a different search or category.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredEvents.map((event) => {
            const isPaid = event.paid;
            const price = isPaid
              ? `₹${Number(event.ticketPrice || 0).toLocaleString('en-IN')}`
              : 'Free';
            const isOnline = event.eventMode === 'VIRTUAL';

            return (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onPress={() => router.push({ pathname: '/event-detail', params: { id: event.id } })}
                activeOpacity={0.92}
              >
                {event.bannerUrl ? (
                  <Image source={{ uri: event.bannerUrl }} style={styles.cardImage} />
                ) : (
                  <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
                )}
                <View style={styles.cardOverlay} />

                {/* Price badge */}
                <View style={[styles.priceBadge, isPaid ? styles.pricePaid : styles.priceFree]}>
                  <Text style={styles.priceBadgeText}>{price}</Text>
                </View>

                {/* Mode badge */}
                {event.eventMode && (
                  <View style={styles.modeBadge}>
                    <Ionicons
                      name={isOnline ? 'globe-outline' : 'location-outline'}
                      size={11}
                      color="#fff"
                    />
                    <Text style={styles.modeBadgeText}>{formatMode(event.eventMode)}</Text>
                  </View>
                )}

                <View style={styles.cardContent}>
                  {event.eventType && (
                    <View style={styles.typePill}>
                      <Text style={styles.typePillText}>{event.eventType}</Text>
                    </View>
                  )}
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {event.eventName || 'Untitled Event'}
                  </Text>
                  <View style={styles.cardMeta}>
                    <View style={styles.cardMetaItem}>
                      <Ionicons name="calendar-outline" size={13} color="#a5b4fc" />
                      <Text style={styles.cardMetaText}>{formatDate(event.startDateTime)}</Text>
                    </View>
                    <View style={styles.cardMetaItem}>
                      <Ionicons name="location-outline" size={13} color="#a5b4fc" />
                      <Text style={styles.cardMetaText} numberOfLines={1}>
                        {isOnline ? 'Online' : event.venue || 'Venue TBA'}
                      </Text>
                    </View>
                    {event.availableSeats !== undefined && (
                      <View style={styles.cardMetaItem}>
                        <Ionicons name="people-outline" size={13} color="#a5b4fc" />
                        <Text style={styles.cardMetaText}>
                          {event.availableSeats} seats left
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Ionicons name="arrow-forward" size={16} color="#a78bfa" />
                </View>
              </TouchableOpacity>
            );
          })}
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
  categoriesRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryChipActive: {
    backgroundColor: '#6b3ce4',
    borderColor: '#6b3ce4',
  },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  categoryChipTextActive: { color: '#fff' },
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
  eventCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1e1b4b',
    marginBottom: 20,
    shadowColor: '#6b3ce4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 5, 40, 0.65)',
    height: 200,
  },
  priceBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  priceFree: { backgroundColor: 'rgba(16, 185, 129, 0.85)' },
  pricePaid: { backgroundColor: 'rgba(124, 58, 237, 0.85)' },
  priceBadgeText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  modeBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  modeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardContent: {
    position: 'absolute',
    bottom: 56,
    left: 0,
    right: 0,
    padding: 18,
  },
  typePill: {
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 8,
  },
  typePillText: { color: '#c4b5fd', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  cardTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 10,
  },
  cardMeta: { gap: 5 },
  cardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMetaText: { color: '#c7d2fe', fontSize: 13, fontWeight: '500', flex: 1 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  viewDetailsText: { color: '#a78bfa', fontWeight: '700', fontSize: 14 },
  cardImagePlaceholder: {
    backgroundColor: '#1e1b4b',
  },
});
