package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.Certificate;
import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.Registration;
import com.fic.event_management_system.enums.EventStatus;
import com.fic.event_management_system.repository.CertificateRepository;
import com.fic.event_management_system.repository.RegistrationRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.CertificateService;
import com.fic.event_management_system.service.EmailService;
import com.fic.event_management_system.enums.NotificationType;
import com.itextpdf.text.Document;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.pdf.PdfWriter;
import java.io.ByteArrayOutputStream;
import java.util.UUID;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;

@Service
public class CertificateServiceImpl implements CertificateService {

    private final RegistrationRepository registrationRepository;
    private final CertificateRepository certificateRepository;
    private final TenantSecurityService tenantSecurityService;
    private final EmailService emailService;

    public CertificateServiceImpl(
            RegistrationRepository registrationRepository,
            CertificateRepository certificateRepository,
            TenantSecurityService tenantSecurityService,
            EmailService emailService) {

        this.registrationRepository = registrationRepository;
        this.certificateRepository = certificateRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.emailService = emailService;
    }

    @Override
    public byte[] generateCertificate(Long registrationId) {
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RuntimeException("Registration not found"));

        Event event = registration.getEvent();
        tenantSecurityService.requireEventInLoggedInPortal(event);

        if (event.getCertificateEnabled() == null || !event.getCertificateEnabled()) {
            throw new RuntimeException("Certificate is not enabled for this event");
        }

        if (registration.getAttended() == null || !registration.getAttended()) {
            throw new RuntimeException("Certificate allowed only for attended participants");
        }

        if (event.getStatus() != EventStatus.COMPLETED) {
            throw new RuntimeException("Certificate can be generated only after event completion");
        }

        Certificate certificate = certificateRepository
                .findByRegistrationId(registrationId)
                .orElseGet(() -> {
                    Certificate newCertificate = new Certificate();
                    newCertificate.setCertificateNumber("CERT-" + UUID.randomUUID());
                    newCertificate.setRegistration(registration);
                    return certificateRepository.save(newCertificate);
                });

        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();

            Document document = new Document();
            PdfWriter.getInstance(document, out);

            document.open();

            document.add(new Paragraph(event.getCertificateTitle()));
            document.add(new Paragraph(" "));
            document.add(new Paragraph("This is to certify that"));
            document.add(new Paragraph(
                    registration.getParticipant().getFirstName() + " " +
                    registration.getParticipant().getLastName()
            ));
            document.add(new Paragraph("has successfully participated in"));
            document.add(new Paragraph(event.getEventName()));
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Certificate Number: "
                    + certificate.getCertificateNumber()));

            document.close();

            emailService.queueEmail(
                    registration.getParticipant().getEmail(),
                    "Your certificate for " + event.getEventName(),
                    "Hello " + registration.getParticipant().getFirstName() + ",\n\n"
                            + "Your certificate has been generated successfully.\n"
                            + "Certificate number: " + certificate.getCertificateNumber() + "\n\n"
                            + "You can download it from your event ticket portal.\n\n"
                            + "Regards,\nFIC BackRooms",
                    NotificationType.CERTIFICATE_GENERATED,
                    null,
                    event.getPortal(),
                    event,
                    "CERTIFICATE_GENERATED_" + certificate.getId(),
                    LocalDateTime.now()
            );

            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate certificate PDF");
        }
    }
}
