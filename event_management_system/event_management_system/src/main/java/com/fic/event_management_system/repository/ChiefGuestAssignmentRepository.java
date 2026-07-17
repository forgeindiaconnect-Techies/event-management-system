package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.ChiefGuestAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChiefGuestAssignmentRepository
        extends JpaRepository<ChiefGuestAssignment, Long> {

    List<ChiefGuestAssignment> findByChiefGuestId(Long chiefGuestId);

    List<ChiefGuestAssignment> findByEventId(Long eventId);

    boolean existsByChiefGuestIdAndEventId(Long chiefGuestId, Long eventId);
}
