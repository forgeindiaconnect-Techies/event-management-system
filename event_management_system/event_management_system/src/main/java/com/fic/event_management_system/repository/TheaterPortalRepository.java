package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.TheaterPortal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TheaterPortalRepository extends JpaRepository<TheaterPortal, Long> {
    Optional<TheaterPortal> findByPortalCode(String portalCode);
    Optional<TheaterPortal> findByAdminUserEmail(String email);
}
