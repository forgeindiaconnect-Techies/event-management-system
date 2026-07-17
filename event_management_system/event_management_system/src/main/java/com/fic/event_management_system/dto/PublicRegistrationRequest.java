package com.fic.event_management_system.dto;

import java.util.List;

public class PublicRegistrationRequest {

    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String registrationType;
    private Long ticketClassId;
    private Integer ticketQuantity;
    private String qrGenerationMode;
    private List<PublicAnswerRequest> answers;

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getRegistrationType() { return registrationType; }
    public void setRegistrationType(String registrationType) { this.registrationType = registrationType; }

    public Long getTicketClassId() { return ticketClassId; }
    public void setTicketClassId(Long ticketClassId) { this.ticketClassId = ticketClassId; }

    public Integer getTicketQuantity() { return ticketQuantity; }
    public void setTicketQuantity(Integer ticketQuantity) { this.ticketQuantity = ticketQuantity; }

    public String getQrGenerationMode() { return qrGenerationMode; }
    public void setQrGenerationMode(String qrGenerationMode) { this.qrGenerationMode = qrGenerationMode; }

    public List<PublicAnswerRequest> getAnswers() { return answers; }
    public void setAnswers(List<PublicAnswerRequest> answers) { this.answers = answers; }
}
