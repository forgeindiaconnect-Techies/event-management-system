import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';

import { useSession } from '../session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

export default function AnalyticsScreen() {
  const { session } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [session?.portalId]);

  const fetchAnalyticsData = async () => {
    if (!session?.portalId || !session?.token) return;
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${session.token}` };
      const [eventsRes, regRes] = await Promise.all([
        fetch(`${API_BASE_URL}/events/portal/${session.portalId}`, { headers }),
        fetch(`${API_BASE_URL}/registrations/portal/${session.portalId}`, { headers })
      ]);
      if (eventsRes.ok) setEvents(await eventsRes.json() || []);
      if (regRes.ok) setRegistrations(await regRes.json() || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalEvents = events.length;
  const publishedEvents = events.filter((e) => e.status === 'PUBLISHED').length;
  const completedEvents = events.filter((e) => e.status === 'COMPLETED').length;
  const totalRegistrations = registrations.length;
  const presentCount = registrations.filter((r) => r.attended).length;
  const absentCount = registrations.filter((r) => !r.attended).length;
  const attendanceRate = totalRegistrations === 0 ? 0 : Math.round((presentCount / totalRegistrations) * 100);

  const cards = [
    { title: 'Total Events', value: totalEvents, icon: 'calendar-outline', color: '#3d2e9c' },
    { title: 'Published', value: publishedEvents, icon: 'trending-up-outline', color: '#10b981' },
    { title: 'Completed', value: completedEvents, icon: 'checkmark-circle-outline', color: '#6366f1' },
    { title: 'Total Reg.', value: totalRegistrations, icon: 'people-outline', color: '#f59e0b' },
    { title: 'Checked In', value: presentCount, icon: 'person-add-outline', color: '#14b8a6' },
    { title: 'Absent', value: absentCount, icon: 'person-remove-outline', color: '#ef4444' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>

      {loading ? (
        <ActivityIndicator size="large" color="#3d2e9c" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }} onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={20} color="#1e1b3d" />
          <Text style={{ fontSize: 14, color: '#1e1b3d', fontWeight: '600' }}>Back to Home</Text>
        </TouchableOpacity>
          <Text style={styles.pageSubtitle}>Track event performance and attendee engagement.</Text>

          <View style={styles.grid}>
            {cards.map((card, idx) => (
              <View key={idx} style={styles.card}>
                <View style={[styles.iconBox, { backgroundColor: card.color + '15' }]}>
                  <Ionicons name={card.icon as any} size={22} color={card.color} />
                </View>
                <Text style={styles.cardLabel}>{card.title}</Text>
                <Text style={styles.cardValue}>{card.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.attendanceBox}>
            <Text style={styles.attendanceTitle}>Attendance Rate</Text>
            <Text style={styles.attendanceDesc}>Percentage of registered attendees who checked in.</Text>
            <View style={styles.attendanceChart}>
              <Text style={styles.attendancePercent}>{attendanceRate}%</Text>
              <Text style={styles.attendanceLabel}>Checked In</Text>
            </View>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 44 - 16) / 2; // screen width - padding - gap

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 22, paddingTop: 60, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceaf3' },
  backBtn: { padding: 4, marginLeft: -4 },
  refreshBtn: { padding: 4, marginRight: -4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1e1b3d' },
  content: { padding: 22, paddingBottom: 60 },
  pageSubtitle: { fontSize: 15, color: '#68667a', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: cardWidth, backgroundColor: '#ffffff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#eceaf3' },
  iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 13, color: '#68667a', fontWeight: '600' },
  cardValue: { fontSize: 28, fontWeight: '800', color: '#1e1b3d', marginTop: 4 },
  attendanceBox: { backgroundColor: '#ffffff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#eceaf3', marginTop: 24 },
  attendanceTitle: { fontSize: 18, fontWeight: '800', color: '#1e1b3d' },
  attendanceDesc: { fontSize: 14, color: '#68667a', marginTop: 4, marginBottom: 20 },
  attendanceChart: { height: 160, backgroundColor: '#f4f6f9', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  attendancePercent: { fontSize: 48, fontWeight: '800', color: '#1e1b3d' },
  attendanceLabel: { fontSize: 15, color: '#68667a', fontWeight: '600', marginTop: 4 },
});
