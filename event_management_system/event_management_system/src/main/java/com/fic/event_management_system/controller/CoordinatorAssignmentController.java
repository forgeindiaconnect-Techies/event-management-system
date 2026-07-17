package com.fic.event_management_system.controller;

import com.fic.event_management_system.entity.CoordinatorAssignment;
import com.fic.event_management_system.service.CoordinatorAssignmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coordinator-assignments")
public class CoordinatorAssignmentController {

    private final CoordinatorAssignmentService coordinatorAssignmentService;

    public CoordinatorAssignmentController(
            CoordinatorAssignmentService coordinatorAssignmentService) {
        this.coordinatorAssignmentService = coordinatorAssignmentService;
    }

    @PostMapping
    public CoordinatorAssignment assignCoordinator(
            @RequestBody CoordinatorAssignment assignment) {

        return coordinatorAssignmentService.assignCoordinator(assignment);
    }

    @GetMapping("/event/{eventId}")
    public List<CoordinatorAssignment> getCoordinatorsByEvent(
            @PathVariable Long eventId) {

        return coordinatorAssignmentService.getCoordinatorsByEvent(eventId);
    }

    @GetMapping("/coordinator/{coordinatorId}")
    public List<CoordinatorAssignment> getEventsByCoordinator(
            @PathVariable Long coordinatorId) {

        return coordinatorAssignmentService.getEventsByCoordinator(coordinatorId);
    }

    @DeleteMapping("/{assignmentId}")
    public String removeCoordinatorAssignment(
            @PathVariable Long assignmentId) {

        coordinatorAssignmentService.removeCoordinatorAssignment(assignmentId);
        return "Coordinator assignment removed successfully.";
    }
}
