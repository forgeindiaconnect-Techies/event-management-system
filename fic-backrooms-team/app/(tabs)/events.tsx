import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity, Linking, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

const STATUS_FILTERS = ['All', 'Live', 'Upcoming', 'Published', 'Draft', 'Completed'];



export default function EventsScreen() {
  const { session } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!session?.portalId || !session?.token) return;
      const isAdmin = session?.role === 'PORTAL_ADMIN';
      const isOrganizer = session?.role === 'ORGANIZER';
      
      let eventsUrl = `${API_BASE_URL}/events/portal/${session.portalId}`;
      if (isOrganizer && session?.userId) {
        eventsUrl = `${API_BASE_URL}/events/organizer/${session.userId}`;
      } else if (!isAdmin && !isOrganizer) {
        eventsUrl = `${API_BASE_URL}/dashboard/assigned-events`;
      }

      try {
        const [eventsRes, orgsRes] = await Promise.all([
          fetch(eventsUrl, {
            headers: { 'Authorization': `Bearer ${session.token}` }
          }),
          fetch(`${API_BASE_URL}/users/portal/${session.portalId}`, {
            headers: { 'Authorization': `Bearer ${session.token}` }
          })
        ]);
        
        if (eventsRes.ok) {
          const data = await eventsRes.json();
          if (!isAdmin && !isOrganizer) {
            setEvents(data.events || []);
          } else {
            setEvents(data || []);
          }
        }
        
        if (orgsRes.ok) {
          const orgsData = await orgsRes.json();
          const mappedOrgs = (orgsData || []).map((m: any) => ({ ...m, role: m.role?.roleName || m.roleName || m.role }));
          const filteredOrgs = mappedOrgs.filter((m: any) => m.role === 'ORGANIZER' || m.role === 'PORTAL_ADMIN'); // optionally include PORTAL_ADMIN if they can be organizers
          setOrganizers(filteredOrgs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [session]);

  const filteredEvents = filterStatus === 'All' 
    ? events 
    : events.filter(e => e.status && e.status.toLowerCase() === filterStatus.toLowerCase());

  const handleOpenOptions = (evt: any) => {
    setSelectedEvent(evt);
    setOptionsModalVisible(true);
  };

  const handlePublish = () => {
    setOptionsModalVisible(false);
    Alert.alert("Publish Event", `Status updated to Published for ${selectedEvent?.eventName}. (Dummy implementation)`);
  };

  const handleTrash = () => {
    setOptionsModalVisible(false);
    Alert.alert("Trash Event", `Event ${selectedEvent?.eventName} moved to trash. (Dummy implementation)`);
  };

  const handleAssignOrganizer = (org: any) => {
    setAssignModalVisible(false);
    const orgName = org.firstName ? `${org.firstName} ${org.lastName || ''}` : (org.name || 'Organizer');
    Alert.alert("Organizer Assigned", `${orgName} has been assigned to ${selectedEvent?.eventName}. (Dummy implementation)`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STATUS_FILTERS.map(status => (
            <TouchableOpacity 
              key={status} 
              style={[styles.filterPill, filterStatus === status && styles.filterPillActive]}
              onPress={() => setFilterStatus(status)}
            >
              <Text style={[styles.filterText, filterStatus === status && styles.filterTextActive]}>{status}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }} onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={20} color="#1e1b3d" />
          <Text style={{ fontSize: 14, color: '#1e1b3d', fontWeight: '600' }}>Back to Home</Text>
        </TouchableOpacity>
        {loading ? (
          <ActivityIndicator size="large" color="#5b3cc4" style={{ marginTop: 40 }} />
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No events found.</Text>
          </View>
        ) : (
          filteredEvents.map((evt, i) => (
            <TouchableOpacity key={evt.id || i} style={styles.card} onPress={() => Linking.openURL(`https://event-management-system-virid-psi.vercel.app/events/${evt.id}`)}>
              {evt.bannerUrl && (
                <Image source={{ uri: evt.bannerUrl }} style={styles.cardBanner} />
              )}
              
              {(session?.role === 'PORTAL_ADMIN' || session?.role === 'ORGANIZER') && (
                <TouchableOpacity style={styles.optionsBtn} onPress={() => handleOpenOptions(evt)}>
                  <Ionicons name="ellipsis-vertical" size={20} color="#1e1b3d" />
                </TouchableOpacity>
              )}

              <View style={styles.cardContent}>
                <Text style={styles.eventName}>{evt.eventName}</Text>
                <Text style={styles.eventDetail}>Status: {evt.status}</Text>
                <Text style={styles.eventDetail}>Mode: {evt.eventMode}</Text>
                {evt.venue && <Text style={styles.eventDetail}>Venue: {evt.venue}</Text>}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Options Modal */}
      <Modal transparent visible={optionsModalVisible} animationType="fade" onRequestClose={() => setOptionsModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOptionsModalVisible(false)}>
          <View style={styles.optionsModalContent}>
            <Text style={styles.modalTitle}>{selectedEvent?.eventName}</Text>
            
            <TouchableOpacity style={styles.optionItem} onPress={handlePublish}>
              <Ionicons name="globe-outline" size={20} color="#3d2e9c" />
              <Text style={styles.optionText}>Publish Event</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionItem} onPress={() => { setOptionsModalVisible(false); setTimeout(() => setAssignModalVisible(true), 300); }}>
              <Ionicons name="person-add-outline" size={20} color="#3d2e9c" />
              <Text style={styles.optionText}>Assign Organizer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.optionItem, { borderBottomWidth: 0 }]} onPress={handleTrash}>
              <Ionicons name="trash-outline" size={20} color="#d93025" />
              <Text style={[styles.optionText, { color: '#d93025' }]}>Trash Event</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Assign Organizer Modal */}
      <Modal transparent visible={assignModalVisible} animationType="fade" onRequestClose={() => setAssignModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAssignModalVisible(false)}>
          <View style={[styles.optionsModalContent, { maxHeight: '70%' }]}>
            <Text style={[styles.modalTitle, { fontSize: 16, color: '#1e1b3d', borderBottomWidth: 1, borderBottomColor: '#f0eef6', paddingBottom: 12, marginBottom: 8 }]}>Choose or Assign Organizer</Text>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 16 }}>
              {organizers.map(org => (
                <TouchableOpacity key={org.id} style={[styles.optionItem, { paddingVertical: 12, paddingHorizontal: 8 }]} onPress={() => handleAssignOrganizer(org)}>
                  <View style={[styles.orgAvatar, { width: 32, height: 32, borderRadius: 16, marginRight: 12 }]}>
                    <Text style={[styles.orgAvatarText, { fontSize: 14 }]}>{org.firstName?.charAt(0) || org.name?.charAt(0) || 'O'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionText}>{org.firstName ? `${org.firstName} ${org.lastName || ''}` : (org.name || 'Organizer')}</Text>
                    <Text style={{ fontSize: 12, color: '#68667a', marginTop: 2 }}>{org.email}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {organizers.length === 0 && (
                <Text style={{ textAlign: 'center', padding: 20, color: '#68667a' }}>No organizers available</Text>
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
  
  filterContainer: { backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceaf3' },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0eef6' },
  filterPillActive: { backgroundColor: '#3d2e9c' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#68667a' },
  filterTextActive: { color: '#ffffff' },

  content: { padding: 20 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#68667a', fontSize: 16 },
  
  card: { backgroundColor: '#ffffff', borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#eceaf3', overflow: 'hidden' },
  cardBanner: { width: '100%', height: 140 },
  cardContent: { padding: 16, paddingRight: 40 },
  eventName: { fontSize: 18, fontWeight: '700', color: '#1e1b3d', marginBottom: 8 },
  eventDetail: { fontSize: 14, color: '#68667a', marginBottom: 4 },
  
  optionsBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.9)', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', zIndex: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  optionsModalContent: { width: '100%', backgroundColor: '#ffffff', borderRadius: 16, padding: 8 },
  modalTitle: { fontSize: 14, fontWeight: '700', color: '#68667a', padding: 12, paddingBottom: 8, textAlign: 'center' },
  optionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0eef6', gap: 12 },
  optionText: { fontSize: 16, fontWeight: '600', color: '#1e1b3d' },

  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceaf3' },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#1e1b3d' },
  closeBtn: { fontSize: 16, fontWeight: '700', color: '#3d2e9c' },
  
  orgCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eceaf3' },
  orgAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e1b3d', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  orgAvatarText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  orgName: { fontSize: 16, fontWeight: '700', color: '#1e1b3d' },
  orgEmail: { fontSize: 13, color: '#68667a', marginTop: 2 },
});
