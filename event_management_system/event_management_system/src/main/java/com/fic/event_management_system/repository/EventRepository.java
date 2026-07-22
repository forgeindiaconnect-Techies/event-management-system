package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.enums.EventStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByStatus(EventStatus status);

    long countByStatusIn(List<EventStatus> statuses);

    @Query("""
            select e from Event e
            join e.portal p
            where e.status = :status
              and p.active = true
              and (p.deleted = false or p.deleted is null)
            """)
    List<Event> findPublicEventsByStatus(@Param("status") EventStatus status);

    @Query("""
            select e from Event e
            join e.portal p
            where e.id = :eventId
              and e.status = :status
              and p.active = true
              and (p.deleted = false or p.deleted is null)
            """)
    Optional<Event> findPublicEventByIdAndStatus(
            @Param("eventId") Long eventId,
            @Param("status") EventStatus status
    );

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
