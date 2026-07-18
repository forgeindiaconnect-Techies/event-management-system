package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.PortalRevenueTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PortalRevenueTransactionRepository extends JpaRepository<PortalRevenueTransaction, Long> {
    Optional<PortalRevenueTransaction> findByRegistrationId(Long registrationId);
    List<PortalRevenueTransaction> findByPortalIdOrderByCreatedAtDesc(Long portalId);
    List<PortalRevenueTransaction> findByEventIdOrderByCreatedAtDesc(Long eventId);
}
