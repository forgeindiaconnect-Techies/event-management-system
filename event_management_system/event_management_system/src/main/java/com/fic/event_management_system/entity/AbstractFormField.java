package com.fic.event_management_system.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "abstract_form_fields")
public class AbstractFormField {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fieldLabel;
    private String fieldType;
    private String placeholderText;
    private Boolean required = false;
    private Boolean active = true;
    private Integer displayOrder = 0;

    @Column(length = 1000)
    private String optionsText;

    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFieldLabel() { return fieldLabel; }
    public void setFieldLabel(String fieldLabel) { this.fieldLabel = fieldLabel; }
    public String getFieldType() { return fieldType; }
    public void setFieldType(String fieldType) { this.fieldType = fieldType; }
    public String getPlaceholderText() { return placeholderText; }
    public void setPlaceholderText(String placeholderText) { this.placeholderText = placeholderText; }
    public Boolean getRequired() { return required; }
    public void setRequired(Boolean required) { this.required = required; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
    public String getOptionsText() { return optionsText; }
    public void setOptionsText(String optionsText) { this.optionsText = optionsText; }
    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }
}