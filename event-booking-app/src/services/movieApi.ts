import { setStorageItem, getStorageItem } from '../utils/storage';
import { getApiBaseUrl, smartFetch, API_BASE_URL } from '../config/apiConfig';

export interface TheaterItem {
  id: number;
  name: string;
  city: string;
  address?: string;
  theaterType?: string;
  convenienceFeePerTicket?: number;
  portalName?: string;
}

export interface ClassifiedMovies {
  nowShowing: MovieItem[];
  upcoming: MovieItem[];
  passed: MovieItem[];
}

export interface MovieItem {
  id: number;
  title: string;
  description?: string;
  posterUrl?: string;
  bannerUrl?: string;
  trailerUrl?: string;
  durationMinutes?: number;
  language?: string;
  certificate?: string;
  genre?: string;
  rating?: number;
  releaseDate?: string;
  castAndCrew?: {
    id: number;
    name: string;
    profileImageUrl?: string;
    primaryRole?: string;
  }[];
}

export interface ShowtimeItem {
  id: number;
  movieId?: number;
  movieTitle?: string;
  posterUrl?: string;
  showDate?: string;
  startTime?: string;
  endTime?: string;
  screen?: {
    id?: number;
    screenName?: string;
    screenType?: string;
    soundSystem?: string;
    projectionType?: string;
    totalCapacity?: number;
    layoutJson?: string;
    theater?: {
      id?: number;
      name?: string;
      city?: string;
      address?: string;
    };
  };
  theater?: {
    id?: number;
    name?: string;
    city?: string;
    address?: string;
    theaterPortal?: {
      id?: number;
      portalName?: string;
      city?: string;
    };
  };
  classPrices?: Record<string, number> | string;
}

export interface BookedMovieTicket {
  ticketId: string;
  movieTitle: string;
  posterUrl?: string;
  screenName: string;
  theaterName: string;
  date: string;
  time: string;
  seats: string[];
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMode: string;
  bookingRef: string;
  createdAt: string;
}

function normalizeMediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const currentOrigin = getApiBaseUrl().replace('/api', '');
  return url
    .replace('http://localhost:8081', currentOrigin)
    .replace('http://127.0.0.1:8081', currentOrigin);
}

