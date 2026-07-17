package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.dto.ExhibitorReportResponse;
import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.Exhibitor;
import com.fic.event_management_system.repository.ExhibitorBoothRepository;
import com.fic.event_management_system.repository.ExhibitorLeadRepository;
import com.fic.event_management_system.repository.ExhibitorRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.ExhibitorService;
import com.fic.event_management_system.service.SubscriptionLimitService;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ExhibitorServiceImpl implements ExhibitorService {

    private final ExhibitorRepository exhibitorRepository;
    private final ExhibitorBoothRepository boothRepository;
    private final ExhibitorLeadRepository leadRepository;
    private final TenantSecurityService tenantSecurityService;
    private final SubscriptionLimitService subscriptionLimitService;

    public ExhibitorServiceImpl(
            ExhibitorRepository exhibitorRepository,
            ExhibitorBoothRepository boothRepository,
            ExhibitorLeadRepository leadRepository,
            TenantSecurityService tenantSecurityService,
            SubscriptionLimitService subscriptionLimitService) {

        this.exhibitorRepository = exhibitorRepository;
        this.boothRepository = boothRepository;
        this.leadRepository = leadRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.subscriptionLimitService = subscriptionLimitService;
    }

    @Override
    public Exhibitor createExhibitor(Exhibitor exhibitor) {
        if (exhibitor.getEvent() == null || exhibitor.getEvent().getId() == null) {
            throw new RuntimeException("Event is required for exhibitor");
        }

        Event event = tenantSecurityService.getEventFromLoggedInPortal(exhibitor.getEvent().getId());
        subscriptionLimitService.assertCanCreateExhibitor(event.getId());
        exhibitor.setEvent(event);

        return exhibitorRepository.save(exhibitor);
    }

    @Override
    public Exhibitor updateExhibitor(Long exhibitorId, Exhibitor exhibitor) {
        Exhibitor existing = getExhibitorById(exhibitorId);
        subscriptionLimitService.assertPortalIsWritable(existing.getEvent().getPortal().getId());

        existing.setCompany(exhibitor.getCompany());
        existing.setCategory(exhibitor.getCategory());
        existing.setContact(exhibitor.getContact());
        existing.setEmail(exhibitor.getEmail());
        existing.setPhone(exhibitor.getPhone());
        existing.setBooth(exhibitor.getBooth());
        existing.setStatus(exhibitor.getStatus());
        existing.setPackageType(exhibitor.getPackageType());

        return exhibitorRepository.save(existing);
    }

    @Override
    public List<Exhibitor> getExhibitorsByEvent(Long eventId) {
        tenantSecurityService.requireEventInLoggedInPortal(eventId);
        return exhibitorRepository.findByEventId(eventId);
    }

    @Override
    public Exhibitor getExhibitorById(Long exhibitorId) {
        Exhibitor exhibitor = exhibitorRepository.findById(exhibitorId)
                .orElseThrow(() -> new RuntimeException("Exhibitor not found"));

        tenantSecurityService.requireEventInLoggedInPortal(exhibitor.getEvent());
        return exhibitor;
    }

    @Override
    public ExhibitorReportResponse getExhibitorReport(Long eventId) {
        tenantSecurityService.requireEventInLoggedInPortal(eventId);

        ExhibitorReportResponse response = new ExhibitorReportResponse();

        response.setEventId(eventId);
        response.setTotalExhibitors(exhibitorRepository.countByEventId(eventId));
        response.setConfirmedExhibitors(exhibitorRepository.countByEventIdAndStatus(eventId, "Confirmed"));
        response.setPendingExhibitors(exhibitorRepository.countByEventIdAndStatus(eventId, "Pending"));
        response.setTotalBooths(boothRepository.countByEventId(eventId));
        response.setAssignedBooths(boothRepository.countByEventIdAndStatus(eventId, "Assigned"));
        response.setAvailableBooths(boothRepository.countByEventIdAndStatus(eventId, "Available"));
        response.setTotalLeads(leadRepository.countByEventId(eventId));
        response.setConvertedLeads(leadRepository.countByEventIdAndStatus(eventId, "Converted"));

        return response;
    }

    @Override
    public void deleteExhibitor(Long exhibitorId) {
        Exhibitor exhibitor = getExhibitorById(exhibitorId);
        subscriptionLimitService.assertPortalIsWritable(exhibitor.getEvent().getPortal().getId());
        exhibitorRepository.delete(exhibitor);
    }
}
