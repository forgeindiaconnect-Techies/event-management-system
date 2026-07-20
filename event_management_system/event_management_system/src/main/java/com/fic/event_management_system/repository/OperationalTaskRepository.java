package com.fic.event_management_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fic.event_management_system.entity.OperationalTask;
import com.fic.event_management_system.enums.OperationsEnums.TaskStatus;

@Repository
public interface OperationalTaskRepository
        extends JpaRepository<OperationalTask, Long> {

    List<OperationalTask> findByEventIdOrderByCreatedAtDesc(Long eventId);

    List<OperationalTask> findByEventIdAndStatusOrderByDueDateTimeAsc(
            Long eventId,
            TaskStatus status
    );

    long countByEventId(Long eventId);

    long countByEventIdAndStatus(Long eventId, TaskStatus status);
}	
