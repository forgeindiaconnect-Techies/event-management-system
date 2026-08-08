import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSession } from '../session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

export default function SpeakerSessionsScreen() {
  const { session } = useSession();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, [session]);

  const loadSessions = async () => {
    if (!session?.userId || !session?.token) return;
    setLoading(true);
    try {
      const [eventAssignmentRes, speakerAssignmentRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/event-assignments/user/${session.userId}`, { headers: { Authorization: `Bearer ${session.token}` } }).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE_URL}/speaker-assignments/speaker/${session.userId}`, { headers: { Authorization: `Bearer ${session.token}` } }).then(r => r.ok ? r.json() : []),
      ]);

      const eventAssignments = eventAssignmentRes.status === 'fulfilled'
        ? (eventAssignmentRes.value || [])
            .filter((a: any) => String(a.roleName || '').trim().toUpperCase() === 'SPEAKER')
            .map((a: any) => ({
              id: `event-assignment-${a.id}`,
              active: a.active,
              eventName: a.eventName,
              sessionTitle: a.sessionTitle || a.eventName || 'Session not added',
              sessionDescription: a.sessionDescription,
              sessionDate: a.sessionDate,
              sessionTime: a.sessionTime,
              topic: a.sessionDescription || a.roleName,
              portalId: a.portalId,
              event: {
                id: a.eventId,
                eventName: a.eventName,
                venue: a.eventVenue,
                startDateTime: a.eventStartDateTime,
                endDateTime: a.eventEndDateTime,
              },
            }))
        : [];

      const speakerAssignments = speakerAssignmentRes.status === 'fulfilled' ? (speakerAssignmentRes.value || []) : [];

      // Merge avoiding duplicates
      const seen = new Set();
      let merged = [...eventAssignments, ...speakerAssignments].filter((a: any) => {
        const key = `${a.event?.id || a.eventId || ''}-${a.sessionTitle || a.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (session?.portalId) {
        merged = merged.filter((a: any) => {
          const pId = a.portalId || a.event?.portalId;
          return Number(pId) === Number(session.portalId) || !pId;
        });
      }

      setSessions(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatSessionDate = (sessionItem: any) => {
    if (sessionItem.sessionDate || sessionItem.sessionTime) {
      return [sessionItem.sessionDate, sessionItem.sessionTime].filter(Boolean).join(', ');
    }
    if (!sessionItem.event?.startDateTime) return 'N/A';
    return new Date(sessionItem.event.startDateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Sessions</Text>
        <Text style={styles.headerSub}>View your assigned speaking sessions</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#5b3cc4" style={{ marginTop: 40 }} />
        ) : sessions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="mic-outline" size={48} color="#9b9aab" />
            <Text style={styles.emptyTitle}>No sessions assigned</Text>
            <Text style={styles.emptyText}>Sessions assigned by the organizer will appear here.</Text>
          </View>
        ) : (
          sessions.map((item: any, i: number) => (
            <View key={item.id || i} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Ionicons name="mic" size={20} color="#5b3cc4" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionTitle}>{item.sessionTitle || 'Session not added'}</Text>
                  <View style={[styles.badge, { backgroundColor: item.active !== false ? '#dcfce7' : '#f1f5f9' }]}>
                    <Text style={[styles.badgeText, { color: item.active !== false ? '#15803d' : '#64748b' }]}>
                      {item.active !== false ? 'ACTIVE' : 'INACTIVE'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#68667a" />
                <Text style={styles.infoText}>{item.event?.eventName || 'Event not available'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#68667a" />
                <Text style={styles.infoText}>{item.event?.venue || 'Venue not added'}</Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.topicLabel}>Topic</Text>
              <Text style={styles.topicText}>{item.topic || item.sessionDescription || 'Topic not added'}</Text>

              <View style={styles.timeBox}>
                <View>
                  <Text style={styles.timeLabel}>Session Time</Text>
                  <Text style={styles.timeText}>{formatSessionDate(item)}</Text>
                </View>
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
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#f0edfb', alignItems: 'center', justifyContent: 'center' },
  sessionTitle: { fontSize: 16, fontWeight: '700', color: '#1e1b3d', marginBottom: 6 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: '800' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoText: { fontSize: 13, color: '#4b4b5a', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
  topicLabel: { fontSize: 11, fontWeight: '700', color: '#68667a', textTransform: 'uppercase', marginBottom: 4 },
  topicText: { fontSize: 14, color: '#1e1b3d', marginBottom: 16 },
  timeBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  timeLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 4 },
  timeText: { fontSize: 13, color: '#0f172a', fontWeight: '600' },
});