// Fallback high-quality curated movie catalogue matching active database
const FALLBACK_MOVIES: MovieItem[] = [
  {
    id: 3,
    title: "Paradise",
    description: "An Indian tourist couple (Keshav and Ammu) travel to the Sri Lankan highlands to celebrate their 5th wedding anniversary, but unexpected events reveal deep cracks in their relationship.",
    posterUrl: "https://cdn.district.in/movies-assets/images/cinema/The-Paradise_Poster-2c67d280-75d9-11f0-8df3-db01d1baa444.jpg",
    bannerUrl: "https://cdn.district.in/movies-assets/images/cinema/The-Paradise_Poster-2c67d280-75d9-11f0-8df3-db01d1baa444.jpg",
    trailerUrl: "https://youtu.be/LMqE7OAewkg?si=qcp2f_I42pttYOrm",
    durationMinutes: 180,
    language: "Tamil, Telugu, Malayalam, Hindi, Kannada",
    certificate: "A",
    genre: "Action, Drama, Adventure",
    rating: 9.1,
    releaseDate: "2026-09-24",
    castAndCrew: [
      {
        id: 7,
        name: "Anirudh Ravichander",
        primaryRole: "Music Composer",
        profileImageUrl: "https://cdn-images.dzcdn.net/images/artist/9da0a547b39e99bc35c6a9724aef91bf/1900x1900-000000-80-0-0.jpg",
      },
      {
        id: 5,
        name: "Nani",
        primaryRole: "Actor",
        profileImageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRI_rUQvlqamaYOQzZ-9S0dlj521F8KWCxUF-J2kADeUU8GCTfrnSwBkTA&s=10",
      },
      {
        id: 6,
        name: "Kayadu Lohar",
        primaryRole: "Actor",
        profileImageUrl: "https://m.media-amazon.com/images/M/MV5BZjZlYzMyMWMtMmIxYS00NDkyLTk4NDYtY2Y3ZTFiN2QyZjNmXkEyXkFqcGc@._V1_.jpg",
      },
    ],
  },
  {
    id: 4,
    title: "Avengers: Endgame Encore",
    description: "The narrative follows the core events of 2019's Avengers: Endgame. After Thanos wipes out half of all life in the universe, the remaining heroes live in a fractured world of grief. Refusing to accept defeat, the surviving Avengers execute a daring 'Time Heist' using the Quantum Realm to gather the Infinity Stones from the past.",
    posterUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLSGwEJkp9kLbtt0OV2EZIuF8ut9enAVGG5TyB5kFYsg&s=10",
    bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    trailerUrl: "https://youtu.be/-cQGPjJQz8o?si=g9fdcgwPwd35FQ0t",
    durationMinutes: 185,
    language: "Tamil, English, Malayalam, Telugu, Kannada",
    certificate: "U/A",
    genre: "Action, Adventure, Fantasy",
    rating: 9.4,
    releaseDate: "2026-09-25",
    castAndCrew: [
      {
        id: 8,
        name: "Robert Downey Jr.",
        primaryRole: "Actor",
        profileImageUrl: "https://m.media-amazon.com/images/M/MV5BNzg1MTUyNDYxOF5BMl5BanBnXkFtZTgwNTQ4MTE2MjE@._V1_.jpg",
      },
      {
        id: 9,
        name: "Chris Evans",
        primaryRole: "Actor",
        profileImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Chris_Evans_at_the_2025_Toronto_International_Film_Festival_%28cropped%29.jpg/250px-Chris_Evans_at_the_2025_Toronto_International_Film_Festival_%28cropped%29.jpg",
      },
      {
        id: 10,
        name: "Scarlett Johansson",
        primaryRole: "Actor",
        profileImageUrl: "https://www.refinery29.com/images/10549259.jpg?format=webp&width=720&height=864&quality=85",
      },
    ],
  },
];

/**
 * Fetch all movies directly from the database (/api/movies)
 */
export async function fetchMovies(): Promise<MovieItem[]> {
  try {
    const res = await smartFetch('/movies');
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.content || [];
      if (list.length > 0) {
        return list.map((m: any) => ({
          id: m.id,
          title: (m.title || 'Untitled Movie').trim(),
          description: m.synopsis || m.description || "Experience the drama, thrill, and stunning spectacle on the big screen.",
          posterUrl: normalizeMediaUrl(m.posterUrl) || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
          bannerUrl: normalizeMediaUrl(m.posterUrl) || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
          trailerUrl: m.trailerUrl || "",
          durationMinutes: m.durationMinutes || 150,
          language: m.language && m.language.trim() ? m.language : "Tamil",
          certificate: m.certification || m.certificate || "UA",
          genre: m.genre && m.genre.trim() ? m.genre : "Action / Drama",
          rating: m.rating || 9.0,
          releaseDate: m.releaseDate || new Date().toISOString().split('T')[0],
          castAndCrew: Array.isArray(m.castAndCrew)
            ? m.castAndCrew.map((c: any) => ({
                id: c.id,
                name: c.name,
                profileImageUrl: normalizeMediaUrl(c.profileImageUrl),
                primaryRole: c.primaryRole || 'Actor',
              }))
            : [],
        }));
      }
    }
  } catch (err) {
    console.log('Error fetching movies from database:', err);
  }
  return FALLBACK_MOVIES;
}

/**
 * Fetch a single movie by ID from the database
 */
