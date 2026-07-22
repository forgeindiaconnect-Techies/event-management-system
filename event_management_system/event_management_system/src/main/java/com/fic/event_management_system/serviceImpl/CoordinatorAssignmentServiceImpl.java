package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.CoordinatorAssignment;
import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.RoleName;
import com.fic.event_management_system.enums.NotificationType;
import com.fic.event_management_system.repository.CoordinatorAssignmentRepository;
import com.fic.event_management_system.repository.EventRepository;
import com.fic.event_management_system.repository.UserRepository;
import com.fic.event_management_system.service.CoordinatorAssignmentService;
import com.fic.event_management_system.service.NotificationService;
import org.springframework.stereotype.Service;
import com.fic.event_management_system.security.TenantSecurityService;
import java.time.LocalDateTime;

import java.util.List;

@Service
public class CoordinatorAssignmentServiceImpl implements CoordinatorAssignmentService {

    private final CoordinatorAssignmentRepository coordinatorAssignmentRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final TenantSecurityService tenantSecurityService;
    private final NotificationService notificationService;

    public CoordinatorAssignmentServiceImpl(
            CoordinatorAssignmentRepository coordinatorAssignmentRepository,
            EventRepository eventRepository,
            UserRepository userRepository,
            TenantSecurityService tenantSecurityService,
            NotificationService notificationService) {

        this.coordinatorAssignmentRepository = coordinatorAssignmentRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.notificationService = notificationService;
    }

    @Override
    public CoordinatorAssignment assignCoordinator(CoordinatorAssignment assignment) {

        tenantSecurityService.requirePortalAdminOrOrganizer();

        Long eventId = assignment.getEvent().getId();
        Long coordinatorId = assignment.getCoordinator().getId();
        Long assignedById = assignment.getAssignedBy().getId();

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        User coordinator = userRepository.findById(coordinatorId)
                .orElseThrow(() -> new RuntimeException("Coordinator user not found"));

        User assignedBy = userRepository.findById(assignedById)
                .orElseThrow(() -> new RuntimeException("Assigned by user not found"));

        tenantSecurityService.requireEventInLoggedInPortal(event);
        tenantSecurityService.requireUserInLoggedInPortal(coordinator);
        tenantSecurityService.requireUserInLoggedInPortal(assignedBy);

        if (coordinator.getRole().getRoleName() != RoleName.COORDINATOR) {
            throw new RuntimeException("Selected user is not a coordinator");
        }

        if (coordinatorAssignmentRepository.existsByCoordinatorIdAndEventId(
                coordinatorId,
                eventId
        )) {
            throw new RuntimeException("Coordinator already assigned to this event");
        }

        assignment.setEvent(event);
        assignment.setCoordinator(coordinator);
        assignment.setAssignedBy(assignedBy);
        assignment.setActive(true);

        CoordinatorAssignment saved = coordinatorAssignmentRepository.save(assignment);
        notificationService.createNotification(
                coordinator, event.getPortal(), event, NotificationType.EVENT_ASSIGNED,
                "Assigned to " + event.getEventName(),
                "You are coordinating " + event.getEventName()
                        + ". Open your workspace to view the team, tasks and incidents.",
                "/coordinator/events",
                "COORDINATOR_ASSIGNMENT_" + saved.getId() + "_USER_" + coordinator.getId()
        );
        notificationService.createNotification(
                assignedBy, event.getPortal(), event, NotificationType.EVENT_ASSIGNED,
                "Coordinator assigned",
                coordinator.getFirstName() + " " + coordinator.getLastName()
                        + " was assigned to " + event.getEventName() + ".",
                "/events/" + event.getId() + "/team",
                "COORDINATOR_ASSIGNMENT_" + saved.getId() + "_ACTOR_" + assignedBy.getId()
        );
        return saved;
    }

    @Override
    public List<CoordinatorAssignment> getCoordinatorsByEvent(Long eventId) {
        User loggedIn = tenantSecurityService.getLoggedInUser();
        if (tenantSecurityService.hasRole("COORDINATOR")) {
            if (!coordinatorAssignmentRepository.existsByCoordinatorIdAndEventIdAndActiveTrue(loggedIn.getId(), eventId)) {
                throw new RuntimeException("Coordinator is not assigned to this event");
            }
        } else {
            tenantSecurityService.requirePortalAdminOrOrganizer();
            tenantSecurityService.requireEventInLoggedInPortal(eventId);
        }
        return coordinatorAssignmentRepository.findByEventId(eventId);
    }

    @Override
    public List<CoordinatorAssignment> getEventsByCoordinator(Long coordinatorId) {
        User loggedIn = tenantSecurityService.getLoggedInUser();
        if (tenantSecurityService.hasRole("COORDINATOR")) {
            if (!loggedIn.getId().equals(coordinatorId)) {
                throw new RuntimeException("Coordinators can only view their own assignments");
            }
        } else {
            tenantSecurityService.requirePortalAdminOrOrganizer();
            tenantSecurityService.requireUserInLoggedInPortal(coordinatorId);
        }
        return coordinatorAssignmentRepository.findByCoordinatorId(coordinatorId);
    }

    @Override
    public void removeCoordinatorAssignment(Long assignmentId) {
        tenantSecurityService.requirePortalAdminOrOrganizer();
        CoordinatorAssignment assignment = coordinatorAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Coordinator assignment not found"));
        tenantSecurityService.requireEventInLoggedInPortal(assignment.getEvent());
        coordinatorAssignmentRepository.delete(assignment);
    }

    @Override
    public CoordinatorAssignment submitCompletionReport(Long eventId, String report) {
        User loggedIn = tenantSecurityService.getLoggedInUser();
        if (!tenantSecurityService.hasRole("COORDINATOR")) {
            throw new RuntimeException("Only coordinators can submit completion reports");
        }
        if (report == null || report.isBlank()) {
            throw new RuntimeException("Completion report is required");
        }
        CoordinatorAssignment assignment = coordinatorAssignmentRepository.findByCoordinatorId(loggedIn.getId())
                .stream()
                .filter(item -> Boolean.TRUE.equals(item.getActive()) && item.getEvent() != null && eventId.equals(item.getEvent().getId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Coordinator is not assigned to this event"));
        assignment.setCompletionReport(report.trim());
        assignment.setReportSubmittedAt(LocalDateTime.now());
        CoordinatorAssignment saved = coordinatorAssignmentRepository.save(assignment);
        Event event = assignment.getEvent();
        User assignedBy = assignment.getAssignedBy();

        notificationService.createNotification(
                assignedBy, event.getPortal(), event, NotificationType.SYSTEM_ALERT,
                "Coordinator report submitted",
                loggedIn.getFirstName() + " " + loggedIn.getLastName()
                        + " submitted the completion report for " + event.getEventName() + ".",
                "/events/" + event.getId() + "/operations",
                "COORDINATOR_REPORT_" + saved.getId() + "_USER_" + assignedBy.getId()
        );
        return saved;
    }
}
