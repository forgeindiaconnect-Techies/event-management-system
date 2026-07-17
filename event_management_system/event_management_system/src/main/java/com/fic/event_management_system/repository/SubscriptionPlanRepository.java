package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.SubscriptionPlan;
import com.fic.event_management_system.enums.SubscriptionPlanCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionPlanRepository
        extends JpaRepository<SubscriptionPlan, Long> {

    Optional<SubscriptionPlan> findByCode(SubscriptionPlanCode code);

    List<SubscriptionPlan> findByActiveTrueOrderByMonthlyPriceAsc();

    List<SubscriptionPlan> findAllByOrderByMonthlyPriceAsc();
}
