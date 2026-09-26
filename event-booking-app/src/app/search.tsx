import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { useWishlist } from '../context/WishlistContext';
import { smartFetch } from '../config/apiConfig';
import { fetchClassifiedMovies, MovieItem } from '../services/movieApi';

const QUICK_TAGS = [
  'All',
  'Movies',
  'Events',
  'Today',
  'Free',
  'Action',
  'Comedy',
  'Technology',
  'Workshop',
];

export default function SearchScreen() {
  const { isDarkMode, colors } = useTheme();
  const { likedEvents, toggleLike } = useWishlist();

  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<'All' | 'Movies' | 'Events' | string>('All');
  const [loading, setLoading] = useState(true);

  const [events, setEvents] = useState<any[]>([]);
  const [movies, setMovies] = useState<MovieItem[]>([]);

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Auto-focus the search bar
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    // Fetch Events & Movies
    Promise.all([
      smartFetch('/events/public/status/PUBLISHED')
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []),
      fetchClassifiedMovies()
        .then(({ nowShowing, upcoming }) => [...nowShowing, ...upcoming])
        .catch(() => []),
    ])
      .then(([eventsData, moviesData]) => {
        if (Array.isArray(eventsData)) setEvents(eventsData);
        else if (eventsData?.events) setEvents(eventsData.events);

        if (Array.isArray(moviesData)) setMovies(moviesData);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter unexpired events
  const parsedEvents = useMemo(() => {
    const now = Date.now();
    return events
      .map((e) => {
        const startRaw = e.startDateTime ? new Date(e.startDateTime).getTime() : 0;
        const endRaw = e.endDateTime
          ? new Date(e.endDateTime).getTime()
          : startRaw > 0
          ? startRaw + 4 * 3600 * 1000
          : 0;
        return {
          id: e.id?.toString() || '',
          title: e.eventName || 'Untitled Event',
          date: e.startDateTime
            ? new Date(e.startDateTime).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })
            : 'Upcoming',
          price: e.paid ? `₹${Number(e.ticketPrice || 0).toLocaleString('en-IN')}` : 'Free',
          location: e.venue || (e.eventMode === 'VIRTUAL' ? 'Online' : 'Bengaluru'),
          image: e.bannerUrl || null,
          eventType: e.eventType || '',
          startDateTimeRaw: startRaw,
          endDateTimeRaw: endRaw,
          status: e.status || 'PUBLISHED',
        };
      })
      .filter((e) => {
        // Exclude past/ran-out events
        if (
          e.status === 'COMPLETED' ||
          e.status === 'CANCELLED' ||
          e.status === 'TRASHED' ||
          e.status === 'DRAFT'
        ) {
          return false;
        }
        if (e.endDateTimeRaw > 0 && e.endDateTimeRaw <= now) return false;
        if (e.startDateTimeRaw > 0 && e.startDateTimeRaw <= now && e.endDateTimeRaw <= now)
          return false;
        return true;
      });
  }, [events]);

  // Filtered Results
  const filteredMovies = useMemo(() => {
    if (activeTag === 'Events') return [];
    let list = movies;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.genre && m.genre.toLowerCase().includes(q)) ||
          (m.language && m.language.toLowerCase().includes(q))
      );
    }
    if (activeTag !== 'All' && activeTag !== 'Movies') {
      const tagLower = activeTag.toLowerCase();
      list = list.filter(
        (m) =>
          (m.genre && m.genre.toLowerCase().includes(tagLower)) ||
          (m.language && m.language.toLowerCase().includes(tagLower))
      );
    }
    return list;
  }, [movies, query, activeTag]);

  const filteredEvents = useMemo(() => {
    if (activeTag === 'Movies') return [];
    let list = parsedEvents;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.eventType.toLowerCase().includes(q)
      );
    }
    if (activeTag === 'Free') {
      list = list.filter((e) => e.price === 'Free' || e.price === '₹0');
    } else if (activeTag === 'Today') {
      const now = Date.now();
      const endOfDay = now + 86400000;
      list = list.filter((e) => e.startDateTimeRaw >= now && e.startDateTimeRaw <= endOfDay);
    } else if (activeTag !== 'All' && activeTag !== 'Events') {
      const tagLower = activeTag.toLowerCase();
      list = list.filter(
        (e) =>
          e.eventType.toLowerCase().includes(tagLower) ||
          e.title.toLowerCase().includes(tagLower)
      );
    }
    return list;
  }, [parsedEvents, query, activeTag]);

  const totalResults = filteredMovies.length + filteredEvents.length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* SEARCH HEADER */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search movies, events, shows, genres..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* QUICK FILTER TAGS */}
      <View style={styles.tagsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsContainer}
        >
          {QUICK_TAGS.map((tag) => {
            const isSelected = activeTag === tag;
            return (
              <TouchableOpacity
                key={tag}
                onPress={() => setActiveTag(tag)}
                style={[
                  styles.tagBtn,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    { color: isSelected ? '#FFF' : colors.text },
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* SEARCH CONTENT */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Searching database...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Results Summary */}
          <View style={styles.resultsHeader}>
            <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
              {query.trim()
                ? `Found ${totalResults} result${totalResults === 1 ? '' : 's'} for "${query}"`
                : `Showing ${totalResults} available entertainment options`}
            </Text>
          </View>

          {/* NO RESULTS EMPTY STATE */}
          {totalResults === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={56} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Matches Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                We couldn't find anything matching your search. Try checking your spelling or selecting another filter.
              </Text>
            </View>
          )}

          {/* MOVIES SECTION */}
          {filteredMovies.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="film-outline" size={18} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Movies ({filteredMovies.length})
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {filteredMovies.map((movie) => (
                  <TouchableOpacity
                    key={`movie-${movie.id}`}
                    style={[styles.movieCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push({
                        pathname: '/movie-detail',
                        params: { id: movie.id.toString() },
                      })
                    }
                  >
                    <ImageBackground
                      source={{
                        uri:
                          movie.posterUrl ||
                          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop',
                      }}
                      style={styles.moviePoster}
                      imageStyle={{ borderRadius: 12 }}
                    >
                      {movie.rating ? (
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={11} color="#FFB900" />
                          <Text style={styles.ratingText}>{movie.rating.toFixed(1)}</Text>
                        </View>
                      ) : null}
                    </ImageBackground>

                    <Text style={[styles.movieTitle, { color: colors.text }]} numberOfLines={1}>
                      {movie.title}
                    </Text>

                    <Text style={[styles.movieGenre, { color: colors.textMuted }]} numberOfLines={1}>
                      {movie.genre || movie.language || 'Cinema'}
                    </Text>

                    <TouchableOpacity
                      style={[styles.bookBtnSmall, { backgroundColor: colors.primary }]}
                      onPress={() =>
                        router.push({
                          pathname: '/movie-showtimes',
                          params: { id: movie.id.toString() },
                        })
                      }
                    >
                      <Text style={styles.bookBtnSmallText}>Book</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* EVENTS SECTION */}
          {filteredEvents.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Events ({filteredEvents.length})
                  </Text>
                </View>
              </View>

              <View style={styles.eventsGrid}>
                {filteredEvents.map((event) => (
                  <TouchableOpacity
                    key={`event-${event.id}`}
                    style={[styles.eventRowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push({
                        pathname: '/event-detail',
                        params: { id: event.id },
                      })
                    }
                  >
                    <ImageBackground
                      source={{
                        uri:
                          event.image ||
                          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop',
                      }}
                      style={styles.eventThumb}
                      imageStyle={{ borderRadius: 10 }}
                    />

                    <View style={styles.eventRowContent}>
                      <Text style={[styles.eventRowTitle, { color: colors.text }]} numberOfLines={2}>
                        {event.title}
                      </Text>

                      <View style={styles.eventRowMeta}>
                        <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                        <Text style={[styles.eventRowMetaText, { color: colors.textMuted }]}>
                          {event.date}
                        </Text>
                        <Text style={{ color: colors.textMuted }}>•</Text>
                        <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                        <Text
                          style={[styles.eventRowMetaText, { color: colors.textMuted }]}
                          numberOfLines={1}
                        >
                          {event.location}
                        </Text>
                      </View>

                      <View style={styles.eventRowBottom}>
                        <Text style={[styles.eventPrice, { color: colors.primary }]}>
                          {event.price}
                        </Text>
                        <View style={[styles.viewDetailsBtn, { borderColor: colors.primary }]}>
                          <Text style={[styles.viewDetailsText, { color: colors.primary }]}>
                            View Pass
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      {/* FLOATING BOTTOM NAVIGATION BAR (SEARCH ACTIVE) */}
      <BlurView
        intensity={80}
        tint={isDarkMode ? 'dark' : 'light'}
        style={[
          styles.bottomNav,
          {
            backgroundColor: isDarkMode
              ? 'rgba(30, 30, 30, 0.6)'
              : 'rgba(255, 255, 255, 0.7)',
          },
        ]}
      >
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/home')}>
          <Ionicons name="home-outline" size={24} color={colors.text} />
          <Text style={[styles.navText, { color: colors.text }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="search" size={24} color={colors.primary} />
          <Text style={[styles.navText, { color: colors.primary }]}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/wishlist')}>
          <Ionicons name="heart-outline" size={24} color={colors.text} />
          <Text style={[styles.navText, { color: colors.text }]}>Wishlist</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/my-tickets')}>
          <Ionicons name="ticket-outline" size={24} color={colors.text} />
          <Text style={[styles.navText, { color: colors.text }]}>My Tickets</Text>
        </TouchableOpacity>
      </BlurView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  tagsWrapper: {
    paddingBottom: 8,
  },
  tagsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tagBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  resultsHeader: {
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  horizontalList: {
    gap: 12,
    paddingRight: 16,
  },
  movieCard: {
    width: 140,
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  moviePoster: {
    width: '100%',
    height: 180,
    marginBottom: 8,
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  movieTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  movieGenre: {
    fontSize: 11,
    marginBottom: 8,
  },
  bookBtnSmall: {
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookBtnSmallText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  eventsGrid: {
    gap: 12,
  },
  eventRowCard: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  eventThumb: {
    width: 90,
    height: 90,
  },
  eventRowContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  eventRowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  eventRowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventRowMetaText: {
    fontSize: 11,
  },
  eventRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  eventPrice: {
    fontSize: 15,
    fontWeight: '800',
  },
  viewDetailsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 35,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