export async function fetchMovieById(id: string | number): Promise<MovieItem | null> {
  try {
    const res = await smartFetch(`/movies/${id}`);
    if (res.ok) {
      const m = await res.json();
      return {
        id: m.id,
        title: (m.title || '').trim(),
        description: m.synopsis || m.description || "",
        posterUrl: normalizeMediaUrl(m.posterUrl) || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
        bannerUrl: normalizeMediaUrl(m.posterUrl) || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
        trailerUrl: m.trailerUrl || "",
        durationMinutes: m.durationMinutes || 150,
        language: m.language && m.language.trim() ? m.language : "Tamil",
        certificate: m.certification || m.certificate || "UA",
        genre: m.genre && m.genre.trim() ? m.genre : "Action / Drama",
        rating: m.rating || 9.0,
        releaseDate: m.releaseDate || new Date().toISOString().split('T')[0],
        castAndCrew: Array.isArray(m.castAndCrew)
          ? m.castAndCrew.map((c: any) => ({
              id: c.id,
              name: c.name,
              profileImageUrl: normalizeMediaUrl(c.profileImageUrl),
              primaryRole: c.primaryRole || 'Actor',
            }))
          : [],
      };
    }
  } catch (err) {
    console.log('Error fetching movie by ID:', err);
  }

  const all = await fetchMovies();
  const found = all.find((m) => String(m.id) === String(id));
  return found || null;
}

/**
 * Classify movies into Now Showing, Upcoming, and Passed using the exact web rules.
 * - Now Showing: Has active, future or current scheduled showtimes in database
 * - Upcoming: No active showtimes, releaseDate > today (strictly in future)
 * - Passed: No active showtimes, releaseDate <= today (excluded from booking grid)
 */
export async function fetchClassifiedMovies(): Promise<ClassifiedMovies> {
  const [allMovies, publicShowtimes] = await Promise.all([
    fetchMovies(),
    fetchPublicShowtimes(),
  ]);

  const todayStr = new Date().toISOString().split('T')[0];
  const cutoffTime = new Date();
  cutoffTime.setMinutes(cutoffTime.getMinutes() - 15);

  // Filter out passed showtimes (exact web cutoff logic)
  const activeShowtimes = publicShowtimes.filter((st) => {
    if (!st.showDate || !st.startTime) return true;
    try {
      let showDateStr = st.showDate;
      if (!showDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const year = new Date().getFullYear();
        if (!showDateStr.includes(String(year))) showDateStr = `${showDateStr} ${year}`;
      }
      const showDateTime = new Date(showDateStr);
      const timeMatch = st.startTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (timeMatch && !isNaN(showDateTime.getTime())) {
        let hours = parseInt(timeMatch[1], 10);
        const mins = parseInt(timeMatch[2], 10);
        const ampm = timeMatch[3];
        if (ampm && ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
        showDateTime.setHours(hours, mins, 0, 0);
        return showDateTime >= cutoffTime;
      }
    } catch {
      return true;
    }
    return true;
  });

  const nowShowing: MovieItem[] = [];
  const upcoming: MovieItem[] = [];
  const passed: MovieItem[] = [];

  allMovies.forEach((m) => {
    const title = (m.title || '').trim().toLowerCase();
    const hasShowtimes = activeShowtimes.some((st) => {
      if (st.movieId && m.id && String(st.movieId) === String(m.id)) return true;
      const stTitle = (st.movieTitle || '').trim().toLowerCase();
      return stTitle === title || stTitle.includes(title) || title.includes(stTitle);
    });

    if (hasShowtimes) {
      nowShowing.push(m);
    } else if (m.releaseDate && m.releaseDate > todayStr) {
      upcoming.push(m);
    } else {
      passed.push(m);
    }
  });

  // Guarantee any movie present in activeShowtimes is included in nowShowing (exact webapp logic)
  const existingTitles = new Set(nowShowing.map((m) => (m.title || '').trim().toLowerCase()));
  activeShowtimes.forEach((st) => {
    const stTitle = (st.movieTitle || '').trim();
    if (!stTitle) return;
    const titleLower = stTitle.toLowerCase();
    if (!existingTitles.has(titleLower)) {
      existingTitles.add(titleLower);
      nowShowing.push({
        id: st.movieId || st.id,
        title: stTitle,
        description: "Catch the latest blockbusters and cinema releases in theaters.",
        posterUrl: st.posterUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
        bannerUrl: st.posterUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
        genre: (st as any).genre || (st as any).movieGenre || "Action / Drama",
        language: (st as any).language || "Tamil",
        durationMinutes: 150,
        certificate: "UA",
        rating: 8.6,
        releaseDate: st.showDate || todayStr,
      });
    }
  });

  return { nowShowing, upcoming, passed };
}

/**
 * Fetch all registered theaters from the database (/api/theater/list)
 */
export async function fetchTheaters(): Promise<TheaterItem[]> {
  try {
    const res = await smartFetch('/theater/list');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((t: any) => {
          const portalName = t.theaterPortal?.portalName || t.portal?.portalName || t.name;
          const city = t.theaterPortal?.city || t.city || "Thirupathur";
          return {
            id: t.id,
            name: portalName,
            city,
            address: t.address || `${portalName}, ${city}`,
            theaterType: t.theaterType || (t.theaterPortal?.theaterType) || 'MULTIPLEX',
            convenienceFeePerTicket: t.convenienceFeePerTicket || 25,
            portalName,
          };
        });
      }
    }
  } catch (err) {
    console.log('Error fetching theaters list from database:', err);
  }

  return [
    { id: 4, name: "Gopal Multiplex", city: "Thirupathur", address: "Gopal Complex, Thirupathur" },
    { id: 2, name: "Naveen Cinemas", city: "Chennai", address: "Anna Salai, Chennai" },
    { id: 3, name: "Thunder Cinemas", city: "Chennai", address: "OMR, Chennai" },
    { id: 5, name: "PVR Test Cinema", city: "Chennai", address: "Velachery, Chennai" },
  ];
}

