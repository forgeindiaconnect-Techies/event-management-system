import { useState, useEffect } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from './session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

export default function InviteOrganizerScreen() {
  const { session } = useSession();
  const [activeTab, setActiveTab] = useState<'email' | 'manual'>('email');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!session?.portalId || !session?.token) return;
      try {
        const [orgRes, invRes] = await Promise.all([
          fetch(`${API_BASE_URL}/users/portal/${session.portalId}`, { headers: { 'Authorization': `Bearer ${session.token}` } }),
          fetch(`${API_BASE_URL}/invitations/portal/${session.portalId}`, { headers: { 'Authorization': `Bearer ${session.token}` } })
        ]);

        if (orgRes.ok) {
          const allUsers = await orgRes.json();
          const filteredOrganizers = allUsers.filter((user: any) => {
            const roleStr = user.role?.roleName || user.roleName || user.role;
            return String(roleStr).toUpperCase() === 'ORGANIZER';
          });
          setOrganizers(filteredOrganizers);
        }

        if (invRes.ok) {
          const allInvites = await invRes.json();
          setPendingInvites(allInvites || []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, [session]);

  // Email form state
  const [email, setEmail] = useState('');

  // Manual form state
  const [manualForm, setManualForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });

  const handleManualChange = (name: string, value: string) => {
    setManualForm(prev => ({ ...prev, [name]: value }));
  };

  const generateTempPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let p = '';
    for (let i = 0; i < 10; i++) {
      p += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setManualForm(prev => ({ ...prev, password: p }));
  };

  const submitEmailInvite = async () => {
    if (!email.trim()) {
      setMessage('Please enter an email address.');
      return;
    }
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/invitations/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        },
        body: JSON.stringify({
          email: email.trim(),
          portalId: Number(session?.portalId),
          invitedById: Number(session?.userId)
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Invitation sent successfully to the organizer email.');
        setEmail('');
      } else {
        setMessage(data.message || 'Failed to send invitation.');
      }
    } catch (err) {
      setMessage('Network error. Unable to send invitation.');
    } finally {
      setLoading(false);
    }
  };

  const submitManualAdd = async () => {
    if (!manualForm.firstName || !manualForm.lastName || !manualForm.email || !manualForm.phoneNumber || !manualForm.password) {
      setMessage('Please fill in all required fields including a temporary password.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/invitations/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        },
        body: JSON.stringify({
          ...manualForm,
          portalId: Number(session?.portalId),
          invitedById: Number(session?.userId)
        })
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', `Organizer created.\nEmail: ${manualForm.email}\nPassword: ${manualForm.password}`);
        setMessage('Organizer account created. Please share the login details privately.');
        setManualForm({ firstName: '', lastName: '', email: '', phoneNumber: '', password: '' });
      } else {
        setMessage(data.message || 'Failed to create organizer.');
      }
    } catch (err) {
      setMessage('Network error. Unable to create organizer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }} onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={20} color="#1e1b3d" />
          <Text style={{ fontSize: 14, color: '#1e1b3d', fontWeight: '600' }}>Back to Home</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.tabs}>
            <TouchableOpacity style={[styles.tab, activeTab === 'email' && styles.activeTab]} onPress={() => setActiveTab('email')}>
              <Text style={[styles.tabText, activeTab === 'email' && styles.activeTabText]}>Email Invite</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'manual' && styles.activeTab]} onPress={() => setActiveTab('manual')}>
              <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>Manual Add</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'email' ? (
            <View style={styles.formContent}>
              <Text style={styles.label}>Organizer's Email</Text>
              <TextInput style={styles.input} placeholder="organizer@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <TouchableOpacity style={styles.submitBtn} onPress={submitEmailInvite} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Send Invitation</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContent}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput style={styles.input} placeholder="John" value={manualForm.firstName} onChangeText={t => handleManualChange('firstName', t)} />
              
              <Text style={styles.label}>Last Name *</Text>
              <TextInput style={styles.input} placeholder="Doe" value={manualForm.lastName} onChangeText={t => handleManualChange('lastName', t)} />
              
              <Text style={styles.label}>Email *</Text>
              <TextInput style={styles.input} placeholder="john@example.com" value={manualForm.email} onChangeText={t => handleManualChange('email', t)} keyboardType="email-address" autoCapitalize="none" />
              
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput style={styles.input} placeholder="+1 234 567 8900" value={manualForm.phoneNumber} onChangeText={t => handleManualChange('phoneNumber', t)} keyboardType="phone-pad" />
              
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>Temporary Password *</Text>
                <TouchableOpacity onPress={generateTempPassword}>
                  <Text style={styles.generateText}>Generate</Text>
                </TouchableOpacity>
              </View>
              <TextInput style={styles.input} placeholder="Enter or generate password" value={manualForm.password} onChangeText={t => handleManualChange('password', t)} />
              
              <TouchableOpacity style={styles.submitBtn} onPress={submitManualAdd} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Organizer</Text>}
              </TouchableOpacity>
            </View>
          )}
          
          {message ? (
            <Text style={[styles.messageText, message.includes('success') || message.includes('created') ? { color: '#008a3d' } : { color: '#dc3545' }]}>
              {message}
            </Text>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Existing Organizers</Text>
        {organizers.length === 0 ? (
          <Text style={styles.emptyText}>No organizers registered yet.</Text>
        ) : (
          <View style={styles.listContainer}>
            {organizers.map(org => (
              <View key={org.id} style={styles.orgCard}>
                <Text style={styles.orgName}>{org.firstName} {org.lastName}</Text>
                <Text style={styles.orgEmail}>{org.email}</Text>
                <Text style={styles.orgPhone}>{org.phoneNumber}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' },
  content: { padding: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#eceaf3', marginBottom: 24 },
  tabs: { flexDirection: 'row', backgroundColor: '#f7f7fc', borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#68667a' },
  activeTabText: { color: '#3d2e9c' },
  formContent: {},
  label: { fontSize: 13, fontWeight: '600', color: '#1e1b3d', marginBottom: 8 },
  input: { backgroundColor: '#f7f7fc', borderWidth: 1, borderColor: '#eceaf3', borderRadius: 8, height: 48, paddingHorizontal: 16, fontSize: 15, marginBottom: 16 },
  passwordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  generateText: { fontSize: 13, fontWeight: '600', color: '#3d2e9c' },
  submitBtn: { backgroundColor: '#3d2e9c', borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  messageText: { textAlign: 'center', marginTop: 16, fontSize: 14, fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e1b3d', marginBottom: 16 },
  emptyText: { textAlign: 'center', color: '#68667a', marginTop: 8 },
  listContainer: { gap: 12, paddingBottom: 40 },
  orgCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eceaf3' },
  orgName: { fontSize: 16, fontWeight: '700', color: '#1e1b3d', marginBottom: 4 },
  orgEmail: { fontSize: 14, color: '#68667a', marginBottom: 4 },
  orgPhone: { fontSize: 14, color: '#68667a' },
});
