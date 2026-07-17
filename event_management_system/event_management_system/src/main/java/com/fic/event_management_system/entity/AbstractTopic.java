package com.fic.event_management_system.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "abstract_topics")
public class AbstractTopic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String topicName;
    private String submissionType;
    private String description;
    private String status = "Active";

    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTopicName() { return topicName; }
    public void setTopicName(String topicName) { this.topicName = topicName; }
    public String getSubmissionType() { return submissionType; }
    public void setSubmissionType(String submissionType) { this.submissionType = submissionType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }
}