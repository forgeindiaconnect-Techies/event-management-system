import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';

import { TeamSession, useSession } from './session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

export default function LoginScreen() {
  const { setSession } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const signIn = async () => {
    if (!email.trim() || !password) {
      setMessage('Enter your email and password.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.token) {
        setMessage(data.message || data.error || 'Invalid email or password.');
        return;
      }

      const session: TeamSession = {
        token: data.token,
        email: data.email || email.trim().toLowerCase(),
        role: normalizeRole(data.role?.roleName || data.roleName || data.role),
        userId: data.userId || data.id,
        portalId: data.portalId,
        portalName: data.portalName,
        portalCode: data.portalCode,
      };
      setSession(session);
      router.replace('/(tabs)');
    } catch {
      setMessage('Unable to connect to FIC BackRooms. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color="#22166f" />
        </TouchableOpacity>
        <View style={styles.heading}>
          <Image source={require('../assets/images/fic-logo.png')} style={styles.logoImage} />
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in with your existing FIC BackRooms team account.</Text>
        </View>
        <View style={styles.form}>
          <Text style={styles.label}>Email address</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={20} color="#77768a" />
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="name@organization.com" placeholderTextColor="#9b9aab" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!loading} />
          </View>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={20} color="#77768a" />
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor="#9b9aab" secureTextEntry={!showPassword} editable={!loading} onSubmitEditing={signIn} />
            <TouchableOpacity onPress={() => setShowPassword((value) => !value)} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color="#77768a" />
            </TouchableOpacity>
          </View>
          {!!message && <Text style={styles.error}>{message}</Text>}
          <TouchableOpacity style={[styles.signInButton, loading && styles.buttonDisabled]} onPress={signIn} disabled={loading} activeOpacity={0.88}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <><Text style={styles.signInText}>Sign in</Text><Ionicons name="arrow-forward" size={20} color="#ffffff" /></>}
          </TouchableOpacity>
          <View style={styles.signUpPrompt}>
            <Text style={styles.signUpTextPrompt}>if no account? </Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.footer}>Your access is based on the role and event assignments configured by your portal.</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function normalizeRole(role: unknown) {
  return String(role || 'TEAM_MEMBER').trim().toUpperCase().replaceAll(' ', '_');
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' }, container: { flex: 1, paddingHorizontal: 25, paddingTop: 20 },
  back: { width: 45, height: 45, borderRadius: 14, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e5e4ef' },
  heading: { marginTop: 42 }, 
  iconBox: { width: 55, height: 55, backgroundColor: '#ebe7ff', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  logoImage: { width: 64, height: 64, borderRadius: 16, marginBottom: 20 },
  title: { color: '#1e1b3d', fontSize: 32, fontWeight: '800', letterSpacing: -0.8 }, subtitle: { color: '#66647a', fontSize: 15, lineHeight: 22, marginTop: 10, maxWidth: 320 },
  form: { marginTop: 42 }, label: { color: '#2c2a42', fontSize: 14, fontWeight: '700', marginBottom: 9, marginTop: 18 },
  inputWrap: { minHeight: 56, borderRadius: 14, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dfdeea', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  input: { flex: 1, color: '#242238', fontSize: 16 }, error: { color: '#c72745', fontSize: 13, lineHeight: 19, marginTop: 15 },
  signInButton: { minHeight: 57, marginTop: 27, backgroundColor: '#1d126d', borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }, buttonDisabled: { opacity: 0.7 }, signInText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  signUpPrompt: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 }, signUpTextPrompt: { color: '#66647a', fontSize: 14 }, signUpLink: { color: '#3d2e9c', fontSize: 14, fontWeight: '700' },
  footer: { color: '#7b798d', fontSize: 12, lineHeight: 18, textAlign: 'center', paddingHorizontal: 16, marginTop: 'auto', marginBottom: 24 },
});
