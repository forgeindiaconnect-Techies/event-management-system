import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
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
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../context/ThemeContext';

const BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

export default function TicketScreen() {
  const { registrationId } = useLocalSearchParams<{ registrationId: string }>();
  const { isDarkMode, colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState<any>(null);
  const [ticketData, setTicketData] = useState<any>(null);
  
  const viewShotRef = useRef<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const regRes = await fetch(`${BASE_URL}/registrations/${registrationId}`);
        const reg = await regRes.json();
        setRegistration(reg);

        try {
          const ticketsRes = await fetch(`${BASE_URL}/tickets/registration/${registrationId}`);
          if (ticketsRes.ok) {
             const tData = await ticketsRes.json();
             setTicketData(tData);
          } else {
             const allTicketsRes = await fetch(`${BASE_URL}/tickets/registration/${registrationId}/all`);
             if (allTicketsRes.ok) {
                 const allTickets = await allTicketsRes.json();
                 if (Array.isArray(allTickets) && allTickets.length > 0) {
                     setTicketData(allTickets[0]);
                 }
             }
          }
        } catch (ticketErr) {
          console.log('Error fetching specific ticket details', ticketErr);
        }

        // Save to SecureStore
        try {
          const savedTicketsStr = await SecureStore.getItemAsync('my_tickets');
          let savedTickets = savedTicketsStr ? JSON.parse(savedTicketsStr) : [];
          if (!savedTickets.includes(registrationId)) {
            savedTickets.push(registrationId);
            await SecureStore.setItemAsync('my_tickets', JSON.stringify(savedTickets));
          }
        } catch (storeErr) {
          console.log('Error saving ticket to local storage', storeErr);
        }
        
      } catch (err) {
        console.log('Failed to fetch ticket details', err);
        Alert.alert('Error', 'Unable to load ticket details.');
      } finally {
        setLoading(false);
      }
    }
    if (registrationId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [registrationId]);

  const downloadTicket = async () => {
    try {
      if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture();
        const isAvailable = await Sharing.isAvailableAsync();
        
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Save your ticket',
          });
        } else {
          Alert.alert('Error', 'Sharing/Saving is not available on this device');
        }
      }
    } catch (err) {
      console.log('Capture error', err);
      Alert.alert('Error', 'Failed to capture and save the ticket.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!registration) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Error loading ticket details.</Text>
      </View>
    );
  }

  const event = registration.event || {};
  const participant = registration.participant || {};
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const amount = Number(registration.totalAmount || 0) || 
                 (Number(registration.ticketClass?.price || event.ticketPrice || 0) * Number(registration.ticketQuantity || 1));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
          <Ionicons name="home" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Your Ticket</Text>
        <TouchableOpacity style={styles.backBtn} onPress={downloadTicket}>
          <Ionicons name="download-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.successHeader}>
          <Ionicons name="checkmark-circle" size={48} color="#16a34a" />
          <Text style={[styles.successTitle, { color: colors.text }]}>Registration Successful</Text>
          <Text style={[styles.successDesc, { color: colors.textMuted }]}>Your event ticket is ready.</Text>
        </View>

        {/* Ticket ViewShot Area */}
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }} style={{ backgroundColor: isDarkMode ? '#111827' : '#f8fafc', padding: 16 }}>
          <View style={[styles.ticketContainer, { backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', borderColor: colors.border }]}>
            
            {/* Ticket Header */}
            <View style={[styles.ticketHeader, { borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb' }]}>
              <View>
                <Text style={[styles.ticketEventBadge, { color: colors.primary }]}>{event.eventType || 'EVENT'}</Text>
                <Text style={[styles.ticketEventName, { color: colors.text }]} numberOfLines={2}>{event.eventName}</Text>
              </View>
            </View>

            {/* Event Info & QR */}
            <View style={styles.ticketBody}>
              <View style={styles.ticketInfoCol}>
                <View style={styles.infoRowIcon}>
                  <Ionicons name="calendar" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.infoText, { color: colors.text }]}>{formatDate(event.startDateTime)}</Text>
                </View>
                <View style={styles.infoRowIcon}>
                  <Ionicons name="location" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.infoText, { color: colors.text }]}>{event.venue || 'Online'}</Text>
                </View>
                <View style={styles.infoRowIcon}>
                  <Ionicons name="person" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.infoText, { color: colors.text }]}>{`${participant.firstName || ''} ${participant.lastName || ''}`}</Text>
                </View>
              </View>
              <View style={[styles.ticketQrCol, { borderColor: isDarkMode ? '#374151' : '#e5e7eb' }]}>
                <QRCode 
                  value={ticketData?.qrCode || `REG-${registration.id}`} 
                  size={100}
                  color={isDarkMode ? '#ffffff' : '#000000'}
                  backgroundColor="transparent"
                />
              </View>
            </View>

            {/* Registration IDs */}
            <View style={styles.ticketBanner}>
              <View>
                <Text style={styles.ticketBannerLabel}>REGISTRATION ID</Text>
                <Text style={styles.ticketBannerValue}>REG-{registration.id}</Text>
              </View>
              <View>
                <Text style={styles.ticketBannerLabel}>TICKET NUMBER</Text>
                <Text style={styles.ticketBannerValue}>{ticketData?.ticketNumber || `TICKET-${registration.id}`}</Text>
              </View>
            </View>

            {/* Detailed Info */}
            <View style={styles.detailsSection}>
              <Text style={[styles.sectionTitleSmall, { color: colors.text }]}>REGISTERED DETAILS</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{participant.email}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{participant.phoneNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ticket Class</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{registration.ticketClass?.name || 'Standard'}</Text>
              </View>
              {ticketData?.seatIdentifier && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Assigned Seat</Text>
                  <Text style={[styles.detailValue, { color: colors.text, fontWeight: '800' }]}>{ticketData.seatIdentifier}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantity</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{registration.ticketQuantity || 1}</Text>
              </View>

              <Text style={[styles.sectionTitleSmall, { color: colors.text, marginTop: 16 }]}>TRANSACTION DETAILS</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={[styles.detailValue, { color: registration.paymentStatus === 'PAID' ? '#16a34a' : colors.text }]}>
                  {registration.paymentStatus || 'N/A'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Method</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{registration.paymentMethod || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{amount > 0 ? `₹${amount}` : 'Free'}</Text>
              </View>
            </View>
            
          </View>
        </ViewShot>

        <TouchableOpacity 
          style={[styles.downloadBtn, { backgroundColor: colors.primary }]} 
          onPress={downloadTicket}
        >
          <Ionicons name="download-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.downloadBtnText}>Save Ticket</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.outlineBtn, { borderColor: colors.primary }]} 
          onPress={() => router.replace('/explore')}
        >
          <Text style={[styles.outlineBtnText, { color: colors.primary }]}>View More Events</Text>
        </TouchableOpacity>

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
    padding: 16,
    paddingBottom: 40,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
  },
  successDesc: {
    fontSize: 14,
    marginTop: 4,
  },
  ticketContainer: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ticketHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  ticketEventBadge: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  ticketEventName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  ticketBody: {
    flexDirection: 'row',
    padding: 20,
  },
  ticketInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  infoRowIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  ticketQrCol: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    paddingLeft: 16,
  },
  ticketBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#071b4d',
    padding: 16,
  },
  ticketBannerLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginBottom: 4,
  },
  ticketBannerValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailsSection: {
    padding: 20,
  },
  sectionTitleSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d1d5db',
  },
  detailLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  downloadBtn: {
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginHorizontal: 16,
  },
  downloadBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  outlineBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    marginHorizontal: 16,
    borderWidth: 1,
  },
  outlineBtnText: {
    fontSize: 16,
    fontWeight: '600',
  }
});
