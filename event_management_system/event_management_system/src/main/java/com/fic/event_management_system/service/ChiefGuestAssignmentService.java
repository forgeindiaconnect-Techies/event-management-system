package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.ChiefGuestAssignment;
import java.util.List;

public interface ChiefGuestAssignmentService {

    ChiefGuestAssignment assignChiefGuest(ChiefGuestAssignment assignment);

    List<ChiefGuestAssignment> getChiefGuestsByEvent(Long eventId);

    List<ChiefGuestAssignment> getEventsByChiefGuest(Long chiefGuestId);

    void removeChiefGuestAssignment(Long assignmentId);
}