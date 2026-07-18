package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.SupportRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportRequestRepository
        extends JpaRepository<SupportRequest, Long> {

    List<SupportRequest> findByRequesterIdOrderByCreatedAtDesc(
            Long requesterId
    );

    List<SupportRequest> findAllByOrderByCreatedAtDesc();
}