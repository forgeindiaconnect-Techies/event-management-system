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
} from "react-native";
import * as Location from "expo-location";
import { useWishlist } from "../context/WishlistContext";
import { useTheme } from "../context/ThemeContext";
import * as SecureStore from "expo-secure-store";

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

function eventMatchesCategory(event: any, category: (typeof CATEGORIES)[0]) {
  if (category.label === "All Events") return true;
  const text =
    `${event.eventType || ""} ${event.eventName || ""}`.toLowerCase();
  return category.keywords.some((kw) => text.includes(kw));
}

export default function LandingScreen() {
  const { likedEvents, toggleLike } = useWishlist();
  const { isDarkMode, colors, toggleTheme } = useTheme();

  const [activeCategory, setActiveCategory] = useState("All Events");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBanner, setActiveBanner] = useState(0);

  const [filterVisible, setFilterVisible] = useState(false);
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterDate, setFilterDate] = useState("All");
  const [filterPlace, setFilterPlace] = useState("");

  const BANNERS = [
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

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<string>("Locating...");
  const [userCity, setUserCity] = useState<string>("");
  const [userName, setUserName] = useState<string>("Guest");
  const [userEmail, setUserEmail] = useState<string>("Not provided");
  const [userPhone, setUserPhone] = useState<string>("Not provided");
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      SecureStore.getItemAsync("user_name")
        .then((name) => {
          if (name) {
            setUserName(name);
          }
        })
        .catch((err) => console.log("Failed to load user name", err));
        
      SecureStore.getItemAsync("user_email")
        .then((email) => {
          if (email) {
            setUserEmail(email);
          }
        })
        .catch((err) => console.log("Failed to load user email", err));
        
      SecureStore.getItemAsync("user_phone")
        .then((phone) => {
          if (phone) {
            setUserPhone(phone);
          }
        })
        .catch((err) => console.log("Failed to load user phone", err));
    }, []),
  );

  useEffect(() => {
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

    fetch(
      "https://event-management-system-y9fa.onrender.com/api/events/public/status/PUBLISHED",
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEvents(data);
        else if (data && data.events) setEvents(data.events);
      })
      .catch((err) => console.log("Failed to fetch events:", err))
      .finally(() => setLoading(false));
  }, []);

  const parsedEvents = useMemo(
    () =>
      events.map((e) => ({
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
        location:
          e.venue || (e.eventMode === "VIRTUAL" ? "Online" : "Bengaluru"),
        image: e.bannerUrl || null,
        eventType: e.eventType || "",
        eventName: e.eventName || "",
        createdAt: e.createdAt ? new Date(e.createdAt).getTime() : 0,
        startDateTimeRaw: e.startDateTime
          ? new Date(e.startDateTime).getTime()
          : Infinity,
      })),
    [events],
  );

  const currentCategory =
    CATEGORIES.find((c) => c.label === activeCategory) ?? CATEGORIES[0];
  const isSearchActive =
    activeCategory !== "All Events" ||
    searchQuery.trim().length > 0 ||
    filterMaxPrice !== "" ||
    filterDate !== "All" ||
    filterPlace.trim().length > 0;

  let filteredEvents = parsedEvents;
  if (isSearchActive) {
    filteredEvents = filteredEvents.filter((e) =>
      eventMatchesCategory(e, currentCategory),
    );
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filteredEvents = filteredEvents.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.eventType.toLowerCase().includes(q),
      );
    }
    if (filterPlace.trim()) {
      const p = filterPlace.toLowerCase();
      filteredEvents = filteredEvents.filter((e) =>
        e.location.toLowerCase().includes(p),
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
          (e) =>
            e.startDateTimeRaw >= nowTime && e.startDateTimeRaw <= endOfDay,
        );
      } else if (filterDate === "This Week") {
        const endOfWeek = nowTime + 7 * 86400000;
        filteredEvents = filteredEvents.filter(
          (e) =>
            e.startDateTimeRaw >= nowTime && e.startDateTimeRaw <= endOfWeek,
        );
      }
    }
  }

  const now = Date.now();
  const futureEvents = parsedEvents.filter((e) => e.startDateTimeRaw >= now);
  const trending = [...futureEvents]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 10);
  const oneDayFromNow = now + 86400000;
  const upcoming = [...futureEvents]
    .filter((e) => e.startDateTimeRaw > oneDayFromNow)
    .sort((a, b) => a.startDateTimeRaw - b.startDateTimeRaw)
    .slice(0, 10);

  const searchResults = isSearchActive ? filteredEvents.slice(0, 10) : [];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => setProfileModalVisible(true)}
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity
            style={[
              styles.notificationBtn,
              { backgroundColor: colors.surface },
            ]}
            onPress={toggleTheme}
          >
            <Ionicons
              name={isDarkMode ? "sunny" : "moon"}
              size={20}
              color={colors.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.notificationBtn,
              { backgroundColor: colors.surface },
            ]}
            onPress={() => console.log("Call Notification API")}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.icon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.welcomeText, { color: colors.text }]}>
        Welcome Back!
      </Text>

      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search events, workshops..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: colors.surface }]}
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons name="options-outline" size={24} color={colors.icon} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bannerWrapper}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.round(
                e.nativeEvent.contentOffset.x /
                  e.nativeEvent.layoutMeasurement.width,
              );
              if (slide !== activeBanner) setActiveBanner(slide);
            }}
            scrollEventThrottle={16}
          >
            {BANNERS.map((banner, index) => {
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
                                params: { id: banner.id },
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
                            params: { id: banner.id },
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
            {BANNERS.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, activeBanner === i && styles.activeDot]}
              />
            ))}
          </View>
        </View>

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
              <Text style={styles.sectionTitle}>Trending Events</Text>
            </View>

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

            {/* Upcoming Events */}
            {upcoming.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                  <Text style={styles.sectionTitle}>Upcoming Events</Text>
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
      </ScrollView>

      {/* Custom Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: colors.surface }]}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color={colors.primary} />
          <Text style={[styles.navText, { color: colors.primary }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/explore")}
        >
          <Ionicons name="compass-outline" size={24} color={colors.text} />
          <Text style={[styles.navText, { color: colors.text }]}>Explore</Text>
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
          <Text style={[styles.navText, { color: colors.text }]}>
            My Tickets
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={filterVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Filters
              </Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={[styles.filterLabel, { color: colors.text }]}>
                Maximum Price (₹)
              </Text>
              <TextInput
                style={[
                  styles.filterInput,
                  { color: colors.text, borderColor: colors.border },
                ]}
                placeholder="Enter max price (e.g. 500)"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={filterMaxPrice}
                onChangeText={setFilterMaxPrice}
              />

              <Text style={[styles.filterLabel, { color: colors.text }]}>
                Date
              </Text>
              <View style={styles.filterChipRow}>
                {["All", "Today", "This Week"].map((dateOpt) => (
                  <TouchableOpacity
                    key={dateOpt}
                    style={[
                      styles.filterChip,
                      { borderColor: colors.border },
                      filterDate === dateOpt && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setFilterDate(dateOpt)}
                  >
                    <Text
                      style={{
                        color: filterDate === dateOpt ? "#FFF" : colors.text,
                      }}
                    >
                      {dateOpt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.filterLabel, { color: colors.text }]}>
                Place / Venue
              </Text>
              <TextInput
                style={[
                  styles.filterInput,
                  { color: colors.text, borderColor: colors.border },
                ]}
                placeholder="Enter city or venue"
                placeholderTextColor={colors.textMuted}
                value={filterPlace}
                onChangeText={setFilterPlace}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.clearFiltersBtn,
                  { borderColor: colors.primary },
                ]}
                onPress={() => {
                  setFilterMaxPrice("");
                  setFilterDate("All");
                  setFilterPlace("");
                }}
              >
                <Text style={{ color: colors.primary }}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.applyFiltersBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => setFilterVisible(false)}
              >
                <Text style={{ color: "#FFF", fontWeight: "bold" }}>
                  Apply Filters
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={profileModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProfileModalVisible(false)}
        >
          <View
            style={[styles.profilePopup, { backgroundColor: colors.surface }]}
          >
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop",
              }}
              style={styles.popupImg}
            />
            <Text style={[styles.popupName, { color: colors.text }]}>
              {userName}
            </Text>
            <Text style={[styles.popupLocation, { color: colors.textMuted, marginBottom: 8 }]}>
              {userCity || "Bengaluru"}
            </Text>
            
            <Text style={{ color: colors.text, fontSize: 13, marginBottom: 4 }}>
              {userPhone}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 16 }}>
              {userEmail}
            </Text>

            <View style={styles.popupDivider} />

            <TouchableOpacity
              style={styles.popupBtn}
              onPress={async () => {
                await SecureStore.deleteItemAsync("user_name");
                setProfileModalVisible(false);
                router.replace("/login");
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#e11d48" />
              <Text style={styles.popupLogoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F3F6",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingBottom: 100, // Space for bottom nav
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 16,
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
    color: "#7C848D",
    fontFamily: Platform.OS === "ios" ? "Outfit" : "sans-serif",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  locationText: {
    fontSize: 14,
    color: "#2C2636",
    marginLeft: 4,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E9EBEC",
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeText: {
    fontSize: 20,
    color: "#2C2636",
    paddingHorizontal: 16,
    marginBottom: 20,
    fontWeight: "500",
  },
  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F3F6",
    borderWidth: 1,
    borderColor: "#E9EAEC",
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#2C2636",
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: "#E9EAEC",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerWrapper: {
    marginBottom: 24,
  },
  bannerContainer: {
    width: Dimensions.get("window").width,
    paddingHorizontal: 16,
  },
  bannerBackground: {
    width: "100%",
    height: 163,
    borderRadius: 20,
    overflow: "hidden",
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26, 12, 74, 0.4)", // Darker overlay to make white text pop like the design
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
    backgroundColor: "rgba(10, 5, 40, 0.4)",
    justifyContent: "flex-end",
    padding: 16,
    borderRadius: 20,
  },
  bannerTagDefault: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  bannerTitleDefault: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
    lineHeight: 28,
  },
  bookNowBtnSmallDefault: {
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  bookNowTextSmallDefault: {
    color: "#7931ED",
    fontSize: 14,
    fontWeight: "600",
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E9EAEC",
  },
  activeDot: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#7931ED",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#2C2636",
    fontWeight: "500",
  },
  seeAllText: {
    fontSize: 14,
    color: "#7931ED",
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 32,
  },
  categoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9EAEC",
    paddingLeft: 6,
    paddingRight: 16,
    borderRadius: 24,
    height: 44,
  },
  categoryBtnActive: {
    backgroundColor: "#7931ED",
  },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    color: "#2C2636",
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#E2E2E2",
  },
  trendingContainer: {
    paddingHorizontal: 16,
    gap: 20,
  },
  trendingCard: {
    width: 289,
    height: 322,
    borderRadius: 20,
    backgroundColor: "#F9F7FD",
    overflow: "hidden",
  },
  trendingImage: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  bookmarkBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(5, 24, 97, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  trendingInfoBox: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    margin: 12,
    padding: 16,
    borderRadius: 16,
  },
  trendingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C2636",
    marginBottom: 12,
  },
  trendingDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  trendingDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trendingDetailText: {
    fontSize: 14,
    color: "#837C8D",
  },
  trendingActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trendingPrice: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2C2636",
  },
  bookNowBtn: {
    backgroundColor: "#7931ED",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bookNowBtnText: {
    color: "#E5E5E5",
    fontSize: 14,
    fontWeight: "600",
  },
  upcomingSquareCard: {
    width: 140,
    height: 180,
    borderRadius: 24,
    backgroundColor: "#F9F7FD",
    overflow: "hidden",
  },
  upcomingSquareImage: {
    width: "100%",
    height: "100%",
  },
  upcomingSquareOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 24,
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
    fontSize: 14,
    fontWeight: "700",
  },
  bottomNav: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    height: 80,
    backgroundColor: "#FFFFFF",
    borderRadius: 40,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  navText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#2C2636",
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
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 16,
  },
  filterInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  filterChipRow: {
    flexDirection: "row",
    gap: 12,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 20,
  },
  modalFooter: {
    flexDirection: "row",
    marginTop: 32,
    gap: 16,
    marginBottom: 32,
  },
  clearFiltersBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  applyFiltersBtn: {
    flex: 2,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  profilePopup: {
    position: "absolute",
    top: 80,
    left: 20,
    width: 250,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  popupImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  popupName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  popupLocation: {
    fontSize: 14,
    marginBottom: 16,
  },
  popupDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    width: "100%",
    marginBottom: 16,
  },
  popupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#fff1f2",
    borderRadius: 8,
  },
  popupLogoutText: {
    color: "#e11d48",
    fontSize: 16,
    fontWeight: "600",
  },
});
