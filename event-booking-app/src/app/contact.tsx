import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function ContactSupportScreen() {
  const { isDarkMode, colors } = useTheme();

  const SUPPORT_EMAIL = 'support@ficbackrooms.com';
  const SUPPORT_PHONE = '+919363063276';
  const SUPPORT_PHONE_FORMATTED = '+91 93630 63276';
  const WHATSAPP_NUMBER = '919363063276';

  const handleOpenEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=FIC%20BackRooms%20Support%20Request`).catch(() => {
      Alert.alert('Unable to open mail client', `Please write to us directly at ${SUPPORT_EMAIL}`);
    });
  };

  const handleOpenPhone = () => {
    Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {
      Alert.alert('Unable to open dialer', `Please dial ${SUPPORT_PHONE_FORMATTED}`);
    });
  };

  const handleOpenWhatsApp = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      'Hello FIC BackRooms Support, I need assistance with the platform.'
    )}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Unable to open WhatsApp', `Please message +91 93630 63276 on WhatsApp.`);
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/home');
            }
          }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Contact & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Banner */}
        <View
          style={[
            styles.bannerCard,
            { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: colors.border },
          ]}
        >
          <View style={[styles.platformBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.platformBadgeText}>FIC BackRooms</Text>
          </View>
          <Text style={[styles.bannerTitle, { color: colors.text }]}>
            We're here to help you!
          </Text>
          <Text style={[styles.bannerSubtitle, { color: colors.textMuted }]}>
            Have questions regarding your event pass, theater seats, or payment? Connect with our dedicated support team through any channel below.
          </Text>
        </View>

        {/* Action Contact Cards */}
        <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
          DIRECT CONTACT CHANNELS
        </Text>

        {/* 1. Email Support */}
        <TouchableOpacity
          style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={0.7}
          onPress={handleOpenEmail}
        >
          <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9' }]}>
            <Ionicons name="mail-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Email Support</Text>
            <Text style={[styles.cardValue, { color: colors.primary }]}>{SUPPORT_EMAIL}</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>
              Fast response within 24 business hours
            </Text>
          </View>
          <Ionicons name="open-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* 2. Call Support */}
        <TouchableOpacity
          style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={0.7}
          onPress={handleOpenPhone}
        >
          <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9' }]}>
            <Ionicons name="call-outline" size={22} color="#10B981" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Customer Helpline</Text>
            <Text style={[styles.cardValue, { color: colors.text }]}>{SUPPORT_PHONE_FORMATTED}</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>
              Mon – Fri: 9:00 AM – 6:00 PM IST
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* 3. WhatsApp Support */}
        <TouchableOpacity
          style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={0.7}
          onPress={handleOpenWhatsApp}
        >
          <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9' }]}>
            <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>WhatsApp Live Chat</Text>
            <Text style={[styles.cardValue, { color: '#25D366' }]}>Chat with Support</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>
              Quick resolutions for active bookings
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Grievance Officer Card */}
        <Text style={[styles.sectionHeading, { color: colors.textMuted, marginTop: 12 }]}>
          GRIEVANCE OFFICER
        </Text>
        <View
          style={[
            styles.grievanceCard,
            { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: colors.border },
          ]}
        >
          <View style={styles.grievanceHeader}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
            <Text style={[styles.grievanceTitle, { color: colors.text }]}>
              Customer Experience & Grievance
            </Text>
          </View>
          <Text style={[styles.grievanceNotice, { color: colors.textMuted }]}>
            In accordance with Information Technology Act 2000 and rules made thereunder:
          </Text>

          <View style={styles.grievanceRow}>
            <Text style={[styles.grievanceLabel, { color: colors.textMuted }]}>Name:</Text>
            <Text style={[styles.grievanceValue, { color: colors.text }]}>Naveen Kumar</Text>
          </View>

          <View style={styles.grievanceRow}>
            <Text style={[styles.grievanceLabel, { color: colors.textMuted }]}>Designation:</Text>
            <Text style={[styles.grievanceValue, { color: colors.text }]}>Grievance Officer</Text>
          </View>

          <View style={styles.grievanceRow}>
            <Text style={[styles.grievanceLabel, { color: colors.textMuted }]}>Email:</Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:grievance@ficbackrooms.com')}>
              <Text style={[styles.grievanceValue, { color: colors.primary, textDecorationLine: 'underline' }]}>
                grievance@ficbackrooms.com
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.grievanceRow}>
            <Text style={[styles.grievanceLabel, { color: colors.textMuted }]}>Working Hours:</Text>
            <Text style={[styles.grievanceValue, { color: colors.text }]}>
              9:00 AM to 6:00 PM (Monday to Friday)
            </Text>
          </View>
        </View>

        {/* Link to Terms & Conditions */}
        <TouchableOpacity
          style={[
            styles.termsNavRow,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => router.push('/terms')}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="document-text-outline" size={20} color={colors.text} />
            <Text style={[styles.termsNavText, { color: colors.text }]}>
              View Terms of Service & Cancellation Policy
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingVertical: 12,
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
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  bannerCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  platformBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  platformBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 13,
    lineHeight: 20,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 6,
    marginBottom: 4,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 11,
  },
  grievanceCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  grievanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  grievanceTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  grievanceNotice: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
  grievanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  grievanceLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  grievanceValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  termsNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  termsNavText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
