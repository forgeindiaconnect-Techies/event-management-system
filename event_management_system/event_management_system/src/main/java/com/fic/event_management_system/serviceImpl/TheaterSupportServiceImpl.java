package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.dto.CreateTheaterSupportRequest;
import com.fic.event_management_system.dto.UpdateTheaterSupportRequest;
import com.fic.event_management_system.entity.TheaterSupportRequest;
import com.fic.event_management_system.repository.TheaterSupportRequestRepository;
import com.fic.event_management_system.service.TheaterSupportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@SuppressWarnings("null")
public class TheaterSupportServiceImpl implements TheaterSupportService {

    @Autowired
    private TheaterSupportRequestRepository theaterSupportRequestRepository;

    @Override
    @Transactional
    public TheaterSupportRequest createRequest(CreateTheaterSupportRequest request) {
        if (request.getSubject() == null || request.getSubject().trim().isEmpty()) {
            throw new RuntimeException("Subject is required");
        }
        if (request.getDescription() == null || request.getDescription().trim().isEmpty()) {
            throw new RuntimeException("Description is required");
        }

        TheaterSupportRequest entity = new TheaterSupportRequest();
        entity.setTheaterPortalId(request.getTheaterPortalId());
        entity.setTheaterName(request.getTheaterName());
        entity.setCity(request.getCity());
        entity.setRequesterId(request.getRequesterId());
        entity.setRequesterName(request.getRequesterName() != null ? request.getRequesterName() : "Theater Staff");
        entity.setDutyRole(request.getDutyRole() != null ? request.getDutyRole() : "THEATER_STAFF");
        entity.setContactEmail(request.getContactEmail() != null ? request.getContactEmail().trim() : "support@theater.com");
        entity.setContactPhone(request.getContactPhone());
        entity.setCategory(request.getCategory() != null ? request.getCategory() : "GENERAL");
        entity.setPriority(request.getPriority() != null ? request.getPriority() : "MEDIUM");
        entity.setStatus("OPEN");
        entity.setSubject(request.getSubject().trim());
        entity.setDescription(request.getDescription().trim());
        entity.setScreenshotUrl(request.getScreenshotUrl());

        TheaterSupportRequest saved = theaterSupportRequestRepository.save(entity);

        String date = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        saved.setReferenceCode(String.format("THTR-%s-%06d", date, saved.getId()));

        return theaterSupportRequestRepository.save(saved);
    }

    @Override
    public List<TheaterSupportRequest> getMyTheaterRequests(Long theaterPortalId) {
        if (theaterPortalId == null) {
            return theaterSupportRequestRepository.findAllByOrderByCreatedAtDesc();
        }
        return theaterSupportRequestRepository.findByTheaterPortalIdOrderByCreatedAtDesc(theaterPortalId);
    }

    @Override
    public List<TheaterSupportRequest> getAllRequestsForSuperAdmin() {
        return theaterSupportRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public TheaterSupportRequest getRequestById(Long id) {
        return theaterSupportRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Theater support request not found with id: " + id));
    }

    @Override
    @Transactional
    public TheaterSupportRequest updateRequest(Long id, UpdateTheaterSupportRequest request) {
        TheaterSupportRequest entity = getRequestById(id);

        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            entity.setStatus(request.getStatus().trim());
            if ("RESOLVED".equalsIgnoreCase(request.getStatus()) || "CLOSED".equalsIgnoreCase(request.getStatus())) {
                if (entity.getResolvedAt() == null) {
                    entity.setResolvedAt(LocalDateTime.now());
                }
            } else {
                entity.setResolvedAt(null);
            }
        }

        if (request.getPriority() != null && !request.getPriority().trim().isEmpty()) {
            entity.setPriority(request.getPriority().trim());
        }

        if (request.getAdminResponse() != null) {
            entity.setAdminResponse(request.getAdminResponse().trim());
        }

        return theaterSupportRequestRepository.save(entity);
    }
}
