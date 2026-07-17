package com.fic.event_management_system.service;

import com.fic.event_management_system.dto.ExhibitorReportResponse;
import com.fic.event_management_system.entity.Exhibitor;

import java.util.List;

public interface ExhibitorService {

    Exhibitor createExhibitor(Exhibitor exhibitor);

    Exhibitor updateExhibitor(Long exhibitorId, Exhibitor exhibitor);

    List<Exhibitor> getExhibitorsByEvent(Long eventId);

    Exhibitor getExhibitorById(Long exhibitorId);

    ExhibitorReportResponse getExhibitorReport(Long eventId);

    void deleteExhibitor(Long exhibitorId);
}
