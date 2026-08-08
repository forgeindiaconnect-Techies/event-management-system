import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';

import { useSession } from '../session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

export default function ReportsScreen() {
  const { session } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    fetchPortalEvents();
  }, [session?.portalId]);

  useEffect(() => {
    if (selectedEventId) {
      fetchEventReport(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchPortalEvents = async () => {
    if (!session?.portalId || !session?.token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/events/portal/${session.portalId}`, {
        headers: { Authorization: `Bearer ${session.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data || []);
        if (data && data.length > 0) {
          setSelectedEventId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventReport = async (eventId: string) => {
    if (!session?.token) return;
    try {
      setReportLoading(true);
      const res = await fetch(`${API_BASE_URL}/reports/event/${eventId}/summary`, {
        headers: { Authorization: `Bearer ${session.token}` }
      });
      if (res.ok) {
        setReport(await res.json());
      } else {
        setReport(null);
      }
    } catch (e) {
      console.error(e);
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  };

  const selectedEventName = events.find(e => e.id === selectedEventId)?.eventName || 'Select an event';

  const cards = report ? [
    { title: 'Registrations', value: report.totalRegistrations, icon: 'people' },
    { title: 'Participants', value: report.participants, icon: 'person-add' },
    { title: 'Audience', value: report.audience, icon: 'calendar' },
    { title: 'Checked In', value: report.checkedIn, icon: 'checkmark-done' },
    { title: 'Paid', value: report.paid, icon: 'card' },
    { title: 'Free', value: report.free, icon: 'cash' },
    { title: 'Pending', value: report.pending, icon: 'time' },
    { title: 'Failed', value: report.failed, icon: 'close-circle' },
  ] : [];

  return (
    <SafeAreaView style={styles.safeArea}>

      {loading ? (
        <ActivityIndicator size="large" color="#3d2e9c" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }} onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={20} color="#1e1b3d" />
          <Text style={{ fontSize: 14, color: '#1e1b3d', fontWeight: '600' }}>Back to Home</Text>
        </TouchableOpacity>
          <Text style={styles.pageSubtitle}>View event reports based on the selected portal event.</Text>

          <View style={styles.pickerBox}>
            <Text style={styles.pickerLabel}>Select Portal Event</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setPickerVisible(true)}>
              <Text style={styles.pickerBtnText}>{selectedEventName}</Text>
              <Ionicons name="chevron-down" size={20} color="#68667a" />
            </TouchableOpacity>

            <View style={styles.currentReportBox}>
              <Text style={styles.currentReportLabel}>Current Report</Text>
              <Text style={styles.currentReportName}>{report?.eventName || 'No event selected'}</Text>
            </View>
          </View>

          {reportLoading ? (
            <ActivityIndicator size="large" color="#3d2e9c" style={{ marginTop: 40 }} />
          ) : report ? (
            <>
              <View style={styles.grid}>
                {cards.map((card, idx) => (
                  <View key={idx} style={styles.card}>
                    <Ionicons name={card.icon as any} size={24} color="#3d2e9c" style={styles.cardIcon} />
                    <Text style={styles.cardLabel}>{card.title}</Text>
                    <Text style={styles.cardValue}>{card.value ?? 0}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Report Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Event</Text>
                  <Text style={styles.summaryVal}>{report.eventName}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Registrations</Text>
                  <Text style={styles.summaryVal}>{report.totalRegistrations}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Checked In</Text>
                  <Text style={styles.summaryVal}>{report.checkedIn}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Payment Breakdown</Text>
                  <Text style={styles.summaryVal}>Paid {report.paid}, Free {report.free}, Pending {report.pending}</Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.noReportText}>No report data available.</Text>
          )}

        </ScrollView>
      )}

      {/* Event Picker Modal */}
      <Modal visible={pickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Event</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#1e1b3d" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={events}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, selectedEventId === item.id && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedEventId(item.id);
                    setPickerVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, selectedEventId === item.id && styles.modalItemTextActive]}>{item.eventName}</Text>
                  {selectedEventId === item.id && <Ionicons name="checkmark" size={20} color="#3d2e9c" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 44 - 16) / 2; // screen width - padding - gap

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 22, paddingTop: 60, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceaf3' },
  backBtn: { padding: 4, marginLeft: -4 },
  refreshBtn: { padding: 4, marginRight: -4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1e1b3d' },
  content: { padding: 22, paddingBottom: 60 },
  pageSubtitle: { fontSize: 15, color: '#68667a', marginBottom: 20 },
  pickerBox: { backgroundColor: '#ffffff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#eceaf3', marginBottom: 24 },
  pickerLabel: { fontSize: 14, fontWeight: '700', color: '#1e1b3d', marginBottom: 8 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#eceaf3', borderRadius: 10, padding: 14, backgroundColor: '#ffffff' },
  pickerBtnText: { fontSize: 15, color: '#1e1b3d' },
  currentReportBox: { marginTop: 16, backgroundColor: '#f4f6f9', padding: 16, borderRadius: 12 },
  currentReportLabel: { fontSize: 13, color: '#68667a' },
  currentReportName: { fontSize: 18, fontWeight: '800', color: '#1e1b3d', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  card: { width: cardWidth, backgroundColor: '#ffffff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#eceaf3' },
  cardIcon: { marginBottom: 12 },
  cardLabel: { fontSize: 13, color: '#68667a', fontWeight: '600' },
  cardValue: { fontSize: 28, fontWeight: '800', color: '#1e1b3d', marginTop: 4 },
  summaryBox: { backgroundColor: '#ffffff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#eceaf3' },
  summaryTitle: { fontSize: 18, fontWeight: '800', color: '#1e1b3d', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0eef6' },
  summaryKey: { fontSize: 14, color: '#68667a', fontWeight: '600', flex: 1 },
  summaryVal: { fontSize: 14, color: '#1e1b3d', fontWeight: '800', flex: 2, textAlign: 'right' },
  noReportText: { textAlign: 'center', color: '#68667a', marginTop: 20 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#eceaf3' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1e1b3d' },
  modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0eef6' },
  modalItemActive: { backgroundColor: '#f4f6f9' },
  modalItemText: { fontSize: 16, color: '#1e1b3d' },
  modalItemTextActive: { fontWeight: '700', color: '#3d2e9c' }
});
