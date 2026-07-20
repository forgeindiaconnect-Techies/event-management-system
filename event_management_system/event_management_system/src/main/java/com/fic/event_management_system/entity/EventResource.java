package com.fic.event_management_system.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fic.event_management_system.enums.OperationsEnums.ResourceCondition;
import com.fic.event_management_system.enums.OperationsEnums.ResourceOwnership;
import com.fic.event_management_system.enums.OperationsEnums.ResourceStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "event_resources")
public class EventResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false)
    private String name;

    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceOwnership ownershipType = ResourceOwnership.OWNED;

    @Column(nullable = false)
    private Integer totalQuantity = 0;

    @Column(nullable = false)
    private Integer requiredQuantity = 0;

    @Column(nullable = false)
    private Integer availableQuantity = 0;

    @Column(nullable = false)
    private Integer allocatedQuantity = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_condition")
    private ResourceCondition condition = ResourceCondition.GOOD;

    @Enumerated(EnumType.STRING)
    private ResourceStatus status = ResourceStatus.REQUESTED;

    private String location;

    private Long responsibleUserId;

    private String responsibleUserName;

    @ManyToOne
    @JoinColumn(name = "vendor_id")
    private EventVendor vendor;

    private LocalDateTime checkoutDateTime;

    private LocalDateTime returnDateTime;

    @Column(length = 3000)
    private String notes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        normalizeQuantities();
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
        normalizeQuantities();
    }

    private void normalizeQuantities() {
        totalQuantity = normalize(totalQuantity);
        requiredQuantity = normalize(requiredQuantity);
        availableQuantity = normalize(availableQuantity);
        allocatedQuantity = normalize(allocatedQuantity);
    }

    private int normalize(Integer quantity) {
        return quantity == null || quantity < 0 ? 0 : quantity;
    }

    @Transient
    public int getShortageQuantity() {
        return Math.max(0, normalize(requiredQuantity) - normalize(availableQuantity));
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Event getEvent() {
        return event;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public ResourceOwnership getOwnershipType() {
        return ownershipType;
    }

    public void setOwnershipType(ResourceOwnership ownershipType) {
        this.ownershipType = ownershipType;
    }

    public Integer getTotalQuantity() {
        return totalQuantity;
    }

    public void setTotalQuantity(Integer totalQuantity) {
        this.totalQuantity = totalQuantity;
    }

    public Integer getRequiredQuantity() {
        return requiredQuantity;
    }

    public void setRequiredQuantity(Integer requiredQuantity) {
        this.requiredQuantity = requiredQuantity;
    }

    public Integer getAvailableQuantity() {
        return availableQuantity;
    }

    public void setAvailableQuantity(Integer availableQuantity) {
        this.availableQuantity = availableQuantity;
    }

    public Integer getAllocatedQuantity() {
        return allocatedQuantity;
    }

    public void setAllocatedQuantity(Integer allocatedQuantity) {
        this.allocatedQuantity = allocatedQuantity;
    }

    public ResourceCondition getCondition() {
        return condition;
    }

    public void setCondition(ResourceCondition condition) {
        this.condition = condition;
    }

    public ResourceStatus getStatus() {
        return status;
    }

    public void setStatus(ResourceStatus status) {
        this.status = status;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Long getResponsibleUserId() {
        return responsibleUserId;
    }

    public void setResponsibleUserId(Long responsibleUserId) {
        this.responsibleUserId = responsibleUserId;
    }

    public String getResponsibleUserName() {
        return responsibleUserName;
    }

    public void setResponsibleUserName(String responsibleUserName) {
        this.responsibleUserName = responsibleUserName;
    }

    public EventVendor getVendor() {
        return vendor;
    }

    public void setVendor(EventVendor vendor) {
        this.vendor = vendor;
    }

    public LocalDateTime getCheckoutDateTime() {
        return checkoutDateTime;
    }

    public void setCheckoutDateTime(LocalDateTime checkoutDateTime) {
        this.checkoutDateTime = checkoutDateTime;
    }

    public LocalDateTime getReturnDateTime() {
        return returnDateTime;
    }

    public void setReturnDateTime(LocalDateTime returnDateTime) {
        this.returnDateTime = returnDateTime;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
