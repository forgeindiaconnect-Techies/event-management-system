package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.CoordinatorAssignment;
import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.RoleName;
import com.fic.event_management_system.repository.CoordinatorAssignmentRepository;
import com.fic.event_management_system.repository.EventRepository;
import com.fic.event_management_system.repository.UserRepository;
import com.fic.event_management_system.service.CoordinatorAssignmentService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CoordinatorAssignmentServiceImpl implements CoordinatorAssignmentService {

    private final CoordinatorAssignmentRepository coordinatorAssignmentRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public CoordinatorAssignmentServiceImpl(
            CoordinatorAssignmentRepository coordinatorAssignmentRepository,
            EventRepository eventRepository,
            UserRepository userRepository) {

        this.coordinatorAssignmentRepository = coordinatorAssignmentRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    @Override
    public CoordinatorAssignment assignCoordinator(CoordinatorAssignment assignment) {

        Long eventId = assignment.getEvent().getId();
        Long coordinatorId = assignment.getCoordinator().getId();
        Long assignedById = assignment.getAssignedBy().getId();

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        User coordinator = userRepository.findById(coordinatorId)
                .orElseThrow(() -> new RuntimeException("Coordinator user not found"));

        User assignedBy = userRepository.findById(assignedById)
                .orElseThrow(() -> new RuntimeException("Assigned by user not found"));

        if (coordinator.getRole().getRoleName() != RoleName.COORDINATOR) {
            throw new RuntimeException("Selected user is not a coordinator");
        }

        if (coordinatorAssignmentRepository.existsByCoordinatorIdAndEventId(
                coordinatorId,
                eventId
        )) {
            throw new RuntimeException("Coordinator already assigned to this event");
        }

        assignment.setEvent(event);
        assignment.setCoordinator(coordinator);
        assignment.setAssignedBy(assignedBy);
        assignment.setActive(true);

        return coordinatorAssignmentRepository.save(assignment);
    }

    @Override
    public List<CoordinatorAssignment> getCoordinatorsByEvent(Long eventId) {
        return coordinatorAssignmentRepository.findByEventId(eventId);
    }

    @Override
    public List<CoordinatorAssignment> getEventsByCoordinator(Long coordinatorId) {
        return coordinatorAssignmentRepository.findByCoordinatorId(coordinatorId);
    }

    @Override
    public void removeCoordinatorAssignment(Long assignmentId) {
        coordinatorAssignmentRepository.deleteById(assignmentId);
    }
}
