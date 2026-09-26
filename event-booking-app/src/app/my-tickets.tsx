import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  ImageBackground,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getStorageItem } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';
import { getLocalMovieTickets, BookedMovieTicket } from '../services/movieApi';
import { getApiBaseUrl } from '../config/apiConfig';

export default function MyTicketsScreen() {
  const BASE_URL = getApiBaseUrl();
  const { isDarkMode, colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'events' | 'movies'>('events');
  const [loading, setLoading] = useState(true);
  const [eventTickets, setEventTickets] = useState<any[]>([]);
  const [movieTickets, setMovieTickets] = useState<BookedMovieTicket[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadAllTickets();
    }, [])
  );

  const loadAllTickets = async () => {
    setLoading(true);
    try {
      // 1. Load Event Tickets
      const savedTicketsStr = await getStorageItem('my_tickets');
      if (savedTicketsStr) {
        const registrationIds = JSON.parse(savedTicketsStr);
        if (Array.isArray(registrationIds) && registrationIds.length > 0) {
          const fetchedTickets = [];
          for (const id of registrationIds) {
            try {
              const res = await fetch(`${BASE_URL}/registrations/${id}`);
              if (res.ok) {
                const data = await res.json();
                fetchedTickets.push({ registrationId: id, data });
              }
            } catch (err) {
              console.log(`Failed to fetch reg ${id}`, err);
            }
          }
          fetchedTickets.sort((a, b) => {
            const dateA = new Date(a.data?.event?.startDateTime || 0).getTime();
            const dateB = new Date(b.data?.event?.startDateTime || 0).getTime();
            return dateB - dateA;
          });
          setEventTickets(fetchedTickets);
        } else {
          setEventTickets([]);
        }
      } else {
        setEventTickets([]);
      }

      // 2. Load Movie Tickets
      const mTickets = await getLocalMovieTickets();
      setMovieTickets(mTickets);
    } catch (error) {
      console.log('Error loading tickets from local storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/home');
            }
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Tickets</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Segmented Control: Events vs Movies */}
      <View style={[styles.segmentBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.segmentBtn,
            activeTab === 'events' && {
              backgroundColor: colors.primary,
            },
          ]}
          onPress={() => setActiveTab('events')}
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color={activeTab === 'events' ? '#FFF' : colors.textMuted}
          />
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === 'events' ? '#FFF' : colors.textMuted },
            ]}
          >
            Events ({eventTickets.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.segmentBtn,
            activeTab === 'movies' && {
              backgroundColor: colors.primary,
            },
          ]}
          onPress={() => setActiveTab('movies')}
        >
          <Ionicons
            name="film-outline"
            size={16}
            color={activeTab === 'movies' ? '#FFF' : colors.textMuted}
          />
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === 'movies' ? '#FFF' : colors.textMuted },
            ]}
          >
            Movies ({movieTickets.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading your tickets...
          </Text>
        </View>
      ) : activeTab === 'events' ? (
        /* Event Tickets List */
        eventTickets.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="ticket-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Event Tickets</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              When you register for events, your tickets will appear here.
            </Text>
            <TouchableOpacity
              style={[styles.exploreBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/search')}
            >
              <Text style={styles.exploreBtnText}>Search Events</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContainer}>
            {eventTickets.map((ticketObj, index) => {
              const event = ticketObj.data?.event;
              const bannerUrl =
                event?.bannerUrl ||
                'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop';

              return (
                <TouchableOpacity
                  key={`${ticketObj.registrationId}-${index}`}
                  style={[styles.ticketCard, { backgroundColor: colors.card }]}
                  onPress={() =>
                    router.push({
                      pathname: '/ticket',
                      params: { registrationId: ticketObj.registrationId },
                    })
                  }
                >
                  <ImageBackground
                    source={{ uri: bannerUrl }}
                    style={styles.cardImage}
                    imageStyle={{ borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }}
                  />

                  <View style={styles.cardInfo}>
                    <Text
                      style={[styles.eventTitle, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {event?.eventName || 'Untitled Event'}
                    </Text>

                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                      <Text style={[styles.detailText, { color: colors.textMuted }]}>
                        {formatDate(event?.startDateTime)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                      <Text
                        style={[styles.detailText, { color: colors.textMuted }]}
                        numberOfLines={1}
                      >
                        {event?.venue || (event?.eventMode === 'VIRTUAL' ? 'Online' : 'TBA')}
                      </Text>
                    </View>

                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.badgeText, { color: colors.primary }]}>
                          {ticketObj.data?.registrationStatus || 'CONFIRMED'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )
      ) : (
        /* Movie Tickets List */
        movieTickets.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="film-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Movie Tickets</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              When you book movie tickets, they will be stored and available here.
            </Text>
            <TouchableOpacity
              style={[styles.exploreBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.replace('/home')}
            >
              <Text style={styles.exploreBtnText}>Browse Movies</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContainer}>
            {movieTickets.map((mTicket, index) => {
              const poster =
                mTicket.posterUrl ||
                'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80';

              return (
                <TouchableOpacity
                  key={`${mTicket.ticketId}-${index}`}
                  style={[styles.ticketCard, { backgroundColor: colors.card }]}
                  onPress={() =>
                    router.push({
                      pathname: '/movie-ticket' as any,
                      params: { ticketId: mTicket.ticketId },
                    })
                  }
                >
                  <ImageBackground
                    source={{ uri: poster }}
                    style={styles.cardImage}
                    imageStyle={{ borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }}
                  />

                  <View style={styles.cardInfo}>
                    <Text
                      style={[styles.eventTitle, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {mTicket.movieTitle}
                    </Text>

                    <Text style={[styles.movieTheaterSub, { color: colors.primary }]}>
                      {mTicket.theaterName} ({mTicket.screenName})
                    </Text>

                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                      <Text style={[styles.detailText, { color: colors.textMuted }]}>
                        {mTicket.date} • {mTicket.time}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="apps-outline" size={14} color={colors.textMuted} />
                      <Text style={[styles.detailText, { color: colors.textMuted }]}>
                        Seats: {mTicket.seats.join(', ')}
                      </Text>
                    </View>

                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, { backgroundColor: '#10B98120' }]}>
                        <Text style={[styles.badgeText, { color: '#10B981' }]}>
                          CONFIRMED • ₹{mTicket.amount}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  segmentBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
    borderBottomWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  ticketCard: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  cardImage: {
    width: 100,
    height: '100%',
  },
  cardInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  movieTheaterSub: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
