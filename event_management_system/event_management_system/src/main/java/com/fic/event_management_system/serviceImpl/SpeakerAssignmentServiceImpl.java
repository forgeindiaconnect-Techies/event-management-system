package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.SpeakerAssignment;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.RoleName;
import com.fic.event_management_system.repository.EventRepository;
import com.fic.event_management_system.repository.SpeakerAssignmentRepository;
import com.fic.event_management_system.repository.UserRepository;
import com.fic.event_management_system.service.SpeakerAssignmentService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SpeakerAssignmentServiceImpl implements SpeakerAssignmentService {

    private final SpeakerAssignmentRepository speakerAssignmentRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public SpeakerAssignmentServiceImpl(
            SpeakerAssignmentRepository speakerAssignmentRepository,
            EventRepository eventRepository,
            UserRepository userRepository) {

        this.speakerAssignmentRepository = speakerAssignmentRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    @Override
    public SpeakerAssignment assignSpeaker(SpeakerAssignment assignment) {

        Long eventId = assignment.getEvent().getId();
        Long speakerId = assignment.getSpeaker().getId();
        Long assignedById = assignment.getAssignedBy().getId();

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        User speaker = userRepository.findById(speakerId)
                .orElseThrow(() -> new RuntimeException("Speaker user not found"));

        User assignedBy = userRepository.findById(assignedById)
                .orElseThrow(() -> new RuntimeException("Assigned by user not found"));

        if (speaker.getRole().getRoleName() != RoleName.SPEAKER) {
            throw new RuntimeException("Selected user is not a speaker");
        }

        if (speakerAssignmentRepository.existsBySpeakerIdAndEventId(speakerId, eventId)) {
            throw new RuntimeException("Speaker already assigned to this event");
        }

        assignment.setEvent(event);
        assignment.setSpeaker(speaker);
        assignment.setAssignedBy(assignedBy);
        assignment.setActive(true);

        return speakerAssignmentRepository.save(assignment);
    }

    @Override
    public List<SpeakerAssignment> getSpeakersByEvent(Long eventId) {
        return speakerAssignmentRepository.findByEventId(eventId);
    }

    @Override
    public List<SpeakerAssignment> getEventsBySpeaker(Long speakerId) {
        return speakerAssignmentRepository.findBySpeakerId(speakerId);
    }

    @Override
    public void removeSpeakerAssignment(Long assignmentId) {
        speakerAssignmentRepository.deleteById(assignmentId);
    }
}