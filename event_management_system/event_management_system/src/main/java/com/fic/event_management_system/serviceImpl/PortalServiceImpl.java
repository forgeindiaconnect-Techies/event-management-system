package com.fic.event_management_system.serviceImpl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.fic.event_management_system.entity.Portal;
import com.fic.event_management_system.repository.PortalRepository;
import com.fic.event_management_system.service.PortalService;
import com.fic.event_management_system.service.SubscriptionLimitService;
import com.fic.event_management_system.security.TenantSecurityService;

@Service
public class PortalServiceImpl implements PortalService {

    private final PortalRepository portalRepository;
    private final TenantSecurityService tenantSecurityService;
    private final SubscriptionLimitService subscriptionLimitService;

    public PortalServiceImpl(
            PortalRepository portalRepository,
            TenantSecurityService tenantSecurityService,
            SubscriptionLimitService subscriptionLimitService
    ) {
        this.portalRepository = portalRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.subscriptionLimitService = subscriptionLimitService;
    }

    @Override
    public Portal createPortal(Portal portal) {
        return portalRepository.save(portal);
    }

    @Override
    public Portal getPortalById(Long id) {
        tenantSecurityService.requireSamePortal(id);
        return portalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Portal not found"));
    }

    @Override
    public Portal getPortalByCode(String portalCode) {
        return portalRepository.findByPortalCode(portalCode).orElse(null);
    }

    @Override
    public List<Portal> getAllPortals() {
        tenantSecurityService.requireSuperAdmin();
        return portalRepository.findByDeletedFalseOrDeletedIsNull();
    }

    @Override
    public List<Portal> getPortalsByAdmin(Long adminId) {
        if (!tenantSecurityService.isSuperAdmin()
                && !tenantSecurityService.getLoggedInUser().getId().equals(adminId)) {
            throw new RuntimeException("Access denied");
        }
        return portalRepository.findByAdminId(adminId);
    }

    @Override
    public Portal updatePortal(Long id, Portal portal) {
        tenantSecurityService.requireSamePortal(id);

        if (!tenantSecurityService.isPortalAdmin()
                && !tenantSecurityService.isSuperAdmin()) {
            throw new RuntimeException("Only a portal admin can update portal settings");
        }

        Portal existing = portalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Portal not found"));
        subscriptionLimitService.assertPortalIsWritable(id);

        existing.setPortalName(portal.getPortalName());
        existing.setDescription(portal.getDescription());
        existing.setCategory(portal.getCategory());

        String requestedLogo = portal.getLogoUrl();
        String existingLogo = existing.getLogoUrl();
        boolean logoChanged = requestedLogo != null
                && !requestedLogo.equals(existingLogo);

        if (logoChanged) {
            subscriptionLimitService.assertCustomBrandingAllowed(id);
            existing.setLogoUrl(requestedLogo);
        }

        return portalRepository.save(existing);
    }

    @Override
    public void deletePortal(Long id) {
        throw new RuntimeException(
                "Portal deletion is available only through Super Admin controls"
        );
    }
}
