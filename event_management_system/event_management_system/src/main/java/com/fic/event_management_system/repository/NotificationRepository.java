package com.fic.event_management_system.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fic.event_management_system.entity.Notification;

import jakarta.transaction.Transactional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(
            Long recipientId,
            Pageable pageable
    );

    Page<Notification> findByRecipientIdAndReadFalseOrderByCreatedAtDesc(
            Long recipientId,
            Pageable pageable
    );

    Optional<Notification> findByIdAndRecipientId(
            Long notificationId,
            Long recipientId
    );

    long countByRecipientIdAndReadFalse(Long recipientId);

    boolean existsByDeduplicationKey(String deduplicationKey);

    @Transactional
    @Modifying
    @Query("""
        update Notification notification
        set notification.read = true,
            notification.readAt = :readAt
        where notification.recipient.id = :recipientId
          and notification.read = false
    """)
    int markAllAsRead(
            @Param("recipientId") Long recipientId,
            @Param("readAt") LocalDateTime readAt
    );

    @Transactional
    long deleteByIdAndRecipientId(
            Long notificationId,
            Long recipientId
    );
}
