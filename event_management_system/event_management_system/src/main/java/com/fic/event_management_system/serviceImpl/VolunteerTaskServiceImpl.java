package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.entity.VolunteerAssignment;
import com.fic.event_management_system.entity.VolunteerTask;
import com.fic.event_management_system.enums.TaskStatus;
import com.fic.event_management_system.repository.UserRepository;
import com.fic.event_management_system.repository.VolunteerAssignmentRepository;
import com.fic.event_management_system.repository.VolunteerTaskRepository;
import com.fic.event_management_system.service.VolunteerTaskService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class VolunteerTaskServiceImpl implements VolunteerTaskService {

    private final VolunteerTaskRepository volunteerTaskRepository;
    private final VolunteerAssignmentRepository volunteerAssignmentRepository;
    private final UserRepository userRepository;

    public VolunteerTaskServiceImpl(
            VolunteerTaskRepository volunteerTaskRepository,
            VolunteerAssignmentRepository volunteerAssignmentRepository,
            UserRepository userRepository) {

        this.volunteerTaskRepository = volunteerTaskRepository;
        this.volunteerAssignmentRepository = volunteerAssignmentRepository;
        this.userRepository = userRepository;
    }

    @Override
    public VolunteerTask createTask(VolunteerTask task) {

        Long assignmentId = task.getAssignment().getId();
        Long assignedById = task.getAssignedBy().getId();

        VolunteerAssignment assignment = volunteerAssignmentRepository
                .findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Volunteer assignment not found"));

        User assignedBy = userRepository.findById(assignedById)
                .orElseThrow(() -> new RuntimeException("Assigned by user not found"));

        task.setAssignment(assignment);
        task.setAssignedBy(assignedBy);
        task.setStatus(TaskStatus.PENDING);

        return volunteerTaskRepository.save(task);
    }

    @Override
    public List<VolunteerTask> getTasksByVolunteer(Long volunteerId) {
        return volunteerTaskRepository.findByAssignmentVolunteerId(volunteerId);
    }

    @Override
    public List<VolunteerTask> getTasksByEvent(Long eventId) {
        return volunteerTaskRepository.findByAssignmentEventId(eventId);
    }

    @Override
    public List<VolunteerTask> getTasksByAssignment(Long assignmentId) {
        return volunteerTaskRepository.findByAssignmentId(assignmentId);
    }

    @Override
    public VolunteerTask updateTaskStatus(Long taskId, TaskStatus status) {

        VolunteerTask task = volunteerTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setStatus(status);

        if (status == TaskStatus.COMPLETED) {
            task.setCompletedAt(LocalDateTime.now());
        }

        return volunteerTaskRepository.save(task);
    }

    @Override
    public void deleteTask(Long taskId) {

        if (!volunteerTaskRepository.existsById(taskId)) {
            throw new RuntimeException("Task not found");
        }

        volunteerTaskRepository.deleteById(taskId);
    }
}