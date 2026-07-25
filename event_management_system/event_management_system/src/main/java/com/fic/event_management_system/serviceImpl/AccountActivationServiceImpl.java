package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.*;
import com.fic.event_management_system.enums.*;
import com.fic.event_management_system.repository.*;
import com.fic.event_management_system.service.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountActivationServiceImpl implements AccountActivationService {
    private static final Duration LINK_LIFETIME = Duration.ofHours(1);
    private static final Duration RESEND_COOLDOWN = Duration.ofMinutes(1);
    private final AccountActivationTokenRepository tokenRepository;
    private final EventAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    @Value("${frontend.url}") private String frontendUrl;
    public AccountActivationServiceImpl(AccountActivationTokenRepository tokenRepository, EventAssignmentRepository assignmentRepository,
            UserRepository userRepository, EmailService emailService, NotificationService notificationService) {
        this.tokenRepository=tokenRepository; this.assignmentRepository=assignmentRepository; this.userRepository=userRepository;
        this.emailService=emailService; this.notificationService=notificationService;
    }
    @Override @Transactional public void sendPasswordSetupLink(User user) {
        LocalDateTime now=LocalDateTime.now();
        List<AccountActivationToken> openTokens = tokenRepository.findByUserIdAndPurposeAndUsedAtIsNull(user.getId(), AccountActivationPurpose.SET_PASSWORD);
        openTokens.forEach(item -> item.setUsedAt(now));
        if (!openTokens.isEmpty()) tokenRepository.saveAll(openTokens);
        String rawToken=generateToken();
        AccountActivationToken token=new AccountActivationToken(); token.setUser(user); token.setPurpose(AccountActivationPurpose.SET_PASSWORD);
        token.setTokenHash(hash(rawToken)); token.setExpiresAt(now.plus(LINK_LIFETIME)); tokenRepository.save(token);
        String portalName=user.getPortal()==null ? "FIC BackRooms" : user.getPortal().getPortalName();
        String link=frontendUrl + "/set-password?token=" + rawToken;
        String body="Hello " + user.getFirstName() + ",\n\nYour " + portalName + " account is ready. Set your password using this secure link:\n\n"
                + link + "\n\nThis link expires in 1 hour. If you did not expect this account, you can ignore this email.";
        emailService.queueEmail(user.getEmail(), "Set your FIC BackRooms password", body, NotificationType.USER_INVITED,
                user, user.getPortal(), null, "PASSWORD_SETUP_" + token.getId(), now);
        notificationService.createNotification(user, user.getPortal(), null, NotificationType.USER_INVITED,
                "Set your password", "Your account was created. Check your email to set your password.", "/login",
                "PASSWORD_SETUP_NOTIFICATION_" + token.getId());
    }
    @Override public Map<String,Object> getPasswordSetupDetails(String rawToken) {
        AccountActivationToken token=find(rawToken); User user=token.getUser();
        boolean valid=token.getUsedAt()==null && token.getExpiresAt().isAfter(LocalDateTime.now());
        Map<String,Object> result=new LinkedHashMap<>(); result.put("valid", valid); result.put("expired", !valid);
        result.put("firstName", user.getFirstName()); result.put("lastName", user.getLastName()); result.put("email", user.getEmail());
        result.put("role", user.getRole()==null ? "Team member" : user.getRole().getRoleName().name().replace('_',' '));
        result.put("portalName", user.getPortal()==null ? "FIC BackRooms" : user.getPortal().getPortalName());
        result.put("expiresAt", token.getExpiresAt());
        assignmentRepository.findByUserIdAndActiveTrueOrderByCreatedAtDesc(user.getId()).stream().findFirst()
                .ifPresent(a -> result.put("eventName", a.getEvent()==null ? null : a.getEvent().getEventName()));
        return result;
    }
    @Override @Transactional public void completePasswordSetup(String rawToken, String password, String confirmPassword) {
        AccountActivationToken token=find(rawToken);
        if (token.getUsedAt()!=null || !token.getExpiresAt().isAfter(LocalDateTime.now())) throw new IllegalArgumentException("This set-password link has expired. Request a new link.");
        if (password==null || password.length()<8 || !password.matches(".*[A-Z].*") || !password.matches(".*[a-z].*") || !password.matches(".*\\d.*"))
            throw new IllegalArgumentException("Password must be at least 8 characters and include uppercase, lowercase and a number.");
        if (!password.equals(confirmPassword)) throw new IllegalArgumentException("Passwords do not match.");
        User user=token.getUser(); user.setPassword(password); user.setActive(true); user.setPasswordSetupRequired(false); userRepository.save(user);
        token.setUsedAt(LocalDateTime.now()); tokenRepository.save(token);
    }
    @Override @Transactional public void resendPasswordSetupLink(String rawToken) {
        AccountActivationToken token=find(rawToken); User user=token.getUser();
        if (!Boolean.TRUE.equals(user.getPasswordSetupRequired())) throw new IllegalArgumentException("This account password has already been set.");
        tokenRepository.findFirstByUserIdAndPurposeOrderByCreatedAtDesc(user.getId(), AccountActivationPurpose.SET_PASSWORD).ifPresent(last -> {
            if (last.getCreatedAt()!=null && last.getCreatedAt().plus(RESEND_COOLDOWN).isAfter(LocalDateTime.now()))
                throw new IllegalArgumentException("Please wait one minute before requesting another link.");
        });
        sendPasswordSetupLink(user);
    }
    private AccountActivationToken find(String rawToken) {
        if(rawToken==null || rawToken.isBlank()) throw new IllegalArgumentException("Invalid set-password link.");
        return tokenRepository.findByTokenHash(hash(rawToken)).orElseThrow(() -> new IllegalArgumentException("Invalid set-password link."));
    }
    private String generateToken(){ byte[] bytes=new byte[32]; new SecureRandom().nextBytes(bytes); return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes); }
    private String hash(String value){ try { byte[] data=MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)); StringBuilder b=new StringBuilder(); for(byte x:data)b.append(String.format("%02x",x)); return b.toString(); } catch(NoSuchAlgorithmException e){throw new IllegalStateException(e);} }
}