/**
 * Fetch all public showtimes directly from the database (/api/theater/public/showtimes)
 */
export async function fetchPublicShowtimes(): Promise<ShowtimeItem[]> {
  try {
    // 1. Fetch public showtimes from DB
    const res = await smartFetch('/theater/public/showtimes');
    let dbShowtimes: any[] = [];
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) dbShowtimes = data;
    }

    // 2. Fetch theaters for accurate portal naming
    const theatersList = await fetchTheaters();
    const theaterMap = new Map<string, TheaterItem>();
    theatersList.forEach(t => {
      theaterMap.set(String(t.id), t);
    });

    if (dbShowtimes.length > 0) {
      return dbShowtimes.map((st: any) => {
        const thId = st.theater?.id || st.theaterId || st.screen?.theater?.id;
        const matchedTheater = thId ? theaterMap.get(String(thId)) : null;

        const theaterName =
          matchedTheater?.name ||
          st.theater?.theaterPortal?.portalName ||
          st.theater?.name ||
          "Gopal Multiplex";

        const theaterCity =
          matchedTheater?.city ||
          st.theater?.theaterPortal?.city ||
          st.theater?.city ||
          "Thirupathur";

        return {
          id: st.id,
          movieId: st.movieId,
          movieTitle: (st.movieTitle || "").trim(),
          posterUrl: normalizeMediaUrl(st.posterUrl),
          showDate: st.showDate || new Date().toISOString().split('T')[0],
          startTime: st.startTime ? (st.startTime.length === 8 ? st.startTime.substring(0, 5) : st.startTime) : "18:30",
          endTime: st.endTime,
          screen: {
            id: st.screen?.id || 1,
            screenName: st.screen?.screenName || "SILVI(screen1)",
            screenType: st.screen?.screenType || "4K Laser • Dolby Atmos",
            soundSystem: st.screen?.soundSystem || "Dolby Atmos",
            projectionType: st.screen?.projectionType || "4K Dual Laser",
            totalCapacity: st.screen?.totalCapacity || 418,
            layoutJson: st.screen?.layoutJson,
            theater: {
              id: thId || 4,
              name: theaterName,
              city: theaterCity,
              address: matchedTheater?.address || `${theaterName}, ${theaterCity}`,
            },
          },
          theater: {
            id: thId || 4,
            name: theaterName,
            city: theaterCity,
            address: matchedTheater?.address || `${theaterName}, ${theaterCity}`,
          },
          classPrices: st.classPrices || "Balcony(220),Gold(220),Silver(190)",
        };
      });
    }
  } catch (err) {
    console.log('Error fetching showtimes from database:', err);
  }

  // Realistic fallback showtimes matching active database (Naveen Cinemas)
  return [
    {
      id: 23,
      movieId: 3,
      movieTitle: "Paradise",
      posterUrl: "https://cdn.district.in/movies-assets/images/cinema/The-Paradise_Poster-2c67d280-75d9-11f0-8df3-db01d1baa444.jpg",
      showDate: new Date().toISOString().split('T')[0],
      startTime: "09:00",
      screen: {
        id: 5,
        screenName: "SILVI(screen1)",
        screenType: "4K Dual Laser (IMAX / RGB) • Dolby Atmos (7.1.4 Surround)",
        soundSystem: "Dolby Atmos (7.1.4 Surround)",
        projectionType: "4K Dual Laser",
        theater: {
          id: 2,
          name: "Naveen Cinemas",
          city: "Chennai",
          address: "Naveen Cinemas, Chennai",
        },
      },
      theater: {
        id: 2,
        name: "Naveen Cinemas",
        city: "Chennai",
        address: "Naveen Cinemas, Chennai",
      },
      classPrices: "balcony(220),gold(190),silver(160)",
    },
    {
      id: 24,
      movieId: 3,
      movieTitle: "Paradise",
      posterUrl: "https://cdn.district.in/movies-assets/images/cinema/The-Paradise_Poster-2c67d280-75d9-11f0-8df3-db01d1baa444.jpg",
      showDate: new Date().toISOString().split('T')[0],
      startTime: "13:15",
      screen: {
        id: 5,
        screenName: "SILVI(screen1)",
        screenType: "4K Dual Laser (IMAX / RGB) • Dolby Atmos (7.1.4 Surround)",
        soundSystem: "Dolby Atmos (7.1.4 Surround)",
        projectionType: "4K Dual Laser",
        theater: {
          id: 2,
          name: "Naveen Cinemas",
          city: "Chennai",
          address: "Naveen Cinemas, Chennai",
        },
      },
      theater: {
        id: 2,
        name: "Naveen Cinemas",
        city: "Chennai",
        address: "Naveen Cinemas, Chennai",
      },
      classPrices: "balcony(220),gold(190),silver(160)",
    },
    {
      id: 22,
      movieId: 4,
      movieTitle: "Avengers: Endgame Encore",
      posterUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLSGwEJkp9kLbtt0OV2EZIuF8ut9enAVGG5TyB5kFYsg&s=10",
      showDate: new Date().toISOString().split('T')[0],
      startTime: "13:15",
      screen: {
        id: 6,
        screenName: "LOKI(screen2)",
        screenType: "4K Dual Laser (IMAX / RGB) • Dolby Atmos (7.1.4 Surround) • 4DX",
        soundSystem: "Dolby Atmos (7.1.4 Surround)",
        projectionType: "4K Dual Laser",
        theater: {
          id: 2,
          name: "Naveen Cinemas",
          city: "Chennai",
          address: "Naveen Cinemas, Chennai",
        },
      },
      theater: {
        id: 2,
        name: "Naveen Cinemas",
        city: "Chennai",
        address: "Naveen Cinemas, Chennai",
      },
      classPrices: "gold(190),silver(160)",
    },
    {
      id: 21,
      movieId: 4,
      movieTitle: "Avengers: Endgame Encore",
      posterUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLSGwEJkp9kLbtt0OV2EZIuF8ut9enAVGG5TyB5kFYsg&s=10",
      showDate: new Date().toISOString().split('T')[0],
      startTime: "15:30",
      screen: {
        id: 6,
        screenName: "LOKI(screen2)",
        screenType: "4K Dual Laser (IMAX / RGB) • Dolby Atmos (7.1.4 Surround) • 4DX",
        soundSystem: "Dolby Atmos (7.1.4 Surround)",
        projectionType: "4K Dual Laser",
        theater: {
          id: 2,
          name: "Naveen Cinemas",
          city: "Chennai",
          address: "Naveen Cinemas, Chennai",
        },
      },
      theater: {
        id: 2,
        name: "Naveen Cinemas",
        city: "Chennai",
        address: "Naveen Cinemas, Chennai",
      },
      classPrices: "gold(190),silver(160)",
    },
    {
      id: 25,
      movieId: 4,
      movieTitle: "Avengers: Endgame Encore",
      posterUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLSGwEJkp9kLbtt0OV2EZIuF8ut9enAVGG5TyB5kFYsg&s=10",
      showDate: new Date().toISOString().split('T')[0],
      startTime: "21:05",
      screen: {
        id: 5,
        screenName: "SILVI(screen1)",
        screenType: "4K Dual Laser (IMAX / RGB) • Dolby Atmos (7.1.4 Surround)",
        soundSystem: "Dolby Atmos (7.1.4 Surround)",
        projectionType: "4K Dual Laser",
        theater: {
          id: 2,
          name: "Naveen Cinemas",
          city: "Chennai",
          address: "Naveen Cinemas, Chennai",
        },
      },
      theater: {
        id: 2,
        name: "Naveen Cinemas",
        city: "Chennai",
        address: "Naveen Cinemas, Chennai",
      },
      classPrices: "balcony(220),gold(190),silver(160)",
    }
  ];
}

