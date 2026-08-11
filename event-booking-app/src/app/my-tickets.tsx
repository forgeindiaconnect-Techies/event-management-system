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
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../context/ThemeContext';

const BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

export default function MyTicketsScreen() {
  const { isDarkMode, colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadMyTickets();
    }, [])
  );

  const loadMyTickets = async () => {
    setLoading(true);
    try {
      const savedTicketsStr = await SecureStore.getItemAsync('my_tickets');
      if (!savedTicketsStr) {
        setTickets([]);
        setLoading(false);
        return;
      }

      const registrationIds = JSON.parse(savedTicketsStr);
      if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
        setTickets([]);
        setLoading(false);
        return;
      }

      // Fetch details for all registration IDs
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

      // Sort by start date
      fetchedTickets.sort((a, b) => {
        const dateA = new Date(a.data?.event?.startDateTime || 0).getTime();
        const dateB = new Date(b.data?.event?.startDateTime || 0).getTime();
        return dateB - dateA;
      });

      setTickets(fetchedTickets);
    } catch (error) {
      console.log('Error loading tickets from local storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/home'); } }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Tickets</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading your tickets...</Text>
        </View>
      ) : tickets.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="ticket-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Tickets Found</Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>
            When you register for events, your tickets will appear here.
          </Text>
          <TouchableOpacity style={[styles.exploreBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/explore')}>
            <Text style={styles.exploreBtnText}>Explore Events</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {tickets.map((ticketObj, index) => {
            const event = ticketObj.data?.event;
            const bannerUrl = event?.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop';
            
            return (
              <TouchableOpacity 
                key={`${ticketObj.registrationId}-${index}`} 
                style={[styles.ticketCard, { backgroundColor: colors.card }]}
                onPress={() => router.push({ pathname: '/ticket', params: { registrationId: ticketObj.registrationId } })}
              >
                <ImageBackground 
                  source={{ uri: bannerUrl }} 
                  style={styles.cardImage}
                  imageStyle={{ borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }}
                />
                
                <View style={styles.cardInfo}>
                  <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
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
                    <Text style={[styles.detailText, { color: colors.textMuted }]} numberOfLines={1}>
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
    paddingVertical: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  exploreBtn: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  exploreBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardImage: {
    width: 100,
    height: '100%',
  },
  cardInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
