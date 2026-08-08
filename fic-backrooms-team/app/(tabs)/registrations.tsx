import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

export default function RegistrationsScreen() {
  const { session } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [eventModalVisible, setEventModalVisible] = useState(false);

  useEffect(() => {
    async function loadOrganizerEvents() {
      if (!session?.userId || !session?.token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/events/organizer/${session.userId}`, {
          headers: { 'Authorization': `Bearer ${session.token}` }
        });
        if (response.ok) {
          const myEvents = await response.json();
          setEvents(myEvents || []);
          if (myEvents && myEvents.length > 0) {
            setSelectedEventId(myEvents[0].id.toString());
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadOrganizerEvents();
  }, [session]);

  useEffect(() => {
    async function loadRegistrations() {
      if (!selectedEventId || !session?.token) return;
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/registrations/event/${selectedEventId}`, {
          headers: { 'Authorization': `Bearer ${session.token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setRegistrations(data || []);
        } else {
          setRegistrations([]);
        }
      } catch (err) {
        console.error(err);
        setRegistrations([]);
      } finally {
        setLoading(false);
      }
    }
    if (selectedEventId) {
      loadRegistrations();
    }
  }, [selectedEventId, session]);

  const total = registrations.length;
  const participants = registrations.filter((reg) => reg.registrationType === 'PARTICIPANT').length;
  const audience = registrations.filter((reg) => reg.registrationType === 'AUDIENCE').length;
  const checkedIn = registrations.filter((reg) => reg.attended).length;

  const selectedEventName = events.find(e => e.id.toString() === selectedEventId)?.eventName || 'Select Event';

  return (
    <SafeAreaView style={styles.safeArea}>

      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEventModalVisible(true)}>
          <Text style={styles.dropdownBtnText} numberOfLines={1}>{selectedEventName}</Text>
          <Ionicons name="chevron-down" size={20} color="#1e1b3d" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }} onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={20} color="#1e1b3d" />
          <Text style={{ fontSize: 14, color: '#1e1b3d', fontWeight: '600' }}>Back to Home</Text>
        </TouchableOpacity>
        {loading && registrations.length === 0 ? (
          <ActivityIndicator size="large" color="#3d2e9c" style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="people-outline" size={24} color="#3d2e9c" />
                <Text style={styles.statLabel}>Total</Text>
                <Text style={styles.statValue}>{total}</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="person-outline" size={24} color="#15803d" />
                <Text style={styles.statLabel}>Participants</Text>
                <Text style={styles.statValue}>{participants}</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="people-outline" size={24} color="#a16207" />
                <Text style={styles.statLabel}>Audience</Text>
                <Text style={styles.statValue}>{audience}</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#0369a1" />
                <Text style={styles.statLabel}>Checked In</Text>
                <Text style={styles.statValue}>{checkedIn}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Registration List</Text>
            
            {registrations.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No registrations found.</Text>
              </View>
            ) : (
              registrations.map((reg, i) => (
                <View key={reg.id || i} style={styles.regCard}>
                  <View style={styles.regCardHeader}>
                    <Text style={styles.regName}>{reg.participant?.firstName} {reg.participant?.lastName}</Text>
                    <View style={[styles.badge, { backgroundColor: reg.registrationType === 'PARTICIPANT' ? '#e0e7ff' : '#ffedd5' }]}>
                      <Text style={[styles.badgeText, { color: reg.registrationType === 'PARTICIPANT' ? '#3d2e9c' : '#c2410c' }]}>
                        {reg.registrationType}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.regEmail}>{reg.participant?.email || 'N/A'}</Text>
                  
                  <View style={styles.regMeta}>
                    <Text style={styles.metaText}>Payment: {reg.paymentStatus || 'N/A'}</Text>
                    <Text style={styles.metaText}>Status: {reg.status}</Text>
                  </View>
                  
                  <View style={[styles.attendanceBadge, { backgroundColor: reg.attended ? '#dcfce7' : '#f1f5f9' }]}>
                    <Text style={[styles.attendanceBadgeText, { color: reg.attended ? '#15803d' : '#64748b' }]}>
                      {reg.attended ? 'Present' : 'Absent'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Event Selection Modal */}
      <Modal transparent visible={eventModalVisible} animationType="fade" onRequestClose={() => setEventModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEventModalVisible(false)}>
          <View style={styles.optionsModalContent}>
            <Text style={styles.modalTitle}>Select Event</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {events.map(evt => (
                <TouchableOpacity 
                  key={evt.id} 
                  style={[styles.optionItem, selectedEventId === evt.id.toString() && { backgroundColor: '#f0eef6' }]} 
                  onPress={() => {
                    setSelectedEventId(evt.id.toString());
                    setEventModalVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{evt.eventName}</Text>
                  {selectedEventId === evt.id.toString() && <Ionicons name="checkmark" size={20} color="#3d2e9c" />}
                </TouchableOpacity>
              ))}
              {events.length === 0 && (
                <Text style={{ textAlign: 'center', padding: 20, color: '#68667a' }}>No events found</Text>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' },
  header: { padding: 22, paddingTop: 60, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceaf3' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1e1b3d' },
  headerSubtitle: { fontSize: 14, color: '#68667a', marginTop: 4 },
  
  filterContainer: { padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceaf3' },
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f7f7fc', borderWidth: 1, borderColor: '#eceaf3', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  dropdownBtnText: { fontSize: 16, fontWeight: '600', color: '#1e1b3d', flex: 1 },

  content: { padding: 16 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { width: '48%', backgroundColor: '#ffffff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eceaf3' },
  statLabel: { fontSize: 13, color: '#68667a', marginTop: 8, marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1e1b3d' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e1b3d', marginBottom: 16 },
  
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#68667a', fontSize: 16 },

  regCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eceaf3' },
  regCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  regName: { fontSize: 16, fontWeight: '700', color: '#1e1b3d', flex: 1, marginRight: 8 },
  regEmail: { fontSize: 14, color: '#68667a', marginBottom: 12 },
  
  regMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  metaText: { fontSize: 13, color: '#4b5563', fontWeight: '500' },
  
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

  attendanceBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  attendanceBadgeText: { fontSize: 12, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  optionsModalContent: { width: '100%', backgroundColor: '#ffffff', borderRadius: 16, padding: 8, maxHeight: '80%' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1e1b3d', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0eef6', marginBottom: 8, textAlign: 'center' },
  optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0eef6' },
  optionText: { fontSize: 16, fontWeight: '600', color: '#1e1b3d' },
});
