import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  Dimensions,
  PanResponder,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchBookedSeats,
  fetchScreenLayout,
  fetchPublicShowtimes,
  getSectionPrice,
  getCanonicalSection,
  formatIndianTime,
  ShowtimeItem,
} from '../services/movieApi';
import { useMovieBooking } from '../context/MovieBookingContext';
import { useTheme } from '../context/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

const ROW_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

export default function MovieSeatLayoutScreen() {
  const { showtimeId } = useLocalSearchParams<{ showtimeId: string }>();
  const { colors, isDarkMode } = useTheme();
  const {
    selectedMovie,
    selectedShowtime,
    selectedSeats,
    toggleSeat,
    totalSeatAmount,
    selectShowtime,
  } = useMovieBooking();

  const [currentShowtime, setCurrentShowtime] = useState<ShowtimeItem | null>(selectedShowtime);
  const [layout, setLayout] = useState<any>(null);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Zoom In / Zoom Out scale specification
  const [zoomScale, setZoomScale] = useState<number>(1.0);

  useEffect(() => {
    initLayoutAndBookings();
  }, [showtimeId]);

  const initLayoutAndBookings = async () => {
    setLoading(true);
    try {
      let activeSt = currentShowtime;

      // 1. If showtime isn't in context or ID changed, fetch from DB
      if (!activeSt || String(activeSt.id) !== String(showtimeId)) {
        const allShows = await fetchPublicShowtimes();
        const found = allShows.find((s) => String(s.id) === String(showtimeId));
        if (found) {
          activeSt = found;
          setCurrentShowtime(found);
          selectShowtime(found);
        }
      }

      // 2. Resolve layout JSON
      let resolvedLayout = null;
      if (activeSt?.screen?.layoutJson) {
        try {
          resolvedLayout =
            typeof activeSt.screen.layoutJson === 'string'
              ? JSON.parse(activeSt.screen.layoutJson)
              : activeSt.screen.layoutJson;
        } catch (e) {
          console.log('Error parsing layoutJson string:', e);
        }
      }

      if (!resolvedLayout && activeSt?.screen?.id) {
        resolvedLayout = await fetchScreenLayout(activeSt.screen.id);
      }

      // Default Standard Cinema Layout if screen has no custom layout in DB
      if (!resolvedLayout || !Array.isArray(resolvedLayout.sections)) {
        resolvedLayout = {
          sections: [
            {
              id: 'sec_balcony',
              name: 'Balcony',
              color: '#3B82F6',
              rowsCount: 4,
              seatsPerRow: 16,
              centerAisleGap: 0,
              hasAisleBelow: true,
            },
            {
              id: 'sec_gold',
              name: 'Gold',
              color: '#3B82F6',
              rowsCount: 7,
              seatsPerRow: 18,
              centerAisleGap: 1,
              hasAisleBelow: true,
            },
            {
              id: 'sec_silver',
              name: 'Silver',
              color: '#3B82F6',
              rowsCount: 13,
              seatsPerRow: 18,
              centerAisleGap: 1,
              hasAisleBelow: false,
            },
          ],
          deletedSeats: {},
        };
      }

      setLayout(resolvedLayout);

      // 3. Load booked seats
      if (showtimeId) {
        const booked = await fetchBookedSeats(showtimeId);
        setBookedSeats(booked);
      }
    } catch (err) {
      console.log('Error initializing seat layout:', err);
    } finally {
      setLoading(false);
    }
  };

  // Compute section rows and canonical lettering matching web PublicMovieSeatLayout.jsx
  const computedSections = useMemo(() => {
    if (!layout?.sections) return [];
    let floorRowOffset = 0;

    return layout.sections.map((sec: any) => {
      const isBalcony = (sec.name || '').toLowerCase().includes('balcony');
      const rows = sec.rowsCount || 4;
      const rowLabels: string[] = [];

      if (isBalcony) {
        // Balcony has its own independent alphabet sequence starting at A
        for (let r = 0; r < rows; r++) {
          rowLabels.push(ROW_LETTERS[r] || `B-R${r + 1}`);
        }
      } else {
        // Down classes start at A and continue sequentially across floor sections
        for (let r = 0; r < rows; r++) {
          rowLabels.push(ROW_LETTERS[floorRowOffset++] || `R${floorRowOffset}`);
        }
      }

      const price = getSectionPrice(sec.name, currentShowtime?.classPrices, 160);

      return {
        ...sec,
        isBalcony,
        rowLabels,
        price,
      };
    });
  }, [layout, currentShowtime]);

  // Check if a seat is booked matching web patterns (strictly section-scoped)
  const isSeatBooked = (secName: string, seatNumDisplay: string, seatKey1: string, seatKey2: string): boolean => {
    const sId = showtimeId ? String(showtimeId) : '';
    const cleanSec = secName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cSec = getCanonicalSection(secName);

    const candidateKeys = [
      `${secName} ${seatNumDisplay}`.toLowerCase(),
      `${cleanSec} ${seatNumDisplay}`.toLowerCase(),
      `${cleanSec}-${seatNumDisplay}`.toLowerCase(),
      `${cSec} ${seatNumDisplay}`.toLowerCase(),
      `${cSec}-${seatNumDisplay}`.toLowerCase(),
      seatKey1.toLowerCase(),
      seatKey2.toLowerCase(),
      sId ? `${sId}-${seatKey1}`.toLowerCase() : '',
      sId ? `${sId}-${seatKey2}`.toLowerCase() : '',
      sId ? `${sId}-${cleanSec}-${seatNumDisplay}`.toLowerCase() : '',
      sId ? `${sId}-${cSec}-${seatNumDisplay}`.toLowerCase() : '',
      sId ? `${sId}-${secName.toLowerCase()} ${seatNumDisplay.toLowerCase()}` : '',
    ].filter(Boolean);

    return bookedSeats.some((b) => {
      const bNorm = b.trim().toLowerCase();
      return candidateKeys.includes(bNorm);
    });
  };

  const handleSeatPress = (seatDisplay: string, price: number, isSold: boolean) => {
    if (isSold) {
      return;
    }
    if (!selectedSeats.includes(seatDisplay) && selectedSeats.length >= 8) {
      Alert.alert('Limit Reached', 'You can select up to 8 tickets per transaction.');
      return;
    }
    toggleSeat(seatDisplay, price);
  };

  const handleProceedToCheckout = () => {
    if (selectedSeats.length === 0) {
      Alert.alert('Select Seats', 'Please select at least one seat to continue.');
      return;
    }
    router.push('/movie-checkout' as any);
  };

  // Two-finger pinch-to-zoom specification
  const initialDistanceRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1.0);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Strictly activate only when exactly 2 fingers are touching
        onStartShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 2,
        onMoveShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 2,
        onPanResponderGrant: (evt) => {
          const touches = evt.nativeEvent.touches;
          if (touches.length === 2) {
            const dx = touches[0].pageX - touches[1].pageX;
            const dy = touches[0].pageY - touches[1].pageY;
            initialDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
            initialScaleRef.current = zoomScale;
          }
        },
        onPanResponderMove: (evt) => {
          const touches = evt.nativeEvent.touches;
          if (touches.length === 2 && initialDistanceRef.current && initialDistanceRef.current > 0) {
            const dx = touches[0].pageX - touches[1].pageX;
            const dy = touches[0].pageY - touches[1].pageY;
            const currentDistance = Math.sqrt(dx * dx + dy * dy);
            const factor = currentDistance / initialDistanceRef.current;
            const target = Math.min(1.5, Math.max(0.65, +(initialScaleRef.current * factor).toFixed(2)));
            setZoomScale(target);
          }
        },
        onPanResponderRelease: () => {
          initialDistanceRef.current = null;
        },
        onPanResponderTerminate: () => {
          initialDistanceRef.current = null;
        },
      }),
    [zoomScale]
  );

  // Zoom button controls
  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(1.45, +(prev + 0.15).toFixed(2)));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(0.65, +(prev - 0.15).toFixed(2)));
  };

  const handleResetZoom = () => {
    setZoomScale(1.0);
  };

  const theaterDisplayName =
    currentShowtime?.theater?.theaterPortal?.portalName ||
    (currentShowtime as any)?.portalName ||
    currentShowtime?.theater?.name ||
    'Gopal Multiplex';

  const screenDisplayName = currentShowtime?.screen?.screenName || 'SILVI(screen1)';

  // Format 12-hour AM/PM time
  const timeFormatted = formatIndianTime(currentShowtime?.startTime) || '10:00 AM';

  // Dynamic dimensions scaled by zoomScale
  const seatSize = Math.round(28 * zoomScale);
  const seatFontSize = Math.max(7, Math.round(10 * zoomScale));
  const seatGap = Math.max(2, Math.round(4 * zoomScale));
  const rowLabelWidth = Math.round(20 * zoomScale);
  const rowLabelFontSize = Math.max(8, Math.round(11 * zoomScale));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header Bar */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.text }]}>
            {selectedMovie?.title || currentShowtime?.movieTitle || 'Select Seats'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {theaterDisplayName} • {screenDisplayName} • {timeFormatted}
          </Text>
        </View>

        <View style={[styles.badgeCount, { backgroundColor: 'rgba(121, 49, 237, 0.12)' }]}>
          <Text style={[styles.badgeCountText, { color: colors.primary }]}>
            {selectedSeats.length} / 8
          </Text>
        </View>
      </View>

      {/* Legend & Zoom Toolbar */}
      <View style={[styles.controlHeaderBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {/* Status Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.seatLegendBox, { borderColor: '#CBD5E1', backgroundColor: '#FFF' }]} />
            <Text style={[styles.legendLabel, { color: colors.textMuted }]}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.seatLegendBox, { backgroundColor: colors.primary, borderColor: colors.primary }]} />
            <Text style={[styles.legendLabel, { color: colors.text }]}>Selected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.seatLegendBox, { backgroundColor: '#E2E8F0', borderColor: '#CBD5E1' }]} />
            <Text style={[styles.legendLabel, { color: colors.textMuted }]}>Sold</Text>
          </View>
        </View>

        {/* Zoom In & Zoom Out Controls with Pinch Hint */}
        <View style={styles.zoomActionsRow}>
          <Text style={[styles.pinchHintText, { color: colors.textMuted }]}>
            Pinch to zoom
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            disabled={zoomScale <= 0.65}
            onPress={handleZoomOut}
            style={[
              styles.zoomBtn,
              { backgroundColor: colors.background, borderColor: colors.border },
              zoomScale <= 0.65 && { opacity: 0.35 },
            ]}
          >
            <Ionicons name="remove" size={16} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleResetZoom}
            style={[
              styles.zoomResetBtn,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.zoomResetText, { color: colors.primary }]}>
              {Math.round(zoomScale * 100)}%
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            disabled={zoomScale >= 1.45}
            onPress={handleZoomIn}
            style={[
              styles.zoomBtn,
              { backgroundColor: colors.background, borderColor: colors.border },
              zoomScale >= 1.45 && { opacity: 0.35 },
            ]}
          >
            <Ionicons name="add" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading cinema hall seat layout...
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }} {...panResponder.panHandlers}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            maximumZoomScale={1.5}
            minimumZoomScale={0.65}
          >
          {/* Curved Movie Screen Visual at Top */}
          <View style={styles.screenCurveWrapper}>
            <View style={[styles.screenCurveLine, { borderColor: colors.primary }]} />
            <Text style={[styles.screenText, { color: colors.textMuted }]}>
              ALL EYES THIS WAY • SCREEN
            </Text>
          </View>

          {/* Horizontal Pan Container for Cinema Layout */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.horizontalSeatScroll}
          >
            <View style={styles.sectionsContainer}>
              {computedSections.map((sec: any) => {
                const rows = sec.rowsCount || 4;
                const seatsPerRow = sec.seatsPerRow || 18;
                const halfSeats = Math.ceil(seatsPerRow / 2);
                const aisleGapWidth = Math.round(Math.max(1, sec.centerAisleGap || 1) * 20 * zoomScale);

                return (
                  <View key={sec.id} style={styles.sectionBlock}>
                    {/* Section Header */}
                    <View
                      style={[
                        styles.sectionHeader,
                        {
                          backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.secTitleRow}>
                        <View
                          style={[
                            styles.secColorDot,
                            { backgroundColor: sec.color || '#3B82F6' },
                          ]}
                        />
                        <Text style={[styles.secNameText, { color: colors.text }]}>
                          {sec.name.toUpperCase()} CLASS
                        </Text>
                      </View>
                      <View style={styles.pricePill}>
                        <Text style={styles.pricePillText}>₹{sec.price}</Text>
                      </View>
                    </View>

                    {/* Section Rows Grid with Zoom Scaled Dimensions */}
                    <View style={[styles.rowsWrapper, { gap: seatGap + 2 }]}>
                      {Array.from({ length: rows }).map((_, rIdx) => {
                        const rowLetter = sec.rowLabels?.[rIdx] || String.fromCharCode(65 + rIdx);
                        let activeSeatCounter = 1;

                        return (
                          <View key={rIdx} style={styles.seatRow}>
                            {/* Left Row Identifier */}
                            <Text
                              style={[
                                styles.rowLetterLabel,
                                {
                                  width: rowLabelWidth,
                                  fontSize: rowLabelFontSize,
                                  color: colors.textMuted,
                                },
                              ]}
                            >
                              {rowLetter}
                            </Text>

                            {/* Left Block */}
                            <View style={[styles.seatsBlock, { gap: seatGap }]}>
                              {Array.from({ length: halfSeats }).map((_, cIdx) => {
                                const key1 = `${sec.id}-${rowLetter}-${cIdx}`;
                                const key2 = `${sec.id}-${rIdx}-${cIdx}`;
                                const isDeleted = Boolean(
                                  layout?.deletedSeats?.[key1] || layout?.deletedSeats?.[key2]
                                );

                                if (isDeleted) {
                                  return (
                                    <View
                                      key={cIdx}
                                      style={{ width: seatSize, height: seatSize }}
                                    />
                                  );
                                }

                                const seatNumDisplay = `${rowLetter}${activeSeatCounter++}`;
                                const seatIdentifier = `${sec.name} ${seatNumDisplay}`;
                                const isSold = isSeatBooked(sec.name, seatNumDisplay, key1, key2);
                                const isSelected =
                                  selectedSeats.includes(seatIdentifier) ||
                                  selectedSeats.includes(seatNumDisplay);

                                return (
                                  <TouchableOpacity
                                    key={cIdx}
                                    activeOpacity={0.7}
                                    disabled={isSold}
                                    onPress={() =>
                                      handleSeatPress(seatIdentifier, sec.price, isSold)
                                    }
                                    style={[
                                      styles.seatItem,
                                      {
                                        width: seatSize,
                                        height: seatSize,
                                        borderColor: isSelected
                                          ? colors.primary
                                          : isSold
                                          ? '#CBD5E1'
                                          : '#CBD5E1',
                                        backgroundColor: isSelected
                                          ? colors.primary
                                          : isSold
                                          ? isDarkMode
                                            ? '#334155'
                                            : '#E2E8F0'
                                          : '#FFFFFF',
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.seatItemText,
                                        {
                                          fontSize: seatFontSize,
                                          color: isSelected
                                            ? '#FFF'
                                            : isSold
                                            ? '#94A3B8'
                                            : '#334155',
                                        },
                                      ]}
                                    >
                                      {seatNumDisplay.replace(/[A-Z]/g, '')}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>

                            {/* Center Aisle Gap */}
                            <View style={{ width: aisleGapWidth }} />

                            {/* Right Block */}
                            <View style={[styles.seatsBlock, { gap: seatGap }]}>
                              {Array.from({ length: seatsPerRow - halfSeats }).map((_, cIdx) => {
                                const actualCIdx = halfSeats + cIdx;
                                const key1 = `${sec.id}-${rowLetter}-${actualCIdx}`;
                                const key2 = `${sec.id}-${rIdx}-${actualCIdx}`;
                                const isDeleted = Boolean(
                                  layout?.deletedSeats?.[key1] || layout?.deletedSeats?.[key2]
                                );

                                if (isDeleted) {
                                  return (
                                    <View
                                      key={cIdx}
                                      style={{ width: seatSize, height: seatSize }}
                                    />
                                  );
                                }

                                const seatNumDisplay = `${rowLetter}${activeSeatCounter++}`;
                                const seatIdentifier = `${sec.name} ${seatNumDisplay}`;
                                const isSold = isSeatBooked(sec.name, seatNumDisplay, key1, key2);
                                const isSelected =
                                  selectedSeats.includes(seatIdentifier) ||
                                  selectedSeats.includes(seatNumDisplay);

                                return (
                                  <TouchableOpacity
                                    key={cIdx}
                                    activeOpacity={0.7}
                                    disabled={isSold}
                                    onPress={() =>
                                      handleSeatPress(seatIdentifier, sec.price, isSold)
                                    }
                                    style={[
                                      styles.seatItem,
                                      {
                                        width: seatSize,
                                        height: seatSize,
                                        borderColor: isSelected
                                          ? colors.primary
                                          : isSold
                                          ? '#CBD5E1'
                                          : '#CBD5E1',
                                        backgroundColor: isSelected
                                          ? colors.primary
                                          : isSold
                                          ? isDarkMode
                                            ? '#334155'
                                            : '#E2E8F0'
                                          : '#FFFFFF',
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.seatItemText,
                                        {
                                          fontSize: seatFontSize,
                                          color: isSelected
                                            ? '#FFF'
                                            : isSold
                                            ? '#94A3B8'
                                            : '#334155',
                                        },
                                      ]}
                                    >
                                      {seatNumDisplay.replace(/[A-Z]/g, '')}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>

                            {/* Right Row Identifier */}
                            <Text
                              style={[
                                styles.rowLetterLabelRight,
                                {
                                  width: rowLabelWidth,
                                  fontSize: rowLabelFontSize,
                                  color: colors.textMuted,
                                },
                              ]}
                            >
                              {rowLetter}
                            </Text>
                          </View>
                        );
                      })}
                    </View>

                    {/* Section Spacer */}
                    <View style={{ height: 16 }} />
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View style={{ height: 100 }} />
        </ScrollView>
        </View>
      )}

      {/* Bottom Sticky Action Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={styles.bottomInfo}>
          <Text style={[styles.bottomHint, { color: colors.textMuted }]}>
            {selectedSeats.length > 0
              ? `${selectedSeats.length} Seat${selectedSeats.length > 1 ? 's' : ''} Selected`
              : 'Select your seats'}
          </Text>
          <Text style={[styles.bottomPrice, { color: colors.text }]}>
            ₹{selectedSeats.length > 0
              ? (totalSeatAmount + selectedSeats.length * 20 + Number((selectedSeats.length * 20 * 0.18).toFixed(2))).toFixed(2)
              : '0.00'}
          </Text>
          {selectedSeats.length > 0 ? (
            <Text numberOfLines={1} style={[styles.seatsListText, { color: colors.primary }]}>
              {selectedSeats.join(', ')} (₹20 fee + 18% GST incl.)
            </Text>
          ) : (
            <Text style={{ fontSize: 11, color: colors.textMuted }}>+ ₹20 fee & 18% GST/seat</Text>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={selectedSeats.length === 0}
          style={[
            styles.payBtn,
            {
              backgroundColor: selectedSeats.length > 0 ? colors.primary : colors.border,
            },
          ]}
          onPress={handleProceedToCheckout}
        >
          <Text
            style={[
              styles.payBtnText,
              { color: selectedSeats.length > 0 ? '#FFF' : colors.textMuted },
            ]}
          >
            Pay Now
          </Text>
          <Ionicons
            name="arrow-forward"
            size={18}
            color={selectedSeats.length > 0 ? '#FFF' : colors.textMuted}
          />
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
  badgeCount: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  controlHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  seatLegendBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  zoomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pinchHintText: {
    fontSize: 10,
    fontWeight: '600',
    marginRight: 4,
  },
  zoomBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomResetBtn: {
    paddingHorizontal: 8,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomResetText: {
    fontSize: 11,
    fontWeight: '700',
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
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  screenCurveWrapper: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  screenCurveLine: {
    width: '85%',
    height: 6,
    borderTopWidth: 3,
    borderRadius: 20,
    marginBottom: 8,
  },
  screenText: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  horizontalSeatScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  sectionsContainer: {
    alignItems: 'center',
  },
  sectionBlock: {
    marginBottom: 16,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
    minWidth: 320,
    marginBottom: 10,
  },
  secTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secColorDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  secNameText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pricePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pricePillText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
  },
  rowsWrapper: {
    // dynamically set gap
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLetterLabel: {
    fontWeight: '700',
    textAlign: 'center',
    marginRight: 6,
  },
  rowLetterLabelRight: {
    fontWeight: '700',
    textAlign: 'center',
    marginLeft: 6,
  },
  seatsBlock: {
    flexDirection: 'row',
  },
  seatItem: {
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatItemText: {
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  bottomInfo: {
    flex: 1,
    marginRight: 16,
  },
  bottomHint: {
    fontSize: 11,
    fontWeight: '500',
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 1,
  },
  seatsListText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  payBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
