package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.ExhibitorLead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExhibitorLeadRepository extends JpaRepository<ExhibitorLead, Long> {

    List<ExhibitorLead> findByEventId(Long eventId);

    List<ExhibitorLead> findByExhibitorId(Long exhibitorId);

    long countByEventId(Long eventId);

    long countByEventIdAndStatus(Long eventId, String status);
}
