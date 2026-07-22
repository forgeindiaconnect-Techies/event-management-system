package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.dto.AcceptRoleInvitationRequest;
import com.fic.event_management_system.dto.InviteRoleRequest;
import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.EventAssignment;
import com.fic.event_management_system.entity.Portal;
import com.fic.event_management_system.entity.Role;
import com.fic.event_management_system.entity.RoleInvitation;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.InvitationStatus;
import com.fic.event_management_system.enums.NotificationType;
import com.fic.event_management_system.enums.RoleName;
import com.fic.event_management_system.repository.EventAssignmentRepository;
import com.fic.event_management_system.repository.EventRepository;
import com.fic.event_management_system.repository.PortalRepository;
import com.fic.event_management_system.repository.RoleInvitationRepository;
import com.fic.event_management_system.repository.RoleRepository;
import com.fic.event_management_system.repository.UserRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.EmailService;
import com.fic.event_management_system.service.NotificationService;
import com.fic.event_management_system.service.RoleInvitationService;
import com.fic.event_management_system.service.SubscriptionLimitService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class RoleInvitationServiceImpl implements RoleInvitationService {

    @Value("${frontend.url}")
    private String frontendUrl;

    private final RoleInvitationRepository invitationRepository;
    private final PortalRepository portalRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmailService emailService;
    private final EventRepository eventRepository;
    private final EventAssignmentRepository eventAssignmentRepository;
    private final TenantSecurityService tenantSecurityService;
    private final SubscriptionLimitService subscriptionLimitService;
    private final NotificationService notificationService;

    public RoleInvitationServiceImpl(
            RoleInvitationRepository invitationRepository,
            PortalRepository portalRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            EmailService emailService,
            EventRepository eventRepository,
            EventAssignmentRepository eventAssignmentRepository,
            TenantSecurityService tenantSecurityService,
            SubscriptionLimitService subscriptionLimitService,
            NotificationService notificationService) {

        this.invitationRepository = invitationRepository;
        this.portalRepository = portalRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.emailService = emailService;
        this.eventRepository = eventRepository;
        this.eventAssignmentRepository = eventAssignmentRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.subscriptionLimitService = subscriptionLimitService;
        this.notificationService = notificationService;
    }

    @Override
    public RoleInvitation inviteRoleUser(InviteRoleRequest request) {
        tenantSecurityService.requirePortalAdminOrOrganizer();

        if (
                request.getRoleName() == RoleName.PORTAL_ADMIN ||
                request.getRoleName() == RoleName.ORGANIZER ||
                request.getRoleName() == RoleName.PARTICIPANT
        ) {
            throw new RuntimeException("This role cannot be invited from organizer panel");
        }

        String email = request.getEmail() == null
                ? ""
                : request.getEmail().trim().toLowerCase();

        if (email.isBlank()) {
            throw new RuntimeException("Email is required");
        }

        Portal portal;
        Event resolvedEvent;

        if (request.getEventId() != null) {
            resolvedEvent = tenantSecurityService.getEventFromLoggedInPortal(request.getEventId());
            portal = resolvedEvent.getPortal();
        } else {
            resolvedEvent = null;
            if (!isMainPortalRole(request.getRoleName())) {
                throw new RuntimeException("Event is required for this role invitation");
            }

            portal = portalRepository.findById(request.getPortalId())
                    .orElseThrow(() -> new RuntimeException("Portal not found"));

            tenantSecurityService.requireSamePortal(portal.getId());
        }

        // Used by notification lambdas below, so keep this reference effectively final.
        final Event event = resolvedEvent;

        User invitedBy = tenantSecurityService.getUserFromLoggedInPortal(request.getInvitedById());

        subscriptionLimitService.assertPortalIsWritable(portal.getId());

        if (request.getRoleName() == RoleName.Staff) {
            subscriptionLimitService.assertCanInviteStaff(portal.getId());
        }

        if (request.getRoleName() == RoleName.SPEAKER && event != null) {
            subscriptionLimitService.assertCanInviteSpeaker(event.getId());
        }

        boolean alreadyInvited;

        if (event != null) {
            alreadyInvited = invitationRepository.existsByEmailAndEventIdAndRoleNameAndStatusIn(
                    email,
                    event.getId(),
                    request.getRoleName(),
                    List.of(InvitationStatus.PENDING, InvitationStatus.ACCEPTED)
            );
        } else {
            alreadyInvited = invitationRepository.existsByEmailAndPortalIdAndRoleNameAndStatusIn(
                    email,
                    portal.getId(),
                    request.getRoleName(),
                    List.of(InvitationStatus.PENDING)
            );
        }

        if (alreadyInvited) {
            throw new RuntimeException("This user is already invited for this role");
        }

        RoleInvitation invitation = new RoleInvitation();
        invitation.setEmail(email);
        invitation.setPortal(portal);
        invitation.setInvitedBy(invitedBy);
        invitation.setRoleName(request.getRoleName());
        invitation.setToken(UUID.randomUUID().toString());
        invitation.setStatus(InvitationStatus.PENDING);
        invitation.setExpiryDate(LocalDateTime.now().plusDays(7));
        invitation.setEventId(event != null ? event.getId() : null);
        invitation.setEventName(request.getEventName());
        invitation.setEventDescription(request.getEventDescription());
        invitation.setEventVenue(request.getEventVenue());
        invitation.setEventStartDateTime(request.getEventStartDateTime());
        invitation.setSessionTitle(request.getSessionTitle());
        invitation.setSessionDescription(request.getSessionDescription());
        invitation.setSessionDate(request.getSessionDate());
        invitation.setSessionTime(request.getSessionTime());

        RoleInvitation saved = invitationRepository.save(invitation);

        String link = frontendUrl + "/role-invitation/accept/" + saved.getToken();
        String emailBody = buildInvitationEmail(request, portal, link);

        emailService.queueEmail(
                email,
                "You are invited to join " + portal.getPortalName(),
                emailBody,
                NotificationType.USER_INVITED,
                userRepository.findByEmail(email).orElse(null),
                portal,
                event,
                "ROLE_INVITATION_" + saved.getId(),
                LocalDateTime.now()
        );

        notificationService.createNotification(
                invitedBy,
                portal,
                event,
                NotificationType.USER_INVITED,
                "Invitation sent",
                "Invitation sent to " + email + " as " + displayRole(request.getRoleName())
                        + (event == null ? "." : " for " + event.getEventName() + "."),
                actorTeamUrl(invitedBy),
                "ROLE_INVITATION_SENT_" + saved.getId() + "_ACTOR_" + invitedBy.getId()
        );

        userRepository.findByEmail(email).ifPresent(existingUser ->
                notificationService.createNotification(
                        existingUser,
                        portal,
                        event,
                        NotificationType.USER_INVITED,
                        "New role invitation",
                        "You were invited as " + displayRole(request.getRoleName())
                                + (event == null ? " in " + portal.getPortalName() + "."
                                : " for " + event.getEventName() + "."),
                        "/role-invitation/accept/" + saved.getToken(),
                        "ROLE_INVITATION_RECEIVED_" + saved.getId() + "_USER_" + existingUser.getId()
                ));

        return saved;
    }

    private String buildInvitationEmail(InviteRoleRequest request, Portal portal, String link) {
        StringBuilder body = new StringBuilder();

        body.append("Hello");
        if (request.getSpeakerName() != null && !request.getSpeakerName().isBlank()) {
            body.append(" ").append(request.getSpeakerName());
        }
        body.append(",\n\n");

        body.append("You have been invited as ")
                .append(request.getRoleName())
                .append(" in ")
                .append(portal.getPortalName())
                .append(".\n\n");

        if (request.getEventName() != null && !request.getEventName().isBlank()) {
            body.append("Event Details\n");
            body.append("Event: ").append(request.getEventName()).append("\n");

            if (request.getEventDescription() != null && !request.getEventDescription().isBlank()) {
                body.append("Description: ").append(request.getEventDescription()).append("\n");
            }

            if (request.getEventVenue() != null && !request.getEventVenue().isBlank()) {
                body.append("Venue / Link: ").append(request.getEventVenue()).append("\n");
            }

            if (request.getEventStartDateTime() != null && !request.getEventStartDateTime().isBlank()) {
                body.append("Event Date: ").append(request.getEventStartDateTime()).append("\n");
            }

            body.append("\n");
        }

        if (request.getSessionTitle() != null && !request.getSessionTitle().isBlank()) {
            body.append("Session Information\n");
            body.append("Session: ").append(request.getSessionTitle()).append("\n");

            if (request.getSessionDescription() != null && !request.getSessionDescription().isBlank()) {
                body.append("Role / Description: ").append(request.getSessionDescription()).append("\n");
            }

            if (request.getSessionDate() != null && !request.getSessionDate().isBlank()) {
                body.append("Session Date: ").append(request.getSessionDate()).append("\n");
            }

            if (request.getSessionTime() != null && !request.getSessionTime().isBlank()) {
                body.append("Session Time: ").append(request.getSessionTime()).append("\n");
            }

            if (request.getSpeakerTitle() != null && !request.getSpeakerTitle().isBlank()) {
                body.append("Speaker Title: ").append(request.getSpeakerTitle()).append("\n");
            }

            if (request.getSpeakerOrganization() != null && !request.getSpeakerOrganization().isBlank()) {
                body.append("Organization: ").append(request.getSpeakerOrganization()).append("\n");
            }

            body.append("\n");
        }

        body.append("Accept your invitation here:\n")
                .append(link)
                .append("\n\n")
                .append("This invitation expires in 7 days.");

        return body.toString();
    }

    @Override
    public User addRoleUserManually(InviteRoleRequest request) {
        tenantSecurityService.requirePortalAdminOrOrganizer();
        if (request.getRoleName() == null || request.getRoleName() == RoleName.PORTAL_ADMIN
                || request.getRoleName() == RoleName.ORGANIZER || request.getRoleName() == RoleName.PARTICIPANT) {
            throw new RuntimeException("Select a valid staff or event role");
        }
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase();
        if (email.isBlank()) throw new RuntimeException("Email is required for login");
        if (userRepository.findByEmail(email).isPresent()) throw new RuntimeException("A user already exists with this email");
        if (request.getFirstName() == null || request.getFirstName().isBlank()
                || request.getLastName() == null || request.getLastName().isBlank()) {
            throw new RuntimeException("First name and last name are required");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new RuntimeException("Password must contain at least 6 characters");
        }

        Event event = request.getEventId() == null ? null
                : tenantSecurityService.getEventFromLoggedInPortal(request.getEventId());
        Portal portal = event != null ? event.getPortal() : portalRepository.findById(request.getPortalId())
                .orElseThrow(() -> new RuntimeException("Portal not found"));
        tenantSecurityService.requireSamePortal(portal.getId());
        if (event == null && !isMainPortalRole(request.getRoleName())) {
            throw new RuntimeException("Event is required for this role");
        }

        subscriptionLimitService.assertPortalIsWritable(portal.getId());
        if (request.getRoleName() == RoleName.Staff) subscriptionLimitService.assertCanInviteStaff(portal.getId());
        if (request.getRoleName() == RoleName.SPEAKER && event != null) subscriptionLimitService.assertCanInviteSpeaker(event.getId());

        Role role = roleRepository.findByRoleName(request.getRoleName())
                .orElseThrow(() -> new RuntimeException("Role not found"));
        User user = new User();
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setEmail(email);
        user.setPhoneNumber(request.getPhoneNumber());
        user.setPassword(request.getPassword());
        user.setRole(role);
        // Every manually created account belongs to the portal that created it.
        // Event-specific access is still controlled by EventAssignment.
        user.setPortal(portal);
        user.setActive(true);
        user = userRepository.save(user);

        User createdBy = tenantSecurityService.getLoggedInUser();
        notificationService.createNotification(
                user,
                portal,
                event,
                NotificationType.USER_INVITED,
                "Your account is ready",
                "You were added to " + portal.getPortalName() + " as "
                        + displayRole(request.getRoleName()) + ". Sign in using your temporary password.",
                roleHomeUrl(request.getRoleName()),
                "MANUAL_USER_CREATED_" + user.getId()
        );

        notificationService.createNotification(
                createdBy,
                portal,
                event,
                NotificationType.USER_INVITED,
                "Team member added",
                user.getFirstName() + " " + user.getLastName() + " was added as "
                        + displayRole(request.getRoleName())
                        + (event == null ? "." : " for " + event.getEventName() + "."),
                actorTeamUrl(createdBy),
                "MANUAL_USER_CREATED_" + user.getId() + "_ACTOR_" + createdBy.getId()
        );

        if (event != null) {
            RoleInvitation assignmentSource = new RoleInvitation();
            assignmentSource.setEmail(email);
            assignmentSource.setPortal(portal);
            assignmentSource.setRoleName(request.getRoleName());
            assignmentSource.setEventId(event.getId());
            assignmentSource.setSessionTitle(request.getSessionTitle());
            assignmentSource.setSessionDescription(request.getSessionDescription());
            assignmentSource.setSessionDate(request.getSessionDate());
            assignmentSource.setSessionTime(request.getSessionTime());
            createEventAssignment(assignmentSource, user);
        }
        return user;
    }

    @Override
    public User acceptInvitation(String token, AcceptRoleInvitationRequest request) {
        RoleInvitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid invitation token"));

        if (invitation.getStatus() == InvitationStatus.REJECTED) {
            throw new RuntimeException("Invitation rejected");
        }

        if (invitation.getStatus() == InvitationStatus.EXPIRED) {
            throw new RuntimeException("Invitation expired");
        }

        if (invitation.getExpiryDate().isBefore(LocalDateTime.now())) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new RuntimeException("Invitation expired");
        }

        Role role = roleRepository.findByRoleName(invitation.getRoleName())
                .orElseThrow(() -> new RuntimeException("Role not found"));

        User user = userRepository.findByEmail(invitation.getEmail())
                .orElseGet(() -> createInvitedUser(invitation, request, role));

        user = applyMainPortalRoleIfAllowed(user, invitation, role);

        if (invitation.getEventId() != null) {
            createEventAssignment(invitation, user);
        } else {
            notificationService.createNotification(
                    user,
                    invitation.getPortal(),
                    null,
                    NotificationType.USER_INVITED,
                    "Role access activated",
                    "Your " + displayRole(invitation.getRoleName()) + " access to "
                            + invitation.getPortal().getPortalName() + " is ready.",
                    roleHomeUrl(invitation.getRoleName()),
                    "ROLE_ACCESS_ACTIVATED_" + invitation.getId() + "_USER_" + user.getId()
            );
        }

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitationRepository.save(invitation);

        notificationService.createNotification(
                invitation.getInvitedBy(),
                invitation.getPortal(),
                findInvitationEvent(invitation),
                NotificationType.INVITATION_ACCEPTED,
                "Invitation accepted",
                invitation.getEmail() + " accepted the "
                        + invitation.getRoleName() + " invitation.",
                actorTeamUrl(invitation.getInvitedBy()),
                "INVITATION_ACCEPTED_" + invitation.getId()
        );

        return user;
    }

    private User createInvitedUser(
            RoleInvitation invitation,
            AcceptRoleInvitationRequest request,
            Role role) {

        User newUser = new User();
        newUser.setFirstName(request.getFirstName());
        newUser.setLastName(request.getLastName());
        newUser.setEmail(invitation.getEmail());
        newUser.setPassword(request.getPassword());
        newUser.setPhoneNumber(request.getPhoneNumber());
        newUser.setRole(role);
        newUser.setActive(true);

        // Keep the tenant relationship for every invited role. The assignment
        // determines which event the member can access, not portal_id being null.
        newUser.setPortal(invitation.getPortal());

        return userRepository.save(newUser);
    }

    private User applyMainPortalRoleIfAllowed(
            User user,
            RoleInvitation invitation,
            Role role) {

        boolean changed = false;

        if (user.getRole() == null) {
            user.setRole(role);
            changed = true;
        }

        if (user.getPortal() == null && invitation.getPortal() != null) {
            user.setPortal(invitation.getPortal());
            changed = true;
        }

        if (changed) {
            return userRepository.save(user);
        }

        return user;
    }

    private void createEventAssignment(RoleInvitation invitation, User user) {
        Event event = eventRepository.findById(invitation.getEventId())
                .orElseThrow(() -> new RuntimeException("Event not found"));

        boolean alreadyAssigned = eventAssignmentRepository
                .existsByUserIdAndEventIdAndRoleNameAndActiveTrue(
                        user.getId(),
                        event.getId(),
                        invitation.getRoleName()
                );

        if (alreadyAssigned) {
            return;
        }

        EventAssignment assignment = new EventAssignment();
        assignment.setUser(user);
        assignment.setEvent(event);
        assignment.setPortal(event.getPortal());
        assignment.setRoleName(invitation.getRoleName());
        assignment.setActive(true);
        assignment.setSource("INVITATION");
        assignment.setSessionTitle(invitation.getSessionTitle());
        assignment.setSessionDescription(invitation.getSessionDescription());
        assignment.setSessionDate(invitation.getSessionDate());
        assignment.setSessionTime(invitation.getSessionTime());

        EventAssignment savedAssignment = eventAssignmentRepository.save(assignment);

        notificationService.createNotification(
                user,
                event.getPortal(),
                event,
                NotificationType.EVENT_ASSIGNED,
                "Assigned to " + event.getEventName(),
                "You were assigned as " + displayRole(invitation.getRoleName())
                        + " for " + event.getEventName() + ".",
                roleHomeUrl(invitation.getRoleName()),
                "EVENT_ROLE_ASSIGNMENT_" + savedAssignment.getId() + "_USER_" + user.getId()
        );
    }

    private String actorTeamUrl(User actor) {
        if (actor != null && actor.getRole() != null
                && actor.getRole().getRoleName() == RoleName.ORGANIZER) {
            return "/organizer/invite-staff";
        }
        return "/admin/teams";
    }

    private String roleHomeUrl(RoleName roleName) {
        if (roleName == null) return "/access";
        return switch (roleName) {
            case PORTAL_ADMIN -> "/admin";
            case ORGANIZER -> "/organizer";
            case Staff -> "/staff";
            case VOLUNTEER -> "/volunteer";
            case COORDINATOR -> "/coordinator";
            case SPEAKER -> "/speaker";
            case JUDGE -> "/judge";
            case TRAINER -> "/mentor";
            case CHIEF_GUEST -> "/chief-guest";
            default -> "/access";
        };
    }

    private String displayRole(RoleName roleName) {
        if (roleName == null) return "team member";
        return roleName.name().replace('_', ' ');
    }

    private boolean isMainPortalRole(RoleName roleName) {
        return roleName == RoleName.PORTAL_ADMIN
                || roleName == RoleName.ORGANIZER
                || roleName == RoleName.Staff
                || roleName == RoleName.COORDINATOR
                || roleName == RoleName.VOLUNTEER
                || roleName == RoleName.SPEAKER
                || roleName == RoleName.JUDGE
                || roleName == RoleName.TRAINER
                || roleName == RoleName.CHIEF_GUEST;
    }

    @Override
    public String rejectInvitation(String token) {
        RoleInvitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid invitation token"));

        if (invitation.getStatus() == InvitationStatus.ACCEPTED) {
            throw new RuntimeException("Invitation already accepted");
        }

        if (invitation.getStatus() == InvitationStatus.REJECTED) {
            throw new RuntimeException("Invitation already rejected");
        }

        if (invitation.getStatus() == InvitationStatus.EXPIRED) {
            throw new RuntimeException("Invitation expired");
        }

        if (invitation.getExpiryDate().isBefore(LocalDateTime.now())) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new RuntimeException("Invitation expired");
        }

        invitation.setStatus(InvitationStatus.REJECTED);
        invitationRepository.save(invitation);

        notificationService.createNotification(
                invitation.getInvitedBy(),
                invitation.getPortal(),
                findInvitationEvent(invitation),
                NotificationType.INVITATION_REJECTED,
                "Invitation declined",
                invitation.getEmail() + " declined the "
                        + invitation.getRoleName() + " invitation.",
                actorTeamUrl(invitation.getInvitedBy()),
                "INVITATION_REJECTED_" + invitation.getId()
        );

        return "Invitation rejected successfully";
    }

    private Event findInvitationEvent(RoleInvitation invitation) {
        if (invitation.getEventId() == null) {
            return null;
        }

        return eventRepository.findById(invitation.getEventId())
                .orElse(null);
    }

    @Override
    public RoleInvitation getInvitationByToken(String token) {
        return invitationRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid invitation token"));
    }

    @Override
    public List<RoleInvitation> getAllInvitations() {
        return invitationRepository.findAll();
    }

    @Override
    public List<RoleInvitation> getInvitationsByOrganizer(Long organizerId) {
        tenantSecurityService.requirePortalAdminOrOrganizer();
        tenantSecurityService.getUserFromLoggedInPortal(organizerId);
        return invitationRepository.findByInvitedByIdOrderByIdDesc(organizerId);
    }

    @Override
    public List<RoleInvitation> getInvitationsByEventAndRole(Long eventId, RoleName roleName) {
        tenantSecurityService.requirePortalAdminOrOrganizer();
        tenantSecurityService.getEventFromLoggedInPortal(eventId);
        return invitationRepository.findByEventIdAndRoleNameOrderByIdDesc(eventId, roleName);
    }
}
