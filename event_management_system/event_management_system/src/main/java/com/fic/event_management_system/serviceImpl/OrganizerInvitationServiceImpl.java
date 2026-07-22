package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.dto.AcceptInvitationRequest;
import com.fic.event_management_system.dto.InviteOrganizerRequest;
import com.fic.event_management_system.entity.OrganizerInvitation;
import com.fic.event_management_system.entity.Portal;
import com.fic.event_management_system.entity.Role;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.InvitationStatus;
import com.fic.event_management_system.enums.NotificationType;
import com.fic.event_management_system.enums.RoleName;
import com.fic.event_management_system.repository.OrganizerInvitationRepository;
import com.fic.event_management_system.repository.PortalRepository;
import com.fic.event_management_system.repository.RoleRepository;
import com.fic.event_management_system.repository.UserRepository;
import com.fic.event_management_system.service.OrganizerInvitationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.fic.event_management_system.service.EmailService;
import com.fic.event_management_system.service.NotificationService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class OrganizerInvitationServiceImpl implements OrganizerInvitationService {

    @Value("${frontend.url}")
    private String frontendUrl;

    private final OrganizerInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PortalRepository portalRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    public OrganizerInvitationServiceImpl(
            OrganizerInvitationRepository invitationRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PortalRepository portalRepository,
            EmailService emailService,
            NotificationService notificationService) {

        this.invitationRepository = invitationRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.portalRepository = portalRepository;
        this.emailService = emailService;
        this.notificationService = notificationService;
    }

    @Override
    public OrganizerInvitation inviteOrganizer(InviteOrganizerRequest request) {

    	Portal portal = portalRepository.findById(request.getPortalId())
    	        .orElseThrow(() -> new RuntimeException("Portal not found"));

    	User invitedBy = userRepository.findById(request.getInvitedById())
    	        .orElseThrow(() -> new RuntimeException("Invited by user not found"));

    	if (invitationRepository.existsByEmailAndPortalIdAndStatus(
    	        request.getEmail(),
    	        request.getPortalId(),
    	        InvitationStatus.PENDING
    	)) {
    	    throw new RuntimeException("Pending invitation already exists for this organizer in this portal");
    	}

        OrganizerInvitation invitation = new OrganizerInvitation();
        invitation.setEmail(request.getEmail());
        invitation.setPortal(portal);
        invitation.setInvitedBy(invitedBy);

        return createInvitation(invitation);
    }

    @Override
    public OrganizerInvitation createInvitation(OrganizerInvitation invitation) {

        invitation.setToken(UUID.randomUUID().toString());
        invitation.setStatus(InvitationStatus.PENDING);
        invitation.setExpiryDate(LocalDateTime.now().plusDays(7));

        OrganizerInvitation savedInvitation = invitationRepository.save(invitation);

        String invitationLink =
                frontendUrl + "/invitation/accept/" + savedInvitation.getToken();

        String portalName = savedInvitation.getPortal().getPortalName();
        String invitedByName = savedInvitation.getInvitedBy().getFirstName() + " " +
                savedInvitation.getInvitedBy().getLastName();

        String subject = "Organizer invitation for " + portalName;

        String body =
                "Hello,\n\n" +
                invitedByName + " has invited you to join " + portalName +
                " as an Organizer.\n\n" +
                "Use the link below to accept the invitation and create your organizer account:\n\n" +
                invitationLink +
                "\n\nThis invitation expires in 7 days.\n\n" +
                "If you were not expecting this invitation, you can ignore this email.\n\n" +
                "Regards,\n" + portalName;

        emailService.queueEmail(
                savedInvitation.getEmail(),
                subject,
                body,
                NotificationType.USER_INVITED,
                userRepository.findByEmail(savedInvitation.getEmail()).orElse(null),
                savedInvitation.getPortal(),
                null,
                "ORGANIZER_INVITATION_" + savedInvitation.getId(),
                LocalDateTime.now()
        );

        notificationService.createNotification(
                savedInvitation.getInvitedBy(),
                savedInvitation.getPortal(),
                null,
                NotificationType.USER_INVITED,
                "Organizer invitation sent",
                "Invitation sent to " + savedInvitation.getEmail() + " as Organizer.",
                "/admin/organizers",
                "ORGANIZER_INVITATION_SENT_" + savedInvitation.getId()
                        + "_ACTOR_" + savedInvitation.getInvitedBy().getId()
        );

        userRepository.findByEmail(savedInvitation.getEmail()).ifPresent(existingUser ->
                notificationService.createNotification(
                        existingUser,
                        savedInvitation.getPortal(),
                        null,
                        NotificationType.USER_INVITED,
                        "New organizer invitation",
                        "You were invited to join " + portalName + " as an Organizer.",
                        "/invitation/accept/" + savedInvitation.getToken(),
                        "ORGANIZER_INVITATION_RECEIVED_" + savedInvitation.getId()
                                + "_USER_" + existingUser.getId()
                ));

        return savedInvitation;
    }

    @Override
    public OrganizerInvitation getInvitationByToken(String token) {
        return invitationRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid invitation token"));
    }

    @Override
    public List<OrganizerInvitation> getAllInvitations() {
        return invitationRepository.findAll();
    }

    @Override
    public User acceptInvitation(String token, AcceptInvitationRequest request) {

        OrganizerInvitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid invitation token"));

        if (invitation.getStatus() == InvitationStatus.ACCEPTED) {
            throw new RuntimeException("Invitation already accepted");
        }

        if (invitation.getStatus() == InvitationStatus.REJECTED) {
            throw new RuntimeException("Invitation was rejected");
        }

        if (invitation.getStatus() == InvitationStatus.EXPIRED) {
            throw new RuntimeException("Invitation expired");
        }

        if (invitation.getExpiryDate().isBefore(LocalDateTime.now())) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new RuntimeException("Invitation expired");
        }

        if (userRepository.findByEmail(invitation.getEmail()).isPresent()) {
            throw new RuntimeException("User already exists with this email");
        }

        Role organizerRole = roleRepository.findByRoleName(RoleName.ORGANIZER)
                .orElseThrow(() -> new RuntimeException("Organizer role not found"));

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(invitation.getEmail());
        user.setPassword(request.getPassword());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(organizerRole);
        user.setPortal(invitation.getPortal());
        user.setActive(true);

        User savedUser = userRepository.save(user);

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitationRepository.save(invitation);

        notificationService.createNotification(
                invitation.getInvitedBy(),
                invitation.getPortal(),
                null,
                NotificationType.INVITATION_ACCEPTED,
                "Organizer invitation accepted",
                savedUser.getFirstName() + " " + savedUser.getLastName()
                        + " joined " + invitation.getPortal().getPortalName()
                        + " as an organizer.",
                "/admin",
                "ORGANIZER_INVITATION_ACCEPTED_" + invitation.getId()
        );

        return savedUser;
    }

    @Override
    public User addOrganizerManually(AcceptInvitationRequest request) {
        if (request.getPortalId() == null || request.getInvitedById() == null) {
            throw new RuntimeException("Portal and administrator details are required");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new RuntimeException("Organizer email is required for login");
        }
        if (request.getFirstName() == null || request.getFirstName().isBlank()
                || request.getLastName() == null || request.getLastName().isBlank()) {
            throw new RuntimeException("Organizer first name and last name are required");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new RuntimeException("Password must contain at least 6 characters");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new RuntimeException("A user already exists with this email");
        }

        Portal portal = portalRepository.findById(request.getPortalId())
                .orElseThrow(() -> new RuntimeException("Portal not found"));
        User invitedBy = userRepository.findById(request.getInvitedById())
                .orElseThrow(() -> new RuntimeException("Administrator not found"));

        if (invitedBy.getPortal() == null
                || !invitedBy.getPortal().getId().equals(portal.getId())) {
            throw new RuntimeException("Administrator does not belong to this portal");
        }

        Role organizerRole = roleRepository.findByRoleName(RoleName.ORGANIZER)
                .orElseThrow(() -> new RuntimeException("Organizer role not found"));

        User organizer = new User();
        organizer.setFirstName(request.getFirstName().trim());
        organizer.setLastName(request.getLastName().trim());
        organizer.setEmail(normalizedEmail);
        organizer.setPhoneNumber(request.getPhoneNumber());
        organizer.setPassword(request.getPassword());
        organizer.setRole(organizerRole);
        organizer.setPortal(portal);
        organizer.setActive(true);

        User savedUser = userRepository.save(organizer);

        notificationService.createNotification(
                invitedBy,
                portal,
                null,
                NotificationType.INVITATION_ACCEPTED,
                "Organizer added manually",
                savedUser.getFirstName() + " " + savedUser.getLastName()
                        + " was added directly as an organizer.",
                "/admin/organizers",
                "ORGANIZER_MANUAL_" + savedUser.getId()
        );

        notificationService.createNotification(
                savedUser,
                portal,
                null,
                NotificationType.USER_INVITED,
                "Your organizer account is ready",
                "You were added to " + portal.getPortalName()
                        + " as an Organizer. Sign in using your temporary password.",
                "/organizer",
                "ORGANIZER_MANUAL_" + savedUser.getId() + "_USER"
        );

        return savedUser;
    }

    @Override
    public String rejectInvitation(String token) {

        OrganizerInvitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid invitation token"));

        if (invitation.getStatus() == InvitationStatus.ACCEPTED) {
            throw new RuntimeException("Invitation already accepted");
        }

        if (invitation.getStatus() == InvitationStatus.REJECTED) {
            throw new RuntimeException("Invitation already rejected");
        }

        if (invitation.getStatus() == InvitationStatus.EXPIRED) {
            throw new RuntimeException("Invitation expired");
        }

        if (invitation.getExpiryDate().isBefore(LocalDateTime.now())) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new RuntimeException("Invitation expired");
        }

        invitation.setStatus(InvitationStatus.REJECTED);
        invitationRepository.save(invitation);

        notificationService.createNotification(
                invitation.getInvitedBy(),
                invitation.getPortal(),
                null,
                NotificationType.INVITATION_REJECTED,
                "Organizer invitation declined",
                invitation.getEmail() + " declined the organizer invitation.",
                "/admin",
                "ORGANIZER_INVITATION_REJECTED_" + invitation.getId()
        );

        return "Invitation rejected successfully";
    }
}
