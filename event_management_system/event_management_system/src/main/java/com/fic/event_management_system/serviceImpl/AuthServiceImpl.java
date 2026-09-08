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

    @org.springframework.beans.factory.annotation.Autowired
    private com.fic.event_management_system.repository.TheaterUserRepository theaterUserRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.fic.event_management_system.repository.TheaterPortalRepository theaterPortalRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.fic.event_management_system.repository.TheaterInvitationRepository theaterInvitationRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

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
        // Check dedicated 'theater_users' table first (by email or auto-generated EMP ID username)
        java.util.Optional<com.fic.event_management_system.entity.TheaterUser> tuOpt = theaterUserRepository.findByEmailOrUsername(loginRequest.getEmail(), loginRequest.getEmail());
        if (tuOpt.isPresent()) {
            com.fic.event_management_system.entity.TheaterUser tu = tuOpt.get();
            if (passwordEncoder.matches(loginRequest.getPassword(), tu.getPassword())) {
                String token = jwtUtil.generateToken(tu.getEmail());
                
                com.fic.event_management_system.entity.TheaterPortal portal = tu.getTheaterPortal();
                if (portal == null) {
                    portal = theaterPortalRepository.findByAdminUserEmail(tu.getEmail()).orElse(null);
                }

                String pCode = portal != null ? portal.getPortalCode() : "TH-000000";
                String pName = portal != null ? portal.getPortalName() : "Cinema Partner";
                Long pId = portal != null ? portal.getId() : null;

                String userRole = tu.getRole() != null ? tu.getRole() : "THEATER_STAFF";
                String dutyRole = tu.getDutyRole() != null ? tu.getDutyRole() : "";

                // Check invitations table to resolve accurate duty role if user record was generic
                if (pId != null || portal != null) {
                    Long checkPortalId = pId != null ? pId : (portal != null ? portal.getId() : 1L);
                    java.util.List<com.fic.event_management_system.entity.TheaterInvitation> invs = 
                            theaterInvitationRepository.findByTheaterPortalId(checkPortalId);
                    for (com.fic.event_management_system.entity.TheaterInvitation inv : invs) {
                        if (inv.getEmail() != null && inv.getEmail().trim().equalsIgnoreCase(tu.getEmail().trim())) {
                            if (inv.getDutyRole() != null && !inv.getDutyRole().isBlank()) {
                                dutyRole = inv.getDutyRole();
                            }
                            if (inv.getRoleName() != null) {
                                userRole = inv.getRoleName().name();
                            }
                            break;
                        }
                    }
                }

                // If user is the portal admin/creator, keep owner
                boolean isPortalAdmin = portal != null && portal.getAdminUser() != null && portal.getAdminUser().getId().equals(tu.getId());

                String redirectPath = "/theater/dashboard";
                if (!isPortalAdmin) {
                    if (dutyRole.toLowerCase().contains("cashier") || userRole.toLowerCase().contains("cashier")) {
                        redirectPath = "/theater/cashier-dashboard";
                        userRole = "THEATER_STAFF";
                        if (dutyRole.isBlank()) dutyRole = "Box Office Cashier";
                    } else if (dutyRole.toLowerCase().contains("usher") || dutyRole.toLowerCase().contains("gate") || userRole.toLowerCase().contains("usher")) {
                        redirectPath = "/theater/usher-dashboard";
                        userRole = "THEATER_STAFF";
                        if (dutyRole.isBlank()) dutyRole = "Gate Entry Usher";
                    } else if (userRole.contains("MANAGER") || dutyRole.toLowerCase().contains("manager")) {
                        redirectPath = "/theater/manager-dashboard";
                        userRole = "THEATER_MANAGER";
                        if (dutyRole.isBlank()) dutyRole = "Branch Manager";
                    } else {
                        // Default any invited theater staff to cashier dashboard
                        redirectPath = "/theater/cashier-dashboard";
                        userRole = "THEATER_STAFF";
                        dutyRole = "Box Office Cashier";
                    }
                    // Auto-sync database user record
                    tu.setRole(userRole);
                    tu.setDutyRole(dutyRole);
                    theaterUserRepository.save(tu);
                } else {
                    userRole = "THEATER_OWNER";
                    redirectPath = "/theater/dashboard";
                }

                return new AuthResponse(
                        token,
                        userRole,
                        tu.getEmail(),
                        tu.getId(),
                        pId,
                        pCode,
                        pName,
                        redirectPath,
                        dutyRole
                );
            }
        }

        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (Boolean.TRUE.equals(user.getPasswordSetupRequired())) {
            throw new RuntimeException("Set your password from the link sent to your email before signing in.");
        }

        if (Boolean.FALSE.equals(user.getActive())) {
            throw new RuntimeException("User account is inactive");
        }

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
                getRedirectPath(user, role)
        );
    }

    private String getRedirectPath(User user, String role) {
        if (user.getPortal() != null && com.fic.event_management_system.enums.PortalType.THEATER_PORTAL.equals(user.getPortal().getPortalType())) {
            return "/theater/dashboard";
        }

        switch (role) {
            case "SUPER_ADMIN":
                return "/super-admin";

            case "THEATER_OWNER":
            case "THEATER_MANAGER":
                return "/theater/dashboard";

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

            case "TRAINER":
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
