package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.PayoutAccountAudit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PayoutAccountAuditRepository
        extends JpaRepository<PayoutAccountAudit, Long> {

    List<PayoutAccountAudit>
    findByPortalIdOrderByCreatedAtDesc(Long portalId);
}
