import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSession } from './session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

export default function ChooseAccessScreen() {
  const { session, setSession } = useSession();
  const [accesses, setAccesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccesses();
  }, []);

  const fetchAccesses = async () => {
    if (!session?.userId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/event-assignments/user/${session.userId}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });

      if (res.ok) {
        const data = await res.json();
        
        // Map assignments to access options
        const options = data.map((a: any) => ({
          role: normalizeRole(a.roleName || a.role),
          eventName: a.eventName || 'Assigned Event',
          eventId: a.eventId,
          portalId: a.portalId,
          portalName: a.portalName || 'Portal',
          assignmentId: a.id,
        }));

        // Dedupe
        const seen = new Set();
        const unique = options.filter((opt: any) => {
          const key = `${opt.role}-${opt.eventId || 'portal'}-${opt.portalId || ''}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setAccesses(unique);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openAccess = (access: any) => {
    if (!session) return;
    
    // Update the session with the newly selected role and portal
    setSession({
      ...session,
      role: access.role,
      portalId: access.portalId,
      portalName: access.portalName,
    });

    // Go back to the dashboard tabs
    router.replace('/(tabs)');
  };

  const normalizeRole = (role: string) => {
    const r = String(role || '').trim();
    return r === 'Staff' ? 'STAFF' : r.toUpperCase();
  };

  const formatRole = (role: string) => {
    return String(role || '')
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
          <Ionicons name="arrow-back" size={24} color="#1e1b3d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Access</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Switch Role / Dashboard</Text>
        <Text style={styles.subtitle}>Select the event role you want to open.</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#5b3cc4" style={{ marginTop: 40 }} />
        ) : accesses.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="person-badge-outline" size={48} color="#9b9aab" />
            <Text style={styles.emptyTitle}>No access found</Text>
            <Text style={styles.emptyText}>You haven't been assigned to any other roles or events.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {accesses.map((access, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => openAccess(access)}>
                <View style={styles.iconBox}>
                  <Ionicons name={access.eventId ? "calendar-outline" : "person-badge-outline"} size={22} color="#5b3cc4" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.roleLabel}>{formatRole(access.role)}</Text>
                  <Text style={styles.eventName}>{access.eventName}</Text>
                  <Text style={styles.portalName}>{access.portalName}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#5b3cc4" style={{ alignSelf: 'center' }} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6f7fb' },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceaf3' },
  backBtn: { padding: 8, marginRight: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e1b3d' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e1b3d', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#68667a', marginBottom: 24 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#eceaf3', borderStyle: 'dashed' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e1b3d', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#68667a', marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
  grid: { gap: 12 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: '#eceaf3', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardContent: { flex: 1, justifyContent: 'center' },
  roleLabel: { fontSize: 12, color: '#68667a', fontWeight: '600', marginBottom: 2, textTransform: 'uppercase' },
  eventName: { fontSize: 16, fontWeight: '800', color: '#1e1b3d', marginBottom: 2 },
  portalName: { fontSize: 13, color: '#68667a' },
});
