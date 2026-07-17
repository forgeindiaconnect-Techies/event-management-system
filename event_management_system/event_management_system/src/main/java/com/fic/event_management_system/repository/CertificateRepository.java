package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CertificateRepository
        extends JpaRepository<Certificate, Long> {

    Optional<Certificate> findByRegistrationId(Long registrationId);

    boolean existsByRegistrationId(Long registrationId);
}
