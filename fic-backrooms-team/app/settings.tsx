import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useSession } from './session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

export default function SettingsScreen() {
  const { session } = useSession();
  
  const [portal, setPortal] = useState({
    portalName: '',
    portalCode: '',
    description: '',
    category: '',
    logoUrl: '',
    active: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchPortal();
  }, [session?.portalId]);

  const fetchPortal = async () => {
    if (!session?.portalId || !session?.token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/portals/${session.portalId}`, {
        headers: { Authorization: `Bearer ${session.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPortal({
          portalName: data.portalName || '',
          portalCode: data.portalCode || '',
          description: data.description || '',
          category: data.category || '',
          logoUrl: data.logoUrl || '',
          active: data.active ?? true,
        });
      }
    } catch (e) {
      console.log(e);
      setMessage({ type: 'error', text: 'Unable to load portal settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!session?.portalId || !session?.token) return;
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      const res = await fetch(`${API_BASE_URL}/portals/${session.portalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({
          portalName: portal.portalName,
          description: portal.description,
          category: portal.category,
          logoUrl: portal.logoUrl,
          active: portal.active,
        })
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Portal settings updated successfully.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update settings.' });
      }
    } catch (error) {
      console.log(error);
      setMessage({ type: 'error', text: 'Unable to update portal settings.' });
    } finally {
      setSaving(false);
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
            <View style={styles.header}>
              <View style={styles.iconBox}>
                <Ionicons name="settings" size={24} color="#3d2e9c" />
              </View>
              <Text style={styles.title}>Portal Settings</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Portal Name</Text>
              <TextInput style={styles.input} value={portal.portalName} onChangeText={t => setPortal(p => ({ ...p, portalName: t }))} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.textArea]} value={portal.description} onChangeText={t => setPortal(p => ({ ...p, description: t }))} multiline numberOfLines={3} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <TextInput style={styles.input} value={portal.category} onChangeText={t => setPortal(p => ({ ...p, category: t }))} />
            </View>

            {message.text ? (
              <View style={[styles.messageBox, message.type === 'success' ? styles.messageSuccess : styles.messageError]}>
                <Ionicons name={message.type === 'success' ? "checkmark-circle" : "warning"} size={20} color={message.type === 'success' ? '#008a3d' : '#dc3545'} />
                <Text style={[styles.messageText, message.type === 'success' ? { color: '#008a3d' } : { color: '#dc3545' }]}>{message.text}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Settings</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' },
  content: { padding: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#eceaf3' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f0eefa', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#1e1b3d' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, color: '#68667a', marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#f7f7fc', borderWidth: 1, borderColor: '#eceaf3', borderRadius: 8, height: 48, paddingHorizontal: 16, fontSize: 15, color: '#1e1b3d' },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  saveBtn: { backgroundColor: '#3d2e9c', borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  messageBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8, marginBottom: 16 },
  messageSuccess: { backgroundColor: '#e6f7ec', borderWidth: 1, borderColor: '#a3d9b8' },
  messageError: { backgroundColor: '#fce8e8', borderWidth: 1, borderColor: '#f5c6cb' },
  messageText: { fontSize: 14, fontWeight: '600', flex: 1 },
});
