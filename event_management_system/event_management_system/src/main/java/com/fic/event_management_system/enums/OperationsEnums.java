package com.fic.event_management_system.enums;

public final class OperationsEnums {
    private OperationsEnums() {}
    public enum TaskType { TASK, CHECKLIST_ITEM }
    public enum TaskStatus { NOT_STARTED, IN_PROGRESS, BLOCKED, COMPLETED, CANCELLED }
    public enum Priority { LOW, MEDIUM, HIGH, URGENT }
    public enum IncidentSeverity { LOW, MEDIUM, HIGH, CRITICAL }
    public enum IncidentStatus { OPEN, INVESTIGATING, RESOLVED, CLOSED }
    public enum ResourceOwnership { OWNED, RENTED, VENUE_PROVIDED, SPONSORED, BORROWED }
    public enum ResourceCondition { EXCELLENT, GOOD, FAIR, DAMAGED, UNDER_MAINTENANCE }
    public enum ResourceStatus { REQUESTED, CONFIRMED, DELIVERED, READY, CHECKED_OUT, RETURNED }
    public enum VendorStatus { PROSPECT, PENDING, CONFIRMED, COMPLETED, CANCELLED }
    public enum DeliveryStatus { NOT_SCHEDULED, SCHEDULED, IN_TRANSIT, DELIVERED, DELAYED }
    public enum PaymentStatus { NOT_STARTED, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED }
    public enum ApprovalStatus { DRAFT, PENDING, APPROVED, REJECTED, CHANGES_REQUESTED }
}
