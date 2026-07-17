package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.dto.AttendanceDashboardResponse;
import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.enums.RegistrationType;
import com.fic.event_management_system.repository.EventRepository;
import com.fic.event_management_system.repository.RegistrationRepository;
import com.fic.event_management_system.service.AttendanceDashboardService;
import org.springframework.stereotype.Service;

@Service
public class AttendanceDashboardServiceImpl implements AttendanceDashboardService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;

    public AttendanceDashboardServiceImpl(
            EventRepository eventRepository,
            RegistrationRepository registrationRepository) {

        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
    }

    @Override
    public AttendanceDashboardResponse getAttendanceDashboard(Long eventId) {

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        AttendanceDashboardResponse response = new AttendanceDashboardResponse();

        response.setEventId(event.getId());
        response.setEventName(event.getEventName());

        response.setTotalRegistrations(
                registrationRepository.countByEventId(eventId)
        );

        response.setCheckedIn(
                registrationRepository.countByEventIdAndAttendedTrue(eventId)
        );

        response.setNotCheckedIn(
                registrationRepository.countByEventIdAndAttendedFalse(eventId)
        );

        response.setParticipantsCheckedIn(
                registrationRepository.countByEventIdAndRegistrationTypeAndAttendedTrue(
                        eventId,
                        RegistrationType.PARTICIPANT
                )
        );

        response.setAudienceCheckedIn(
                registrationRepository.countByEventIdAndRegistrationTypeAndAttendedTrue(
                        eventId,
                        RegistrationType.AUDIENCE
                )
        );

        return response;
    }
}