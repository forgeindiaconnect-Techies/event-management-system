import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from './session';
import { useRouter } from 'expo-router';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

const ROLES = [
  "Staff",
  "COORDINATOR",
  "VOLUNTEER",
  "SPEAKER",
  "CHIEF_GUEST",
];

export default function TeamAssignmentScreen() {
  const { session } = useSession();
  const router = useRouter();

  const [events, setEvents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [role, setRole] = useState('Staff');
  const [eventId, setEventId] = useState('');
  const [userId, setUserId] = useState('');
  const [duty, setDuty] = useState('');

  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);

  const loadData = async () => {
    if (!session?.userId || !session?.portalId || !session?.token) return;
    setLoading(true);
    try {
      const [eventRes, userRes] = await Promise.all([
        fetch(`${API_BASE_URL}/events/organizer/${session.userId}`, { headers: { 'Authorization': `Bearer ${session.token}` } }),
        fetch(`${API_BASE_URL}/users/portal/${session.portalId}`, { headers: { 'Authorization': `Bearer ${session.token}` } })
      ]);
      
      if (eventRes.ok) {
        const myEvents = await eventRes.json() || [];
        setEvents(myEvents);
        if (myEvents.length > 0) setEventId(myEvents[0].id.toString());
      }
      
      if (userRes.ok) {
        setUsers(await userRes.json() || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session]);

  const filteredUsers = users.filter(u => (u.role?.roleName || u.roleName || u.role) === role);

  const handleAssign = async () => {
    if (!eventId || !userId) {
      Alert.alert('Error', 'Please select both an event and a user.');
      return;
    }

    setSubmitting(true);
    let payload: any = {};
    let endpoint = "";

    if (role === "Staff") {
      endpoint = "/staff-assignments";
      payload = {
        duty,
        event: { id: Number(eventId) },
        staff: { id: Number(userId) },
        assignedBy: { id: Number(session?.userId) },
      };
    } else if (role === "COORDINATOR") {
      endpoint = "/coordinator-assignments";
      payload = {
        event: { id: Number(eventId) },
        coordinator: { id: Number(userId) },
        assignedBy: { id: Number(session?.userId) },
      };
    } else if (role === "VOLUNTEER") {
      endpoint = "/volunteer-assignments";
      payload = {
        duty,
        event: { id: Number(eventId) },
        volunteer: { id: Number(userId) },
        assignedBy: { id: Number(session?.userId) },
      };
    } else if (role === "SPEAKER") {
      endpoint = "/speaker-assignments";
      payload = {
        sessionTitle: duty,
        topic: duty,
        event: { id: Number(eventId) },
        speaker: { id: Number(userId) },
        assignedBy: { id: Number(session?.userId) },
      };
    } else if (role === "CHIEF_GUEST") {
      endpoint = "/chief-guest-assignments";
      payload = {
        roleDescription: duty,
        event: { id: Number(eventId) },
        chiefGuest: { id: Number(userId) },
        assignedBy: { id: Number(session?.userId) },
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        Alert.alert('Success', 'Team member assigned successfully.');
        setUserId('');
        setDuty('');
      } else {
        const data = await response.json();
        Alert.alert('Error', data.message || 'Assignment failed.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }} onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={20} color="#1e1b3d" />
          <Text style={{ fontSize: 14, color: '#1e1b3d', fontWeight: '600' }}>Back to Home</Text>
        </TouchableOpacity>
        {loading ? (
          <ActivityIndicator size="large" color="#3d2e9c" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <Ionicons name="people-circle-outline" size={28} color="#3d2e9c" style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Assign Team Member</Text>
            </View>

            <Text style={styles.label}>Select Role</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setRoleModalVisible(true)}>
              <Text style={styles.selectBtnText}>{role}</Text>
              <Ionicons name="chevron-down" size={20} color="#68667a" />
            </TouchableOpacity>

            <Text style={styles.label}>Select Event</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setEventModalVisible(true)}>
              <Text style={styles.selectBtnText}>
                {eventId ? events.find(e => e.id.toString() === eventId)?.eventName : 'Select Event'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#68667a" />
            </TouchableOpacity>

            <Text style={styles.label}>Select User</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setUserModalVisible(true)}>
              <Text style={styles.selectBtnText} numberOfLines={1}>
                {userId ? filteredUsers.find(u => u.id.toString() === userId)?.firstName : 'Select User'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#68667a" />
            </TouchableOpacity>

            {(role === "Staff" || role === "VOLUNTEER" || role === "SPEAKER" || role === "CHIEF_GUEST") && (
              <>
                <Text style={styles.label}>Duty / Description</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder={role === "SPEAKER" ? "Session Topic..." : "Duty (e.g. Registration desk)"} 
                  value={duty}
                  onChangeText={setDuty}
                />
              </>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleAssign} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={20} color="#fff" />
                  <Text style={styles.submitBtnText}>Assign Member</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Role Modal */}
      <Modal transparent visible={roleModalVisible} animationType="fade" onRequestClose={() => setRoleModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setRoleModalVisible(false)}>
          <View style={styles.optionsModalContent}>
            <Text style={styles.modalTitle}>Select Role</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {ROLES.map(r => (
                <TouchableOpacity 
                  key={r} 
                  style={[styles.optionItem, role === r && { backgroundColor: '#f0eef6' }]} 
                  onPress={() => {
                    setRole(r);
                    setUserId(''); // Reset user when role changes
                    setRoleModalVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{r}</Text>
                  {role === r && <Ionicons name="checkmark" size={20} color="#3d2e9c" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Event Modal */}
      <Modal transparent visible={eventModalVisible} animationType="fade" onRequestClose={() => setEventModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEventModalVisible(false)}>
          <View style={styles.optionsModalContent}>
            <Text style={styles.modalTitle}>Select Event</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {events.map(evt => (
                <TouchableOpacity 
                  key={evt.id} 
                  style={[styles.optionItem, eventId === evt.id.toString() && { backgroundColor: '#f0eef6' }]} 
                  onPress={() => {
                    setEventId(evt.id.toString());
                    setEventModalVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{evt.eventName}</Text>
                  {eventId === evt.id.toString() && <Ionicons name="checkmark" size={20} color="#3d2e9c" />}
                </TouchableOpacity>
              ))}
              {events.length === 0 && <Text style={{ textAlign: 'center', padding: 20, color: '#68667a' }}>No events found</Text>}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* User Modal */}
      <Modal transparent visible={userModalVisible} animationType="fade" onRequestClose={() => setUserModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setUserModalVisible(false)}>
          <View style={styles.optionsModalContent}>
            <Text style={styles.modalTitle}>Select User</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {filteredUsers.map(u => (
                <TouchableOpacity 
                  key={u.id} 
                  style={[styles.optionItem, userId === u.id.toString() && { backgroundColor: '#f0eef6' }]} 
                  onPress={() => {
                    setUserId(u.id.toString());
                    setUserModalVisible(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionText}>{u.firstName} {u.lastName}</Text>
                    <Text style={{ fontSize: 12, color: '#68667a' }}>{u.email}</Text>
                  </View>
                  {userId === u.id.toString() && <Ionicons name="checkmark" size={20} color="#3d2e9c" />}
                </TouchableOpacity>
              ))}
              {filteredUsers.length === 0 && <Text style={{ textAlign: 'center', padding: 20, color: '#68667a' }}>No users found for this role</Text>}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 60, paddingBottom: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceaf3' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1e1b3d' },
  
  content: { padding: 16 },
  card: { backgroundColor: '#ffffff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#eceaf3' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e1b3d' },
  
  label: { fontSize: 14, fontWeight: '600', color: '#1e1b3d', marginBottom: 8 },
  input: { backgroundColor: '#f7f7fc', borderWidth: 1, borderColor: '#eceaf3', borderRadius: 8, paddingHorizontal: 16, height: 48, fontSize: 16, marginBottom: 16 },
  
  selectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f7f7fc', borderWidth: 1, borderColor: '#eceaf3', borderRadius: 8, paddingHorizontal: 16, height: 48, marginBottom: 16 },
  selectBtnText: { fontSize: 16, color: '#1e1b3d' },
  
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3d2e9c', borderRadius: 8, height: 50, gap: 8, marginTop: 8 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  optionsModalContent: { width: '100%', backgroundColor: '#ffffff', borderRadius: 16, padding: 8, maxHeight: '80%' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1e1b3d', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0eef6', marginBottom: 8, textAlign: 'center' },
  optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0eef6' },
  optionText: { fontSize: 16, fontWeight: '500', color: '#1e1b3d' },
});
