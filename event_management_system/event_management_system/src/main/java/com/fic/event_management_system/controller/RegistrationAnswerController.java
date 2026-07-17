package com.fic.event_management_system.controller;

import com.fic.event_management_system.dto.EventRegistrationResponse;
import com.fic.event_management_system.dto.SubmitAnswerRequest;
import com.fic.event_management_system.entity.RegistrationAnswer;
import com.fic.event_management_system.service.RegistrationAnswerService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/registration-answers")
public class RegistrationAnswerController {

    private final RegistrationAnswerService answerService;

    public RegistrationAnswerController(RegistrationAnswerService answerService) {
        this.answerService = answerService;
    }

    @PostMapping
    public List<RegistrationAnswer> submitAnswers(@RequestBody SubmitAnswerRequest request) {
        return answerService.submitAnswers(request);
    }

    @GetMapping("/registration/{registrationId}")
    public List<RegistrationAnswer> getAnswersByRegistration(@PathVariable Long registrationId) {
        return answerService.getAnswersByRegistration(registrationId);
    }
    
    @DeleteMapping("/{answerId}")
    public String deleteAnswer(@PathVariable Long answerId) {

        answerService.deleteAnswer(answerId);

        return "Answer deleted successfully";
    }
    
    @GetMapping("/event/{eventId}")
    public List<RegistrationAnswer> getAnswersByEvent(
            @PathVariable Long eventId) {

        return answerService.getAnswersByEvent(eventId);
    }
    
    @GetMapping("/event/{eventId}/formatted")
    public List<EventRegistrationResponse> getFormattedAnswersByEvent(
            @PathVariable Long eventId) {

        return answerService.getFormattedAnswersByEvent(eventId);
    }
}
