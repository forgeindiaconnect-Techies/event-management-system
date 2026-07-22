package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.StaffAssignment;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.RoleName;
import com.fic.event_management_system.enums.NotificationType;
import com.fic.event_management_system.repository.EventRepository;
import com.fic.event_management_system.repository.StaffAssignmentRepository;
import com.fic.event_management_system.repository.UserRepository;
import com.fic.event_management_system.service.StaffAssignmentService;
import com.fic.event_management_system.service.NotificationService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StaffAssignmentServiceImpl implements StaffAssignmentService {

    private final StaffAssignmentRepository staffAssignmentRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public StaffAssignmentServiceImpl(
            StaffAssignmentRepository staffAssignmentRepository,
            EventRepository eventRepository,
            UserRepository userRepository,
            NotificationService notificationService) {

        this.staffAssignmentRepository = staffAssignmentRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Override
    public StaffAssignment assignStaff(StaffAssignment staffAssignment) {

        Long eventId = staffAssignment.getEvent().getId();
        Long staffId = staffAssignment.getStaff().getId();
        Long assignedById = staffAssignment.getAssignedBy().getId();

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff user not found"));

        User assignedBy = userRepository.findById(assignedById)
                .orElseThrow(() -> new RuntimeException("Assigned by user not found"));

        if (staff.getRole().getRoleName() != RoleName.Staff) {
            throw new RuntimeException("Selected user is not a staff member");
        }

        if (staffAssignmentRepository.existsByEventIdAndStaffId(eventId, staffId)) {
            throw new RuntimeException("Staff already assigned to this event");
        }

        staffAssignment.setEvent(event);
        staffAssignment.setStaff(staff);
        staffAssignment.setAssignedBy(assignedBy);
        staffAssignment.setActive(true);

        StaffAssignment saved = staffAssignmentRepository.save(staffAssignment);
        notificationService.createNotification(
                staff, event.getPortal(), event, NotificationType.EVENT_ASSIGNED,
                "Assigned to " + event.getEventName(),
                "You were added to the staff team for " + event.getEventName() + ".",
                "/staff/events",
                "STAFF_ASSIGNMENT_" + saved.getId() + "_USER_" + staff.getId()
        );
        notificationService.createNotification(
                assignedBy, event.getPortal(), event, NotificationType.EVENT_ASSIGNED,
                "Staff member assigned",
                staff.getFirstName() + " " + staff.getLastName() + " was assigned to " + event.getEventName() + ".",
                "/events/" + event.getId() + "/team",
                "STAFF_ASSIGNMENT_" + saved.getId() + "_ACTOR_" + assignedBy.getId()
        );
        return saved;
    }

    @Override
    public List<StaffAssignment> getStaffByEvent(Long eventId) {
        return staffAssignmentRepository.findByEventId(eventId);
    }

    @Override
    public List<StaffAssignment> getEventsByStaff(Long staffId) {
        return staffAssignmentRepository.findByStaffId(staffId);
    }

    @Override
    public void removeStaffAssignment(Long assignmentId) {
        staffAssignmentRepository.deleteById(assignmentId);
    }
}
