package com.fic.event_management_system.controller;

import com.fic.event_management_system.entity.SpeakerAssignment;
import com.fic.event_management_system.service.SpeakerAssignmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/speaker-assignments")
public class SpeakerAssignmentController {

    private final SpeakerAssignmentService speakerAssignmentService;

    public SpeakerAssignmentController(
            SpeakerAssignmentService speakerAssignmentService) {
        this.speakerAssignmentService = speakerAssignmentService;
    }

    @PostMapping
    public SpeakerAssignment assignSpeaker(
            @RequestBody SpeakerAssignment assignment) {

        return speakerAssignmentService.assignSpeaker(assignment);
    }

    @GetMapping("/event/{eventId}")
    public List<SpeakerAssignment> getSpeakersByEvent(
            @PathVariable Long eventId) {

        return speakerAssignmentService.getSpeakersByEvent(eventId);
    }

    @GetMapping("/speaker/{speakerId}")
    public List<SpeakerAssignment> getEventsBySpeaker(
            @PathVariable Long speakerId) {

        return speakerAssignmentService.getEventsBySpeaker(speakerId);
    }

    @DeleteMapping("/{assignmentId}")
    public String removeSpeakerAssignment(
            @PathVariable Long assignmentId) {

        speakerAssignmentService.removeSpeakerAssignment(assignmentId);
        return "Speaker assignment removed successfully.";
    }
}