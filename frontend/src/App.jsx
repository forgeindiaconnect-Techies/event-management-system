import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import ChooseAccess from "./pages/ChooseAccess";
import AdminDashboard from "./pages/AdminDashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import CreateEvent from "./pages/CreateEvent";
import AdminEvents from "./pages/AdminEvents";
import Organizers from "./pages/Organizers";
import Attendees from "./pages/Attendees";
import Reports from "./pages/Reports";
import OrganizerTeams from "./pages/OrganizerTeams";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import OrganizerEvents from "./pages/OrganizerEvents";
import OrganizerRegistrations from "./pages/OrganizerRegistrations";
import OrganizerStaff from "./pages/OrganizerStaff";
import OrganizerAttendance from "./pages/OrganizerAttendance";
import OrganizerCertificates from "./pages/OrganizerCertificates";
import OrganizerReports from "./pages/OrganizerReports";
import OrganizerTickets from "./pages/OrganizerTickets";
import OrganizerInviteStaff from "./pages/OrganizerInviteStaff";
import AcceptRoleInvitation from "./pages/AcceptRoleInvitation";
import OrganizerTeamAssignment from "./pages/OrganizerTeamAssignment";
import EventDashboard from "./pages/EventDashboard";

import ManageLayout from "./layouts/ManageLayout";
import EventInfo from "./pages/EventInfo";
import TeamMembers from "./pages/manage/TeamMembers";
import TeamRoles from "./pages/manage/TeamRoles";
import EventOwnerPrivileges from "./pages/manage/EventOwnerPrivileges";
import EventOrganizerPrivileges from "./pages/manage/EventOrganizerPrivileges";
import EventStaffPrivileges from "./pages/manage/EventStaffPrivileges";
import Agenda from "./pages/manage/Agenda";
import Speakers from "./pages/manage/Speakers";
import Sponsors from "./pages/manage/Sponsors";
import Promote from "./pages/manage/Promote";
import Engagement from "./pages/manage/Engagement";
import EventLibrary from "./pages/manage/EventLibrary";

import RegistrationLayout from "./layouts/RegistrationLayout";
import Payments from "./pages/Registration/Payments";
import EventAttendees from "./pages/Registration/EventAttendees";
import Waitlist from "./pages/Registration/Waitlist";
import Approval from "./pages/Registration/Approval";
import RegistrationForm from "./pages/Registration/RegistrationForm";
import SalesSummary from "./pages/Registration/SalesSummary";
import TicketClasses from "./pages/Registration/TicketClasses";

import ExhibitorLayout from "./layouts/ExhibitorLayout";
import ExhibitorList from "./pages/Exhibitors/ExhibitorList";
import Booths from "./pages/Exhibitors/Booths";
import Leads from "./pages/Exhibitors/Leads";
import ExhibitorReports from "./pages/Exhibitors/ExhibitorReports";

import AbstractLayout from "./layouts/AbstractLayout";
import AbstractTopics from "./pages/Abstracts/AbstractTopics";
import AbstractForms from "./pages/Abstracts/AbstractForms";

import ReportsLayout from "./layouts/ReportsLayout";
import ReportsOverview from "./pages/Reports/ReportsOverview";
import RevenueReport from "./pages/Reports/RevenueReport";

import EventDayLayout from "./layouts/EventDayLayout";
import CheckIn from "./pages/EventDay/CheckIn";
import EventAttendance from "./pages/EventDay/EventAttendance";
import Announcements from "./pages/EventDay/Announcements";
import OperationsLayout from "./layouts/OperationsLayout";
import OperationsWorkspace from "./pages/operations/OperationsWorkspace";

import PublicDashboard from "./pages/public/PublicDashboard";
import PublicEventDetails from "./pages/public/PublicEventDetails";
import PublicRegistrationForm from "./pages/public/PublicRegistrationForm";
import PublicWelcome from "./pages/public/PublicWelcome";
import FindMyTicket from "./pages/public/FindMyTicket";

