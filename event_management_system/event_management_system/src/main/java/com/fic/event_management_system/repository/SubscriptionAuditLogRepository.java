package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.SubscriptionAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubscriptionAuditLogRepository
        extends JpaRepository<SubscriptionAuditLog, Long> {

    List<SubscriptionAuditLog>
    findByPortalIdOrderByCreatedAtDesc(Long portalId);

    List<SubscriptionAuditLog>
    findByAdminIdOrderByCreatedAtDesc(Long adminId);

    List<SubscriptionAuditLog>
    findBySubscriptionPlanIdOrderByCreatedAtDesc(Long planId);

    List<SubscriptionAuditLog> findByPaymentId(Long paymentId);
}
