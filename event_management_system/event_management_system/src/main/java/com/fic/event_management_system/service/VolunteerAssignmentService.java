package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.VolunteerAssignment;
import java.util.List;

public interface VolunteerAssignmentService {

    VolunteerAssignment assignVolunteer(VolunteerAssignment assignment);

    List<VolunteerAssignment> getVolunteersByEvent(Long eventId);

    List<VolunteerAssignment> getEventsByVolunteer(Long volunteerId);

    void removeVolunteerAssignment(Long assignmentId);
}
