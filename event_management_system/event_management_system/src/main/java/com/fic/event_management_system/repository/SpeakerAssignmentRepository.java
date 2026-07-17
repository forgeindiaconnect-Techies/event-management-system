package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.SpeakerAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SpeakerAssignmentRepository
        extends JpaRepository<SpeakerAssignment, Long> {

    List<SpeakerAssignment> findBySpeakerId(Long speakerId);

    List<SpeakerAssignment> findByEventId(Long eventId);

    boolean existsBySpeakerIdAndEventId(Long speakerId, Long eventId);
}
