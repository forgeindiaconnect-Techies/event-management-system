package com.fic.event_management_system.controller;

import com.fic.event_management_system.enums.RoleName;
import com.fic.event_management_system.enums.EventStatus;
import com.fic.event_management_system.repository.EventRepository;
import com.fic.event_management_system.repository.RegistrationRepository;
import com.fic.event_management_system.repository.UserRepository;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public-stats")
public class PublicStatsController {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;

    public PublicStatsController(
            EventRepository eventRepository,
            RegistrationRepository registrationRepository,
            UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public Map<String, Object> getPublicStats() {
        return Map.of(
                "events", eventRepository.countByStatusIn(
                        List.of(EventStatus.PUBLISHED, EventStatus.COMPLETED)),
                "registrations", registrationRepository.count(),
                "organizers", userRepository.countByRole_RoleName(RoleName.ORGANIZER),
                "reliability", "Live"
        );
    }
}
