package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.dto.EventDashboardResponse;
import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.Registration;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.EventStatus;
import com.fic.event_management_system.enums.NotificationType;
import com.fic.event_management_system.enums.RegistrationStatus;
import com.fic.event_management_system.enums.RegistrationType;
import com.fic.event_management_system.repository.EventRepository;
import com.fic.event_management_system.repository.PortalRepository;
import com.fic.event_management_system.repository.RegistrationRepository;
import com.fic.event_management_system.repository.UserRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.EventService;
import com.fic.event_management_system.service.EmailService;
import com.fic.event_management_system.service.NotificationService;
import com.fic.event_management_system.service.SubscriptionLimitService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;

@Service
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final PortalRepository portalRepository;
    private final UserRepository userRepository;
    private final RegistrationRepository registrationRepository;
    private final TenantSecurityService tenantSecurityService;
    private final SubscriptionLimitService subscriptionLimitService;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public EventServiceImpl(
            EventRepository eventRepository,
            PortalRepository portalRepository,
            UserRepository userRepository,
            RegistrationRepository registrationRepository,
            TenantSecurityService tenantSecurityService,
            SubscriptionLimitService subscriptionLimitService,
            NotificationService notificationService,
            EmailService emailService) {

        this.eventRepository = eventRepository;
        this.portalRepository = portalRepository;
        this.userRepository = userRepository;
        this.registrationRepository = registrationRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.subscriptionLimitService = subscriptionLimitService;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @Override
    public Event createEvent(Event event) {
        tenantSecurityService.requirePortalAdminOrOrganizer();

        normalizeRegistrationPermissions(event);

        subscriptionLimitService.assertCanCreateEvent(
                tenantSecurityService.getLoggedInPortalId()
        );

        User loggedInUser = tenantSecurityService.getLoggedInUser();
        String roleName = loggedInUser.getRole() != null
                ? String.valueOf(loggedInUser.getRole().getRoleName())
                : "";

        event.setPortal(tenantSecurityService.getLoggedInPortal());

        if ("ORGANIZER".equalsIgnoreCase(roleName)) {
            event.setOrganizer(loggedInUser);
        } else {
            event.setOrganizer(null);
        }

        return eventRepository.save(event);
    }

    @Override
    public Event getEventById(Long id) {
        return tenantSecurityService.getEventFromLoggedInPortal(id);
    }

    @Override
    public Event getPublicEventById(Long id) {
        return eventRepository.findPublicEventByIdAndStatus(id, EventStatus.PUBLISHED)
                .orElseThrow(() -> new RuntimeException("Event is not available"));
    }

    @Override
    public List<Event> getAllEvents() {
        return eventRepository.findByPortalId(tenantSecurityService.getLoggedInPortalId());
    }

    @Override
    public Event updateEvent(Long id, Event event) {
        Event existingEvent = getEventById(id);
        subscriptionLimitService.assertPortalIsWritable(
                existingEvent.getPortal().getId()
        );

        boolean importantDetailsChanged =
                !Objects.equals(existingEvent.getStartDateTime(), event.getStartDateTime())
                || !Objects.equals(existingEvent.getEndDateTime(), event.getEndDateTime())
                || !Objects.equals(existingEvent.getVenue(), event.getVenue())
                || !Objects.equals(existingEvent.getMeetingLink(), event.getMeetingLink())
                || !Objects.equals(existingEvent.getEventMode(), event.getEventMode());

        existingEvent.setEventName(event.getEventName());
        existingEvent.setDescription(event.getDescription());
        existingEvent.setEventType(event.getEventType());
        existingEvent.setEventMode(event.getEventMode());
        existingEvent.setStartDateTime(event.getStartDateTime());
        existingEvent.setEndDateTime(event.getEndDateTime());
        existingEvent.setVenue(event.getVenue());
        existingEvent.setMeetingLink(event.getMeetingLink());
        existingEvent.setCapacity(event.getCapacity());
        existingEvent.setAvailableSeats(event.getAvailableSeats());
        existingEvent.setRegistrationDeadline(event.getRegistrationDeadline());
        existingEvent.setPaid(event.getPaid());
        existingEvent.setTicketPrice(event.getTicketPrice());
        existingEvent.setBannerUrl(event.getBannerUrl());
        existingEvent.setCertificateEnabled(event.getCertificateEnabled());
        existingEvent.setCertificateTitle(event.getCertificateTitle());
        normalizeRegistrationPermissions(event);
        existingEvent.setAllowParticipantRegistration(event.getAllowParticipantRegistration());
        existingEvent.setAllowAudienceRegistration(event.getAllowAudienceRegistration());

        Event savedEvent = eventRepository.save(existingEvent);

        if (importantDetailsChanged
                && EventStatus.PUBLISHED.equals(savedEvent.getStatus())) {
            notifyImportantEventUpdate(savedEvent);
        }

        return savedEvent;
    }

    private void normalizeRegistrationPermissions(Event event) {
        boolean participantAllowed = event.getAllowParticipantRegistration() == null
                || Boolean.TRUE.equals(event.getAllowParticipantRegistration());
        boolean audienceAllowed = event.getAllowAudienceRegistration() == null
                || Boolean.TRUE.equals(event.getAllowAudienceRegistration());

        if (!participantAllowed && !audienceAllowed) {
            throw new RuntimeException("Allow at least one registration type");
        }

        event.setAllowParticipantRegistration(participantAllowed);
        event.setAllowAudienceRegistration(audienceAllowed);
    }

    @Override
    public Event publishEvent(Long id) {
        Event event = getEventById(id);
        subscriptionLimitService.assertPortalIsWritable(event.getPortal().getId());
        event.setStatus(EventStatus.PUBLISHED);
        Event savedEvent = eventRepository.save(event);

        notifyEventOwner(
                savedEvent,
                NotificationType.EVENT_PUBLISHED,
                "Event published",
                savedEvent.getEventName() + " is now visible to the public.",
                "EVENT_PUBLISHED_" + savedEvent.getId()
        );

        return savedEvent;
    }

    @Override
    public Event cancelEvent(Long id) {
        Event event = getEventById(id);
        subscriptionLimitService.assertPortalIsWritable(event.getPortal().getId());
        event.setStatus(EventStatus.CANCELLED);
        Event savedEvent = eventRepository.save(event);

        notifyEventOwner(
                savedEvent,
                NotificationType.EVENT_CANCELLED,
                "Event cancelled",
                savedEvent.getEventName() + " has been cancelled.",
                "EVENT_CANCELLED_OWNER_" + savedEvent.getId()
        );
        queueAttendeeEventEmail(
                savedEvent,
                NotificationType.EVENT_CANCELLED,
                "Event cancelled: " + savedEvent.getEventName(),
                "The event " + savedEvent.getEventName()
                        + " has been cancelled by the organizer.",
                "EVENT_CANCELLED"
        );

        return savedEvent;
    }

    @Override
    public Event trashEvent(Long id) {
        Event event = getEventById(id);
        subscriptionLimitService.assertPortalIsWritable(event.getPortal().getId());
        event.setStatus(EventStatus.TRASHED);
        return eventRepository.save(event);
    }

    @Override
    public List<Event> getDraftEvents() {
        return eventRepository.findByPortalIdAndStatus(
                tenantSecurityService.getLoggedInPortalId(),
                EventStatus.DRAFT
        );
    }

    @Override
    public List<Event> getCancelledEvents() {
        return eventRepository.findByPortalIdAndStatus(
                tenantSecurityService.getLoggedInPortalId(),
                EventStatus.CANCELLED
        );
    }

    @Override
    public List<Event> getTrashedEvents() {
        return eventRepository.findByPortalIdAndStatus(
                tenantSecurityService.getLoggedInPortalId(),
                EventStatus.TRASHED
        );
    }

    @Override
    public List<Event> getUpcomingEvents() {
        return eventRepository.findByPortalIdAndStatusAndStartDateTimeAfter(
                tenantSecurityService.getLoggedInPortalId(),
                EventStatus.PUBLISHED,
                LocalDateTime.now()
        );
    }

    @Override
    public List<Event> getRunningEvents() {
        LocalDateTime now = LocalDateTime.now();

        return eventRepository.findByPortalIdAndStatusAndStartDateTimeBeforeAndEndDateTimeAfter(
                tenantSecurityService.getLoggedInPortalId(),
                EventStatus.PUBLISHED,
                now,
                now
        );
    }

    @Override
    public List<Event> getPastEvents() {
        return eventRepository.findByPortalIdAndStatusAndEndDateTimeBefore(
                tenantSecurityService.getLoggedInPortalId(),
                EventStatus.PUBLISHED,
                LocalDateTime.now()
        );
    }

    @Override
    public List<Event> searchEventsByName(String eventName) {
        return eventRepository.findByPortalIdAndEventNameContainingIgnoreCase(
                tenantSecurityService.getLoggedInPortalId(),
                eventName
        );
    }

    @Override
    public List<Event> getEventsByType(String eventType) {
        return eventRepository.findByPortalIdAndEventTypeContainingIgnoreCase(
                tenantSecurityService.getLoggedInPortalId(),
                eventType
        );
    }

    @Override
    public List<Event> getEventsByStatus(String status) {
        return eventRepository.findByPortalIdAndStatus(
                tenantSecurityService.getLoggedInPortalId(),
                EventStatus.valueOf(status.toUpperCase())
        );
    }

    @Override
    public List<Event> getPublicEventsByStatus(String status) {
        EventStatus eventStatus = EventStatus.valueOf(status.toUpperCase());

        if (eventStatus != EventStatus.PUBLISHED) {
            return List.of();
        }

        return eventRepository.findPublicEventsByStatus(EventStatus.PUBLISHED);
    }

    @Override
    public EventDashboardResponse getDashboard(Long eventId) {
        Event event = getEventById(eventId);

        long participants =
                registrationRepository.countByEventIdAndRegistrationType(
                        eventId,
                        RegistrationType.PARTICIPANT
                );

        long audience =
                registrationRepository.countByEventIdAndRegistrationType(
                        eventId,
                        RegistrationType.AUDIENCE
                );

        long total =
                registrationRepository.countByEventId(eventId);

        EventDashboardResponse response = new EventDashboardResponse();

        response.setEventId(event.getId());
        response.setEventName(event.getEventName());
        response.setParticipants(participants);
        response.setAudience(audience);
        response.setTotalRegistrations(total);
        response.setAvailableSeats(event.getAvailableSeats());
        response.setCapacity(event.getCapacity());

        return response;
    }

    @Override
    public Event completeEvent(Long id) {
        Event event = getEventById(id);
        subscriptionLimitService.assertPortalIsWritable(event.getPortal().getId());
        event.setStatus(EventStatus.COMPLETED);
        return eventRepository.save(event);
    }

    @Override
    public List<Event> getEventsByPortal(Long portalId) {
        tenantSecurityService.requireSamePortal(portalId);
        return eventRepository.findByPortalId(portalId);
    }

    @Override
    public Event assignOrganizer(Long eventId, Long organizerId) {
        Event event = getEventById(eventId);
        subscriptionLimitService.assertPortalIsWritable(event.getPortal().getId());
        User organizer = tenantSecurityService.getUserFromLoggedInPortal(organizerId);

        String roleName = organizer.getRole() != null
                ? String.valueOf(organizer.getRole().getRoleName())
                : "";

        if (!"ORGANIZER".equalsIgnoreCase(roleName)) {
            throw new RuntimeException("Assigned user must have ORGANIZER role");
        }

        event.setOrganizer(organizer);
        Event savedEvent = eventRepository.save(event);

        notificationService.createNotification(
                organizer,
                savedEvent.getPortal(),
                savedEvent,
                NotificationType.EVENT_ASSIGNED,
                "Event assigned to you",
                "You are now the organizer for " + savedEvent.getEventName() + ".",
                "/events/" + savedEvent.getId(),
                "EVENT_ASSIGNED_" + savedEvent.getId() + "_" + organizer.getId()
        );

        return savedEvent;
    }

    @Override
    public List<Event> getEventsByOrganizer(Long organizerId) {
        tenantSecurityService.requireUserInLoggedInPortal(organizerId);

        return eventRepository.findByPortalIdAndOrganizerId(
                tenantSecurityService.getLoggedInPortalId(),
                organizerId
        );
    }

    private void notifyImportantEventUpdate(Event event) {
        String changeKey = Integer.toHexString(
                Objects.hash(
                        event.getStartDateTime(),
                        event.getEndDateTime(),
                        event.getVenue(),
                        event.getMeetingLink(),
                        event.getEventMode()
                )
        );

        notifyEventOwner(
                event,
                NotificationType.EVENT_UPDATED,
                "Important event details updated",
                "The schedule, location or access details for "
                        + event.getEventName() + " were updated.",
                "EVENT_UPDATED_OWNER_" + event.getId() + "_" + changeKey
        );

        queueAttendeeEventEmail(
                event,
                NotificationType.EVENT_UPDATED,
                "Important update: " + event.getEventName(),
                "Important details for " + event.getEventName()
                        + " have changed.\n\n"
                        + "Starts: " + event.getStartDateTime() + "\n"
                        + "Ends: " + event.getEndDateTime() + "\n"
                        + "Venue: " + (event.getVenue() == null
                                ? "Online"
                                : event.getVenue()) + "\n\n"
                        + "Please review the latest event details.",
                "EVENT_UPDATED_" + changeKey
        );
    }

    private void notifyEventOwner(
            Event event,
            NotificationType type,
            String title,
            String message,
            String deduplicationKey) {

        User recipient = event.getOrganizer() != null
                ? event.getOrganizer()
                : event.getPortal().getAdmin();

        if (recipient == null) {
            return;
        }

        notificationService.createNotification(
                recipient,
                event.getPortal(),
                event,
                type,
                title,
                message,
                "/events/" + event.getId(),
                deduplicationKey
        );
    }

    private void queueAttendeeEventEmail(
            Event event,
            NotificationType type,
            String subject,
            String body,
            String deduplicationPrefix) {

        List<Registration> registrations =
                registrationRepository.findByEventId(event.getId());

        for (Registration registration : registrations) {
            if (!RegistrationStatus.REGISTERED.equals(
                    registration.getStatus())) {
                continue;
            }

            emailService.queueEmail(
                    registration.getParticipant().getEmail(),
                    subject,
                    body,
                    type,
                    null,
                    event.getPortal(),
                    event,
                    deduplicationPrefix + "_" + registration.getId(),
                    LocalDateTime.now()
            );
        }
    }
}
