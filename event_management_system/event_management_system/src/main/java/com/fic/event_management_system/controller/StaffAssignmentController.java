package com.fic.event_management_system.controller;

import com.fic.event_management_system.entity.StaffAssignment;
import com.fic.event_management_system.service.StaffAssignmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff-assignments")
public class StaffAssignmentController {

    private final StaffAssignmentService staffAssignmentService;

    public StaffAssignmentController(StaffAssignmentService staffAssignmentService) {
        this.staffAssignmentService = staffAssignmentService;
    }

    @PostMapping
    public StaffAssignment assignStaff(@RequestBody StaffAssignment staffAssignment) {
        return staffAssignmentService.assignStaff(staffAssignment);
    }

    @GetMapping("/event/{eventId}")
    public List<StaffAssignment> getStaffByEvent(@PathVariable Long eventId) {
        return staffAssignmentService.getStaffByEvent(eventId);
    }

    @GetMapping("/staff/{staffId}")
    public List<StaffAssignment> getEventsByStaff(@PathVariable Long staffId) {
        return staffAssignmentService.getEventsByStaff(staffId);
    }

    @DeleteMapping("/{assignmentId}")
    public String removeStaffAssignment(@PathVariable Long assignmentId) {
        staffAssignmentService.removeStaffAssignment(assignmentId);
        return "Staff assignment removed successfully";
    }
}