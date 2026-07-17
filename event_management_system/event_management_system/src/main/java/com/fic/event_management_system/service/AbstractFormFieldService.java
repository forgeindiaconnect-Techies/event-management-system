package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.AbstractFormField;
import java.util.List;

public interface AbstractFormFieldService {
    AbstractFormField createField(AbstractFormField field);

    AbstractFormField updateField(Long id, AbstractFormField field);

    List<AbstractFormField> getFieldsByEvent(Long eventId);

    void deleteField(Long id);
}