package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.VolunteerTask;
import com.fic.event_management_system.enums.TaskStatus;

import java.util.List;

public interface VolunteerTaskService {

    VolunteerTask createTask(VolunteerTask task);

    List<VolunteerTask> getTasksByVolunteer(Long volunteerId);

    List<VolunteerTask> getTasksByEvent(Long eventId);

    List<VolunteerTask> getTasksByAssignment(Long assignmentId);

    VolunteerTask updateTaskStatus(Long taskId, TaskStatus status);

    void deleteTask(Long taskId);
}