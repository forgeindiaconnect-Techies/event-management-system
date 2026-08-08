import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';

import { TeamSession, useSession } from './session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

export default function SignUpScreen() {
  const { setSession } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [portalName, setPortalName] = useState('');
  const [category, setCategory] = useState('Corporate');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const signUp = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !portalName.trim() || !password) {
      setMessage('Please fill out all fields.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          portalName: portalName.trim(),
          category,
          password,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.message || data.error || 'Failed to create account. Email may already be in use.');
        return;
      }

      // Automatically log the new Admin in if token is returned
      if (data.token) {
        const session: TeamSession = {
          token: data.token,
          email: data.email || email.trim().toLowerCase(),
          role: 'PORTAL_ADMIN', // Force role to Portal Admin on creation
          userId: data.userId || data.id,
          portalId: data.portalId,
          portalName: data.portalName || portalName.trim(),
        };
        setSession(session);
        router.replace('/(tabs)');
      } else {
        // If no auto-login from backend, send to login page
        router.replace('/login');
      }
    } catch {
      setMessage('Unable to connect. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={22} color="#22166f" />
          </TouchableOpacity>
          <View style={styles.heading}>
            <View style={styles.iconBox}><Ionicons name="briefcase-outline" size={28} color="#5b3cc4" /></View>
            <Text style={styles.title}>Create Portal</Text>
            <Text style={styles.subtitle}>Set up a new workspace for your organization and become the Portal Admin.</Text>
          </View>
          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={20} color="#77768a" />
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="John Doe" placeholderTextColor="#9b9aab" autoCapitalize="words" autoCorrect={false} editable={!loading} />
            </View>

            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={20} color="#77768a" />
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="name@organization.com" placeholderTextColor="#9b9aab" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!loading} />
            </View>

            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={20} color="#77768a" />
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+1 234 567 890" placeholderTextColor="#9b9aab" keyboardType="phone-pad" editable={!loading} />
            </View>

            <Text style={styles.label}>Portal Category</Text>
            <View style={styles.categoryRow}>
              {['All', 'College', 'Corporate', 'Public'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryPill, category === cat && styles.categoryPillActive]}
                  onPress={() => setCategory(cat)}
                  disabled={loading}
                >
                  <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Portal Name</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="business-outline" size={20} color="#77768a" />
              <TextInput style={styles.input} value={portalName} onChangeText={setPortalName} placeholder="Acme Events Inc." placeholderTextColor="#9b9aab" autoCapitalize="words" editable={!loading} />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color="#77768a" />
              <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Minimum 8 characters" placeholderTextColor="#9b9aab" secureTextEntry={!showPassword} editable={!loading} onSubmitEditing={signUp} />
              <TouchableOpacity onPress={() => setShowPassword((value) => !value)} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color="#77768a" />
              </TouchableOpacity>
            </View>

            {!!message && <Text style={styles.error}>{message}</Text>}
            <TouchableOpacity style={[styles.signUpButton, loading && styles.buttonDisabled]} onPress={signUp} disabled={loading} activeOpacity={0.88}>
              {loading ? <ActivityIndicator color="#ffffff" /> : <><Text style={styles.signUpText}>Create Portal</Text><Ionicons name="arrow-forward" size={20} color="#ffffff" /></>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' }, container: { flex: 1 }, scrollContent: { paddingHorizontal: 25, paddingTop: 20, paddingBottom: 40, flexGrow: 1 },
  back: { width: 45, height: 45, borderRadius: 14, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e5e4ef' },
  heading: { marginTop: 32 }, iconBox: { width: 55, height: 55, backgroundColor: '#ebe7ff', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { color: '#1e1b3d', fontSize: 32, fontWeight: '800', letterSpacing: -0.8 }, subtitle: { color: '#66647a', fontSize: 15, lineHeight: 22, marginTop: 10, maxWidth: 320 },
  form: { marginTop: 32 }, label: { color: '#2c2a42', fontSize: 14, fontWeight: '700', marginBottom: 9, marginTop: 18 },
  inputWrap: { minHeight: 56, borderRadius: 14, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dfdeea', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  input: { flex: 1, color: '#242238', fontSize: 16 }, error: { color: '#c72745', fontSize: 13, lineHeight: 19, marginTop: 15 },
  categoryRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  categoryPill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dfdeea' },
  categoryPillActive: { backgroundColor: '#1d126d', borderColor: '#1d126d' },
  categoryText: { color: '#66647a', fontSize: 14, fontWeight: '600' },
  categoryTextActive: { color: '#ffffff' },
  signUpButton: { minHeight: 57, marginTop: 27, backgroundColor: '#1d126d', borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }, buttonDisabled: { opacity: 0.7 }, signUpText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
});
