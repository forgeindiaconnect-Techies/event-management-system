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
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function TermsOfServiceScreen() {
  const { isDarkMode, colors } = useTheme();

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Banner Card */}
        <View
          style={[
            styles.bannerCard,
            { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: colors.border },
          ]}
        >
          <View style={styles.badgeRow}>
            <View style={[styles.legalBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.legalBadgeText}>FIC BackRooms</Text>
            </View>
            <Text style={[styles.updatedText, { color: colors.textMuted }]}>
              Last Updated: Sept 10, 2026
            </Text>
          </View>
          <Text style={[styles.mainHeading, { color: colors.text }]}>
            Platform Terms of Service
          </Text>
          <Text style={[styles.introText, { color: colors.textMuted }]}>
            Welcome to FIC BackRooms! These Terms of Service ("Terms") govern your use of our
            platform, including our mobile booking applications, event ticketing, and cinema
            pass services. By accessing or using FIC BackRooms, you agree to be bound by these
            Terms.
          </Text>
        </View>

        {/* Section 1 */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionNumberBox, { backgroundColor: colors.primary }]}>
              <Text style={styles.sectionNumberText}>1</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Account Registration & Security
            </Text>
          </View>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            • <Text style={{ fontWeight: '700', color: colors.text }}>Public Users:</Text> You must provide accurate and verifiable information when booking tickets, registering for events, or updating your profile. You are responsible for maintaining the confidentiality of your account credentials.
          </Text>
          <Text style={[styles.paragraph, { color: colors.textMuted, marginTop: 8 }]}>
            • <Text style={{ fontWeight: '700', color: colors.text }}>Theater & Event Partners:</Text> Platform Admins, Theater Managers, and Organizers must ensure that all schedules, seating capacities, and pricing data listed on the platform are strictly accurate. FIC BackRooms is not liable for errors in showtimes or event details uploaded by partners.
          </Text>
        </View>

        {/* Section 2 */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionNumberBox, { backgroundColor: colors.primary }]}>
              <Text style={styles.sectionNumberText}>2</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Bookings, Payments & Tickets
            </Text>
          </View>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            • <Text style={{ fontWeight: '700', color: colors.text }}>Purchases:</Text> All ticket purchases and event registrations are subject to venue capacity and availability. A booking is only confirmed once payment is successfully processed and a digital ticket/QR code is issued.
          </Text>
          <Text style={[styles.paragraph, { color: colors.textMuted, marginTop: 8 }]}>
            • <Text style={{ fontWeight: '700', color: colors.text }}>Pricing & Fees:</Text> Prices are set by the respective theater or event organizers. FIC BackRooms may apply a nominal convenience or service fee to bookings, which is clearly displayed prior to final checkout.
          </Text>
        </View>

        {/* Section 3 */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionNumberBox, { backgroundColor: colors.primary }]}>
              <Text style={styles.sectionNumberText}>3</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Cancellations & Refunds
            </Text>
          </View>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            • <Text style={{ fontWeight: '700', color: colors.text }}>Customer Cancellations:</Text> Refund eligibility is determined by the specific theater or event organizer's policy. If permitted, cancellations must be made within the designated time window prior to showtime/event start. Convenience fees are generally non-refundable.
          </Text>
          <Text style={[styles.paragraph, { color: colors.textMuted, marginTop: 8 }]}>
            • <Text style={{ fontWeight: '700', color: colors.text }}>Organizer Cancellations:</Text> If an event or movie show is canceled by the venue or organizer, you are entitled to a full refund of the ticket amount.
          </Text>
        </View>

        {/* Section 4 */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionNumberBox, { backgroundColor: colors.primary }]}>
              <Text style={styles.sectionNumberText}>4</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Organizer & Theater Responsibilities
            </Text>
          </View>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            • Operators must fulfill all confirmed bookings and seat reservations.
          </Text>
          <Text style={[styles.paragraph, { color: colors.textMuted, marginTop: 6 }]}>
            • Partners must not list fraudulent events, inappropriate content, or misrepresent screen formats (e.g. claiming a screen is IMAX or Dolby Atmos when it is not).
          </Text>
          <Text style={[styles.paragraph, { color: colors.textMuted, marginTop: 6 }]}>
            • FIC BackRooms reserves the right to suspend or terminate partner portals that repeatedly receive customer complaints or violate guidelines.
          </Text>
        </View>

        {/* Section 5 */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionNumberBox, { backgroundColor: colors.primary }]}>
              <Text style={styles.sectionNumberText}>5</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Intellectual Property
            </Text>
          </View>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            All software, application interfaces, brand logos, and systems associated with FIC BackRooms are the intellectual property of FIC BackRooms. Movie posters, trailers, and event media uploaded remain the property of their respective copyright holders and are used strictly for booking and promotional purposes.
          </Text>
        </View>

        {/* Section 6 */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionNumberBox, { backgroundColor: colors.primary }]}>
              <Text style={styles.sectionNumberText}>6</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Limitation of Liability
            </Text>
          </View>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            FIC BackRooms acts as an intermediary facilitating ticketing between attendees and theater/event operators. We are not responsible for venue facilities, safety, or the direct conduct of event organizers. In no event shall FIC BackRooms be liable for indirect or consequential damages arising from app usage.
          </Text>
        </View>

        {/* Section 7 */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionNumberBox, { backgroundColor: colors.primary }]}>
              <Text style={styles.sectionNumberText}>7</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Changes to Terms
            </Text>
          </View>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            We reserve the right to revise these Terms at any time. When modifications are published, the "Last Updated" date at the top of this document will be updated. Continued use of the app signifies acceptance of the amended terms.
          </Text>
        </View>

        {/* Footer Disclaimer */}
        <View style={[styles.disclaimerBox, { borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
          <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
            If you have questions about these Terms of Service or our privacy policies, please reach out through our Contact & Support channels.
          </Text>
        </View>

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
    gap: 16,
  },
  bannerCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  legalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  legalBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  updatedText: {
    fontSize: 12,
  },
  mainHeading: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  introText: {
    fontSize: 13,
    lineHeight: 20,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionNumberBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 20,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});
