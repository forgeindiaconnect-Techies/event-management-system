package com.fic.event_management_system.controller;

import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.EventAssignment;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.RoleName;
import com.fic.event_management_system.repository.EventAssignmentRepository;
import com.fic.event_management_system.repository.UserRepository;
import com.fic.event_management_system.repository.RoleInvitationRepository;
import com.fic.event_management_system.enums.InvitationStatus;
import com.fic.event_management_system.enums.NotificationType;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.NotificationService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/event-assignments")
@CrossOrigin(origins = "*")
public class EventAssignmentController {

    private final EventAssignmentRepository eventAssignmentRepository;
    private final UserRepository userRepository;
    private final TenantSecurityService tenantSecurityService;
    private final RoleInvitationRepository roleInvitationRepository;
    private final NotificationService notificationService;

    public EventAssignmentController(
            EventAssignmentRepository eventAssignmentRepository,
            UserRepository userRepository,
            TenantSecurityService tenantSecurityService,
            RoleInvitationRepository roleInvitationRepository,
            NotificationService notificationService) {

        this.eventAssignmentRepository = eventAssignmentRepository;
        this.userRepository = userRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.roleInvitationRepository = roleInvitationRepository;
        this.notificationService = notificationService;
    }

    @GetMapping("/user/{userId}")
    public List<EventAssignmentResponse> getAssignmentsByUser(@PathVariable Long userId) {
        User loggedInUser = tenantSecurityService.getLoggedInUser();

        if (loggedInUser.getId().equals(userId)) {
            return eventAssignmentRepository
                    .findByUserIdAndActiveTrueOrderByCreatedAtDesc(userId)
                    .stream()
                    .map(EventAssignmentResponse::from)
                    .toList();
        }

        tenantSecurityService.requirePortalAdminOrOrganizer();

        return eventAssignmentRepository
                .findByUserIdAndPortalIdAndActiveTrueOrderByCreatedAtDesc(
                        userId,
                        tenantSecurityService.getLoggedInPortalId()
                )
                .stream()
                .map(EventAssignmentResponse::from)
                .toList();
    }

    @GetMapping("/event/{eventId}")
    public List<EventAssignmentResponse> getAssignmentsByEvent(@PathVariable Long eventId) {
        tenantSecurityService.requireEventInLoggedInPortal(eventId);

        return eventAssignmentRepository
                .findByEventIdAndActiveTrueOrderByCreatedAtDesc(eventId)
                .stream()
                .map(EventAssignmentResponse::from)
                .toList();
    }

