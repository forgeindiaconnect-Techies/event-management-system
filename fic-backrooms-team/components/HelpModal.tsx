import React, { useState, useRef, useEffect } from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../app/session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

type Message = {
  from: 'user' | 'bot';
  text: string;
};

// Global variable to retain chat history while the app is open
let globalMessages: Message[] = [
  { from: 'bot', text: 'Hello! I am the FIC Assistant. How can I help you today?' }
];

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function HelpModal({ visible, onClose }: HelpModalProps) {
  const { session } = useSession();
  const [view, setView] = useState<'menu' | 'assistant' | 'support'>('menu');
  
  // Chatbot State
  const [messages, setMessages] = useState<Message[]>(globalMessages);
  const [question, setQuestion] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Support Form State
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loadingSupport, setLoadingSupport] = useState(false);

  // Contact Info State
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Reset view when modal opens
  useEffect(() => {
    if (visible) {
      setView('menu');
    }
  }, [visible]);

  // Fetch Portal Contact Info
  useEffect(() => {
    const fetchPortalDetails = async () => {
      if (!session?.portalId || !session?.token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/portals/${session.portalId}`, {
          headers: { 'Authorization': `Bearer ${session.token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.admin) {
            setContactEmail(data.admin.email || '');
            setContactPhone(data.admin.phoneNumber || '');
          }
        }
      } catch (e) {
        console.error("Failed to fetch portal contact details", e);
      }
    };
    fetchPortalDetails();
  }, [session?.portalId, session?.token]);

  // Sync chat messages to global
  useEffect(() => {
    globalMessages = messages;
    if (view === 'assistant' && visible) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, view, visible, loadingChat]);

  const askAssistant = async () => {
    const message = question.trim();
    if (!message || loadingChat) return;

    const userMsg: Message = { from: 'user', text: message };
    setMessages(prev => [...prev, userMsg]);
    setQuestion('');
    setLoadingChat(true);

    try {
      const payload = {
        message,
        role: session?.role || null,
        portalId: session?.portalId ? Number(session.portalId) : null,
        eventId: null
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
      setLoadingChat(false);
    }
  };

  const submitSupport = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Error', 'Subject and description are required.');
      return;
    }
    setLoadingSupport(true);
    try {
      const payload = {
        type: 'FEEDBACK',
        subject: subject.trim(),
        description: description.trim(),
        priority: 'MEDIUM',
        portalId: session?.portalId ? Number(session.portalId) : null
      };

      const response = await fetch(`${API_BASE_URL}/support-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        Alert.alert('Success', 'Request sent successfully!');
        setSubject('');
        setDescription('');
        setView('menu');
      } else {
        const data = await response.json();
        Alert.alert('Error', data.message || data.error || 'Failed to send request.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoadingSupport(false);
    }
  };

  const renderMenu = () => (
    <View style={styles.viewContainer}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>How can we help?</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#1e1b3d" />
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>Choose the support you need.</Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionBtn} onPress={() => setView('assistant')}>
          <View style={[styles.optionIcon, { backgroundColor: '#eefcf1' }]}>
            <Ionicons name="chatbubbles" size={24} color="#2c7a3f" />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Ask FIC Assistant</Text>
            <Text style={styles.optionDesc}>Get immediate answers about using the platform.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#c5c4d4" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionBtn} onPress={() => setView('support')}>
          <View style={[styles.optionIcon, { backgroundColor: '#e0e7ff' }]}>
            <Ionicons name="headset" size={24} color="#3d2e9c" />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Feedback & Support</Text>
            <Text style={styles.optionDesc}>Report a problem, suggest a feature or contact support.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#c5c4d4" />
        </TouchableOpacity>
      </View>

      {(contactEmail || contactPhone) && (
        <View style={styles.contactDetailsBox}>
          <Text style={styles.contactDetailsTitle}>Portal Support Contact</Text>
          {!!contactEmail && (
            <View style={styles.contactDetailsRow}>
              <Ionicons name="mail" size={16} color="#68667a" />
              <Text style={styles.contactDetailsText}>{contactEmail}</Text>
            </View>
          )}
          {!!contactPhone && (
            <View style={styles.contactDetailsRow}>
              <Ionicons name="call" size={16} color="#68667a" />
              <Text style={styles.contactDetailsText}>{contactPhone}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderAssistant = () => (
    <View style={styles.viewContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setView('menu')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e1b3d" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="chatbubbles" size={20} color="#1e1b3d" style={{ marginRight: 6 }} />
          <Text style={styles.headerTitle}>FIC Assistant</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#1e1b3d" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.chatContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg, index) => (
          <View 
            key={index} 
            style={[
              styles.messageBubble, 
              msg.from === 'user' ? styles.userBubble : styles.botBubble
            ]}
          >
            <Text style={[styles.messageText, msg.from === 'user' ? styles.userText : styles.botText]}>
              {msg.text}
            </Text>
          </View>
        ))}
        {loadingChat && (
          <View style={[styles.messageBubble, styles.botBubble, styles.loadingBubble]}>
            <ActivityIndicator size="small" color="#5b3cc4" />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={question}
          onChangeText={setQuestion}
          placeholder="Type your question..."
          placeholderTextColor="#9b9aab"
          editable={!loadingChat}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendBtn, (!question.trim() || loadingChat) && styles.sendBtnDisabled]} 
          onPress={askAssistant}
          disabled={!question.trim() || loadingChat}
        >
          <Ionicons name="send" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSupport = () => (
    <View style={styles.viewContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setView('menu')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e1b3d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Feedback & Support</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#1e1b3d" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.supportContainer}>
        <Text style={styles.label}>Subject</Text>
        <TextInput 
          style={styles.supportInput}
          placeholder="Briefly describe your request"
          value={subject}
          onChangeText={setSubject}
          maxLength={200}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput 
          style={[styles.supportInput, styles.supportTextArea]}
          placeholder="Tell us what happened, what you expected, and useful details."
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={4000}
        />

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={submitSupport}
          disabled={loadingSupport}
        >
          {loadingSupport ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Send Request</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.modalOverlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.popupContainer}>
          {view === 'menu' && renderMenu()}
          {view === 'assistant' && renderAssistant()}
          {view === 'support' && renderSupport()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  
  popupContainer: {
    backgroundColor: '#f7f7fc',
    height: '90%', // Almost full page
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden'
  },
  
  viewContainer: { flex: 1 },
  
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 22, paddingVertical: 16, 
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceaf3' 
  },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1e1b3d' },
  closeBtn: { padding: 4 },
  backBtn: { padding: 4, marginRight: 8 },
  
  subtitle: { paddingHorizontal: 22, paddingTop: 16, fontSize: 15, color: '#68667a', marginBottom: 8 },
  
  optionsContainer: { paddingHorizontal: 22, gap: 12 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#eceaf3' },
  optionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  optionTextContainer: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '800', color: '#1e1b3d', marginBottom: 4 },
  optionDesc: { fontSize: 13, color: '#68667a' },
  
  chatContainer: { padding: 16, paddingBottom: 24 },
  
  messageBubble: { maxWidth: '85%', padding: 12, borderRadius: 16, marginBottom: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#3d2e9c', borderBottomRightRadius: 4 },
  botBubble: { alignSelf: 'flex-start', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#eceaf3', borderBottomLeftRadius: 4 },
  
  messageText: { fontSize: 14, lineHeight: 20 },
  userText: { color: '#ffffff' },
  botText: { color: '#1e1b3d' },
  
  loadingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { color: '#68667a', fontSize: 13, fontStyle: 'italic' },
  
  inputContainer: { 
    flexDirection: 'row', alignItems: 'flex-end', padding: 12, 
    backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#eceaf3' 
  },
  textInput: { 
    flex: 1, backgroundColor: '#f7f7fc', borderRadius: 20, 
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, 
    fontSize: 14, color: '#1e1b3d', minHeight: 40, maxHeight: 100,
    borderWidth: 1, borderColor: '#eceaf3'
  },
  sendBtn: { 
    backgroundColor: '#3d2e9c', width: 40, height: 40, borderRadius: 20, 
    alignItems: 'center', justifyContent: 'center', marginLeft: 10, marginBottom: 0
  },
  sendBtnDisabled: { backgroundColor: '#a6a3b8' },

  supportContainer: { padding: 22 },
  label: { fontSize: 14, fontWeight: '700', color: '#1e1b3d', marginBottom: 8, marginTop: 12 },
  supportInput: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#eceaf3', borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 15, color: '#1e1b3d' },
  supportTextArea: { height: 120, paddingTop: 12, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#1d126d', borderRadius: 14, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  
  contactDetailsBox: { marginHorizontal: 22, marginTop: 24, padding: 16, backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#eceaf3' },
  contactDetailsTitle: { fontSize: 14, fontWeight: '800', color: '#1e1b3d', marginBottom: 12 },
  contactDetailsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  contactDetailsText: { fontSize: 14, color: '#68667a', fontWeight: '500' }
});