// Standard 12-hour Indian Cinema AM/PM time formatter matching web
export function formatIndianTime(timeStr?: string): string {
  if (!timeStr) return '';
  const str = String(timeStr).trim();
  if (/\b(AM|PM)\b/i.test(str)) {
    return str;
  }
  const match = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return str;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');
  return `${hoursStr}:${minutes} ${ampm}`;
}

// Screen tech resolver matching web
export function getScreenTech(st: any): string {
  if (!st) return '2D';
  const scr = st.screen || {};
  const scrFormat = String(scr.screenFormat || '').toUpperCase();
  const sound = String(scr.soundSystem || '').toUpperCase();
  const projection = String(scr.projectionType || '').toUpperCase();
  const rawType = String(scr.screenType || st.screenType || '').toUpperCase();
  const scrName = String(scr.screenName || st.screenName || '').toUpperCase();

  if (scrFormat.includes('4DX') || rawType.includes('4DX') || scrName.includes('4DX')) {
    return '4DX';
  }
  if ((scrFormat.includes('IMAX') || scrName.includes('IMAX')) && (scrFormat.includes('3D') || rawType.includes('3D'))) {
    return 'IMAX 3D';
  }
  if (scrFormat.includes('IMAX') || scrName.includes('IMAX')) {
    return 'IMAX 2D';
  }
  if ((scrFormat.includes('3D') || rawType.includes('3D')) && !scrFormat.includes('2.39') && !rawType.includes('2.39')) {
    return '3D';
  }
  const hasDolbyAtmos = sound.includes('DOLBY ATMOS') || rawType.includes('DOLBY ATMOS');
  const has4K = projection.includes('4K') || rawType.includes('4K');

  if (hasDolbyAtmos && has4K) return '4K DOLBY ATMOS';
  if (hasDolbyAtmos) return 'DOLBY ATMOS';
  if (sound.includes('7.1')) return has4K ? '4K DOLBY 7.1' : 'DOLBY 7.1';
  if (has4K) return '4K 2D';
  return '2D';
}

