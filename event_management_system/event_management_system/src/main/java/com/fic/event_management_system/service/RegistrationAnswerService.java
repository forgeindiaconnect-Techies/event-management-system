package com.fic.event_management_system.service;

import com.fic.event_management_system.dto.EventRegistrationResponse;
import com.fic.event_management_system.dto.SubmitAnswerRequest;
import com.fic.event_management_system.entity.RegistrationAnswer;

import java.util.List;

public interface RegistrationAnswerService {

    List<RegistrationAnswer> submitAnswers(SubmitAnswerRequest request);

    List<RegistrationAnswer> getAnswersByRegistration(Long registrationId);
    
    void deleteAnswer(Long answerId);    
    
    List<RegistrationAnswer> getAnswersByEvent(Long eventId);
    
    List<EventRegistrationResponse> getFormattedAnswersByEvent(Long eventId);
}
