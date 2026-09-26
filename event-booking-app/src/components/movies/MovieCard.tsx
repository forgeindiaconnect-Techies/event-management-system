import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MovieItem } from '../../services/movieApi';
import { useTheme } from '../../context/ThemeContext';

interface MovieCardProps {
  movie: MovieItem;
  onPress: () => void;
  variant?: 'grid' | 'carousel';
  isUpcoming?: boolean;
}

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - 48) / 2;

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onPress,
  variant = 'grid',
  isUpcoming = false,
}) => {
  const { colors, isDarkMode } = useTheme();

  const isCarousel = variant === 'carousel';

  const formatReleaseDate = (dateStr?: string) => {
    if (!dateStr) return 'Coming Soon';
    try {
      const d = new Date(dateStr);
      return `Releases ${d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
    } catch {
      return 'Coming Soon';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[
        styles.card,
        isCarousel ? styles.carouselCard : styles.gridCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.posterContainer}>
        <Image
          source={{
            uri:
              movie.posterUrl ||
              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
          }}
          style={isCarousel ? styles.carouselPoster : styles.gridPoster}
          resizeMode="cover"
        />

        {/* Upcoming or Rating Badge */}
        {isUpcoming ? (
          <View style={styles.upcomingBadge}>
            <Ionicons name="time" size={11} color="#B45309" />
            <Text style={styles.upcomingText}>UPCOMING</Text>
          </View>
        ) : movie.rating ? (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FBBF24" />
            <Text style={styles.ratingText}>{movie.rating.toFixed(1)}</Text>
          </View>
        ) : null}

        {/* Certificate Badge */}
        {movie.certificate ? (
          <View style={styles.certBadge}>
            <Text style={styles.certText}>{movie.certificate}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.infoContainer}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
          {movie.title}
        </Text>

        <View style={styles.metaRow}>
          <Text numberOfLines={1} style={[styles.langText, { color: isUpcoming ? '#D97706' : colors.primary }]}>
            {isUpcoming ? formatReleaseDate(movie.releaseDate) : movie.language || 'English'}
          </Text>
          {!isUpcoming && movie.durationMinutes ? (
            <>
              <Text style={[styles.dotText, { color: colors.textMuted }]}>•</Text>
              <Text style={[styles.durationText, { color: colors.textMuted }]}>
                {Math.floor(movie.durationMinutes / 60)}h {movie.durationMinutes % 60}m
              </Text>
            </>
          ) : null}
        </View>

        {movie.genre ? (
          <Text numberOfLines={1} style={[styles.genreText, { color: colors.textMuted }]}>
            {movie.genre}
          </Text>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          style={[
            styles.bookBtn,
            { backgroundColor: isUpcoming ? (isDarkMode ? '#374151' : '#F3F4F6') : colors.primary },
          ]}
        >
          <Ionicons
            name={isUpcoming ? 'information-circle-outline' : 'ticket'}
            size={14}
            color={isUpcoming ? (isDarkMode ? '#F3F4F6' : '#1F2937') : '#FFF'}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.bookBtnText,
              { color: isUpcoming ? (isDarkMode ? '#F3F4F6' : '#1F2937') : '#FFF' },
            ]}
          >
            {isUpcoming ? 'View Info' : 'Book'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  gridCard: {
    width: GRID_ITEM_WIDTH,
    marginBottom: 16,
  },
  carouselCard: {
    width: 170,
    marginRight: 14,
  },
  posterContainer: {
    position: 'relative',
    width: '100%',
  },
  gridPoster: {
    width: '100%',
    height: 220,
  },
  carouselPoster: {
    width: '100%',
    height: 210,
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  ratingText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  upcomingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  upcomingText: {
    color: '#92400E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  certBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  certText: {
    color: '#111827',
    fontSize: 10,
    fontWeight: '800',
  },
  infoContainer: {
    padding: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  langText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dotText: {
    fontSize: 11,
  },
  durationText: {
    fontSize: 11,
  },
  genreText: {
    fontSize: 11,
    marginBottom: 8,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 2,
  },
  bookBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
