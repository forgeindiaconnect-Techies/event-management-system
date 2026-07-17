package com.fic.event_management_system.controller;

import com.fic.event_management_system.entity.Portal;
import com.fic.event_management_system.service.PortalService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/portals")
public class PortalController {

    private final PortalService portalService;

    public PortalController(PortalService portalService) {
        this.portalService = portalService;
    }

    @PostMapping
    public Portal createPortal(@RequestBody Portal portal) {
        return portalService.createPortal(portal);
    }

    @GetMapping
    public List<Portal> getAllPortals() {
        return portalService.getAllPortals();
    }

    @GetMapping("/{id}")
    public Portal getPortalById(@PathVariable Long id) {
        return portalService.getPortalById(id);
    }

    @PutMapping("/{id}")
    public Portal updatePortal(@PathVariable Long id, @RequestBody Portal portal) {
        return portalService.updatePortal(id, portal);
    }

    @DeleteMapping("/{id}")
    public String deletePortal(@PathVariable Long id) {
        portalService.deletePortal(id);
        return "Portal deleted successfully";
    }
}
