package com.fic.event_management_system.service;

import java.util.List;

import com.fic.event_management_system.entity.Portal;

public interface PortalService {

    Portal createPortal(Portal portal);

    Portal getPortalById(Long id);

    Portal getPortalByCode(String portalCode);

    List<Portal> getAllPortals();

    List<Portal> getPortalsByAdmin(Long adminId);

    Portal updatePortal(Long id, Portal portal);

    void deletePortal(Long id);
}