package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.StaffAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StaffAssignmentRepository extends JpaRepository<StaffAssignment, Long> {

    List<StaffAssignment> findByEventId(Long eventId);

    List<StaffAssignment> findByStaffId(Long staffId);

    Optional<StaffAssignment> findByEventIdAndStaffId(Long eventId, Long staffId);

    boolean existsByEventIdAndStaffId(Long eventId, Long staffId);
}
