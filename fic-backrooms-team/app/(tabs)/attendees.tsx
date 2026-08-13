import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useSession } from '../session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api'; // Match with login

export default function AttendeesScreen() {
  const { session } = useSession();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!session?.portalId || !session?.token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/registrations/portal/${session.portalId}`, {
          headers: { 'Authorization': `Bearer ${session.token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setRegistrations(data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [session]);

  const presentCount = registrations.filter(r => r.attended).length;
  const absentCount = registrations.filter(r => !r.attended).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }} onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={20} color="#1e1b3d" />
          <Text style={{ fontSize: 14, color: '#1e1b3d', fontWeight: '600' }}>Back to Home</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Text style={styles.statLabel}>Present</Text>
            <Text style={[styles.statValue, { color: '#008a3d' }]}>{presentCount}</Text>
          </View>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Text style={styles.statLabel}>Absent</Text>
            <Text style={[styles.statValue, { color: '#dc3545' }]}>{absentCount}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3d2e9c" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.listContainer}>
            {registrations.map(r => (
              <View key={r.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.name}>{r.user?.firstName || 'Guest'} {r.user?.lastName || ''}</Text>
                  <View style={[styles.badge, r.attended ? styles.badgeSuccess : styles.badgeDanger]}>
                    <Text style={[styles.badgeText, r.attended ? styles.badgeSuccessText : styles.badgeDangerText]}>
                      {r.attended ? 'Present' : 'Absent'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.email}>{r.user?.email}</Text>
                <Text style={styles.eventInfo}>Event: {r.event?.eventName || 'N/A'}</Text>
              </View>
            ))}
            {registrations.length === 0 && (
              <Text style={{ textAlign: 'center', padding: 20, color: '#68667a' }}>No attendees found.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' },
  content: { padding: 16 },
  statCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eceaf3', alignItems: 'center' },
  statLabel: { fontSize: 13, color: '#68667a', fontWeight: '600' },
  statValue: { fontSize: 24, fontWeight: '800', marginTop: 4 },
  listContainer: { gap: 12 },
  card: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eceaf3' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 16, fontWeight: '700', color: '#1e1b3d' },
  email: { fontSize: 14, color: '#68667a', marginBottom: 4 },
  eventInfo: { fontSize: 13, color: '#1e1b3d', fontWeight: '500' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeSuccess: { backgroundColor: '#e6f7ec' },
  badgeSuccessText: { color: '#008a3d' },
  badgeDanger: { backgroundColor: '#fce8e8' },
  badgeDangerText: { color: '#dc3545' },
});
