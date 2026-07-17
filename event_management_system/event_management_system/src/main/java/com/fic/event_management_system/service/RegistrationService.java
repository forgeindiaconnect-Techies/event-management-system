package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.Registration;
import com.fic.event_management_system.dto.PublicRegistrationRequest;
import java.util.List;

public interface RegistrationService {

    Registration registerForEvent(Long eventId, Long participantId, String registrationType);

    List<Registration> getAllRegistrations();

    Registration getRegistrationById(Long id);

    List<Registration> getRegistrationsByEvent(Long eventId);

    String cancelRegistration(Long registrationId);
    
    List<Registration> getRegistrationsByEventAndType(Long eventId, String type);
    
    Registration markAsPaid(
            Long registrationId,
            String paymentMethod
    );

    Registration startPayment(Long registrationId, String paymentMethod);
    
    Registration markAsPaymentFailed(Long registrationId);

    Registration updatePaymentStatusManually(Long registrationId, String status);
    
    List<Registration> getWaitlistByEvent(Long eventId);
    
    List<Registration> getRegistrationsByPortal(Long portalId);
    
    Registration markAttendance(Long registrationId);
    

    Registration publicRegister(
            Long eventId,
            PublicRegistrationRequest request);
}
