package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.OrganizerInvitation;
import com.fic.event_management_system.enums.InvitationStatus;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizerInvitationRepository extends JpaRepository<OrganizerInvitation, Long> {
	
	Optional<OrganizerInvitation> findByToken(String token);
	
	boolean existsByEmailAndPortalIdAndStatus(
	        String email,
	        Long portalId,
	        InvitationStatus status
	);
}
