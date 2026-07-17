package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.VolunteerTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VolunteerTaskRepository extends JpaRepository<VolunteerTask, Long> {

    List<VolunteerTask> findByAssignmentVolunteerId(Long volunteerId);

    List<VolunteerTask> findByAssignmentEventId(Long eventId);

    List<VolunteerTask> findByAssignmentId(Long assignmentId);
}