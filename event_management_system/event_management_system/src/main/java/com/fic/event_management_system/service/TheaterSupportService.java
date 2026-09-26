package com.fic.event_management_system.service;

import com.fic.event_management_system.dto.CreateTheaterSupportRequest;
import com.fic.event_management_system.dto.UpdateTheaterSupportRequest;
import com.fic.event_management_system.entity.TheaterSupportRequest;

import java.util.List;

public interface TheaterSupportService {
    TheaterSupportRequest createRequest(CreateTheaterSupportRequest request);
    List<TheaterSupportRequest> getMyTheaterRequests(Long theaterPortalId);
    List<TheaterSupportRequest> getAllRequestsForSuperAdmin();
    TheaterSupportRequest getRequestById(Long id);
    TheaterSupportRequest updateRequest(Long id, UpdateTheaterSupportRequest request);
}
