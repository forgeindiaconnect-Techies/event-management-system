package com.fic.event_management_system.controller;

import com.fic.event_management_system.dto.EventSummaryReportResponse;
import com.fic.event_management_system.service.ReportService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/event/{eventId}/summary")
    public EventSummaryReportResponse getEventSummaryReport(@PathVariable Long eventId) {
        return reportService.getEventSummaryReport(eventId);
    }
}
