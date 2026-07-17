package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.RegistrationFormField;
import com.fic.event_management_system.enums.RegistrationType;
import com.fic.event_management_system.repository.RegistrationFormFieldRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.RegistrationFormFieldService;
import com.fic.event_management_system.service.SubscriptionLimitService;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class RegistrationFormFieldServiceImpl implements RegistrationFormFieldService {

    private final RegistrationFormFieldRepository fieldRepository;
    private final TenantSecurityService tenantSecurityService;
    private final SubscriptionLimitService subscriptionLimitService;

    public RegistrationFormFieldServiceImpl(
            RegistrationFormFieldRepository fieldRepository,
            TenantSecurityService tenantSecurityService,
            SubscriptionLimitService subscriptionLimitService) {

        this.fieldRepository = fieldRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.subscriptionLimitService = subscriptionLimitService;
    }

    @Override
    public RegistrationFormField createField(RegistrationFormField field) {
        if (field.getEvent() == null || field.getEvent().getId() == null) {
            throw new RuntimeException("Event is required for form field");
        }

        Event event = tenantSecurityService.getEventFromLoggedInPortal(field.getEvent().getId());
        subscriptionLimitService.assertCanCreateCustomField(event.getId());
        field.setEvent(event);

        return fieldRepository.save(field);
    }

    @Override
    public List<RegistrationFormField> getFieldsByEvent(Long eventId) {
        return fieldRepository.findByEventId(eventId);
    }

    @Override
    public List<RegistrationFormField> getFieldsByEventAndType(
            Long eventId,
            String registrationType) {

        return fieldRepository.findByEventIdAndRegistrationType(
                eventId,
                RegistrationType.valueOf(registrationType.toUpperCase())
        );
    }

    @Override
    public void deleteField(Long fieldId) {
        RegistrationFormField field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new RuntimeException("Field not found"));

        tenantSecurityService.requireEventInLoggedInPortal(field.getEvent());
        subscriptionLimitService.assertPortalIsWritable(field.getEvent().getPortal().getId());
        fieldRepository.delete(field);
    }
}
