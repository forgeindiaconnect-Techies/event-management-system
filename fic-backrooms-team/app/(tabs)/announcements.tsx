import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useSession } from '../session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

export default function AnnouncementsScreen() {
  const { session } = useSession();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Typically announcements might be scoped to an event or portal. 
      // Using a placeholder endpoint structure since the actual one wasn't specified.
      if (!session?.token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/announcements/portal/${session.portalId || ''}`, {
          headers: { 'Authorization': `Bearer ${session.token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAnnouncements(data || []);
        } else {
          // If endpoint doesn't exist, just clear loading
          setAnnouncements([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [session]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }} onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={20} color="#1e1b3d" />
          <Text style={{ fontSize: 14, color: '#1e1b3d', fontWeight: '600' }}>Back to Home</Text>
        </TouchableOpacity>
        {loading ? (
          <ActivityIndicator size="large" color="#5b3cc4" style={{ marginTop: 40 }} />
        ) : announcements.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No recent updates.</Text>
          </View>
        ) : (
          announcements.map((item, i) => (
            <View key={item.id || i} style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.detail}>{item.message}</Text>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' },
  header: { padding: 22, paddingTop: 60, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceaf3' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1e1b3d' },
  content: { padding: 20 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#68667a', fontSize: 16 },
  card: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#eceaf3' },
  title: { fontSize: 18, fontWeight: '700', color: '#1e1b3d', marginBottom: 8 },
  detail: { fontSize: 14, color: '#68667a', marginBottom: 12, lineHeight: 20 },
  date: { fontSize: 12, color: '#9b9aab', alignSelf: 'flex-end' }
});
