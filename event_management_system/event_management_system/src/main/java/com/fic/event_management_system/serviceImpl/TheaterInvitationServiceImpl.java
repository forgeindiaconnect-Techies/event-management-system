package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.dto.AcceptRoleInvitationRequest;
import com.fic.event_management_system.dto.InviteRoleRequest;
import com.fic.event_management_system.entity.*;
import com.fic.event_management_system.enums.InvitationStatus;
import com.fic.event_management_system.enums.RoleName;
import com.fic.event_management_system.repository.*;
import com.fic.event_management_system.service.TheaterInvitationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@SuppressWarnings("null")
public class TheaterInvitationServiceImpl implements TheaterInvitationService {

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private final TheaterInvitationRepository theaterInvitationRepository;
    private final TheaterPortalRepository theaterPortalRepository;
    private final TheaterUserRepository theaterUserRepository;
    private final com.fic.event_management_system.service.TheaterEmailService theaterEmailService;
    private final PasswordEncoder passwordEncoder;

    public TheaterInvitationServiceImpl(
            TheaterInvitationRepository theaterInvitationRepository,
            TheaterPortalRepository theaterPortalRepository,
            TheaterUserRepository theaterUserRepository,
            com.fic.event_management_system.service.TheaterEmailService theaterEmailService,
            PasswordEncoder passwordEncoder) {
        this.theaterInvitationRepository = theaterInvitationRepository;
        this.theaterPortalRepository = theaterPortalRepository;
        this.theaterUserRepository = theaterUserRepository;
        this.theaterEmailService = theaterEmailService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public TheaterInvitation inviteTheaterStaffOrManager(InviteRoleRequest request, String activeOrigin) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase();
        if (email.isBlank()) {
            throw new RuntimeException("Email is required for invitation");
        }

        TheaterPortal theaterPortal = null;
        if (request.getPortalId() != null) {
            theaterPortal = theaterPortalRepository.findById(request.getPortalId()).orElse(null);
        }
        if (theaterPortal == null) {
            theaterPortal = theaterPortalRepository.findAll().stream().findFirst()
                    .orElseGet(() -> {
                        TheaterPortal p = new TheaterPortal();
                        p.setPortalName("Thunder Cinemas");
                        p.setPortalCode("THUNDER_" + System.currentTimeMillis());
                        p.setCity("Chennai");
                        p.setTheaterType("SINGLE_SCREEN");
                        return theaterPortalRepository.save(p);
                    });
        }

        TheaterUser invitedBy = null;
        if (request.getInvitedById() != null) {
            invitedBy = theaterUserRepository.findById(request.getInvitedById()).orElse(null);
        }
        if (invitedBy == null && theaterPortal != null) {
            invitedBy = theaterPortal.getAdminUser();
            if (invitedBy == null) {
                invitedBy = theaterUserRepository.findByTheaterPortalId(theaterPortal.getId()).stream().findFirst().orElse(null);
            }
        }

        RoleName roleName = request.getRoleName();
        if (roleName == null) {
            roleName = RoleName.THEATER_STAFF;
        }

        boolean alreadyInvited = theaterInvitationRepository.existsByEmailAndTheaterPortalIdAndStatusIn(
                email,
                theaterPortal.getId(),
                List.of(InvitationStatus.PENDING)
        );

        if (alreadyInvited) {
            throw new RuntimeException("An active invitation already exists for this email");
        }

        TheaterInvitation invitation = new TheaterInvitation();
        invitation.setEmail(email);
        String personName = request.getSpeakerName() != null ? request.getSpeakerName() : email.split("@")[0];
        invitation.setName(personName);
        invitation.setRoleName(roleName);

        String dutyRole = request.getDutyRole();
        if (dutyRole == null || dutyRole.isBlank()) {
            dutyRole = (roleName == RoleName.THEATER_MANAGER) ? "Branch Manager" : "Box Office Cashier";
        }
        invitation.setDutyRole(dutyRole);

        invitation.setTheaterPortal(theaterPortal);
        invitation.setInvitedByTheaterUser(invitedBy);
        invitation.setToken(UUID.randomUUID().toString());
        invitation.setStatus(InvitationStatus.PENDING);
        invitation.setExpiryDate(LocalDateTime.now().plusDays(2));

        String customUsername = request.getUsername();
        if (customUsername != null && !customUsername.trim().isBlank()) {
            customUsername = customUsername.trim();
            final String finalCustomUsername = customUsername;
            boolean existsInUsers = theaterUserRepository.findByTheaterPortalId(theaterPortal.getId())
                    .stream().anyMatch(u -> u.getUsername() != null && u.getUsername().equalsIgnoreCase(finalCustomUsername));
            boolean existsInInvites = theaterInvitationRepository.findByTheaterPortalId(theaterPortal.getId())
                    .stream().anyMatch(inv -> (inv.getStatus() == InvitationStatus.PENDING || inv.getStatus() == InvitationStatus.ACCEPTED)
                            && inv.getUsername() != null && inv.getUsername().equalsIgnoreCase(finalCustomUsername));
            if (existsInUsers || existsInInvites) {
                throw new RuntimeException("The Employee ID / Username '" + customUsername + "' is already assigned to another staff member in this theater portal.");
            }
            invitation.setUsername(customUsername);
        } else {
            String generatedUsername = generateTheaterUsername(theaterPortal, personName);
            invitation.setUsername(generatedUsername);
        }

        TheaterInvitation saved = theaterInvitationRepository.save(invitation);

        String baseUrl = (activeOrigin != null && !activeOrigin.isBlank())
                ? activeOrigin
                : (frontendUrl != null && !frontendUrl.isBlank() ? frontendUrl : "http://localhost:5173");

        String link = baseUrl + "/role-invitation/accept/" + saved.getToken();
        theaterEmailService.sendTheaterInvitationEmail(saved, link);

        return saved;
    }

