package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.enums.EventStatus;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByStatus(EventStatus status);

    List<Event> findByStatusAndStartDateTimeAfter(EventStatus status, LocalDateTime now);

    List<Event> findByStatusAndStartDateTimeBeforeAndEndDateTimeAfter(
            EventStatus status,
            LocalDateTime startTime,
            LocalDateTime endTime
    );

    List<Event> findByStatusAndEndDateTimeBefore(EventStatus status, LocalDateTime now);

    List<Event> findByEventNameContainingIgnoreCase(String eventName);

    List<Event> findByEventTypeContainingIgnoreCase(String eventType);

    List<Event> findByStatusAndStartDateTimeBetween(
            EventStatus status,
            LocalDateTime start,
            LocalDateTime end
    );

    List<Event> findByPortalId(Long portalId);

    List<Event> findByOrganizerId(Long organizerId);

    List<Event> findByPortalIdAndOrganizerId(Long portalId, Long organizerId);

    List<Event> findByPortalIdAndStatus(Long portalId, EventStatus status);

    List<Event> findByPortalIdAndStatusAndStartDateTimeAfter(
            Long portalId,
            EventStatus status,
            LocalDateTime now
    );

    List<Event> findByPortalIdAndStatusAndStartDateTimeBeforeAndEndDateTimeAfter(
            Long portalId,
            EventStatus status,
            LocalDateTime startTime,
            LocalDateTime endTime
    );

    List<Event> findByPortalIdAndStatusAndEndDateTimeBefore(
            Long portalId,
            EventStatus status,
            LocalDateTime now
    );

    List<Event> findByPortalIdAndEventNameContainingIgnoreCase(
            Long portalId,
            String eventName
    );

    List<Event> findByPortalIdAndEventTypeContainingIgnoreCase(
            Long portalId,
            String eventType
    );
}