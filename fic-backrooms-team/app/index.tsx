import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image, Modal } from 'react-native';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

const defaultPage = { pageBg: '#f6f7fb', cardBg: '#ffffff', cardBorder: '#eceaf3', heading: '#1e1b3d', body: '#68667a', statIconBg: '#f0edfb', badgeBg: '#f6f7fb' };

const THEMES = [
  { id: 'purple', bg: '#140b5d', text: '#ffffff', muted: '#d9d8fa', eyebrow: '#a5b4fc', btnBg: '#6d3ee6', btnText: '#ffffff', loginBg: 'rgba(255,255,255,0.15)', ...defaultPage, cardKicker: '#6d3ee6' },
  { id: 'blue', bg: '#2563eb', text: '#ffffff', muted: '#dbeafe', eyebrow: '#bfdbfe', btnBg: '#ffffff', btnText: '#1e3a8a', loginBg: 'rgba(255,255,255,0.2)', ...defaultPage, cardKicker: '#2563eb' },
  { id: 'pink', bg: '#db2777', text: '#ffffff', muted: '#fce7f3', eyebrow: '#fbcfe8', btnBg: '#ffffff', btnText: '#831843', loginBg: 'rgba(255,255,255,0.2)', ...defaultPage, cardKicker: '#db2777' },
  { id: 'orange', bg: '#ea580c', text: '#ffffff', muted: '#ffedd5', eyebrow: '#fed7aa', btnBg: '#ffffff', btnText: '#7c2d12', loginBg: 'rgba(255,255,255,0.2)', ...defaultPage, cardKicker: '#ea580c' },
  { id: 'emerald', bg: '#059669', text: '#ffffff', muted: '#d1fae5', eyebrow: '#a7f3d0', btnBg: '#ffffff', btnText: '#064e3b', loginBg: 'rgba(255,255,255,0.2)', ...defaultPage, cardKicker: '#059669' },
  { id: 'violet', bg: '#7c3aed', text: '#ffffff', muted: '#ede9fe', eyebrow: '#ddd6fe', btnBg: '#ffffff', btnText: '#4c1d95', loginBg: 'rgba(255,255,255,0.2)', ...defaultPage, cardKicker: '#7c3aed' },
  { id: 'rose', bg: '#e11d48', text: '#ffffff', muted: '#ffe4e6', eyebrow: '#fecdd3', btnBg: '#ffffff', btnText: '#881337', loginBg: 'rgba(255,255,255,0.2)', ...defaultPage, cardKicker: '#e11d48' },
  { id: 'sky', bg: '#0284c7', text: '#ffffff', muted: '#e0f2fe', eyebrow: '#bae6fd', btnBg: '#ffffff', btnText: '#0c4a6e', loginBg: 'rgba(255,255,255,0.2)', ...defaultPage, cardKicker: '#0284c7' },
  { id: 'dark', bg: '#020617', text: '#ffffff', muted: '#94a3b8', eyebrow: '#cbd5e1', btnBg: '#ffffff', btnText: '#020617', loginBg: 'rgba(255,255,255,0.1)', pageBg: '#0f172a', cardBg: '#1e293b', cardBorder: '#334155', heading: '#f8fafc', body: '#94a3b8', statIconBg: '#334155', badgeBg: '#334155', cardKicker: '#a5b4fc' },
];

