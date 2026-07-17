package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.AbstractTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AbstractTopicRepository extends JpaRepository<AbstractTopic, Long> {
    List<AbstractTopic> findByEventId(Long eventId);
}