import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useSession } from '../session';
import HelpModal from '../../components/HelpModal';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

type AssignedEvent = {
  id: string;
  name: string;
  date: string;
  location: string;
  roleDuty: string;
  bannerUrl?: string;
  status?: string;
  sessionTitle?: string;
  sessionDate?: string;
  sessionTime?: string;
  portalId?: string | number;
  roleName?: string;
};

export default function TeamHomeScreen() {
  const { session, setSession } = useSession();
  const role = session?.role || '';
  const portalName = session?.portalName || 'FIC BackRooms';
  const isAdmin = role === 'PORTAL_ADMIN';
  const isOrganizer = role === 'ORGANIZER';

  // Operational roles
  const isStaff = role === 'STAFF' || role === 'Staff';
  const isCoordinator = role === 'COORDINATOR';
  const isVolunteer = role === 'VOLUNTEER';
  const isOperational = isStaff || isCoordinator || isVolunteer;

  // Guest / Expert roles
  const isSpeaker = role === 'SPEAKER';
  const isJudge = role === 'JUDGE';
  const isTrainer = role === 'TRAINER';
  const isChiefGuest = role === 'CHIEF_GUEST';
  const isGuestRole = isSpeaker || isJudge || isTrainer || isChiefGuest;

  const isNonAdmin = !isAdmin && !isOrganizer;
  const displayRole = role.replaceAll('_', ' ');

  const [chatVisible, setChatVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [assignedEvents, setAssignedEvents] = useState<AssignedEvent[]>([]);
  const [adminStats, setAdminStats] = useState({ events: 0, registrations: 0, users: 0, organizers: 0 });
  const [orgStats, setOrgStats] = useState({ events: 0, registrations: 0, staff: 0, completedEvents: 0 });
  const [coordStats, setCoordStats] = useState({ team: 0, tasks: 0, incidents: 0 });

  useEffect(() => {
    fetchDashboardData();
  }, [session?.portalId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      if (isAdmin && session?.portalId) {
        // Fetch real data from the backend for Admin Dashboard
        const headers = { Authorization: `Bearer ${session?.token}` };

        const [eventsRes, regRes, usersRes, orgRes] = await Promise.all([
          fetch(`${API_BASE_URL}/events/portal/${session.portalId}`, { headers }),
          fetch(`${API_BASE_URL}/registrations/portal/${session.portalId}`, { headers }),
          fetch(`${API_BASE_URL}/users/portal/${session.portalId}`, { headers }),
          fetch(`${API_BASE_URL}/users/organizers/portal/${session.portalId}`, { headers })
        ]);

        const events = eventsRes.ok ? await eventsRes.json() : [];
        const registrations = regRes.ok ? await regRes.json() : [];
        const users = usersRes.ok ? await usersRes.json() : [];
        const organizers = orgRes.ok ? await orgRes.json() : [];

        setAdminStats({
          events: events.length || 0,
          registrations: registrations.length || 0,
          users: users.length || 0,
          organizers: organizers.length || 0
        });

      } else if (isOrganizer && session?.portalId && session?.userId) {
        // Fetch real data from the backend for Organizer Dashboard
        const headers = { Authorization: `Bearer ${session?.token}` };

        const [eventsRes, regRes, usersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/events/organizer/${session.userId}`, { headers }),
          fetch(`${API_BASE_URL}/registrations/portal/${session.portalId}`, { headers }),
          fetch(`${API_BASE_URL}/users/portal/${session.portalId}`, { headers })
        ]);

        const events = eventsRes.ok ? await eventsRes.json() : [];
        const myEventIds = (events || []).map((e: any) => e.id);
        const registrations = regRes.ok ? await regRes.json() : [];
        const myRegistrations = (registrations || []).filter((reg: any) => myEventIds.includes(reg.event?.id));
        const users = usersRes.ok ? await usersRes.json() : [];
        if (session?.userId) {
          const currentUser = (users || []).find((u: any) => u.id === Number(session.userId) || u.id === session.userId);
          if (currentUser) setUserProfile(currentUser);
        }
        
        const myStaff = (users || []).filter((u: any) => {
          const r = u.role?.roleName || u.roleName || u.role;
          return r === 'STAFF';
        });

        setOrgStats({
          events: events.length || 0,
          registrations: myRegistrations.length || 0,
          staff: myStaff.length || 0,
          completedEvents: events.filter((e: any) => e.status === 'COMPLETED').length || 0
        });

      } else if (session?.userId) {
        // Universal fetch for ALL team roles (Staff, Coordinator, Volunteer, Speaker, Judge, Trainer, Chief Guest)
        const res = await fetch(`${API_BASE_URL}/event-assignments/user/${session.userId}`, {
          headers: { Authorization: `Bearer ${session?.token}` },
        });

        if (res.ok) {
          const data = await res.json();
          let mappedEvents = data.map((a: any) => ({
            id: a.id?.toString() || Math.random().toString(),
            name: a.eventName || 'Unknown Event',
            date: a.eventStartDateTime
              ? new Date(a.eventStartDateTime).toLocaleDateString() + ' ' + new Date(a.eventStartDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'TBA',
            location: a.eventVenue || 'TBA',
            roleDuty: a.roleName?.replaceAll('_', ' ') || displayRole,
            bannerUrl: a.bannerUrl,
            status: a.eventStatus,
            sessionTitle: a.sessionTitle,
            sessionDate: a.sessionDate,
            sessionTime: a.sessionTime,
            portalId: a.portalId,
            roleName: a.roleName,
          }));

          // Filter by active role and portal
          if (session?.portalId && session?.role) {
            mappedEvents = mappedEvents.filter((a: any) => {
              const matchesPortal = Number(a.portalId) === Number(session.portalId) || !a.portalId;
              const matchesRole = a.roleName === session.role || (session.role === 'STAFF' && a.roleName === 'Staff');
              return matchesPortal && matchesRole;
            });
          }

          setAssignedEvents(mappedEvents);

          // If Coordinator, also fetch team, tasks, and incidents for metrics
          if (role === 'COORDINATOR') {
            const activeEventIds = data.filter((a: any) => a.active !== false && a.eventId).map((a: any) => a.eventId);
            if (activeEventIds.length > 0) {
              const details = await Promise.all(activeEventIds.map(async (id: any) => {
                const results = await Promise.allSettled([
                  fetch(`${API_BASE_URL}/staff-assignments/event/${id}`, { headers: { Authorization: `Bearer ${session?.token}` } }).then(r => r.ok ? r.json() : []),
                  fetch(`${API_BASE_URL}/volunteer-assignments/event/${id}`, { headers: { Authorization: `Bearer ${session?.token}` } }).then(r => r.ok ? r.json() : []),
                  fetch(`${API_BASE_URL}/events/${id}/operations/tasks`, { headers: { Authorization: `Bearer ${session?.token}` } }).then(r => r.ok ? r.json() : []),
                  fetch(`${API_BASE_URL}/events/${id}/operations/incidents`, { headers: { Authorization: `Bearer ${session?.token}` } }).then(r => r.ok ? r.json() : [])
                ]);
                return results.map(r => r.status === 'fulfilled' ? r.value || [] : []);
              }));
              
              setCoordStats({
                team: details.reduce((n, x) => n + x[0].length + x[1].length, 0),
                tasks: details.reduce((n, x) => n + x[2].filter((t: any) => !['COMPLETED', 'CANCELLED'].includes(t.status)).length, 0),
                incidents: details.reduce((n, x) => n + x[3].filter((i: any) => !['RESOLVED', 'CLOSED'].includes(i.status)).length, 0),
              });
            }
          }
        } else {
          setAssignedEvents([]);
        }
      }

    } catch {
      setAssignedEvents([]);
    } finally {
      setLoading(false);
    }
  };



  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header content moved to Drawer Navbar */}

        {isOrganizer && userProfile ? (
          <View style={styles.dashboardProfile}>
            <View style={styles.dashboardProfileText}>
              <Text style={styles.eyebrow}>ORGANIZER DASHBOARD</Text>
              <Text style={styles.title}>Welcome, {userProfile.firstName || 'Organizer'}!</Text>
            </View>
          </View>
        ) : null}

        {/* Dynamic Content Area */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#3d2e9c" />
            <Text style={styles.loadingText}>Syncing your workspace...</Text>
          </View>
        ) : (
          <View style={styles.dashboardContent}>

            {isAdmin ? (
              // PORTAL ADMIN VIEW
              <View>
                <View style={styles.adminStatsGrid}>
                  <TouchableOpacity style={styles.adminStatCard} onPress={() => router.push('/events')}>
                    <Ionicons name="calendar-outline" size={22} color="#5b3cc4" />
                    <Text style={styles.adminStatValue}>{adminStats.events}</Text>
                    <Text style={styles.adminStatLabel}>Total Events</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.adminStatCard} onPress={() => router.push('/registrations')}>
                    <Ionicons name="ticket-outline" size={22} color="#5b3cc4" />
                    <Text style={styles.adminStatValue}>{adminStats.registrations}</Text>
                    <Text style={styles.adminStatLabel}>Registrations</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.adminStatCard} onPress={() => router.push('/teams')}>
                    <Ionicons name="people-outline" size={22} color="#5b3cc4" />
                    <Text style={styles.adminStatValue}>{adminStats.users}</Text>
                    <Text style={styles.adminStatLabel}>Users</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.adminStatCard} onPress={() => router.push('/teams')}>
                    <Ionicons name="person-add-outline" size={22} color="#5b3cc4" />
                    <Text style={styles.adminStatValue}>{adminStats.organizers}</Text>
                    <Text style={styles.adminStatLabel}>Organizers</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Admin Controls</Text>
                <TouchableOpacity style={styles.adminActionBtn} onPress={() => router.push('/invite-organizer')}>
                  <Ionicons name="mail-outline" size={20} color="#ffffff" />
                  <Text style={styles.adminActionText}>Invite Organizer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.adminActionBtn, { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dfdeea', marginTop: 10 }]} onPress={() => router.push('/create-event')}>
                  <Ionicons name="add-circle-outline" size={20} color="#3d2e9c" />
                  <Text style={[styles.adminActionText, { color: '#3d2e9c' }]}>Create New Event</Text>
                </TouchableOpacity>
              </View>
            ) : isOrganizer ? (
              // ORGANIZER VIEW
              <View>
                <View style={styles.adminStatsGrid}>
                  <TouchableOpacity style={styles.adminStatCard} onPress={() => router.push('/events')}>
                    <Ionicons name="calendar-outline" size={22} color="#5b3cc4" />
                    <Text style={styles.adminStatValue}>{orgStats.events}</Text>
                    <Text style={styles.adminStatLabel}>My Events</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.adminStatCard} onPress={() => router.push('/registrations')}>
                    <Ionicons name="ticket-outline" size={22} color="#5b3cc4" />
                    <Text style={styles.adminStatValue}>{orgStats.registrations}</Text>
                    <Text style={styles.adminStatLabel}>Registrations</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.adminStatCard} onPress={() => router.push('/teams')}>
                    <Ionicons name="people-outline" size={22} color="#5b3cc4" />
                    <Text style={styles.adminStatValue}>{orgStats.staff}</Text>
                    <Text style={styles.adminStatLabel}>My Staff</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.adminStatCard} onPress={() => router.push('/events')}>
                    <Ionicons name="checkmark-circle-outline" size={22} color="#5b3cc4" />
                    <Text style={styles.adminStatValue}>{orgStats.completedEvents}</Text>
                    <Text style={styles.adminStatLabel}>Completed</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%' }]} onPress={() => router.push('/invite-staff')}>
                    <Ionicons name="person-add-outline" size={20} color="#ffffff" />
                    <Text style={styles.adminActionText}>Invite Staff</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%' }]} onPress={() => router.push('/attendance')}>
                    <Ionicons name="checkmark-done-outline" size={20} color="#ffffff" />
                    <Text style={styles.adminActionText}>Attendance</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%' }]} onPress={() => router.push('/tickets')}>
                    <Ionicons name="ticket-outline" size={20} color="#ffffff" />
                    <Text style={styles.adminActionText}>Tickets</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%' }]} onPress={() => router.push('/reports')}>
                    <Ionicons name="document-text-outline" size={20} color="#ffffff" />
                    <Text style={styles.adminActionText}>Reports</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '100%' }]} onPress={() => router.push('/team-assignment')}>
                    <Ionicons name="clipboard-outline" size={20} color="#ffffff" />
                    <Text style={styles.adminActionText}>Team Assignment</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // ALL NON-ADMIN / NON-ORGANIZER ROLES
              <View>
                <Text style={styles.title}>{displayRole} Dashboard</Text>
                <Text style={{ fontSize: 13, color: '#68667a', marginTop: 6, marginBottom: 24, lineHeight: 18 }}>
                  Welcome back, {userProfile?.firstName || 'Team Member'}. Here's your workspace for <Text style={{fontWeight: '700'}}>{portalName}</Text>.
                </Text>

                {/* Stats — show for ALL non-admin roles */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }} contentContainerStyle={{ gap: 12 }}>
                  <View style={[styles.adminStatCard, { width: 140, minWidth: 140 }]}>
                    <Ionicons name="calendar-outline" size={20} color="#6646e5" />
                    <Text style={styles.adminStatLabel}>
                      {isGuestRole ? 'Engagements' : 'Assigned Events'}
                    </Text>
                    <Text style={styles.adminStatValue}>{assignedEvents.length || 0}</Text>
                  </View>
                  
                  {isCoordinator ? (
                    <>
                      <View style={[styles.adminStatCard, { width: 140, minWidth: 140 }]}>
                        <Ionicons name="people-outline" size={20} color="#b366ff" />
                        <Text style={styles.adminStatLabel}>Assigned Team</Text>
                        <Text style={styles.adminStatValue}>{coordStats.team}</Text>
                      </View>
                      <View style={[styles.adminStatCard, { width: 140, minWidth: 140 }]}>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#2c7a3f" />
                        <Text style={styles.adminStatLabel}>Open Tasks</Text>
                        <Text style={styles.adminStatValue}>{coordStats.tasks}</Text>
                      </View>
                      <View style={[styles.adminStatCard, { width: 140, minWidth: 140 }]}>
                        <Ionicons name="bar-chart-outline" size={20} color="#dc2626" />
                        <Text style={styles.adminStatLabel}>Open Incidents</Text>
                        <Text style={styles.adminStatValue}>{coordStats.incidents}</Text>
                      </View>
                    </>
                  ) : isOperational ? (
                    <>
                      <View style={[styles.adminStatCard, { width: 140, minWidth: 140 }]}>
                        <Ionicons name="ticket-outline" size={20} color="#b366ff" />
                        <Text style={styles.adminStatLabel}>Tickets Verified</Text>
                        <Text style={styles.adminStatValue}>0</Text>
                      </View>
                      <View style={[styles.adminStatCard, { width: 140, minWidth: 140 }]}>
                        <Ionicons name="checkmark-done-circle-outline" size={20} color="#2c7a3f" />
                        <Text style={styles.adminStatLabel}>Checked In</Text>
                        <Text style={styles.adminStatValue}>0</Text>
                      </View>
                    </>
                  ) : null}

                  {isGuestRole && (
                    <View style={[styles.adminStatCard, { width: 140, minWidth: 140 }]}>
                      <Ionicons name="time-outline" size={20} color="#f59e0b" />
                      <Text style={styles.adminStatLabel}>Upcoming</Text>
                      <Text style={styles.adminStatValue}>
                        {assignedEvents.filter(e => e.status === 'UPCOMING').length || 0}
                      </Text>
                    </View>
                  )}
                </ScrollView>

                {/* Quick Actions — EVERY ROLE GETS ITS OWN */}
                {isNonAdmin && (
                  <View style={styles.dashboardProfile}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Quick Actions</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                        {isCoordinator ? (
                          <>
                            <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%', backgroundColor: '#0d6efd' }]} onPress={() => router.push('/coordinator-team')}>
                              <Ionicons name="people-outline" size={18} color="#ffffff" />
                              <Text style={[styles.adminActionText, { fontSize: 13 }]}>My Team</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%', backgroundColor: '#198754' }]} onPress={() => router.push('/coordinator-tasks')}>
                              <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
                              <Text style={[styles.adminActionText, { fontSize: 13 }]}>Tasks</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%', backgroundColor: '#f59e0b' }]} onPress={() => router.push('/coordinator-incidents')}>
                              <Ionicons name="alert-circle-outline" size={18} color="#ffffff" />
                              <Text style={[styles.adminActionText, { fontSize: 13 }]}>Incidents</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%', backgroundColor: '#5b3cc4' }]} onPress={() => router.push('/coordinator-reports')}>
                              <Ionicons name="bar-chart-outline" size={18} color="#ffffff" />
                              <Text style={[styles.adminActionText, { fontSize: 13 }]}>Reports</Text>
                            </TouchableOpacity>
                          </>
                        ) : isVolunteer ? (
                          <>
                            <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%', backgroundColor: '#0d6efd' }]} onPress={() => router.push('/volunteer-tasks')}>
                              <Ionicons name="list-outline" size={18} color="#ffffff" />
                              <Text style={[styles.adminActionText, { fontSize: 13 }]}>My Tasks</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dee2e6' }]} onPress={() => router.push('/assignments')}>
                              <Ionicons name="calendar-outline" size={18} color="#0d6efd" />
                              <Text style={[styles.adminActionText, { fontSize: 13, color: '#0d6efd' }]}>Events</Text>
                            </TouchableOpacity>
                          </>
                        ) : isStaff ? (
                          <>
                            <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%', backgroundColor: '#0d6efd' }]} onPress={() => router.push('/tickets')}>
                              <Ionicons name="ticket-outline" size={18} color="#ffffff" />
                              <Text style={[styles.adminActionText, { fontSize: 13 }]}>Verify Tickets</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%', backgroundColor: '#198754' }]} onPress={() => router.push('/check-in')}>
                              <Ionicons name="qr-code-outline" size={18} color="#ffffff" />
                              <Text style={[styles.adminActionText, { fontSize: 13 }]}>Attendance</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%', backgroundColor: '#f59e0b' }]} onPress={() => router.push('/incident-report')}>
                              <Ionicons name="alert-circle-outline" size={18} color="#ffffff" />
                              <Text style={[styles.adminActionText, { fontSize: 13 }]}>Report Incident</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dee2e6' }]} onPress={() => router.push('/assignments')}>
                              <Ionicons name="checkmark-done" size={18} color="#0d6efd" />
                              <Text style={[styles.adminActionText, { fontSize: 13, color: '#0d6efd' }]}>Assignments</Text>
                            </TouchableOpacity>
                          </>
                        ) : isSpeaker ? (
                          <>
                            <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%', backgroundColor: '#0d6efd' }]} onPress={() => router.push('/speaker-sessions')}>
                              <Ionicons name="mic-outline" size={18} color="#ffffff" />
                              <Text style={[styles.adminActionText, { fontSize: 13 }]}>My Sessions</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dee2e6' }]} onPress={() => router.push('/assignments')}>
                              <Ionicons name="calendar-outline" size={18} color="#0d6efd" />
                              <Text style={[styles.adminActionText, { fontSize: 13, color: '#0d6efd' }]}>Schedule</Text>
                            </TouchableOpacity>
                          </>
                        ) : isChiefGuest ? (
                          <>
                            <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%', backgroundColor: '#0d6efd' }]} onPress={() => router.push('/chief-guest-details')}>
                              <Ionicons name="information-circle-outline" size={18} color="#ffffff" />
                              <Text style={[styles.adminActionText, { fontSize: 13 }]}>Event Details</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dee2e6' }]} onPress={() => router.push('/assignments')}>
                              <Ionicons name="calendar-outline" size={18} color="#0d6efd" />
                              <Text style={[styles.adminActionText, { fontSize: 13, color: '#0d6efd' }]}>Schedule</Text>
                            </TouchableOpacity>
                          </>
                        ) : isJudge ? (
                          <>
                            <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%', backgroundColor: '#0d6efd' }]} onPress={() => router.push('/assignments')}>
                              <Ionicons name="trophy-outline" size={18} color="#ffffff" />
                              <Text style={[styles.adminActionText, { fontSize: 13 }]}>Competitions</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dee2e6' }]} onPress={() => router.push('/assignments')}>
                              <Ionicons name="list-outline" size={18} color="#0d6efd" />
                              <Text style={[styles.adminActionText, { fontSize: 13, color: '#0d6efd' }]}>Assigned Work</Text>
                            </TouchableOpacity>
                          </>
                        ) : isTrainer ? (
                          <>
                            <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%', backgroundColor: '#0d6efd' }]} onPress={() => router.push('/assignments')}>
                              <Ionicons name="people-outline" size={18} color="#ffffff" />
                              <Text style={[styles.adminActionText, { fontSize: 13 }]}>Assigned Teams</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.adminActionBtn, { flex: 1, minWidth: '45%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dee2e6' }]} onPress={() => router.push('/assignments')}>
                              <Ionicons name="calendar-outline" size={18} color="#0d6efd" />
                              <Text style={[styles.adminActionText, { fontSize: 13, color: '#0d6efd' }]}>Schedule</Text>
                            </TouchableOpacity>
                          </>
                        ) : null}
                      </View>
                    </View>
                  </View>
                )}

                {/* Schedule quick link — GUEST / EXPERT ROLES ONLY */}
                {isGuestRole && (
                  <TouchableOpacity style={[styles.dashboardProfile, { flexDirection: 'row', alignItems: 'center', gap: 14 }]} onPress={() => router.push('/assignments')}>
                    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#6646e5', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="calendar" size={24} color="#ffffff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e1b3d' }}>View My Schedule</Text>
                      <Text style={{ fontSize: 13, color: '#68667a', marginTop: 2 }}>
                        {assignedEvents.length} event{assignedEvents.length !== 1 ? 's' : ''} assigned to you
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9b9aab" />
                  </TouchableOpacity>
                )}

                {/* Assigned Events / Schedule list */}
                {assignedEvents.length > 0 ? (
                  <View style={[styles.dashboardProfile, { marginTop: 20, flexDirection: 'column', alignItems: 'stretch' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                        {isGuestRole ? 'My Engagements' : 'Assigned Event Activity'}
                      </Text>
                      <TouchableOpacity onPress={() => router.push('/assignments')}>
                        <Text style={{ color: '#0d6efd', fontSize: 13, fontWeight: '600' }}>View All →</Text>
                      </TouchableOpacity>
                    </View>
                    {assignedEvents.map(event => (
                      <View key={event.id} style={styles.eventCard}>
                        {event.bannerUrl && (
                          <Image source={{ uri: event.bannerUrl }} style={styles.eventBanner} />
                        )}
                        <View style={styles.eventCardContent}>
                          <View style={styles.eventIconBox}>
                            <Ionicons name={isGuestRole ? 'mic' : 'calendar'} size={24} color="#ffffff" />
                          </View>
                          <View style={styles.eventDetails}>
                            <Text style={styles.eventName}>{event.name}</Text>
                            <Text style={styles.eventTime}>{event.date} • {event.location}</Text>
                            {(event as any).sessionTitle ? (
                              <View style={styles.dutyBadge}>
                                <Ionicons name="mic-outline" size={14} color="#2c7a3f" />
                                <Text style={styles.dutyText}>{(event as any).sessionTitle}</Text>
                              </View>
                            ) : (
                              <View style={styles.dutyBadge}>
                                <Ionicons name="checkmark-done" size={14} color="#2c7a3f" />
                                <Text style={styles.dutyText}>{event.roleDuty}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={[styles.dashboardProfile, { marginTop: 20, flexDirection: 'column', alignItems: 'stretch' }]}>
                    <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
                      {isGuestRole ? 'My Engagements' : 'Assigned Event Activity'}
                    </Text>
                    <View style={[styles.emptyStateBox, { borderWidth: 0, paddingVertical: 40 }]}>
                      <Ionicons name="calendar-outline" size={48} color="#9b9aab" />
                      <Text style={styles.emptyTitle}>
                        {isGuestRole ? 'No engagements yet' : 'Waiting for assignment'}
                      </Text>
                      <Text style={styles.emptyText}>
                        {isGuestRole
                          ? "You haven't been scheduled for any events yet."
                          : "You haven't been assigned to any active events yet."}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}




          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function initials(email?: string) { return (email || 'TM').slice(0, 2).toUpperCase(); }

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' }, content: { padding: 22, paddingBottom: 38 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, brand: { fontSize: 19, color: '#1e1b3d', fontWeight: '800' }, portal: { fontSize: 13, color: '#77758a', marginTop: 3 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  settingsIcon: { padding: 4 },
  profile: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#20146f', alignItems: 'center', justifyContent: 'center' }, profileText: { color: '#fff', fontWeight: '800' },
  eyebrow: { color: '#6646e5', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginTop: 4 }, title: { color: '#1e1b3d', fontSize: 31, fontWeight: '800', textTransform: 'capitalize', marginTop: 9 },

  loadingBox: { marginTop: 60, alignItems: 'center', justifyContent: 'center' }, loadingText: { marginTop: 15, color: '#68667a', fontSize: 15, fontWeight: '600' },
  dashboardContent: { marginTop: 35 },
  sectionTitle: { color: '#26233e', fontSize: 19, fontWeight: '800', marginBottom: 16 },

  dashboardProfile: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#eceaf3', marginTop: 12 },
  dashboardProfileText: { flex: 1 },
  dashboardProfileSub: { color: '#68667a', fontSize: 13, fontWeight: '500' },

  // Admin Stats
  adminStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 35 },
  adminStatCard: { width: '48%', backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#eceaf3' },
  adminStatValue: { fontSize: 26, fontWeight: '800', color: '#1e1b3d', marginTop: 12 },
  adminStatLabel: { fontSize: 13, color: '#68667a', marginTop: 12 },
  adminActionBtn: { backgroundColor: '#1d126d', minHeight: 46, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  adminActionText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },

  // Assigned Events
  eventCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#eceaf3', marginBottom: 12 },
  eventBanner: { width: '100%', height: 120, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  eventCardContent: { padding: 16, flexDirection: 'row', gap: 16 },
  eventIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#5b3cc4', alignItems: 'center', justifyContent: 'center' },
  eventDetails: { flex: 1 },
  eventName: { fontSize: 16, fontWeight: '800', color: '#1e1b3d' },
  eventTime: { fontSize: 13, color: '#68667a', marginTop: 4 },
  dutyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eefcf1', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, alignSelf: 'flex-start', marginTop: 10 },
  dutyText: { fontSize: 12, fontWeight: '700', color: '#2c7a3f' },

  // Empty State
  emptyStateBox: { backgroundColor: '#ffffff', borderRadius: 18, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#eceaf3', borderStyle: 'dashed' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1e1b3d', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#68667a', textAlign: 'center', marginTop: 8, lineHeight: 22 },
});
