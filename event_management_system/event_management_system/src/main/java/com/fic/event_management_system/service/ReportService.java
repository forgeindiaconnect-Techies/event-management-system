package com.fic.event_management_system.service;

import com.fic.event_management_system.dto.EventSummaryReportResponse;


public interface ReportService {

    EventSummaryReportResponse getEventSummaryReport(Long eventId);
     
}
