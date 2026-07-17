package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.StaffAssignment;
import java.util.List;

public interface StaffAssignmentService {

    StaffAssignment assignStaff(StaffAssignment staffAssignment);

    List<StaffAssignment> getStaffByEvent(Long eventId);

    List<StaffAssignment> getEventsByStaff(Long staffId);

    void removeStaffAssignment(Long assignmentId);
}