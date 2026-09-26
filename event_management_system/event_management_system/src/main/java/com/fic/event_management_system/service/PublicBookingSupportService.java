package com.fic.event_management_system.service;

import com.fic.event_management_system.dto.CreatePublicBookingSupportRequest;
import com.fic.event_management_system.dto.UpdatePublicBookingSupportRequest;
import com.fic.event_management_system.entity.PublicBookingSupportRequest;

import java.util.List;

public interface PublicBookingSupportService {
    PublicBookingSupportRequest createRequest(CreatePublicBookingSupportRequest request);
    List<PublicBookingSupportRequest> getRequestsByBookingType(String bookingType);
    List<PublicBookingSupportRequest> getAllRequestsForSuperAdmin();
    PublicBookingSupportRequest getRequestById(Long id);
    PublicBookingSupportRequest updateRequest(Long id, UpdatePublicBookingSupportRequest request);
}
