package com.fic.event_management_system.service;

import com.fic.event_management_system.dto.AuthResponse;
import com.fic.event_management_system.dto.LoginRequest;

public interface AuthService {

    AuthResponse login(LoginRequest loginRequest);
}
