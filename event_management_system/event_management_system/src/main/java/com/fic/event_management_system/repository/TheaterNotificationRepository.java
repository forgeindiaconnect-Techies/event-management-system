package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.TheaterNotification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TheaterNotificationRepository extends JpaRepository<TheaterNotification, Long> {

    @Query("SELECT n FROM TheaterNotification n WHERE n.theaterPortal.id = :portalId " +
           "AND (n.recipient.id = :userId OR n.targetRole = 'ALL' " +
           "     OR LOWER(n.targetRole) = LOWER(:userRole) " +
           "     OR LOWER(n.targetRole) = LOWER(:dutyRole) " +
           "     OR (LOWER(:dutyRole) LIKE '%cashier%' AND LOWER(n.targetRole) = 'cashier') " +
           "     OR (LOWER(:dutyRole) LIKE '%usher%' AND LOWER(n.targetRole) = 'usher') " +
           "     OR (LOWER(:dutyRole) LIKE '%manager%' AND LOWER(n.targetRole) = 'theater_manager')) " +
           "ORDER BY n.createdAt DESC")
    List<TheaterNotification> findNotificationsForUser(
            @Param("portalId") Long portalId,
            @Param("userId") Long userId,
            @Param("userRole") String userRole,
            @Param("dutyRole") String dutyRole,
            Pageable pageable);

    @Query("SELECT COUNT(n) FROM TheaterNotification n WHERE n.theaterPortal.id = :portalId " +
           "AND n.read = false " +
           "AND (n.recipient.id = :userId OR n.targetRole = 'ALL' " +
           "     OR LOWER(n.targetRole) = LOWER(:userRole) " +
           "     OR LOWER(n.targetRole) = LOWER(:dutyRole) " +
           "     OR (LOWER(:dutyRole) LIKE '%cashier%' AND LOWER(n.targetRole) = 'cashier') " +
           "     OR (LOWER(:dutyRole) LIKE '%usher%' AND LOWER(n.targetRole) = 'usher') " +
           "     OR (LOWER(:dutyRole) LIKE '%manager%' AND LOWER(n.targetRole) = 'theater_manager'))")
    long countUnreadForUser(
            @Param("portalId") Long portalId,
            @Param("userId") Long userId,
            @Param("userRole") String userRole,
            @Param("dutyRole") String dutyRole);

    List<TheaterNotification> findByTheaterPortalIdOrderByCreatedAtDesc(Long portalId, Pageable pageable);

    List<TheaterNotification> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByTheaterPortalIdAndReadFalse(Long portalId);

    @Modifying
    @Query("UPDATE TheaterNotification n SET n.read = true, n.readAt = CURRENT_TIMESTAMP " +
           "WHERE n.theaterPortal.id = :portalId AND n.read = false")
    int markAllAsReadForPortal(@Param("portalId") Long portalId);
}
