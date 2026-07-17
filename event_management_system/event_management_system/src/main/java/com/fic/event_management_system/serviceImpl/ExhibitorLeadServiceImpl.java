package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.Exhibitor;
import com.fic.event_management_system.entity.ExhibitorLead;
import com.fic.event_management_system.repository.ExhibitorLeadRepository;
import com.fic.event_management_system.repository.ExhibitorRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.ExhibitorLeadService;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ExhibitorLeadServiceImpl implements ExhibitorLeadService {

    private final ExhibitorLeadRepository leadRepository;
    private final ExhibitorRepository exhibitorRepository;
    private final TenantSecurityService tenantSecurityService;

    public ExhibitorLeadServiceImpl(
            ExhibitorLeadRepository leadRepository,
            ExhibitorRepository exhibitorRepository,
            TenantSecurityService tenantSecurityService) {

        this.leadRepository = leadRepository;
        this.exhibitorRepository = exhibitorRepository;
        this.tenantSecurityService = tenantSecurityService;
    }

    @Override
    public ExhibitorLead createLead(ExhibitorLead lead) {
        attachReferences(lead);
        return leadRepository.save(lead);
    }

    @Override
    public ExhibitorLead updateLead(Long leadId, ExhibitorLead lead) {
        ExhibitorLead existing = getLeadById(leadId);

        existing.setName(lead.getName());
        existing.setCompany(lead.getCompany());
        existing.setEmail(lead.getEmail());
        existing.setPhone(lead.getPhone());
        existing.setInterest(lead.getInterest());
        existing.setSource(lead.getSource());
        existing.setStatus(lead.getStatus());

        if (lead.getExhibitor() != null && lead.getExhibitor().getId() != null) {
            Exhibitor exhibitor = getExhibitorFromSameEvent(
                    lead.getExhibitor().getId(),
                    existing.getEvent().getId()
            );
            existing.setExhibitor(exhibitor);
        }

        return leadRepository.save(existing);
    }

    @Override
    public List<ExhibitorLead> getLeadsByEvent(Long eventId) {
        tenantSecurityService.requireEventInLoggedInPortal(eventId);
        return leadRepository.findByEventId(eventId);
    }

    @Override
    public List<ExhibitorLead> getLeadsByExhibitor(Long exhibitorId) {
        Exhibitor exhibitor = getExhibitorById(exhibitorId);
        return leadRepository.findByExhibitorId(exhibitor.getId());
    }

    @Override
    public ExhibitorLead getLeadById(Long leadId) {
        ExhibitorLead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        tenantSecurityService.requireEventInLoggedInPortal(lead.getEvent());
        return lead;
    }

    @Override
    public void deleteLead(Long leadId) {
        ExhibitorLead lead = getLeadById(leadId);
        leadRepository.delete(lead);
    }

    private void attachReferences(ExhibitorLead lead) {
        if (lead.getEvent() == null || lead.getEvent().getId() == null) {
            throw new RuntimeException("Event is required for lead");
        }

        if (lead.getExhibitor() == null || lead.getExhibitor().getId() == null) {
            throw new RuntimeException("Exhibitor is required for lead");
        }

        Event event = tenantSecurityService.getEventFromLoggedInPortal(lead.getEvent().getId());
        Exhibitor exhibitor = getExhibitorFromSameEvent(lead.getExhibitor().getId(), event.getId());

        lead.setEvent(event);
        lead.setExhibitor(exhibitor);
    }

    private Exhibitor getExhibitorById(Long exhibitorId) {
        Exhibitor exhibitor = exhibitorRepository.findById(exhibitorId)
                .orElseThrow(() -> new RuntimeException("Exhibitor not found"));

        tenantSecurityService.requireEventInLoggedInPortal(exhibitor.getEvent());
        return exhibitor;
    }

    private Exhibitor getExhibitorFromSameEvent(Long exhibitorId, Long eventId) {
        Exhibitor exhibitor = getExhibitorById(exhibitorId);

        if (!exhibitor.getEvent().getId().equals(eventId)) {
            throw new RuntimeException("Exhibitor does not belong to this event");
        }

        return exhibitor;
    }
}