import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';

export default function LoginScreen() {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  const handleContinue = () => {
    // In the future, data saving logic can be added here
    router.replace('/home');
  };

  const handleSkip = () => {
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollGrow}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>Please enter your details to explore events.</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput 
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput 
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput 
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.loginBtn} onPress={handleContinue}>
              <Text style={styles.loginBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  scrollGrow: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 8,
  },
  backBtn: {
    padding: 4,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b3ce4',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    height: 52,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  loginBtn: {
    backgroundColor: '#5b3cc4',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