import CreatePortal from "./pages/CreatePortal";
import LandingPage from "./pages/LandingPage";
import LandingGuidePage from "./pages/LandingGuidePage";
import AcceptInvitation from "./pages/AcceptInvitation";

import StaffDashboard from "./pages/Staff/StaffDashboard";
import StaffEvents from "./pages/Staff/StaffEvents";
import StaffTicketVerification from "./pages/Staff/StaffTicketVerification";
import StaffAttendance from "./pages/Staff/StaffAttendance";

import CoordinatorDashboard from "./pages/Coordinator/CoordinatorDashboard";
import CoordinatorEvents from "./pages/Coordinator/CoordinatorEvents";
import CoordinatorAttendance from "./pages/Coordinator/CoordinatorAttendance";
import CoordinatorReports from "./pages/Coordinator/CoordinatorReports";
import VolunteerDashboard from "./pages/Volunteer/VolunteerDashboard";
import VolunteerEvents from "./pages/Volunteer/VolunteerEvents";
import CoordinatorTasks from "./pages/Coordinator/CoordinatorTasks";
import CoordinatorTeam from "./pages/Coordinator/CoordinatorTeam";
import CoordinatorIncidents from "./pages/Coordinator/CoordinatorIncidents";
import CoordinatorEventDay from "./pages/Coordinator/CoordinatorEventDay";
import VolunteerTasks from "./pages/Volunteer/VolunteerTasks";
import SpeakerDashboard from "./pages/Speaker/SpeakerDashboard";
import SpeakerSessions from "./pages/Speaker/SpeakerSessions";
import SpeakerSchedule from "./pages/Speaker/SpeakerSchedule";
import ChiefGuestDashboard from "./pages/ChiefGuest/ChiefGuestDashboard";
import ChiefGuestSchedule from "./pages/ChiefGuest/ChiefGuestSchedule";
import ChiefGuestDetails from "./pages/ChiefGuest/ChiefGuestDetails";
import JudgeDashboard from "./pages/Judge/JudgeDashboard";
import JudgeCompetitions from "./pages/Judge/JudgeCompetitions";
import JudgeWork from "./pages/Judge/JudgeWork";
import MentorDashboard from "./pages/Mentor/MentorDashboard";
import MentorTeams from "./pages/Mentor/MentorTeams";
import MentorSchedule from "./pages/Mentor/MentorSchedule";
import PublicTicket from "./pages/public/PublicTicket";
import PublicPayment from "./pages/public/PublicPayment";
import SuperAdminDashboard from "./pages/SuperAdmin/SuperAdminDashboard";
import AdminSubscription from "./pages/AdminSubscription";
import SubscriptionPayment from "./pages/SubscriptionPayment";
import MobileSelectEnhancer from "./components/MobileSelectEnhancer";
import HorizontalMenuArrows from "./components/HorizontalMenuArrows";
import TourCenter from "./pages/Help/TourCenter";


