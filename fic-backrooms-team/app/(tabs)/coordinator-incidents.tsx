import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSession } from '../session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  LOW: { bg: '#f0fdf4', text: '#15803d' },
  MEDIUM: { bg: '#fefce8', text: '#a16207' },
  HIGH: { bg: '#fff7ed', text: '#c2410c' },
  CRITICAL: { bg: '#fee2e2', text: '#dc2626' },
};
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: '#fee2e2', text: '#dc2626' },
  IN_PROGRESS: { bg: '#dbeafe', text: '#1d4ed8' },
  RESOLVED: { bg: '#dcfce7', text: '#15803d' },
  CLOSED: { bg: '#f1f5f9', text: '#64748b' },
};
const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function CoordinatorIncidentsScreen() {
  const { session } = useSession();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIncident, setEditingIncident] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('OPEN');
  const [submitting, setSubmitting] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, [session]);

  const loadIncidents = async () => {
    if (!session?.userId || !session?.token) return;
    setLoading(true);
    try {
      const coordRes = await fetch(`${API_BASE_URL}/coordinator-assignments/coordinator/${session.userId}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const assignments = coordRes.ok ? await coordRes.json() : [];

      const eventIds: number[] = assignments
        .filter((a: any) => a.event?.id)
        .map((a: any) => a.event.id);

      if (eventIds.length === 0) {
        setIncidents([]);
        return;
      }

      const results = await Promise.all(
        eventIds.map(async (id) => {
          const res = await fetch(`${API_BASE_URL}/events/${id}/operations/incidents`, {
            headers: { Authorization: `Bearer ${session.token}` },
          });
          const data = res.ok ? await res.json() : [];
          const event = assignments.find((a: any) => a.event?.id === id)?.event;
          return data.map((item: any) => ({ ...item, eventInfo: event }));
        })
      );

      setIncidents(results.flat());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openRespond = (incident: any) => {
    setEditingIncident(incident);
    setSelectedStatus(incident.status || 'OPEN');
    setResolutionNotes(incident.resolutionNotes || '');
  };

  const handleSave = async () => {
    if (!editingIncident) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/events/${editingIncident.eventInfo?.id}/operations/incidents/${editingIncident.id}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${session?.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editingIncident.title,
            description: editingIncident.description,
            category: editingIncident.category,
            severity: editingIncident.severity,
            status: selectedStatus,
            location: editingIncident.location,
            evidenceUrl: editingIncident.evidenceUrl,
            resolutionNotes,
          }),
        }
      );
      if (res.ok) {
        Alert.alert('Saved', 'Incident updated successfully.');
        setEditingIncident(null);
        loadIncidents();
      } else {
        Alert.alert('Error', 'Failed to update incident.');
      }
    } catch {
      Alert.alert('Error', 'Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Incidents</Text>
        <Text style={styles.headerSub}>Review and respond to team incident reports</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#5b3cc4" style={{ marginTop: 40 }} />
        ) : incidents.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="shield-checkmark-outline" size={48} color="#9b9aab" />
            <Text style={styles.emptyTitle}>No incident reports</Text>
            <Text style={styles.emptyText}>No incidents have been reported for your events.</Text>
          </View>
        ) : (
          incidents.map((incident: any, i: number) => {
            const sc = SEVERITY_COLORS[incident.severity] || SEVERITY_COLORS.MEDIUM;
            const stc = STATUS_COLORS[incident.status] || STATUS_COLORS.OPEN;
            return (
              <View key={incident.id || i} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{incident.title}</Text>
                    <Text style={styles.cardEvent}>{incident.eventInfo?.eventName}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: stc.bg }]}>
                    <Text style={[styles.badgeText, { color: stc.text }]}>{incident.status?.replaceAll('_', ' ')}</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.badgeText, { color: sc.text }]}>{incident.severity}</Text>
                  </View>
                  {incident.location && (
                    <Text style={styles.location}>📍 {incident.location}</Text>
                  )}
                </View>

                {incident.description && (
                  <Text style={styles.description}>{incident.description}</Text>
                )}

                <Text style={styles.reportedBy}>
                  Reported by: {incident.reportedByName || 'Team member'} · {incident.category}
                </Text>

                {incident.resolutionNotes && (
                  <View style={styles.resolutionBox}>
                    <Text style={styles.resolutionLabel}>Resolution:</Text>
                    <Text style={styles.resolutionText}>{incident.resolutionNotes}</Text>
                  </View>
                )}

                <TouchableOpacity style={styles.respondBtn} onPress={() => openRespond(incident)}>
                  <Ionicons name="create-outline" size={16} color="#5b3cc4" />
                  <Text style={styles.respondBtnText}>Review & Respond</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Respond Modal */}
      <Modal visible={!!editingIncident} transparent animationType="slide" onRequestClose={() => setEditingIncident(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditingIncident(null)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Respond: {editingIncident?.title}</Text>

            <Text style={styles.fieldLabel}>Update Status</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowStatusPicker(true)}>
              <Text style={{ color: '#1e1b3d', fontWeight: '600' }}>{selectedStatus.replaceAll('_', ' ')}</Text>
              <Ionicons name="chevron-down" size={16} color="#9b9aab" />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Coordinator Response / Resolution Notes *</Text>
            <TextInput
              style={styles.textarea}
              value={resolutionNotes}
              onChangeText={setResolutionNotes}
              placeholder="Describe response and resolution steps..."
              placeholderTextColor="#9b9aab"
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Response</Text>}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Status Picker */}
      <Modal visible={showStatusPicker} transparent animationType="slide" onRequestClose={() => setShowStatusPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowStatusPicker(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Status</Text>
            {STATUSES.map(s => (
              <TouchableOpacity key={s} style={styles.statusPickerItem} onPress={() => { setSelectedStatus(s); setShowStatusPicker(false); }}>
                <Text style={{ fontSize: 15, color: '#1e1b3d' }}>{s.replaceAll('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
  emptyText: { fontSize: 13, color: '#68667a', textAlign: 'center', marginTop: 8 },
  card: { backgroundColor: '#ffffff', padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#eceaf3' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e1b3d', flex: 1, marginRight: 8 },
  cardEvent: { fontSize: 12, color: '#5b3cc4', marginTop: 2, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  location: { fontSize: 12, color: '#68667a' },
  description: { fontSize: 13, color: '#4b4b5a', lineHeight: 20, marginBottom: 8 },
  reportedBy: { fontSize: 12, color: '#9b9aab', marginBottom: 8 },
  resolutionBox: { backgroundColor: '#f0fdf4', borderRadius: 8, padding: 10, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#15803d' },
  resolutionLabel: { fontSize: 11, fontWeight: '700', color: '#15803d', marginBottom: 4 },
  resolutionText: { fontSize: 13, color: '#1e1b3d' },
  respondBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  respondBtnText: { fontSize: 14, fontWeight: '700', color: '#5b3cc4' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '75%' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1e1b3d', marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#68667a', marginTop: 12, marginBottom: 6 },
  pickerBtn: { backgroundColor: '#f7f7fc', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#eceaf3' },
  textarea: { backgroundColor: '#f7f7fc', borderRadius: 8, padding: 12, fontSize: 14, color: '#1e1b3d', borderWidth: 1, borderColor: '#eceaf3', height: 120, marginBottom: 16 },
  saveBtn: { backgroundColor: '#5b3cc4', padding: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  statusPickerItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
});
