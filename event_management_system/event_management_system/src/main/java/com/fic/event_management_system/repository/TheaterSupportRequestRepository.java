package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.TheaterSupportRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TheaterSupportRequestRepository extends JpaRepository<TheaterSupportRequest, Long> {
    List<TheaterSupportRequest> findByTheaterPortalIdOrderByCreatedAtDesc(Long theaterPortalId);
    List<TheaterSupportRequest> findAllByOrderByCreatedAtDesc();
}