    private String generateTheaterUsername(TheaterPortal portal, String personName) {
        Long portalId = portal != null ? portal.getId() : 1L;
        return getNextEmpIdForPortal(portalId);
    }

    @Override
    public TheaterUser acceptTheaterInvitation(String token, AcceptRoleInvitationRequest request) {
        TheaterInvitation invitation = theaterInvitationRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invitation link has been deleted or revoked by the owner."));

        if (invitation.getStatus() == InvitationStatus.ACCEPTED) {
            throw new RuntimeException("Invitation already accepted");
        }

        if (invitation.getExpiryDate() != null && invitation.getExpiryDate().isBefore(LocalDateTime.now())) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitation.setUsername(null); // Release ID on expiration
            theaterInvitationRepository.save(invitation);
            throw new RuntimeException("This invitation link has expired (validity was 2 days). Please ask your theater owner for a new invitation.");
        }

        TheaterUser user = theaterUserRepository.findByEmail(invitation.getEmail()).orElse(null);
        if (user == null) {
            user = new TheaterUser();
            user.setEmail(invitation.getEmail());
        }

        user.setFirstName(request.getFirstName() != null ? request.getFirstName() : invitation.getName());
        user.setLastName(request.getLastName() != null ? request.getLastName() : "");
        user.setPhoneNumber(request.getPhoneNumber());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        String roleStr = invitation.getRoleName() != null ? invitation.getRoleName().name() : "THEATER_STAFF";
        user.setRole(roleStr);
        user.setTheaterPortal(invitation.getTheaterPortal());
        user.setActive(true);

        if (user.getUsername() == null || user.getUsername().isBlank()) {
            user.setUsername(invitation.getUsername() != null ? invitation.getUsername() : generateTheaterUsername(invitation.getTheaterPortal(), user.getFirstName()));
        }
        if (user.getEmployeeId() == null || user.getEmployeeId().isBlank()) {
            user.setEmployeeId(invitation.getUsername() != null ? invitation.getUsername() : user.getUsername());
        }

        TheaterUser savedUser = theaterUserRepository.save(user);

        invitation.setStatus(InvitationStatus.ACCEPTED);
        theaterInvitationRepository.save(invitation);

