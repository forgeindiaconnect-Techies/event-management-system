package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.dto.CreateSupportRequestRequest;
import com.fic.event_management_system.dto.UpdateSupportRequestRequest;
import com.fic.event_management_system.entity.SupportRequest;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.SupportRequestPriority;
import com.fic.event_management_system.enums.SupportRequestStatus;
import com.fic.event_management_system.repository.SupportRequestRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.SupportRequestService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class SupportRequestServiceImpl
        implements SupportRequestService {

    private final SupportRequestRepository supportRequestRepository;
    private final TenantSecurityService tenantSecurityService;

    public SupportRequestServiceImpl(
            SupportRequestRepository supportRequestRepository,
            TenantSecurityService tenantSecurityService) {

        this.supportRequestRepository = supportRequestRepository;
        this.tenantSecurityService = tenantSecurityService;
    }

    @Override
    @Transactional
    public SupportRequest createRequest(
            CreateSupportRequestRequest request) {

        User user = tenantSecurityService.getLoggedInUser();

        if (request.getType() == null) {
            throw new RuntimeException("Support request type is required");
        }

        if (request.getSubject() == null
                || request.getSubject().trim().isEmpty()) {
            throw new RuntimeException("Subject is required");
        }

        if (request.getDescription() == null
                || request.getDescription().trim().isEmpty()) {
            throw new RuntimeException("Description is required");
        }

        SupportRequest supportRequest = new SupportRequest();

        supportRequest.setType(request.getType());
        supportRequest.setSubject(request.getSubject().trim());
        supportRequest.setDescription(
                request.getDescription().trim()
        );
        supportRequest.setScreenshotUrl(
                trimToNull(request.getScreenshotUrl())
        );
        supportRequest.setCurrentPage(
                trimToNull(request.getCurrentPage())
        );

        String contactEmail =
                trimToNull(request.getContactEmail());

        supportRequest.setContactEmail(
                contactEmail != null
                        ? contactEmail
                        : user.getEmail()
        );

        supportRequest.setPriority(
                request.getPriority() != null
                        ? request.getPriority()
                        : SupportRequestPriority.MEDIUM
        );

        supportRequest.setStatus(SupportRequestStatus.OPEN);
        supportRequest.setRequesterId(user.getId());
        supportRequest.setRequesterName(getFullName(user));

        if (user.getPortal() != null) {
            supportRequest.setPortalId(user.getPortal().getId());
        } else {
            supportRequest.setPortalId(request.getPortalId());
        }

        SupportRequest saved =
                supportRequestRepository.save(supportRequest);

        String date = LocalDate.now().format(
                DateTimeFormatter.BASIC_ISO_DATE
        );

        saved.setReferenceCode(
                String.format(
                        "SUP-%s-%06d",
                        date,
                        saved.getId()
                )
        );

        return supportRequestRepository.save(saved);
    }

    @Override
    public List<SupportRequest> getMyRequests() {

        User user = tenantSecurityService.getLoggedInUser();

        return supportRequestRepository
                .findByRequesterIdOrderByCreatedAtDesc(
                        user.getId()
                );
    }

    @Override
    public List<SupportRequest> getAllRequests() {

        tenantSecurityService.requireSuperAdmin();

        return supportRequestRepository
                .findAllByOrderByCreatedAtDesc();
    }

    @Override
    public SupportRequest getRequestById(Long requestId) {

        User user = tenantSecurityService.getLoggedInUser();

        SupportRequest supportRequest =
                findRequest(requestId);

        if (!tenantSecurityService.isSuperAdmin()
                && !user.getId().equals(
                        supportRequest.getRequesterId()
                )) {

            throw new RuntimeException(
                    "You cannot view this support request"
            );
        }

        return supportRequest;
    }

    @Override
    @Transactional
    public SupportRequest updateRequest(
            Long requestId,
            UpdateSupportRequestRequest request) {

        tenantSecurityService.requireSuperAdmin();

        SupportRequest supportRequest =
                findRequest(requestId);

        if (request.getPriority() != null) {
            supportRequest.setPriority(
                    request.getPriority()
            );
        }

        if (request.getAdminResponse() != null) {
            supportRequest.setAdminResponse(
                    request.getAdminResponse().trim()
            );
        }

        if (request.getStatus() != null) {
            supportRequest.setStatus(request.getStatus());

            if (request.getStatus()
                    == SupportRequestStatus.RESOLVED
                    || request.getStatus()
                    == SupportRequestStatus.CLOSED) {

                supportRequest.setResolvedAt(
                        LocalDateTime.now()
                );
            } else {
                supportRequest.setResolvedAt(null);
            }
        }

        return supportRequestRepository.save(
                supportRequest
        );
    }

    private SupportRequest findRequest(Long requestId) {
        return supportRequestRepository
                .findById(requestId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Support request not found"
                        )
                );
    }

    private String getFullName(User user) {

        String firstName =
                user.getFirstName() == null
                        ? ""
                        : user.getFirstName().trim();

        String lastName =
                user.getLastName() == null
                        ? ""
                        : user.getLastName().trim();

        String fullName =
                (firstName + " " + lastName).trim();

        return fullName.isEmpty()
                ? user.getEmail()
                : fullName;
    }

    private String trimToNull(String value) {

        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        return trimmed.isEmpty()
                ? null
                : trimmed;
    }
}