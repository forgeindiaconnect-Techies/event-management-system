import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  ImageBackground,
  Dimensions,
  Modal,
  Animated,
  Alert,
  Linking,
  KeyboardAvoidingView,
} from "react-native";
import * as Location from "expo-location";
import { useWishlist } from "../context/WishlistContext";
import { useTheme } from "../context/ThemeContext";
import { getStorageItem, setStorageItem, deleteStorageItem } from "../utils/storage";
import { BlurView } from "expo-blur";
import { fetchMovies, fetchClassifiedMovies, MovieItem } from "../services/movieApi";
import { MovieCard } from "../components/movies/MovieCard";
import { useMovieBooking } from "../context/MovieBookingContext";
import { smartFetch, getApiBaseUrl, setCustomApiBaseUrl, resetApiBaseUrl, DEFAULT_SERVER_URL } from "../config/apiConfig";

// Exactly matching the webapp's EVENT_CATEGORIES
const CATEGORIES = [
  { label: "All Events", icon: "apps-outline", keywords: [] },
  {
    label: "Education",
    icon: "school-outline",
    keywords: [
      "education",
      "college fest",
      "seminar",
      "workshop",
      "symposium",
      "webinar",
      "conference",
    ],
  },
  {
    label: "Technology & Start up",
    icon: "laptop-outline",
    keywords: [
      "technology",
      "technical",
      "tech",
      "hackathon",
      "coding",
      "software",
      "ai",
      "startup",
      "product launch",
    ],
  },
  {
    label: "Business & Career",
    icon: "briefcase-outline",
    keywords: [
      "business",
      "corporate",
      "career",
      "job fair",
      "career fair",
      "placement",
      "training",
      "networking",
      "alumni",
      "exhibition",
      "expo",
    ],
  },
  {
    label: "Health & Fitness",
    icon: "fitness-outline",
    keywords: [
      "health",
      "medical",
      "fitness",
      "wellness",
      "yoga",
      "marathon",
      "cycling",
      "zumba",
      "gym",
      "blood donation",
    ],
  },
  {
    label: "Food & Lifestyle",
    icon: "restaurant-outline",
    keywords: ["food", "cooking", "restaurant", "catering", "lifestyle"],
  },
  {
    label: "Music & Entertainment",
    icon: "musical-notes-outline",
    keywords: [
      "music",
      "concert",
      "festival",
      "dj",
      "dance",
      "comedy",
      "film",
      "movie",
      "show",
      "cultural",
      "entertainment",
    ],
  },
  {
    label: "Sports",
    icon: "trophy-outline",
    keywords: ["sport", "physical", "tournament", "championship", "game"],
  },
  {
    label: "Community & Social",
    icon: "people-outline",
    keywords: [
      "community",
      "public awareness",
      "charity",
      "donation",
      "social",
      "meetup",
    ],
  },
];

const MOVIE_LANGUAGES = ["All", "Tamil", "English", "Telugu", "Hindi", "Malayalam", "Kannada"];
const MOVIE_FORMATS = ["All", "2D", "3D", "IMAX 3D", "4DX"];
const MOVIE_GENRES = ["All Genres", "Action", "Drama", "Comedy", "Thriller", "Horror", "Sci-Fi", "Romance", "Adventure", "Animation"];

const EVENT_BANNERS = [
  {
    id: 1,
    tag: "EVENT FESTIVAL",
    title: "Up to 30% OFF on selected events",
    image:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: 2,
    tag: "MUSIC FIESTA",
    title: "Get 50% OFF on early bird tickets",
    image:
      "https://images.unsplash.com/photo-1540039155732-684735035727?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: 3,
    tag: "TECH SUMMIT",
    title: "Flat ₹500 OFF on group bookings",
    image:
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1000&auto=format&fit=crop",
  },
];

function eventMatchesCategory(event: any, category: (typeof CATEGORIES)[0]) {
  if (category.label === "All Events") return true;
  const text = `${event.eventType || ""} ${event.eventName || ""}`.toLowerCase();
  return category.keywords.some((kw) => text.includes(kw));
}

