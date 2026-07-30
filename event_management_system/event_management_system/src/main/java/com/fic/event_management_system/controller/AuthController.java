package com.fic.event_management_system.controller;

import com.fic.event_management_system.dto.AuthResponse;
import com.fic.event_management_system.dto.CreatePortalRequest;
import com.fic.event_management_system.dto.LoginRequest;
import com.fic.event_management_system.service.AuthService;
import com.fic.event_management_system.service.PortalRegistrationService;
import com.fic.event_management_system.repository.UserRepository;

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
    private final UserRepository userRepository;

    public AuthController(
            AuthService authService,
            PortalRegistrationService portalRegistrationService,
            UserRepository userRepository) {

        this.authService = authService;
        this.portalRegistrationService = portalRegistrationService;
        this.userRepository = userRepository;
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

    @GetMapping("/portal-owner-email-availability")
    public Map<String, Object> checkPortalOwnerEmail(
            @RequestParam String email) {

        String normalizedEmail = email == null
                ? ""
                : email.trim().toLowerCase();

        boolean validFormat = normalizedEmail.matches(
                "^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$"
                        .toLowerCase()
        );
        boolean available = validFormat
                && userRepository.findByEmail(normalizedEmail).isEmpty();

        return Map.of(
                "available", available,
                "message", !validFormat
                        ? "Enter a valid email address"
                        : available
                                ? "Email is available"
                                : "This email is already registered"
        );
    }
}
