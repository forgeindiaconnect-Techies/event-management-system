import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput, Alert } from 'react-native';
import { useSession } from './session';

export default function ProfileScreen() {
  const { session, setSession } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(session?.email ? session.email.split('@')[0] : 'Admin User');
  const [phone, setPhone] = useState('Not added');
  const [portalData, setPortalData] = useState({ name: 'N/A', code: 'N/A' });

  const logout = () => {
    setSession(null);
    router.replace('/');
  };

  useEffect(() => {
    async function fetchProfile() {
      if (!session?.portalId || !session?.userId || !session?.token) return;
      try {
        const headers = { 'Authorization': `Bearer ${session.token}` };
        
        // Fetch Portal Data
        fetch(`https://event-management-system-y9fa.onrender.com/api/portals/${session.portalId}`, { headers })
          .then(res => res.json())
          .then(data => {
            if (data && data.portalName) {
              setPortalData({ name: data.portalName, code: data.portalCode || 'N/A' });
            }
          }).catch(console.error);

        // Fetch User Data directly or fallback to lists
        let currentUser = null;
        const userRes = await fetch(`https://event-management-system-y9fa.onrender.com/api/users/${session.userId}`, { headers });
        if (userRes.ok) {
          currentUser = await userRes.json();
        } else {
          // Fallback to lists
          const [usersRes, orgsRes] = await Promise.all([
            fetch(`https://event-management-system-y9fa.onrender.com/api/users/portal/${session.portalId}`, { headers }),
            fetch(`https://event-management-system-y9fa.onrender.com/api/users/organizers/portal/${session.portalId}`, { headers })
          ]);
          
          let allUsers = [];
          if (usersRes.ok) allUsers = allUsers.concat(await usersRes.json());
          if (orgsRes.ok) allUsers = allUsers.concat(await orgsRes.json());
          
          currentUser = allUsers.find((u: any) => u.id === Number(session.userId) || u.id === session.userId);
        }

        if (currentUser) {
          setName(currentUser.firstName + (currentUser.lastName ? ' ' + currentUser.lastName : ''));
          if (currentUser.phoneNumber) {
            setPhone(currentUser.phoneNumber);
          }
        }
      } catch (e) {
        console.log(e);
      }
    }
    fetchProfile();
  }, [session]);

  const roleDisplay = session?.role?.replaceAll('_', ' ') || 'TEAM MEMBER';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(name || 'U').slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={styles.nameText}>{name}</Text>
          <Text style={styles.emailText}>{session?.email || 'N/A'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{roleDisplay}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} editable={isEditing} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} editable={isEditing} keyboardType="phone-pad" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portal Details</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Portal Name</Text>
            <TextInput style={[styles.input, { backgroundColor: '#f0eef6', color: '#68667a' }]} value={portalData.name} editable={false} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Portal Code</Text>
            <TextInput style={[styles.input, { backgroundColor: '#f0eef6', color: '#68667a' }]} value={portalData.code} editable={false} />
          </View>
        </View>

        <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(!isEditing)}>
          <Ionicons name={isEditing ? "save-outline" : "pencil-outline"} size={20} color="#fff" />
          <Text style={styles.editBtnText}>{isEditing ? 'Save Changes' : 'Edit Profile'}</Text>
        </TouchableOpacity>

        {session?.role !== 'PORTAL_ADMIN' && (
          <TouchableOpacity style={styles.switchBtn} onPress={() => router.push('/choose-access')}>
            <Ionicons name="swap-horizontal-outline" size={20} color="#3d2e9c" />
            <Text style={styles.switchBtnText}>Switch Role / Dashboard</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#dc3545" />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' },
  content: { padding: 20 },
  profileCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#eceaf3', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#20146f', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#ffffff' },
  nameText: { fontSize: 22, fontWeight: '800', color: '#1e1b3d' },
  emailText: { fontSize: 14, color: '#68667a', marginTop: 4 },
  roleBadge: { marginTop: 12, backgroundColor: '#eefcf1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  roleBadgeText: { color: '#008a3d', fontSize: 12, fontWeight: '700' },
  section: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#eceaf3', marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e1b3d', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, color: '#68667a', marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#f7f7fc', borderWidth: 1, borderColor: '#eceaf3', borderRadius: 8, paddingHorizontal: 16, height: 48, fontSize: 15, color: '#1e1b3d' },
  editBtn: { backgroundColor: '#3d2e9c', borderRadius: 12, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  editBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  switchBtn: { backgroundColor: '#ffffff', borderRadius: 12, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12, borderWidth: 1, borderColor: '#3d2e9c' },
  switchBtnText: { color: '#3d2e9c', fontSize: 16, fontWeight: '700' },
  logoutBtn: { backgroundColor: '#fce8e8', borderRadius: 12, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutBtnText: { color: '#dc3545', fontSize: 16, fontWeight: '700' },
});