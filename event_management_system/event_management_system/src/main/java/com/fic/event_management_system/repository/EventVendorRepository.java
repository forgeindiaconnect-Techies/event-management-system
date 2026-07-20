package com.fic.event_management_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fic.event_management_system.entity.EventVendor;
import com.fic.event_management_system.enums.OperationsEnums.VendorStatus;

@Repository
public interface EventVendorRepository
        extends JpaRepository<EventVendor, Long> {

    List<EventVendor> findByEventIdOrderByCreatedAtDesc(Long eventId);

    List<EventVendor> findByEventIdAndStatusOrderByCompanyNameAsc(
            Long eventId,
            VendorStatus status
    );

    long countByEventId(Long eventId);

    long countByEventIdAndStatus(Long eventId, VendorStatus status);
}
