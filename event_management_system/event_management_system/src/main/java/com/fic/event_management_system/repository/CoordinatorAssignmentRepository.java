package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.CoordinatorAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CoordinatorAssignmentRepository
        extends JpaRepository<CoordinatorAssignment, Long> {

    List<CoordinatorAssignment> findByCoordinatorId(Long coordinatorId);

    List<CoordinatorAssignment> findByEventId(Long eventId);

    boolean existsByCoordinatorIdAndEventId(Long coordinatorId, Long eventId);
}