import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSession } from '../session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

const INCIDENT_TYPES = ['Medical', 'Security', 'Technical', 'Logistical', 'Other'];

export default function IncidentReportScreen() {
  const { session } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [incidentType, setIncidentType] = useState<string>('Security');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [typeModalVisible, setTypeModalVisible] = useState(false);

  useEffect(() => {
    async function loadEvents() {
      if (!session?.token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/assigned-events`, {
          headers: { 'Authorization': `Bearer ${session.token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
          if (data.events && data.events.length > 0) {
            setSelectedEventId(data.events[0].id.toString());
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [session]);

  const handleSubmit = async () => {
    if (!selectedEventId || !description.trim()) {
      Alert.alert('Error', 'Please select an event and provide a description.');
      return;
    }
    
    setIsSubmitting(true);
    // Mocking submission
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert('Success', 'Incident report submitted successfully.');
      setDescription('');
    }, 1000);
  };

  const selectedEventName = events.find(e => e.id.toString() === selectedEventId)?.name || 'Select Event';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 }} onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={20} color="#1e1b3d" />
          <Text style={{ fontSize: 14, color: '#1e1b3d', fontWeight: '600' }}>Back to Home</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Report an Incident</Text>
        <Text style={styles.subtitle}>Quickly log any issues during the event.</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#5b3cc4" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Event</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setEventModalVisible(true)}>
              <Text style={styles.dropdownText}>{selectedEventName}</Text>
              <Ionicons name="chevron-down" size={20} color="#1e1b3d" />
            </TouchableOpacity>

            <Text style={styles.label}>Incident Type</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setTypeModalVisible(true)}>
              <Text style={styles.dropdownText}>{incidentType}</Text>
              <Ionicons name="chevron-down" size={20} color="#1e1b3d" />
            </TouchableOpacity>

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe the incident in detail..."
              placeholderTextColor="#a0a0a0"
              multiline
              numberOfLines={6}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />

            <TouchableOpacity 
              style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]} 
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Report</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Event Modal */}
      <Modal transparent visible={eventModalVisible} animationType="fade" onRequestClose={() => setEventModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEventModalVisible(false)}>
          <View style={styles.modalContent}>
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
                  <Text style={styles.optionText}>{evt.name}</Text>
                  {selectedEventId === evt.id.toString() && <Ionicons name="checkmark" size={20} color="#3d2e9c" />}
                </TouchableOpacity>
              ))}
              {events.length === 0 && (
                <Text style={{ textAlign: 'center', padding: 20, color: '#68667a' }}>No assigned events found</Text>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Type Modal */}
      <Modal transparent visible={typeModalVisible} animationType="fade" onRequestClose={() => setTypeModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setTypeModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Incident Type</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {INCIDENT_TYPES.map(type => (
                <TouchableOpacity 
                  key={type} 
                  style={[styles.optionItem, incidentType === type && { backgroundColor: '#f0eef6' }]} 
                  onPress={() => {
                    setIncidentType(type);
                    setTypeModalVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{type}</Text>
                  {incidentType === type && <Ionicons name="checkmark" size={20} color="#3d2e9c" />}
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
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e1b3d', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#68667a', marginBottom: 24 },
  form: { gap: 16 },
  label: { fontSize: 14, fontWeight: '700', color: '#1e1b3d', marginBottom: -8 },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#eceaf3', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  dropdownText: { fontSize: 16, color: '#1e1b3d' },
  textArea: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#eceaf3', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1e1b3d', minHeight: 120 },
  submitBtn: { backgroundColor: '#3d2e9c', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#ffffff', borderRadius: 16, padding: 8, maxHeight: '80%' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1e1b3d', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0eef6', marginBottom: 8, textAlign: 'center' },
  optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0eef6' },
  optionText: { fontSize: 16, fontWeight: '600', color: '#1e1b3d' },
});
