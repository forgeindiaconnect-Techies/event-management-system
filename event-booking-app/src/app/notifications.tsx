import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

export default function NotificationsScreen() {
  const { isDarkMode, colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'ANNOUNCEMENTS' | 'NOTIFICATIONS'>('NOTIFICATIONS');
  const [loading, setLoading] = useState(true);
  
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'ANNOUNCEMENTS') {
        const eventsRes = await fetch(`${BASE_URL}/events/public`);
        if (eventsRes.ok) {
          const events = await eventsRes.json();
          let allAnnouncements: any[] = [];
          
          for (let i = 0; i < Math.min(events.length, 3); i++) {
            try {
              const annRes = await fetch(`${BASE_URL}/events/${events[i].id}/announcements`);
              if (annRes.ok) {
                const data = await annRes.json();
                allAnnouncements = [...allAnnouncements, ...data];
              }
            } catch (e) {}
          }
          
          allAnnouncements.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setAnnouncements(allAnnouncements);
        }
      } else {
        const res = await fetch(`${BASE_URL}/notifications`);
        if (res.ok) {
           const data = await res.json();
           setNotifications(data.content || []);
        } else {
           setNotifications([]);
        }
      }
    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.cardDate, { color: colors.textMuted }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[styles.cardMessage, { color: colors.textMuted }]}>{item.message || item.content}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Updates</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'NOTIFICATIONS' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} 
          onPress={() => setActiveTab('NOTIFICATIONS')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'NOTIFICATIONS' ? colors.primary : colors.textMuted }]}>My Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ANNOUNCEMENTS' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} 
          onPress={() => setActiveTab('ANNOUNCEMENTS')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'ANNOUNCEMENTS' ? colors.primary : colors.textMuted }]}>Announcements</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'ANNOUNCEMENTS' ? announcements : notifications}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {activeTab === 'ANNOUNCEMENTS' 
                  ? "No announcements right now." 
                  : "You have no new notifications. Log in to see your personal updates."}
              </Text>
            </View>
          }
        />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  cardDate: {
    fontSize: 12,
    marginLeft: 8,
  },
  cardMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 32,
  },
});
