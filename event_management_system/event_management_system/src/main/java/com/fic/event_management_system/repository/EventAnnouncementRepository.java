package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.EventAnnouncement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EventAnnouncementRepository extends JpaRepository<EventAnnouncement, Long> {
    List<EventAnnouncement> findByEventIdOrderByCreatedAtDesc(Long eventId);
}
