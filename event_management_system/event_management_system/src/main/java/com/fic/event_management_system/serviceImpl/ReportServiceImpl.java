package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.dto.EventSummaryReportResponse;
import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.enums.PaymentStatus;
import com.fic.event_management_system.enums.RegistrationType;
import com.fic.event_management_system.repository.RegistrationRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.ReportService;
import org.springframework.stereotype.Service;

@Service
public class ReportServiceImpl implements ReportService {

    private final RegistrationRepository registrationRepository;
    private final TenantSecurityService tenantSecurityService;

    public ReportServiceImpl(
            RegistrationRepository registrationRepository,
            TenantSecurityService tenantSecurityService) {

        this.registrationRepository = registrationRepository;
        this.tenantSecurityService = tenantSecurityService;
    }

    @Override
    public EventSummaryReportResponse getEventSummaryReport(Long eventId) {
        Event event = tenantSecurityService.getEventFromLoggedInPortal(eventId);

        EventSummaryReportResponse response = new EventSummaryReportResponse();

        response.setEventName(event.getEventName());

        response.setTotalRegistrations(
                registrationRepository.countByEventId(eventId)
        );

        response.setParticipants(
                registrationRepository.countByEventIdAndRegistrationType(
                        eventId,
                        RegistrationType.PARTICIPANT
                )
        );

        response.setAudience(
                registrationRepository.countByEventIdAndRegistrationType(
                        eventId,
                        RegistrationType.AUDIENCE
                )
        );

        response.setCheckedIn(
                registrationRepository.countByEventIdAndAttendedTrue(eventId)
        );

        if (Boolean.TRUE.equals(event.getCertificateEnabled())) {
            response.setCertificatesIssued(
                    registrationRepository.countByEventIdAndAttendedTrue(eventId)
            );
        } else {
            response.setCertificatesIssued(0);
        }

        response.setFree(
                registrationRepository.countByEventIdAndPaymentStatus(
                        eventId,
                        PaymentStatus.FREE
                )
        );

        response.setPaid(
                registrationRepository.countByEventIdAndPaymentStatus(
                        eventId,
                        PaymentStatus.PAID
                )
        );

        response.setPending(
                registrationRepository.countByEventIdAndPaymentStatus(
                        eventId,
                        PaymentStatus.PENDING
                )
        );

        response.setFailed(
                registrationRepository.countByEventIdAndPaymentStatus(
                        eventId,
                        PaymentStatus.FAILED
                )
        );

        return response;
    }
}