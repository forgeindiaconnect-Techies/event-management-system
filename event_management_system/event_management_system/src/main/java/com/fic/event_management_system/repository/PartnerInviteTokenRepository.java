package com.fic.event_management_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.fic.event_management_system.entity.PartnerInviteToken;
import java.util.Optional;

@Repository
public interface PartnerInviteTokenRepository extends JpaRepository<PartnerInviteToken, Long> {
    Optional<PartnerInviteToken> findByToken(String token);
    Optional<PartnerInviteToken> findByEmail(String email);
}
