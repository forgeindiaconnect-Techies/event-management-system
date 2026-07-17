package com.fic.event_management_system.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fic.event_management_system.entity.EmailDelivery;
import com.fic.event_management_system.enums.EmailDeliveryStatus;

public interface EmailDeliveryRepository
        extends JpaRepository<EmailDelivery, Long> {

    boolean existsByDeduplicationKey(String deduplicationKey);

    Optional<EmailDelivery> findByDeduplicationKey(
            String deduplicationKey
    );

    Page<EmailDelivery> findAllByOrderByCreatedAtDesc(
            Pageable pageable
    );

    Page<EmailDelivery> findByStatusOrderByCreatedAtDesc(
            EmailDeliveryStatus status,
            Pageable pageable
    );

    Page<EmailDelivery> findByPortalIdOrderByCreatedAtDesc(
            Long portalId,
            Pageable pageable
    );

    Page<EmailDelivery> findByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(
            String recipientEmail,
            Pageable pageable
    );

    List<EmailDelivery>
            findTop50ByStatusInAndScheduledAtLessThanEqualOrderByCreatedAtAsc(
                    Collection<EmailDeliveryStatus> statuses,
                    LocalDateTime scheduledAt
            );

    long countByStatus(EmailDeliveryStatus status);

    @Modifying
    @Query("""
        update EmailDelivery delivery
           set delivery.status = :failedStatus,
               delivery.failureReason = :reason,
               delivery.scheduledAt = :retryAt
         where delivery.status = :processingStatus
           and delivery.lastAttemptAt < :staleBefore
    """)
    int recoverStaleProcessingDeliveries(
            @Param("processingStatus") EmailDeliveryStatus processingStatus,
            @Param("failedStatus") EmailDeliveryStatus failedStatus,
            @Param("staleBefore") LocalDateTime staleBefore,
            @Param("retryAt") LocalDateTime retryAt,
            @Param("reason") String reason
    );
}
