package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.dto.AnswerRequest;
import com.fic.event_management_system.dto.AnswerResponse;
import com.fic.event_management_system.dto.EventRegistrationResponse;
import com.fic.event_management_system.dto.SubmitAnswerRequest;
import com.fic.event_management_system.entity.Registration;
import com.fic.event_management_system.entity.RegistrationAnswer;
import com.fic.event_management_system.entity.RegistrationFormField;
import com.fic.event_management_system.repository.RegistrationAnswerRepository;
import com.fic.event_management_system.repository.RegistrationFormFieldRepository;
import com.fic.event_management_system.repository.RegistrationRepository;
import com.fic.event_management_system.service.RegistrationAnswerService;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RegistrationAnswerServiceImpl implements RegistrationAnswerService {

    private final RegistrationAnswerRepository answerRepository;
    private final RegistrationRepository registrationRepository;
    private final RegistrationFormFieldRepository fieldRepository;

    public RegistrationAnswerServiceImpl(
            RegistrationAnswerRepository answerRepository,
            RegistrationRepository registrationRepository,
            RegistrationFormFieldRepository fieldRepository) {

        this.answerRepository = answerRepository;
        this.registrationRepository = registrationRepository;
        this.fieldRepository = fieldRepository;
    }

    @Override
    public List<RegistrationAnswer> submitAnswers(SubmitAnswerRequest request) {

        Registration registration = registrationRepository
                .findById(request.getRegistrationId())
                .orElseThrow(() -> new RuntimeException("Registration not found"));

        List<RegistrationAnswer> savedAnswers = new ArrayList<>();

        for (AnswerRequest answerRequest : request.getAnswers()) {

            RegistrationFormField field = fieldRepository
                    .findById(answerRequest.getFieldId())
                    .orElseThrow(() -> new RuntimeException("Form field not found"));
            
            if (field.getRegistrationType() !=
                    registration.getRegistrationType()) {

                throw new RuntimeException(
                        "Invalid field for this registration type"
                );
            }
            
            if (field.getRequired() != null && field.getRequired()) {

                if (answerRequest.getAnswer() == null ||
                        answerRequest.getAnswer().trim().isEmpty()) {

                    throw new RuntimeException(
                            field.getFieldLabel() + " is required"
                    );
                }
            }

            RegistrationAnswer answer = answerRepository
                    .findByRegistrationIdAndFormFieldId(
                            registration.getId(),
                            field.getId()
                    )
                    .orElse(new RegistrationAnswer());

            answer.setRegistration(registration);
            answer.setFormField(field);
            answer.setAnswer(answerRequest.getAnswer());

            savedAnswers.add(answerRepository.save(answer));
        }

        return savedAnswers;
    }

    @Override
    public List<RegistrationAnswer> getAnswersByRegistration(Long registrationId) {
        return answerRepository.findByRegistrationId(registrationId);
    }
    
    @Override
    public void deleteAnswer(Long answerId) {
        answerRepository.deleteById(answerId);
    }
    
    @Override
    public List<RegistrationAnswer> getAnswersByEvent(Long eventId) {
        return answerRepository.findByRegistrationEventId(eventId);
    }
    
    @Override
    public List<EventRegistrationResponse> getFormattedAnswersByEvent(Long eventId) {

        List<RegistrationAnswer> answers =
                answerRepository.findByRegistrationEventId(eventId);

        Map<Long, EventRegistrationResponse> responseMap = new LinkedHashMap<>();

        for (RegistrationAnswer answer : answers) {

            Registration registration = answer.getRegistration();

            EventRegistrationResponse response =
                    responseMap.get(registration.getId());

            if (response == null) {
                response = new EventRegistrationResponse();

                response.setRegistrationId(registration.getId());
                response.setParticipantName(
                        registration.getParticipant().getFirstName()
                                + " "
                                + registration.getParticipant().getLastName()
                );
                response.setParticipantEmail(
                        registration.getParticipant().getEmail()
                );

                response.setParticipantPhone(
                        registration.getParticipant().getPhoneNumber()
                );
                
                response.setRegistrationType(
                        registration.getRegistrationType().name()
                );
                response.setAnswers(new ArrayList<>());

                responseMap.put(registration.getId(), response);
            }

            response.getAnswers().add(
                    new AnswerResponse(
                            answer.getFormField().getFieldLabel(),
                            answer.getAnswer()
                    )
            );
        }

        return new ArrayList<>(responseMap.values());
    }
}
