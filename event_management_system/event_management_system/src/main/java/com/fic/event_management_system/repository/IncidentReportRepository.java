package com.fic.event_management_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fic.event_management_system.entity.IncidentReport;
import com.fic.event_management_system.enums.OperationsEnums.IncidentStatus;

@Repository
public interface IncidentReportRepository
        extends JpaRepository<IncidentReport, Long> {

    List<IncidentReport> findByEventIdOrderByReportedAtDesc(Long eventId);

    List<IncidentReport> findByEventIdAndStatusOrderByReportedAtDesc(
            Long eventId,
            IncidentStatus status
    );

    long countByEventId(Long eventId);

    long countByEventIdAndStatus(Long eventId, IncidentStatus status);
}
