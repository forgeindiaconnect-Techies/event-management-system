package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.Exhibitor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExhibitorRepository extends JpaRepository<Exhibitor, Long> {

    List<Exhibitor> findByEventId(Long eventId);

    long countByEventId(Long eventId);

    long countByEventIdAndStatus(Long eventId, String status);
}
