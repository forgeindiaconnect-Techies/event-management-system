package com.fic.event_management_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fic.event_management_system.entity.EventResource;
import com.fic.event_management_system.enums.OperationsEnums.ResourceStatus;

@Repository
public interface EventResourceRepository
        extends JpaRepository<EventResource, Long> {

    List<EventResource> findByEventIdOrderByCreatedAtDesc(Long eventId);

    List<EventResource> findByEventIdAndStatusOrderByNameAsc(
            Long eventId,
            ResourceStatus status
    );

    long countByEventId(Long eventId);

    long countByEventIdAndStatus(Long eventId, ResourceStatus status);
}
