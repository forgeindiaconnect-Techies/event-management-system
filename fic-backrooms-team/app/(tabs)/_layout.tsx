import { Drawer } from 'expo-router/drawer';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { useSession } from '../session';
import HelpModal from '../../components/HelpModal';

export default function TabLayout() {
  const { session, setSession } = useSession();
  const isAdmin = session?.role === 'PORTAL_ADMIN';
  const isOrganizer = session?.role === 'ORGANIZER';
  const role = session?.role || '';

  // Operational roles — can verify tickets, mark attendance, file incident reports
  const isStaff = role === 'STAFF' || role === 'Staff';
  const isCoordinator = role === 'COORDINATOR';
  const isVolunteer = role === 'VOLUNTEER';
  const isOperational = isStaff || isCoordinator || isVolunteer;

  // Guest / Expert roles — read-only schedule view
  const isSpeaker = role === 'SPEAKER';
  const isJudge = role === 'JUDGE';
  const isTrainer = role === 'TRAINER';
  const isChiefGuest = role === 'CHIEF_GUEST';
  const isGuestRole = isSpeaker || isJudge || isTrainer || isChiefGuest;

  const isNonAdminRole = !isAdmin && !isOrganizer;
  const userRoleStr = role.replaceAll('_', ' ') || 'TEAM MEMBER';
  const portalName = session?.portalName || 'FIC BackRooms';

  const [chatVisible, setChatVisible] = useState(false);


  const logout = () => {
    setSession(null);
    router.replace('/');
  };

  const renderHeaderRight = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingRight: 16 }}>
      <TouchableOpacity style={styles.settingsIcon} onPress={() => setChatVisible(true)}>
        <Ionicons name="help-circle-outline" size={24} color="#1e1b3d" />
      </TouchableOpacity>
      {isAdmin && (
        <TouchableOpacity style={styles.settingsIcon} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={24} color="#1e1b3d" />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.profile} onPress={() => router.push('/profile')}>
        <Text style={styles.profileText}>{(session?.email || 'TM').slice(0, 2).toUpperCase()}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Drawer
        key={isAdmin ? 'admin-tabs' : isOrganizer ? 'org-tabs' : isOperational ? 'operational-tabs' : isGuestRole ? 'guest-tabs' : 'default-tabs'}
        screenOptions={{
          drawerActiveTintColor: '#20146f',
          headerShown: true, // Show header for the hamburger menu
        }}
        drawerContent={(props) => {
          const renderInternal = (name: string, title: string, iconName: any) => {
            const focused = props.state.routeNames[props.state.index] === name;
            return (
              <DrawerItem
                label={title}
                focused={focused}
                activeTintColor="#20146f"
                icon={({ color, size }) => <Ionicons name={iconName} size={size} color={color} />}
                onPress={() => props.navigation.navigate(name)}
              />
            );
          };

          const renderExternal = (path: any, title: string, iconName: any) => {
            return (
              <DrawerItem
                label={title}
                icon={({ color, size }) => <Ionicons name={iconName} size={size} color={color} />}
                onPress={() => router.push(path)}
              />
            );
          };

          return (
            <DrawerContentScrollView {...props}>
              {/* Always show Home at the top */}
              {renderInternal('index', 'Home', 'home')}
              
              {isAdmin && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>Admin Features</Text>
                  {renderInternal('events', 'Events', 'calendar')}
                  {renderInternal('teams', 'Staff', 'people')}
                  {renderInternal('billing', 'Billing', 'card')}
                  
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>Management Features</Text>
                  {renderInternal('reports', 'Reports', 'document-text-outline')}
                  {renderInternal('analytics', 'Analytics', 'bar-chart-outline')}
                  {renderInternal('attendees', 'Attendees', 'people-circle-outline')}
                </>
              )}

              {isOrganizer && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>Organizer Features</Text>
                  {renderInternal('events', 'Events', 'calendar')}
                  {renderInternal('teams', 'Staff', 'people')}
                  {renderInternal('registrations', 'Registrations', 'ticket')}
                  {renderInternal('attendance', 'Attendance', 'checkmark-done-outline')}
                  {renderInternal('tickets', 'Tickets', 'ticket-outline')}
                  {renderInternal('certificates', 'Certificates', 'ribbon-outline')}
                  
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>Management Features</Text>
                  {renderInternal('reports', 'Reports', 'document-text-outline')}
                </>
              )}

              {!isAdmin && !isOrganizer && isCoordinator && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>Coordinator Workspace</Text>
                  {renderInternal('assignments', 'Assigned Events', 'calendar-outline')}
                  {renderInternal('coordinator-team', 'Team', 'people-outline')}
                  {renderInternal('coordinator-tasks', 'Tasks', 'checkmark-circle-outline')}
                  {renderInternal('coordinator-incidents', 'Incidents', 'alert-circle-outline')}
                  {renderInternal('tickets', 'Ticket Verify', 'ticket-outline')}
                  {renderInternal('check-in', 'Attendance', 'qr-code')}
                  {renderInternal('coordinator-reports', 'Reports', 'bar-chart-outline')}
                </>
              )}

              {!isAdmin && !isOrganizer && isStaff && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>Staff Workspace</Text>
                  {renderInternal('assignments', 'Assigned Events', 'calendar-outline')}
                  {renderInternal('tickets', 'Ticket Verify', 'ticket-outline')}
                  {renderInternal('check-in', 'Attendance', 'qr-code')}
                  {renderInternal('incident-report', 'Incident Report', 'alert-circle-outline')}
                </>
              )}

              {!isAdmin && !isOrganizer && isVolunteer && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>Volunteer Workspace</Text>
                  {renderInternal('assignments', 'Assigned Events', 'calendar-outline')}
                  {renderInternal('volunteer-tasks', 'My Tasks', 'list-outline')}
                </>
              )}

              {!isAdmin && !isOrganizer && isSpeaker && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>Speaker Workspace</Text>
                  {renderInternal('speaker-sessions', 'My Sessions', 'mic-outline')}
                  {renderInternal('assignments', 'Schedule', 'calendar-outline')}
                </>
              )}

              {!isAdmin && !isOrganizer && isJudge && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>Judge Workspace</Text>
                  {renderInternal('assignments', 'Competitions', 'trophy-outline')}
                  {renderInternal('assignments', 'Assigned Work', 'list-outline')}
                </>
              )}

              {!isAdmin && !isOrganizer && isTrainer && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>Trainer Workspace</Text>
                  {renderInternal('assignments', 'Assigned Teams', 'people-outline')}
                  {renderInternal('assignments', 'Schedule', 'calendar-outline')}
                </>
              )}

              {!isAdmin && !isOrganizer && isChiefGuest && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>Chief Guest Workspace</Text>
                  {renderInternal('assignments', 'Event Schedule', 'calendar-outline')}
                  {renderInternal('chief-guest-details', 'Event Details', 'information-circle-outline')}
                </>
              )}

              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Account</Text>

              {renderExternal('/profile', 'My Profile', 'person-outline')}
              <DrawerItem 
                label="Sign Out" 
                labelStyle={{ color: '#a01e3e' }}
                icon={({ size }) => <Ionicons name="log-out-outline" size={size} color="#a01e3e" />} 
                onPress={logout} 
              />
            </DrawerContentScrollView>
          );
        }}
      >
        
        {/* We keep Drawer.Screen components so Expo Router knows about them, but we hide them all from the default list because we render them manually above */}
        <Drawer.Screen 
          name="index" 
          options={{ 
            drawerItemStyle: { display: 'none' },
            headerTitle: () => (
              <View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#1e1b3d' }}>FIC BackRooms</Text>
                <Text style={{ fontSize: 12, color: '#77758a' }}>{portalName}</Text>
              </View>
            ),
            headerRight: renderHeaderRight,
          }} 
        />
        <Drawer.Screen name="events" options={{ drawerItemStyle: { display: 'none' }, title: 'Events', headerRight: renderHeaderRight }} />
        <Drawer.Screen name="teams" options={{ drawerItemStyle: { display: 'none' }, title: 'Team Members', headerRight: renderHeaderRight }} />
        <Drawer.Screen name="registrations" options={{ drawerItemStyle: { display: 'none' }, title: 'Registrations', headerRight: renderHeaderRight }} />
        <Drawer.Screen name="billing" options={{ drawerItemStyle: { display: 'none' }, title: 'Billing', headerRight: renderHeaderRight }} />
        <Drawer.Screen name="assignments" options={{ drawerItemStyle: { display: 'none' }, title: 'Assignments', headerRight: renderHeaderRight }} />
        <Drawer.Screen name="check-in" options={{ drawerItemStyle: { display: 'none' }, title: 'Check-in', headerRight: renderHeaderRight }} />
        <Drawer.Screen name="announcements" options={{ drawerItemStyle: { display: 'none' }, title: 'Updates', headerRight: renderHeaderRight }} />
        <Drawer.Screen name="reports" options={{ drawerItemStyle: { display: 'none' }, title: 'Reports', headerRight: renderHeaderRight }} />
        <Drawer.Screen name="analytics" options={{ drawerItemStyle: { display: 'none' }, title: 'Analytics', headerRight: renderHeaderRight }} />
        <Drawer.Screen name="attendees" options={{ drawerItemStyle: { display: 'none' }, title: 'Attendees', headerRight: renderHeaderRight }} />
        <Drawer.Screen name="attendance" options={{ drawerItemStyle: { display: 'none' }, title: 'Attendance', headerRight: renderHeaderRight }} />
        <Drawer.Screen name="tickets" options={{ drawerItemStyle: { display: 'none' }, title: 'Tickets', headerRight: renderHeaderRight }} />
        <Drawer.Screen name="certificates" options={{ drawerItemStyle: { display: 'none' }, title: 'Certificates', headerRight: renderHeaderRight }} />
        <Drawer.Screen name="incident-report" options={{ drawerItemStyle: { display: 'none' }, title: 'Incident Report', headerRight: renderHeaderRight }} />
        <Drawer.Screen name="volunteer-tasks" options={{ drawerItemStyle: { display: 'none' }, title: 'My Tasks', headerRight: renderHeaderRight }} />
        <Drawer.Screen name="speaker-sessions" options={{ drawerItemStyle: { display: 'none' }, title: 'My Sessions', headerRight: renderHeaderRight }} />
        <Drawer.Screen name="chief-guest-details" options={{ drawerItemStyle: { display: 'none' }, title: 'Event Details', headerRight: renderHeaderRight }} />
        <Drawer.Screen name="coordinator-team" options={{ drawerItemStyle: { display: 'none' }, title: 'Team', headerRight: renderHeaderRight }} />
        <Drawer.Screen name="coordinator-tasks" options={{ drawerItemStyle: { display: 'none' }, title: 'Tasks', headerRight: renderHeaderRight }} />
        <Drawer.Screen name="coordinator-incidents" options={{ drawerItemStyle: { display: 'none' }, title: 'Incidents', headerRight: renderHeaderRight }} />
        <Drawer.Screen name="coordinator-reports" options={{ drawerItemStyle: { display: 'none' }, title: 'Reports', headerRight: renderHeaderRight }} />
        <Drawer.Screen name="explore" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="more" options={{ drawerItemStyle: { display: 'none' } }} />
      </Drawer>

      <HelpModal visible={chatVisible} onClose={() => setChatVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: '#eceaf3',
    marginVertical: 10,
    marginHorizontal: 16,
  },
  sectionTitle: {
    color: '#68667a',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 16,
    marginTop: 10,
    marginBottom: 5,
  },
  settingsIcon: {
    padding: 4,
  },
  profile: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#20146f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  }
});
