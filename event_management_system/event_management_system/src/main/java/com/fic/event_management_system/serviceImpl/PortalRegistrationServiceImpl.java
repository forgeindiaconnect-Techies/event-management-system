package com.fic.event_management_system.serviceImpl;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fic.event_management_system.dto.AuthResponse;
import com.fic.event_management_system.dto.CreatePortalRequest;
import com.fic.event_management_system.entity.Portal;
import com.fic.event_management_system.entity.Role;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.RoleName;
import com.fic.event_management_system.enums.NotificationType;
import com.fic.event_management_system.repository.RoleRepository;
import com.fic.event_management_system.repository.UserRepository;
import com.fic.event_management_system.repository.PortalRepository;
import com.fic.event_management_system.security.JwtUtil;
import com.fic.event_management_system.service.PortalRegistrationService;
import com.fic.event_management_system.service.PortalService;
import com.fic.event_management_system.service.SubscriptionService;
import com.fic.event_management_system.service.EmailService;
import com.fic.event_management_system.service.NotificationService;

@Service
public class PortalRegistrationServiceImpl
        implements PortalRegistrationService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PortalService portalService;
    private final JwtUtil jwtUtil;
    private final SubscriptionService subscriptionService;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final PortalRepository portalRepository;

    public PortalRegistrationServiceImpl(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PortalService portalService,
            JwtUtil jwtUtil,
            SubscriptionService subscriptionService,
            NotificationService notificationService,
            EmailService emailService,
            PortalRepository portalRepository
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.portalService = portalService;
        this.jwtUtil = jwtUtil;
        this.subscriptionService = subscriptionService;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.portalRepository = portalRepository;
    }

    @Override
    @Transactional
    public AuthResponse createPortal(CreatePortalRequest request) {

        userRepository.findByEmail(request.getEmail()).ifPresent(existingUser -> {
            Portal existingPortal = existingUser.getPortal();
            if (existingPortal != null && Boolean.TRUE.equals(existingPortal.getDeleted())) {
                existingUser.setActive(false);
                existingUser.setEmail("deleted-" + existingUser.getId() + "-"
                        + System.currentTimeMillis() + "@backrooms.invalid");
                existingUser.setPassword(UUID.randomUUID().toString());
                existingUser.setFirstName("Deleted");
                existingUser.setLastName("Account");
                existingUser.setPhoneNumber(null);
                userRepository.saveAndFlush(existingUser);
                return;
            }
            throw new IllegalStateException("An account with this email already exists");
        });

        if (request.getPortalName() == null || request.getPortalName().isBlank()) {
            throw new IllegalStateException("Portal name is required");
        }

        if (portalRepository.existsActivePortalName(request.getPortalName().trim())) {
            throw new IllegalStateException("A portal with this name already exists");
        }

        Role adminRole = roleRepository
                .findByRoleName(RoleName.PORTAL_ADMIN)
                .orElseThrow(() ->
                        new RuntimeException(
                                "PORTAL_ADMIN role not found"
                        )
                );

        User owner = new User();
        owner.setFirstName(request.getFirstName());
        owner.setLastName(request.getLastName());
        owner.setEmail(request.getEmail());
        owner.setPassword(request.getPassword());
        owner.setPhoneNumber(request.getPhoneNumber());
        owner.setRole(adminRole);
        owner.setActive(true);

        owner = userRepository.save(owner);

        Portal portal = new Portal();
        portal.setPortalName(request.getPortalName());
        portal.setPortalCode(
                generatePortalCode(request.getPortalName())
        );
        portal.setDescription(request.getDescription());
        portal.setCategory(request.getCategory());
        portal.setLogoUrl(request.getLogoUrl());
        portal.setActive(true);
        portal.setAdmin(owner);

        portal = portalService.createPortal(portal);

        owner.setPortal(portal);
        userRepository.save(owner);

        String welcomeDeduplicationKey =
                "PORTAL_WELCOME_" + portal.getId();

        notificationService.createNotification(
                owner,
                portal,
                null,
                NotificationType.PORTAL_CREATED,
                "Your portal is ready",
                "Welcome to FIC BackRooms. Choose Free Trial, Standard, Pro or ProMax to activate your portal.",
                "/subscription",
                welcomeDeduplicationKey
        );

        emailService.queueEmail(
                owner.getEmail(),
                "Welcome to FIC BackRooms - choose your plan",
                "Hello " + owner.getFirstName() + ",\n\n"
                        + "Your portal " + portal.getPortalName()
                        + " has been created successfully.\n"
                        + "Choose Free Trial, Standard, Pro or ProMax to activate your portal.\n\n"
                        + "Portal code: " + portal.getPortalCode() + "\n\n"
                        + "Regards,\nFIC BackRooms",
                NotificationType.PORTAL_CREATED,
                owner,
                portal,
                null,
                welcomeDeduplicationKey,
                LocalDateTime.now()
        );

        String token = jwtUtil.generateToken(owner.getEmail());

        String role = owner
                .getRole()
                .getRoleName()
                .name();

        return new AuthResponse(
                token,
                role,
                owner.getEmail(),
                owner.getId(),
                portal.getId(),
                portal.getPortalCode(),
                portal.getPortalName(),
                "/subscription"
        );
    }

    private String generatePortalCode(String portalName) {
        String prefix = portalName
                .trim()
                .toUpperCase()
                .replaceAll("[^A-Z0-9]", "");

        if (prefix.length() > 6) {
            prefix = prefix.substring(0, 6);
        }

        String random = UUID
                .randomUUID()
                .toString()
                .substring(0, 6)
                .toUpperCase();

        return prefix + "-" + random;
    }
}
