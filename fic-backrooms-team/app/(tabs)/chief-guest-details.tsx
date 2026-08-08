import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSession } from '../session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

export default function ChiefGuestDetailsScreen() {
  const { session } = useSession();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [session]);

  const loadEvents = async () => {
    if (!session?.userId || !session?.token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/chief-guest-assignments/chief-guest/${session.userId}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      let data = res.ok ? await res.json() : [];
      
      if (session?.portalId) {
        data = data.filter((a: any) => {
          const pId = a.event?.portalId || a.portalId;
          return Number(pId) === Number(session.portalId) || !pId;
        });
      }

      setAssignments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Event Details</Text>
        <Text style={styles.headerSub}>Information about your assigned events</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#5b3cc4" style={{ marginTop: 40 }} />
        ) : assignments.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={48} color="#9b9aab" />
            <Text style={styles.emptyTitle}>No events assigned</Text>
            <Text style={styles.emptyText}>Assigned event information will appear here.</Text>
          </View>
        ) : (
          assignments.map((assignment: any, i: number) => (
            <View key={assignment.id || i} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Ionicons name="calendar" size={20} color="#5b3cc4" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle}>{assignment.event?.eventName || 'Event not available'}</Text>
                  <Text style={styles.roleSub}>{assignment.roleDescription || 'Chief Guest'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={16} color="#68667a" />
                <Text style={styles.infoText}>Start: {formatDate(assignment.event?.startDateTime)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={16} color="#68667a" />
                <Text style={styles.infoText}>End: {formatDate(assignment.event?.endDateTime)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#68667a" />
                <Text style={styles.infoText}>Venue: {assignment.event?.venue || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color="#68667a" />
                <Text style={styles.infoText}>
                  Organizer: {assignment.event?.organizer?.firstName} {assignment.event?.organizer?.lastName}
                </Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionLabel}>Event Description</Text>
              <View style={styles.descBox}>
                <Text style={styles.descText}>{assignment.event?.description || 'No description available.'}</Text>
              </View>

              <View style={[styles.badge, { backgroundColor: assignment.active !== false ? '#dcfce7' : '#f1f5f9' }]}>
                <Text style={[styles.badgeText, { color: assignment.active !== false ? '#15803d' : '#64748b' }]}>
                  {assignment.active !== false ? 'ASSIGNED' : 'INACTIVE'}
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
  header: { padding: 20, paddingTop: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceaf3' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1e1b3d' },
  headerSub: { fontSize: 13, color: '#68667a', marginTop: 2 },
  content: { padding: 16, paddingBottom: 40 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1e1b3d', marginTop: 12 },
  emptyText: { fontSize: 13, color: '#68667a', marginTop: 8, textAlign: 'center' },
  card: { backgroundColor: '#ffffff', padding: 16, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: '#eceaf3' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#f0edfb', alignItems: 'center', justifyContent: 'center' },
  eventTitle: { fontSize: 17, fontWeight: '700', color: '#1e1b3d', marginBottom: 2 },
  roleSub: { fontSize: 13, color: '#5b3cc4', fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoText: { fontSize: 13, color: '#4b4b5a', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#1e1b3d', marginBottom: 8 },
  descBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', minHeight: 80, marginBottom: 16 },
  descText: { fontSize: 13, color: '#475569', lineHeight: 20 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '800' },
});
