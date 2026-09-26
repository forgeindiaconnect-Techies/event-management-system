import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getStorageItem } from '../utils/storage';
import {
  bookSeatsOnServer,
  recordMovieSaleOnServer,
  saveLocalMovieTicket,
  formatIndianTime,
  BookedMovieTicket,
} from '../services/movieApi';
import { useMovieBooking } from '../context/MovieBookingContext';
import { useTheme } from '../context/ThemeContext';

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', icon: 'logo-google', color: '#4285F4', tag: 'Fastest' },
  { id: 'phonepe', name: 'PhonePe', icon: 'phone-portrait-outline', color: '#5F259F', tag: 'Popular' },
  { id: 'paytm', name: 'Paytm UPI', icon: 'wallet-outline', color: '#00BAF2', tag: 'Instant' },
  { id: 'bhim', name: 'BHIM UPI', icon: 'flash-outline', color: '#00796B', tag: 'Government' },
  { id: 'amazonpay', name: 'Amazon Pay', icon: 'cart-outline', color: '#FF9900', tag: 'Cashback' },
  { id: 'cred', name: 'CRED UPI', icon: 'shield-checkmark-outline', color: '#111827', tag: 'Rewards' },
];

const POPULAR_BANKS = [
  { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
  { id: 'sbi', name: 'State Bank of India', code: 'SBI' },
  { id: 'icici', name: 'ICICI Bank', code: 'ICICI' },
  { id: 'axis', name: 'Axis Bank', code: 'AXIS' },
  { id: 'kotak', name: 'Kotak Mahindra Bank', code: 'KOTAK' },
  { id: 'pnb', name: 'Punjab National Bank', code: 'PNB' },
  { id: 'bob', name: 'Bank of Baroda', code: 'BOB' },
  { id: 'canara', name: 'Canara Bank', code: 'CANARA' },
];

export default function MovieCheckoutScreen() {
  const { colors, isDarkMode } = useTheme();
  const {
    selectedMovie,
    selectedShowtime,
    selectedSeats,
    totalSeatAmount,
    setConfirmedTicket,
  } = useMovieBooking();

  // User Profile Info (automatic, no manual form input needed)
  const [customerName, setCustomerName] = useState('Movie Guest');
  const [customerEmail, setCustomerEmail] = useState('user@ficcinemas.com');
  const [customerPhone, setCustomerPhone] = useState('9876543210');

  // Payment Selection State
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [selectedUpiApp, setSelectedUpiApp] = useState('Google Pay');
  const [customUpiId, setCustomUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [showUpiDropdown, setShowUpiDropdown] = useState(false);
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  // Card details state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);

  // Exact ₹20 convenience fee calculation per seat + 18% Integrated GST (standard Indian cinema pricing)
  const seatCount = selectedSeats.length || 1;
  const CONVENIENCE_FEE_PER_SEAT = 20.0;
  const totalConvenienceFee = +(seatCount * CONVENIENCE_FEE_PER_SEAT).toFixed(2);
  const gstAmount = +(totalConvenienceFee * 0.18).toFixed(2); // 18% Integrated GST on convenience fee
  const grandTotal = +(totalSeatAmount + totalConvenienceFee + gstAmount).toFixed(2);

  useEffect(() => {
    // Automatically retrieve existing logged-in user profile
    (async () => {
      try {
        const name = await getStorageItem('user_name');
        const email = await getStorageItem('user_email');
        const phone = await getStorageItem('user_phone');
        if (name && name.trim()) setCustomerName(name.trim());
        if (email && email.trim()) setCustomerEmail(email.trim());
        if (phone && phone.trim()) setCustomerPhone(phone.trim());
      } catch (err) {
        console.log('User profile fetch:', err);
      }
    })();
  }, []);

  // Format 16-digit card input with auto-spaces
  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  // Format Expiry with auto slash (MM/YY)
  const handleExpiryChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setCardExpiry(cleaned);
    }
  };

  // Detect card network
  const getCardType = (num: string) => {
    const clean = num.replace(/\s/g, '');
    if (clean.startsWith('4')) return 'VISA';
    if (clean.startsWith('5')) return 'MasterCard';
    if (clean.startsWith('6')) return 'RuPay';
    return 'CARD';
  };

  const handleConfirmPayment = async () => {
    // Validation based on chosen payment mode
    if (paymentMode === 'CARD') {
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (cleanNum.length < 16) {
        Alert.alert('Incomplete Card Number', 'Please enter a valid 16-digit card number.');
        return;
      }
      if (cardExpiry.length < 5) {
        Alert.alert('Incomplete Expiry', 'Please enter expiry in MM/YY format.');
        return;
      }
      if (cardCvv.length < 3) {
        Alert.alert('Incomplete CVV', 'Please enter your 3-digit CVV number.');
        return;
      }
    }

    setIsProcessing(true);

    try {
      const showtimeId = selectedShowtime?.id || 1;
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const ticketId = `TIC-MV-${randomSuffix}`;
      const bookingRef = `BK${Date.now().toString().slice(-8)}`;

      // 1. Mark seats as booked on backend
      await bookSeatsOnServer(showtimeId, selectedSeats);

      // Determine label for payment mode
      let paidVia = selectedUpiApp;
      if (paymentMode === 'CARD') {
        const last4 = cardNumber.replace(/\s/g, '').slice(-4) || '8899';
        paidVia = `${getCardType(cardNumber)} (•••• ${last4})`;
      } else if (paymentMode === 'NETBANKING') {
        paidVia = `${selectedBank} NetBanking`;
      }

      // 2. Prepare ticket data
      const bookedTicket: BookedMovieTicket = {
        ticketId,
        bookingRef,
        movieTitle: selectedMovie?.title || 'Movie Title',
        posterUrl: selectedMovie?.posterUrl,
        screenName: selectedShowtime?.screen?.screenName || 'SILVI(screen1)',
        theaterName:
          selectedShowtime?.theater?.theaterPortal?.portalName ||
          (selectedShowtime as any)?.portalName ||
          selectedShowtime?.theater?.name ||
          selectedShowtime?.screen?.theater?.name ||
          'Naveen Cinemas',
        date: selectedShowtime?.showDate || new Date().toISOString().split('T')[0],
        time: formatIndianTime(selectedShowtime?.startTime) || '10:30 AM',
        seats: selectedSeats,
        amount: grandTotal,
        customerName,
        customerEmail,
        customerPhone,
        paymentMode: paidVia,
        createdAt: new Date().toISOString(),
      };

      // 3. Record sale on server
      await recordMovieSaleOnServer({
        ticketId: bookedTicket.ticketId,
        movieTitle: bookedTicket.movieTitle,
        screenName: bookedTicket.screenName,
        theaterName: bookedTicket.theaterName,
        showtimeId: showtimeId,
        date: bookedTicket.date,
        time: bookedTicket.time,
        seats: bookedTicket.seats.join(', '),
        amount: bookedTicket.amount,
        customerName: bookedTicket.customerName,
        customerEmail: bookedTicket.customerEmail,
        customerPhone: bookedTicket.customerPhone,
        paymentMode: bookedTicket.paymentMode,
        status: 'CONFIRMED',
        source: 'MOBILE_APP',
      });

      // 4. Save to local storage for offline retrieval
      await saveLocalMovieTicket(bookedTicket);

      // 5. Update state & navigate to ticket screen
      setConfirmedTicket(bookedTicket);
      router.replace('/movie-ticket' as any);
    } catch (err) {
      console.log('Payment processing error:', err);
      router.replace('/movie-ticket' as any);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentUpiAppObj = UPI_APPS.find((a) => a.name === selectedUpiApp) || UPI_APPS[0];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Payment & Checkout</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Movie Booking Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image
            source={{
              uri: selectedMovie?.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
            }}
            style={styles.summaryPoster}
          />
          <View style={styles.summaryInfo}>
            <Text numberOfLines={1} style={[styles.summaryTitle, { color: colors.text }]}>
              {selectedMovie?.title || 'Selected Movie'}
            </Text>
            <Text style={[styles.summaryTheater, { color: colors.primary }]}>
              {selectedShowtime?.theater?.theaterPortal?.portalName ||
                (selectedShowtime as any)?.portalName ||
                selectedShowtime?.theater?.name ||
                selectedShowtime?.screen?.theater?.name ||
                'Naveen Cinemas, Chennai'}
            </Text>
            <Text style={[styles.summaryScreen, { color: colors.textMuted }]}>
              {selectedShowtime?.screen?.screenName || 'SILVI(screen1)'} • {formatIndianTime(selectedShowtime?.startTime) || '10:30 AM'}
            </Text>

            <View style={styles.seatsTagRow}>
              <Text style={[styles.seatsLabel, { color: colors.textMuted }]}>Seats ({selectedSeats.length}):</Text>
              <View style={styles.seatsPillsWrap}>
                {selectedSeats.map((s) => (
                  <View key={s} style={[styles.seatPill, { backgroundColor: 'rgba(121, 49, 237, 0.12)' }]}>
                    <Text style={styles.seatPillText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* 1. PRICE BREAKDOWN AT THE VERY TOP */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.priceBreakdownHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="receipt-outline" size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>Price Breakdown</Text>
            </View>
            <View style={[styles.verifiedBadge, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Text style={styles.verifiedBadgeText}>Verified Pricing</Text>
            </View>
          </View>

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.textMuted }]}>
              Base Tickets ({seatCount} seat{seatCount > 1 ? 's' : ''})
            </Text>
            <Text style={[styles.billVal, { color: colors.text }]}>₹{totalSeatAmount.toFixed(2)}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.textMuted }]}>
              Convenience Fee (₹20 × {seatCount} seat{seatCount > 1 ? 's' : ''})
            </Text>
            <Text style={[styles.billVal, { color: colors.text }]}>
              ₹{totalConvenienceFee.toFixed(2)}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.textMuted }]}>
              Integrated GST (18% on fee)
            </Text>
            <Text style={[styles.billVal, { color: colors.primary, fontWeight: '700' }]}>
              ₹{gstAmount.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.billDivider, { backgroundColor: colors.border }]} />

          <View style={styles.billRow}>
            <Text style={[styles.grandLabel, { color: colors.text }]}>Total Amount Payable</Text>
            <Text style={[styles.grandVal, { color: colors.primary }]}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* 2. AUTOMATIC E-TICKET BADGE */}
        <View style={[styles.userBadgeCard, { backgroundColor: isDarkMode ? '#1e1e24' : '#f5f3ff', borderColor: colors.primary }]}>
          <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.userBadgeTitle, { color: colors.text }]}>
              E-Ticket Issued To: <Text style={{ fontWeight: '800' }}>{customerName}</Text>
            </Text>
            <Text style={[styles.userBadgeSub, { color: colors.textMuted }]}>
              Mobile: {customerPhone} • Instant QR code generation on payment
            </Text>
          </View>
        </View>

        {/* 3. PAYMENT OPTIONS WITH DROPDOWNS */}
        <View style={{ gap: 10 }}>
          <View style={styles.paymentSectionHeader}>
            <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 2 }]}>Select Payment Mode</Text>
            <Text style={[styles.paymentSecSubtitle, { color: colors.textMuted }]}>Choose your preferred payment method</Text>
          </View>

          {/* UPI Mode Accordion */}
          <View style={[styles.accordionCard, { backgroundColor: colors.surface, borderColor: paymentMode === 'UPI' ? colors.primary : colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.accordionHeader}
              onPress={() => setPaymentMode('UPI')}
            >
              <View style={styles.accordionHeaderLeft}>
                <View style={[styles.modeIconCircle, { backgroundColor: 'rgba(121, 49, 237, 0.12)' }]}>
                  <Ionicons name="flash" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.accordionTitle, { color: colors.text }]}>UPI Applications</Text>
                  <Text style={[styles.accordionSubtitle, { color: colors.textMuted }]}>
                    {selectedUpiApp || 'Google Pay, PhonePe, Paytm'}
                  </Text>
                </View>
              </View>
              <View style={styles.accordionHeaderRight}>
                {paymentMode === 'UPI' && (
                  <View style={[styles.activePill, { backgroundColor: 'rgba(121, 49, 237, 0.1)' }]}>
                    <Text style={[styles.activePillText, { color: colors.primary }]}>Selected</Text>
                  </View>
                )}
                <Ionicons
                  name={paymentMode === 'UPI' ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={paymentMode === 'UPI' ? colors.primary : colors.textMuted}
                />
              </View>
            </TouchableOpacity>

            {paymentMode === 'UPI' && (
              <View style={[styles.accordionBody, { borderTopColor: colors.border }]}>
                {/* UPI Dropdown Selector Button */}
                <Text style={[styles.inputLabel, { color: colors.text }]}>Choose UPI App</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.dropdownSelectorBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setShowUpiDropdown(true)}
                >
                  <View style={styles.dropdownBtnLeft}>
                    <View style={[styles.upiIconBoxSmall, { backgroundColor: currentUpiAppObj.color }]}>
                      <Ionicons name={currentUpiAppObj.icon as any} size={15} color="#FFF" />
                    </View>
                    <Text style={[styles.dropdownSelectedText, { color: colors.text }]}>
                      {currentUpiAppObj.name}
                    </Text>
                    <View style={[styles.miniBadge, { backgroundColor: 'rgba(121, 49, 237, 0.1)' }]}>
                      <Text style={[styles.miniBadgeText, { color: colors.primary }]}>{currentUpiAppObj.tag}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-down" size={18} color={colors.primary} />
                </TouchableOpacity>

                {/* Custom UPI ID */}
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Or enter UPI ID</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                    placeholder="e.g. mobile@upi, name@okhdfcbank"
                    placeholderTextColor={colors.textMuted}
                    value={customUpiId}
                    onChangeText={(val) => {
                      setCustomUpiId(val);
                      if (val.trim()) setSelectedUpiApp(`UPI ID: ${val.trim()}`);
                    }}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}
          </View>

          {/* Debit / Credit Card Accordion */}
          <View style={[styles.accordionCard, { backgroundColor: colors.surface, borderColor: paymentMode === 'CARD' ? colors.primary : colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.accordionHeader}
              onPress={() => setPaymentMode('CARD')}
            >
              <View style={styles.accordionHeaderLeft}>
                <View style={[styles.modeIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                  <Ionicons name="card" size={18} color="#10B981" />
                </View>
                <View>
                  <Text style={[styles.accordionTitle, { color: colors.text }]}>Debit / Credit Card</Text>
                  <Text style={[styles.accordionSubtitle, { color: colors.textMuted }]}>
                    Visa, MasterCard, RuPay
                  </Text>
                </View>
              </View>
              <View style={styles.accordionHeaderRight}>
                {paymentMode === 'CARD' && (
                  <View style={[styles.activePill, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <Text style={[styles.activePillText, { color: '#10B981' }]}>Selected</Text>
                  </View>
                )}
                <Ionicons
                  name={paymentMode === 'CARD' ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={paymentMode === 'CARD' ? '#10B981' : colors.textMuted}
                />
              </View>
            </TouchableOpacity>

            {paymentMode === 'CARD' && (
              <View style={[styles.accordionBody, { borderTopColor: colors.border }]}>
                {/* 16-Digit Card Number */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>16-Digit Card Number</Text>
                  <View style={[styles.cardInputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <Ionicons name="card-outline" size={20} color={colors.textMuted} />
                    <TextInput
                      style={[styles.cardInput, { color: colors.text }]}
                      placeholder="1234 5678 9012 3456"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      value={cardNumber}
                      onChangeText={handleCardNumberChange}
                      maxLength={19}
                    />
                    <Text style={[styles.detectedBadge, { color: colors.primary }]}>
                      {getCardType(cardNumber)}
                    </Text>
                  </View>
                </View>

                {/* Cardholder Name */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Cardholder Name</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                    placeholder="e.g. NAVEEN M"
                    placeholderTextColor={colors.textMuted}
                    value={cardHolder}
                    onChangeText={(t) => setCardHolder(t.toUpperCase())}
                    autoCapitalize="characters"
                  />
                </View>

                {/* Expiry and CVV Row */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Expiry Date</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                      placeholder="MM/YY"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      value={cardExpiry}
                      onChangeText={handleExpiryChange}
                      maxLength={5}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>CVV</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                      placeholder="123"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      secureTextEntry
                      value={cardCvv}
                      onChangeText={(t) => setCardCvv(t.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Net Banking Accordion */}
          <View style={[styles.accordionCard, { backgroundColor: colors.surface, borderColor: paymentMode === 'NETBANKING' ? colors.primary : colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.accordionHeader}
              onPress={() => setPaymentMode('NETBANKING')}
            >
              <View style={styles.accordionHeaderLeft}>
                <View style={[styles.modeIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                  <Ionicons name="business" size={18} color="#3B82F6" />
                </View>
                <View>
                  <Text style={[styles.accordionTitle, { color: colors.text }]}>Net Banking</Text>
                  <Text style={[styles.accordionSubtitle, { color: colors.textMuted }]}>
                    {selectedBank || 'Select your bank'}
                  </Text>
                </View>
              </View>
              <View style={styles.accordionHeaderRight}>
                {paymentMode === 'NETBANKING' && (
                  <View style={[styles.activePill, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                    <Text style={[styles.activePillText, { color: '#3B82F6' }]}>Selected</Text>
                  </View>
                )}
                <Ionicons
                  name={paymentMode === 'NETBANKING' ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={paymentMode === 'NETBANKING' ? '#3B82F6' : colors.textMuted}
                />
              </View>
            </TouchableOpacity>

            {paymentMode === 'NETBANKING' && (
              <View style={[styles.accordionBody, { borderTopColor: colors.border }]}>
                {/* Bank Dropdown Selector Button */}
                <Text style={[styles.inputLabel, { color: colors.text }]}>Select Your Bank</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.dropdownSelectorBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setShowBankDropdown(true)}
                >
                  <View style={styles.dropdownBtnLeft}>
                    <Ionicons name="business-outline" size={18} color={colors.primary} />
                    <Text style={[styles.dropdownSelectedText, { color: colors.text }]}>
                      {selectedBank}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View>
          <Text style={[styles.bottomLabel, { color: colors.textMuted }]}>Total Payable</Text>
          <Text style={[styles.bottomTotal, { color: colors.text }]}>₹{grandTotal.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          disabled={isProcessing}
          style={[styles.payBtn, { backgroundColor: colors.primary }]}
          onPress={handleConfirmPayment}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={18} color="#FFF" />
              <Text style={styles.payBtnText}>Pay ₹{grandTotal.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* UPI App Selection Dropdown Modal */}
      <Modal
        visible={showUpiDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUpiDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowUpiDropdown(false)}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="flash" size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select UPI App</Text>
              </View>
              <TouchableOpacity onPress={() => setShowUpiDropdown(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8, marginTop: 12 }}>
              {UPI_APPS.map((app) => {
                const isSelected = selectedUpiApp === app.name;
                return (
                  <TouchableOpacity
                    key={app.id}
                    style={[
                      styles.modalOptionRow,
                      { borderColor: isSelected ? colors.primary : colors.border },
                      isSelected && { backgroundColor: 'rgba(121, 49, 237, 0.08)', borderWidth: 1.5 },
                    ]}
                    onPress={() => {
                      setSelectedUpiApp(app.name);
                      setShowUpiDropdown(false);
                    }}
                  >
                    <View style={[styles.upiIconBox, { backgroundColor: app.color }]}>
                      <Ionicons name={app.icon as any} size={18} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalOptionTitle, { color: colors.text }]}>{app.name}</Text>
                      <Text style={[styles.modalOptionSub, { color: colors.primary }]}>{app.tag}</Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={isSelected ? colors.primary : colors.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bank Selection Dropdown Modal */}
      <Modal
        visible={showBankDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBankDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowBankDropdown(false)}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="business" size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select Your Bank</Text>
              </View>
              <TouchableOpacity onPress={() => setShowBankDropdown(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350, marginTop: 12 }}>
              <View style={{ gap: 8 }}>
                {POPULAR_BANKS.map((b) => {
                  const isSelected = selectedBank === b.name;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={[
                        styles.modalOptionRow,
                        { borderColor: isSelected ? colors.primary : colors.border },
                        isSelected && { backgroundColor: 'rgba(121, 49, 237, 0.08)', borderWidth: 1.5 },
                      ]}
                      onPress={() => {
                        setSelectedBank(b.name);
                        setShowBankDropdown(false);
                      }}
                    >
                      <Ionicons name="business-outline" size={20} color={isSelected ? colors.primary : colors.textMuted} />
                      <Text style={[styles.modalOptionTitle, { color: colors.text, flex: 1, marginLeft: 10 }]}>
                        {b.name}
                      </Text>
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={isSelected ? colors.primary : colors.textMuted}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  summaryCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  summaryPoster: {
    width: 76,
    height: 106,
    borderRadius: 10,
  },
  summaryInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  summaryTheater: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  summaryScreen: {
    fontSize: 12,
    marginBottom: 8,
  },
  seatsTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  seatsLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  seatsPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  seatPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  seatPillText: {
    color: '#7931ED',
    fontSize: 11,
    fontWeight: '800',
  },
  userBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  userBadgeTitle: {
    fontSize: 13,
  },
  userBadgeSub: {
    fontSize: 11,
    marginTop: 2,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: 10,
  },
  modeTabsRow: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  modeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  activeModeTabBtn: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  upiGrid: {
    gap: 8,
  },
  upiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  upiIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiName: {
    fontSize: 14,
    fontWeight: '700',
  },
  upiTag: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  cardInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  cardInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
  },
  detectedBadge: {
    fontSize: 11,
    fontWeight: '800',
  },
  virtualCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardChip: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 12,
  },
  cardTypeLabel: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
  cardNumberDisplay: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardSmallLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardValueDisplay: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  bankName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 13,
  },
  billVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  billDivider: {
    height: 1,
    marginVertical: 8,
  },
  grandLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  grandVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    elevation: 10,
  },
  bottomLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  bottomTotal: {
    fontSize: 20,
    fontWeight: '900',
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  payBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  priceBreakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  verifiedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  paymentSectionHeader: {
    marginTop: 6,
    marginBottom: 4,
  },
  paymentSecSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  accordionCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  accordionSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  accordionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  accordionBody: {
    padding: 14,
    borderTopWidth: 1,
  },
  dropdownSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  dropdownBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  upiIconBoxSmall: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownSelectedText: {
    fontSize: 14,
    fontWeight: '700',
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 18,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  modalOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalOptionSub: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
});
