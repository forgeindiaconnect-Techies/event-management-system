package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.ExhibitorLead;

import java.util.List;

public interface ExhibitorLeadService {

    ExhibitorLead createLead(ExhibitorLead lead);

    ExhibitorLead updateLead(Long leadId, ExhibitorLead lead);

    List<ExhibitorLead> getLeadsByEvent(Long eventId);

    List<ExhibitorLead> getLeadsByExhibitor(Long exhibitorId);

    ExhibitorLead getLeadById(Long leadId);

    void deleteLead(Long leadId);
}
