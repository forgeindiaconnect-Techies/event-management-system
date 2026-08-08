import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useSession } from '../session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

export default function CheckInScreen() {
  const { session } = useSession();
  const [attendees, setAttendees] = useState<any[]>([]);
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
          setAttendees(data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [session]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }} onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={20} color="#1e1b3d" />
          <Text style={{ fontSize: 14, color: '#1e1b3d', fontWeight: '600' }}>Back to Home</Text>
        </TouchableOpacity>
        {loading ? (
          <ActivityIndicator size="large" color="#5b3cc4" style={{ marginTop: 40 }} />
        ) : attendees.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No attendees found for check-in.</Text>
          </View>
        ) : (
          attendees.map((att, i) => (
            <View key={att.id || i} style={styles.card}>
              <Text style={styles.name}>{att.participant?.firstName} {att.participant?.lastName}</Text>
              <Text style={styles.detail}>{att.participant?.email}</Text>
              <Text style={styles.detail}>Event: {att.event?.eventName}</Text>
              <View style={[styles.badge, att.attended ? styles.badgeSuccess : styles.badgePending]}>
                <Text style={[styles.badgeText, att.attended ? styles.badgeSuccessText : styles.badgePendingText]}>
                  {att.attended ? 'Checked In' : 'Pending Check-In'}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' },
  header: { padding: 22, paddingTop: 60, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceaf3' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1e1b3d' },
  content: { padding: 20 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#68667a', fontSize: 16 },
  card: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#eceaf3' },
  name: { fontSize: 18, fontWeight: '700', color: '#1e1b3d', marginBottom: 8 },
  detail: { fontSize: 14, color: '#68667a', marginBottom: 8 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  badgeSuccess: { backgroundColor: '#e6f7ec' },
  badgeSuccessText: { color: '#008a3d' },
  badgePending: { backgroundColor: '#fff8e6' },
  badgePendingText: { color: '#b37400' }
});
