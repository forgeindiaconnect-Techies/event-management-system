import { router } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSession } from './session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

type Message = {
  from: 'user' | 'bot';
  text: string;
};

export default function HelpScreen() {
  const router = useRouter();
  const { session } = useSession();
  
  const [messages, setMessages] = useState<Message[]>([
    { from: 'bot', text: 'Hello! I am the FIC Assistant. How can I help you today?' }
  ]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, loading]);

  const askAssistant = async () => {
    const message = question.trim();
    if (!message || loading) return;

    // Add user message immediately
    const userMsg: Message = { from: 'user', text: message };
    setMessages(prev => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);
    Keyboard.dismiss();

    try {
      const payload = {
        message,
        role: session?.role || null,
        portalId: session?.portalId ? Number(session.portalId) : null,
        eventId: null // For now, no specific event context mapped
      };

      const response = await fetch(`${API_BASE_URL}/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, { from: 'bot', text: data.answer?.trim() || "I couldn't generate an answer. Please try again." }]);
      } else {
        setMessages(prev => [...prev, { from: 'bot', text: data.message || data.error || "The FIC Assistant is temporarily unavailable." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { from: 'bot', text: "Network error. Please check your connection and try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, margin: 16 }} onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={20} color="#1e1b3d" />
          <Text style={{ fontSize: 14, color: '#1e1b3d', fontWeight: '600' }}>Back to Home</Text>
        </TouchableOpacity>

        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.chatContainer}
        >
          {messages.map((m, index) => (
            <View key={index} style={[styles.messageBubble, m.from === 'bot' ? styles.botBubble : styles.userBubble]}>
              <Text style={[styles.messageText, m.from === 'bot' ? styles.botText : styles.userText]}>
                {m.text}
              </Text>
            </View>
          ))}
          {loading && (
            <View style={[styles.messageBubble, styles.botBubble, { alignSelf: 'flex-start' }]}>
              <ActivityIndicator size="small" color="#3d2e9c" />
            </View>
          )}
        </ScrollView>
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            placeholder="Ask something..." 
            value={question}
            onChangeText={setQuestion}
            onSubmitEditing={askAssistant}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendButton} onPress={askAssistant} disabled={loading || !question.trim()}>
            <Ionicons name="send" size={20} color={!question.trim() || loading ? "#a9a9a9" : "#3d2e9c"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' },
  chatContainer: { padding: 16, paddingBottom: 20 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 12, marginBottom: 12 },
  botBubble: { backgroundColor: '#ffffff', alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#eceaf3' },
  userBubble: { backgroundColor: '#3d2e9c', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 22 },
  botText: { color: '#1e1b3d' },
  userText: { color: '#ffffff' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#eceaf3' },
  input: { flex: 1, backgroundColor: '#f7f7fc', borderWidth: 1, borderColor: '#eceaf3', borderRadius: 24, paddingHorizontal: 16, height: 48, fontSize: 15 },
  sendButton: { padding: 12, marginLeft: 8 },
});
