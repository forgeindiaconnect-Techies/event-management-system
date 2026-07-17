package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.entity.VolunteerAssignment;
import com.fic.event_management_system.enums.RoleName;
import com.fic.event_management_system.repository.EventRepository;
import com.fic.event_management_system.repository.UserRepository;
import com.fic.event_management_system.repository.VolunteerAssignmentRepository;
import com.fic.event_management_system.service.VolunteerAssignmentService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VolunteerAssignmentServiceImpl implements VolunteerAssignmentService {

    private final VolunteerAssignmentRepository volunteerAssignmentRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public VolunteerAssignmentServiceImpl(
            VolunteerAssignmentRepository volunteerAssignmentRepository,
            EventRepository eventRepository,
            UserRepository userRepository) {

        this.volunteerAssignmentRepository = volunteerAssignmentRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    @Override
    public VolunteerAssignment assignVolunteer(VolunteerAssignment assignment) {

        Long eventId = assignment.getEvent().getId();
        Long volunteerId = assignment.getVolunteer().getId();
        Long assignedById = assignment.getAssignedBy().getId();

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        User volunteer = userRepository.findById(volunteerId)
                .orElseThrow(() -> new RuntimeException("Volunteer user not found"));

        User assignedBy = userRepository.findById(assignedById)
                .orElseThrow(() -> new RuntimeException("Assigned by user not found"));

        if (volunteer.getRole().getRoleName() != RoleName.VOLUNTEER) {
            throw new RuntimeException("Selected user is not a volunteer");
        }

        if (volunteerAssignmentRepository.existsByVolunteerIdAndEventId(volunteerId, eventId)) {
            throw new RuntimeException("Volunteer already assigned to this event");
        }

        assignment.setEvent(event);
        assignment.setVolunteer(volunteer);
        assignment.setAssignedBy(assignedBy);
        assignment.setActive(true);

        return volunteerAssignmentRepository.save(assignment);
    }

    @Override
    public List<VolunteerAssignment> getVolunteersByEvent(Long eventId) {
        return volunteerAssignmentRepository.findByEventId(eventId);
    }

    @Override
    public List<VolunteerAssignment> getEventsByVolunteer(Long volunteerId) {
        return volunteerAssignmentRepository.findByVolunteerId(volunteerId);
    }

    @Override
    public void removeVolunteerAssignment(Long assignmentId) {
        volunteerAssignmentRepository.deleteById(assignmentId);
    }
}