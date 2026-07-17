package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.RegistrationFormField;
import com.fic.event_management_system.enums.RegistrationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RegistrationFormFieldRepository extends JpaRepository<RegistrationFormField, Long> {

    List<RegistrationFormField> findByEventId(Long eventId);

    List<RegistrationFormField> findByEventIdAndRegistrationType(
            Long eventId,
            RegistrationType registrationType
    );
}
