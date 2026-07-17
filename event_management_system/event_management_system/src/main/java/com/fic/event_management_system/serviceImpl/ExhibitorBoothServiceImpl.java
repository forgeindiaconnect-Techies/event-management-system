package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.Exhibitor;
import com.fic.event_management_system.entity.ExhibitorBooth;
import com.fic.event_management_system.repository.ExhibitorBoothRepository;
import com.fic.event_management_system.repository.ExhibitorRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.ExhibitorBoothService;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ExhibitorBoothServiceImpl implements ExhibitorBoothService {

    private final ExhibitorBoothRepository boothRepository;
    private final ExhibitorRepository exhibitorRepository;
    private final TenantSecurityService tenantSecurityService;

    public ExhibitorBoothServiceImpl(
            ExhibitorBoothRepository boothRepository,
            ExhibitorRepository exhibitorRepository,
            TenantSecurityService tenantSecurityService) {

        this.boothRepository = boothRepository;
        this.exhibitorRepository = exhibitorRepository;
        this.tenantSecurityService = tenantSecurityService;
    }

    @Override
    public ExhibitorBooth createBooth(ExhibitorBooth booth) {
        attachReferences(booth);
        return boothRepository.save(booth);
    }

    @Override
    public ExhibitorBooth updateBooth(Long boothId, ExhibitorBooth booth) {
        ExhibitorBooth existing = getBoothById(boothId);

        existing.setBoothNo(booth.getBoothNo());
        existing.setHall(booth.getHall());
        existing.setSize(booth.getSize());
        existing.setType(booth.getType());
        existing.setStatus(booth.getStatus());

        if (booth.getExhibitor() != null && booth.getExhibitor().getId() != null) {
            Exhibitor exhibitor = getExhibitorFromSameEvent(
                    booth.getExhibitor().getId(),
                    existing.getEvent().getId()
            );
            existing.setExhibitor(exhibitor);
        } else {
            existing.setExhibitor(null);
        }

        return boothRepository.save(existing);
    }

    @Override
    public List<ExhibitorBooth> getBoothsByEvent(Long eventId) {
        tenantSecurityService.requireEventInLoggedInPortal(eventId);
        return boothRepository.findByEventId(eventId);
    }

    @Override
    public ExhibitorBooth getBoothById(Long boothId) {
        ExhibitorBooth booth = boothRepository.findById(boothId)
                .orElseThrow(() -> new RuntimeException("Booth not found"));

        tenantSecurityService.requireEventInLoggedInPortal(booth.getEvent());
        return booth;
    }

    @Override
    public void deleteBooth(Long boothId) {
        ExhibitorBooth booth = getBoothById(boothId);
        boothRepository.delete(booth);
    }

    private void attachReferences(ExhibitorBooth booth) {
        if (booth.getEvent() == null || booth.getEvent().getId() == null) {
            throw new RuntimeException("Event is required for booth");
        }

        Event event = tenantSecurityService.getEventFromLoggedInPortal(booth.getEvent().getId());
        booth.setEvent(event);

        if (booth.getExhibitor() != null && booth.getExhibitor().getId() != null) {
            Exhibitor exhibitor = getExhibitorFromSameEvent(
                    booth.getExhibitor().getId(),
                    event.getId()
            );
            booth.setExhibitor(exhibitor);
        }
    }

    private Exhibitor getExhibitorFromSameEvent(Long exhibitorId, Long eventId) {
        Exhibitor exhibitor = exhibitorRepository.findById(exhibitorId)
                .orElseThrow(() -> new RuntimeException("Exhibitor not found"));

        tenantSecurityService.requireEventInLoggedInPortal(exhibitor.getEvent());

        if (!exhibitor.getEvent().getId().equals(eventId)) {
            throw new RuntimeException("Exhibitor does not belong to this event");
        }

        return exhibitor;
    }
}