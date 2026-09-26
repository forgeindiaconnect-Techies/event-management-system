package com.fic.event_management_system.serviceImpl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fic.event_management_system.entity.MovieBookedTicket;
import com.fic.event_management_system.entity.TheaterEmailLog;
import com.fic.event_management_system.entity.TheaterInvitation;
import com.fic.event_management_system.repository.TheaterEmailLogRepository;
import com.fic.event_management_system.service.TheaterEmailService;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Autowired
    private TheaterEmailLogRepository theaterEmailLogRepository;

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
        Long portalId = invitation.getTheaterPortal() != null ? invitation.getTheaterPortal().getId() : null;
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

        dispatchAndLogEmail(recipient, subject, body, "Staff Invitation", portalName, portalId);
    }

    @Override
    public void sendTicketConfirmationEmail(MovieBookedTicket ticket, String customerEmail, String theaterName, Long portalId) {
        if (customerEmail == null || customerEmail.isBlank()) {
            return;
        }
        String thName = (theaterName != null && !theaterName.isBlank()) ? theaterName : "Thunder Cinemas";
        String subject = "Ticket Confirmed: " + (ticket.getMovieTitle() != null ? ticket.getMovieTitle() : "Movie") 
                + " [" + (ticket.getTicketId() != null ? ticket.getTicketId() : "") + "] - " + thName;

        String recipientName = (ticket.getCustomerName() != null && !ticket.getCustomerName().isBlank())
                ? ticket.getCustomerName()
                : "Valued Guest";

        StringBuilder sb = new StringBuilder();
        sb.append("Dear ").append(recipientName).append(",\n\n");
        sb.append("Thank you for your booking! Your movie ticket has been confirmed.\n\n");
        sb.append("========================================\n");
        sb.append("          M-TICKET DETAILS             \n");
        sb.append("========================================\n");
        sb.append("Booking ID     : ").append(ticket.getTicketId() != null ? ticket.getTicketId() : "N/A").append("\n");
        sb.append("Movie Title    : ").append(ticket.getMovieTitle() != null ? ticket.getMovieTitle() : "N/A").append("\n");
        sb.append("Theater        : ").append(thName).append("\n");
        sb.append("Screen         : ").append(ticket.getScreenName() != null ? ticket.getScreenName() : "Screen 1").append("\n");
        sb.append("Date           : ").append(ticket.getDate() != null ? ticket.getDate() : "N/A").append("\n");
        sb.append("Show Time      : ").append(ticket.getTime() != null ? ticket.getTime() : "N/A").append("\n");
        sb.append("Seat(s)        : ").append(ticket.getSeats() != null ? ticket.getSeats() : "N/A").append("\n");
        sb.append("Total Amount   : Rs. ").append(ticket.getAmount() != null ? String.format("%.2f", ticket.getAmount()) : "0.00").append("\n");
        sb.append("Payment Mode   : ").append(ticket.getPaymentMode() != null ? ticket.getPaymentMode() : "N/A").append("\n");
        sb.append("Booking Status : ").append(ticket.getStatus() != null ? ticket.getStatus() : "Confirmed").append("\n");
        sb.append("========================================\n\n");
        sb.append("Please present this digital confirmation or your Booking ID at the theater entry gate / box office counter.\n\n");
        sb.append("Enjoy your show!\n");
        sb.append("Warm regards,\n");
        sb.append(thName).append(" Box Office Team");

        dispatchAndLogEmail(customerEmail.trim(), subject, sb.toString(), "Ticket Confirmation", thName, portalId);
    }

    @Override
    public void sendManualSuperAdminEmail(String recipient, String subject, String body, String type, String theaterName, Long portalId) {
        if (recipient == null || recipient.isBlank()) {
            throw new IllegalArgumentException("Recipient email cannot be empty.");
        }
        String logType = (type != null && !type.isBlank()) ? type : "Alert";
        String thName = (theaterName != null && !theaterName.isBlank()) ? theaterName : "All Theaters";
        dispatchAndLogEmail(recipient.trim(), subject, body, logType, thName, portalId);
    }

    private void dispatchAndLogEmail(String recipient, String subject, String body, String type, String theaterName, Long portalId) {
        String status = "Delivered";
        String errorMsg = null;

        try {
            sendViaBrevoApi(recipient, subject, body);
            System.out.println("[THEATER BREVO EMAIL DISPATCH SUCCESS]: " + type + " to " + recipient);
        } catch (Exception e) {
            System.err.println("[THEATER BREVO DISPATCH ERROR]: " + e.getMessage());
            try {
                sendViaSmtp(recipient, subject, body);
                System.out.println("[THEATER SMTP EMAIL DISPATCH SUCCESS]: " + type + " to " + recipient);
            } catch (Exception ex) {
                System.err.println("[THEATER SMTP DISPATCH WARN]: " + ex.getMessage());
                status = "Failed";
                errorMsg = "Brevo: " + e.getMessage() + " | SMTP: " + ex.getMessage();
                System.out.println("=================================================");
                System.out.println("[THEATER EMAIL FALLBACK LOGGED]");
                System.out.println("Recipient: " + recipient);
                System.out.println("Type: " + type);
                System.out.println("Subject: " + subject);
                System.out.println("=================================================");
            }
        }

        // Always record into theater_email_logs table for Super Admin visibility
        try {
            if (theaterEmailLogRepository != null) {
                TheaterEmailLog log = new TheaterEmailLog(
                        subject,
                        recipient,
                        theaterName,
                        portalId,
                        type,
                        status,
                        errorMsg
                );
                theaterEmailLogRepository.save(log);
            }
        } catch (Exception ex) {
            System.err.println("[THEATER EMAIL LOG SAVE ERROR]: " + ex.getMessage());
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

