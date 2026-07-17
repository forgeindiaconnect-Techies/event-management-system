package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.Registration;
import com.fic.event_management_system.enums.PaymentStatus;
import com.fic.event_management_system.enums.RegistrationStatus;
import com.fic.event_management_system.enums.RegistrationType;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {
	
	List<Registration> findByEventId(Long eventId);
	
	List<Registration> findByEventIdAndRegistrationType(
	        Long eventId,
	        RegistrationType registrationType
	);
	
	boolean existsByEventIdAndParticipant_IdAndRegistrationType(
	        Long eventId,
	        Long participantId,
	        RegistrationType registrationType
	);
	
	long countByEventId(Long eventId);

	long countByEventIdAndRegistrationType(
	        Long eventId,
	        RegistrationType registrationType
	);
	
	long countByEventIdAndAttendedTrue(Long eventId);

	long countByEventIdAndAttendedFalse(Long eventId);

	long countByEventIdAndRegistrationTypeAndAttendedTrue(
	        Long eventId,
	        RegistrationType registrationType
	);
	
	long countByEventIdAndPaymentStatus(Long eventId, PaymentStatus paymentStatus);
	
	List<Registration> findByEventIdAndStatusOrderByIdAsc(
	        Long eventId,
	        RegistrationStatus status
	);
	
	List<Registration> findByEvent_Portal_Id(Long portalId);
}
