package com.fic.event_management_system.service;

import com.fic.event_management_system.dto.AuthResponse;
import com.fic.event_management_system.dto.CreatePortalRequest;

public interface PortalRegistrationService {

    AuthResponse createPortal(CreatePortalRequest request);

}