package com.fic.event_management_system.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fic.event_management_system.entity.EventBudget;

@Repository
public interface EventBudgetRepository
        extends JpaRepository<EventBudget, Long> {

    Optional<EventBudget> findByEventId(Long eventId);

    boolean existsByEventId(Long eventId);
}