export default function LandingScreen() {
  const [stats, setStats] = useState({ events: 0, registrations: 0, organizers: 0, reliability: 'Live' });
  const [activeTheme, setActiveTheme] = useState(THEMES[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/public-stats`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setStats({
            events: Number(data.events || 0),
            registrations: Number(data.registrations || 0),
            organizers: Number(data.organizers || 0),
            reliability: data.reliability || 'Live',
          });
        }
      })
      .catch(console.error);
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeTheme.pageBg }]}>
      <View style={[styles.header, { backgroundColor: activeTheme.bg }]}>
        <View style={styles.brandRow}>
          <View style={[styles.logoBox, { backgroundColor: activeTheme.loginBg }]}>
            <Ionicons name="cube-outline" size={24} color={activeTheme.text} />
          </View>
          <Text style={[styles.brandName, { color: activeTheme.text }]}>FIC BackRooms</Text>
        </View>
        <View style={styles.authRow}>
          <TouchableOpacity onPress={() => router.push('/login')} style={[styles.loginBtn, { backgroundColor: activeTheme.loginBg }]}>
            <Text style={[styles.loginBtnText, { color: activeTheme.text }]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/signup')} style={[styles.signupBtn, { backgroundColor: activeTheme.btnBg }]}>
            <Text style={[styles.signupBtnText, { color: activeTheme.btnText }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HERO SECTION */}
        <View style={[styles.heroSection, { backgroundColor: activeTheme.bg }]}>
          <View style={[styles.glowBg, { backgroundColor: activeTheme.btnBg, opacity: activeTheme.id === 'purple' ? 0.25 : 0.15 }]} />
          
          <View style={styles.eyebrow}>
            <Ionicons name="sparkles" size={14} color={activeTheme.text} />
            <Text style={[styles.eyebrowText, { color: activeTheme.eyebrow }]}>The Complete Event Management Workspace</Text>
          </View>
          
          <Text style={[styles.heroTitle, { color: activeTheme.text }]}>
            Everything Behind{`\n`}a <Text style={{ color: activeTheme.eyebrow }}>Successful</Text> Event.
          </Text>
          
          <Text style={[styles.heroDesc, { color: activeTheme.muted }]}>
            FIC BackRooms empowers event organizers to plan, manage, and execute events seamlessly, from registrations to analytics.
          </Text>
          
          <View style={styles.heroActions}>
            <TouchableOpacity style={[styles.primaryAction, { backgroundColor: activeTheme.btnBg }]} onPress={() => router.push('/signup')}>
              <Text style={[styles.primaryActionText, { color: activeTheme.btnText }]}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color={activeTheme.btnText} />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.themeToggleBtn, { backgroundColor: activeTheme.loginBg }]} onPress={() => setShowColorPicker(true)}>
              <Ionicons name="color-palette" size={18} color={activeTheme.text} />
              <Text style={[styles.themeToggleText, { color: activeTheme.text }]}>Change Theme</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* COLOR PICKER MODAL */}
        <Modal visible={showColorPicker} transparent={true} animationType="fade" onRequestClose={() => setShowColorPicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose a Theme Color</Text>
                <TouchableOpacity onPress={() => setShowColorPicker(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={24} color="#1e1b3d" />
                </TouchableOpacity>
              </View>
              <View style={styles.colorGrid}>
                {THEMES.map(theme => (
                  <TouchableOpacity
                    key={theme.id}
                    onPress={() => { setActiveTheme(theme); setShowColorPicker(false); }}
                    style={[
                      styles.colorGridItem,
                      { backgroundColor: theme.bg },
                      activeTheme.id === theme.id && styles.colorGridItemActive
                    ]}
                  >
                    {activeTheme.id === theme.id && <Ionicons name="checkmark" size={20} color={theme.text} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* STATS SECTION */}
        <View style={[styles.statsContainer, { backgroundColor: activeTheme.cardBg, shadowOpacity: activeTheme.id === 'dark' ? 0.3 : 0.05, elevation: activeTheme.id === 'dark' ? 6 : 3 }]}>
          <StatBox num={`${stats.events}+`} label="Events Managed" icon="people-outline" theme={activeTheme} />
          <StatBox num={`${stats.registrations}+`} label="Attendees" icon="people-outline" theme={activeTheme} />
          <StatBox num={`${stats.organizers}+`} label="Organizers" icon="calendar-outline" theme={activeTheme} />
          <StatBox num={stats.reliability} label="System Status" icon="trending-up-outline" theme={activeTheme} />
        </View>

        {/* PILLARS SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: activeTheme.heading }]}>Why all-in-one event management software?</Text>
          <Text style={[styles.sectionDesc, { color: activeTheme.body }]}>
            Today, event teams need one professional place to plan events, manage attendees, control tickets, assign roles, and understand performance.
          </Text>
          <PillarCard
            category="Planning"
            title="All-in-One Platform"
            desc="The platform brings event creation, ticket classes, registrations, team assignments, event-day tools, public pages, and reports into one working system."
            points={[["Agenda builder", "Schedule sessions, speakers, and timelines."], ["Registration setup", "Create ticket classes and custom forms."]]}
            theme={activeTheme}
          />
          <PillarCard
            category="Control"
            title="Secure & Reliable"
            desc="Role based access keeps organizers, staff, volunteers, speakers, and attendees inside the correct workflow."
            points={[["Role permissions", "Assign organizers, staff, and volunteers."], ["Ticket validation", "Use QR tickets and approvals."]]}
            theme={activeTheme}
          />
          <PillarCard
            category="Reporting"
            title="Insights That Matter"
            desc="Registration counts, attendee status, ticket sales, revenue, and check-in progress give the team a clear view."
            points={[["Live dashboards", "Track events, attendees, and check-in."], ["Post-event reports", "Review registrations and sales summary."]]}
            theme={activeTheme}
          />
        </View>

        {/* ABOUT US SECTION */}
        <View style={[styles.section, styles.aboutSection, { backgroundColor: activeTheme.cardBg }]}>
          <Text style={[styles.kicker, { color: activeTheme.cardKicker }]}>About Us</Text>
          <Text style={[styles.sectionTitleDark, { color: activeTheme.heading }]}>Empowering Event Organizers Every Step of the Way</Text>
          <Text style={[styles.sectionDescDark, { color: activeTheme.body }]}>
            FIC BackRooms is built to simplify event management for everyone. From small meetups to grand festivals, we provide the tools, insights, and support you need to create impactful experiences.
          </Text>
          <View style={styles.trustRow}>
            <Text style={[styles.trustTitle, { color: activeTheme.heading }]}>Trusted by Organizations</Text>
            <View style={styles.trustBadges}>
              {['TechFest', 'CodeClub', 'Cultural Committee', 'Innovation Hub', 'Student Council'].map(org => (
                <View key={org} style={[styles.trustBadge, { backgroundColor: activeTheme.badgeBg, borderColor: activeTheme.cardBorder }]}>
                  <Text style={[styles.trustBadgeText, { color: activeTheme.heading }]}>{org}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* RESOURCES SECTION */}
        <View style={styles.section}>
          <Text style={[styles.kicker, { color: activeTheme.cardKicker }]}>Resources</Text>
          <Text style={[styles.sectionTitle, { color: activeTheme.heading }]}>Everything Your Team Needs to Prepare</Text>
          <Text style={[styles.sectionDesc, { color: activeTheme.body }]}>
            Practical workspaces for setup, registration, event-day movement, and post-event review.
          </Text>
          <View style={styles.resourcesGrid}>
            <ResourceCard theme={activeTheme} title="Event Setup" text="Create portals, configure events, publish pages, and manage event visibility." />
            <ResourceCard theme={activeTheme} title="Registration Tools" text="Build custom forms, manage tickets, approve attendees, and handle payments." />
            <ResourceCard theme={activeTheme} title="Live Event Support" text="Use check-in, attendance, QR tickets, announcements, and staff workflows." />
          </View>
        </View>

        {/* FOOTER */}
        <View style={[styles.footer, { backgroundColor: activeTheme.bg }]}>
          <Text style={[styles.kicker, { color: activeTheme.eyebrow }]}>Contact</Text>
          <Text style={[styles.footerTitle, { color: activeTheme.text }]}>Start managing your events with FIC BackRooms</Text>
          <Text style={[styles.footerDesc, { color: activeTheme.muted }]}>For support or setup questions, contact our system team at support@ficbackrooms.com.</Text>
          
          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={16} color={activeTheme.muted} />
              <Text style={[styles.contactText, { color: activeTheme.muted }]}>+91 98765 43210</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="location-outline" size={16} color={activeTheme.muted} />
              <Text style={[styles.contactText, { color: activeTheme.muted }]}>Coimbatore, Tamil Nadu, India</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.footerBtn, { backgroundColor: activeTheme.btnBg }]} onPress={() => router.push('/signup')}>
            <Text style={[styles.footerBtnText, { color: activeTheme.btnText }]}>Create Portal</Text>
            <Ionicons name="arrow-forward" size={16} color={activeTheme.btnText} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ num, label, icon, theme }: { num: string; label: string; icon: any, theme: any }) {
  return (
    <View style={styles.statBox}>
      <View style={[styles.statIconBox, { backgroundColor: theme.statIconBg }]}><Ionicons name={icon} size={24} color={theme.cardKicker} /></View>
      <Text style={[styles.statNum, { color: theme.heading }]}>{num}</Text>
      <Text style={[styles.statLabel, { color: theme.body }]}>{label}</Text>
    </View>
  );
}

function PillarCard({ category, title, desc, points, theme }: { category: string, title: string, desc: string, points: [string, string][], theme: any }) {
  return (
    <View style={[styles.pillarCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
      <Text style={[styles.pillarCategory, { color: theme.cardKicker }]}>{category}</Text>
      <Text style={[styles.pillarTitle, { color: theme.heading }]}>{title}</Text>
      <Text style={[styles.pillarDesc, { color: theme.body }]}>{desc}</Text>
      <View style={styles.pillarPoints}>
        {points.map((p, i) => (
          <View key={i} style={styles.pointRow}>
            <Ionicons name="checkmark-circle" size={18} color={theme.cardKicker} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.pointTitle, { color: theme.heading }]}>{p[0]}</Text>
              <Text style={[styles.pointDesc, { color: theme.body }]}>{p[1]}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function ResourceCard({ title, text, theme }: { title: string, text: string, theme: any }) {
  return (
    <View style={[styles.resourceCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
      <View style={[styles.resourceIcon, { backgroundColor: theme.statIconBg }]}><Ionicons name="sparkles" size={20} color={theme.cardKicker} /></View>
      <Text style={[styles.resourceTitle, { color: theme.heading }]}>{title}</Text>
      <Text style={[styles.resourceText, { color: theme.body }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6f7fb' },
  header: {
    paddingTop: 36, // Added to push down past mobile status bar icons
    paddingBottom: 12,
    backgroundColor: '#140b5d',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logoBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  brandName: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  authRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loginBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  loginBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  signupBtn: { backgroundColor: '#6d3ee6', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  signupBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  
  scrollContent: { paddingBottom: 60 },
  
  heroSection: {
    backgroundColor: '#140b5d',
    paddingHorizontal: 24,
    paddingTop: 24, // Reduced slightly since header is larger
    paddingBottom: 80,
    position: 'relative',
    overflow: 'hidden',
  },
  glowBg: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#6d3ee6', opacity: 0.25, top: -50, right: -100 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 20 },
  eyebrowText: { color: '#a5b4fc', fontSize: 12, fontWeight: '700', marginLeft: 6 },
  heroTitle: { fontSize: 38, lineHeight: 46, fontWeight: '800', color: '#ffffff', marginBottom: 16 },
  heroHighlight: { color: '#a5b4fc' },
  heroDesc: { fontSize: 16, lineHeight: 24, color: '#d9d8fa', marginBottom: 32 },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  primaryAction: { height: 52, paddingHorizontal: 24, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryActionText: { fontSize: 16, fontWeight: '700' },
  
  themeToggleBtn: { height: 52, paddingHorizontal: 20, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  themeToggleText: { fontSize: 15, fontWeight: '700' },

  // Color Picker Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, width: '100%', maxWidth: 360, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1e1b3d' },
  modalCloseBtn: { padding: 4, backgroundColor: '#f6f7fb', borderRadius: 20 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  colorGridItem: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'transparent' },
  colorGridItemActive: { borderColor: '#1e1b3d' },

  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: -40,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statBox: { width: '25%', alignItems: 'center' },
  statIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f0edfb', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statNum: { fontSize: 16, fontWeight: '800', color: '#1e1b3d', marginBottom: 2, textAlign: 'center' },
  statLabel: { fontSize: 10, color: '#68667a', fontWeight: '500', textAlign: 'center' },

  section: { paddingHorizontal: 24, paddingTop: 60 },
  sectionTitle: { fontSize: 28, fontWeight: '800', color: '#1e1b3d', marginBottom: 12 },
  sectionDesc: { fontSize: 15, color: '#68667a', lineHeight: 22, marginBottom: 32 },

  pillarCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#eceaf3' },
  pillarCategory: { color: '#6d3ee6', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 },
  pillarTitle: { fontSize: 22, fontWeight: '800', color: '#1e1b3d', marginBottom: 12 },
  pillarDesc: { fontSize: 15, color: '#4b4b5a', lineHeight: 22, marginBottom: 20 },
  pillarPoints: { gap: 16 },
  pointRow: { flexDirection: 'row', gap: 12 },
  pointTitle: { fontSize: 15, fontWeight: '700', color: '#1e1b3d', marginBottom: 4 },
  pointDesc: { fontSize: 14, color: '#68667a', lineHeight: 20 },

  aboutSection: { backgroundColor: '#ffffff', paddingVertical: 60, marginTop: 20, paddingHorizontal: 24 },
  kicker: { color: '#6d3ee6', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 },
  sectionTitleDark: { fontSize: 28, fontWeight: '800', color: '#1e1b3d', marginBottom: 16 },
  sectionDescDark: { fontSize: 15, color: '#68667a', lineHeight: 24, marginBottom: 32 },
  trustTitle: { fontSize: 16, fontWeight: '700', color: '#1e1b3d', marginBottom: 16, textAlign: 'center' },
  trustBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  trustBadge: { backgroundColor: '#f6f7fb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#eceaf3' },
  trustBadgeText: { color: '#4b4b5a', fontSize: 13, fontWeight: '600' },

  resourcesGrid: { gap: 16 },
  resourceCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#eceaf3' },
  resourceIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0edfb', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  resourceTitle: { fontSize: 18, fontWeight: '700', color: '#1e1b3d', marginBottom: 8 },
  resourceText: { fontSize: 14, color: '#68667a', lineHeight: 22 },

  footer: { backgroundColor: '#140b5d', padding: 32, marginTop: 40, alignItems: 'center' },
  footerTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff', textAlign: 'center', marginBottom: 12 },
  footerDesc: { fontSize: 15, color: '#d9d8fa', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  contactInfo: { gap: 8, marginBottom: 32, width: '100%' },
  contactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  contactText: { color: '#d9d8fa', fontSize: 14, fontWeight: '500' },
  footerBtn: { backgroundColor: '#6d3ee6', height: 52, paddingHorizontal: 28, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  footerBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
