import { useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Switch, Modal, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSession } from './session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

const CATEGORIES = [
  "College Fest", "Technical Symposium", "Cultural Event", "Hackathon", "Workshop", "Seminar", "Conference",
  "Startup Event", "Corporate Training", "Exhibition", "Job Fair", "Charity Event", "Music Festival",
  "Fitness", "Medical Camp", "Sports", "Other"
];

export default function CreateEventScreen() {
  const { session } = useSession();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // DateTimePicker States
  const [showPicker, setShowPicker] = useState<{ visible: boolean, mode: 'date' | 'time', field: string | null }>({
    visible: false, mode: 'date', field: null
  });

  const [form, setForm] = useState({
    eventName: '',
    eventType: '',
    eventMode: 'IN_PERSON',
    startDateTime: new Date(Date.now() + 86400000), // Default to tomorrow
    endDateTime: new Date(Date.now() + 86400000 * 2), // Default to day after
    registrationDeadline: new Date(Date.now() + 86400000 - 3600000), 
    hasRegistrationDeadline: false,
    capacity: '',
    venue: '',
    meetingLink: '',
    paid: false,
    ticketPrice: '',
    certificateEnabled: false,
    certificateTitle: '',
    bannerUrl: '',
  });

  const handleChange = (name: string, value: any) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async () => {
    if (!form.eventName || !form.eventType || !form.capacity || (form.eventMode !== 'VIRTUAL' && !form.venue) || (form.eventMode !== 'IN_PERSON' && !form.meetingLink)) {
      setMessage('Please fill in all required fields (*).');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const payload = {
        ...form,
        portalId: Number(session?.portalId),
        capacity: Number(form.capacity),
        availableSeats: Number(form.capacity),
        ticketPrice: form.paid ? Number(form.ticketPrice) : 0,
        startDateTime: form.startDateTime.toISOString(),
        endDateTime: form.endDateTime.toISOString(),
        registrationDeadline: form.hasRegistrationDeadline ? form.registrationDeadline.toISOString() : null,
        status: 'Draft',
      };

      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Event created successfully!');
        setTimeout(() => router.back(), 1500);
      } else {
        setMessage(data.message || 'Failed to create event.');
      }
    } catch (err) {
      setMessage('Network error. Unable to create event.');
    } finally {
      setLoading(false);
    }
  };

  const ModeCard = ({ mode, icon, title, desc }: any) => {
    const active = form.eventMode === mode;
    return (
      <TouchableOpacity 
        style={[styles.modeCard, active && styles.modeCardActive]} 
        onPress={() => handleChange('eventMode', mode)}
      >
        <View style={[styles.modeIcon, active && styles.modeIconActive]}>
          <Ionicons name={icon} size={20} color={active ? '#3d2e9c' : '#9b9aab'} />
        </View>
        <Text style={[styles.modeTitle, active && styles.modeTitleActive]}>{title}</Text>
        <Text style={styles.modeDesc}>{desc}</Text>
      </TouchableOpacity>
    );
  };

  const handleDateConfirm = (event: any, selectedDate?: Date) => {
    if (!selectedDate || !showPicker.field) {
      setShowPicker({ visible: false, mode: 'date', field: null });
      return;
    }
    
    // On Android, we need to show the time picker right after the date picker is done
    const isDateSelection = showPicker.mode === 'date';
    
    // Keep the time if we're picking a date, and keep the date if we're picking a time
    const currentStoredDate = form[showPicker.field as keyof typeof form] as Date;
    const finalDate = new Date(currentStoredDate);
    
    if (isDateSelection) {
      finalDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    } else {
      finalDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
    }

    handleChange(showPicker.field, finalDate);

    if (Platform.OS === 'android' && isDateSelection) {
      setShowPicker({ visible: true, mode: 'time', field: showPicker.field });
    } else {
      setShowPicker({ visible: false, mode: 'date', field: null });
    }
  };

  const openPicker = (field: string) => {
    setShowPicker({ visible: true, mode: 'date', field });
  };

  const formatDate = (dateObj: Date) => {
    return dateObj.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }} onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={20} color="#1e1b3d" />
          <Text style={{ fontSize: 14, color: '#1e1b3d', fontWeight: '600' }}>Back to Home</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Event Details</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event Name *</Text>
          <TextInput style={styles.input} placeholder="E.g. Annual Tech Summit" value={form.eventName} onChangeText={t => handleChange('eventName', t)} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event Type *</Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowCategoryModal(true)}>
            <Text style={styles.selectBtnText}>{form.eventType || 'Select Category'}</Text>
            <Ionicons name="chevron-down" size={20} color="#68667a" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Capacity (Total Seats) *</Text>
          <TextInput style={styles.input} placeholder="E.g. 500" value={form.capacity} onChangeText={t => handleChange('capacity', t)} keyboardType="numeric" />
        </View>

        <Text style={styles.sectionTitle}>Event Mode</Text>
        <View style={styles.modeContainer}>
          <ModeCard mode="IN_PERSON" icon="business" title="In Person" desc="Physical location" />
          <ModeCard mode="VIRTUAL" icon="laptop" title="Virtual" desc="Online meeting" />
          <ModeCard mode="HYBRID" icon="sync" title="Hybrid" desc="Both combined" />
        </View>

        {form.eventMode !== 'VIRTUAL' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Venue *</Text>
            <TextInput style={styles.input} placeholder="Full address or hall name" value={form.venue} onChangeText={t => handleChange('venue', t)} />
          </View>
        )}

        {form.eventMode !== 'IN_PERSON' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Meeting Link *</Text>
            <TextInput style={styles.input} placeholder="Zoom, Meet, or Teams URL" value={form.meetingLink} onChangeText={t => handleChange('meetingLink', t)} />
          </View>
        )}

        <Text style={styles.sectionTitle}>Schedule</Text>
        <View style={styles.dateRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Start Date & Time</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => openPicker('startDateTime')}>
              <Text style={styles.dateBtnText}>{formatDate(form.startDateTime)}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>End Date & Time</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => openPicker('endDateTime')}>
              <Text style={styles.dateBtnText}>{formatDate(form.endDateTime)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Ticketing & Registration</Text>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.label}>Paid Event?</Text>
            <Text style={styles.desc}>Charge a ticket fee</Text>
          </View>
          <Switch value={form.paid} onValueChange={v => handleChange('paid', v)} trackColor={{ true: '#3d2e9c' }} />
        </View>

        {form.paid && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ticket Price</Text>
            <TextInput style={styles.input} placeholder="e.g. 500" value={form.ticketPrice} onChangeText={t => handleChange('ticketPrice', t)} keyboardType="numeric" />
          </View>
        )}

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.label}>Set Registration Deadline?</Text>
            <Text style={styles.desc}>Close forms automatically</Text>
          </View>
          <Switch value={form.hasRegistrationDeadline} onValueChange={v => handleChange('hasRegistrationDeadline', v)} trackColor={{ true: '#3d2e9c' }} />
        </View>

        {form.hasRegistrationDeadline && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Registration Deadline</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => openPicker('registrationDeadline')}>
              <Text style={styles.dateBtnText}>{formatDate(form.registrationDeadline)}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.label}>Issue Certificates?</Text>
            <Text style={styles.desc}>Award attendees after event</Text>
          </View>
          <Switch value={form.certificateEnabled} onValueChange={v => handleChange('certificateEnabled', v)} trackColor={{ true: '#3d2e9c' }} />
        </View>

        {form.certificateEnabled && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Certificate Title</Text>
            <TextInput style={styles.input} placeholder="e.g. Certificate of Participation" value={form.certificateTitle} onChangeText={t => handleChange('certificateTitle', t)} />
          </View>
        )}

        {message ? <Text style={styles.errorText}>{message}</Text> : null}

        <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Event</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowCategoryModal(false)} activeOpacity={1}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity key={cat} style={styles.optionItem} onPress={() => { handleChange('eventType', cat); setShowCategoryModal(false); }}>
                  <Text style={styles.optionText}>{cat}</Text>
                  {form.eventType === cat && <Ionicons name="checkmark" size={20} color="#3d2e9c" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* DateTime Picker Modal */}
      {showPicker.visible && (
        <DateTimePicker
          value={form[showPicker.field as keyof typeof form] as Date}
          mode={showPicker.mode}
          display="default"
          onChange={handleDateConfirm}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e1b3d', marginTop: 10, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, color: '#1e1b3d', fontWeight: '600', marginBottom: 8 },
  desc: { fontSize: 12, color: '#68667a' },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#eceaf3', borderRadius: 8, height: 48, paddingHorizontal: 16, fontSize: 15 },
  selectBtn: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#eceaf3', borderRadius: 8, height: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectBtnText: { fontSize: 15, color: '#1e1b3d' },
  modeContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  modeCard: { flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#eceaf3', borderRadius: 12, padding: 12, alignItems: 'center' },
  modeCardActive: { borderColor: '#3d2e9c', backgroundColor: '#f0eefa' },
  modeIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f7f7fc', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  modeIconActive: { backgroundColor: '#e2dcfc' },
  modeTitle: { fontSize: 13, fontWeight: '700', color: '#1e1b3d', marginBottom: 2 },
  modeTitleActive: { color: '#3d2e9c' },
  modeDesc: { fontSize: 10, color: '#68667a', textAlign: 'center' },
  dateRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  dateBtn: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#eceaf3', borderRadius: 8, height: 48, justifyContent: 'center', paddingHorizontal: 16 },
  dateBtnText: { fontSize: 14, color: '#1e1b3d' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, backgroundColor: '#ffffff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eceaf3' },
  submitBtn: { backgroundColor: '#3d2e9c', borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 30 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  errorText: { color: '#dc3545', fontSize: 14, marginBottom: 16, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e1b3d', marginBottom: 16, textAlign: 'center' },
  optionItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eceaf3' },
  optionText: { fontSize: 15, color: '#1e1b3d' },
});