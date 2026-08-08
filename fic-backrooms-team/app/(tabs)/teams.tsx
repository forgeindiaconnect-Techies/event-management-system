import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSession } from '../session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api'; // Match with login

export default function TeamsScreen() {
  const { session } = useSession();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [listMode, setListMode] = useState<'invitations' | 'members'>('members');

  useEffect(() => {
    async function loadData() {
      if (!session?.portalId || !session?.token) return;
      try {
        const [orgRes, invRes] = await Promise.all([
          fetch(`${API_BASE_URL}/users/portal/${session.portalId}`, { headers: { 'Authorization': `Bearer ${session.token}` } }),
          fetch(`${API_BASE_URL}/invitations/portal/${session.portalId}`, { headers: { 'Authorization': `Bearer ${session.token}` } })
        ]);
        
        if (orgRes.ok) {
          const data = await orgRes.json() || [];
          const allMembers = data.map((m: any) => ({ ...m, role: m.role?.roleName || m.roleName || m.role }));
          const filteredMembers = allMembers.filter((m: any) => {
            if (session?.role === 'PORTAL_ADMIN') {
              return m.role !== 'PORTAL_ADMIN';
            } else if (session?.role === 'ORGANIZER') {
              return m.role !== 'PORTAL_ADMIN' && m.role !== 'ORGANIZER';
            }
            return false;
          });
          setTeamMembers(filteredMembers);
        }
        if (invRes.ok) setInvitations(await invRes.json() || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [session]);

  const formatDate = (val: string) => {
    if (!val) return '';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }} onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={20} color="#1e1b3d" />
          <Text style={{ fontSize: 14, color: '#1e1b3d', fontWeight: '600' }}>Back to Home</Text>
        </TouchableOpacity>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#f3e8ff' }]}>
              <Ionicons name="people" size={20} color="#7e22ce" />
            </View>
            <Text style={styles.statLabel}>Total Members</Text>
            <Text style={styles.statValue}>{teamMembers.length}</Text>
          </View>



          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#ffedd5' }]}>
              <Ionicons name="briefcase" size={20} color="#c2410c" />
            </View>
            <Text style={styles.statLabel}>Staff & Roles</Text>
            <Text style={styles.statValue}>{teamMembers.filter(m => !['PORTAL_ADMIN', 'ORGANIZER'].includes(m.role)).length}</Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, listMode === 'invitations' && styles.tabBtnActive]} 
            onPress={() => setListMode('invitations')}
          >
            <Text style={[styles.tabBtnText, listMode === 'invitations' && styles.tabBtnTextActive]}>
              Invitations ({invitations.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, listMode === 'members' && styles.tabBtnActive]} 
            onPress={() => setListMode('members')}
          >
            <Text style={[styles.tabBtnText, listMode === 'members' && styles.tabBtnTextActive]}>
              Members ({teamMembers.length})
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#5b3cc4" />
          </View>
        ) : listMode === 'invitations' ? (
          // INVITATIONS LIST
          invitations.length === 0 ? (
            <View style={styles.emptyStateBox}>
              <Text style={styles.emptyText}>No organizer invitations sent yet.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {invitations.map((inv, i) => (
                <View key={inv.id || i} style={[styles.listItem, i === invitations.length - 1 && styles.lastItem]}>
                  <View style={styles.listText}>
                    <Text style={styles.listTitle}>{inv.email}</Text>
                    <Text style={styles.listSubtitle}>Invited By: {inv.invitedByName || 'Portal Admin'}</Text>
                    <Text style={styles.listSubtitle}>Sent: {formatDate(inv.createdAt)} | Expires: {formatDate(inv.expiryDate)}</Text>
                  </View>
                  <View style={[styles.badge, 
                    inv.status === 'ACCEPTED' ? styles.badgeSuccess : 
                    inv.status === 'REJECTED' ? styles.badgeDanger : 
                    inv.status === 'EXPIRED' ? styles.badgeInactive : styles.badgeWarning
                  ]}>
                    <Text style={[styles.badgeText, 
                      inv.status === 'ACCEPTED' ? styles.badgeSuccessText : 
                      inv.status === 'REJECTED' ? styles.badgeDangerText : 
                      inv.status === 'EXPIRED' ? styles.badgeInactiveText : styles.badgeWarningText
                    ]}>
                      {String(inv.status || 'PENDING').replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )
        ) : (
          // MEMBERS LIST
          teamMembers.length === 0 ? (
            <View style={styles.emptyStateBox}>
              <Text style={styles.emptyText}>No members found yet.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {teamMembers.map((member, i) => (
                <View key={member.id || i} style={[styles.listItem, i === teamMembers.length - 1 && styles.lastItem]}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{member.firstName?.charAt(0) || 'M'}</Text>
                  </View>
                  <View style={styles.listText}>
                    <Text style={styles.listTitle}>{member.firstName} {member.lastName}</Text>
                    <Text style={styles.listSubtitle}>{member.email}</Text>
                    <Text style={styles.listSubtitle}>{member.phoneNumber || 'N/A'}</Text>
                  </View>
                  
                  <View style={styles.listActions}>
                    <View style={[styles.roleBadge, 
                      member.role === 'PORTAL_ADMIN' ? { backgroundColor: '#2563eb' } :
                      member.role === 'ORGANIZER' ? { backgroundColor: '#16a34a' } :
                      member.role === 'TRAINER' ? { backgroundColor: '#1f2937' } :
                      member.role === 'COORDINATOR' ? { backgroundColor: '#06b6d4' } :
                      { backgroundColor: '#eab308' }
                    ]}>
                      <Text style={[styles.roleBadgeText, member.role === 'STAFF' && { color: '#000' }]}>
                        {String(member.role || 'STAFF').replace('_', ' ')}
                      </Text>
                    </View>

                    <View style={styles.actionCol}>
                      <View style={[styles.badge, member.active ? styles.badgeSuccess : styles.badgeInactive]}>
                        <Text style={[styles.badgeText, member.active ? styles.badgeSuccessText : styles.badgeInactiveText]}>
                          {member.active ? 'Active' : 'Inactive'}
                        </Text>
                      </View>

                      {member.role === 'PORTAL_ADMIN' ? (
                        <Text style={styles.protectedText}>Protected</Text>
                      ) : (
                        session?.role === 'PORTAL_ADMIN' && (
                          <TouchableOpacity style={styles.deleteBtn}>
                            <Ionicons name="trash-outline" size={14} color="#ef4444" />
                            <Text style={styles.deleteBtnText}>Delete</Text>
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' },
  header: { padding: 22, paddingTop: 60, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceaf3' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1e1b3d' },
  content: { padding: 16 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { width: '48%', backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#eceaf3' },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statLabel: { fontSize: 13, color: '#77758a', fontWeight: '500' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#1e1b3d', marginTop: 4 },

  tabsContainer: { flexDirection: 'row', backgroundColor: '#f1f3f8', borderRadius: 12, padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#5b3cc4' },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: '#68667a' },
  tabBtnTextActive: { color: '#ffffff' },

  listContainer: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#eceaf3', overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0eef6' },
  lastItem: { borderBottomWidth: 0 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e1b3d', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  listText: { flex: 1, paddingRight: 10 },
  listTitle: { fontSize: 15, fontWeight: '700', color: '#1e1b3d' },
  listSubtitle: { fontSize: 12, color: '#77758a', marginTop: 4 },

  listActions: { alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 },
  actionCol: { alignItems: 'flex-end', gap: 8 },
  
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start' },
  roleBadgeText: { fontSize: 10, fontWeight: '700', color: '#ffffff', textTransform: 'uppercase' },
  
  protectedText: { fontSize: 12, color: '#9ca3af', fontStyle: 'italic', marginTop: 4 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#fca5a5', borderRadius: 6, backgroundColor: '#fef2f2', marginTop: 4 },
  deleteBtnText: { color: '#ef4444', fontSize: 11, fontWeight: '600' },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeSuccess: { backgroundColor: '#e6f7ec' },
  badgeSuccessText: { color: '#008a3d' },
  badgeDanger: { backgroundColor: '#fce8e8' },
  badgeDangerText: { color: '#dc3545' },
  badgeWarning: { backgroundColor: '#fff3cd' },
  badgeWarningText: { color: '#856404' },
  badgeInactive: { backgroundColor: '#f0eef6' },
  badgeInactiveText: { color: '#68667a' },

  loadingBox: { padding: 40, alignItems: 'center' },
  emptyStateBox: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#68667a', textAlign: 'center' },
});
