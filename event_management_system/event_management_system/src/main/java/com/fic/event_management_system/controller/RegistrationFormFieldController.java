package com.fic.event_management_system.controller;

import com.fic.event_management_system.entity.RegistrationFormField;
import com.fic.event_management_system.service.RegistrationFormFieldService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/form-fields")
public class RegistrationFormFieldController {

private final RegistrationFormFieldService fieldService;

public RegistrationFormFieldController(
        RegistrationFormFieldService fieldService) {

    this.fieldService = fieldService;
}

@PostMapping
public RegistrationFormField createField(
        @RequestBody RegistrationFormField field) {

    return fieldService.createField(field);
}

@GetMapping("/event/{eventId}")
public List<RegistrationFormField> getFieldsByEvent(
        @PathVariable Long eventId) {

    return fieldService.getFieldsByEvent(eventId);
}

@GetMapping("/event/{eventId}/type/{registrationType}")
public List<RegistrationFormField> getFieldsByEventAndType(
        @PathVariable Long eventId,
        @PathVariable String registrationType) {

    return fieldService.getFieldsByEventAndType(
            eventId,
            registrationType
    );
}

@DeleteMapping("/{fieldId}")
public String deleteField(
        @PathVariable Long fieldId) {

    fieldService.deleteField(fieldId);

    return "Field deleted successfully";
}

}
