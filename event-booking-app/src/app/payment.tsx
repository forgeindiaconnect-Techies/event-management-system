import React, { useState, useEffect } from 'react';
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

const BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

export default function PaymentScreen() {
  const { eventId, registrationId } = useLocalSearchParams<{ eventId: string, registrationId: string }>();
  const { isDarkMode, colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<any>(null);
  const [registration, setRegistration] = useState<any>(null);
  
  const [paymentMethod, setPaymentMethod] = useState('');
  const [details, setDetails] = useState({ upiApp: '', upiId: '', cardName: '', cardNumber: '', expiry: '', cvv: '', bank: '', accountNumber: '', ifsc: '' });
  
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [eventRes, regRes] = await Promise.all([
          fetch(`${BASE_URL}/events/public/${eventId}`),
          fetch(`${BASE_URL}/registrations/${registrationId}`)
        ]);
        
        const event = await eventRes.json();
        const reg = await regRes.json();
        
        setEventData(event);
        setRegistration(reg);
      } catch (err) {
        console.log('Failed to fetch payment details', err);
        Alert.alert('Error', 'Unable to load payment details.');
      } finally {
        setLoading(false);
      }
    }
    if (eventId && registrationId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [eventId, registrationId]);

  const validatePaymentDetails = () => {
    if (!paymentMethod) return 'Choose a payment method to continue.';
    if (paymentMethod === 'UPI' && (!details.upiApp || !/^[\w.-]+@[\w.-]+$/.test(details.upiId))) return 'Select a UPI application and enter a valid UPI ID.';
    if (paymentMethod === 'CARD' && (!details.cardName.trim() || details.cardNumber.replace(/\D/g, '').length < 12 || !/^\d{2}\/\d{2}$/.test(details.expiry) || !/^\d{3,4}$/.test(details.cvv))) return 'Enter valid card holder, card number, expiry and CVV details.';
    if (paymentMethod === 'NET_BANKING' && (!details.bank || details.accountNumber.replace(/\D/g, '').length < 8 || !/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(details.ifsc))) return 'Select a bank and enter a valid account number and IFSC code.';
    return '';
  };

  const handlePayment = async () => {
    const validationMessage = validatePaymentDetails();
    if (validationMessage) {
      Alert.alert('Error', validationMessage);
      return;
    }

    let paymentStarted = false;
    try {
      setProcessing(true);

      const selectedMethod =
        paymentMethod === 'UPI' ? `${details.upiApp} (UPI)`
        : paymentMethod === 'CARD' ? 'Debit / Credit Card'
        : 'Net Banking';

      // Start Payment
      const startRes = await fetch(`${BASE_URL}/registrations/${registrationId}/payment/start`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: selectedMethod })
      });
      if (!startRes.ok) throw new Error('Failed to start payment');
      paymentStarted = true;

      // Mark Paid
      const payRes = await fetch(`${BASE_URL}/registrations/${registrationId}/mark-paid`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: selectedMethod })
      });
      if (!payRes.ok) throw new Error('Failed to process payment');

      // Navigate to Ticket
      router.push({
        pathname: '/ticket',
        params: { registrationId }
      });
      
    } catch (error) {
      console.log(error);
      if (paymentStarted) {
        try {
          await fetch(`${BASE_URL}/registrations/${registrationId}/mark-failed`, { method: 'PUT' });
        } catch (statusError) {
          console.log(statusError);
        }
      }
      Alert.alert('Payment Failed', 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!eventData || !registration) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Error loading details.</Text>
      </View>
    );
  }

  const quantity = Number(registration.ticketQuantity || 1);
  const ticketClassPrice = Number(registration.ticketClass?.price || 0);
  const amount = Number(registration.totalAmount || (ticketClassPrice * quantity) || eventData.ticketPrice || 0);

  const renderPaymentOption = (id: string, iconName: any, title: string, desc: string) => {
    const isSelected = paymentMethod === id;
    return (
      <TouchableOpacity
        style={[
          styles.paymentOption,
          {
            backgroundColor: isSelected ? (isDarkMode ? '#1e3a8a' : '#eef2ff') : colors.surface,
            borderColor: isSelected ? colors.primary : colors.border,
          }
        ]}
        onPress={() => setPaymentMethod(id)}
      >
        <Ionicons name={iconName} size={28} color={colors.primary} />
        <View style={styles.paymentOptionTextContainer}>
          <Text style={[styles.paymentOptionTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.paymentOptionDesc, { color: colors.textMuted }]}>{desc}</Text>
        </View>
        {isSelected && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/home'); } }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={[styles.amountCard, { backgroundColor: isDarkMode ? '#1f2937' : '#f8fafc', borderColor: colors.border }]}>
          <Text style={[styles.amountLabel, { color: colors.textMuted }]}>Amount Payable</Text>
          <Text style={[styles.amountValue, { color: colors.text }]}>₹{amount.toFixed(0)}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Payment Method</Text>

        {renderPaymentOption('UPI', 'phone-portrait-outline', 'UPI', 'Google Pay, PhonePe, Paytm')}
        {renderPaymentOption('CARD', 'card-outline', 'Debit / Credit Card', 'Visa, Mastercard, RuPay')}
        {renderPaymentOption('NET_BANKING', 'business-outline', 'Net Banking', 'Pay using bank account')}

        {paymentMethod === 'UPI' && (
          <View style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text }]}>UPI Application</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Google Pay"
              placeholderTextColor={colors.textMuted}
              value={details.upiApp}
              onChangeText={(val) => setDetails({ ...details, upiApp: val })}
            />
            <Text style={[styles.label, { color: colors.text }]}>UPI ID</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="name@bank"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              value={details.upiId}
              onChangeText={(val) => setDetails({ ...details, upiId: val })}
            />
          </View>
        )}

        {paymentMethod === 'CARD' && (
          <View style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text }]}>Name on card</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Card holder name"
              placeholderTextColor={colors.textMuted}
              value={details.cardName}
              onChangeText={(val) => setDetails({ ...details, cardName: val })}
            />
            <Text style={[styles.label, { color: colors.text }]}>Card number</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={19}
              value={details.cardNumber}
              onChangeText={(val) => setDetails({ ...details, cardNumber: val })}
            />
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.label, { color: colors.text }]}>Expiry</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.textMuted}
                  maxLength={5}
                  value={details.expiry}
                  onChangeText={(val) => setDetails({ ...details, expiry: val })}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.label, { color: colors.text }]}>CVV</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  placeholder="123"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  value={details.cvv}
                  onChangeText={(val) => setDetails({ ...details, cvv: val })}
                />
              </View>
            </View>
          </View>
        )}

        {paymentMethod === 'NET_BANKING' && (
          <View style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text }]}>Bank Name</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. State Bank of India"
              placeholderTextColor={colors.textMuted}
              value={details.bank}
              onChangeText={(val) => setDetails({ ...details, bank: val })}
            />
            <Text style={[styles.label, { color: colors.text }]}>Account number</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Enter account number"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={details.accountNumber}
              onChangeText={(val) => setDetails({ ...details, accountNumber: val })}
            />
            <Text style={[styles.label, { color: colors.text }]}>IFSC code</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="SBIN0001234"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              maxLength={11}
              value={details.ifsc}
              onChangeText={(val) => setDetails({ ...details, ifsc: val })}
            />
          </View>
        )}

        <TouchableOpacity 
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: processing ? 0.7 : 1 }]} 
          onPress={handlePayment}
          disabled={processing || !paymentMethod}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Pay ₹{amount.toFixed(0)}</Text>
          )}
        </TouchableOpacity>
        
        <Text style={[styles.footerNote, { color: colors.textMuted }]}>
          Demo payment: clicking Pay will mark the registration as paid.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  amountCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  paymentOptionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentOptionDesc: {
    fontSize: 12,
  },
  detailsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
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
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 16,
  }
});
