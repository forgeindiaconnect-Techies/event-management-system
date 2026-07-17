package com.fic.event_management_system.controller;

import com.fic.event_management_system.dto.ExhibitorReportResponse;
import com.fic.event_management_system.entity.Exhibitor;
import com.fic.event_management_system.service.ExhibitorService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exhibitors")
public class ExhibitorController {

    private final ExhibitorService exhibitorService;

    public ExhibitorController(ExhibitorService exhibitorService) {
        this.exhibitorService = exhibitorService;
    }

    @PostMapping
    public Exhibitor createExhibitor(@RequestBody Exhibitor exhibitor) {
        return exhibitorService.createExhibitor(exhibitor);
    }

    @PutMapping("/{exhibitorId}")
    public Exhibitor updateExhibitor(
            @PathVariable Long exhibitorId,
            @RequestBody Exhibitor exhibitor) {

        return exhibitorService.updateExhibitor(exhibitorId, exhibitor);
    }

    @GetMapping("/{exhibitorId}")
    public Exhibitor getExhibitorById(@PathVariable Long exhibitorId) {
        return exhibitorService.getExhibitorById(exhibitorId);
    }

    @GetMapping("/event/{eventId}")
    public List<Exhibitor> getExhibitorsByEvent(@PathVariable Long eventId) {
        return exhibitorService.getExhibitorsByEvent(eventId);
    }

    @GetMapping("/event/{eventId}/summary")
    public ExhibitorReportResponse getExhibitorReport(@PathVariable Long eventId) {
        return exhibitorService.getExhibitorReport(eventId);
    }

    @DeleteMapping("/{exhibitorId}")
    public String deleteExhibitor(@PathVariable Long exhibitorId) {
        exhibitorService.deleteExhibitor(exhibitorId);
        return "Exhibitor deleted successfully";
    }
}
