package com.fic.event_management_system.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fic.event_management_system.enums.OperationsEnums.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="operational_tasks")
public class OperationalTask {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @JsonIgnore @ManyToOne(optional=false) @JoinColumn(name="event_id") private Event event;
    @Column(nullable=false) private String title;
    @Column(length=3000) private String description;
    @Enumerated(EnumType.STRING) private TaskType taskType=TaskType.TASK;
    private String category;
    @Enumerated(EnumType.STRING) private Priority priority=Priority.MEDIUM;
    @Enumerated(EnumType.STRING) private TaskStatus status=TaskStatus.NOT_STARTED;
    private Long assignedUserId; private String assignedUserName;
    private LocalDateTime dueDateTime; private LocalDateTime completedAt;
    @Column(length=3000) private String completionNotes;
    private Long createdByUserId; private LocalDateTime createdAt; private LocalDateTime updatedAt;
    @PrePersist void create(){createdAt=LocalDateTime.now();updatedAt=createdAt;}
    @PreUpdate void update(){updatedAt=LocalDateTime.now();}
    public Long getId(){return id;} public void setId(Long v){id=v;} public Event getEvent(){return event;} public void setEvent(Event v){event=v;}
    public String getTitle(){return title;} public void setTitle(String v){title=v;} public String getDescription(){return description;} public void setDescription(String v){description=v;}
    public TaskType getTaskType(){return taskType;} public void setTaskType(TaskType v){taskType=v;} public String getCategory(){return category;} public void setCategory(String v){category=v;}
    public Priority getPriority(){return priority;} public void setPriority(Priority v){priority=v;} public TaskStatus getStatus(){return status;} public void setStatus(TaskStatus v){status=v;}
    public Long getAssignedUserId(){return assignedUserId;} public void setAssignedUserId(Long v){assignedUserId=v;} public String getAssignedUserName(){return assignedUserName;} public void setAssignedUserName(String v){assignedUserName=v;}
    public LocalDateTime getDueDateTime(){return dueDateTime;} public void setDueDateTime(LocalDateTime v){dueDateTime=v;} public LocalDateTime getCompletedAt(){return completedAt;} public void setCompletedAt(LocalDateTime v){completedAt=v;}
    public String getCompletionNotes(){return completionNotes;} public void setCompletionNotes(String v){completionNotes=v;} public Long getCreatedByUserId(){return createdByUserId;} public void setCreatedByUserId(Long v){createdByUserId=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;}
}
