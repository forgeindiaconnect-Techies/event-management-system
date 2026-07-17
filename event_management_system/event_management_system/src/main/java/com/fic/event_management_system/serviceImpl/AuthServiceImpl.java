package com.fic.event_management_system.serviceImpl;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import com.fic.event_management_system.dto.AuthResponse;
import com.fic.event_management_system.dto.LoginRequest;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.repository.UserRepository;
import com.fic.event_management_system.security.JwtUtil;
import com.fic.event_management_system.service.AuthService;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public AuthServiceImpl(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            JwtUtil jwtUtil) {

        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public AuthResponse login(LoginRequest loginRequest) {

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );
        } catch (BadCredentialsException e) {
            throw new RuntimeException("Invalid email or password");
        }

        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.FALSE.equals(user.getActive())) {
            throw new RuntimeException("User account is inactive");
        }

        String token = jwtUtil.generateToken(user.getEmail());

        String role = user.getRole().getRoleName().name();

        Long portalId = null;
        String portalCode = null;
        String portalName = null;

        if (user.getPortal() != null) {
            portalId = user.getPortal().getId();
            portalCode = user.getPortal().getPortalCode();
            portalName = user.getPortal().getPortalName();
        }

        return new AuthResponse(
                token,
                role,
                user.getEmail(),
                user.getId(),
                portalId,
                portalCode,
                portalName,
                getRedirectPath(role)
        );
    }

    private String getRedirectPath(String role) {

        switch (role) {
            case "SUPER_ADMIN":
                return "/super-admin";

            case "PORTAL_ADMIN":
                return "/admin";

            case "ORGANIZER":
                return "/organizer";

            case "Staff":
                return "/staff";

            case "VOLUNTEER":
                return "/volunteer";

            case "COORDINATOR":
                return "/coordinator";

            case "SPEAKER":
                return "/speaker";

            case "JUDGE":
                return "/judge";

            case "MENTOR":
                return "/mentor";

            case "CHIEF_GUEST":
                return "/chief-guest";

            case "PARTICIPANT":
                return "/participant";

            default:
                return "/login";
        }
    }
}