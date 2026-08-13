import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from './session';
import { useRouter } from 'expo-router';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

const ROLES = [
  "Staff",
  "VOLUNTEER",
  "COORDINATOR",
  "SPEAKER",
  "JUDGE",
  "TRAINER",
  "CHIEF_GUEST",
];

export default function InviteStaffScreen() {
  const { session } = useSession();
  const router = useRouter();
  
  const [events, setEvents] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = useState('');
  const [roleName, setRoleName] = useState('Staff');
  const [eventId, setEventId] = useState('');

  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);

  const loadData = async () => {
    if (!session?.userId || !session?.portalId || !session?.token) return;
    setLoading(true);
    try {
      const [eventsRes, invRes] = await Promise.all([
        fetch(`${API_BASE_URL}/events/organizer/${session.userId}`, { headers: { 'Authorization': `Bearer ${session.token}` } }),
        fetch(`${API_BASE_URL}/role-invitations/organizer/${session.userId}`, { headers: { 'Authorization': `Bearer ${session.token}` } })
      ]);
      
      if (eventsRes.ok) setEvents(await eventsRes.json() || []);
      if (invRes.ok) setInvitations(await invRes.json() || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session]);

  const handleInvite = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }
    
    setSubmitting(true);
    
    const selectedEvent = events.find(e => e.id.toString() === eventId);
    
    const payload: any = {
      email,
      roleName,
      portalId: session?.portalId,
      invitedById: session?.userId,
    };

    if (selectedEvent) {
      payload.eventId = selectedEvent.id;
      payload.eventName = selectedEvent.eventName;
      payload.eventDescription = selectedEvent.description;
      payload.eventVenue = selectedEvent.venue || selectedEvent.meetingLink;
      payload.eventStartDateTime = selectedEvent.startDateTime;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/role-invitations/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Invitation sent successfully');
        setEmail('');
        setRoleName('Staff');
        setEventId('');
        loadData();
      } else {
        const data = await response.json();
        Alert.alert('Error', data.message || 'Failed to send invitation');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'ACCEPTED') return { bg: '#dcfce7', text: '#15803d' };
    if (status === 'PENDING') return { bg: '#fef3c7', text: '#b45309' };
    if (status === 'EXPIRED') return { bg: '#fee2e2', text: '#b91c1c' };
    return { bg: '#f1f5f9', text: '#475569' };
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
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Send Invitation</Text>
              
              <Text style={styles.label}>Email Address</Text>
              <TextInput style={styles.input} placeholder="staff@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

              <Text style={styles.label}>Assign Role</Text>
              <TouchableOpacity style={styles.selectBtn} onPress={() => setRoleModalVisible(true)}>
                <Text style={styles.selectBtnText}>{roleName}</Text>
                <Ionicons name="chevron-down" size={20} color="#68667a" />
              </TouchableOpacity>

              <Text style={styles.label}>Event (Optional)</Text>
              <TouchableOpacity style={styles.selectBtn} onPress={() => setEventModalVisible(true)}>
                <Text style={styles.selectBtnText}>{eventId ? events.find(e => e.id.toString() === eventId)?.eventName : 'General Staff (No Event)'}</Text>
                <Ionicons name="chevron-down" size={20} color="#68667a" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitBtn} onPress={handleInvite} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Send Invite</Text>}
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Recent Invitations</Text>
            {invitations.length === 0 ? (
              <Text style={styles.emptyText}>No invitations sent yet.</Text>
            ) : (
              <View style={styles.listContainer}>
                {invitations.map((inv, idx) => {
                  const statusColors = getStatusColor(inv.status);
                  return (
                    <View key={idx} style={styles.invCard}>
                      <View style={styles.invHeader}>
                        <Text style={styles.invEmail}>{inv.email}</Text>
                        <View style={[styles.badge, { backgroundColor: statusColors.bg }]}>
                          <Text style={[styles.badgeText, { color: statusColors.text }]}>{inv.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.invRole}>Role: {inv.roleName}</Text>
                      {inv.eventName && <Text style={styles.invEvent}>Event: {inv.eventName}</Text>}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Role Modal */}
      <Modal transparent visible={roleModalVisible} animationType="fade" onRequestClose={() => setRoleModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setRoleModalVisible(false)}>
          <View style={styles.optionsModalContent}>
            <Text style={styles.modalTitle}>Select Role</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {ROLES.map(r => (
                <TouchableOpacity key={r} style={[styles.optionItem, roleName === r && { backgroundColor: '#f0eef6' }]} onPress={() => { setRoleName(r); setRoleModalVisible(false); }}>
                  <Text style={styles.optionText}>{r}</Text>
                  {roleName === r && <Ionicons name="checkmark" size={20} color="#3d2e9c" />}
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
              <TouchableOpacity style={[styles.optionItem, !eventId && { backgroundColor: '#f0eef6' }]} onPress={() => { setEventId(''); setEventModalVisible(false); }}>
                <Text style={styles.optionText}>General Staff (No specific event)</Text>
                {!eventId && <Ionicons name="checkmark" size={20} color="#3d2e9c" />}
              </TouchableOpacity>
              {events.map(evt => (
                <TouchableOpacity key={evt.id} style={[styles.optionItem, eventId === evt.id.toString() && { backgroundColor: '#f0eef6' }]} onPress={() => { setEventId(evt.id.toString()); setEventModalVisible(false); }}>
                  <Text style={styles.optionText}>{evt.eventName}</Text>
                  {eventId === evt.id.toString() && <Ionicons name="checkmark" size={20} color="#3d2e9c" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' },
  content: { padding: 16 },
  card: { backgroundColor: '#ffffff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#eceaf3', marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e1b3d', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#1e1b3d', marginBottom: 8 },
  input: { backgroundColor: '#f7f7fc', borderWidth: 1, borderColor: '#eceaf3', borderRadius: 8, height: 48, paddingHorizontal: 16, fontSize: 15, marginBottom: 16 },
  selectBtn: { backgroundColor: '#f7f7fc', borderWidth: 1, borderColor: '#eceaf3', borderRadius: 8, height: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  selectBtnText: { fontSize: 15, color: '#1e1b3d' },
  submitBtn: { backgroundColor: '#3d2e9c', borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#68667a', marginTop: 20 },
  listContainer: { gap: 12 },
  invCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eceaf3' },
  invHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  invEmail: { fontSize: 15, fontWeight: '600', color: '#1e1b3d' },
  invRole: { fontSize: 13, color: '#68667a', marginBottom: 4 },
  invEvent: { fontSize: 13, color: '#1e1b3d', fontWeight: '500' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  optionsModalContent: { width: '100%', backgroundColor: '#ffffff', borderRadius: 16, padding: 8, maxHeight: '80%' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1e1b3d', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0eef6', marginBottom: 8, textAlign: 'center' },
  optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0eef6' },
  optionText: { fontSize: 15, fontWeight: '500', color: '#1e1b3d' },
});
