package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.EventSession;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventSessionRepository extends JpaRepository<EventSession, Long> {

    List<EventSession> findByEventIdOrderBySessionDateAscStartTimeAscIdAsc(Long eventId);
}