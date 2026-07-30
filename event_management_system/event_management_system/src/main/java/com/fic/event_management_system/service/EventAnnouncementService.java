package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.*;
import com.fic.event_management_system.enums.EmailDeliveryStatus;
import com.fic.event_management_system.enums.NotificationType;
import com.fic.event_management_system.repository.*;
import com.fic.event_management_system.security.TenantSecurityService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class EventAnnouncementService {

    private final EventAnnouncementRepository announcementRepository;
    private final RegistrationRepository registrationRepository;
    private final EmailDeliveryRepository deliveryRepository;
    private final TenantSecurityService tenantSecurityService;
    private final EmailService emailService;

    public EventAnnouncementService(
            EventAnnouncementRepository announcementRepository,
            RegistrationRepository registrationRepository,
            EmailDeliveryRepository deliveryRepository,
            TenantSecurityService tenantSecurityService,
            EmailService emailService) {
        this.announcementRepository = announcementRepository;
        this.registrationRepository = registrationRepository;
        this.deliveryRepository = deliveryRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public List<EventAnnouncement> list(Long eventId) {
        tenantSecurityService.getEventFromLoggedInPortal(eventId);
        List<EventAnnouncement> announcements =
                announcementRepository.findByEventIdOrderByCreatedAtDesc(eventId);
        announcements.forEach(this::attachSentCount);
        return announcements;
    }

    public EventAnnouncement create(Long eventId, EventAnnouncement request) {
        Event event = tenantSecurityService.getEventFromLoggedInPortal(eventId);
        validate(request);

        EventAnnouncement announcement = new EventAnnouncement();
        announcement.setEvent(event);
        announcement.setTitle(request.getTitle().trim());
        announcement.setMessage(request.getMessage().trim());
        announcement.setAudience(normalizeAudience(request.getAudience()));
        announcement.setStatus(normalizeStatus(request.getStatus()));
        announcement.setScheduledAt(request.getScheduledAt());

        if ("SCHEDULED".equals(announcement.getStatus())) {
            if (announcement.getScheduledAt() == null
                    || !announcement.getScheduledAt().isAfter(LocalDateTime.now())) {
                throw new IllegalArgumentException("Scheduled date and time must be in the future");
            }
        }

        announcement = announcementRepository.save(announcement);
        if (!"DRAFT".equals(announcement.getStatus())) {
            queueForRecipients(announcement);
        }
        attachSentCount(announcement);
        return announcement;
    }

    public EventAnnouncement publish(Long eventId, Long announcementId) {
        tenantSecurityService.getEventFromLoggedInPortal(eventId);
        EventAnnouncement announcement = findForEvent(eventId, announcementId);
        if ("DRAFT".equals(announcement.getStatus())) {
            announcement.setStatus("PUBLISHED");
            announcement.setScheduledAt(LocalDateTime.now());
            queueForRecipients(announcement);
        }
        attachSentCount(announcement);
        return announcement;
    }

    public void delete(Long eventId, Long announcementId) {
        tenantSecurityService.getEventFromLoggedInPortal(eventId);
        EventAnnouncement announcement = findForEvent(eventId, announcementId);
        if (!"DRAFT".equals(announcement.getStatus())) {
            throw new IllegalStateException("Only draft announcements can be deleted after email delivery is configured");
        }
        announcementRepository.delete(announcement);
    }

    private void queueForRecipients(EventAnnouncement announcement) {
        List<Registration> registrations =
                registrationRepository.findByEventId(announcement.getEvent().getId());
        Map<String, PublicParticipant> recipients = new LinkedHashMap<>();

        for (Registration registration : registrations) {
            boolean attended = Boolean.TRUE.equals(registration.getAttended());
            if ("CHECKED_IN_ONLY".equals(announcement.getAudience()) && !attended) continue;
            if ("PENDING_CHECK_IN".equals(announcement.getAudience()) && attended) continue;
            PublicParticipant participant = registration.getParticipant();
            if (participant != null && participant.getEmail() != null
                    && !participant.getEmail().isBlank()) {
                recipients.putIfAbsent(participant.getEmail().trim().toLowerCase(), participant);
            }
        }

        LocalDateTime deliveryTime = "SCHEDULED".equals(announcement.getStatus())
                ? announcement.getScheduledAt()
                : LocalDateTime.now();
        String subject = announcement.getEvent().getEventName() + ": " + announcement.getTitle();
        String body = announcement.getMessage()
                + "\n\nEvent: " + announcement.getEvent().getEventName()
                + "\n\nThis announcement was sent by the event organizer.";

        recipients.forEach((email, participant) -> emailService.queueEmail(
                email,
                subject,
                body,
                NotificationType.EVENT_ANNOUNCEMENT,
                null,
                announcement.getEvent().getPortal(),
                announcement.getEvent(),
                "event-announcement-" + announcement.getId() + "-" + participant.getId(),
                deliveryTime
        ));

        announcement.setRecipientCount(recipients.size());
        if ("PUBLISHED".equals(announcement.getStatus())) {
            announcement.setPublishedAt(LocalDateTime.now());
        }
        announcementRepository.save(announcement);
    }

    private void attachSentCount(EventAnnouncement announcement) {
        announcement.setSentCount(deliveryRepository
                .countByDeduplicationKeyStartingWithAndStatus(
                        "event-announcement-" + announcement.getId() + "-",
                        EmailDeliveryStatus.SENT));
    }

    private EventAnnouncement findForEvent(Long eventId, Long announcementId) {
        EventAnnouncement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new RuntimeException("Announcement not found"));
        if (!announcement.getEvent().getId().equals(eventId)) {
            throw new RuntimeException("Announcement does not belong to this event");
        }
        return announcement;
    }

    private void validate(EventAnnouncement request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("Announcement title is required");
        }
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            throw new IllegalArgumentException("Announcement message is required");
        }
    }

    private String normalizeAudience(String value) {
        String normalized = value == null ? "ALL_ATTENDEES"
                : value.trim().toUpperCase().replace(' ', '_').replace('-', '_');
        if (!Set.of("ALL_ATTENDEES", "CHECKED_IN_ONLY", "PENDING_CHECK_IN").contains(normalized)) {
            throw new IllegalArgumentException("Invalid announcement audience");
        }
        return normalized;
    }

    private String normalizeStatus(String value) {
        String normalized = value == null ? "DRAFT" : value.trim().toUpperCase();
        if (!Set.of("DRAFT", "SCHEDULED", "PUBLISHED").contains(normalized)) {
            throw new IllegalArgumentException("Invalid announcement status");
        }
        return normalized;
    }
}
