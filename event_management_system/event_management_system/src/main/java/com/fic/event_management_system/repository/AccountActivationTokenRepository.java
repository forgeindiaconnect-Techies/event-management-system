package com.fic.event_management_system.repository;
import com.fic.event_management_system.entity.AccountActivationToken;
import com.fic.event_management_system.enums.AccountActivationPurpose;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface AccountActivationTokenRepository extends JpaRepository<AccountActivationToken, Long> {
    Optional<AccountActivationToken> findByTokenHash(String tokenHash);
    List<AccountActivationToken> findByUserIdAndPurposeAndUsedAtIsNull(Long userId, AccountActivationPurpose purpose);
    Optional<AccountActivationToken> findFirstByUserIdAndPurposeOrderByCreatedAtDesc(Long userId, AccountActivationPurpose purpose);
}