    @PostMapping("/assign")
    public EventAssignment assignUserToEvent(@RequestBody AssignEventRoleRequest request) {
        tenantSecurityService.requirePortalAdminOrOrganizer();

        String email = request.email() == null ? "" : request.email().trim().toLowerCase();

        if (email.isBlank()) {
            throw new RuntimeException("Email is required");
        }

        if (request.eventId() == null) {
            throw new RuntimeException("Event is required");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Never allow an admin/organizer to attach a user from another portal
        // to an event by changing the email or event ID in the request.
        tenantSecurityService.requireUserInLoggedInPortal(user.getId());

        Event event = tenantSecurityService.getEventFromLoggedInPortal(request.eventId());
        RoleName roleName = parseRoleName(request.roleName());

        boolean alreadyAssigned = eventAssignmentRepository
                .existsByUserIdAndEventIdAndRoleNameAndActiveTrue(
                        user.getId(),
                        event.getId(),
                        roleName
                );

        if (alreadyAssigned) {
            throw new RuntimeException("User already assigned to this event with this role");
        }

        EventAssignment assignment = new EventAssignment();
        assignment.setUser(user);
        assignment.setEvent(event);
        assignment.setPortal(event.getPortal());
        assignment.setRoleName(roleName);
        assignment.setActive(true);
        assignment.setSource("MANUAL_ASSIGNMENT");

        EventAssignment savedAssignment = eventAssignmentRepository.save(assignment);

        notificationService.createNotification(
                user,
                event.getPortal(),
                event,
                NotificationType.EVENT_ASSIGNED,
                "Assigned to " + event.getEventName(),
                "You were assigned as " + roleName.name().replace('_', ' ')
                        + " for " + event.getEventName() + ".",
                roleHomeUrl(roleName),
                "EVENT_ROLE_ASSIGNMENT_" + savedAssignment.getId() + "_USER_" + user.getId()
        );

        User assignedBy = tenantSecurityService.getLoggedInUser();
        notificationService.createNotification(
                assignedBy,
                event.getPortal(),
                event,
                NotificationType.EVENT_ASSIGNED,
                "Team member assigned",
                buildUserName(user) + " was assigned as "
                        + roleName.name().replace('_', ' ') + " for " + event.getEventName() + ".",
                tenantSecurityService.hasRole("ORGANIZER")
                        ? "/organizer/team-assignment"
                        : "/events/" + event.getId() + "/team",
                "EVENT_ROLE_ASSIGNMENT_" + savedAssignment.getId() + "_ACTOR_" + assignedBy.getId()
        );

        roleInvitationRepository
                .findFirstByEmailAndPortalIdAndRoleNameAndStatusOrderByIdDesc(
                        email,
                        event.getPortal().getId(),
                        roleName,
                        InvitationStatus.ACCEPTED
                )
                .ifPresent(invitation -> {
                    invitation.setEventId(event.getId());
                    invitation.setEventName(event.getEventName());
                    invitation.setEventDescription(event.getDescription());
                    invitation.setEventVenue(event.getVenue());
                    invitation.setEventStartDateTime(
                            event.getStartDateTime() == null ? null : event.getStartDateTime().toString()
                    );
                    roleInvitationRepository.save(invitation);
                });

        return savedAssignment;
    }

    private String roleHomeUrl(RoleName roleName) {
        return switch (roleName) {
            case Staff -> "/staff";
            case VOLUNTEER -> "/volunteer";
            case COORDINATOR -> "/coordinator";
            case SPEAKER -> "/speaker";
            case JUDGE -> "/judge";
            case TRAINER -> "/mentor";
            case CHIEF_GUEST -> "/chief-guest";
            case ORGANIZER -> "/organizer";
            case PORTAL_ADMIN -> "/admin";
            default -> "/access";
        };
    }

    private static String buildUserName(User user) {
        String firstName = user.getFirstName() == null ? "" : user.getFirstName().trim();
        String lastName = user.getLastName() == null ? "" : user.getLastName().trim();

        String fullName = (firstName + " " + lastName).trim();

        if (!fullName.isBlank()) {
            return fullName;
        }

        return user.getEmail();
    }

    public record EventAssignmentResponse(
            Long id,
            Long userId,
            String userName,
            String email,
            Long eventId,
            String eventName,
            String eventVenue,
            String eventStartDateTime,
            String eventEndDateTime,
            String eventStatus,
            String eventType,
            String bannerUrl,
            Long portalId,
            String portalName,
            String roleName,
            String sessionTitle,
            String sessionDescription,
            String sessionDate,
            String sessionTime,
            Boolean active
    ) {
        public static EventAssignmentResponse from(EventAssignment assignment) {
            return new EventAssignmentResponse(
                    assignment.getId(),
                    assignment.getUser().getId(),
                    buildUserName(assignment.getUser()),
                    assignment.getUser().getEmail(),
                    assignment.getEvent().getId(),
                    assignment.getEvent().getEventName(),
                    assignment.getEvent().getVenue(),
                    assignment.getEvent().getStartDateTime() == null ? null : assignment.getEvent().getStartDateTime().toString(),
                    assignment.getEvent().getEndDateTime() == null ? null : assignment.getEvent().getEndDateTime().toString(),
                    assignment.getEvent().getStatus() == null ? null : assignment.getEvent().getStatus().name(),
                    assignment.getEvent().getEventType(),
                    assignment.getEvent().getBannerUrl(),
                    assignment.getPortal().getId(),
                    assignment.getPortal().getPortalName(),
                    assignment.getRoleName().name(),
                    assignment.getSessionTitle(),
                    assignment.getSessionDescription(),
                    assignment.getSessionDate(),
                    assignment.getSessionTime(),
                    assignment.getActive()
            );
        }
    }

    public record AssignEventRoleRequest(
            String email,
            Long eventId,
            String roleName
    ) {}

    private RoleName parseRoleName(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            throw new RuntimeException("Role is required");
        }

        if ("Staff".equals(roleName) || "STAFF".equalsIgnoreCase(roleName)) {
            return RoleName.Staff;
        }

        return RoleName.valueOf(roleName.toUpperCase());
    }
}
