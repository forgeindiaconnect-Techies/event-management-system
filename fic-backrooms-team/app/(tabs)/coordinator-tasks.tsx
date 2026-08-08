import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSession } from '../session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

const CATEGORIES = ['EVENT_OPERATIONS', 'REGISTRATION', 'VENUE_SETUP', 'GUEST_SUPPORT', 'SAFETY', 'LOGISTICS'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  NOT_STARTED: { bg: '#f1f5f9', text: '#64748b' },
  IN_PROGRESS: { bg: '#dbeafe', text: '#1d4ed8' },
  COMPLETED: { bg: '#dcfce7', text: '#15803d' },
  CANCELLED: { bg: '#fee2e2', text: '#dc2626' },
};

export default function CoordinatorTasksScreen() {
  const { session } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [assignees, setAssignees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'EVENT_OPERATIONS',
    priority: 'MEDIUM',
    assignedUserId: '',
    assignedUserName: '',
    dueDateTime: '',
  });

  useEffect(() => {
    loadEvents();
  }, [session]);

  useEffect(() => {
    if (selectedEventId) loadWorkspace(selectedEventId);
  }, [selectedEventId]);

  const loadEvents = async () => {
    if (!session?.userId || !session?.token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/coordinator-assignments/coordinator/${session.userId}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const data = res.ok ? await res.json() : [];
      const eventList = data.filter((a: any) => a.event?.id).map((a: any) => a.event);
      setEvents(eventList);
      if (eventList[0]) setSelectedEventId(String(eventList[0].id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspace = async (eventId: string) => {
    try {
      const [tasksRes, staffRes, volRes] = await Promise.all([
        fetch(`${API_BASE_URL}/events/${eventId}/operations/tasks`, { headers: { Authorization: `Bearer ${session?.token}` } }),
        fetch(`${API_BASE_URL}/staff-assignments/event/${eventId}`, { headers: { Authorization: `Bearer ${session?.token}` } }),
        fetch(`${API_BASE_URL}/volunteer-assignments/event/${eventId}`, { headers: { Authorization: `Bearer ${session?.token}` } }),
      ]);
      setTasks(tasksRes.ok ? await tasksRes.json() : []);
      const staff = staffRes.ok ? await staffRes.json() : [];
      const vols = volRes.ok ? await volRes.json() : [];
      const people = [
        ...staff.map((x: any) => ({ id: x.staff?.id, name: `${x.staff?.firstName || ''} ${x.staff?.lastName || ''}`.trim(), role: 'Staff' })),
        ...vols.map((x: any) => ({ id: x.volunteer?.id, name: `${x.volunteer?.firstName || ''} ${x.volunteer?.lastName || ''}`.trim(), role: 'Volunteer' })),
      ].filter(p => p.id);
      setAssignees(people);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignTask = async () => {
    if (!form.title || !form.assignedUserId) {
      Alert.alert('Missing Info', 'Please fill in the task title and assignee.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/events/${selectedEventId}/operations/tasks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          taskType: 'TASK',
          assignedUserId: Number(form.assignedUserId),
        }),
      });
      if (res.ok) {
        Alert.alert('Success', 'Task assigned successfully.');
        setForm({ title: '', description: '', category: 'EVENT_OPERATIONS', priority: 'MEDIUM', assignedUserId: '', assignedUserName: '', dueDateTime: '' });
        setShowForm(false);
        loadWorkspace(selectedEventId);
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.message || 'Failed to assign task.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEvent = events.find(e => String(e.id) === selectedEventId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasks</Text>
        <Text style={styles.headerSub}>Assign and track tasks for your events</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#5b3cc4" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Event Selector */}
            <TouchableOpacity style={styles.selectorCard} onPress={() => setShowEventPicker(true)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectorLabel}>Event</Text>
                <Text style={styles.selectorValue}>{selectedEvent?.eventName || 'Select event'}</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#5b3cc4" />
            </TouchableOpacity>

            {/* Assign Task Button */}
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowForm(!showForm)}>
              <Ionicons name={showForm ? 'close' : 'add'} size={20} color="#ffffff" />
              <Text style={styles.primaryBtnText}>{showForm ? 'Cancel' : 'Assign Task'}</Text>
            </TouchableOpacity>

            {/* Task Form */}
            {showForm && (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>New Task</Text>

                <Text style={styles.fieldLabel}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={form.title}
                  onChangeText={v => setForm({ ...form, title: v })}
                  placeholder="Task title"
                  placeholderTextColor="#9b9aab"
                />

                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={form.description}
                  onChangeText={v => setForm({ ...form, description: v })}
                  placeholder="Describe the task..."
                  placeholderTextColor="#9b9aab"
                  multiline
                />

                <Text style={styles.fieldLabel}>Assign to *</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowAssigneePicker(true)}>
                  <Text style={{ color: form.assignedUserName ? '#1e1b3d' : '#9b9aab' }}>
                    {form.assignedUserName || 'Select team member'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#9b9aab" />
                </TouchableOpacity>

                <Text style={styles.fieldLabel}>Category</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowCategoryPicker(true)}>
                  <Text style={{ color: '#1e1b3d' }}>{form.category.replaceAll('_', ' ')}</Text>
                  <Ionicons name="chevron-down" size={16} color="#9b9aab" />
                </TouchableOpacity>

                <Text style={styles.fieldLabel}>Priority</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowPriorityPicker(true)}>
                  <Text style={{ color: '#1e1b3d' }}>{form.priority}</Text>
                  <Ionicons name="chevron-down" size={16} color="#9b9aab" />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={handleAssignTask} disabled={submitting}>
                  {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryBtnText}>Submit Task</Text>}
                </TouchableOpacity>
              </View>
            )}

            {/* Task List */}
            <Text style={styles.sectionTitle}>Tasks ({tasks.length})</Text>
            {tasks.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="checkmark-circle-outline" size={40} color="#9b9aab" />
                <Text style={styles.emptyText}>No tasks assigned yet.</Text>
              </View>
            ) : (
              tasks.map((t: any, i: number) => {
                const sc = STATUS_COLORS[t.status] || STATUS_COLORS.NOT_STARTED;
                return (
                  <View key={t.id || i} style={styles.taskCard}>
                    <View style={styles.taskHeader}>
                      <Text style={styles.taskTitle}>{t.title}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.statusText, { color: sc.text }]}>{t.status?.replaceAll('_', ' ')}</Text>
                      </View>
                    </View>
                    <Text style={styles.taskSub}>{t.category?.replaceAll('_', ' ')} · {t.priority}</Text>
                    <Text style={styles.taskAssignee}>→ {t.assignedUserName || 'Unassigned'}</Text>
                    {t.dueDateTime && (
                      <Text style={styles.taskDue}>Due: {new Date(t.dueDateTime).toLocaleString()}</Text>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* Pickers */}
      {[
        { visible: showEventPicker, onClose: () => setShowEventPicker(false), title: 'Select Event', items: events.map((e: any) => ({ value: String(e.id), label: e.eventName })), onSelect: (v: string) => setSelectedEventId(v) },
        { visible: showCategoryPicker, onClose: () => setShowCategoryPicker(false), title: 'Select Category', items: CATEGORIES.map(c => ({ value: c, label: c.replaceAll('_', ' ') })), onSelect: (v: string) => setForm({ ...form, category: v }) },
        { visible: showPriorityPicker, onClose: () => setShowPriorityPicker(false), title: 'Select Priority', items: PRIORITIES.map(p => ({ value: p, label: p })), onSelect: (v: string) => setForm({ ...form, priority: v }) },
        { visible: showAssigneePicker, onClose: () => setShowAssigneePicker(false), title: 'Select Assignee', items: assignees.map((a: any) => ({ value: String(a.id), label: `${a.name} — ${a.role}` })), onSelect: (v: string) => { const p = assignees.find(a => String(a.id) === v); setForm({ ...form, assignedUserId: v, assignedUserName: p?.name || '' }); } },
      ].map(({ visible, onClose, title, items, onSelect }) => (
        <Modal key={title} visible={visible} transparent animationType="slide" onRequestClose={onClose}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{title}</Text>
              <ScrollView>
                {items.map(item => (
                  <TouchableOpacity key={item.value} style={styles.modalItem} onPress={() => { onSelect(item.value); onClose(); }}>
                    <Text style={styles.modalItemText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' },
  header: { padding: 20, paddingTop: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceaf3' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1e1b3d' },
  headerSub: { fontSize: 13, color: '#68667a', marginTop: 2 },
  content: { padding: 16, paddingBottom: 40 },
  selectorCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eceaf3', flexDirection: 'row', alignItems: 'center' },
  selectorLabel: { fontSize: 11, fontWeight: '700', color: '#9b9aab', textTransform: 'uppercase', letterSpacing: 0.8 },
  selectorValue: { fontSize: 15, fontWeight: '700', color: '#1e1b3d', marginTop: 2 },
  primaryBtn: { backgroundColor: '#5b3cc4', paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  primaryBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  formCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#eceaf3' },
  formTitle: { fontSize: 17, fontWeight: '800', color: '#1e1b3d', marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#68667a', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f7f7fc', borderRadius: 8, padding: 12, fontSize: 14, color: '#1e1b3d', borderWidth: 1, borderColor: '#eceaf3' },
  pickerBtn: { backgroundColor: '#f7f7fc', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#eceaf3' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1e1b3d', marginBottom: 12, marginTop: 4 },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#68667a', marginTop: 8, fontSize: 14 },
  taskCard: { backgroundColor: '#ffffff', padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eceaf3' },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  taskTitle: { fontSize: 15, fontWeight: '700', color: '#1e1b3d', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  taskSub: { fontSize: 12, color: '#68667a', marginBottom: 4 },
  taskAssignee: { fontSize: 13, color: '#5b3cc4', fontWeight: '600' },
  taskDue: { fontSize: 12, color: '#f59e0b', marginTop: 4, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1e1b3d', marginBottom: 16 },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalItemText: { fontSize: 15, color: '#1e1b3d', fontWeight: '500' },
});
