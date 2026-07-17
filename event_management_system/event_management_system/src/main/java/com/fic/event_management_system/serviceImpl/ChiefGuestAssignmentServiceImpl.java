package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.ChiefGuestAssignment;
import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.RoleName;
import com.fic.event_management_system.repository.ChiefGuestAssignmentRepository;
import com.fic.event_management_system.repository.EventRepository;
import com.fic.event_management_system.repository.UserRepository;
import com.fic.event_management_system.service.ChiefGuestAssignmentService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChiefGuestAssignmentServiceImpl implements ChiefGuestAssignmentService {

    private final ChiefGuestAssignmentRepository repository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public ChiefGuestAssignmentServiceImpl(
            ChiefGuestAssignmentRepository repository,
            EventRepository eventRepository,
            UserRepository userRepository) {
        this.repository = repository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    @Override
    public ChiefGuestAssignment assignChiefGuest(ChiefGuestAssignment assignment) {
        Long eventId = assignment.getEvent().getId();
        Long chiefGuestId = assignment.getChiefGuest().getId();
        Long assignedById = assignment.getAssignedBy().getId();

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        User chiefGuest = userRepository.findById(chiefGuestId)
                .orElseThrow(() -> new RuntimeException("Chief guest user not found"));

        User assignedBy = userRepository.findById(assignedById)
                .orElseThrow(() -> new RuntimeException("Assigned by user not found"));

        if (chiefGuest.getRole().getRoleName() != RoleName.CHIEF_GUEST) {
            throw new RuntimeException("Selected user is not a chief guest");
        }

        if (repository.existsByChiefGuestIdAndEventId(chiefGuestId, eventId)) {
            throw new RuntimeException("Chief guest already assigned to this event");
        }

        assignment.setEvent(event);
        assignment.setChiefGuest(chiefGuest);
        assignment.setAssignedBy(assignedBy);
        assignment.setActive(true);

        return repository.save(assignment);
    }

    @Override
    public List<ChiefGuestAssignment> getChiefGuestsByEvent(Long eventId) {
        return repository.findByEventId(eventId);
    }

    @Override
    public List<ChiefGuestAssignment> getEventsByChiefGuest(Long chiefGuestId) {
        return repository.findByChiefGuestId(chiefGuestId);
    }

    @Override
    public void removeChiefGuestAssignment(Long assignmentId) {
        repository.deleteById(assignmentId);
    }
}