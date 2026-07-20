package com.fic.event_management_system.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fic.event_management_system.enums.OperationsEnums.ApprovalStatus;
import com.fic.event_management_system.enums.OperationsEnums.DeliveryStatus;
import com.fic.event_management_system.enums.OperationsEnums.IncidentSeverity;
import com.fic.event_management_system.enums.OperationsEnums.IncidentStatus;
import com.fic.event_management_system.enums.OperationsEnums.PaymentStatus;
import com.fic.event_management_system.enums.OperationsEnums.Priority;
import com.fic.event_management_system.enums.OperationsEnums.ResourceCondition;
import com.fic.event_management_system.enums.OperationsEnums.ResourceOwnership;
import com.fic.event_management_system.enums.OperationsEnums.ResourceStatus;
import com.fic.event_management_system.enums.OperationsEnums.TaskStatus;
import com.fic.event_management_system.enums.OperationsEnums.TaskType;
import com.fic.event_management_system.enums.OperationsEnums.VendorStatus;

public final class EventOperationsDtos {

    private EventOperationsDtos() {
    }

    public record TaskRequest(
            String title,
            String description,
            TaskType taskType,
            String category,
            Priority priority,
            TaskStatus status,
            Long assignedUserId,
            String assignedUserName,
            LocalDateTime dueDateTime,
            String completionNotes
    ) {
    }

    public record IncidentRequest(
            String title,
            String description,
            String category,
            IncidentSeverity severity,
            IncidentStatus status,
            String location,
            String evidenceUrl,
            Long assignedUserId,
            String assignedUserName,
            String resolutionNotes
    ) {
    }

    public record ResourceRequest(
            String name,
            String category,
            ResourceOwnership ownershipType,
            Integer totalQuantity,
            Integer requiredQuantity,
            Integer availableQuantity,
            Integer allocatedQuantity,
            ResourceCondition condition,
            ResourceStatus status,
            String location,
            Long responsibleUserId,
            String responsibleUserName,
            Long vendorId,
            LocalDateTime checkoutDateTime,
            LocalDateTime returnDateTime,
            String notes
    ) {
    }

    public record VendorRequest(
            String companyName,
            String contactPerson,
            String email,
            String phone,
            String serviceCategory,
            VendorStatus status,
            BigDecimal contractAmount,
            BigDecimal advancePaid,
            LocalDateTime deliveryDeadline,
            DeliveryStatus deliveryStatus,
            PaymentStatus paymentStatus,
            String notes
    ) {
    }

    public record BudgetRequest(
            BigDecimal approvedBudget,
            String currency,
            String notes
    ) {
    }

    public record ExpenseRequest(
            String title,
            String category,
            String description,
            Long vendorId,
            BigDecimal subtotal,
            BigDecimal taxAmount,
            BigDecimal amountPaid,
            String currency,
            PaymentStatus paymentStatus,
            ApprovalStatus approvalStatus,
            String paymentMethod,
            LocalDate paymentDate,
            String invoiceNumber,
            String receiptUrl,
            String notes
    ) {
    }

    public record OperationsOverviewResponse(
            long totalTasks,
            long pendingTasks,
            long completedTasks,
            long openIncidents,
            long totalResources,
            long availableResources,
            long totalVendors,
            long activeVendors,
            BigDecimal approvedBudget,
            BigDecimal approvedExpenses,
            BigDecimal amountPaid,
            BigDecimal remainingBudget,
            String currency
    ) {
    }
}
