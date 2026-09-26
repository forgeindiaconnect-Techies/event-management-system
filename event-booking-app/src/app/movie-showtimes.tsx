import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchPublicShowtimes,
  fetchMovieById,
  fetchShowtimeOccupancyCounts,
  getShowtimeAvailability,
  formatIndianTime,
  ShowtimeItem,
  MovieItem,
  getScreenTech,
  getSectionPrice,
} from '../services/movieApi';
import { useMovieBooking } from '../context/MovieBookingContext';
import { useTheme } from '../context/ThemeContext';

export default function MovieShowtimesScreen() {
  const { movieId } = useLocalSearchParams<{ movieId: string }>();
  const { colors, isDarkMode } = useTheme();
  const { selectedMovie, selectMovie, selectShowtime } = useMovieBooking();

  const [movie, setMovie] = useState<MovieItem | null>(selectedMovie);
  const [allMovieShowtimes, setAllMovieShowtimes] = useState<ShowtimeItem[]>([]);
  const [occupancyMap, setOccupancyMap] = useState<Record<string | number, number>>({});
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('All');

  useEffect(() => {
    loadData();
  }, [movieId]);

  const loadData = async () => {
    setLoading(true);
    try {
      let activeMovie = movie;
      if (!activeMovie && movieId) {
        activeMovie = await fetchMovieById(movieId);
        if (activeMovie) {
          setMovie(activeMovie);
          selectMovie(activeMovie);
        }
      }

      const [allShows, counts] = await Promise.all([
        fetchPublicShowtimes(),
        fetchShowtimeOccupancyCounts(),
      ]);

      setOccupancyMap(counts);

      const todayIso = new Date().toISOString().split('T')[0];
      const now = new Date();
      const cutoffMinutes = now.getHours() * 60 + now.getMinutes() - 15; // 15 min cutoff for past shows

      // 1. Filter shows specifically for this movie
      const movieShows = allShows.filter((s) => {
        if (movieId && String(s.movieId) === String(movieId)) return true;
        if (activeMovie && s.movieTitle) {
          return s.movieTitle.toLowerCase().trim() === activeMovie.title.toLowerCase().trim();
        }
        return false;
      });

      const candidateShows = movieShows.length > 0 ? movieShows : allShows;

      // 2. Strict exclusion of PAST dates and already elapsed showtimes
      const upcomingShows = candidateShows.filter((st) => {
        if (!st.showDate) return false;
        // Strictly exclude past dates (e.g. yesterday)
        if (st.showDate < todayIso) return false;

        // If show is today, check if start time has already elapsed
        if (st.showDate === todayIso && st.startTime) {
          const parts = st.startTime.split(':');
          const showMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
          if (showMinutes < cutoffMinutes) return false;
        }
        return true;
      });

      setAllMovieShowtimes(upcomingShows);

      // 3. Determine available upcoming show dates
      const distinctFutureDates = Array.from(
        new Set(upcomingShows.map((s) => s.showDate).filter(Boolean) as string[])
      ).sort();

      // Priority 1: If today has upcoming shows, default to today
      // Priority 2: If today has no shows, auto-select earliest upcoming date with shows (e.g. Tomorrow)
      if (distinctFutureDates.includes(todayIso)) {
        setSelectedDate(todayIso);
      } else if (distinctFutureDates.length > 0) {
        setSelectedDate(distinctFutureDates[0]);
      } else {
        setSelectedDate(todayIso);
      }
    } catch (err) {
      console.log('Error loading showtimes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Distinct dates in the database that actually have upcoming shows
  const availableShowDates = useMemo(() => {
    const datesSet = new Set<string>();
    allMovieShowtimes.forEach((st) => {
      if (st.showDate) datesSet.add(st.showDate);
    });
    return Array.from(datesSet).sort();
  }, [allMovieShowtimes]);

  // Construct calendar date strip strictly starting from TODAY (never show yesterday!)
  const dateStripList = useMemo(() => {
    const list: { isoDate: string; dayName: string; dayNum: number; monthName: string; hasShows: boolean }[] = [];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];

      const dayName =
        i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const hasShows = availableShowDates.includes(isoDate);

      list.push({ isoDate, dayName, dayNum, monthName, hasShows });
    }

    return list;
  }, [availableShowDates]);

  // Extract clean tech formats available for this movie (IMAX, 4DX, Dolby Atmos, 2D)
  const availableFormats = useMemo(() => {
    const set = new Set<string>(['All']);
    allMovieShowtimes.forEach((st) => {
      set.add(getScreenTech(st));
    });
    return Array.from(set);
  }, [allMovieShowtimes]);

  // Filter showtimes strictly by selected date and selected format
  const filteredShowtimes = useMemo(() => {
    return allMovieShowtimes.filter((st) => {
      // 1. Date Filter
      if (selectedDate && st.showDate !== selectedDate) {
        return false;
      }

      // 2. Format Filter
      if (selectedFormat !== 'All') {
        const tech = getScreenTech(st);
        if (tech !== selectedFormat) return false;
      }

      return true;
    });
  }, [allMovieShowtimes, selectedDate, selectedFormat]);

  // Group showtimes by Theater & Cinema Hall
  const theatersWithShows = useMemo(() => {
    const groups: Record<
      string,
      {
        theaterName: string;
        theaterCity: string;
        theaterAddress: string;
        techs: Set<string>;
        screenSpecs: string;
        shows: ShowtimeItem[];
        minPrice: number;
      }
    > = {};

    filteredShowtimes.forEach((st) => {
      const thName =
        st.theater?.theaterPortal?.portalName ||
        (st as any).portalName ||
        st.theater?.name ||
        st.screen?.theater?.name ||
        'Gopal Multiplex';

      const thCity =
        st.theater?.theaterPortal?.city ||
        (st as any).theaterCity ||
        st.theater?.city ||
        'Thirupathur';

      const thAddress = st.theater?.address || `${thName}, ${thCity}`;
      const tech = getScreenTech(st);
      const key = `${thName}___${thCity}`;

      if (!groups[key]) {
        groups[key] = {
          theaterName: thName,
          theaterCity: thCity,
          theaterAddress: thAddress,
          techs: new Set<string>(),
          screenSpecs: st.screen?.screenType || `${tech} Surround`,
          shows: [],
          minPrice: 160,
        };
      }

      groups[key].techs.add(tech);
      groups[key].shows.push(st);

      // Extract minimum price
      const pSilver = getSectionPrice('silver', st.classPrices, 160);
      const pGold = getSectionPrice('gold', st.classPrices, 190);
      const pBalcony = getSectionPrice('balcony', st.classPrices, 220);
      const lowest = Math.min(pSilver, pGold, pBalcony);
      if (lowest < groups[key].minPrice) {
        groups[key].minPrice = lowest;
      }
    });

    return Object.values(groups).map((g) => ({
      ...g,
      primaryTech: Array.from(g.techs).join(' • '),
      shows: g.shows.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')),
    }));
  }, [filteredShowtimes]);

  const handleSelectShowtime = (showtime: ShowtimeItem, isSoldOut: boolean) => {
    if (isSoldOut) {
      Alert.alert('Show Sold Out', 'All seats for this show are currently sold out. Please select another showtime.');
      return;
    }
    selectShowtime(showtime);
    router.push({
      pathname: '/movie-seat-layout' as any,
      params: { showtimeId: showtime.id.toString(), movieId: movie?.id?.toString() || '' },
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.text }]}>
            {movie?.title || 'Select Showtimes'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {movie?.certificate || 'UA'} • {movie?.language || 'Tamil'} • {availableFormats.filter(f => f !== 'All').join(', ') || '2D, 3D'}
          </Text>
        </View>
      </View>

      {/* Dynamic Date Carousel - strictly Today onwards */}
      <View style={[styles.dateBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
          {dateStripList.map((d) => {
            const isSelected = selectedDate === d.isoDate;
            return (
              <TouchableOpacity
                key={d.isoDate}
                activeOpacity={0.85}
                onPress={() => setSelectedDate(d.isoDate)}
                style={[
                  styles.datePill,
                  { borderColor: colors.border, backgroundColor: colors.background },
                  isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text style={[styles.dayName, { color: isSelected ? '#FFF' : colors.textMuted }]}>
                  {d.dayName}
                </Text>
                <Text style={[styles.dayNum, { color: isSelected ? '#FFF' : colors.text }]}>
                  {d.dayNum}
                </Text>
                <Text style={[styles.monthName, { color: isSelected ? '#FFF' : colors.textMuted }]}>
                  {d.monthName}
                </Text>
                {d.hasShows && !isSelected && (
                  <View style={[styles.showDot, { backgroundColor: colors.primary }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Format Filter Chips & Real-time Status Legend */}
      <View style={[styles.filterBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {availableFormats.map((fmt) => {
            const isSel = selectedFormat === fmt;
            return (
              <TouchableOpacity
                key={fmt}
                onPress={() => setSelectedFormat(fmt)}
                style={[
                  styles.filterPill,
                  { borderColor: colors.border, backgroundColor: colors.background },
                  isSel && { borderColor: colors.primary, backgroundColor: 'rgba(121, 49, 237, 0.12)' },
                ]}
              >
                <Text style={[styles.filterText, { color: isSel ? colors.primary : colors.text }]}>
                  {fmt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Status Legend Row */}
        <View style={styles.legendRow}>
          <View style={styles.legendBadge}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>Available</Text>
          </View>
          <View style={styles.legendBadge}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>Fast Filling</Text>
          </View>
          <View style={styles.legendBadge}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>70%+ Full</Text>
          </View>
          <View style={styles.legendBadge}>
            <View style={[styles.legendDot, { backgroundColor: '#9CA3AF' }]} />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>Sold Out</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Fetching real theaters & showtimes...
          </Text>
        </View>
      ) : theatersWithShows.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={56} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Shows on This Date</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            There are no scheduled showtimes on {selectedDate}.
          </Text>
          {availableShowDates.length > 0 && (
            <TouchableOpacity
              style={[styles.jumpDateBtn, { backgroundColor: colors.primary }]}
              onPress={() => setSelectedDate(availableShowDates[0])}
            >
              <Text style={styles.jumpDateBtnText}>
                View Shows on {availableShowDates[0]}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.theatersList}>
          {theatersWithShows.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.theaterCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {/* Theater Header */}
              <View style={styles.theaterHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.theaterName, { color: colors.text }]}>
                    {item.theaterName}
                  </Text>
                  <View style={styles.theaterSubRow}>
                    <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                    <Text numberOfLines={1} style={[styles.theaterAddress, { color: colors.textMuted }]}>
                      {item.theaterAddress}
                    </Text>
                    <Text style={[styles.distanceText, { color: colors.primary }]}>
                      • 2.4 km
                    </Text>
                  </View>
                </View>

                <View style={styles.amenityRow}>
                  <Ionicons name="fast-food-outline" size={16} color="#EC4899" />
                  <Ionicons name="car-outline" size={16} color="#3B82F6" />
                  <Ionicons name="phone-portrait-outline" size={16} color="#10B981" />
                </View>
              </View>

              {/* Screen Specs & Pricing Hint */}
              <View style={styles.screenBadgeRow}>
                <View style={styles.screenTypeTag}>
                  <Text style={styles.screenTypeTagText} numberOfLines={1}>
                    {item.screenSpecs || item.primaryTech}
                  </Text>
                </View>
                <Text style={[styles.priceHintText, { color: colors.textMuted }]}>
                  From ₹{item.minPrice}
                </Text>
              </View>

              {/* Real Showtimes Grid with Accurate Status */}
              <View style={styles.showtimesRow}>
                {item.shows.map((show, sIdx) => {
                  const timeFormatted = formatIndianTime(show.startTime) || '10:00 AM';

                  const bookedCount = occupancyMap[show.id] || 0;
                  const capacity = show.screen?.totalCapacity || 418;
                  const avail = getShowtimeAvailability(bookedCount, capacity);

                  return (
                    <TouchableOpacity
                      key={show.id || sIdx}
                      activeOpacity={avail.isSoldOut ? 1 : 0.8}
                      style={[
                        styles.showtimePill,
                        {
                          borderColor: avail.isSoldOut
                            ? '#E5E7EB'
                            : avail.status === 'ALMOST_FULL'
                            ? '#FCA5A5'
                            : colors.border,
                          backgroundColor: avail.isSoldOut
                            ? (isDarkMode ? '#1F2937' : '#F3F4F6')
                            : colors.background,
                          opacity: avail.isSoldOut ? 0.65 : 1,
                        },
                      ]}
                      onPress={() => handleSelectShowtime(show, avail.isSoldOut)}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          {
                            color: avail.isSoldOut ? colors.textMuted : colors.text,
                            textDecorationLine: avail.isSoldOut ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {timeFormatted}
                      </Text>
                      <Text
                        style={[
                          styles.screenLabel,
                          { color: avail.color },
                        ]}
                      >
                        {avail.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Policy note */}
              <View style={styles.policyRow}>
                <Ionicons name="information-circle-outline" size={13} color={colors.textMuted} />
                <Text style={[styles.policyText, { color: colors.textMuted }]}>
                  Free cancellation available up to 2 hrs before showtime
                </Text>
              </View>
            </View>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  dateBar: {
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  dateScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  datePill: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 62,
    height: 76,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 6,
    position: 'relative',
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  dayNum: {
    fontSize: 17,
    fontWeight: '800',
  },
  monthName: {
    fontSize: 10,
    marginTop: 2,
  },
  showDot: {
    position: 'absolute',
    bottom: 5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  filterBar: {
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 4,
  },
  legendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  jumpDateBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  jumpDateBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  theatersList: {
    padding: 16,
    gap: 16,
  },
  theaterCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  theaterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  theaterName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  theaterSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  theaterAddress: {
    fontSize: 12,
    maxWidth: 200,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  amenityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  screenBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  screenTypeTag: {
    backgroundColor: 'rgba(121, 49, 237, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
  },
  screenTypeTagText: {
    color: '#7931ED',
    fontSize: 11,
    fontWeight: '700',
  },
  priceHintText: {
    fontSize: 11,
    fontWeight: '600',
  },
  showtimesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  showtimePill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 92,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  screenLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 2,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  policyText: {
    fontSize: 11,
  },
});
