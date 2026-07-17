package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.RegistrationAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RegistrationAnswerRepository extends JpaRepository<RegistrationAnswer, Long> {

    List<RegistrationAnswer> findByRegistrationId(Long registrationId);
    
    Optional<RegistrationAnswer> findByRegistrationIdAndFormFieldId(
            Long registrationId,
            Long formFieldId
    );
    
    List<RegistrationAnswer> findByRegistrationEventId(Long eventId);
}
