package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.AbstractFormField;
import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.repository.AbstractFormFieldRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.AbstractFormFieldService;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AbstractFormFieldServiceImpl implements AbstractFormFieldService {

    private final AbstractFormFieldRepository repository;
    private final TenantSecurityService tenantSecurityService;

    public AbstractFormFieldServiceImpl(
            AbstractFormFieldRepository repository,
            TenantSecurityService tenantSecurityService) {

        this.repository = repository;
        this.tenantSecurityService = tenantSecurityService;
    }

    @Override
    public AbstractFormField createField(AbstractFormField field) {
        if (field.getEvent() == null || field.getEvent().getId() == null) {
            throw new RuntimeException("Event is required for abstract form field");
        }

        Event event = tenantSecurityService.getEventFromLoggedInPortal(field.getEvent().getId());
        field.setEvent(event);

        return repository.save(field);
    }

    @Override
    public AbstractFormField updateField(Long id, AbstractFormField field) {
        AbstractFormField existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Abstract form field not found"));

        tenantSecurityService.requireEventInLoggedInPortal(existing.getEvent());

        existing.setFieldLabel(field.getFieldLabel());
        existing.setFieldType(field.getFieldType());
        existing.setPlaceholderText(field.getPlaceholderText());
        existing.setRequired(field.getRequired());
        existing.setActive(field.getActive());
        existing.setDisplayOrder(field.getDisplayOrder());
        existing.setOptionsText(field.getOptionsText());

        if (field.getEvent() != null && field.getEvent().getId() != null) {
            Event event = tenantSecurityService.getEventFromLoggedInPortal(field.getEvent().getId());
            existing.setEvent(event);
        }

        return repository.save(existing);
    }

    @Override
    public List<AbstractFormField> getFieldsByEvent(Long eventId) {
        tenantSecurityService.requireEventInLoggedInPortal(eventId);
        return repository.findByEventIdOrderByDisplayOrderAsc(eventId);
    }

    @Override
    public void deleteField(Long id) {
        AbstractFormField existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Abstract form field not found"));

        tenantSecurityService.requireEventInLoggedInPortal(existing.getEvent());
        repository.delete(existing);
    }
}