function App() {
  return (
    <BrowserRouter>
      <MobileSelectEnhancer />
      <HorizontalMenuArrows />
      <Routes>
      
{/* Landing */}
<Route path="/" element={<LandingPage />} />
<Route path="/guides/:slug" element={<LandingGuidePage />} />

{/* Auth */}
<Route path="/login" element={<Login />} />
<Route path="/choose-access" element={<ChooseAccess />} />
<Route path="/help/tour" element={<TourCenter />} />
<Route path="/help/tour/:tourType" element={<TourCenter />} />

{/* Create Portal */}
<Route path="/create-portal" element={<CreatePortal />} />
        

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute roles={["PORTAL_ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/events" element={<ProtectedRoute roles={["PORTAL_ADMIN"]}><AdminEvents /></ProtectedRoute>} />
        <Route path="/admin/organizers" element={<ProtectedRoute roles={["PORTAL_ADMIN"]}><Organizers /></ProtectedRoute>} />
        <Route path="/admin/attendees" element={<ProtectedRoute roles={["PORTAL_ADMIN"]}><Attendees /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute roles={["PORTAL_ADMIN"]}><Reports /></ProtectedRoute>} />
        <Route path="/admin/teams" element={<ProtectedRoute roles={["PORTAL_ADMIN"]}><OrganizerTeams /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute roles={["PORTAL_ADMIN"]}><Analytics /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute roles={["PORTAL_ADMIN"]}><Settings /></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute roles={["PORTAL_ADMIN"]}><AdminSubscription /></ProtectedRoute>} />
        <Route path="/subscription/payment" element={<ProtectedRoute roles={["PORTAL_ADMIN"]}><SubscriptionPayment /></ProtectedRoute>} />

        {/* Organizer */}
        <Route path="/organizer" element={<ProtectedRoute roles={["ORGANIZER"]}><OrganizerDashboard /></ProtectedRoute>} />
        <Route path="/organizer/events" element={<ProtectedRoute roles={["ORGANIZER"]}><OrganizerEvents /></ProtectedRoute>} />
        <Route path="/organizer/registrations" element={<ProtectedRoute roles={["ORGANIZER"]}><OrganizerRegistrations /></ProtectedRoute>} />
        <Route path="/organizer/staff" element={<ProtectedRoute roles={["ORGANIZER"]}><OrganizerStaff /></ProtectedRoute>} />
        <Route path="/organizer/attendance" element={<ProtectedRoute roles={["ORGANIZER"]}><OrganizerAttendance /></ProtectedRoute>} />
        <Route path="/organizer/certificates" element={<ProtectedRoute roles={["ORGANIZER"]}><OrganizerCertificates /></ProtectedRoute>} />
        <Route path="/organizer/reports" element={<ProtectedRoute roles={["ORGANIZER"]}><OrganizerReports /></ProtectedRoute>} />
        <Route path="/organizer/tickets" element={<ProtectedRoute roles={["ORGANIZER"]}><OrganizerTickets /></ProtectedRoute>} />
        <Route path="/organizer/invite-staff" element={<ProtectedRoute roles={["ORGANIZER"]}><OrganizerInviteStaff /></ProtectedRoute>} />
        <Route path="/organizer/team-assignment" element={<ProtectedRoute roles={["ORGANIZER"]}><OrganizerTeamAssignment /></ProtectedRoute>} />
        <Route
  path="/role-invitation/accept/:token"
  element={<AcceptRoleInvitation />}
/>  
        

        {/* Events */}
        <Route path="/create-event" element={<ProtectedRoute roles={["PORTAL_ADMIN", "ORGANIZER"]}><CreateEvent /></ProtectedRoute>} />
        <Route path="/events/:id" element={<EventDashboard />} />

        {/* Event Manage */}
        <Route path="/events/:id/manage" element={<ManageLayout />}>
          <Route index element={<EventInfo />} />
          <Route path="event-info" element={<EventInfo />} />
          <Route path="team" element={<TeamMembers />} />
          <Route path="team/owner-privileges" element={<EventOwnerPrivileges />} />
          <Route path="team/organizer-privileges" element={<EventOrganizerPrivileges />} />
          <Route path="team/staff-privileges" element={<EventStaffPrivileges />} />
          <Route path="team/roles" element={<TeamRoles />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="speakers" element={<Speakers />} />
          <Route path="sponsors" element={<Sponsors />} />
          <Route path="promote" element={<Promote />} />
          <Route path="engagement" element={<Engagement />} />
          <Route path="library" element={<EventLibrary />} />
        </Route>

        {/* Registrations */}
        <Route path="/events/:id/registrations" element={<RegistrationLayout />}>
          <Route index element={<EventAttendees />} />
          <Route path="attendees" element={<EventAttendees />} />
          <Route path="payments" element={<Payments />} />
          <Route path="waitlist" element={<Waitlist />} />
          <Route path="approval" element={<Approval />} />
          <Route path="form" element={<RegistrationForm />} />
          <Route path="ticket-classes" element={<TicketClasses />} />
          <Route path="sales" element={<SalesSummary />} />
        </Route>

        {/* Exhibitors */}
        <Route path="/events/:id/exhibitors" element={<ExhibitorLayout />}>
          <Route index element={<ExhibitorList />} />
          <Route path="list" element={<ExhibitorList />} />
          <Route path="booths" element={<Booths />} />
          <Route path="leads" element={<Leads />} />
          <Route path="reports" element={<ExhibitorReports />} />
        </Route>

        {/* Abstracts */}
        <Route path="/events/:id/abstracts" element={<AbstractLayout />}>
          <Route index element={<AbstractTopics />} />
          <Route path="topics" element={<AbstractTopics />} />
          <Route path="forms" element={<AbstractForms />} />
        </Route>

        {/* Reports */}
        <Route path="/events/:id/reports" element={<ReportsLayout />}>
          <Route index element={<ReportsOverview />} />
          <Route path="overview" element={<ReportsOverview />} />
          <Route path="revenue" element={<RevenueReport />} />
        </Route>

        {/* Event Day */}
        <Route path="/events/:id/event-day" element={<EventDayLayout />}>
          <Route index element={<CheckIn />} />
          <Route path="check-in" element={<CheckIn />} />
          <Route path="attendance" element={<EventAttendance />} />
          <Route path="announcements" element={<Announcements />} />
        </Route>

        {/* Event Operations */}
        <Route path="/events/:id/operations" element={<OperationsLayout />}>
          <Route index element={<OperationsWorkspace section="overview" />} />
          <Route path="overview" element={<OperationsWorkspace section="overview" />} />
          <Route path="tasks" element={<OperationsWorkspace section="tasks" />} />
          <Route path="incidents" element={<OperationsWorkspace section="incidents" />} />
          <Route path="resources" element={<OperationsWorkspace section="resources" />} />
          <Route path="vendors" element={<OperationsWorkspace section="vendors" />} />
          <Route path="budget" element={<OperationsWorkspace section="budget" />} />
        </Route>

        {/* Role-based Dashboards */}
        <Route path="/staff" element={<ProtectedRoute roles={["STAFF"]}><StaffDashboard /></ProtectedRoute>} />
        <Route path="/staff/events" element={<ProtectedRoute roles={["STAFF"]}><StaffEvents /></ProtectedRoute>} />
        <Route path="/staff/check-in" element={<ProtectedRoute roles={["STAFF"]}><StaffTicketVerification /></ProtectedRoute>} />
        <Route path="/staff/attendance" element={<ProtectedRoute roles={["STAFF"]}><StaffAttendance /></ProtectedRoute>} />

        <Route path="/coordinator" element={<ProtectedRoute roles={["COORDINATOR"]}><CoordinatorDashboard /></ProtectedRoute>} />
        <Route path="/coordinator/events" element={<ProtectedRoute roles={["COORDINATOR"]}><CoordinatorEvents /></ProtectedRoute>} />
        <Route path="/coordinator/team" element={<ProtectedRoute roles={["COORDINATOR"]}><CoordinatorTeam /></ProtectedRoute>} />
        <Route path="/coordinator/tasks" element={<ProtectedRoute roles={["COORDINATOR"]}><CoordinatorTasks /></ProtectedRoute>} />
        <Route path="/coordinator/incidents" element={<ProtectedRoute roles={["COORDINATOR"]}><CoordinatorIncidents /></ProtectedRoute>} />
        <Route path="/coordinator/attendance" element={<ProtectedRoute roles={["COORDINATOR"]}><CoordinatorAttendance /></ProtectedRoute>} />
        <Route path="/coordinator/event-day" element={<ProtectedRoute roles={["COORDINATOR"]}><CoordinatorEventDay /></ProtectedRoute>} />
        <Route path="/coordinator/reports" element={<ProtectedRoute roles={["COORDINATOR"]}><CoordinatorReports /></ProtectedRoute>} />
        <Route path="/coordinator/staff" element={<Navigate to="/coordinator/team" replace />} />
        <Route path="/coordinator/volunteers" element={<Navigate to="/coordinator/team" replace />} />

        <Route path="/volunteer" element={<ProtectedRoute roles={["VOLUNTEER"]}><VolunteerDashboard /></ProtectedRoute>} />
        <Route path="/volunteer/events" element={<ProtectedRoute roles={["VOLUNTEER"]}><VolunteerEvents /></ProtectedRoute>} />
        <Route path="/volunteer/tasks" element={<ProtectedRoute roles={["VOLUNTEER"]}><VolunteerTasks /></ProtectedRoute>} />

        <Route path="/speaker" element={<SpeakerDashboard />} />
        <Route path="/speaker/sessions" element={<SpeakerSessions />} />
        <Route path="/speaker/schedule" element={<SpeakerSchedule />} />  

        <Route path="/chief-guest" element={<ChiefGuestDashboard />} />
        <Route path="/chief-guest/schedule" element={<ChiefGuestSchedule />} />
        <Route
    path="/chief-guest/details"
    element={<ChiefGuestDetails />}
/>
        <Route path="/judge" element={<ProtectedRoute roles={["JUDGE"]}><JudgeDashboard /></ProtectedRoute>} />
        <Route path="/judge/competitions" element={<ProtectedRoute roles={["JUDGE"]}><JudgeCompetitions /></ProtectedRoute>} />
        <Route path="/judge/work" element={<ProtectedRoute roles={["JUDGE"]}><JudgeWork /></ProtectedRoute>} />
        <Route path="/mentor" element={<ProtectedRoute roles={["TRAINER"]}><MentorDashboard /></ProtectedRoute>} />
        <Route path="/mentor/teams" element={<ProtectedRoute roles={["TRAINER"]}><MentorTeams /></ProtectedRoute>} />
        <Route path="/mentor/schedule" element={<ProtectedRoute roles={["TRAINER"]}><MentorSchedule /></ProtectedRoute>} />

        {/* Public */}
        <Route path="/find-events" element={<PublicDashboard />} /> 
        <Route path="/find-my-ticket" element={<FindMyTicket />} />
        <Route path="/public/events/:id" element={<PublicEventDetails />} />
        <Route path="/public/events/:id/register" element={<PublicRegistrationForm />} />
        <Route path="/public" element={<PublicWelcome />} />
        <Route path="/public/ticket/:registrationId" element={<PublicTicket />} />
        <Route
  path="/public/events/:id/payment/:registrationId"
  element={<PublicPayment />}
/> 

        <Route
    path="/invitation/accept/:token"
    element={<AcceptInvitation />}
    
/>
<Route path="/super-admin" element={<SuperAdminDashboard />} />
<Route path="/super-admin/portals" element={<SuperAdminDashboard section="portals" />} />
<Route path="/super-admin/portals/deleted" element={<SuperAdminDashboard section="deletedPortals" />} />
<Route path="/super-admin/revenue" element={<SuperAdminDashboard section="revenue" />} />
<Route path="/super-admin/subscriptions" element={<SuperAdminDashboard section="subscriptions" />} />
<Route path="/super-admin/email-delivery" element={<SuperAdminDashboard section="emailDelivery" />} />
<Route path="/super-admin/support" element={<SuperAdminDashboard section="support" />} />
<Route path="/super-admin/users" element={<SuperAdminDashboard section="users" />} />
<Route path="/super-admin/reports" element={<SuperAdminDashboard section="reports" />} />
<Route path="/super-admin/settings" element={<SuperAdminDashboard section="settings" />} />

      </Routes>
    </BrowserRouter>
  );
}

function ProtectedRoute({ roles, children }) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const role = String(localStorage.getItem("activeRole") || localStorage.getItem("role") || "").toUpperCase();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles?.length && !roles.includes(role)) {
    return <Navigate to="/choose-access" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default App;
