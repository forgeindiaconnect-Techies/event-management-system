package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.SpeakerAssignment;
import java.util.List;

public interface SpeakerAssignmentService {

    SpeakerAssignment assignSpeaker(SpeakerAssignment assignment);

    List<SpeakerAssignment> getSpeakersByEvent(Long eventId);

    List<SpeakerAssignment> getEventsBySpeaker(Long speakerId);

    void removeSpeakerAssignment(Long assignmentId);
}