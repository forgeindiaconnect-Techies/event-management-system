package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.Ticket;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Optional<Ticket> findFirstByRegistrationIdOrderByIdAsc(Long registrationId);

    List<Ticket> findByRegistrationIdOrderByIdAsc(Long registrationId);

    boolean existsByRegistrationId(Long registrationId);

    Optional<Ticket> findByQrCode(String qrCode);

    List<Ticket> findByRegistration_Event_Id(Long eventId);

    List<Ticket> findByRegistration_Event_Portal_Id(Long portalId);

    @Query("""
            SELECT t FROM Ticket t
            WHERE LOWER(t.registration.event.eventName) LIKE LOWER(CONCAT('%', :eventName, '%'))
            AND (
                LOWER(t.registration.participant.email) = LOWER(:emailOrPhone)
                OR t.registration.participant.phoneNumber = :emailOrPhone
            )
            """)
    List<Ticket> findPublicTickets(
            @Param("eventName") String eventName,
            @Param("emailOrPhone") String emailOrPhone);
}