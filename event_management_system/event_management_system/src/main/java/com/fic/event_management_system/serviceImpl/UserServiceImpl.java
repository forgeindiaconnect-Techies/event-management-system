package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.RoleName;
import com.fic.event_management_system.repository.UserRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.UserService;
import com.fic.event_management_system.service.SubscriptionLimitService;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final TenantSecurityService tenantSecurityService;
    private final SubscriptionLimitService subscriptionLimitService;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(
            UserRepository userRepository,
            TenantSecurityService tenantSecurityService,
            SubscriptionLimitService subscriptionLimitService,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.subscriptionLimitService = subscriptionLimitService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public User createUser(User user) {
        tenantSecurityService.requirePortalAdminOrOrganizer();
        Long portalId = tenantSecurityService.getLoggedInPortalId();
        subscriptionLimitService.assertCanCreateUser(portalId);

        if (user.getRole() != null
                && user.getRole().getRoleName() == RoleName.ORGANIZER) {
            subscriptionLimitService.assertCanAddOrganizer(portalId);
        }

        user.setPortal(tenantSecurityService.getLoggedInPortal());
        return userRepository.save(user);
    }

    @Override
    public User getUserById(Long id) {
        return tenantSecurityService.getUserFromLoggedInPortal(id);
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findByPortalIdAndActiveTrue(tenantSecurityService.getLoggedInPortalId());
    }

    @Override
    public User updateUser(Long id, User user) {
        User existingUser = tenantSecurityService.getUserFromLoggedInPortal(id);

        existingUser.setFirstName(user.getFirstName());
        existingUser.setLastName(user.getLastName());
        existingUser.setEmail(user.getEmail());
        existingUser.setPhoneNumber(user.getPhoneNumber());

        if (user.getPassword() != null && !user.getPassword().isBlank()) {
            existingUser.setPassword(user.getPassword());
        }

        if (tenantSecurityService.isPortalAdmin()) {
            existingUser.setRole(user.getRole());
            existingUser.setActive(user.getActive());
        }

        return userRepository.save(existingUser);
    }

    @Override
    public void changeOwnPassword(String currentPassword, String newPassword) {
        User user = tenantSecurityService.getLoggedInUser();

        if (currentPassword == null || currentPassword.isBlank()) {
            throw new RuntimeException("Current password is required");
        }
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new RuntimeException("New password must contain at least 6 characters");
        }
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new RuntimeException("New password must be different from the current password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Override
    public List<User> getOrganizersByPortal(Long portalId) {
        tenantSecurityService.requireSamePortal(portalId);

        return userRepository.findByPortalIdAndRole_RoleName(
                tenantSecurityService.getLoggedInPortalId(),
                RoleName.ORGANIZER
        );
    }

    @Override
    public List<User> getUsersByPortal(Long portalId) {
        tenantSecurityService.requireSamePortal(portalId);
        return userRepository.findByPortalIdAndActiveTrue(tenantSecurityService.getLoggedInPortalId());
    }

    @Override
    public void deletePortalUser(Long userId) {
        tenantSecurityService.requirePortalAdminOrOrganizer();

        User loggedInUser = tenantSecurityService.getLoggedInUser();
        User user = tenantSecurityService.getUserFromLoggedInPortal(userId);

        if (loggedInUser.getId().equals(user.getId())) {
            throw new RuntimeException("You cannot delete your own account");
        }

        if (user.getRole() != null
                && user.getRole().getRoleName() == RoleName.PORTAL_ADMIN) {
            throw new RuntimeException("Portal admin accounts cannot be deleted here");
        }

        String originalEmail = user.getEmail() == null ? "user" : user.getEmail();
        user.setFirstName("Deleted");
        user.setLastName("Account");
        user.setEmail("deleted-" + user.getId() + "-" + UUID.randomUUID() + "-" + originalEmail);
        user.setPhoneNumber(null);
        user.setPassword(UUID.randomUUID().toString());
        user.setActive(false);
        user.setPortal(null);
        userRepository.save(user);
    }
}
