package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.TheaterInvitation;
import com.fic.event_management_system.enums.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TheaterInvitationRepository extends JpaRepository<TheaterInvitation, Long> {

    Optional<TheaterInvitation> findByToken(String token);

    List<TheaterInvitation> findByTheaterPortalId(Long theaterPortalId);

    List<TheaterInvitation> findByTheaterPortalIdAndStatus(Long theaterPortalId, InvitationStatus status);

    List<TheaterInvitation> findByEmailAndTheaterPortalIdAndStatusIn(String email, Long theaterPortalId, List<InvitationStatus> statuses);

    boolean existsByEmailAndTheaterPortalIdAndStatusIn(String email, Long theaterPortalId, List<InvitationStatus> statuses);
}
