package com.fic.event_management_system.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "registration_answers")
public class RegistrationAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String answer;

    @ManyToOne
    @JoinColumn(name = "registration_id", nullable = false)
    private Registration registration;

    @ManyToOne
    @JoinColumn(name = "form_field_id", nullable = false)
    private RegistrationFormField formField;

    public Long getId() {
        return id;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public Registration getRegistration() {
        return registration;
    }

    public void setRegistration(Registration registration) {
        this.registration = registration;
    }

    public RegistrationFormField getFormField() {
        return formField;
    }

    public void setFormField(RegistrationFormField formField) {
        this.formField = formField;
    }
}