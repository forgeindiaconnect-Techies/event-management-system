package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.PortalSubscription;
import com.fic.event_management_system.entity.SubscriptionPlan;
import com.fic.event_management_system.enums.EventStatus;
import com.fic.event_management_system.repository.EventRepository;
import com.fic.event_management_system.repository.RegistrationRepository;
import com.fic.event_management_system.repository.TicketClassRepository;
import com.fic.event_management_system.repository.UserRepository;
import com.fic.event_management_system.repository.ExhibitorRepository;
import com.fic.event_management_system.repository.RegistrationFormFieldRepository;
import com.fic.event_management_system.repository.RoleInvitationRepository;
import com.fic.event_management_system.enums.InvitationStatus;
import com.fic.event_management_system.enums.RoleName;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SubscriptionLimitService {

    private final SubscriptionService subscriptionService;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final RegistrationRepository registrationRepository;
    private final TicketClassRepository ticketClassRepository;
    private final ExhibitorRepository exhibitorRepository;
    private final RegistrationFormFieldRepository formFieldRepository;
    private final RoleInvitationRepository roleInvitationRepository;

    public SubscriptionLimitService(
            SubscriptionService subscriptionService,
            EventRepository eventRepository,
            UserRepository userRepository,
            RegistrationRepository registrationRepository,
            TicketClassRepository ticketClassRepository,
            ExhibitorRepository exhibitorRepository,
            RegistrationFormFieldRepository formFieldRepository,
            RoleInvitationRepository roleInvitationRepository
    ) {
        this.subscriptionService = subscriptionService;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.registrationRepository = registrationRepository;
        this.ticketClassRepository = ticketClassRepository;
        this.exhibitorRepository = exhibitorRepository;
        this.formFieldRepository = formFieldRepository;
        this.roleInvitationRepository = roleInvitationRepository;
    }

    public SubscriptionPlan requireActivePlan(Long portalId) {
        PortalSubscription subscription = subscriptionService
                .getCurrentSubscription(portalId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Your subscription has expired. Select a plan to continue."
                        )
                );

        if (subscription.getPlan() == null ||
                !Boolean.TRUE.equals(subscription.getPlan().getActive())) {
            throw new RuntimeException(
                    "Your subscription plan is not available"
            );
        }

        return subscription.getPlan();
    }

    public void assertPortalIsWritable(Long portalId) {
        requireActivePlan(portalId);
    }

    public void assertCustomBrandingAllowed(Long portalId) {
        SubscriptionPlan plan = requireActivePlan(portalId);
        if (!Boolean.TRUE.equals(plan.getCustomBranding())) {
            throw new RuntimeException(
                    "Custom branding is not included in your current plan"
            );
        }
    }

    public void assertAdvancedReportsAllowed(Long portalId) {
        SubscriptionPlan plan = requireActivePlan(portalId);
        if (!Boolean.TRUE.equals(plan.getAdvancedReports())) {
            throw new RuntimeException(
                    "Advanced reports are not included in your current plan"
            );
        }
    }

    public void assertWhiteLabelAllowed(Long portalId) {
        SubscriptionPlan plan = requireActivePlan(portalId);
        if (!Boolean.TRUE.equals(plan.getWhiteLabel())) {
            throw new RuntimeException(
                    "White-label branding is not included in your current plan"
            );
        }
    }

    public void assertCanCreateEvent(Long portalId) {
        SubscriptionPlan plan = requireActivePlan(portalId);
        Integer limit = plan.getMaxActiveEvents();

        if (isUnlimited(limit)) {
            return;
        }

        long activeEvents = eventRepository
                .findByPortalId(portalId)
                .stream()
                .filter(event ->
                        event.getStatus() == EventStatus.DRAFT ||
                        event.getStatus() == EventStatus.PUBLISHED
                )
                .count();

        checkLimit(
                activeEvents,
                limit,
                "active events"
        );
    }

    public void assertCanCreateUser(Long portalId) {
        SubscriptionPlan plan = requireActivePlan(portalId);
        Integer limit = plan.getMaxPortalUsers();

        if (isUnlimited(limit)) {
            return;
        }

        long portalUsers = userRepository
                .findByPortalId(portalId)
                .size();

        checkLimit(
                portalUsers,
                limit,
                "portal users"
        );
    }

    public void assertCanRegister(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() ->
                        new RuntimeException("Event not found")
                );

        if (event.getPortal() == null) {
            throw new RuntimeException(
                    "Event is not linked to a portal"
            );
        }

        SubscriptionPlan plan = requireActivePlan(
                event.getPortal().getId()
        );

        Integer limit = plan.getMaxRegistrationsPerEvent();

        if (isUnlimited(limit)) {
            return;
        }

        long registrations =
                registrationRepository.countByEventId(eventId);

        checkLimit(
                registrations,
                limit,
                "registrations for this event"
        );
    }

    public void assertCanCreateTicketClass(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() ->
                        new RuntimeException("Event not found")
                );

        if (event.getPortal() == null) {
            throw new RuntimeException(
                    "Event is not linked to a portal"
            );
        }

        SubscriptionPlan plan = requireActivePlan(
                event.getPortal().getId()
        );

        Integer limit = plan.getMaxTicketClassesPerEvent();

        if (isUnlimited(limit)) {
            return;
        }

        long ticketClasses = ticketClassRepository
                .findByEventIdOrderByIdAsc(eventId)
                .size();

        checkLimit(
                ticketClasses,
                limit,
                "ticket classes for this event"
        );
    }

    public void assertCanAddOrganizer(Long portalId) {
        SubscriptionPlan plan = requireActivePlan(portalId);
        Integer limit = plan.getMaxOrganizers();

        if (isUnlimited(limit)) {
            return;
        }

        long organizers = userRepository
                .findByPortalId(portalId)
                .stream()
                .filter(user ->
                        user.getRole() != null &&
                        user.getRole().getRoleName() != null &&
                        "ORGANIZER".equalsIgnoreCase(
                                String.valueOf(
                                        user.getRole().getRoleName()
                                )
                        )
                )
                .count();

        checkLimit(
                organizers,
                limit,
                "organizers"
        );
    }

    public void assertCanInviteStaff(Long portalId) {
        SubscriptionPlan plan = requireActivePlan(portalId);
        Integer limit = plan.getMaxStaffInvitations();

        if (isUnlimited(limit)) {
            return;
        }

        long invitations = roleInvitationRepository
                .countByPortalIdAndRoleNameAndStatusIn(
                        portalId,
                        RoleName.Staff,
                        List.of(InvitationStatus.PENDING, InvitationStatus.ACCEPTED)
                );

        checkLimit(invitations, limit, "staff invitations");
    }

    public void assertCanInviteSpeaker(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        SubscriptionPlan plan = requireActivePlan(event.getPortal().getId());
        Integer limit = plan.getMaxSpeakersPerEvent();

        if (isUnlimited(limit)) {
            return;
        }

        long invitations = roleInvitationRepository
                .countByEventIdAndRoleNameAndStatusIn(
                        eventId,
                        RoleName.SPEAKER,
                        List.of(InvitationStatus.PENDING, InvitationStatus.ACCEPTED)
                );

        checkLimit(invitations, limit, "speakers for this event");
    }

    public void assertCanCreateExhibitor(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        SubscriptionPlan plan = requireActivePlan(event.getPortal().getId());
        Integer limit = plan.getMaxExhibitorsPerEvent();

        if (isUnlimited(limit)) {
            return;
        }

        checkLimit(
                exhibitorRepository.countByEventId(eventId),
                limit,
                "exhibitors for this event"
        );
    }

    public void assertCanCreateCustomField(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        SubscriptionPlan plan = requireActivePlan(event.getPortal().getId());
        Integer limit = plan.getMaxCustomRegistrationFields();

        if (isUnlimited(limit)) {
            return;
        }

        checkLimit(
                formFieldRepository.findByEventId(eventId).size(),
                limit,
                "custom registration fields for this event"
        );
    }

    private boolean isUnlimited(Integer limit) {
        return limit != null && limit == -1;
    }

    private void checkLimit(
            long currentUsage,
            Integer limit,
            String resourceName
    ) {
        if (limit == null) {
            throw new RuntimeException(
                    "The subscription limit for " +
                    resourceName +
                    " is not configured"
            );
        }

        if (currentUsage >= limit) {
            throw new RuntimeException(
                    "Your plan allows a maximum of " +
                    limit +
                    " " +
                    resourceName +
                    ". Upgrade your subscription to continue."
            );
        }
    }
}
