package com.fic.event_management_system.security;

import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.Portal;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.repository.EventRepository;
import com.fic.event_management_system.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class TenantSecurityService {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;

    public TenantSecurityService(
            UserRepository userRepository,
            EventRepository eventRepository) {

        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
    }

    public User getLoggedInUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Login required");
        }

        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged-in user not found"));
    }

    public Portal getLoggedInPortal() {
        User user = getLoggedInUser();

        if (user.getPortal() == null) {
            throw new RuntimeException("Logged-in user is not linked to a portal");
        }

        return user.getPortal();
    }

    public Long getLoggedInPortalId() {
        return getLoggedInPortal().getId();
    }

    public boolean isSuperAdmin() {
        return hasRole("SUPER_ADMIN");
    }

    public boolean isPortalAdmin() {
        return hasRole("PORTAL_ADMIN");
    }

    public boolean isOrganizer() {
        return hasRole("ORGANIZER");
    }

    public boolean hasRole(String expectedRole) {
        User user = getLoggedInUser();

        if (user.getRole() == null || user.getRole().getRoleName() == null) {
            return false;
        }

        return expectedRole.equalsIgnoreCase(
                String.valueOf(user.getRole().getRoleName())
        );
    }

    public void requireSuperAdmin() {
        if (!isSuperAdmin()) {
            throw new RuntimeException("Only super admin is allowed");
        }
    }

    public void requirePortalAdminOrOrganizer() {
        if (isSuperAdmin()) {
            return;
        }

        if (!isPortalAdmin() && !isOrganizer()) {
            throw new RuntimeException("Only portal admins and organizers are allowed");
        }
    }

    public void requireSamePortal(Long portalId) {
        if (isSuperAdmin()) {
            return;
        }

        Long loggedInPortalId = getLoggedInPortalId();

        if (portalId == null || !loggedInPortalId.equals(portalId)) {
            throw new RuntimeException("Access denied for this portal");
        }
    }

    public void requireEventInLoggedInPortal(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        requireEventInLoggedInPortal(event);
    }

    public void requireEventInLoggedInPortal(Event event) {
        if (event == null || event.getPortal() == null) {
            throw new RuntimeException("Event is not linked to a portal");
        }

        requireSamePortal(event.getPortal().getId());
    }

    public void requireUserInLoggedInPortal(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        requireUserInLoggedInPortal(user);
    }

    public void requireUserInLoggedInPortal(User user) {
        if (isSuperAdmin()) {
            return;
        }

        if (user == null || user.getPortal() == null) {
            throw new RuntimeException("User is not linked to a portal");
        }

        requireSamePortal(user.getPortal().getId());
    }

    public Event getEventFromLoggedInPortal(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        requireEventInLoggedInPortal(event);

        return event;
    }

    public User getUserFromLoggedInPortal(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        requireUserInLoggedInPortal(user);

        return user;
    }
}