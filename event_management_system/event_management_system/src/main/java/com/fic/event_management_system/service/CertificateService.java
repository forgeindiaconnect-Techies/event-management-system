package com.fic.event_management_system.service;

public interface CertificateService {

    byte[] generateCertificate(Long registrationId);
}