// Section price resolver matching web
export function getSectionPrice(
  secName: string,
  classPricesStr?: Record<string, number> | string,
  fallback = 160
): number {
  if (!classPricesStr) return fallback;
  if (typeof classPricesStr === 'object') {
    return classPricesStr[secName] || classPricesStr['Normal'] || fallback;
  }
  const str = String(classPricesStr).toLowerCase();
  const target = (secName || '').toLowerCase().trim();

  const regex = new RegExp(`${target}[^0-9]*([0-9]+)`, 'i');
  const match = str.match(regex);
  if (match && match[1]) {
    return Number(match[1]);
  }

  const anyNum = str.match(/\d+/);
  return anyNum ? Number(anyNum[0]) : fallback;
}

/**
 * Fetch screen layout JSON from the database (/api/theater/screens/{id}/layout)
 */
export async function fetchScreenLayout(screenId: number | string): Promise<any | null> {
  try {
    const res = await smartFetch(`/theater/screens/${screenId}/layout`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.sections)) {
        return data;
      }
    }
  } catch (err) {
    console.log('Error fetching screen layout from backend:', err);
  }
  return null;
}

/**
 * Canonical section resolver matching web platform
 */
export function getCanonicalSection(str: string): string {
  if (!str) return 'gold';
  const s = String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s.includes('balcony')) return 'balcony';
  if (s.includes('gold') || s.includes('premium')) return 'gold';
  if (s.includes('silver') || s.includes('normal') || s.includes('classic')) return 'silver';
  return s;
}

