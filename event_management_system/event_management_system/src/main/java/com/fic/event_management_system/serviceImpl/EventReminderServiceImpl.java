package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.Registration;
import com.fic.event_management_system.enums.EventStatus;
import com.fic.event_management_system.enums.NotificationType;
import com.fic.event_management_system.enums.RegistrationStatus;
import com.fic.event_management_system.repository.EventRepository;
import com.fic.event_management_system.repository.RegistrationRepository;
import com.fic.event_management_system.service.EmailService;
import com.fic.event_management_system.service.EventReminderService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EventReminderServiceImpl implements EventReminderService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final EmailService emailService;

    public EventReminderServiceImpl(
            EventRepository eventRepository,
            RegistrationRepository registrationRepository,
            EmailService emailService) {

        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.emailService = emailService;
    }

    @Override
    @Scheduled(cron = "0 0 * * * *") // runs every hour
    public void sendEventReminders() {

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime next24Hours = now.plusHours(24);

        List<Event> events = eventRepository
                .findByStatusAndStartDateTimeBetween(
                        EventStatus.PUBLISHED,
                        now,
                        next24Hours
                );

        for (Event event : events) {

            List<Registration> registrations =
                    registrationRepository.findByEventId(event.getId());

            for (Registration registration : registrations) {

                if (!RegistrationStatus.REGISTERED.equals(
                        registration.getStatus())) {
                    continue;
                }

                String deduplicationKey =
                        "EVENT_REMINDER_24H_"
                        + registration.getId()
                        + "_"
                        + event.getStartDateTime();

                emailService.queueEmail(
                        registration.getParticipant().getEmail(),
                        "Reminder: " + event.getEventName(),
                        "Hello " + registration.getParticipant().getFirstName() + ",\n\n" +
                                "This is a reminder that your event starts soon.\n\n" +
                                "Event: " + event.getEventName() + "\n" +
                                "Date & Time: " + event.getStartDateTime() + "\n" +
                                "Venue: " + event.getVenue() + "\n\n" +
                                "Thank you.",
                        NotificationType.EVENT_REMINDER,
                        null,
                        event.getPortal(),
                        event,
                        deduplicationKey,
                        LocalDateTime.now()
                );
            }
        }
    }
}