export default function LandingScreen() {
  const { likedEvents, toggleLike } = useWishlist();
  const { isDarkMode, colors, toggleTheme } = useTheme();
  const { selectMovie } = useMovieBooking();

  // 3-Section Dashboard Tab
  const [activeNavTab, setActiveNavTab] = useState<'foryou' | 'movies' | 'events'>('foryou');

  const [activeCategory, setActiveCategory] = useState("All Events");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBanner, setActiveBanner] = useState(0);
  const [activeEventBanner, setActiveEventBanner] = useState(0);

  // For You Filter State
  const [forYouFilter, setForYouFilter] = useState<"all" | "movies" | "events" | "today" | "free">("all");

  // Movie Filter State
  const [selectedMovieLang, setSelectedMovieLang] = useState("All");
  const [selectedMovieGenre, setSelectedMovieGenre] = useState("All Genres");
  const [selectedMovieFormat, setSelectedMovieFormat] = useState("All");

  const [filterVisible, setFilterVisible] = useState(false);
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterDate, setFilterDate] = useState("All");
  const [filterPlace, setFilterPlace] = useState("");

  const [events, setEvents] = useState<any[]>([]);
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [nowShowingMovies, setNowShowingMovies] = useState<MovieItem[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<MovieItem[]>([]);
  const [movieSubTab, setMovieSubTab] = useState<"now_showing" | "upcoming">("now_showing");
  const [loading, setLoading] = useState(true);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<string>("Locating...");

  const dynamicBanners = useMemo(() => {
    const m1 = nowShowingMovies[0] || movies[0];
    const m2 = upcomingMovies[0] || movies[1];
    return [
      {
        id: 1,
        tag: "NOW IN THEATERS",
        title: m1 ? `${m1.title} now in Theaters` : "Paradise now in Theaters",
        image: m1?.bannerUrl || m1?.posterUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop",
        type: "movie",
        movieId: m1?.id,
        isUpcoming: false,
      },
      {
        id: 2,
        tag: "FESTIVAL PASS",
        title: "Get 50% OFF on early bird festival & hackathon passes",
        image: "https://images.unsplash.com/photo-1540039155732-684735035727?q=80&w=1000&auto=format&fit=crop",
        type: "event",
      },
      {
        id: 3,
        tag: "CINEMA CARNIVAL",
        title: "Flat ₹150 OFF on VIP Recliner movie seats",
        image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000&auto=format&fit=crop",
        type: "movie",
      },
    ];
  }, [nowShowingMovies, upcomingMovies, movies]);
  const [userCity, setUserCity] = useState<string>("");
  const [userName, setUserName] = useState<string>("Guest");
  const [userEmail, setUserEmail] = useState<string>("Not provided");
  const [userPhone, setUserPhone] = useState<string>("Not provided");

  // Profile Drawer State
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [helpCenterVisible, setHelpCenterVisible] = useState(false);
  const drawerSlideAnim = useMemo(() => new Animated.Value(-340), []);

  // Server Connection Configuration State
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(getApiBaseUrl());
  const [testingServer, setTestingServer] = useState(false);
  const [serverTestStatus, setServerTestStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isServerConnected, setIsServerConnected] = useState<boolean | null>(null);

  const handleTestServerConnection = async () => {
    setTestingServer(true);
    setServerTestStatus(null);
    try {
      let target = serverUrlInput.trim().replace(/\/+$/, "");
      if (!target.endsWith("/api") && !target.includes("/api/")) {
        target = `${target}/api`;
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${target}/movies`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        const count = Array.isArray(data) ? data.length : 0;
        setServerTestStatus({
          success: true,
          message: `Connected successfully! Found ${count} movie(s) in active database.`,
        });
      } else {
        setServerTestStatus({
          success: false,
          message: `Server reachable but returned HTTP ${res.status}.`,
        });
      }
    } catch (e: any) {
      setServerTestStatus({
        success: false,
        message: `Connection failed: ${e.message || "Network request failed"}. Ensure phone and PC are on the same Wi-Fi.`,
      });
    } finally {
      setTestingServer(false);
    }
  };

  const handleSaveServerUrl = async () => {
    try {
      const updated = await setCustomApiBaseUrl(serverUrlInput);
      setServerUrlInput(updated);
      setServerModalVisible(false);
      Alert.alert("Server Configured", `App will now connect to:\n${updated}`);
      loadHomeData();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save server URL");
    }
  };

  const handleResetServerUrl = async () => {
    try {
      const def = await resetApiBaseUrl();
      setServerUrlInput(def);
      setServerTestStatus(null);
      Alert.alert("Reset", `Server reset to default:\n${def}`);
    } catch (e: any) {
      Alert.alert("Error", "Failed to reset server URL");
    }
  };

  const openProfileDrawer = () => {
    setEditName(userName);
    setEditEmail(userEmail === "Not provided" ? "" : userEmail);
    setEditPhone(userPhone === "Not provided" ? "" : userPhone);
    setEditCity(userCity);
    setIsEditingProfile(false);
    setProfileModalVisible(true);
    Animated.timing(drawerSlideAnim, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  };

  const closeProfileDrawer = () => {
    Animated.timing(drawerSlideAnim, {
      toValue: -340,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setProfileModalVisible(false);
      setIsEditingProfile(false);
    });
  };

  const handleSaveProfile = async () => {
    try {
      if (editName.trim()) {
        setUserName(editName.trim());
        await setStorageItem("user_name", editName.trim());
      }
      if (editEmail.trim()) {
        setUserEmail(editEmail.trim());
        await setStorageItem("user_email", editEmail.trim());
      }
      if (editPhone.trim()) {
        setUserPhone(editPhone.trim());
        await setStorageItem("user_phone", editPhone.trim());
      }
      if (editCity.trim()) {
        setUserCity(editCity.trim());
        await setStorageItem("user_city", editCity.trim());
      }
      setIsEditingProfile(false);
      Alert.alert("Success", "Profile details updated successfully!");
    } catch (e) {
      console.warn("Failed to save profile:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getStorageItem("user_name")
        .then((name) => {
          if (name) setUserName(name);
        })
        .catch((err) => console.log("Failed to load user name", err));

      getStorageItem("user_email")
        .then((email) => {
          if (email) setUserEmail(email);
        })
        .catch((err) => console.log("Failed to load user email", err));

      getStorageItem("user_phone")
        .then((phone) => {
          if (phone) setUserPhone(phone);
        })
        .catch((err) => console.log("Failed to load user phone", err));
    }, [])
  );

  useEffect(() => {
    // 1. Get location
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setUserLocation("Location permission denied");
          return;
        }
        let loc = await Location.getCurrentPositionAsync({});
        let address = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (address && address.length > 0) {
          const city = address[0].city || address[0].region || "";
          setUserCity(city);
          setUserLocation(city || "Unknown Location");
        } else {
          setUserLocation("Location found");
        }
      } catch (error) {
        console.log("Error fetching location:", error);
        setUserLocation("Location unavailable");
      }
    })();

    loadHomeData();
  }, []);

  const loadHomeData = useCallback(() => {
    setLoading(true);
    setMoviesLoading(true);

    // 2. Fetch Events from real database
    smartFetch("/events/public/status/PUBLISHED")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setEvents(data);
        else if (data && data.events) setEvents(data.events);
        setIsServerConnected(true);
      })
      .catch((err) => {
        console.log("Failed to fetch events from database:", err);
        setIsServerConnected(false);
      })
      .finally(() => setLoading(false));

    // 3. Fetch & Classify Movies (matching web app logic)
    fetchClassifiedMovies()
      .then(({ nowShowing, upcoming }) => {
        setNowShowingMovies(nowShowing);
        setUpcomingMovies(upcoming);
        setMovies([...nowShowing, ...upcoming]);
        setIsServerConnected(true);
      })
      .catch((err) => {
        console.log("Failed to fetch classified movies:", err);
      })
      .finally(() => setMoviesLoading(false));
  }, []);

  const parsedEvents = useMemo(
    () =>
      events.map((e) => {
        const startRaw = e.startDateTime ? new Date(e.startDateTime).getTime() : 0;
        const endRaw = e.endDateTime
          ? new Date(e.endDateTime).getTime()
          : startRaw > 0
          ? startRaw + 4 * 3600 * 1000
          : 0;
        return {
          id: e.id?.toString() || "",
          title: e.eventName || "Untitled Event",
          date: e.startDateTime
            ? new Date(e.startDateTime).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })
            : "Upcoming",
          price: e.paid
            ? `₹${Number(e.ticketPrice || 0).toLocaleString("en-IN")}`
            : "Free",
          location: e.venue || (e.eventMode === "VIRTUAL" ? "Online" : "Bengaluru"),
          image: e.bannerUrl || null,
          eventType: e.eventType || "",
          eventName: e.eventName || "",
          createdAt: e.createdAt ? new Date(e.createdAt).getTime() : 0,
          startDateTimeRaw: startRaw,
          endDateTimeRaw: endRaw,
          status: e.status || "PUBLISHED",
          availableSeats:
            e.availableSeats !== undefined && e.availableSeats !== null
              ? Number(e.availableSeats)
              : null,
          capacity:
            e.capacity !== undefined && e.capacity !== null
              ? Number(e.capacity)
              : null,
          registrationDeadlineRaw: e.registrationDeadline
            ? new Date(e.registrationDeadline).getTime()
            : null,
        };
      }),
    [events]
  );

  const currentCategory =
    CATEGORIES.find((c) => c.label === activeCategory) ?? CATEGORIES[0];

  const now = Date.now();
  const activeEvents = useMemo(() => {
    return parsedEvents.filter((e) => {
      // 1. Status check: ignore completed, cancelled, trashed, or draft
      if (
        e.status === "COMPLETED" ||
        e.status === "CANCELLED" ||
        e.status === "TRASHED" ||
        e.status === "DRAFT"
      ) {
        return false;
      }
      // 2. Strict expiration check: If end time has passed, event has ran out
      if (e.endDateTimeRaw > 0 && e.endDateTimeRaw <= now) {
        return false;
      }
      // If start time was in the past and no explicit future end time
      if (e.startDateTimeRaw > 0 && e.startDateTimeRaw <= now && e.endDateTimeRaw <= now) {
        return false;
      }
      return true;
    });
  }, [parsedEvents, now]);

  const isSearchActive =
    activeCategory !== "All Events" ||
    searchQuery.trim().length > 0 ||
    filterMaxPrice !== "" ||
    filterDate !== "All" ||
    filterPlace.trim().length > 0;

  let filteredEvents = activeEvents;
  if (isSearchActive) {
    filteredEvents = filteredEvents.filter((e) =>
      eventMatchesCategory(e, currentCategory)
    );
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filteredEvents = filteredEvents.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.eventType.toLowerCase().includes(q)
      );
    }
    if (filterPlace.trim()) {
      const p = filterPlace.toLowerCase();
      filteredEvents = filteredEvents.filter((e) =>
        e.location.toLowerCase().includes(p)
      );
    }
    if (filterMaxPrice) {
      const max = parseInt(filterMaxPrice);
      if (!isNaN(max)) {
        filteredEvents = filteredEvents.filter((e) => {
          if (e.price === "Free") return true;
          const priceVal = parseInt(e.price.replace(/\D/g, ""));
          return priceVal <= max;
        });
      }
    }
    if (filterDate !== "All") {
      const nowTime = Date.now();
      if (filterDate === "Today") {
        const endOfDay = nowTime + 86400000;
        filteredEvents = filteredEvents.filter(
          (e) => e.startDateTimeRaw >= nowTime && e.startDateTimeRaw <= endOfDay
        );
      } else if (filterDate === "This Week") {
        const endOfWeek = nowTime + 7 * 86400000;
        filteredEvents = filteredEvents.filter(
          (e) => e.startDateTimeRaw >= nowTime && e.startDateTimeRaw <= endOfWeek
        );
      }
    }
  }

  // Filter Movies based on subTab (Now Showing vs Upcoming)
  const filteredMovies = useMemo(() => {
    let list = movieSubTab === "now_showing" ? nowShowingMovies : upcomingMovies;
    if (selectedMovieLang !== "All") {
      list = list.filter(
        (m) => m.language?.toLowerCase().includes(selectedMovieLang.toLowerCase())
      );
    }
    if (selectedMovieGenre !== "All" && selectedMovieGenre !== "All Genres") {
      list = list.filter(
        (m) => m.genre?.toLowerCase().includes(selectedMovieGenre.toLowerCase())
      );
    }
    if (selectedMovieFormat !== "All") {
      list = list.filter((m) => {
        const anyM = m as any;
        const fmt = selectedMovieFormat.toLowerCase();
        return (
          (anyM.screenTech && anyM.screenTech.toLowerCase().includes(fmt)) ||
          (anyM.format && anyM.format.toLowerCase().includes(fmt)) ||
          (anyM.formats && anyM.formats.some((f: string) => f.toLowerCase().includes(fmt))) ||
          selectedMovieFormat === "2D"
        );
      });
    }
    if (filterPlace.trim()) {
      const p = filterPlace.toLowerCase();
      list = list.filter(
        (m) => {
          const anyM = m as any;
          return (
            (anyM.city && anyM.city.toLowerCase().includes(p)) ||
            (anyM.portalName && anyM.portalName.toLowerCase().includes(p)) ||
            (anyM.theaters && anyM.theaters.some((t: string) => t.toLowerCase().includes(p)))
          );
        }
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.genre && m.genre.toLowerCase().includes(q)) ||
          (m.language && m.language.toLowerCase().includes(q))
      );
    }
    return list;
  }, [
    movieSubTab,
    nowShowingMovies,
    upcomingMovies,
    selectedMovieLang,
    selectedMovieGenre,
    selectedMovieFormat,
    filterPlace,
    searchQuery,
  ]);

  const trending = useMemo(
    () => [...activeEvents].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10),
    [activeEvents]
  );

  const upcoming = useMemo(() => {
    return [...activeEvents]
      .filter((e) => e.startDateTimeRaw > now)
      .sort((a, b) => a.startDateTimeRaw - b.startDateTimeRaw)
      .slice(0, 10);
  }, [activeEvents, now]);

  // For You Feed Filtered Movies
  const forYouMovies = useMemo(() => {
    let list = nowShowingMovies;
    if (forYouFilter === "today") {
      list = list.filter((m) => {
        const anyM = m as any;
        return !anyM.showtimes || anyM.showtimes.length > 0;
      });
    }
    if (filterPlace.trim()) {
      const p = filterPlace.toLowerCase();
      list = list.filter(
        (m) => {
          const anyM = m as any;
          return (
            (anyM.city && anyM.city.toLowerCase().includes(p)) ||
            (anyM.portalName && anyM.portalName.toLowerCase().includes(p))
          );
        }
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.genre && m.genre.toLowerCase().includes(q)) ||
          (m.language && m.language.toLowerCase().includes(q))
      );
    }
    return list;
  }, [nowShowingMovies, forYouFilter, filterPlace, searchQuery]);

  // For You Feed Filtered Events
  const forYouEvents = useMemo(() => {
    let list = trending;
    if (forYouFilter === "today") {
      const nowTime = Date.now();
      const endOfDay = nowTime + 86400000;
      list = list.filter((e) => e.startDateTimeRaw >= nowTime && e.startDateTimeRaw <= endOfDay);
    } else if (forYouFilter === "free") {
      list = list.filter((e) => e.price === "Free" || e.price === "₹0");
    }
    if (filterPlace.trim()) {
      const p = filterPlace.toLowerCase();
      list = list.filter((e) => e.location && e.location.toLowerCase().includes(p));
    }
    if (filterMaxPrice.trim()) {
      const max = parseInt(filterMaxPrice);
      if (!isNaN(max)) {
        list = list.filter((e) => {
          if (e.price === "Free") return true;
          const priceVal = parseInt(e.price.replace(/\D/g, ""));
          return priceVal <= max;
        });
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.eventType.toLowerCase().includes(q)
      );
    }
    return list;
  }, [trending, forYouFilter, filterPlace, filterMaxPrice, searchQuery]);

  // Unified Active Filter Indicator
  const isAnyFilterActive = useMemo(() => {
    if (activeNavTab === "movies") {
      return (
        selectedMovieLang !== "All" ||
        selectedMovieGenre !== "All Genres" ||
        selectedMovieFormat !== "All" ||
        filterPlace.trim().length > 0
      );
    }
    if (activeNavTab === "foryou") {
      return (
        forYouFilter !== "all" ||
        filterPlace.trim().length > 0 ||
        filterMaxPrice.trim().length > 0
      );
    }
    return isSearchActive;
  }, [
    activeNavTab,
    selectedMovieLang,
    selectedMovieGenre,
    selectedMovieFormat,
    filterPlace,
    forYouFilter,
    filterMaxPrice,
    isSearchActive,
  ]);

  const searchResults = isSearchActive ? filteredEvents.slice(0, 10) : [];

  const handleMoviePress = (movie: MovieItem, isUpcoming: boolean = false) => {
    selectMovie(movie);
    router.push({
      pathname: "/movie-detail" as any,
      params: { id: movie.id.toString(), isUpcoming: isUpcoming ? "true" : "false" },
    });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={openProfileDrawer}
        >
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop",
            }}
            style={styles.profileImg}
          />
          <View>
            <Text style={[styles.userName, { color: colors.text }]}>
              {userName}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={colors.textMuted}
              />
              <Text style={[styles.locationText, { color: colors.textMuted }]}>
                {userCity || "Bengaluru"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Server Connection Status Pill */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 20,
            backgroundColor: isServerConnected === false ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
            gap: 6,
            borderWidth: 1,
            borderColor: isServerConnected === false ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.25)',
          }}
          activeOpacity={0.7}
          onPress={() => {
            setServerUrlInput(getApiBaseUrl());
            setServerTestStatus(null);
            setServerModalVisible(true);
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: isServerConnected === false ? '#ef4444' : '#22c55e',
            }}
          />
          <Ionicons
            name="server-outline"
            size={14}
            color={isServerConnected === false ? '#ef4444' : '#22c55e'}
          />
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: isServerConnected === false ? '#ef4444' : '#22c55e',
            }}
          >
            {isServerConnected === false ? 'Offline' : 'Connected'}
          </Text>
        </TouchableOpacity>
      </View>


      {/* 3-SECTION DASHBOARD TABS: [ FOR YOU | MOVIES | EVENTS ] */}
      <View
        style={[
          styles.mainTabWrapper,
          { borderBottomColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)" },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.mainTabBtn}
          onPress={() => {
            setActiveNavTab("foryou");
            setSearchQuery("");
          }}
        >
          <View style={styles.tabContentRow}>
            <Ionicons
              name={activeNavTab === "foryou" ? "sparkles" : "sparkles-outline"}
              size={17}
              color={activeNavTab === "foryou" ? "#F59E0B" : colors.textMuted}
            />
            <Text
              style={[
                styles.mainTabText,
                {
                  color: activeNavTab === "foryou" ? colors.text : colors.textMuted,
                  fontWeight: activeNavTab === "foryou" ? "700" : "500",
                },
              ]}
            >
              For You
            </Text>
          </View>
          {activeNavTab === "foryou" && (
            <View style={[styles.activeTabIndicator, { backgroundColor: colors.primary }]} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.mainTabBtn}
          onPress={() => {
            setActiveNavTab("movies");
            setSearchQuery("");
          }}
        >
          <View style={styles.tabContentRow}>
            <Ionicons
              name={activeNavTab === "movies" ? "film" : "film-outline"}
              size={17}
              color={activeNavTab === "movies" ? "#EF4444" : colors.textMuted}
            />
            <Text
              style={[
                styles.mainTabText,
                {
                  color: activeNavTab === "movies" ? colors.text : colors.textMuted,
                  fontWeight: activeNavTab === "movies" ? "700" : "500",
                },
              ]}
            >
              Movies
            </Text>
          </View>
          {activeNavTab === "movies" && (
            <View style={[styles.activeTabIndicator, { backgroundColor: colors.primary }]} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.mainTabBtn}
          onPress={() => {
            setActiveNavTab("events");
            setSearchQuery("");
          }}
        >
          <View style={styles.tabContentRow}>
            <Ionicons
              name={activeNavTab === "events" ? "calendar-clear" : "calendar-clear-outline"}
              size={17}
              color={activeNavTab === "events" ? "#3B82F6" : colors.textMuted}
            />
            <Text
              style={[
                styles.mainTabText,
                {
                  color: activeNavTab === "events" ? colors.text : colors.textMuted,
                  fontWeight: activeNavTab === "events" ? "700" : "500",
                },
              ]}
            >
              Events
            </Text>
          </View>
          {activeNavTab === "events" && (
            <View style={[styles.activeTabIndicator, { backgroundColor: colors.primary }]} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ======================================================== */}
        {/* TAB 1: FOR YOU (BLENDED FEED)                           */}
        {/* ======================================================== */}
        {activeNavTab === "foryou" && (
          <>
            {/* Spotlight Banner Slider */}
            <View style={styles.bannerWrapper}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const slide = Math.round(
                    e.nativeEvent.contentOffset.x /
                      e.nativeEvent.layoutMeasurement.width
                  );
                  if (slide !== activeBanner) setActiveBanner(slide);
                }}
                scrollEventThrottle={16}
              >
                {dynamicBanners.map((banner) => (
                  <View key={banner.id} style={styles.bannerContainer}>
                    <ImageBackground
                      source={{ uri: banner.image }}
                      style={styles.bannerBackground}
                      imageStyle={{ borderRadius: 20 }}
                    >
                      <View style={styles.bannerOverlayDefault}>
                        <Text style={styles.bannerTagDefault}>{banner.tag}</Text>
                        <Text style={styles.bannerTitleDefault}>
                          {banner.title}
                        </Text>
                        <TouchableOpacity
                          style={styles.bookNowBtnSmallDefault}
                          onPress={() => {
                            const targetMovie = (banner as any).movieId
                              ? movies.find((m) => m.id === (banner as any).movieId)
                              : movies[0];
                            if (banner.type === "movie" && targetMovie) {
                              handleMoviePress(targetMovie);
                            } else {
                              setActiveNavTab("movies");
                            }
                          }}
                        >
                          <Text style={styles.bookNowTextSmallDefault}>
                            Book Now
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </ImageBackground>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.paginationDots}>
                {dynamicBanners.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, activeBanner === i && styles.activeDot]}
                  />
                ))}
              </View>
            </View>

            {/* For You Quick Filters Strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.forYouFilterScroll}
            >
              {[
                { id: "all", label: "✨ All Content" },
                { id: "movies", label: "🎬 Movies" },
                { id: "events", label: "🎪 Events" },
                { id: "today", label: "⚡ Today" },
                { id: "free", label: "🎟️ Free Entry" },
              ].map((chip) => {
                const isSel = forYouFilter === chip.id;
                return (
                  <TouchableOpacity
                    key={chip.id}
                    activeOpacity={0.7}
                    onPress={() => setForYouFilter(chip.id as any)}
                    style={[
                      styles.forYouFilterChip,
                      {
                        backgroundColor: isSel ? colors.primary : colors.surface,
                        borderColor: isSel ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.forYouFilterChipText,
                        { color: isSel ? "#FFF" : colors.text },
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* In Theaters Now Reel (Active Showtimes Only) */}
            {(forYouFilter === "all" || forYouFilter === "movies" || forYouFilter === "today") && (
              <>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      🎬 Now In Theaters
                    </Text>
                    <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                      Trending releases in {filterPlace || userCity || "your city"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setMovieSubTab("now_showing");
                      setActiveNavTab("movies");
                    }}
                  >
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                </View>

                {moviesLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
                ) : forYouMovies.length === 0 ? (
                  <View style={[styles.emptyReelCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="film-outline" size={28} color={colors.textMuted} />
                    <Text style={[styles.emptyReelText, { color: colors.textMuted }]}>
                      No active showtimes currently running for this filter.
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, marginBottom: 26 }}
                  >
                    {forYouMovies.map((movie) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        variant="carousel"
                        isUpcoming={false}
                        onPress={() => handleMoviePress(movie, false)}
                      />
                    ))}
                  </ScrollView>
                )}
              </>
            )}

            {/* Trending Events */}
            {(forYouFilter === "all" || forYouFilter === "events" || forYouFilter === "today" || forYouFilter === "free") && (
              <>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      🔥 Trending Events
                    </Text>
                    <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                      Top-rated conferences & festivals
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setActiveNavTab("events")}>
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                </View>

                {forYouEvents.length === 0 ? (
                  <View style={[styles.emptyReelCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="calendar-outline" size={28} color={colors.textMuted} />
                    <Text style={[styles.emptyReelText, { color: colors.textMuted }]}>
                      No events found matching this filter.
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.trendingContainer}
                  >
                    {forYouEvents.map((event) => (
                      <TouchableOpacity
                        key={event.id}
                        style={styles.trendingCard}
                        onPress={() =>
                          router.push({
                            pathname: "/event-detail",
                            params: { id: event.id },
                          })
                        }
                      >
                        <ImageBackground
                          source={{
                            uri:
                              event.image ||
                              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop",
                          }}
                          style={styles.trendingImage}
                          imageStyle={{ borderRadius: 20 }}
                        >
                          <TouchableOpacity
                            style={styles.bookmarkBadge}
                            onPress={() => toggleLike(event.id)}
                          >
                            <Ionicons
                              name={likedEvents.has(event.id) ? "heart" : "heart-outline"}
                              size={16}
                              color={likedEvents.has(event.id) ? "#FF0000" : "#FFF"}
                            />
                          </TouchableOpacity>

                          <View
                            style={[
                              styles.trendingInfoBox,
                              {
                                backgroundColor: isDarkMode
                                  ? "rgba(30, 30, 30, 0.95)"
                                  : "rgba(255, 255, 255, 0.95)",
                              },
                            ]}
                          >
                            <Text
                              style={[styles.trendingTitle, { color: colors.text }]}
                              numberOfLines={2}
                            >
                              {event.title}
                            </Text>
                            <View style={styles.trendingDetailsRow}>
                              <View style={styles.trendingDetailItem}>
                                <Ionicons
                                  name="calendar-outline"
                                  size={14}
                                  color={colors.textMuted}
                                />
                                <Text
                                  style={[
                                    styles.trendingDetailText,
                                    { color: colors.textMuted },
                                  ]}
                                >
                                  {event.date}
                                </Text>
                              </View>
                              <View style={[styles.trendingDetailItem, { flex: 1 }]}>
                                <Ionicons
                                  name="location-outline"
                                  size={14}
                                  color={colors.textMuted}
                                />
                                <Text
                                  style={[
                                    styles.trendingDetailText,
                                    { color: colors.textMuted, flexShrink: 1 },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {event.location}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.trendingActionRow}>
                              <Text
                                style={[styles.trendingPrice, { color: colors.text }]}
                              >
                                {event.price}
                              </Text>
                              <TouchableOpacity
                                style={styles.bookNowBtn}
                                onPress={() =>
                                  router.push({
                                    pathname: "/event-detail",
                                    params: { id: event.id },
                                  })
                                }
                              >
                                <Text style={styles.bookNowBtnText}>Book Now</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </ImageBackground>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </>
            )}

            {/* Upcoming Events Horizontal Reel */}
            {(forYouFilter === "all" || forYouFilter === "events") && upcoming.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Upcoming Highlights
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
                >
                  {upcoming.map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      style={styles.upcomingSquareCard}
                      onPress={() =>
                        router.push({
                          pathname: "/event-detail",
                          params: { id: event.id },
                        })
                      }
                    >
                      <ImageBackground
                        source={{
                          uri:
                            event.image ||
                            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop",
                        }}
                        style={styles.upcomingSquareImage}
                        imageStyle={{ borderRadius: 24 }}
                      >
                        <View style={styles.upcomingSquareOverlay}>
                          <View style={{ flex: 1 }} />
                          <View style={styles.upcomingSquareFooter}>
                            <Text
                              style={styles.upcomingSquareTitle}
                              numberOfLines={2}
                            >
                              {event.title}
                            </Text>
                            <Ionicons
                              name="arrow-forward-outline"
                              size={16}
                              color="#FFF"
                              style={{ marginLeft: 8 }}
                            />
                          </View>
                        </View>
                      </ImageBackground>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
          </>
        )}

        {/* ======================================================== */}
        {/* TAB 2: MOVIES (DEDICATED CINEMA DISCOVERY & BOOKING)    */}
        {/* ======================================================== */}
        {activeNavTab === "movies" && (
          <View style={styles.moviesTabContent}>
            {/* Sub-tab Switcher: Now Showing vs Upcoming */}
            <View
              style={[
                styles.movieSubTabBar,
                { backgroundColor: isDarkMode ? "#1E293B" : "#E2E8F0" },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setMovieSubTab("now_showing")}
                style={[
                  styles.movieSubTabBtn,
                  movieSubTab === "now_showing" && [
                    styles.movieSubTabBtnActive,
                    { backgroundColor: colors.surface },
                  ],
                ]}
              >
                <Ionicons
                  name="film"
                  size={15}
                  color={movieSubTab === "now_showing" ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.movieSubTabText,
                    {
                      color:
                        movieSubTab === "now_showing" ? colors.primary : colors.textMuted,
                      fontWeight: movieSubTab === "now_showing" ? "700" : "500",
                    },
                  ]}
                >
                  Now Showing ({nowShowingMovies.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setMovieSubTab("upcoming")}
                style={[
                  styles.movieSubTabBtn,
                  movieSubTab === "upcoming" && [
                    styles.movieSubTabBtnActive,
                    { backgroundColor: colors.surface },
                  ],
                ]}
              >
                <Ionicons
                  name="time"
                  size={15}
                  color={movieSubTab === "upcoming" ? "#D97706" : colors.textMuted}
                />
                <Text
                  style={[
                    styles.movieSubTabText,
                    {
                      color:
                        movieSubTab === "upcoming" ? "#D97706" : colors.textMuted,
                      fontWeight: movieSubTab === "upcoming" ? "700" : "500",
                    },
                  ]}
                >
                  Upcoming ({upcomingMovies.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Language Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.movieChipsScroll}
            >
              {MOVIE_LANGUAGES.map((lang) => {
                const isSelected = selectedMovieLang === lang;
                return (
                  <TouchableOpacity
                    key={lang}
                    onPress={() => setSelectedMovieLang(lang)}
                    style={[
                      styles.movieChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.movieChipText,
                        { color: isSelected ? "#FFF" : colors.text },
                      ]}
                    >
                      {lang}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Genre Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.movieChipsScroll, { marginTop: 2, marginBottom: 8 }]}
            >
              {MOVIE_GENRES.map((genre) => {
                const isSelected = selectedMovieGenre === genre;
                return (
                  <TouchableOpacity
                    key={genre}
                    onPress={() => setSelectedMovieGenre(genre)}
                    style={[
                      styles.movieChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.movieChipText,
                        { color: isSelected ? "#FFF" : colors.text },
                      ]}
                    >
                      {genre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Quick Format Badges */}
            <View style={styles.formatRow}>
              {MOVIE_FORMATS.map((fmt) => {
                const isSel = selectedMovieFormat === fmt;
                return (
                  <TouchableOpacity
                    key={fmt}
                    onPress={() => setSelectedMovieFormat(fmt)}
                    style={[
                      styles.formatBtn,
                      {
                        borderColor: isSel ? colors.primary : colors.border,
                        backgroundColor: isSel ? "rgba(121, 49, 237, 0.12)" : colors.background,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.formatBtnText,
                        { color: isSel ? colors.primary : colors.textMuted },
                      ]}
                    >
                      {fmt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Movie Count Header */}
            <View style={styles.catalogStatsBar}>
              <View>
                <Text style={[styles.catalogCountText, { color: colors.text }]}>
                  {movieSubTab === "now_showing"
                    ? `${filteredMovies.length} Now Showing in Theaters`
                    : `${filteredMovies.length} Upcoming Releases`}
                </Text>
                <Text style={[styles.catalogLocationText, { color: colors.textMuted }]}>
                  Near {filterPlace || userCity || "Bengaluru"}
                </Text>
              </View>
              {(selectedMovieLang !== "All" || selectedMovieGenre !== "All Genres" || selectedMovieFormat !== "All" || filterPlace !== "") && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedMovieLang("All");
                    setSelectedMovieGenre("All Genres");
                    setSelectedMovieFormat("All");
                    setFilterPlace("");
                  }}
                  style={[styles.resetFilterPill, { borderColor: colors.primary }]}
                >
                  <Ionicons name="close-circle-outline" size={13} color={colors.primary} />
                  <Text style={[styles.resetFilterPillText, { color: colors.primary }]}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 2-Column Movie Grid */}
            {moviesLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : filteredMovies.length === 0 ? (
              <View style={styles.noMoviesContainer}>
                <Ionicons name="film-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.noMoviesTitle, { color: colors.text }]}>
                  {movieSubTab === "now_showing"
                    ? "No showtimes scheduled right now"
                    : "No upcoming movies found"}
                </Text>
                <TouchableOpacity
                  style={[styles.resetFilterBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setSelectedMovieLang("All");
                    setSearchQuery("");
                  }}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>Reset Filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.movieGridContainer}>
                {filteredMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    variant="grid"
                    isUpcoming={movieSubTab === "upcoming"}
                    onPress={() => handleMoviePress(movie, movieSubTab === "upcoming")}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ======================================================== */}
        {/* TAB 3: EVENTS (ORIGINAL EVENTS HUB)                      */}
        {/* ======================================================== */}
        {activeNavTab === "events" && (
          <>
            {/* Event Banners Carousel */}
            <View style={styles.bannerWrapper}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const slide = Math.round(
                    e.nativeEvent.contentOffset.x /
                      e.nativeEvent.layoutMeasurement.width
                  );
                  if (slide !== activeEventBanner) setActiveEventBanner(slide);
                }}
                scrollEventThrottle={16}
              >
                {EVENT_BANNERS.map((banner, index) => {
                  if (index === 0) {
                    return (
                      <View key={banner.id} style={styles.bannerContainer}>
                        <ImageBackground
                          source={{ uri: banner.image }}
                          style={styles.bannerBackground}
                          imageStyle={{ borderRadius: 20 }}
                        >
                          <View style={styles.bannerOverlay}>
                            <View style={styles.dotGrid}>
                              <View style={styles.dotRow}>
                                <View style={styles.smallDot} />
                                <View style={styles.smallDot} />
                                <View style={styles.smallDot} />
                              </View>
                              <View style={styles.dotRow}>
                                <View style={styles.smallDot} />
                                <View style={styles.smallDot} />
                                <View style={styles.smallDot} />
                              </View>
                              <View style={styles.dotRow}>
                                <View style={styles.smallDot} />
                                <View style={styles.smallDot} />
                                <View style={styles.smallDot} />
                              </View>
                            </View>
                            <View style={styles.bannerContent}>
                              <View style={styles.titleWrapper}>
                                <View>
                                  <Text style={styles.titleEvent}>EVENT</Text>
                                  <Text style={styles.titleFestival}>FESTIVAL</Text>
                                </View>
                                <View style={styles.badge2026}>
                                  <Text style={styles.badgeText}>2026</Text>
                                </View>
                              </View>
                              <View style={styles.dashedRow}>
                                <View style={styles.dashLine} />
                                <Ionicons
                                  name="star"
                                  size={12}
                                  color="#FFB900"
                                  style={{ marginHorizontal: 4 }}
                                />
                                <View style={styles.dashLine} />
                              </View>
                              <Text style={styles.bannerSubtitle}>
                                {banner.title}
                              </Text>
                              <TouchableOpacity
                                style={styles.bookNowBtnSmall}
                                onPress={() =>
                                  router.push({
                                    pathname: "/event-detail",
                                    params: { id: events[0]?.id || banner.id },
                                  })
                                }
                              >
                                <Text style={styles.bookNowTextSmall}>
                                  Book Now
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </ImageBackground>
                      </View>
                    );
                  }
                  return (
                    <View key={banner.id} style={styles.bannerContainer}>
                      <ImageBackground
                        source={{ uri: banner.image }}
                        style={styles.bannerBackground}
                        imageStyle={{ borderRadius: 20 }}
                      >
                        <View style={styles.bannerOverlayDefault}>
                          <Text style={styles.bannerTagDefault}>{banner.tag}</Text>
                          <Text style={styles.bannerTitleDefault}>
                            {banner.title}
                          </Text>
                          <TouchableOpacity
                            style={styles.bookNowBtnSmallDefault}
                            onPress={() =>
                              router.push({
                                pathname: "/event-detail",
                                params: { id: events[index]?.id || banner.id },
                              })
                            }
                          >
                            <Text style={styles.bookNowTextSmallDefault}>
                              Book Now
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </ImageBackground>
                    </View>
                  );
                })}
              </ScrollView>
              <View style={styles.paginationDots}>
                {EVENT_BANNERS.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, activeEventBanner === i && styles.activeDot]}
                  />
                ))}
              </View>
            </View>

            {/* Categories */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Categories
              </Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.label;
                return (
                  <TouchableOpacity
                    key={cat.label}
                    style={[
                      styles.categoryBtn,
                      { backgroundColor: isDarkMode ? colors.card : "#E9EAEC" },
                      isActive && styles.categoryBtnActive,
                    ]}
                    onPress={() => setActiveCategory(cat.label)}
                  >
                    <View
                      style={[
                        styles.categoryIconWrap,
                        {
                          backgroundColor: isDarkMode ? colors.surface : "#FFFFFF",
                        },
                      ]}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={16}
                        color={
                          isActive
                            ? isDarkMode
                              ? "#FFFFFF"
                              : "#2C2636"
                            : colors.icon
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryText,
                        { color: colors.text },
                        isActive && styles.categoryTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {loading ? (
              <ActivityIndicator
                size="large"
                color="#7931ED"
                style={{ marginTop: 40 }}
              />
            ) : (
              <>
                {isSearchActive && searchResults.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Search Results
                      </Text>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.trendingContainer}
                    >
                      {searchResults.map((event) => (
                        <TouchableOpacity
                          key={event.id}
                          style={[
                            styles.trendingCard,
                            { backgroundColor: colors.card },
                          ]}
                          onPress={() =>
                            router.push({
                              pathname: "/event-detail",
                              params: { id: event.id },
                            })
                          }
                        >
                          <ImageBackground
                            source={{
                              uri:
                                event.image ||
                                "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop",
                            }}
                            style={styles.trendingImage}
                            imageStyle={{ borderRadius: 20 }}
                          >
                            <TouchableOpacity
                              style={styles.bookmarkBadge}
                              onPress={() => toggleLike(event.id)}
                            >
                              <Ionicons
                                name={
                                  likedEvents.has(event.id)
                                    ? "heart"
                                    : "heart-outline"
                                }
                                size={16}
                                color={
                                  likedEvents.has(event.id) ? "#FF0000" : "#FFF"
                                }
                              />
                            </TouchableOpacity>

                            <View
                              style={[
                                styles.trendingInfoBox,
                                {
                                  backgroundColor: isDarkMode
                                    ? "rgba(30, 30, 30, 0.95)"
                                    : "rgba(255, 255, 255, 0.95)",
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.trendingTitle,
                                  { color: colors.text },
                                ]}
                                numberOfLines={2}
                              >
                                {event.title}
                              </Text>
                              <View style={styles.trendingDetailsRow}>
                                <View style={styles.trendingDetailItem}>
                                  <Ionicons
                                    name="calendar-outline"
                                    size={14}
                                    color={colors.textMuted}
                                  />
                                  <Text
                                    style={[
                                      styles.trendingDetailText,
                                      { color: colors.textMuted },
                                    ]}
                                  >
                                    {event.date}
                                  </Text>
                                </View>
                                <View
                                  style={[styles.trendingDetailItem, { flex: 1 }]}
                                >
                                  <Ionicons
                                    name="location-outline"
                                    size={14}
                                    color={colors.textMuted}
                                  />
                                  <Text
                                    style={[
                                      styles.trendingDetailText,
                                      { color: colors.textMuted, flexShrink: 1 },
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {event.location}
                                  </Text>
                                </View>
                              </View>

                              <View style={styles.trendingActionRow}>
                                <Text
                                  style={[
                                    styles.trendingPrice,
                                    { color: colors.text },
                                  ]}
                                >
                                  {event.price}
                                </Text>
                                <TouchableOpacity
                                  style={styles.bookNowBtn}
                                  onPress={() =>
                                    router.push({
                                      pathname: "/event-detail",
                                      params: { id: event.id },
                                    })
                                  }
                                >
                                  <Text style={styles.bookNowBtnText}>
                                    Book Now
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </ImageBackground>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}

                {isSearchActive && searchResults.length === 0 && (
                  <View
                    style={{
                      alignItems: "center",
                      marginTop: 40,
                      marginBottom: 20,
                    }}
                  >
                    <Ionicons
                      name="search-outline"
                      size={48}
                      color={colors.textMuted}
                    />
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: colors.text,
                        marginTop: 12,
                      }}
                    >
                      No events found
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.textMuted,
                        marginTop: 4,
                      }}
                    >
                      Try adjusting your search query.
                    </Text>
                  </View>
                )}

                {/* Trending Events */}
                <View
                  style={[
                    styles.sectionHeader,
                    { marginTop: isSearchActive ? 24 : 0 },
                  ]}
                >
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Trending Events</Text>
                </View>

                {trending.length === 0 ? (
                  <View
                    style={[
                      styles.emptyReelCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        marginHorizontal: 16,
                      },
                    ]}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={28}
                      color={colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.emptyReelText,
                        { color: colors.textMuted },
                      ]}
                    >
                      No upcoming events available at the moment.
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.trendingContainer}
                  >
                    {trending.map((event) => (
                      <TouchableOpacity
                        key={event.id}
                        style={styles.trendingCard}
                        onPress={() =>
                          router.push({
                            pathname: "/event-detail",
                            params: { id: event.id },
                        })
                      }
                    >
                      <ImageBackground
                        source={{
                          uri:
                            event.image ||
                            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop",
                        }}
                        style={styles.trendingImage}
                        imageStyle={{ borderRadius: 20 }}
                      >
                        <TouchableOpacity
                          style={styles.bookmarkBadge}
                          onPress={() => toggleLike(event.id)}
                        >
                          <Ionicons
                            name={
                              likedEvents.has(event.id) ? "heart" : "heart-outline"
                            }
                            size={16}
                            color={likedEvents.has(event.id) ? "#FF0000" : "#FFF"}
                          />
                        </TouchableOpacity>

                        <View
                          style={[
                            styles.trendingInfoBox,
                            {
                              backgroundColor: isDarkMode
                                ? "rgba(30, 30, 30, 0.95)"
                                : "rgba(255, 255, 255, 0.95)",
                            },
                          ]}
                        >
                          <Text
                            style={[styles.trendingTitle, { color: colors.text }]}
                            numberOfLines={2}
                          >
                            {event.title}
                          </Text>
                          <View style={styles.trendingDetailsRow}>
                            <View style={styles.trendingDetailItem}>
                              <Ionicons
                                name="calendar-outline"
                                size={14}
                                color={colors.textMuted}
                              />
                              <Text
                                style={[
                                  styles.trendingDetailText,
                                  { color: colors.textMuted },
                                ]}
                              >
                                {event.date}
                              </Text>
                            </View>
                            <View style={[styles.trendingDetailItem, { flex: 1 }]}>
                              <Ionicons
                                name="location-outline"
                                size={14}
                                color={colors.textMuted}
                              />
                              <Text
                                style={[
                                  styles.trendingDetailText,
                                  { color: colors.textMuted, flexShrink: 1 },
                                ]}
                                numberOfLines={1}
                              >
                                {event.location}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.trendingActionRow}>
                            <Text
                              style={[styles.trendingPrice, { color: colors.text }]}
                              numberOfLines={1}
                            >
                              {event.price}
                            </Text>
                            <TouchableOpacity
                              style={styles.bookNowBtn}
                              onPress={() =>
                                router.push({
                                  pathname: "/event-detail",
                                  params: { id: event.id },
                                })
                              }
                            >
                              <Text style={styles.bookNowBtnText}>Book Now</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </ImageBackground>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

                {/* Upcoming Events */}
                {upcoming.length > 0 && (
                  <>
                    <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Events</Text>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
                    >
                      {upcoming.map((event) => (
                        <TouchableOpacity
                          key={event.id}
                          style={styles.upcomingSquareCard}
                          onPress={() =>
                            router.push({
                              pathname: "/event-detail",
                              params: { id: event.id },
                            })
                          }
                        >
                          <ImageBackground
                            source={{
                              uri:
                                event.image ||
                                "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop",
                            }}
                            style={styles.upcomingSquareImage}
                            imageStyle={{ borderRadius: 24 }}
                          >
                            <View style={styles.upcomingSquareOverlay}>
                              <View style={{ flex: 1 }} />
                              <View style={styles.upcomingSquareFooter}>
                                <Text
                                  style={styles.upcomingSquareTitle}
                                  numberOfLines={2}
                                >
                                  {event.title}
                                </Text>
                                <Ionicons
                                  name="arrow-forward-outline"
                                  size={16}
                                  color="#FFF"
                                  style={{ marginLeft: 8 }}
                                />
                              </View>
                            </View>
                          </ImageBackground>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}
              </>
            )}
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* CUSTOM BOTTOM NAVIGATION */}
      <BlurView
        intensity={80}
        tint={isDarkMode ? "dark" : "light"}
        style={[
          styles.bottomNav,
          {
            backgroundColor: isDarkMode
              ? "rgba(30, 30, 30, 0.6)"
              : "rgba(255, 255, 255, 0.7)",
          },
        ]}
      >
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color={colors.primary} />
          <Text style={[styles.navText, { color: colors.primary }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/search")}
        >
          <Ionicons name="search-outline" size={24} color={colors.text} />
          <Text style={[styles.navText, { color: colors.text }]}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/wishlist")}
        >
          <Ionicons name="heart-outline" size={24} color={colors.text} />
          <Text style={[styles.navText, { color: colors.text }]}>Wishlist</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/my-tickets")}
        >
          <Ionicons name="ticket-outline" size={24} color={colors.text} />
          <Text style={[styles.navText, { color: colors.text }]}>My Tickets</Text>
        </TouchableOpacity>
      </BlurView>

      {/* LEFT-SIDE PROFILE & MENU DRAWER */}
      <Modal
        visible={profileModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeProfileDrawer}
      >
        <View style={styles.drawerOverlay}>
          {/* Backdrop (tap to close) */}
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={closeProfileDrawer}
          />

          {/* Sliding Drawer Container */}
          <Animated.View
            style={[
              styles.drawerContainer,
              {
                backgroundColor: colors.surface,
                transform: [{ translateX: drawerSlideAnim }],
              },
            ]}
          >
            <SafeAreaView style={{ flex: 1 }}>
              {/* Drawer Header */}
              <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
                  <Text style={[styles.drawerHeaderTitle, { color: colors.text }]}>
                    My Account
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={closeProfileDrawer}
                  style={[styles.drawerCloseBtn, { backgroundColor: isDarkMode ? "#27272a" : "#f1f5f9" }]}
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.drawerScrollContent}
              >
                {/* User Card */}
                <View
                  style={[
                    styles.drawerProfileCard,
                    {
                      backgroundColor: isDarkMode ? "#18181b" : "#f8fafc",
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.drawerAvatarWrapper}>
                    <Image
                      source={{
                        uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop",
                      }}
                      style={styles.drawerAvatarImg}
                    />
                    <TouchableOpacity
                      style={[styles.drawerAvatarEditBadge, { backgroundColor: colors.primary }]}
                      onPress={() => setIsEditingProfile(!isEditingProfile)}
                    >
                      <Ionicons name="camera-outline" size={14} color="#FFF" />
                    </TouchableOpacity>
                  </View>

                  {!isEditingProfile ? (
                    <View style={styles.drawerUserInfo}>
                      <Text style={[styles.drawerUserName, { color: colors.text }]}>
                        {userName}
                      </Text>
                      <Text style={[styles.drawerUserSub, { color: colors.textMuted }]}>
                        {userEmail !== "Not provided" ? userEmail : "No email added"}
                      </Text>
                      {userPhone !== "Not provided" && (
                        <Text style={[styles.drawerUserSub, { color: colors.textMuted }]}>
                          📞 {userPhone}
                        </Text>
                      )}
                      <View style={styles.drawerLocationBadge}>
                        <Ionicons name="location-outline" size={12} color={colors.primary} />
                        <Text style={[styles.drawerLocationText, { color: colors.primary }]}>
                          {userCity || "Bengaluru"}
                        </Text>
                      </View>

                      {/* Edit Profile Button */}
                      <TouchableOpacity
                        style={[
                          styles.drawerEditProfileBtn,
                          { borderColor: colors.primary, backgroundColor: "transparent" },
                        ]}
                        onPress={() => setIsEditingProfile(true)}
                      >
                        <Ionicons name="create-outline" size={14} color={colors.primary} />
                        <Text style={[styles.drawerEditProfileBtnText, { color: colors.primary }]}>
                          Edit Profile
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    /* Inline Edit Mode Form */
                    <View style={styles.drawerEditForm}>
                      <Text style={[styles.drawerEditSectionTitle, { color: colors.text }]}>
                        Edit Your Details
                      </Text>

                      <Text style={[styles.drawerInputLabel, { color: colors.textMuted }]}>Name</Text>
                      <TextInput
                        style={[styles.drawerInput, { color: colors.text, borderColor: colors.border }]}
                        value={editName}
                        onChangeText={setEditName}
                        placeholder="Your Full Name"
                        placeholderTextColor={colors.textMuted}
                      />

                      <Text style={[styles.drawerInputLabel, { color: colors.textMuted }]}>Email</Text>
                      <TextInput
                        style={[styles.drawerInput, { color: colors.text, borderColor: colors.border }]}
                        value={editEmail}
                        onChangeText={setEditEmail}
                        placeholder="Email Address"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />

                      <Text style={[styles.drawerInputLabel, { color: colors.textMuted }]}>Phone</Text>
                      <TextInput
                        style={[styles.drawerInput, { color: colors.text, borderColor: colors.border }]}
                        value={editPhone}
                        onChangeText={setEditPhone}
                        placeholder="Phone Number"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="phone-pad"
                      />

                      <Text style={[styles.drawerInputLabel, { color: colors.textMuted }]}>City / Location</Text>
                      <TextInput
                        style={[styles.drawerInput, { color: colors.text, borderColor: colors.border }]}
                        value={editCity}
                        onChangeText={setEditCity}
                        placeholder="City"
                        placeholderTextColor={colors.textMuted}
                      />

                      <View style={styles.drawerEditActionsRow}>
                        <TouchableOpacity
                          style={[styles.drawerCancelBtn, { borderColor: colors.border }]}
                          onPress={() => setIsEditingProfile(false)}
                        >
                          <Text style={{ color: colors.textMuted, fontWeight: "600" }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.drawerSaveBtn, { backgroundColor: colors.primary }]}
                          onPress={handleSaveProfile}
                        >
                          <Text style={{ color: "#FFF", fontWeight: "700" }}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

                {/* MENU NAVIGATION OPTIONS */}
                <View style={styles.drawerMenuSection}>
                  <Text style={[styles.drawerMenuHeading, { color: colors.textMuted }]}>
                    QUICK ACCESS
                  </Text>

                  {/* 1. Wishlist */}
                  <TouchableOpacity
                    style={styles.drawerMenuItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      closeProfileDrawer();
                      router.push("/wishlist");
                    }}
                  >
                    <View style={styles.drawerMenuItemLeft}>
                      <View style={[styles.drawerMenuIconBox, { backgroundColor: isDarkMode ? "#27272a" : "#f1f5f9" }]}>
                        <Ionicons name="heart-outline" size={20} color={colors.text} />
                      </View>
                      <View>
                        <Text style={[styles.drawerMenuItemTitle, { color: colors.text }]}>
                          Wishlist
                        </Text>
                        <Text style={[styles.drawerMenuItemSub, { color: colors.textMuted }]}>
                          Saved events & favorite movies
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>

                  {/* 2. My Tickets */}
                  <TouchableOpacity
                    style={styles.drawerMenuItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      closeProfileDrawer();
                      router.push("/my-tickets");
                    }}
                  >
                    <View style={styles.drawerMenuItemLeft}>
                      <View style={[styles.drawerMenuIconBox, { backgroundColor: isDarkMode ? "#27272a" : "#f1f5f9" }]}>
                        <Ionicons name="ticket-outline" size={20} color={colors.text} />
                      </View>
                      <View>
                        <Text style={[styles.drawerMenuItemTitle, { color: colors.text }]}>
                          My Tickets
                        </Text>
                        <Text style={[styles.drawerMenuItemSub, { color: colors.textMuted }]}>
                          Active bookings & event passes
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>

                  {/* 3. Account Details */}
                  <TouchableOpacity
                    style={styles.drawerMenuItem}
                    activeOpacity={0.7}
                    onPress={() => setIsEditingProfile((prev) => !prev)}
                  >
                    <View style={styles.drawerMenuItemLeft}>
                      <View style={[styles.drawerMenuIconBox, { backgroundColor: isDarkMode ? "#27272a" : "#f1f5f9" }]}>
                        <Ionicons name="person-outline" size={20} color={colors.text} />
                      </View>
                      <View>
                        <Text style={[styles.drawerMenuItemTitle, { color: colors.text }]}>
                          Account
                        </Text>
                        <Text style={[styles.drawerMenuItemSub, { color: colors.textMuted }]}>
                          Personal details & profile info
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name={isEditingProfile ? "chevron-up" : "chevron-forward"}
                      size={16}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>

                  {/* 4. Settings */}
                  <View style={[styles.drawerSettingsSection, { borderColor: colors.border }]}>
                    <View style={styles.drawerMenuItem}>
                      <View style={styles.drawerMenuItemLeft}>
                        <View style={[styles.drawerMenuIconBox, { backgroundColor: isDarkMode ? "#27272a" : "#f1f5f9" }]}>
                          <Ionicons
                            name={isDarkMode ? "moon-outline" : "sunny-outline"}
                            size={20}
                            color={colors.text}
                          />
                        </View>
                        <View>
                          <Text style={[styles.drawerMenuItemTitle, { color: colors.text }]}>
                            Theme Mode
                          </Text>
                          <Text style={[styles.drawerMenuItemSub, { color: colors.textMuted }]}>
                            {isDarkMode ? "Dark Theme" : "Light Theme"}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={toggleTheme}
                        style={[
                          styles.drawerThemeToggleBadge,
                          {
                            backgroundColor: isDarkMode ? "#374151" : "#f1f5f9",
                            borderWidth: 1,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.drawerThemeToggleText, { color: colors.text }]}>
                          {isDarkMode ? "DARK" : "LIGHT"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Notifications setting */}
                    <TouchableOpacity
                      style={styles.drawerMenuItem}
                      activeOpacity={0.7}
                      onPress={() => {
                        closeProfileDrawer();
                        router.push("/notifications");
                      }}
                    >
                      <View style={styles.drawerMenuItemLeft}>
                        <View style={[styles.drawerMenuIconBox, { backgroundColor: isDarkMode ? "#27272a" : "#f1f5f9" }]}>
                          <Ionicons name="notifications-outline" size={20} color={colors.text} />
                        </View>
                        <View>
                          <Text style={[styles.drawerMenuItemTitle, { color: colors.text }]}>
                            Notifications
                          </Text>
                          <Text style={[styles.drawerMenuItemSub, { color: colors.textMuted }]}>
                            Booking alerts & reminders
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  {/* 5. Contact Us */}
                  <TouchableOpacity
                    style={styles.drawerMenuItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      closeProfileDrawer();
                      router.push("/contact");
                    }}
                  >
                    <View style={styles.drawerMenuItemLeft}>
                      <View style={[styles.drawerMenuIconBox, { backgroundColor: isDarkMode ? "#27272a" : "#f1f5f9" }]}>
                        <Ionicons name="call-outline" size={20} color={colors.text} />
                      </View>
                      <View>
                        <Text style={[styles.drawerMenuItemTitle, { color: colors.text }]}>
                          Contact Us
                        </Text>
                        <Text style={[styles.drawerMenuItemSub, { color: colors.textMuted }]}>
                          Support helpline & WhatsApp chat
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>

                  {/* 6. Help Center */}
                  <TouchableOpacity
                    style={styles.drawerMenuItem}
                    activeOpacity={0.7}
                    onPress={() => setHelpCenterVisible(true)}
                  >
                    <View style={styles.drawerMenuItemLeft}>
                      <View style={[styles.drawerMenuIconBox, { backgroundColor: isDarkMode ? "#27272a" : "#f1f5f9" }]}>
                        <Ionicons name="help-circle-outline" size={20} color={colors.text} />
                      </View>
                      <View>
                        <Text style={[styles.drawerMenuItemTitle, { color: colors.text }]}>
                          Help Center
                        </Text>
                        <Text style={[styles.drawerMenuItemSub, { color: colors.textMuted }]}>
                          FAQs & quick support answers
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>

                  {/* 7. Terms & Conditions */}
                  <TouchableOpacity
                    style={styles.drawerMenuItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      closeProfileDrawer();
                      router.push("/terms");
                    }}
                  >
                    <View style={styles.drawerMenuItemLeft}>
                      <View style={[styles.drawerMenuIconBox, { backgroundColor: isDarkMode ? "#27272a" : "#f1f5f9" }]}>
                        <Ionicons name="document-text-outline" size={20} color={colors.text} />
                      </View>
                      <View>
                        <Text style={[styles.drawerMenuItemTitle, { color: colors.text }]}>
                          Terms & Conditions
                        </Text>
                        <Text style={[styles.drawerMenuItemSub, { color: colors.textMuted }]}>
                          Platform policies & cancellation terms
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>

                  {/* 8. Server Connection */}
                  <TouchableOpacity
                    style={styles.drawerMenuItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      closeProfileDrawer();
                      setServerUrlInput(getApiBaseUrl());
                      setServerTestStatus(null);
                      setServerModalVisible(true);
                    }}
                  >
                    <View style={styles.drawerMenuItemLeft}>
                      <View style={[styles.drawerMenuIconBox, { backgroundColor: isDarkMode ? "#27272a" : "#f1f5f9" }]}>
                        <Ionicons name="server-outline" size={20} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={[styles.drawerMenuItemTitle, { color: colors.text }]}>
                          Server Connection
                        </Text>
                        <Text numberOfLines={1} style={[styles.drawerMenuItemSub, { color: colors.textMuted, maxWidth: 200 }]}>
                          {getApiBaseUrl()}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* LOG OUT BUTTON */}
                <TouchableOpacity
                  style={[
                    styles.drawerLogoutBtn,
                    {
                      backgroundColor: isDarkMode ? "#1f1f23" : "#f8fafc",
                      borderColor: isDarkMode ? "#27272a" : "#e2e8f0",
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={async () => {
                    try {
                      await deleteStorageItem("user_id");
                      await deleteStorageItem("token");
                      await deleteStorageItem("user_role");
                      await deleteStorageItem("user_name");
                      await deleteStorageItem("user_email");
                      await deleteStorageItem("user_phone");
                      closeProfileDrawer();
                      router.replace("/login");
                    } catch (e) {
                      console.log("Failed to logout", e);
                      closeProfileDrawer();
                      router.replace("/login");
                    }
                  }}
                >
                  <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                  <Text style={styles.drawerLogoutText}>Log Out</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>

      {/* HELP CENTER MODAL */}
      <Modal visible={helpCenterVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="help-circle" size={24} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Help Center
                </Text>
              </View>
              <TouchableOpacity onPress={() => setHelpCenterVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 8 }}>
                Frequently Asked Questions
              </Text>

              <View style={[styles.faqCard, { borderColor: colors.border }]}>
                <Text style={[styles.faqQ, { color: colors.text }]}>How do I cancel my movie ticket?</Text>
                <Text style={[styles.faqA, { color: colors.textMuted }]}>
                  Go to 'My Tickets', select your booking, and tap 'Cancel Ticket' at least 2 hours before showtime.
                </Text>
              </View>

              <View style={[styles.faqCard, { borderColor: colors.border }]}>
                <Text style={[styles.faqQ, { color: colors.text }]}>Where is my booking QR code?</Text>
                <Text style={[styles.faqA, { color: colors.textMuted }]}>
                  Open 'My Tickets' and tap on your active pass to view the high-resolution QR code for venue check-in.
                </Text>
              </View>

              <View style={[styles.faqCard, { borderColor: colors.border }]}>
                <Text style={[styles.faqQ, { color: colors.text }]}>Official Support Information</Text>
                <Text style={[styles.faqA, { color: colors.textMuted, marginBottom: 8 }]}>
                  Reach our dedicated team directly from 9:00 AM to 6:00 PM IST (Mon–Fri):
                </Text>

                <View style={{ gap: 6, marginVertical: 4 }}>
                  <Text style={{ fontSize: 13, color: colors.text }}>
                    📧 Email: <Text style={{ fontWeight: "700", color: colors.primary }}>support@ficbackrooms.com</Text>
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.text }}>
                    📞 Helpline: <Text style={{ fontWeight: "700" }}>+91 93630 63276</Text>
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.text }}>
                    💬 WhatsApp: <Text style={{ fontWeight: "700", color: "#10B981" }}>+91 93630 63276</Text>
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                    🛡️ Grievance Officer: Naveen Kumar (grievance@ficbackrooms.com)
                  </Text>
                </View>

                <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: colors.primary,
                      alignItems: "center",
                    }}
                    onPress={() => Linking.openURL("mailto:support@ficbackrooms.com?subject=FIC%20BackRooms%20Support")}
                  >
                    <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 12 }}>Email Us</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: "#10B981",
                      alignItems: "center",
                    }}
                    onPress={() => Linking.openURL("tel:+919363063276")}
                  >
                    <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 12 }}>Call Us</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: "#25D366",
                      alignItems: "center",
                    }}
                    onPress={() => Linking.openURL("https://wa.me/919363063276?text=Hello%20FIC%20BackRooms%20Support")}
                  >
                    <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 12 }}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Link to Full Terms & Conditions */}
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginTop: 4,
                  backgroundColor: isDarkMode ? "#1f1f23" : "#f8fafc",
                }}
                onPress={() => {
                  setHelpCenterVisible(false);
                  router.push("/terms");
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                    View Terms & Conditions
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={[styles.applyFiltersBtn, { backgroundColor: colors.primary, marginTop: 10 }]}
              onPress={() => setHelpCenterVisible(false)}
            >
              <Text style={{ color: "#FFF", fontWeight: "700" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SERVER CONFIGURATION MODAL */}
      <Modal visible={serverModalVisible} transparent={true} animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface, maxHeight: "85%" }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="server" size={24} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Server Connection
                </Text>
              </View>
              <TouchableOpacity onPress={() => setServerModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 10 }}>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 12 }}>
                Ensure your phone and computer are on the same Wi-Fi network. You can also use an ngrok or tunnel URL.
              </Text>

              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text, marginBottom: 6 }}>
                Backend API URL:
              </Text>
              <TextInput
                value={serverUrlInput}
                onChangeText={setServerUrlInput}
                placeholder="http://192.168.1.19:8081/api"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  color: colors.text,
                  backgroundColor: isDarkMode ? "#18181b" : "#f4f4f5",
                  fontSize: 14,
                  marginBottom: 12,
                }}
              />

              {serverTestStatus && (
                <View
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: serverTestStatus.success ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: serverTestStatus.success ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: serverTestStatus.success ? "#15803D" : "#B91C1C",
                    }}
                  >
                    {serverTestStatus.message}
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: isDarkMode ? "#27272a" : "#e4e4e7",
                    alignItems: "center",
                  }}
                  disabled={testingServer}
                  onPress={handleTestServerConnection}
                >
                  {testingServer ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Text style={{ fontWeight: "600", color: colors.text, fontSize: 13 }}>
                      Test Connection
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                  }}
                  onPress={handleSaveServerUrl}
                >
                  <Text style={{ fontWeight: "700", color: "#fff", fontSize: 13 }}>
                    Save & Reload
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={{ padding: 8, alignItems: "center" }}
                onPress={handleResetServerUrl}
              >
                <Text style={{ fontSize: 12, color: colors.textMuted, textDecorationLine: "underline" }}>
                  Reset to default ({DEFAULT_SERVER_URL})
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  locationText: {
    fontSize: 13,
    marginLeft: 4,
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeText: {
    fontSize: 20,
    color: "#2C2636",
    paddingHorizontal: 16,
    marginBottom: 16,
    fontWeight: "600",
  },
  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: "#E9EAEC",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  /* 3-Section Tab Switcher */
  mainTabWrapper: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 0,
    borderBottomWidth: 1,
    backgroundColor: "transparent",
  },
  mainTabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    position: "relative",
  },
  tabContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  mainTabText: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  activeTabIndicator: {
    position: "absolute",
    bottom: -1,
    height: 3,
    width: "60%",
    borderRadius: 2,
    alignSelf: "center",
  },
  /* Movies Tab Content */
  moviesTabContent: {
    paddingBottom: 20,
  },
  movieChipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  movieChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  movieChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  formatRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
  },
  formatBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  formatBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
  catalogStatsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  catalogCountText: {
    fontSize: 14,
    fontWeight: "700",
  },
  catalogLocationText: {
    fontSize: 12,
  },
  resetFilterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  resetFilterPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  filterActiveDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  forYouFilterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  forYouFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  forYouFilterChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  movieGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  noMoviesContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  noMoviesTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 16,
  },
  resetFilterBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  /* Banners */
  bannerWrapper: {
    marginBottom: 20,
  },
  bannerContainer: {
    width: Dimensions.get("window").width,
    paddingHorizontal: 16,
  },
  bannerBackground: {
    width: "100%",
    height: 160,
    borderRadius: 20,
    overflow: "hidden",
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26, 12, 74, 0.4)",
    borderRadius: 20,
  },
  dotGrid: {
    position: "absolute",
    left: 12,
    top: 12,
    gap: 2.4,
  },
  dotRow: {
    flexDirection: "row",
    gap: 2.4,
  },
  smallDot: {
    width: 2.4,
    height: 2.4,
    borderRadius: 1.2,
    backgroundColor: "#D9D9D9",
  },
  bannerContent: {
    position: "absolute",
    left: 45,
    top: 18,
  },
  titleWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  titleEvent: {
    fontWeight: "900",
    fontSize: 16,
    color: "#FFFFFF",
    lineHeight: 20,
    textTransform: "uppercase",
  },
  titleFestival: {
    fontWeight: "900",
    fontSize: 12,
    color: "#FFFFFF",
    lineHeight: 15,
    textTransform: "uppercase",
  },
  badge2026: {
    backgroundColor: "#FFB900",
    transform: [{ rotate: "-5.83deg" }],
    marginLeft: 6,
    marginTop: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  badgeText: {
    fontWeight: "700",
    fontSize: 12,
    color: "#FFFFFF",
    lineHeight: 15,
  },
  dashedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  dashLine: {
    width: 30,
    height: 1,
    borderWidth: 1,
    borderColor: "#E5DDF3",
    borderStyle: "dashed",
  },
  bannerSubtitle: {
    fontWeight: "400",
    fontSize: 12,
    color: "#ECECEC",
    marginBottom: 14,
  },
  bookNowBtnSmall: {
    backgroundColor: "#7931ED",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  bookNowTextSmall: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  bannerOverlayDefault: {
    flex: 1,
    backgroundColor: "rgba(10, 5, 40, 0.42)",
    justifyContent: "flex-end",
    padding: 16,
    borderRadius: 20,
  },
  bannerTagDefault: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 4,
  },
  bannerTitleDefault: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    lineHeight: 22,
  },
  bookNowBtnSmallDefault: {
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bookNowTextSmallDefault: {
    color: "#7931ED",
    fontSize: 13,
    fontWeight: "700",
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E9EAEC",
  },
  activeDot: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7931ED",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sectionSub: {
    fontSize: 11,
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 13,
    color: "#7931ED",
    fontWeight: "700",
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 24,
  },
  categoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: 24,
    height: 40,
  },
  categoryBtnActive: {
    backgroundColor: "#7931ED",
  },
  categoryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  trendingContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  trendingCard: {
    width: 270,
    height: 300,
    borderRadius: 20,
    overflow: "hidden",
  },
  trendingImage: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  bookmarkBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(5, 24, 97, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  trendingInfoBox: {
    margin: 10,
    padding: 14,
    borderRadius: 16,
  },
  trendingTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  trendingDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  trendingDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trendingDetailText: {
    fontSize: 12,
  },
  trendingActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trendingPrice: {
    fontSize: 16,
    fontWeight: "700",
  },
  bookNowBtn: {
    backgroundColor: "#7931ED",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
  },
  bookNowBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  upcomingSquareCard: {
    width: 140,
    height: 170,
    borderRadius: 20,
    overflow: "hidden",
  },
  upcomingSquareImage: {
    width: "100%",
    height: "100%",
  },
  upcomingSquareOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 12,
  },
  upcomingSquareFooter: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  upcomingSquareTitle: {
    flex: 1,
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  bottomNav: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    height: 72,
    borderRadius: 36,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  navText: {
    fontSize: 11,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 14,
  },
  filterInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
  },
  filterChipRow: {
    flexDirection: "row",
    gap: 10,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 20,
  },
  modalFooter: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
    marginBottom: 24,
  },
  clearFiltersBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  applyFiltersBtn: {
    flex: 2,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  /* Left Drawer Styles */
  drawerOverlay: {
    flex: 1,
    flexDirection: "row",
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  drawerContainer: {
    width: "82%",
    maxWidth: 330,
    height: "100%",
    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  drawerHeaderTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  drawerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  drawerProfileCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  drawerAvatarWrapper: {
    position: "relative",
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  drawerAvatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  drawerAvatarEditBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  drawerUserInfo: {
    gap: 3,
  },
  drawerUserName: {
    fontSize: 17,
    fontWeight: "800",
  },
  drawerUserSub: {
    fontSize: 12,
  },
  drawerLocationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
    marginBottom: 8,
  },
  drawerLocationText: {
    fontSize: 12,
    fontWeight: "600",
  },
  drawerEditProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  drawerEditProfileBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  drawerEditForm: {
    gap: 6,
    marginTop: 6,
  },
  drawerEditSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  drawerInputLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  drawerInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
  drawerEditActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  drawerCancelBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerSaveBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerMenuSection: {
    marginBottom: 20,
  },
  drawerMenuHeading: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  drawerMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  drawerMenuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  drawerMenuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerMenuItemTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  drawerMenuItemSub: {
    fontSize: 11,
  },
  drawerSettingsSection: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 4,
    marginVertical: 4,
  },
  drawerThemeToggleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  drawerThemeToggleText: {
    fontSize: 11,
    fontWeight: "800",
  },
  drawerLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  drawerLogoutText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "700",
  },
  faqCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 4,
  },
  faqQ: {
    fontSize: 13,
    fontWeight: "700",
  },
  faqA: {
    fontSize: 12,
    lineHeight: 18,
  },
  movieSubTabBar: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  movieSubTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  movieSubTabBtnActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  movieSubTabText: {
    fontSize: 13,
  },
  emptyReelCard: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  emptyReelText: {
    fontSize: 13,
    textAlign: "center",
    maxWidth: 260,
  },
});