        return savedUser;
    }

    @Override
    public String rejectTheaterInvitation(String token) {
        TheaterInvitation invitation = theaterInvitationRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invitation link has been deleted or revoked by the owner."));

        invitation.setStatus(InvitationStatus.REJECTED);
        invitation.setUsername(null); // Release ID immediately so another employee can use this number
        theaterInvitationRepository.save(invitation);
        return "Theater invitation rejected";
    }

    @Override
    public void deleteTheaterInvitation(Long id) {
        theaterInvitationRepository.deleteById(id);
    }

    @Override
    public TheaterInvitation getInvitationByToken(String token) {
        TheaterInvitation invitation = theaterInvitationRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invitation link has been deleted or revoked by the owner."));

        if (invitation.getExpiryDate() != null && invitation.getExpiryDate().isBefore(LocalDateTime.now())) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitation.setUsername(null);
            theaterInvitationRepository.save(invitation);
            throw new RuntimeException("This invitation link has expired (validity was 2 days). Please ask your theater owner for a new invitation.");
        }

        if (invitation.getInvitedByTheaterUser() == null && invitation.getTheaterPortal() != null) {
            TheaterUser admin = invitation.getTheaterPortal().getAdminUser();
            if (admin == null) {
                admin = theaterUserRepository.findByTheaterPortalId(invitation.getTheaterPortal().getId()).stream().findFirst().orElse(null);
            }
            if (admin != null) {
                invitation.setInvitedByTheaterUser(admin);
            }
        }

        return invitation;
    }

    @Override
    public List<TheaterInvitation> getInvitationsByPortal(Long portalId) {
        List<TheaterInvitation> list = theaterInvitationRepository.findByTheaterPortalId(portalId);
        LocalDateTime now = LocalDateTime.now();

        TheaterPortal portal = portalId != null ? theaterPortalRepository.findById(portalId).orElse(null) : null;
        String portalName = (portal != null && portal.getPortalName() != null && !portal.getPortalName().isBlank())
                ? portal.getPortalName().trim() : "EMP";
        String cleaned = portalName.replaceAll("[^a-zA-Z0-9\\s]", " ").trim();
        String[] words = cleaned.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!w.isBlank()) sb.append(Character.toUpperCase(w.charAt(0)));
        }
        String prefixStr;
        if (sb.length() >= 2) {
            prefixStr = sb.toString();
        } else if (cleaned.length() >= 2) {
            prefixStr = cleaned.substring(0, 2).toUpperCase();
        } else {
            prefixStr = "TH";
        }

        for (TheaterInvitation inv : list) {
            if (inv.getStatus() == InvitationStatus.PENDING && inv.getExpiryDate() != null && inv.getExpiryDate().isBefore(now)) {
                inv.setStatus(InvitationStatus.EXPIRED);
                inv.setUsername(null);
                theaterInvitationRepository.save(inv);
                continue;
            }

            // Normalize old format: e.g. GM-1003 -> GM003
            if (inv.getUsername() != null) {
                String oldUname = inv.getUsername().trim();
                if (oldUname.contains("-") || oldUname.matches(".*\\d{4}$")) {
                    java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\d+").matcher(oldUname);
                    if (m.find()) {
                        int num = Integer.parseInt(m.group());
                        if (num >= 1000) num -= 1000;
                        String normalized = String.format("%s%03d", prefixStr, num);
                        inv.setUsername(normalized);
                        try {
                            theaterInvitationRepository.save(inv);
                        } catch (Exception ignored) {}

                        // Also synchronize to the TheaterUser if already registered / active
                        try {
                            theaterUserRepository.findByEmail(inv.getEmail()).ifPresent(tu -> {
                                tu.setUsername(normalized);
                                tu.setEmployeeId(normalized);
                                theaterUserRepository.save(tu);
                            });
                        } catch (Exception ignored) {}
                    }
                }
            }
        }
        return list;
    }

    @Override
    public String getNextEmpIdForPortal(Long portalId) {
        TheaterPortal portal = null;
        if (portalId != null) {
            portal = theaterPortalRepository.findById(portalId).orElse(null);
        }
        if (portal == null) {
            portal = theaterPortalRepository.findAll().stream().findFirst().orElse(null);
        }

        String portalName = (portal != null && portal.getPortalName() != null && !portal.getPortalName().isBlank())
                ? portal.getPortalName().trim()
                : "Cinema Partner";

        String cleaned = portalName.replaceAll("[^a-zA-Z0-9\\s]", " ").trim();
        String[] words = cleaned.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!w.isBlank()) {
                sb.append(Character.toUpperCase(w.charAt(0)));
            }
        }
        String prefixStr;
        if (sb.length() >= 2) {
            prefixStr = sb.toString();
        } else if (cleaned.length() >= 2) {
            prefixStr = cleaned.substring(0, 2).toUpperCase();
        } else {
            prefixStr = "TH";
        }

        Long pId = portal != null ? portal.getId() : 1L;
        List<TheaterInvitation> invitations = theaterInvitationRepository.findByTheaterPortalId(pId);
        List<TheaterUser> users = theaterUserRepository.findByTheaterPortalId(pId);

        java.util.Set<Integer> takenNumbers = new java.util.HashSet<>();
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\d+");

        // Only reserve numbers for PENDING and ACCEPTED invitations (REJECTED and EXPIRED are released)
        for (TheaterInvitation inv : invitations) {
            if (inv.getStatus() == InvitationStatus.PENDING || inv.getStatus() == InvitationStatus.ACCEPTED) {
                if (inv.getUsername() != null && inv.getUsername().toUpperCase().startsWith(prefixStr)) {
                    java.util.regex.Matcher m = pattern.matcher(inv.getUsername());
                    if (m.find()) {
                        try {
                            int num = Integer.parseInt(m.group());
                            if (num >= 1000) num -= 1000;
                            takenNumbers.add(num);
                        } catch (Exception ignored) {}
                    }
                }
            }
        }

        for (TheaterUser u : users) {
            String val = u.getEmployeeId() != null && !u.getEmployeeId().isBlank() ? u.getEmployeeId() : u.getUsername();
            if (val != null && val.toUpperCase().startsWith(prefixStr)) {
                java.util.regex.Matcher m = pattern.matcher(val);
                if (m.find()) {
                    try {
                        int num = Integer.parseInt(m.group());
                        if (num >= 1000) num -= 1000;
                        takenNumbers.add(num);
                    } catch (Exception ignored) {}
                }
            }
        }

        // Find lowest available integer starting at 1 (e.g. 1 -> 001, 2 -> 002)
        int candidateNum = 1;
        while (takenNumbers.contains(candidateNum) || theaterUserRepository.findByUsername(String.format("%s%03d", prefixStr, candidateNum)).isPresent()) {
            candidateNum++;
        }

        return String.format("%s%03d", prefixStr, candidateNum);
    }

    @Override
    public TheaterInvitation directAddTheaterStaff(java.util.Map<String, Object> payload) {
        String email = payload.get("email") != null ? String.valueOf(payload.get("email")).trim().toLowerCase() : "";
        String firstName = payload.get("firstName") != null ? String.valueOf(payload.get("firstName")).trim() : "";
        String lastName = payload.get("lastName") != null ? String.valueOf(payload.get("lastName")).trim() : "";
        String fullName = (firstName + " " + lastName).trim();
        if (fullName.isBlank()) {
            fullName = payload.get("speakerName") != null ? String.valueOf(payload.get("speakerName")).trim() : (email.contains("@") ? email.split("@")[0] : "Staff Member");
        }
        String phone = payload.get("phone") != null ? String.valueOf(payload.get("phone")).trim() : "";
        String roleStr = payload.get("roleName") != null ? String.valueOf(payload.get("roleName")).trim() : "THEATER_STAFF:Box Office Cashier";
        String customEmpId = payload.get("username") != null ? String.valueOf(payload.get("username")).trim() : null;

        Long portalId = null;
        if (payload.get("portalId") != null) {
            try {
                portalId = Long.valueOf(String.valueOf(payload.get("portalId")));
            } catch (Exception ignored) {}
        }

        Long invitedById = null;
        if (payload.get("invitedById") != null) {
            try {
                invitedById = Long.valueOf(String.valueOf(payload.get("invitedById")));
            } catch (Exception ignored) {}
        }

        TheaterUser invitedBy = null;
        if (invitedById != null) {
            invitedBy = theaterUserRepository.findById(invitedById).orElse(null);
        }

        TheaterPortal portal = null;
        if (portalId != null) {
            portal = theaterPortalRepository.findById(portalId).orElse(null);
        }
        if (portal == null && invitedBy != null && invitedBy.getTheaterPortal() != null) {
            portal = invitedBy.getTheaterPortal();
        }
        if (portal == null) {
            portal = theaterPortalRepository.findAll().stream().findFirst().orElse(null);
        }

        if (portal == null) {
            throw new RuntimeException("Theater portal not found for staff addition");
        }

        // 1. Resolve Duty Role & Designation
        String dutyRole = payload.get("dutyRole") != null ? String.valueOf(payload.get("dutyRole")).trim() : "";
        if (dutyRole.isBlank()) {
            dutyRole = payload.get("roleName") != null ? String.valueOf(payload.get("roleName")).trim() : "Box Office Cashier";
        }
        if (dutyRole.contains(":")) {
            dutyRole = dutyRole.split(":")[1].trim();
        }

        // 2. Resolve Emp ID
        if (customEmpId == null || customEmpId.isBlank()) {
            customEmpId = getNextEmpIdForPortal(portal.getId());
        }

        // 3. Create or Update TheaterUser in database (Immediately Active & On Duty)
        TheaterUser user = theaterUserRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = new TheaterUser();
            user.setEmail(email);
        }
        user.setFirstName(firstName.isBlank() ? fullName : firstName);
        user.setLastName(lastName);
        user.setPhoneNumber(phone);
        user.setUsername(customEmpId);
        user.setEmployeeId(customEmpId);
        user.setDutyRole(dutyRole);
        user.setRole(dutyRole.equalsIgnoreCase("Branch Manager") ? "THEATER_MANAGER" : "THEATER_STAFF:" + dutyRole);
        user.setTheaterPortal(portal);
        user.setActive(true);

        String inputPassword = payload.get("password") != null ? String.valueOf(payload.get("password")).trim() : "";
        if (!inputPassword.isBlank()) {
            user.setPassword(passwordEncoder.encode(inputPassword));
        } else if (user.getPassword() == null || user.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode("Password@123"));
        }
        theaterUserRepository.save(user);

        // 4. Create or Update TheaterInvitation record with ACCEPTED status
        TheaterInvitation inv = theaterInvitationRepository.findByEmailAndTheaterPortalIdAndStatusIn(
                email, portal.getId(), List.of(InvitationStatus.PENDING, InvitationStatus.ACCEPTED)
        ).stream().findFirst().orElse(null);

        if (inv == null) {
            inv = new TheaterInvitation();
            inv.setEmail(email);
            inv.setToken(UUID.randomUUID().toString());
        }
        inv.setName(fullName);
        inv.setUsername(customEmpId);
        inv.setDutyRole(dutyRole);
        inv.setTheaterPortal(portal);
        inv.setInvitedByTheaterUser(invitedBy);
        inv.setStatus(InvitationStatus.ACCEPTED);
        RoleName rName = RoleName.THEATER_STAFF;
        if (dutyRole.equalsIgnoreCase("Branch Manager") || roleStr.contains("MANAGER")) {
            rName = RoleName.THEATER_MANAGER;
        }
        inv.setRoleName(rName);
        TheaterInvitation savedInv = theaterInvitationRepository.save(inv);

        // 4. Send Confirmation / Credentials Email
        try {
            theaterEmailService.sendTheaterInvitationEmail(savedInv, frontendUrl + "/login");
        } catch (Exception e) {
            System.err.println("Email dispatch notice: " + e.getMessage());
        }

        return savedInv;
    }
}
