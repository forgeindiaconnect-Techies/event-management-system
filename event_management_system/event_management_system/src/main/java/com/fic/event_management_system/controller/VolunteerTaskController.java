package com.fic.event_management_system.controller;

import com.fic.event_management_system.entity.VolunteerTask;
import com.fic.event_management_system.enums.TaskStatus;
import com.fic.event_management_system.service.VolunteerTaskService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/volunteer-tasks")
public class VolunteerTaskController {

    private final VolunteerTaskService volunteerTaskService;

    public VolunteerTaskController(VolunteerTaskService volunteerTaskService) {
        this.volunteerTaskService = volunteerTaskService;
    }

    @PostMapping
    public VolunteerTask createTask(@RequestBody VolunteerTask task) {
        return volunteerTaskService.createTask(task);
    }

    @GetMapping("/volunteer/{volunteerId}")
    public List<VolunteerTask> getTasksByVolunteer(@PathVariable Long volunteerId) {
        return volunteerTaskService.getTasksByVolunteer(volunteerId);
    }

    @GetMapping("/event/{eventId}")
    public List<VolunteerTask> getTasksByEvent(@PathVariable Long eventId) {
        return volunteerTaskService.getTasksByEvent(eventId);
    }

    @GetMapping("/assignment/{assignmentId}")
    public List<VolunteerTask> getTasksByAssignment(@PathVariable Long assignmentId) {
        return volunteerTaskService.getTasksByAssignment(assignmentId);
    }

    @PutMapping("/{taskId}/status")
    public VolunteerTask updateTaskStatus(
            @PathVariable Long taskId,
            @RequestParam TaskStatus status) {

        return volunteerTaskService.updateTaskStatus(taskId, status);
    }

    @DeleteMapping("/{taskId}")
    public String deleteTask(@PathVariable Long taskId) {
        volunteerTaskService.deleteTask(taskId);
        return "Volunteer task deleted successfully.";
    }
}