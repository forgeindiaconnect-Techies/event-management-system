package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.CoordinatorAssignment;
import java.util.List;

public interface CoordinatorAssignmentService {

    CoordinatorAssignment assignCoordinator(CoordinatorAssignment assignment);

    List<CoordinatorAssignment> getCoordinatorsByEvent(Long eventId);

    List<CoordinatorAssignment> getEventsByCoordinator(Long coordinatorId);

    void removeCoordinatorAssignment(Long assignmentId);

    CoordinatorAssignment submitCompletionReport(Long eventId, String report);
}
