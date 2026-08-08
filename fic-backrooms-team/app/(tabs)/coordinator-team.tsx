import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSession } from '../session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

export default function CoordinatorTeamScreen() {
  const { session } = useSession();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [volunteerList, setVolunteerList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'staff' | 'volunteers'>('staff');

  useEffect(() => {
    loadTeam();
  }, [session]);

  const loadTeam = async () => {
    if (!session?.userId || !session?.token) return;
    setLoading(true);
    try {
      const coordRes = await fetch(`${API_BASE_URL}/coordinator-assignments/coordinator/${session.userId}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const assignments = coordRes.ok ? await coordRes.json() : [];

      const eventIds: number[] = assignments
        .filter((a: any) => a.event?.id)
        .map((a: any) => a.event.id);

      if (eventIds.length === 0) {
        setStaffList([]);
        setVolunteerList([]);
        return;
      }

      const [staffResults, volunteerResults] = await Promise.all([
        Promise.all(eventIds.map(id => fetch(`${API_BASE_URL}/staff-assignments/event/${id}`, {
          headers: { Authorization: `Bearer ${session.token}` },
        }).then(r => r.ok ? r.json() : []))),
        Promise.all(eventIds.map(id => fetch(`${API_BASE_URL}/volunteer-assignments/event/${id}`, {
          headers: { Authorization: `Bearer ${session.token}` },
        }).then(r => r.ok ? r.json() : []))),
      ]);

      setStaffList(staffResults.flat());
      setVolunteerList(volunteerResults.flat());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentList = activeTab === 'staff' ? staffList : volunteerList;

  const filtered = currentList.filter((item: any) => {
    const person = activeTab === 'staff' ? item.staff : item.volunteer;
    const name = `${person?.firstName || ''} ${person?.lastName || ''}`.toLowerCase();
    const email = person?.email?.toLowerCase() || '';
    const event = item.event?.eventName?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || email.includes(q) || event.includes(q);
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Team</Text>
        <Text style={styles.headerSub}>Staff & volunteers on your events</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'staff' && styles.tabActive]}
          onPress={() => setActiveTab('staff')}
        >
          <Text style={[styles.tabText, activeTab === 'staff' && styles.tabTextActive]}>
            Staff ({staffList.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'volunteers' && styles.tabActive]}
          onPress={() => setActiveTab('volunteers')}
        >
          <Text style={[styles.tabText, activeTab === 'volunteers' && styles.tabTextActive]}>
            Volunteers ({volunteerList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#9b9aab" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or event..."
          placeholderTextColor="#9b9aab"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#5b3cc4" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={48} color="#9b9aab" />
            <Text style={styles.emptyTitle}>No {activeTab} found</Text>
          </View>
        ) : (
          filtered.map((item: any, i: number) => {
            const person = activeTab === 'staff' ? item.staff : item.volunteer;
            const initials = `${person?.firstName?.[0] || ''}${person?.lastName?.[0] || ''}`.toUpperCase() || '?';
            return (
              <View key={item.id || i} style={styles.card}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.personName}>
                    {person?.firstName} {person?.lastName}
                  </Text>
                  <Text style={styles.personEmail}>{person?.email || 'N/A'}</Text>
                  <Text style={styles.personEvent}>{item.event?.eventName}</Text>
                  {item.duty && (
                    <View style={styles.dutyBadge}>
                      <Text style={styles.dutyText}>{item.duty}</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.activeBadge, { backgroundColor: item.active ? '#dcfce7' : '#f1f5f9' }]}>
                  <Text style={[styles.activeText, { color: item.active ? '#15803d' : '#64748b' }]}>
                    {item.active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' },
  header: { padding: 20, paddingTop: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceaf3' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1e1b3d' },
  headerSub: { fontSize: 13, color: '#68667a', marginTop: 2 },
  tabRow: { flexDirection: 'row', backgroundColor: '#ffffff', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eceaf3' },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#f0edfb' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9b9aab' },
  tabTextActive: { color: '#5b3cc4' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', marginHorizontal: 16, marginTop: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#eceaf3' },
  searchInput: { flex: 1, fontSize: 14, color: '#1e1b3d' },
  content: { padding: 16, paddingBottom: 40 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#68667a', marginTop: 12 },
  card: { backgroundColor: '#ffffff', padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eceaf3', flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#5b3cc4', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
  personName: { fontSize: 15, fontWeight: '700', color: '#1e1b3d' },
  personEmail: { fontSize: 12, color: '#68667a', marginTop: 2 },
  personEvent: { fontSize: 12, color: '#5b3cc4', marginTop: 4, fontWeight: '600' },
  dutyBadge: { backgroundColor: '#f0edfb', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 6 },
  dutyText: { fontSize: 11, fontWeight: '700', color: '#5b3cc4' },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  activeText: { fontSize: 11, fontWeight: '700' },
});
