package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    List<Feedback> findByEventId(Long eventId);

    List<Feedback> findByUserId(Long userId);

    long countByEventId(Long eventId);

    long countByEventIdAndRating(Long eventId, Integer rating);
}