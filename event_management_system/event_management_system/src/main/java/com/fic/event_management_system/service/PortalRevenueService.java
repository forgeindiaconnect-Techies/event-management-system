package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.Registration;

public interface PortalRevenueService {
    void assertPortalCanReceivePayment(Registration registration);
    void recordPaidRegistration(Registration registration);
    void reverseRegistrationPayment(Registration registration);
}
