import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSession } from '../session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  LOW: { bg: '#f1f5f9', text: '#64748b' },
  MEDIUM: { bg: '#e0e7ff', text: '#4338ca' },
  HIGH: { bg: '#fef3c7', text: '#d97706' },
  URGENT: { bg: '#fee2e2', text: '#dc2626' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#f1f5f9', text: '#64748b' },
  NOT_STARTED: { bg: '#f1f5f9', text: '#64748b' },
  IN_PROGRESS: { bg: '#fef3c7', text: '#d97706' },
  COMPLETED: { bg: '#dcfce7', text: '#15803d' },
};

export default function VolunteerTasksScreen() {
  const { session } = useSession();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [session]);

  const loadTasks = async () => {
    if (!session?.userId || !session?.token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/volunteer-tasks/volunteer/${session.userId}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      let data = res.ok ? await res.json() : [];
      
      if (session?.portalId) {
        data = data.filter((t: any) => {
          const pId = t.assignment?.event?.portalId || t.assignment?.portalId || t.portalId;
          return Number(pId) === Number(session.portalId) || !pId;
        });
      }

      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/volunteer-tasks/${taskId}/status?status=${newStatus}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session?.token}` },
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      } else {
        Alert.alert('Error', 'Unable to update task status.');
      }
    } catch {
      Alert.alert('Error', 'Network error while updating status.');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <Text style={styles.headerSub}>View and update your assigned tasks</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#5b3cc4" style={{ marginTop: 40 }} />
        ) : tasks.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="list-circle-outline" size={48} color="#9b9aab" />
            <Text style={styles.emptyTitle}>No tasks found</Text>
            <Text style={styles.emptyText}>Tasks assigned by the coordinator will appear here.</Text>
          </View>
        ) : (
          tasks.map((task: any, i: number) => {
            const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM;
            const sc = STATUS_COLORS[task.status] || STATUS_COLORS.PENDING;

            return (
              <View key={task.id || i} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.cardTitle}>{task.title}</Text>
                    <Text style={styles.cardEvent}>{task.assignment?.event?.eventName || 'Event'}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.badgeText, { color: sc.text }]}>{task.status?.replaceAll('_', ' ')}</Text>
                  </View>
                </View>

                {task.description && (
                  <Text style={styles.description}>{task.description}</Text>
                )}

                <View style={styles.metaRow}>
                  <View style={[styles.badge, { backgroundColor: pc.bg, alignSelf: 'flex-start' }]}>
                    <Text style={[styles.badgeText, { color: pc.text }]}>{task.priority}</Text>
                  </View>
                  <View style={styles.timeBox}>
                    <Ionicons name="time-outline" size={14} color="#68667a" />
                    <Text style={styles.timeText}>Start: {formatDate(task.startTime)}</Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  {task.status !== 'IN_PROGRESS' && task.status !== 'COMPLETED' && (
                    <TouchableOpacity style={[styles.actionBtn, { borderColor: '#d97706' }]} onPress={() => updateStatus(task.id, 'IN_PROGRESS')}>
                      <Text style={[styles.actionBtnText, { color: '#d97706' }]}>Start Task</Text>
                    </TouchableOpacity>
                  )}
                  {task.status !== 'COMPLETED' && (
                    <TouchableOpacity style={[styles.actionBtn, { borderColor: '#15803d', backgroundColor: '#f0fdf4' }]} onPress={() => updateStatus(task.id, 'COMPLETED')}>
                      <Ionicons name="checkmark-circle" size={16} color="#15803d" style={{ marginRight: 4 }} />
                      <Text style={[styles.actionBtnText, { color: '#15803d' }]}>Complete</Text>
                    </TouchableOpacity>
                  )}
                  {task.status !== 'PENDING' && task.status !== 'NOT_STARTED' && (
                    <TouchableOpacity style={[styles.actionBtn, { borderColor: '#9b9aab' }]} onPress={() => updateStatus(task.id, 'PENDING')}>
                      <Text style={[styles.actionBtnText, { color: '#68667a' }]}>Reset</Text>
                    </TouchableOpacity>
                  )}
                </View>
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
  header: { padding: 20, paddingTop: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceaf3' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1e1b3d' },
  headerSub: { fontSize: 13, color: '#68667a', marginTop: 2 },
  content: { padding: 16, paddingBottom: 40 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1e1b3d', marginTop: 12 },
  emptyText: { fontSize: 13, color: '#68667a', marginTop: 8, textAlign: 'center' },
  card: { backgroundColor: '#ffffff', padding: 16, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: '#eceaf3' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e1b3d', marginBottom: 2 },
  cardEvent: { fontSize: 13, color: '#5b3cc4', fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  description: { fontSize: 14, color: '#4b4b5a', lineHeight: 20, marginBottom: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  timeBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, color: '#68667a' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 16 },
  actionBtn: { borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
});
