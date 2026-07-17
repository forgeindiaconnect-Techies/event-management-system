package com.fic.event_management_system.controller;

import com.fic.event_management_system.dto.AuthResponse;
import com.fic.event_management_system.dto.CreatePortalRequest;
import com.fic.event_management_system.dto.LoginRequest;
import com.fic.event_management_system.service.AuthService;
import com.fic.event_management_system.service.PortalRegistrationService;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final PortalRegistrationService portalRegistrationService;

    public AuthController(
            AuthService authService,
            PortalRegistrationService portalRegistrationService) {

        this.authService = authService;
        this.portalRegistrationService = portalRegistrationService;
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest loginRequest) {
        return authService.login(loginRequest);
    }

    @PostMapping("/create-portal")
    public ResponseEntity<?> createPortal(@RequestBody CreatePortalRequest request) {
        try {
            return ResponseEntity.ok(portalRegistrationService.createPortal(request));
        } catch (IllegalStateException exception) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", exception.getMessage()));
        }
    }
}
