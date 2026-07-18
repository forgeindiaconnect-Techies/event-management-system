package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.PortalPayoutAccount;
import com.fic.event_management_system.enums.GatewayProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PortalPayoutAccountRepository
        extends JpaRepository<PortalPayoutAccount, Long> {

    Optional<PortalPayoutAccount> findByPortalId(Long portalId);

    Optional<PortalPayoutAccount>
    findByGatewayProviderAndGatewayAccountId(
            GatewayProvider gatewayProvider,
            String gatewayAccountId
    );

    boolean existsByPortalId(Long portalId);
}
