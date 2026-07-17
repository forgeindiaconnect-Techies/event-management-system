package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.SubscriptionPayment;
import com.fic.event_management_system.enums.SubscriptionPaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionPaymentRepository
        extends JpaRepository<SubscriptionPayment, Long> {

    Optional<SubscriptionPayment>
    findByPaymentReference(String paymentReference);

    Optional<SubscriptionPayment>
    findByGatewayPaymentId(String gatewayPaymentId);

    Optional<SubscriptionPayment>
    findByGatewayOrderId(String gatewayOrderId);

    boolean existsByPaymentReferenceAndStatus(
            String paymentReference,
            SubscriptionPaymentStatus status
    );

    boolean existsByPortalIdAndStatus(
            Long portalId,
            SubscriptionPaymentStatus status
    );

    List<SubscriptionPayment>
    findByPortalIdOrderByCreatedAtDesc(Long portalId);

    List<SubscriptionPayment>
    findAllByOrderByCreatedAtDesc();

    List<SubscriptionPayment>
    findByStatusOrderByCreatedAtDesc(SubscriptionPaymentStatus status);

    List<SubscriptionPayment>
    findByPortalIdAndStatusOrderByCreatedAtDesc(
            Long portalId,
            SubscriptionPaymentStatus status
    );
}
