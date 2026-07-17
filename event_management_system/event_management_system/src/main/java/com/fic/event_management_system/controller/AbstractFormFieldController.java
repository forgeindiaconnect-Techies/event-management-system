package com.fic.event_management_system.controller;

import com.fic.event_management_system.entity.AbstractFormField;
import com.fic.event_management_system.service.AbstractFormFieldService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/abstract-form-fields")
public class AbstractFormFieldController {

    private final AbstractFormFieldService abstractFormFieldService;

    public AbstractFormFieldController(AbstractFormFieldService abstractFormFieldService) {
        this.abstractFormFieldService = abstractFormFieldService;
    }

    @GetMapping("/event/{eventId}")
    public List<AbstractFormField> getFieldsByEvent(@PathVariable Long eventId) {
        return abstractFormFieldService.getFieldsByEvent(eventId);
    }

    @PostMapping
    public AbstractFormField createField(@RequestBody AbstractFormField field) {
        return abstractFormFieldService.createField(field);
    }

    @PutMapping("/{id}")
    public AbstractFormField updateField(
            @PathVariable Long id,
            @RequestBody AbstractFormField field) {

        return abstractFormFieldService.updateField(id, field);
    }

    @DeleteMapping("/{id}")
    public String deleteField(@PathVariable Long id) {
        abstractFormFieldService.deleteField(id);
        return "Abstract form field deleted successfully";
    }
}