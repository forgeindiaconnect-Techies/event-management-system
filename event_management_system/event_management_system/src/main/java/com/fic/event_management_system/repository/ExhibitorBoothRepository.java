package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.ExhibitorBooth;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExhibitorBoothRepository extends JpaRepository<ExhibitorBooth, Long> {

    List<ExhibitorBooth> findByEventId(Long eventId);

    long countByEventId(Long eventId);

    long countByEventIdAndStatus(Long eventId, String status);
}
