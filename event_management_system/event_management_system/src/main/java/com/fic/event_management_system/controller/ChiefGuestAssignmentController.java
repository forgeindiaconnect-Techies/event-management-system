package com.fic.event_management_system.controller;

import com.fic.event_management_system.entity.ChiefGuestAssignment;
import com.fic.event_management_system.service.ChiefGuestAssignmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chief-guest-assignments")
public class ChiefGuestAssignmentController {

    private final ChiefGuestAssignmentService chiefGuestAssignmentService;

    public ChiefGuestAssignmentController(
            ChiefGuestAssignmentService chiefGuestAssignmentService) {
        this.chiefGuestAssignmentService = chiefGuestAssignmentService;
    }

    @PostMapping
    public ChiefGuestAssignment assignChiefGuest(
            @RequestBody ChiefGuestAssignment assignment) {

        return chiefGuestAssignmentService.assignChiefGuest(assignment);
    }

    @GetMapping("/event/{eventId}")
    public List<ChiefGuestAssignment> getChiefGuestsByEvent(
            @PathVariable Long eventId) {

        return chiefGuestAssignmentService.getChiefGuestsByEvent(eventId);
    }

    @GetMapping("/chief-guest/{chiefGuestId}")
    public List<ChiefGuestAssignment> getEventsByChiefGuest(
            @PathVariable Long chiefGuestId) {

        return chiefGuestAssignmentService.getEventsByChiefGuest(chiefGuestId);
    }

    @DeleteMapping("/{assignmentId}")
    public String removeChiefGuestAssignment(
            @PathVariable Long assignmentId) {

        chiefGuestAssignmentService.removeChiefGuestAssignment(assignmentId);
        return "Chief guest assignment removed successfully.";
    }
}
