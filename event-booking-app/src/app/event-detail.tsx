import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Linking,
} from 'react-native';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';

const BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

const TABS = ['Overview', 'Details'];

function formatDate(dateTime: string | null) {
  if (!dateTime) return 'To be announced';
  return new Date(dateTime).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMode(mode: string) {
  if (!mode) return 'Not specified';
  return mode.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

function isRegistrationClosed(deadline: string | null) {
  if (!deadline) return false;
  const d = new Date(deadline);
  return !isNaN(d.getTime()) && new Date() >= d;
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function DetailTile({ icon, label, value }: { icon: any; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.detailTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <View style={{ marginTop: 8 }}>
        <Text style={[styles.detailTileLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.detailTileValue, { color: colors.text }]}>{value || 'Not added'}</Text>
      </View>
    </View>
  );
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { likedEvents, toggleLike } = useWishlist();
  const { colors } = useTheme();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    if (!id) return;
    fetch(`${BASE_URL}/events/public/${id}`)
      .then((res) => res.json())
      .then((data) => setEvent(data))
      .catch((err) => console.log('Error loading event:', err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textMuted, marginTop: 12 }}>Loading event...</Text>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 12 }}>Event not found</Text>
        <TouchableOpacity onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/home'); } }} style={[styles.backBtnCenter, { backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const banner = event.bannerUrl;
  const isOnline = event.eventMode === 'VIRTUAL';
  const isHybrid = event.eventMode === 'HYBRID';
  const isPaid = event.paid;
  const price = isPaid ? `₹${Number(event.ticketPrice || 0).toLocaleString('en-IN')}` : 'Free';
  const regClosed = isRegistrationClosed(event.registrationDeadline);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero Banner */}
        <View style={styles.heroContainer}>
          {banner ? (
            <Image source={{ uri: banner }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroImagePlaceholder]} />
          )}
          <View style={styles.heroOverlay} />

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/home'); } }}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Chips */}
          <View style={styles.heroChips}>
            {event.eventType && (
              <View style={styles.chip}>
                <Ionicons name="pricetag-outline" size={11} color="#fff" />
                <Text style={styles.chipText}>{event.eventType}</Text>
              </View>
            )}
            {event.eventMode && (
              <View style={styles.chip}>
                <Ionicons name={isOnline ? 'globe-outline' : 'location-outline'} size={11} color="#fff" />
                <Text style={styles.chipText}>{formatMode(event.eventMode)}</Text>
              </View>
            )}
            <View style={[styles.chip, isPaid ? styles.chipPaid : styles.chipFree]}>
              <Ionicons name="ticket-outline" size={11} color="#fff" />
              <Text style={styles.chipText}>{price}</Text>
            </View>
          </View>

          {/* Title & Meta */}
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle} numberOfLines={3}>{event.eventName || 'Event'}</Text>
            {event.description && (
              <Text style={styles.heroSummary} numberOfLines={2}>{event.description}</Text>
            )}
            <View style={styles.heroMeta}>
              <View style={styles.heroMetaItem}>
                <Ionicons name="calendar-outline" size={14} color="#a5b4fc" />
                <Text style={styles.heroMetaText}>{formatDate(event.startDateTime)}</Text>
              </View>
              <View style={styles.heroMetaItem}>
                <Ionicons name={isOnline ? 'globe-outline' : 'location-outline'} size={14} color="#a5b4fc" />
                <Text style={styles.heroMetaText}>
                  {isOnline ? 'Online event' : event.venue || 'Venue TBA'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsRow, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive, activeTab !== tab && { borderBottomColor: colors.border }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, { color: colors.textMuted }, activeTab === tab && styles.tabTextActive, activeTab === tab && { color: colors.primary }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.body}>

          {/* OVERVIEW TAB */}
          {activeTab === 'Overview' && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>About this Event</Text>
              <Text style={[styles.aboutText, { color: colors.textMuted }]}>
                {event.description || 'No description provided for this event.'}
              </Text>

              {/* Certificate badge */}
              {event.certificateEnabled && (
                <View style={styles.certBadge}>
                  <Ionicons name="ribbon-outline" size={18} color="#047857" />
                  <Text style={styles.certText}>
                    Certificate available{event.certificateTitle ? ` — ${event.certificateTitle}` : ''}
                  </Text>
                </View>
              )}

              {/* Online access note */}
              {(isOnline || isHybrid) && event.meetingLink && (
                <View style={styles.onlineBadge}>
                  <Ionicons name="globe-outline" size={18} color="#1d4ed8" />
                  <View>
                    <Text style={styles.onlineBadgeTitle}>Online access available</Text>
                    <Text style={styles.onlineBadgeSub}>Joining link is shared after registration.</Text>
                  </View>
                </View>
              )}
            </>
          )}

          {/* DETAILS TAB */}
          {activeTab === 'Details' && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Event Details</Text>
              <View style={styles.detailsGrid}>
                <DetailTile icon="pricetag-outline" label="Category" value={event.eventType} />
                <DetailTile icon="globe-outline" label="Mode" value={formatMode(event.eventMode)} />
                <DetailTile icon="calendar-outline" label="Starts" value={formatDate(event.startDateTime)} />
                <DetailTile icon="time-outline" label="Ends" value={formatDate(event.endDateTime)} />
                <DetailTile
                  icon={isOnline ? 'globe-outline' : 'location-outline'}
                  label={isOnline ? 'Access' : 'Venue'}
                  value={isOnline ? 'Online' : event.venue || 'TBA'}
                />
                <DetailTile
                  icon="people-outline"
                  label="Capacity"
                  value={event.capacity ? `${event.capacity} attendees` : 'Not specified'}
                />
                <DetailTile
                  icon="calendar-outline"
                  label="Reg. closes"
                  value={formatDate(event.registrationDeadline)}
                />
                <DetailTile icon="ticket-outline" label="Ticket" value={price} />
              </View>
            </>
          )}

          {/* BOOKING CARD */}
          <View style={[styles.bookingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.bookingEyebrow, { color: colors.textMuted }]}>REGISTRATION</Text>
            <View style={styles.bookingRow}>
              <View>
                <Text style={[styles.bookingPrice, { color: colors.text }]}>{price}</Text>
                <Text style={[styles.bookingPerAttendee, { color: colors.textMuted }]}>per attendee</Text>
              </View>
              <View style={styles.bottomActions}>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.background }]} onPress={() => toggleLike(id as string)}>
                  <Ionicons name={likedEvents.has(id as string) ? "heart" : "heart-outline"} size={22} color={likedEvents.has(id as string) ? "#ef4444" : colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Ionicons name="share-outline" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <InfoRow icon="calendar-outline" label="Starts" value={formatDate(event.startDateTime)} />
            <InfoRow icon="time-outline" label="Ends" value={formatDate(event.endDateTime)} />
            <InfoRow
              icon={isOnline ? 'globe-outline' : 'location-outline'}
              label={isOnline ? 'Location' : 'Venue'}
              value={isOnline ? 'Online' : event.venue || 'To be announced'}
            />
            {event.availableSeats !== undefined && (
              <InfoRow icon="people-outline" label="Seats left" value={`${event.availableSeats} seats`} />
            )}

            {regClosed ? (
              <View style={styles.closedBanner}>
                <Ionicons name="information-circle-outline" size={20} color="#9f1239" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.closedTitle}>Registration is closed</Text>
                  <Text style={styles.closedSub}>The registration deadline has passed.</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.registerBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push({ pathname: '/register', params: { id: event.id } })}
              >
                <Text style={styles.registerBtnText}>Register Now</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            )}

            <View style={styles.ticketNote}>
              <Ionicons name="ticket-outline" size={14} color={colors.primary} />
              <Text style={[styles.ticketNoteText, { color: colors.textMuted }]}>Ticket is generated after successful registration.</Text>
            </View>
          </View>
        </View>
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
  heroContainer: {
    height: 400,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImagePlaceholder: {
    backgroundColor: '#1e1b4b',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 7, 18, 0.62)',
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  backBtnCenter: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#ede9fe',
    borderRadius: 12,
  },
  heroChips: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 16,
    right: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    maxWidth: '70%',
    justifyContent: 'flex-end',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  chipFree: { backgroundColor: 'rgba(16,185,129,0.5)' },
  chipPaid: { backgroundColor: 'rgba(124,58,237,0.5)' },
  chipText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 28,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 8,
  },
  heroSummary: {
    color: '#e5e7eb',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  heroMeta: { gap: 8 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroMetaText: { color: '#c7d2fe', fontSize: 13, fontWeight: '500', flex: 1 },

  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#7c3aed' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  tabTextActive: { color: '#6d28d9' },

  body: {
    padding: 20,
    gap: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ecfdf5',
    padding: 14,
    borderRadius: 12,
    marginTop: 14,
  },
  certText: { color: '#047857', fontWeight: '700', fontSize: 14 },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#eff6ff',
    padding: 14,
    borderRadius: 12,
    marginTop: 14,
  },
  onlineBadgeTitle: { color: '#1d4ed8', fontWeight: '700', fontSize: 14 },
  onlineBadgeSub: { color: '#3b82f6', fontSize: 12, marginTop: 2 },

  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailTile: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5eaf2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  detailTileLabel: { color: '#9ca3af', fontSize: 12, marginBottom: 2 },
  detailTileValue: { color: '#111827', fontWeight: '700', fontSize: 14 },

  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5eaf2',
    shadowColor: '#6b3ce4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  bookingEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7c3aed',
    letterSpacing: 1,
    marginBottom: 4,
  },
  bookingPrice: {
    fontSize: 38,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -1,
  },
  bookingPerAttendee: {
    fontSize: 13,
    color: '#9ca3af',
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '700' },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  closedTitle: { color: '#9f1239', fontWeight: '700', fontSize: 14 },
  closedSub: { color: '#e11d48', fontSize: 12, marginTop: 2 },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6d28d9',
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 8,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  registerBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  ticketNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  ticketNoteText: { color: '#64748b', fontSize: 12, flex: 1, lineHeight: 16 },
});
