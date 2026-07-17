package com.fic.event_management_system.service;

import com.fic.event_management_system.dto.AttendanceDashboardResponse;

public interface AttendanceDashboardService {

    AttendanceDashboardResponse getAttendanceDashboard(Long eventId);
}
