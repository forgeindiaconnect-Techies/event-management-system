import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSession } from '../session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

export default function CoordinatorReportsScreen() {
  const { session } = useSession();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadReports();
  }, [session]);

  const loadReports = async () => {
    if (!session?.userId || !session?.token) return;
    setLoading(true);
    try {
      const coordRes = await fetch(`${API_BASE_URL}/coordinator-assignments/coordinator/${session.userId}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const data = coordRes.ok ? await coordRes.json() : [];
      const assignedEvents = data.filter((a: any) => a.active !== false && a.event?.id);
      
      setAssignments(assignedEvents);
      
      const initialDrafts: Record<string, string> = {};
      assignedEvents.forEach((a: any) => {
        if (a.event?.id) initialDrafts[a.event.id] = a.completionReport || '';
      });
      setDrafts(initialDrafts);

      const eventIds: number[] = assignedEvents.map((a: any) => a.event.id);
      if (eventIds.length > 0) {
        const [regResults, ticketResults] = await Promise.all([
          Promise.all(eventIds.map(id => fetch(`${API_BASE_URL}/registrations/event/${id}`, { headers: { Authorization: `Bearer ${session.token}` } }).then(r => r.ok ? r.json() : []))),
          Promise.all(eventIds.map(id => fetch(`${API_BASE_URL}/tickets/event/${id}`, { headers: { Authorization: `Bearer ${session.token}` } }).then(r => r.ok ? r.json() : []))),
        ]);
        setRegistrations(regResults.flat());
        setTickets(ticketResults.flat());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async (eventId: string) => {
    const report = drafts[eventId]?.trim();
    if (!report) {
      Alert.alert('Empty Report', 'Please enter a completion report summary.');
      return;
    }
    setSubmitting(prev => ({ ...prev, [eventId]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/coordinator-assignments/event/${eventId}/completion-report`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session?.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ report }),
      });
      if (res.ok) {
        Alert.alert('Success', 'Completion report submitted.');
        loadReports();
      } else {
        Alert.alert('Error', 'Failed to submit report.');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error.');
    } finally {
      setSubmitting(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const totalReg = registrations.length;
  const totalPresent = registrations.filter(r => r.attended).length;
  const totalVerified = tickets.filter(t => t.status === 'USED').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports & Final Sign-off</Text>
        <Text style={styles.headerSub}>View stats and submit completion reports</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#5b3cc4" style={{ marginTop: 40 }} />
        ) : assignments.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="document-text-outline" size={48} color="#9b9aab" />
            <Text style={styles.emptyTitle}>No events assigned</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Registrations</Text>
                <Text style={styles.statValue}>{totalReg}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Present</Text>
                <Text style={styles.statValue}>{totalPresent}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Verified Tix</Text>
                <Text style={styles.statValue}>{totalVerified}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Event Completion Reports</Text>
            {assignments.map((assignment: any) => {
              const eventId = String(assignment.event?.id);
              const eventRegs = registrations.filter(r => String(r.event?.id) === eventId);
              const eventTickets = tickets.filter(t => String(t.registration?.event?.id) === eventId);
              const present = eventRegs.filter(r => r.attended).length;
              const used = eventTickets.filter(t => t.status === 'USED').length;

              return (
                <View key={assignment.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="flag-outline" size={20} color="#5b3cc4" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.cardTitle}>{assignment.event?.eventName}</Text>
                      <Text style={styles.cardSub}>
                        {eventRegs.length} registered · {present} present · {used} verified
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>Completion Summary</Text>
                  <TextInput
                    style={styles.textarea}
                    placeholder="Summarize attendance, incidents, handover notes..."
                    placeholderTextColor="#9b9aab"
                    multiline
                    textAlignVertical="top"
                    value={drafts[eventId]}
                    onChangeText={(val) => setDrafts(prev => ({ ...prev, [eventId]: val }))}
                  />

                  {assignment.reportSubmittedAt && (
                    <Text style={styles.lastSubmitted}>
                      Last submitted: {new Date(assignment.reportSubmittedAt).toLocaleString()}
                    </Text>
                  )}

                  <TouchableOpacity 
                    style={styles.submitBtn} 
                    onPress={() => submitReport(eventId)}
                    disabled={submitting[eventId]}
                  >
                    {submitting[eventId] ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.submitBtnText}>Submit Report</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
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
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#68667a', marginTop: 12 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: '#ffffff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eceaf3', alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#68667a', fontWeight: '600', marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1e1b3d' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1e1b3d', marginBottom: 12 },
  card: { backgroundColor: '#ffffff', padding: 16, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: '#eceaf3' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e1b3d' },
  cardSub: { fontSize: 13, color: '#68667a', marginTop: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#68667a', marginBottom: 8 },
  textarea: { backgroundColor: '#f7f7fc', borderRadius: 8, padding: 12, fontSize: 14, color: '#1e1b3d', borderWidth: 1, borderColor: '#eceaf3', height: 100, marginBottom: 8 },
  lastSubmitted: { fontSize: 11, color: '#15803d', fontStyle: 'italic', marginBottom: 12, textAlign: 'right' },
  submitBtn: { backgroundColor: '#5b3cc4', padding: 12, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});
