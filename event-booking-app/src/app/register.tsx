import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

export default function RegisterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDarkMode, colors } = useTheme();

  const [loadingData, setLoadingData] = useState(true);
  const [eventData, setEventData] = useState<any>(null);
  const [ticketClasses, setTicketClasses] = useState<any[]>([]);
  const [formFields, setFormFields] = useState<any[]>([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [registrationType, setRegistrationType] = useState('PARTICIPANT');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [eventRes, ticketsRes, fieldsRes] = await Promise.all([
          fetch(`${BASE_URL}/events/public/${id}`),
          fetch(`${BASE_URL}/ticket-classes/event/${id}`),
          fetch(`${BASE_URL}/form-fields/event/${id}`)
        ]);
        
        const event = await eventRes.json();
        const tickets = await ticketsRes.json();
        const fields = await fieldsRes.json();
        
        if (event) {
          setEventData(event);
          if (event.allowParticipantRegistration && !event.allowAudienceRegistration) {
            setRegistrationType('PARTICIPANT');
          } else if (!event.allowParticipantRegistration && event.allowAudienceRegistration) {
            setRegistrationType('AUDIENCE');
          }
        }

        if (Array.isArray(tickets)) {
          setTicketClasses(tickets.filter((t: any) => t.active && t.saleStatus === 'Active'));
          if (tickets.length > 0) {
            setSelectedTicketId(tickets[0].id);
          }
        }
        
        if (Array.isArray(fields)) {
          setFormFields(fields);
        }
      } catch (err) {
        console.log('Failed to fetch registration setup', err);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, [id]);

  const activeFields = useMemo(() => {
    return formFields.filter(f => f.registrationType === registrationType);
  }, [formFields, registrationType]);

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email || !phoneNumber) {
      Alert.alert('Error', 'Please fill in all basic fields.');
      return;
    }

    if (!selectedTicketId && ticketClasses.length > 0) {
      Alert.alert('Error', 'Please select a ticket class.');
      return;
    }

    // Validate custom required fields
    for (const field of activeFields) {
      if (field.required && !customAnswers[field.id]) {
        Alert.alert('Error', `Please fill out the required field: ${field.fieldLabel}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const answersList = Object.keys(customAnswers).map(fieldId => ({
        fieldId: Number(fieldId),
        answerValue: customAnswers[fieldId],
      }));

      const payload = {
        firstName,
        lastName,
        email,
        phoneNumber,
        registrationType,
        ticketClassId: selectedTicketId,
        ticketQuantity,
        qrGenerationMode: 'AUTOMATIC',
        answers: answersList,
      };

      const response = await fetch(`${BASE_URL}/registrations/public/event/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        try {
          await SecureStore.setItemAsync('user_name', `${firstName} ${lastName}`.trim());
        } catch (e) {
          console.log('Failed to save user name');
        }
        router.push({
          pathname: '/payment',
          params: { eventId: id, registrationId: data.id }
        });
      } else {
        Alert.alert('Registration Failed', data.message || 'Unable to register at this time.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateCustomAnswer = (fieldId: number, val: string) => {
    setCustomAnswers(prev => ({ ...prev, [fieldId]: val }));
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/home'); } }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Register for Event</Text>
        <View style={{ width: 40 }} />
      </View>

      {loadingData ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          
          {eventData?.allowParticipantRegistration && eventData?.allowAudienceRegistration && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Registration Type</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity 
                  style={[styles.typeBtn, { borderColor: colors.border, backgroundColor: registrationType === 'PARTICIPANT' ? colors.primary : colors.surface }]}
                  onPress={() => setRegistrationType('PARTICIPANT')}
                >
                  <Text style={[styles.typeBtnText, { color: registrationType === 'PARTICIPANT' ? '#fff' : colors.text }]}>Participant</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeBtn, { borderColor: colors.border, backgroundColor: registrationType === 'AUDIENCE' ? colors.primary : colors.surface }]}
                  onPress={() => setRegistrationType('AUDIENCE')}
                >
                  <Text style={[styles.typeBtnText, { color: registrationType === 'AUDIENCE' ? '#fff' : colors.text }]}>Audience</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {ticketClasses.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Ticket</Text>
              {ticketClasses.map(ticket => {
                const isSelected = selectedTicketId === ticket.id;
                return (
                  <TouchableOpacity 
                    key={ticket.id} 
                    style={[styles.ticketCard, { borderColor: isSelected ? colors.primary : colors.border, backgroundColor: colors.surface }]}
                    onPress={() => setSelectedTicketId(ticket.id)}
                  >
                    <View style={styles.ticketHeader}>
                      <Text style={[styles.ticketName, { color: colors.text }]}>{ticket.name}</Text>
                      <Text style={[styles.ticketPrice, { color: colors.primary }]}>
                        {ticket.price && ticket.price > 0 ? `₹${ticket.price}` : 'Free'}
                      </Text>
                    </View>
                    {ticket.description && (
                      <Text style={[styles.ticketDesc, { color: colors.textMuted }]}>{ticket.description}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>

            <Text style={[styles.label, { color: colors.text }]}>First Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Jane"
              placeholderTextColor={colors.textMuted}
              value={firstName}
              onChangeText={setFirstName}
            />

            <Text style={[styles.label, { color: colors.text }]}>Last Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Doe"
              placeholderTextColor={colors.textMuted}
              value={lastName}
              onChangeText={setLastName}
            />

            <Text style={[styles.label, { color: colors.text }]}>Email Address *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="jane@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={[styles.label, { color: colors.text }]}>Phone Number *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="+1 234 567 890"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          {activeFields.length > 0 && (
            <View style={styles.section}>
              {activeFields.map(field => (
                <View key={field.id} style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {field.fieldLabel} {field.required && '*'}
                  </Text>
                  
                  {field.fieldType === 'TEXT' || field.fieldType === 'TEXTAREA' ? (
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      placeholder={`Enter ${field.fieldLabel.toLowerCase()}`}
                      placeholderTextColor={colors.textMuted}
                      value={customAnswers[field.id] || ''}
                      onChangeText={(val) => updateCustomAnswer(field.id, val)}
                      multiline={field.fieldType === 'TEXTAREA'}
                    />
                  ) : field.fieldType === 'NUMBER' ? (
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      placeholder={`Enter number`}
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={customAnswers[field.id] || ''}
                      onChangeText={(val) => updateCustomAnswer(field.id, val)}
                    />
                  ) : field.fieldType === 'DROPDOWN' || field.fieldType === 'RADIO' ? (
                    <View style={styles.optionsContainer}>
                      {field.options?.split(',').map((opt: string) => {
                        const optValue = opt.trim();
                        const isSelected = customAnswers[field.id] === optValue;
                        return (
                          <TouchableOpacity 
                            key={optValue}
                            style={[
                              styles.optionChip, 
                              { borderColor: isSelected ? colors.primary : colors.border, backgroundColor: isSelected ? colors.primary + '11' : colors.surface }
                            ]}
                            onPress={() => updateCustomAnswer(field.id, optValue)}
                          >
                            <Text style={{ color: isSelected ? colors.primary : colors.text }}>{optValue}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      placeholder={`Provide ${field.fieldLabel.toLowerCase()}`}
                      placeholderTextColor={colors.textMuted}
                      value={customAnswers[field.id] || ''}
                      onChangeText={(val) => updateCustomAnswer(field.id, val)}
                    />
                  )}
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]} 
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Confirm Registration</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  typeBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  ticketCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ticketName: {
    fontSize: 16,
    fontWeight: '600',
  },
  ticketPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  ticketDesc: {
    fontSize: 14,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 20,
  },
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
