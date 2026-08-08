import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useSession } from '../session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

// Guest / Expert roles only have a schedule, no operational duties
const GUEST_ROLES = ['SPEAKER', 'JUDGE', 'TRAINER', 'CHIEF_GUEST'];

export default function AssignmentsScreen() {
  const { session } = useSession();
  const role = session?.role || '';
  const isGuestRole = GUEST_ROLES.includes(role);
  const displayRole = role.replaceAll('_', ' ');

  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!session?.token || !session?.userId) return;
      try {
        // Universal endpoint that works for all team roles
        const response = await fetch(`${API_BASE_URL}/event-assignments/user/${session.userId}`, {
          headers: { 'Authorization': `Bearer ${session.token}` }
        });
        if (response.ok) {
          const data = await response.json();
          let mapped = data.map((a: any) => ({
            id: a.id?.toString() || Math.random().toString(),
            name: a.eventName || 'Unknown Event',
            date: a.eventStartDateTime
              ? new Date(a.eventStartDateTime).toLocaleDateString() + ' ' + new Date(a.eventStartDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'TBA',
            endDate: a.eventEndDateTime
              ? new Date(a.eventEndDateTime).toLocaleDateString()
              : null,
            location: a.eventVenue || 'TBA',
            roleDuty: a.roleName?.replaceAll('_', ' ') || displayRole,
            status: a.eventStatus,
            eventType: a.eventType,
            sessionTitle: a.sessionTitle,
            sessionDate: a.sessionDate,
            sessionTime: a.sessionTime,
            sessionDescription: a.sessionDescription,
            portalId: a.portalId,
            roleName: a.roleName,
          }));

          if (session?.portalId && session?.role) {
            mapped = mapped.filter((a: any) => {
              const matchesPortal = Number(a.portalId) === Number(session.portalId) || !a.portalId;
              const matchesRole = a.roleName === session.role || (session.role === 'STAFF' && a.roleName === 'Staff');
              return matchesPortal && matchesRole;
            });
          }

          setAssignments(mapped);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [session]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE': return { bg: '#dcfce7', text: '#15803d' };
      case 'UPCOMING': return { bg: '#e0e7ff', text: '#3d2e9c' };
      case 'COMPLETED': return { bg: '#f1f5f9', text: '#64748b' };
      default: return { bg: '#e0e7ff', text: '#3d2e9c' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>
          {isGuestRole ? 'My Schedule' : 'Assigned Events'}
        </Text>
        <Text style={styles.pageSubtitle}>
          {loading ? 'Loading...' : `${assignments.length} ${isGuestRole ? 'engagement' : 'assignment'}${assignments.length !== 1 ? 's' : ''} found`}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#5b3cc4" style={{ marginTop: 40 }} />
        ) : assignments.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={48} color="#9b9aab" />
            <Text style={styles.emptyTitle}>
              {isGuestRole ? 'No engagements yet' : 'No assignments yet'}
            </Text>
            <Text style={styles.emptyText}>
              {isGuestRole
                ? "You haven't been scheduled for any events yet."
                : "You haven't been assigned to any events yet."}
            </Text>
          </View>
        ) : (
          assignments.map((assignment, i) => {
            const statusColors = getStatusColor(assignment.status);
            return (
              <View key={assignment.id || i} style={styles.card}>
                {/* Top row: name + status */}
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{assignment.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                    <Text style={[styles.statusText, { color: statusColors.text }]}>
                      {assignment.status || 'UPCOMING'}
                    </Text>
                  </View>
                </View>

                {/* Role / Duty */}
                <View style={styles.dutyRow}>
                  <Ionicons name={isGuestRole ? 'mic-outline' : 'checkmark-done'} size={14} color="#6646e5" />
                  <Text style={styles.dutyText}>{assignment.roleDuty}</Text>
                </View>

                {/* Session info for Speakers/Experts */}
                {assignment.sessionTitle && (
                  <View style={styles.sessionBox}>
                    <Ionicons name="mic" size={14} color="#7c3aed" />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.sessionTitle}>{assignment.sessionTitle}</Text>
                      {assignment.sessionDescription && (
                        <Text style={styles.sessionDesc}>{assignment.sessionDescription}</Text>
                      )}
                      {(assignment.sessionDate || assignment.sessionTime) && (
                        <Text style={styles.sessionMeta}>
                          {assignment.sessionDate} {assignment.sessionTime}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Event details */}
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={14} color="#9b9aab" />
                  <Text style={styles.metaText}>{assignment.date}</Text>
                </View>
                {assignment.endDate && (
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar" size={14} color="#9b9aab" />
                    <Text style={styles.metaText}>Ends: {assignment.endDate}</Text>
                  </View>
                )}
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color="#9b9aab" />
                  <Text style={styles.metaText}>{assignment.location}</Text>
                </View>
                {assignment.eventType && (
                  <View style={styles.metaRow}>
                    <Ionicons name="layers-outline" size={14} color="#9b9aab" />
                    <Text style={styles.metaText}>{assignment.eventType}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#1e1b3d', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#68667a', marginBottom: 24 },
  emptyBox: { padding: 60, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e1b3d', marginTop: 16 },
  emptyText: { color: '#68667a', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  card: { backgroundColor: '#ffffff', padding: 16, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: '#eceaf3' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e1b3d', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  dutyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  dutyText: { fontSize: 13, fontWeight: '600', color: '#6646e5' },
  sessionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f5f3ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#7c3aed',
  },
  sessionTitle: { fontSize: 14, fontWeight: '700', color: '#3d2e9c' },
  sessionDesc: { fontSize: 12, color: '#68667a', marginTop: 4, lineHeight: 18 },
  sessionMeta: { fontSize: 12, color: '#7c3aed', marginTop: 6, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  metaText: { fontSize: 13, color: '#68667a' },
});
