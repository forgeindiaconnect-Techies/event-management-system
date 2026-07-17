package com.fic.event_management_system.controller;

import com.fic.event_management_system.entity.VolunteerAssignment;
import com.fic.event_management_system.service.VolunteerAssignmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/volunteer-assignments")
public class VolunteerAssignmentController {

    private final VolunteerAssignmentService volunteerAssignmentService;

    public VolunteerAssignmentController(
            VolunteerAssignmentService volunteerAssignmentService) {
        this.volunteerAssignmentService = volunteerAssignmentService;
    }

    @PostMapping
    public VolunteerAssignment assignVolunteer(
            @RequestBody VolunteerAssignment assignment) {

        return volunteerAssignmentService.assignVolunteer(assignment);
    }

    @GetMapping("/event/{eventId}")
    public List<VolunteerAssignment> getVolunteersByEvent(
            @PathVariable Long eventId) {

        return volunteerAssignmentService.getVolunteersByEvent(eventId);
    }

    @GetMapping("/volunteer/{volunteerId}")
    public List<VolunteerAssignment> getEventsByVolunteer(
            @PathVariable Long volunteerId) {

        return volunteerAssignmentService.getEventsByVolunteer(volunteerId);
    }

    @DeleteMapping("/{assignmentId}")
    public String removeVolunteerAssignment(
            @PathVariable Long assignmentId) {

        volunteerAssignmentService.removeVolunteerAssignment(assignmentId);
        return "Volunteer assignment removed successfully.";
    }
}