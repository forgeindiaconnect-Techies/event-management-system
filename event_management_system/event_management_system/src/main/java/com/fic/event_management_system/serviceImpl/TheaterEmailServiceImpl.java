package com.fic.event_management_system.serviceImpl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fic.event_management_system.entity.TheaterInvitation;
import com.fic.event_management_system.service.TheaterEmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class TheaterEmailServiceImpl implements TheaterEmailService {

    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${email.provider:brevo}")
    private String emailProvider;

    @Value("${brevo.api-key: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}")
    private String brevoApiKey;

    @Value("${brevo.sender-email:naveen.mn7878@gmail.com}")
    private String brevoSenderEmail;

    @Value("${brevo.sender-name:Forge India Connect}")
    private String brevoSenderName;

    @Value("${spring.mail.username:}")
    private String smtpFromEmail;

    public TheaterEmailServiceImpl(JavaMailSender mailSender, ObjectMapper objectMapper) {
        this.mailSender = mailSender;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    @Override
    public void sendTheaterInvitationEmail(TheaterInvitation invitation, String link) {
        String recipient = invitation.getEmail();
        String portalName = invitation.getTheaterPortal() != null ? invitation.getTheaterPortal().getPortalName() : "Thunder Cinemas";
        String roleStr = invitation.getRoleName() != null ? invitation.getRoleName().name().replace('_', ' ') : "Team Member";

        String usernameInfo = (invitation.getUsername() != null && !invitation.getUsername().isBlank())
                ? "\nYour Assigned Login Username / EMP ID: " + invitation.getUsername() + "\n"
                : "";

        String subject = "You are invited to join " + portalName + " as " + roleStr;
        String body = "Hello " + invitation.getName() + ",\n\n"
                + "You have been invited to join " + portalName + " as " + roleStr + ".\n"
                + usernameInfo + "\n"
                + "Please click the link below to accept your invitation and set up your account password:\n"
                + link + "\n\n"
                + "Regards,\n"
                + portalName + " Management";

        try {
            sendViaBrevoApi(recipient, subject, body);
            System.out.println("[THEATER BREVO EMAIL DISPATCH SUCCESS]: Delivered to " + recipient);
        } catch (Exception e) {
            System.err.println("[THEATER BREVO DISPATCH ERROR]: " + e.getMessage());
            try {
                sendViaSmtp(recipient, subject, body);
                System.out.println("[THEATER SMTP EMAIL DISPATCH SUCCESS]: Delivered to " + recipient);
            } catch (Exception ex) {
                System.err.println("[THEATER SMTP DISPATCH WARN]: " + ex.getMessage());
                System.out.println("=================================================");
                System.out.println("[THEATER INVITATION EMAIL GENERATED]");
                System.out.println("Recipient: " + recipient);
                System.out.println("Role: " + roleStr);
                System.out.println("Invitation Link: " + link);
                System.out.println("=================================================");
            }
        }
    }

    private void sendViaBrevoApi(String recipient, String subject, String body) throws Exception {
        String apiKey = (brevoApiKey != null && !brevoApiKey.isBlank())
                ? brevoApiKey.trim()
                : "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";

        String senderEmail = (brevoSenderEmail != null && !brevoSenderEmail.isBlank())
                ? brevoSenderEmail.trim()
                : "naveen.mn7878@gmail.com";

        String senderName = (brevoSenderName != null && !brevoSenderName.isBlank())
                ? brevoSenderName.trim()
                : "Forge India Connect";

        Map<String, Object> payload = Map.of(
                "sender", Map.of(
                        "name", senderName,
                        "email", senderEmail
                ),
                "to", List.of(Map.of("email", recipient)),
                "subject", subject,
                "textContent", body
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                .timeout(Duration.ofSeconds(30))
                .header("accept", "application/json")
                .header("content-type", "application/json")
                .header("api-key", apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(
                        objectMapper.writeValueAsString(payload),
                        StandardCharsets.UTF_8
                ))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        System.out.println("[THEATER BREVO API RESPONSE STATUS]: " + response.statusCode());
        System.out.println("[THEATER BREVO API RESPONSE BODY]: " + response.body());

        if (response.statusCode() >= 400) {
            throw new RuntimeException("Brevo API returned status " + response.statusCode() + ": " + response.body());
        }
    }

    private void sendViaSmtp(String recipient, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        if (smtpFromEmail != null && !smtpFromEmail.isBlank()) {
            message.setFrom(smtpFromEmail);
        }
        message.setTo(recipient);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }
}
