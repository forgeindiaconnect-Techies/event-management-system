package com.fic.event_management_system.service;

import com.fic.event_management_system.dto.EventRatingSummaryResponse;
import com.fic.event_management_system.entity.Feedback;
import java.util.List;

public interface FeedbackService {

    Feedback submitFeedback(Feedback feedback);

    List<Feedback> getFeedbackByEvent(Long eventId);

    List<Feedback> getFeedbackByUser(Long userId);
    
    EventRatingSummaryResponse getRatingSummary(Long eventId);
}