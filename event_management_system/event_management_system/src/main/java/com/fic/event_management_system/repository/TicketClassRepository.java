package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.TicketClass;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketClassRepository extends JpaRepository<TicketClass, Long> {
    List<TicketClass> findByEventIdOrderByIdAsc(Long eventId);
}
