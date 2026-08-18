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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';

const BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

const SECTIONS = ['About', 'Gallery', 'Organizer', 'More'];

function formatDateOnly(dateTime: string | null) {
  if (!dateTime) return 'To be announced';
  return new Date(dateTime).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTimeOnly(dateTime: string | null) {
  if (!dateTime) return '';
  const timeStr = new Date(dateTime).toLocaleString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).toLowerCase();
  // Remove all types of spaces including non-breaking spaces
  return timeStr.replace(/[\s\u202F\u00A0]/g, '');
}

function formatMode(mode: string | null) {
  if (!mode) return '';
  return mode.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

function isRegistrationClosed(deadline: string | null) {
  if (!deadline) return false;
  const d = new Date(deadline);
  return !isNaN(d.getTime()) && new Date() >= d;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { likedEvents, toggleLike } = useWishlist();
  const { colors, isDarkMode } = useTheme();
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('About');

  useEffect(() => {
    if (!id) return;
    fetch(`${BASE_URL}/events/public/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
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
  const isPaid = event.paid;
  const price = isPaid ? `₹${Number(event.ticketPrice || 0).toLocaleString('en-IN')}` : 'Free';
  const regClosed = isRegistrationClosed(event.registrationDeadline);
  
  const startTimeStr = formatTimeOnly(event.startDateTime);
  const endTimeStr = formatTimeOnly(event.endDateTime);
  const timeDisplay = endTimeStr ? `${startTimeStr} - ${endTimeStr}` : startTimeStr;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {banner ? (
            <Image source={{ uri: banner }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroImagePlaceholder]} />
          )}
          <LinearGradient
            colors={['transparent', colors.background]}
            style={styles.gradientOverlay}
          />

          <TouchableOpacity style={styles.backBtn} onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/home'); } }}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.heartBtn} onPress={() => toggleLike(id as string)}>
            <Ionicons name={likedEvents.has(id as string) ? "heart" : "heart-outline"} size={24} color={likedEvents.has(id as string) ? "#ef4444" : "#fff"} />
          </TouchableOpacity>
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {event.eventType && (
              <View style={[styles.categoryPill, { backgroundColor: colors.primary }]}>
                <Text style={styles.categoryText}>{event.eventType}</Text>
              </View>
            )}
            {event.eventMode && (
              <View style={[styles.categoryPill, { borderWidth: 1, borderColor: colors.primary }]}>
                <Text style={[styles.categoryText, { color: colors.primary }]}>{formatMode(event.eventMode)}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.titleText, { color: colors.text }]}>{event.eventName || 'Event'}</Text>
          
          <Text style={[styles.subtitleText, { color: colors.textMuted }]}>
            {event.description?.substring(0, 100) || 'Welcome to the beginning of something unforgettable!'}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={[styles.locationText, { color: colors.textMuted }]}>
              {isOnline ? 'Online Event' : event.venue || 'Venue TBA'}
            </Text>
          </View>

          <View style={styles.dateTimeContainer}>
            <View style={[styles.dateTimeCard, { backgroundColor: colors.surface, shadowColor: isDarkMode ? 'transparent' : '#000', borderColor: colors.border, borderWidth: isDarkMode ? 1 : 0 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                <Text style={[styles.dateTimeLabel, { color: colors.textMuted, marginLeft: 6, marginBottom: 0 }]} numberOfLines={1}>Date</Text>
              </View>
              <Text style={[styles.dateTimeValue, { color: colors.text, fontSize: 13 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{formatDateOnly(event.startDateTime)}</Text>
            </View>
            <View style={[styles.dateTimeCard, { backgroundColor: colors.surface, shadowColor: isDarkMode ? 'transparent' : '#000', borderColor: colors.border, borderWidth: isDarkMode ? 1 : 0 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                <Text style={[styles.dateTimeLabel, { color: colors.textMuted, marginLeft: 6, marginBottom: 0 }]} numberOfLines={1}>Time</Text>
              </View>
              <Text style={[styles.dateTimeValue, { color: colors.text, fontSize: 13 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{timeDisplay}</Text>
            </View>
          </View>

          {/* Segmented Control */}
          <View style={[styles.tabsWrapper, { backgroundColor: isDarkMode ? '#1f1f1f' : '#f0f0f0' }]}>
            <View style={styles.tabsContainer}>
              {SECTIONS.map((section) => (
                <TouchableOpacity
                  key={section}
                  style={[
                    styles.tabButton,
                    activeSection === section && [styles.tabButtonActive, { backgroundColor: colors.primary, shadowColor: isDarkMode ? 'transparent' : colors.primary, borderColor: colors.primary, borderWidth: 1 }]
                  ]}
                  onPress={() => setActiveSection(section)}
                >
                  <Text style={[
                    styles.tabText,
                    { color: activeSection === section ? '#fff' : colors.textMuted },
                    activeSection === section && { fontWeight: '700' }
                  ]} numberOfLines={1} adjustsFontSizeToFit>{section}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dynamic Content based on Selection */}
          <View style={styles.sectionContent}>
            {activeSection === 'About' && (
              <Text style={[styles.aboutText, { color: colors.textMuted }]}>
                {event.description || 'No description provided for this event.'}
              </Text>
            )}

            {activeSection === 'Gallery' && (
              <View style={styles.moreSection}>
                <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Event Gallery</Text>
                {(!event.galleryUrls || event.galleryUrls.length === 0) ? (
                  <Text style={[styles.aboutText, { color: colors.textMuted }]}>
                    No images available in the gallery yet.
                  </Text>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 }}>
                    {event.galleryUrls.map((url: string, index: number) => (
                      <Image
                        key={index}
                        source={{ uri: url }}
                        style={{ width: '48%', height: 120, borderRadius: 10, marginBottom: 12, backgroundColor: colors.border }}
                        resizeMode="cover"
                      />
                    ))}
                  </View>
                )}
              </View>
            )}

            {activeSection === 'Organizer' && (
              <View style={styles.organizerSection}>
                {event.portal && (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Portal Details</Text>
                    <Text style={[styles.organizerText, { color: colors.text, fontWeight: '700', fontSize: 15 }]}>
                      {event.portal.portalName}
                    </Text>
                    {event.portal.description && (
                      <Text style={[styles.aboutText, { color: colors.textMuted, marginTop: 6 }]}>
                        {event.portal.description}
                      </Text>
                    )}
                    {event.portal.organizationLocation && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                        <Ionicons name="business-outline" size={14} color={colors.primary} />
                        <Text style={{ fontSize: 13, color: colors.textMuted, marginLeft: 6 }}>
                          {event.portal.organizationLocation}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Event Organizer</Text>
                <Text style={[styles.organizerText, { color: colors.textMuted }]}>
                  {event.organizer ? `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`.trim() : 'Not specified'}
                </Text>
                
                <Text style={[styles.sectionSubtitle, { color: colors.text, marginTop: 16 }]}>Contact Info</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="mail-outline" size={14} color={colors.textMuted} />
                  <Text style={[styles.organizerText, { color: colors.textMuted, marginLeft: 6 }]}>
                    {event.organizer?.email || 'No contact email provided'}
                  </Text>
                </View>
              </View>
            )}

            {activeSection === 'More' && (
              <View style={styles.moreSection}>
                <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Agenda</Text>
                <Text style={[styles.aboutText, { color: colors.textMuted, marginBottom: 16 }]}>
                  {event.agenda || 'Agenda details will be updated soon.'}
                </Text>
                
                <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Chief Guest</Text>
                <Text style={[styles.aboutText, { color: colors.textMuted }]}>
                  {event.chiefGuest || 'To be announced'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View>
          <Text style={[styles.fromText, { color: colors.textMuted }]}>From</Text>
          <Text style={[styles.priceText, { color: colors.text }]}>{price} {isPaid ? 'onwards' : ''}</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookBtn, { backgroundColor: colors.primary }, regClosed && styles.bookBtnDisabled]}
          onPress={() => {
            if (!regClosed) router.push({ pathname: '/register', params: { id: event.id } });
          }}
          disabled={regClosed}
        >
          <Text style={styles.bookBtnText}>{regClosed ? 'Closed' : 'Book now'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  heroContainer: {
    height: 280, // Decreased banner image height
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroImagePlaceholder: {
    backgroundColor: '#374151',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 36,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 36,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  titleText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  locationText: {
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dateTimeCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    borderRadius: 16,
    padding: 12,
    width: '48%',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateTimeLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  dateTimeValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabsWrapper: {
    borderRadius: 30,
    padding: 4,
    marginBottom: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionContent: {
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  organizerSection: {
    marginBottom: 20,
  },
  organizerText: {
    fontSize: 14,
    lineHeight: 22,
  },
  moreSection: {
    marginBottom: 20,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 24,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  fromText: {
    fontSize: 12,
    marginBottom: 2,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
  },
  bookBtn: {
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 24,
  },
  bookBtnDisabled: {
    backgroundColor: '#d1d5db',
  },
  bookBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  backBtnCenter: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
});
