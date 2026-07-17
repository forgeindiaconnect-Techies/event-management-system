package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.VolunteerAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VolunteerAssignmentRepository
        extends JpaRepository<VolunteerAssignment, Long> {

    List<VolunteerAssignment> findByVolunteerId(Long volunteerId);

    List<VolunteerAssignment> findByEventId(Long eventId);

    boolean existsByVolunteerIdAndEventId(Long volunteerId, Long eventId);
}
