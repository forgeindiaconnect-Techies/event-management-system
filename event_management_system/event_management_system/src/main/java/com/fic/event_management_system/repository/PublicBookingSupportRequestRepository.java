package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.PublicBookingSupportRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PublicBookingSupportRequestRepository extends JpaRepository<PublicBookingSupportRequest, Long> {
    List<PublicBookingSupportRequest> findByBookingTypeOrderByCreatedAtDesc(String bookingType);
    List<PublicBookingSupportRequest> findAllByOrderByCreatedAtDesc();
}
