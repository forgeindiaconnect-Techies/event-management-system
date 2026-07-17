package com.fic.event_management_system.controller;

import com.fic.event_management_system.entity.ExhibitorLead;
import com.fic.event_management_system.service.ExhibitorLeadService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exhibitor-leads")
public class ExhibitorLeadController {

    private final ExhibitorLeadService leadService;

    public ExhibitorLeadController(ExhibitorLeadService leadService) {
        this.leadService = leadService;
    }

    @PostMapping
    public ExhibitorLead createLead(@RequestBody ExhibitorLead lead) {
        return leadService.createLead(lead);
    }

    @PutMapping("/{leadId}")
    public ExhibitorLead updateLead(
            @PathVariable Long leadId,
            @RequestBody ExhibitorLead lead) {

        return leadService.updateLead(leadId, lead);
    }

    @GetMapping("/{leadId}")
    public ExhibitorLead getLeadById(@PathVariable Long leadId) {
        return leadService.getLeadById(leadId);
    }

    @GetMapping("/event/{eventId}")
    public List<ExhibitorLead> getLeadsByEvent(@PathVariable Long eventId) {
        return leadService.getLeadsByEvent(eventId);
    }

    @GetMapping("/exhibitor/{exhibitorId}")
    public List<ExhibitorLead> getLeadsByExhibitor(@PathVariable Long exhibitorId) {
        return leadService.getLeadsByExhibitor(exhibitorId);
    }

    @DeleteMapping("/{leadId}")
    public String deleteLead(@PathVariable Long leadId) {
        leadService.deleteLead(leadId);
        return "Lead deleted successfully";
    }
}
