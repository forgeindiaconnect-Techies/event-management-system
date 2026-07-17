package com.fic.event_management_system.controller;

import com.fic.event_management_system.dto.AttendanceDashboardResponse;
import com.fic.event_management_system.service.AttendanceDashboardService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/attendance-dashboard")
public class AttendanceDashboardController {

    private final AttendanceDashboardService attendanceDashboardService;

    public AttendanceDashboardController(
            AttendanceDashboardService attendanceDashboardService) {
        this.attendanceDashboardService = attendanceDashboardService;
    }

    @GetMapping("/event/{eventId}")
    public AttendanceDashboardResponse getAttendanceDashboard(
            @PathVariable Long eventId) {

        return attendanceDashboardService.getAttendanceDashboard(eventId);
    }
}
