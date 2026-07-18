package com.fic.event_management_system.service;

import com.fic.event_management_system.dto.CreateSupportRequestRequest;
import com.fic.event_management_system.dto.UpdateSupportRequestRequest;
import com.fic.event_management_system.entity.SupportRequest;

import java.util.List;

public interface SupportRequestService {

    SupportRequest createRequest(
            CreateSupportRequestRequest request
    );

    List<SupportRequest> getMyRequests();

    List<SupportRequest> getAllRequests();

    SupportRequest getRequestById(Long requestId);

    SupportRequest updateRequest(
            Long requestId,
            UpdateSupportRequestRequest request
    );
}