/**
 * Fetch booked seats from the database (/api/theater/showtimes/{id}/booked-seats)
 * and sales history for complete live seat occupancy matching web
 */
export async function fetchBookedSeats(showtimeId: number | string): Promise<string[]> {
  const bookedSet = new Set<string>();

  const addSeatVariants = (seatStr: string) => {
    if (!seatStr) return;
    const trimmed = seatStr.trim();
    bookedSet.add(trimmed);

    // Try parsing: e.g. "Balcony A7" or "Gold C6"
    const match = trimmed.match(/^([a-zA-Z\s]+)?\s*([A-Z])(\d+)$/i) || trimmed.match(/([a-zA-Z\s]+)?\s*([A-Z])(\d+)/i);
    if (match) {
      const rawSec = (match[1] || '').trim();
      const seatN = `${match[2]}${match[3]}`;
      if (rawSec) {
        const cleanSec = rawSec.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const cSec = getCanonicalSection(rawSec);
        bookedSet.add(`${rawSec} ${seatN}`);
        bookedSet.add(`${cleanSec} ${seatN}`);
        bookedSet.add(`${cleanSec}-${seatN}`);
        bookedSet.add(`${cSec} ${seatN}`);
        bookedSet.add(`${cSec}-${seatN}`);
      }
    }
  };

  // 1. Direct booked-seats endpoint
  try {
    const res = await smartFetch(`/theater/showtimes/${showtimeId}/booked-seats`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        data.forEach((k: string) => addSeatVariants(String(k)));
      }
    }
  } catch (err) {
    console.log('Error fetching booked seats endpoint:', err);
  }

  // 2. Scan sales history
  try {
    const res = await smartFetch(`/theater/sales-history`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        data.forEach((sale: any) => {
          if (!sale || sale.status === 'CANCELLED' || sale.status === 'REFUNDED') return;
          if (sale.showtimeId && String(sale.showtimeId) === String(showtimeId)) {
            const seatsList = Array.isArray(sale.seats)
              ? sale.seats
              : typeof sale.seats === 'string'
              ? sale.seats.split(',').map((s: string) => s.trim())
              : [];
            seatsList.forEach((seatStr: string) => addSeatVariants(seatStr));
          }
        });
      }
    }
  } catch (err) {
    console.log('Error scanning sales history for booked seats:', err);
  }

  return Array.from(bookedSet);
}

/**
 * Fetch total booked seats map grouped by showtimeId from sales history
 */
