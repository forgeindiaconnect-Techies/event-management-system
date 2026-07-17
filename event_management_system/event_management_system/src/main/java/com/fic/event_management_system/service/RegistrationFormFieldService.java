package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.RegistrationFormField;
import java.util.List;

public interface RegistrationFormFieldService {

    RegistrationFormField createField(RegistrationFormField field);

    List<RegistrationFormField> getFieldsByEvent(Long eventId);

    List<RegistrationFormField> getFieldsByEventAndType(Long eventId, String registrationType);

    void deleteField(Long fieldId);
}
