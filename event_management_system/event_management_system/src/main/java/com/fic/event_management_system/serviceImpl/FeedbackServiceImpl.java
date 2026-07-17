package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.dto.EventRatingSummaryResponse;
import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.Feedback;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.repository.FeedbackRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.FeedbackService;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final TenantSecurityService tenantSecurityService;

    public FeedbackServiceImpl(
            FeedbackRepository feedbackRepository,
            TenantSecurityService tenantSecurityService) {

        this.feedbackRepository = feedbackRepository;
        this.tenantSecurityService = tenantSecurityService;
    }

    @Override
    public Feedback submitFeedback(Feedback feedback) {
        if (feedback.getEvent() == null || feedback.getEvent().getId() == null) {
            throw new RuntimeException("Event is required for feedback");
        }

        Event event = tenantSecurityService.getEventFromLoggedInPortal(feedback.getEvent().getId());
        User user = tenantSecurityService.getLoggedInUser();

        feedback.setEvent(event);
        feedback.setUser(user);

        return feedbackRepository.save(feedback);
    }

    @Override
    public List<Feedback> getFeedbackByEvent(Long eventId) {
        tenantSecurityService.requireEventInLoggedInPortal(eventId);
        return feedbackRepository.findByEventId(eventId);
    }

    @Override
    public List<Feedback> getFeedbackByUser(Long userId) {
        User loggedInUser = tenantSecurityService.getLoggedInUser();

        if (loggedInUser.getId().equals(userId)) {
            return feedbackRepository.findByUserId(userId);
        }

        tenantSecurityService.requireUserInLoggedInPortal(userId);
        return feedbackRepository.findByUserId(userId);
    }

    @Override
    public EventRatingSummaryResponse getRatingSummary(Long eventId) {
        Event event = tenantSecurityService.getEventFromLoggedInPortal(eventId);

        List<Feedback> feedbacks = feedbackRepository.findByEventId(eventId);

        double average = feedbacks.stream()
                .mapToInt(Feedback::getRating)
                .average()
                .orElse(0.0);

        EventRatingSummaryResponse response = new EventRatingSummaryResponse();

        response.setEventId(event.getId());
        response.setEventName(event.getEventName());
        response.setTotalFeedbacks(feedbackRepository.countByEventId(eventId));
        response.setAverageRating(average);

        response.setFiveStar(feedbackRepository.countByEventIdAndRating(eventId, 5));
        response.setFourStar(feedbackRepository.countByEventIdAndRating(eventId, 4));
        response.setThreeStar(feedbackRepository.countByEventIdAndRating(eventId, 3));
        response.setTwoStar(feedbackRepository.countByEventIdAndRating(eventId, 2));
        response.setOneStar(feedbackRepository.countByEventIdAndRating(eventId, 1));

        return response;
    }
}