export async function fetchShowtimeOccupancyCounts(): Promise<Record<string | number, number>> {
  const countMap: Record<string | number, number> = {};

  try {
    const res = await smartFetch('/theater/sales-history');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        data.forEach((sale: any) => {
          if (!sale || sale.status === 'CANCELLED' || sale.status === 'REFUNDED') return;
          const sId = sale.showtimeId;
          if (!sId) return;
          const seats = Array.isArray(sale.seats)
            ? sale.seats
            : typeof sale.seats === 'string'
            ? sale.seats.split(',').filter(Boolean)
            : [];
          const count = seats.length || 1;
          countMap[sId] = (countMap[sId] || 0) + count;
        });
      }
    }
  } catch (err) {
    console.log('Error fetching sales history occupancy counts:', err);
  }

  return countMap;
}

export interface ShowtimeAvailability {
  status: 'AVAILABLE' | 'FAST_FILLING' | 'ALMOST_FULL' | 'SOLD_OUT';
  label: string;
  color: string;
  isSoldOut: boolean;
  occupancyPercent: number;
}

/**
 * Resolve availability status according to exact business rules:
 * - 100% full -> "Sold Out" (Gray #9CA3AF)
 * - >= 70% full -> "70%+ Full" (RED #EF4444)
 * - >= 40% full -> "Fast Filling" (AMBER #F59E0B)
 * - < 40% full -> "Available" (GREEN #10B981)
 */
export function getShowtimeAvailability(
  bookedCount: number = 0,
  capacity: number = 418
): ShowtimeAvailability {
  const cap = capacity > 0 ? capacity : 100;
  const percent = Math.min(100, Math.round((bookedCount / cap) * 100));

  // 1. Sold Out: 100% filled or bookedCount >= cap
  if (bookedCount >= cap || percent >= 100) {
    return {
      status: 'SOLD_OUT',
      label: 'Sold Out',
      color: '#9CA3AF',
      isSoldOut: true,
      occupancyPercent: 100,
    };
  }

  // 2. Heavy occupancy >= 70%: RED
  if (percent >= 70) {
    return {
      status: 'ALMOST_FULL',
      label: '70%+ Full',
      color: '#EF4444',
      isSoldOut: false,
      occupancyPercent: percent,
    };
  }

  // 3. Fast Filling: Only when 40% to 69% of the hall is booked
  if (percent >= 40) {
    return {
      status: 'FAST_FILLING',
      label: 'Fast Filling',
      color: '#F59E0B',
      isSoldOut: false,
      occupancyPercent: percent,
    };
  }

  // 4. Available: GREEN (Default for any showtime with plenty of seats available)
  return {
    status: 'AVAILABLE',
    label: 'Available',
    color: '#10B981',
    isSoldOut: false,
    occupancyPercent: percent,
  };
}

/**
 * Book seats on the database server (/api/theater/showtimes/{id}/book-seats)
 */
export async function bookSeatsOnServer(showtimeId: number | string, seatKeys: string[]): Promise<boolean> {
  try {
    const res = await smartFetch(`/theater/showtimes/${showtimeId}/book-seats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seatKeys }),
    });
    return res.ok;
  } catch (err) {
    console.log('Error booking seats on server:', err);
    return true; // Still allow local offline flow
  }
}

/**
 * Record sale on server (/api/theater/sales-history)
 */
export async function recordMovieSaleOnServer(ticketData: any): Promise<boolean> {
  try {
    const res = await smartFetch(`/theater/sales-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData),
    });
    return res.ok;
  } catch (err) {
    console.log('Error recording movie sale on server:', err);
    return true;
  }
}

const MOVIE_TICKETS_STORAGE_KEY = 'my_movie_tickets';

export async function saveLocalMovieTicket(ticket: BookedMovieTicket): Promise<void> {
  try {
    const existing = await getLocalMovieTickets();
    const updated = [ticket, ...existing.filter(t => t.ticketId !== ticket.ticketId)];
    await setStorageItem(MOVIE_TICKETS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.log('Failed to save local movie ticket:', err);
  }
}

export async function getLocalMovieTickets(): Promise<BookedMovieTicket[]> {
  try {
    const raw = await getStorageItem(MOVIE_TICKETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.log('Failed to load local movie tickets:', err);
    return [];
  }
}
