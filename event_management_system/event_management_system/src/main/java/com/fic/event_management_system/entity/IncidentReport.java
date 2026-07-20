package com.fic.event_management_system.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fic.event_management_system.enums.OperationsEnums.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="incident_reports")
public class IncidentReport {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @JsonIgnore @ManyToOne(optional=false) @JoinColumn(name="event_id") private Event event;
    @Column(nullable=false) private String title; @Column(length=4000) private String description;
    private String category; @Enumerated(EnumType.STRING) private IncidentSeverity severity=IncidentSeverity.MEDIUM;
    @Enumerated(EnumType.STRING) private IncidentStatus status=IncidentStatus.OPEN; private String location;
    private Long reportedByUserId; private String reportedByName; private Long assignedUserId; private String assignedUserName;
    @Column(length=1000) private String evidenceUrl;
    private LocalDateTime reportedAt; private LocalDateTime resolvedAt; @Column(length=4000) private String resolutionNotes;
    @PrePersist void create(){reportedAt=LocalDateTime.now();}
    public Long getId(){return id;} public void setId(Long v){id=v;} public Event getEvent(){return event;} public void setEvent(Event v){event=v;}
    public String getTitle(){return title;} public void setTitle(String v){title=v;} public String getDescription(){return description;} public void setDescription(String v){description=v;}
    public String getCategory(){return category;} public void setCategory(String v){category=v;} public IncidentSeverity getSeverity(){return severity;} public void setSeverity(IncidentSeverity v){severity=v;}
    public IncidentStatus getStatus(){return status;} public void setStatus(IncidentStatus v){status=v;} public String getLocation(){return location;} public void setLocation(String v){location=v;}
    public Long getReportedByUserId(){return reportedByUserId;} public void setReportedByUserId(Long v){reportedByUserId=v;} public String getReportedByName(){return reportedByName;} public void setReportedByName(String v){reportedByName=v;}
    public Long getAssignedUserId(){return assignedUserId;} public void setAssignedUserId(Long v){assignedUserId=v;} public String getAssignedUserName(){return assignedUserName;} public void setAssignedUserName(String v){assignedUserName=v;}
    public String getEvidenceUrl(){return evidenceUrl;} public void setEvidenceUrl(String v){evidenceUrl=v;}
    public LocalDateTime getReportedAt(){return reportedAt;} public LocalDateTime getResolvedAt(){return resolvedAt;} public void setResolvedAt(LocalDateTime v){resolvedAt=v;} public String getResolutionNotes(){return resolutionNotes;} public void setResolutionNotes(String v){resolutionNotes=v;}
}
