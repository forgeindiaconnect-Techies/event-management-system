import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const acceptInvite = async () => {
    if (!name.trim() || !password) {
      setMessage('Please enter your name and a password.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      
      // Attempt to hit a hypothetical accept-invite endpoint.
      // If this endpoint doesn't exist yet on the backend, it will catch and show a generic error.
      const response = await fetch(`${API_BASE_URL}/auth/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: name.trim(), password }),
      });
      
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.message || data.error || 'Invalid or expired invitation token.');
        return;
      }

      // Automatically go to login once account is created successfully
      router.replace('/login');
      
    } catch {
      setMessage('Unable to connect to FIC BackRooms. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.back} onPress={() => router.replace('/')} accessibilityLabel="Back to Home">
          <Ionicons name="close" size={24} color="#22166f" />
        </TouchableOpacity>
        <View style={styles.heading}>
          <View style={styles.iconBox}><Ionicons name="mail-open-outline" size={28} color="#5b3cc4" /></View>
          <Text style={styles.title}>You've been invited!</Text>
          <Text style={styles.subtitle}>Complete your profile and set a password to join the FIC BackRooms portal.</Text>
        </View>
        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={20} color="#77768a" />
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="John Doe" placeholderTextColor="#9b9aab" autoCapitalize="words" editable={!loading} />
          </View>
          <Text style={styles.label}>Create Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={20} color="#77768a" />
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Minimum 8 characters" placeholderTextColor="#9b9aab" secureTextEntry={!showPassword} editable={!loading} onSubmitEditing={acceptInvite} />
            <TouchableOpacity onPress={() => setShowPassword((value) => !value)} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color="#77768a" />
            </TouchableOpacity>
          </View>
          {!!message && <Text style={styles.error}>{message}</Text>}
          <TouchableOpacity style={[styles.submitButton, loading && styles.buttonDisabled]} onPress={acceptInvite} disabled={loading} activeOpacity={0.88}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <><Text style={styles.submitText}>Accept Invitation</Text><Ionicons name="arrow-forward" size={20} color="#ffffff" /></>}
          </TouchableOpacity>
        </View>
        <Text style={styles.footer}>By accepting this invitation, you agree to the portal's terms of access.</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' }, container: { flex: 1, paddingHorizontal: 25, paddingTop: 20 },
  back: { width: 45, height: 45, borderRadius: 14, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e5e4ef' },
  heading: { marginTop: 42 }, iconBox: { width: 55, height: 55, backgroundColor: '#ebe7ff', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { color: '#1e1b3d', fontSize: 32, fontWeight: '800', letterSpacing: -0.8 }, subtitle: { color: '#66647a', fontSize: 15, lineHeight: 22, marginTop: 10, maxWidth: 320 },
  form: { marginTop: 42 }, label: { color: '#2c2a42', fontSize: 14, fontWeight: '700', marginBottom: 9, marginTop: 18 },
  inputWrap: { minHeight: 56, borderRadius: 14, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dfdeea', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  input: { flex: 1, color: '#242238', fontSize: 16 }, error: { color: '#c72745', fontSize: 13, lineHeight: 19, marginTop: 15 },
  submitButton: { minHeight: 57, marginTop: 27, backgroundColor: '#1d126d', borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }, buttonDisabled: { opacity: 0.7 }, submitText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  footer: { color: '#7b798d', fontSize: 12, lineHeight: 18, textAlign: 'center', paddingHorizontal: 16, marginTop: 'auto', marginBottom: 24 },
});
