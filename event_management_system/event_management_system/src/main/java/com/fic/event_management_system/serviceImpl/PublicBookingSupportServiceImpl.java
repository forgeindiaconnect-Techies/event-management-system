package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.dto.CreatePublicBookingSupportRequest;
import com.fic.event_management_system.dto.UpdatePublicBookingSupportRequest;
import com.fic.event_management_system.entity.PublicBookingSupportRequest;
import com.fic.event_management_system.repository.PublicBookingSupportRequestRepository;
import com.fic.event_management_system.service.PublicBookingSupportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@SuppressWarnings("null")
public class PublicBookingSupportServiceImpl implements PublicBookingSupportService {

    @Autowired
    private PublicBookingSupportRequestRepository publicBookingSupportRequestRepository;

    @Override
    @Transactional
    public PublicBookingSupportRequest createRequest(CreatePublicBookingSupportRequest request) {
        if (request.getCustomerEmail() == null || request.getCustomerEmail().trim().isEmpty()) {
            throw new RuntimeException("Contact email is required");
        }
        if (request.getSubject() == null || request.getSubject().trim().isEmpty()) {
            throw new RuntimeException("Subject is required");
        }
        if (request.getDescription() == null || request.getDescription().trim().isEmpty()) {
            throw new RuntimeException("Description is required");
        }

        PublicBookingSupportRequest entity = new PublicBookingSupportRequest();
        entity.setBookingType(request.getBookingType() != null ? request.getBookingType().toUpperCase() : "MOVIE");
        entity.setBookingReference(request.getBookingReference());
        entity.setCustomerName(request.getCustomerName() != null ? request.getCustomerName().trim() : "Valued Customer");
        entity.setCustomerEmail(request.getCustomerEmail().trim());
        entity.setCustomerPhone(request.getCustomerPhone());
        entity.setTitleOrVenueName(request.getTitleOrVenueName());
        entity.setCategory(request.getCategory() != null ? request.getCategory() : "GENERAL");
        entity.setPriority(request.getPriority() != null ? request.getPriority() : "MEDIUM");
        entity.setStatus("OPEN");
        entity.setSubject(request.getSubject().trim());
        entity.setDescription(request.getDescription().trim());

        PublicBookingSupportRequest saved = publicBookingSupportRequestRepository.save(entity);

        String date = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        saved.setReferenceCode(String.format("PUB-%s-%06d", date, saved.getId()));

        return publicBookingSupportRequestRepository.save(saved);
    }

    @Override
    public List<PublicBookingSupportRequest> getRequestsByBookingType(String bookingType) {
        if (bookingType == null || bookingType.trim().isEmpty()) {
            return publicBookingSupportRequestRepository.findAllByOrderByCreatedAtDesc();
        }
        return publicBookingSupportRequestRepository.findByBookingTypeOrderByCreatedAtDesc(bookingType.toUpperCase());
    }

    @Override
    public List<PublicBookingSupportRequest> getAllRequestsForSuperAdmin() {
        return publicBookingSupportRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public PublicBookingSupportRequest getRequestById(Long id) {
        return publicBookingSupportRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Public ticket support request not found with id: " + id));
    }

    @Override
    @Transactional
    public PublicBookingSupportRequest updateRequest(Long id, UpdatePublicBookingSupportRequest request) {
        PublicBookingSupportRequest entity = getRequestById(id);

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

        if (request.getRefundProcessed() != null) {
            entity.setRefundProcessed(request.getRefundProcessed());
        }

        return publicBookingSupportRequestRepository.save(entity);
    }
}
