import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Linking,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchMovieById, MovieItem } from '../services/movieApi';
import { useMovieBooking } from '../context/MovieBookingContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/i);
  return match && match[2] && match[2].length === 11 ? match[2] : null;
}



export default function MovieDetailScreen() {
  const { id, isUpcoming: isUpcomingParam } = useLocalSearchParams<{ id: string; isUpcoming?: string }>();
  const { colors, isDarkMode } = useTheme();
  const { selectMovie } = useMovieBooking();

  const [movie, setMovie] = useState<MovieItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNotified, setIsNotified] = useState(false);

  const isUpcoming = useMemo(() => {
    if (isUpcomingParam === 'true') return true;
    if (!movie?.releaseDate) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return movie.releaseDate > todayStr;
  }, [movie, isUpcomingParam]);

  useEffect(() => {
    if (id) {
      loadMovie(id);
    }
  }, [id]);

  const loadMovie = async (movieId: string) => {
    setLoading(true);
    try {
      const data = await fetchMovieById(movieId);
      if (data) {
        setMovie(data);
        selectMovie(data);
      }
    } catch (err) {
      console.log('Error loading movie:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookTickets = () => {
    if (isUpcoming) {
      setIsNotified(true);
      Alert.alert(
        'Reminder Set!',
        `We will notify you as soon as advance ticket bookings open for ${movie?.title || 'this movie'}.`
      );
      return;
    }
    if (movie) {
      selectMovie(movie);
      router.push({
        pathname: '/movie-showtimes' as any,
        params: { movieId: movie.id.toString() },
      });
    }
  };

  const [trailerModalVisible, setTrailerModalVisible] = useState(false);

  const videoId = useMemo(() => {
    return movie?.trailerUrl ? getYouTubeVideoId(movie.trailerUrl) : null;
  }, [movie?.trailerUrl]);

  const embedUrl = useMemo(() => {
    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`;
    }
    return movie?.trailerUrl?.trim() || '';
  }, [videoId, movie?.trailerUrl]);

  const handleWatchTrailer = () => {
    const rawUrl = movie?.trailerUrl?.trim();
    if (!rawUrl) {
      Alert.alert('Trailer Unavailable', `No official trailer link is available for "${movie?.title || 'this movie'}".`);
      return;
    }
    setTrailerModalVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading movie details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!movie) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.centerContainer}>
          <Ionicons name="film-outline" size={54} color={colors.textMuted} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Movie Not Found</Text>
          <TouchableOpacity
            style={[styles.backBtnSolid, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* In-App Trailer Player Modal */}
      <Modal
        visible={trailerModalVisible}
        animationType="fade"
        transparent={true}
        hardwareAccelerated
        onRequestClose={() => setTrailerModalVisible(false)}
      >
        <SafeAreaView style={styles.trailerModalOverlay}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />

          {/* Modal Header */}
          <View style={styles.trailerModalHeader}>
            <View style={styles.trailerModalTitleRow}>
              <Ionicons name="film" size={20} color="#7931ED" />
              <Text style={styles.trailerModalTitle} numberOfLines={1}>
                {movie?.title ? `${movie.title} - Official Trailer` : 'Official Trailer'}
              </Text>
            </View>

            <View style={styles.trailerHeaderActions}>
              {movie?.trailerUrl ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.trailerExternalBtn}
                  onPress={() => {
                    const rawUrl = movie.trailerUrl!;
                    const vid = getYouTubeVideoId(rawUrl);
                    if (vid && Platform.OS === 'android') {
                      Linking.openURL(`vnd.youtube:${vid}`).catch(() => Linking.openURL(rawUrl));
                    } else {
                      Linking.openURL(rawUrl);
                    }
                  }}
                >
                  <Ionicons name="open-outline" size={18} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.trailerCloseBtn}
                onPress={() => setTrailerModalVisible(false)}
              >
                <Ionicons name="close" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Video Player */}
          <View style={styles.trailerVideoWrapper}>
            {Platform.OS === 'web' ? (
              <iframe
                src={embedUrl}
                style={{ width: '100%', height: Math.round((width * 9) / 16), border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <WebView
                source={{
                  uri: embedUrl,
                  headers: {
                    Referer: 'https://www.youtube-nocookie.com',
                  },
                }}
                originWhitelist={['*']}
                allowsFullscreenVideo={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                mixedContentMode="always"
                userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
                style={styles.trailerWebView}
                renderLoading={() => (
                  <View style={styles.trailerLoadingContainer}>
                    <ActivityIndicator size="large" color="#7931ED" />
                    <Text style={styles.trailerLoadingText}>Loading Trailer...</Text>
                  </View>
                )}
                startInLoadingState={true}
              />
            )}
          </View>

          {/* Modal Footer */}
          <View style={styles.trailerFooter}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.trailerDoneBtn}
              onPress={() => setTrailerModalVisible(false)}
            >
              <Ionicons name="close-circle-outline" size={18} color="#FFF" />
              <Text style={styles.trailerDoneBtnText}>Close Trailer</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Floating Header */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.circleBtn}>
            <Ionicons name="share-social-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner Backdrop with Trailer overlay */}
        <View style={styles.backdropContainer}>
          <Image
            source={{
              uri: movie.bannerUrl || movie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
            }}
            style={styles.backdropImage}
            resizeMode="cover"
          />
          <View style={styles.backdropOverlay} />

          {/* Prominent Center Trailer Button */}
          {movie.trailerUrl ? (
            <View style={styles.trailerCenterContainer} pointerEvents="box-none">
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.centerTrailerPlayBtn}
                onPress={handleWatchTrailer}
              >
                <View style={styles.bigPlayIconCircle}>
                  <Ionicons name="play" size={20} color="#FFF" style={{ marginLeft: 2 }} />
                </View>
                <Text style={styles.centerTrailerText}>Watch Trailer</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Poster & Main Specs Row */}
        <View style={styles.specsWrapper}>
          <Image
            source={{
              uri: movie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
            }}
            style={styles.mainPoster}
            resizeMode="cover"
          />

          <View style={styles.specsContent}>
            <Text style={[styles.movieTitle, { color: colors.text }]} numberOfLines={2}>
              {movie.title}
            </Text>

            <View style={styles.tagRow}>
              {movie.certificate ? (
                <View style={[styles.certBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.certText, { color: colors.text }]}>{movie.certificate}</Text>
                </View>
              ) : null}

              {movie.language ? (
                <View style={[styles.langBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.langBadgeText}>{movie.language}</Text>
                </View>
              ) : null}

              <View style={styles.formatBadge}>
                <Text style={styles.formatText}>2D • 3D • IMAX</Text>
              </View>
            </View>

            {/* Rating Bar */}
            <View style={styles.ratingBar}>
              <Ionicons name="star" size={18} color="#FBBF24" />
              <Text style={[styles.ratingNumber, { color: colors.text }]}>
                {movie.rating ? movie.rating.toFixed(1) : '8.8'}/10
              </Text>
              <Text style={[styles.ratingVotes, { color: colors.textMuted }]}>
                (12.4K votes)
              </Text>
            </View>

            {/* Duration & Date */}
            <View style={styles.durationRow}>
              <Ionicons name="time-outline" size={15} color={colors.textMuted} />
              <Text style={[styles.durationLabel, { color: colors.textMuted }]}>
                {movie.durationMinutes
                  ? `${Math.floor(movie.durationMinutes / 60)}h ${movie.durationMinutes % 60}m`
                  : '2h 45m'}
              </Text>
              {movie.releaseDate ? (
                <>
                  <Text style={[styles.dot, { color: colors.textMuted }]}>•</Text>
                  <Text style={[styles.durationLabel, { color: colors.textMuted }]}>
                    {movie.releaseDate}
                  </Text>
                </>
              ) : null}
            </View>
          </View>
        </View>

        {/* Genre Tags */}
        {movie.genre ? (
          <View style={styles.genreTagsContainer}>
            {movie.genre.split(/[/,]/).map((g, idx) => (
              <View
                key={idx}
                style={[styles.genrePill, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.genrePillText, { color: colors.text }]}>{g.trim()}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Synopsis Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About the Movie</Text>
          <Text style={[styles.synopsisText, { color: colors.textMuted }]}>
            {movie.description ||
              "Experience the ultimate cinematic spectacle on the grand screen. Filled with breathtaking visual effects, unforgettable emotional depth, and high-octane suspense."}
          </Text>
        </View>

        {/* Cast & Crew Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Cast & Crew</Text>
          {movie?.castAndCrew && movie.castAndCrew.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.castScroll}>
              {movie.castAndCrew.map((cast: any, idx: number) => (
                <View key={cast.id || idx} style={styles.castCard}>
                  <Image
                    source={{
                      uri: cast.profileImageUrl ||
                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
                    }}
                    style={styles.castAvatar}
                  />
                  <Text numberOfLines={1} style={[styles.castName, { color: colors.text }]}>
                    {cast.name?.trim()}
                  </Text>
                  <Text numberOfLines={1} style={[styles.castRole, { color: colors.textMuted }]}>
                    {cast.primaryRole?.trim() || 'Actor'}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.perksCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 8 }]}>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>Cast and crew details will be announced soon.</Text>
            </View>
          )}
        </View>

        {/* Cinema Perks Info */}
        <View style={[styles.perksCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.perkItem}>
            <Ionicons name="sparkles" size={20} color="#F59E0B" />
            <Text style={[styles.perkText, { color: colors.text }]}>Dolby Atmos 128 Channel</Text>
          </View>
          <View style={styles.perkItem}>
            <Ionicons name="fast-food-outline" size={20} color="#EC4899" />
            <Text style={[styles.perkText, { color: colors.text }]}>F&B Concessions Available</Text>
          </View>
          <View style={styles.perkItem}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />
            <Text style={[styles.perkText, { color: colors.text }]}>Contactless E-Ticket QR Entry</Text>
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.stickyBottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {isUpcoming ? (
          <>
            <View>
              <Text style={[styles.pricePrefix, { color: colors.textMuted }]}>Releasing on</Text>
              <Text style={[styles.priceTag, { color: '#D97706' }]}>
                {movie.releaseDate
                  ? new Date(movie.releaseDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Coming Soon'}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              style={[
                styles.primaryBookBtn,
                { backgroundColor: isNotified ? '#10B981' : '#D97706' },
              ]}
              onPress={handleBookTickets}
            >
              <Ionicons
                name={isNotified ? 'checkmark-circle' : 'notifications-outline'}
                size={20}
                color="#FFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.primaryBookBtnText}>
                {isNotified ? 'Reminder Set' : 'Remind Me'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            activeOpacity={0.88}
            style={[
              styles.primaryBookBtn,
              { flex: 1, justifyContent: 'center', backgroundColor: colors.primary },
            ]}
            onPress={handleBookTickets}
          >
            <Ionicons name="ticket" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBookBtnText}>Book Tickets</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 16,
  },
  backBtnSolid: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  floatingHeader: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 10 : 20,
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  backdropContainer: {
    position: 'relative',
    width: width,
    height: 240,
  },
  backdropImage: {
    width: '100%',
    height: '100%',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  trailerCenterContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  centerTrailerPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 28,
    gap: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  bigPlayIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7931ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTrailerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  specsWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
    alignItems: 'flex-start',
  },
  mainPoster: {
    width: 112,
    height: 162,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  specsContent: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 6,
  },
  movieTitle: {
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  certBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  certText: {
    fontSize: 10,
    fontWeight: '800',
  },
  langBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  langBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  formatBadge: {
    backgroundColor: 'rgba(121, 49, 237, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  formatText: {
    color: '#7931ED',
    fontSize: 11,
    fontWeight: '700',
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  ratingNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  ratingVotes: {
    fontSize: 11,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationLabel: {
    fontSize: 12,
  },
  dot: {
    fontSize: 12,
  },
  genreTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  genrePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  genrePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  synopsisText: {
    fontSize: 14,
    lineHeight: 22,
  },
  castScroll: {
    marginTop: 8,
  },
  castCard: {
    width: 80,
    alignItems: 'center',
    marginRight: 14,
  },
  castAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 6,
  },
  castName: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  castRole: {
    fontSize: 10,
    textAlign: 'center',
  },
  perksCard: {
    marginHorizontal: 16,
    marginTop: 22,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  perkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  pricePrefix: {
    fontSize: 11,
  },
  priceTag: {
    fontSize: 16,
    fontWeight: '800',
  },
  primaryBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  primaryBookBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  trailerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
  },
  trailerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  trailerModalTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 10,
  },
  trailerModalTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  trailerHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trailerExternalBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  trailerCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  trailerVideoWrapper: {
    width: '100%',
    height: Math.round((width * 9) / 16),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  trailerWebView: {
    flex: 1,
    backgroundColor: '#000',
  },
  trailerLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  trailerLoadingText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  trailerFooter: {
    padding: 16,
    alignItems: 'center',
  },
  trailerDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  trailerDoneBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
