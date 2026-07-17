package com.fic.event_management_system.controller;

import com.fic.event_management_system.dto.EventRatingSummaryResponse;
import com.fic.event_management_system.entity.Feedback;
import com.fic.event_management_system.service.FeedbackService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    public Feedback submitFeedback(@RequestBody Feedback feedback) {
        return feedbackService.submitFeedback(feedback);
    }

    @GetMapping("/event/{eventId}")
    public List<Feedback> getFeedbackByEvent(@PathVariable Long eventId) {
        return feedbackService.getFeedbackByEvent(eventId);
    }

    @GetMapping("/user/{userId}")
    public List<Feedback> getFeedbackByUser(@PathVariable Long userId) {
        return feedbackService.getFeedbackByUser(userId);
    }
    
    @GetMapping("/event/{eventId}/summary")
    public EventRatingSummaryResponse getRatingSummary(@PathVariable Long eventId) {
        return feedbackService.getRatingSummary(eventId);
    }
}
