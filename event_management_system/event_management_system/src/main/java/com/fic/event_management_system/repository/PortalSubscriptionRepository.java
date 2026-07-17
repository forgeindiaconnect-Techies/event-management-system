package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.PortalSubscription;
import com.fic.event_management_system.enums.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PortalSubscriptionRepository
        extends JpaRepository<PortalSubscription, Long> {

    Optional<PortalSubscription>
    findTopByPortalIdOrderByCreatedAtDesc(Long portalId);

    Optional<PortalSubscription>
    findTopByPortalIdAndStatusInOrderByEndDateDesc(
            Long portalId,
            Collection<SubscriptionStatus> statuses
    );

    List<PortalSubscription>
    findByPortalIdOrderByCreatedAtDesc(Long portalId);

    List<PortalSubscription>
    findAllByOrderByCreatedAtDesc();

    List<PortalSubscription>
    findByStatusOrderByCreatedAtDesc(SubscriptionStatus status);

    List<PortalSubscription>
    findByStatusInAndEndDateBefore(
            Collection<SubscriptionStatus> statuses,
            LocalDateTime date
    );

    List<PortalSubscription>
    findByStatusInAndEndDateBetween(
            Collection<SubscriptionStatus> statuses,
            LocalDateTime start,
            LocalDateTime end
    );

    boolean existsByPortalIdAndTrialTrue(Long portalId);
}
