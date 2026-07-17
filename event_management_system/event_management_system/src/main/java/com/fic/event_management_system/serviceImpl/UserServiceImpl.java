package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.RoleName;
import com.fic.event_management_system.repository.UserRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.UserService;
import com.fic.event_management_system.service.SubscriptionLimitService;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final TenantSecurityService tenantSecurityService;
    private final SubscriptionLimitService subscriptionLimitService;

    public UserServiceImpl(
            UserRepository userRepository,
            TenantSecurityService tenantSecurityService,
            SubscriptionLimitService subscriptionLimitService) {

        this.userRepository = userRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.subscriptionLimitService = subscriptionLimitService;
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
        return userRepository.findByPortalId(tenantSecurityService.getLoggedInPortalId());
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
        return userRepository.findByPortalId(tenantSecurityService.getLoggedInPortalId());
    }
}
