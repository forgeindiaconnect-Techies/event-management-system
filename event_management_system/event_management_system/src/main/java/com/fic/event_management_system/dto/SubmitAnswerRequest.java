package com.fic.event_management_system.dto;

import java.util.List;

public class SubmitAnswerRequest {

    private Long registrationId;
    private List<AnswerRequest> answers;

    public Long getRegistrationId() {
        return registrationId;
    }

    public void setRegistrationId(Long registrationId) {
        this.registrationId = registrationId;
    }

    public List<AnswerRequest> getAnswers() {
        return answers;
    }

    public void setAnswers(List<AnswerRequest> answers) {
        this.answers = answers;
    }
}
