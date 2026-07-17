package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.EventAssignment;
import com.fic.event_management_system.enums.RoleName;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventAssignmentRepository extends JpaRepository<EventAssignment, Long> {

    boolean existsByUserIdAndEventIdAndRoleNameAndActiveTrue(
            Long userId,
            Long eventId,
            RoleName roleName
    );

    boolean existsByUserIdAndEventIdAndActiveTrue(Long userId, Long eventId);

    List<EventAssignment> findByUserIdAndActiveTrueOrderByCreatedAtDesc(Long userId);

    List<EventAssignment> findByUserIdAndPortalIdAndActiveTrueOrderByCreatedAtDesc(
            Long userId,
            Long portalId
    );

    List<EventAssignment> findByEventIdAndActiveTrueOrderByCreatedAtDesc(Long eventId);
}