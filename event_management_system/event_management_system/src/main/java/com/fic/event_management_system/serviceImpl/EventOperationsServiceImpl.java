package com.fic.event_management_system.serviceImpl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;

import com.fic.event_management_system.dto.EventOperationsDtos.BudgetRequest;
import com.fic.event_management_system.dto.EventOperationsDtos.ExpenseRequest;
import com.fic.event_management_system.dto.EventOperationsDtos.IncidentRequest;
import com.fic.event_management_system.dto.EventOperationsDtos.OperationsOverviewResponse;
import com.fic.event_management_system.dto.EventOperationsDtos.ResourceRequest;
import com.fic.event_management_system.dto.EventOperationsDtos.TaskRequest;
import com.fic.event_management_system.dto.EventOperationsDtos.VendorRequest;
import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.EventBudget;
import com.fic.event_management_system.entity.EventExpense;
import com.fic.event_management_system.entity.EventResource;
import com.fic.event_management_system.entity.EventVendor;
import com.fic.event_management_system.entity.IncidentReport;
import com.fic.event_management_system.entity.OperationalTask;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.OperationsEnums.ApprovalStatus;
import com.fic.event_management_system.enums.OperationsEnums.IncidentStatus;
import com.fic.event_management_system.enums.OperationsEnums.PaymentStatus;
import com.fic.event_management_system.enums.OperationsEnums.ResourceStatus;
import com.fic.event_management_system.enums.OperationsEnums.TaskStatus;
import com.fic.event_management_system.enums.OperationsEnums.VendorStatus;
import com.fic.event_management_system.enums.NotificationType;
import com.fic.event_management_system.enums.RoleName;
import com.fic.event_management_system.repository.EventAssignmentRepository;
import com.fic.event_management_system.repository.CoordinatorAssignmentRepository;
import com.fic.event_management_system.repository.EventBudgetRepository;
import com.fic.event_management_system.repository.EventExpenseRepository;
import com.fic.event_management_system.repository.EventResourceRepository;
import com.fic.event_management_system.repository.EventVendorRepository;
import com.fic.event_management_system.repository.IncidentReportRepository;
import com.fic.event_management_system.repository.OperationalTaskRepository;
import com.fic.event_management_system.repository.StaffAssignmentRepository;
import com.fic.event_management_system.repository.VolunteerAssignmentRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.EventOperationsService;
import com.fic.event_management_system.service.NotificationService;

@Service
@Transactional
public class EventOperationsServiceImpl implements EventOperationsService {

    private final OperationalTaskRepository taskRepository;
    private final IncidentReportRepository incidentRepository;
    private final EventResourceRepository resourceRepository;
    private final EventVendorRepository vendorRepository;
    private final EventBudgetRepository budgetRepository;
    private final EventExpenseRepository expenseRepository;
    private final TenantSecurityService tenantSecurityService;
    private final StaffAssignmentRepository staffAssignmentRepository;
    private final VolunteerAssignmentRepository volunteerAssignmentRepository;
    private final EventAssignmentRepository eventAssignmentRepository;
    private final NotificationService notificationService;
    private final CoordinatorAssignmentRepository coordinatorAssignmentRepository;

    public EventOperationsServiceImpl(
            OperationalTaskRepository taskRepository,
            IncidentReportRepository incidentRepository,
            EventResourceRepository resourceRepository,
            EventVendorRepository vendorRepository,
            EventBudgetRepository budgetRepository,
            EventExpenseRepository expenseRepository,
            TenantSecurityService tenantSecurityService,
            StaffAssignmentRepository staffAssignmentRepository,
            VolunteerAssignmentRepository volunteerAssignmentRepository,
            EventAssignmentRepository eventAssignmentRepository,
            NotificationService notificationService,
            CoordinatorAssignmentRepository coordinatorAssignmentRepository) {

        this.taskRepository = taskRepository;
        this.incidentRepository = incidentRepository;
        this.resourceRepository = resourceRepository;
        this.vendorRepository = vendorRepository;
        this.budgetRepository = budgetRepository;
        this.expenseRepository = expenseRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.staffAssignmentRepository = staffAssignmentRepository;
        this.volunteerAssignmentRepository = volunteerAssignmentRepository;
        this.eventAssignmentRepository = eventAssignmentRepository;
        this.notificationService = notificationService;
        this.coordinatorAssignmentRepository = coordinatorAssignmentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public OperationsOverviewResponse getOverview(Long eventId) {
        requireOperationsAccess();
        tenantSecurityService.getEventFromLoggedInPortal(eventId);

        long totalTasks = taskRepository.countByEventId(eventId);
        long completedTasks = taskRepository.countByEventIdAndStatus(
                eventId,
                TaskStatus.COMPLETED
        );
        long pendingTasks = Math.max(0, totalTasks - completedTasks);

        long openIncidents =
                incidentRepository.countByEventIdAndStatus(
                        eventId,
                        IncidentStatus.OPEN
                )
                + incidentRepository.countByEventIdAndStatus(
                        eventId,
                        IncidentStatus.INVESTIGATING
                );

        long totalResources = resourceRepository.countByEventId(eventId);
        long availableResources =
                resourceRepository.countByEventIdAndStatus(
                        eventId,
                        ResourceStatus.READY
                );

        long totalVendors = vendorRepository.countByEventId(eventId);
        long activeVendors =
                vendorRepository.countByEventIdAndStatus(
                        eventId,
                        VendorStatus.CONFIRMED
                );

        EventBudget budget = budgetRepository.findByEventId(eventId)
                .orElse(null);

        BigDecimal approvedBudget = budget == null
                ? BigDecimal.ZERO
                : safeAmount(budget.getApprovedBudget());

        String currency = budget == null
                ? "INR"
                : defaultCurrency(budget.getCurrency());

        BigDecimal approvedExpenses =
                expenseRepository.sumTotalAmountByEventAndApprovalStatus(
                        eventId,
                        ApprovalStatus.APPROVED
                );

        BigDecimal amountPaid =
                expenseRepository.sumAmountPaidByEventId(eventId);

        approvedExpenses = safeAmount(approvedExpenses);
        amountPaid = safeAmount(amountPaid);

        BigDecimal remainingBudget =
                approvedBudget.subtract(approvedExpenses);

        return new OperationsOverviewResponse(
                totalTasks,
                pendingTasks,
                completedTasks,
                openIncidents,
                totalResources,
                availableResources,
                totalVendors,
                activeVendors,
                approvedBudget,
                approvedExpenses,
                amountPaid,
                remainingBudget,
                currency
        );
    }

    // TASKS

    @Override
    @Transactional(readOnly = true)
    public List<OperationalTask> getTasks(Long eventId) {
        requireOperationsAccess();
        tenantSecurityService.getEventFromLoggedInPortal(eventId);

        return taskRepository.findByEventIdOrderByCreatedAtDesc(eventId);
    }

    @Override
    public OperationalTask createTask(Long eventId, TaskRequest request) {
        requireOperationsAccess();

        Event event = tenantSecurityService
                .getEventFromLoggedInPortal(eventId);

        validateRequired(request.title(), "Task title");

        OperationalTask task = new OperationalTask();
        task.setEvent(event);
        task.setCreatedByUserId(
                tenantSecurityService.getLoggedInUser().getId()
        );

        applyTask(task, request);

        return taskRepository.save(task);
    }

    @Override
    public OperationalTask updateTask(
            Long eventId,
            Long taskId,
            TaskRequest request) {

        requireOperationsAccess();

        OperationalTask task = getTaskForEvent(eventId, taskId);
        applyTask(task, request);

        return taskRepository.save(task);
    }

    @Override
    public void deleteTask(Long eventId, Long taskId) {
        requireOperationsAccess();
        taskRepository.delete(getTaskForEvent(eventId, taskId));
    }

    private void applyTask(
            OperationalTask task,
            TaskRequest request) {

        validateRequired(request.title(), "Task title");

        task.setTitle(request.title().trim());
        task.setDescription(clean(request.description()));
        task.setTaskType(request.taskType());
        task.setCategory(clean(request.category()));
        task.setPriority(request.priority());
        task.setAssignedUserId(request.assignedUserId());
        task.setAssignedUserName(clean(request.assignedUserName()));
        task.setDueDateTime(request.dueDateTime());
        task.setCompletionNotes(clean(request.completionNotes()));

        TaskStatus previousStatus = task.getStatus();
        TaskStatus newStatus = request.status() == null
                ? TaskStatus.NOT_STARTED
                : request.status();

        task.setStatus(newStatus);

        if (newStatus == TaskStatus.COMPLETED
                && previousStatus != TaskStatus.COMPLETED) {
            task.setCompletedAt(LocalDateTime.now());
        }

        if (newStatus != TaskStatus.COMPLETED) {
            task.setCompletedAt(null);
        }
    }

    private OperationalTask getTaskForEvent(
            Long eventId,
            Long taskId) {

        tenantSecurityService.getEventFromLoggedInPortal(eventId);

        OperationalTask task = taskRepository.findById(taskId)
                .orElseThrow(() ->
                        new RuntimeException("Operational task not found"));

        requireSameEvent(eventId, task.getEvent());

        return task;
    }

    // INCIDENTS

    @Override
    @Transactional(readOnly = true)
    public List<IncidentReport> getIncidents(Long eventId) {
        requireIncidentManagerAccess(eventId);
        tenantSecurityService.getEventFromLoggedInPortal(eventId);

        return incidentRepository
                .findByEventIdOrderByReportedAtDesc(eventId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncidentReport> getMyIncidents(Long eventId) {
        requireIncidentReporterAccess(eventId);

        User user = tenantSecurityService.getLoggedInUser();

        return incidentRepository
                .findByEventIdAndReportedByUserIdOrderByReportedAtDesc(
                        eventId,
                        user.getId()
                );
    }

    @Override
    public IncidentReport createIncident(
            Long eventId,
            IncidentRequest request) {

        requireIncidentReporterAccess(eventId);

        Event event = tenantSecurityService
                .getEventFromLoggedInPortal(eventId);

        validateRequired(request.title(), "Incident title");

        User loggedInUser = tenantSecurityService.getLoggedInUser();

        IncidentReport incident = new IncidentReport();
        incident.setEvent(event);
        incident.setReportedByUserId(loggedInUser.getId());
        incident.setReportedByName(loggedInUser.getEmail());

        applyIncident(incident, request);

        IncidentReport savedIncident = incidentRepository.save(incident);
        notifyIncidentManagers(savedIncident);
        return savedIncident;
    }

    @Override
    public IncidentReport updateIncident(
            Long eventId,
            Long incidentId,
            IncidentRequest request) {

        requireIncidentManagerAccess(eventId);

        IncidentReport incident =
                getIncidentForEvent(eventId, incidentId);

        applyIncident(incident, request);

        return incidentRepository.save(incident);
    }

    @Override
    public void deleteIncident(Long eventId, Long incidentId) {
        requireOperationsAccess();

        incidentRepository.delete(
                getIncidentForEvent(eventId, incidentId)
        );
    }

    private void applyIncident(
            IncidentReport incident,
            IncidentRequest request) {

        validateRequired(request.title(), "Incident title");

        incident.setTitle(request.title().trim());
        incident.setDescription(clean(request.description()));
        incident.setCategory(clean(request.category()));
        incident.setSeverity(request.severity());
        incident.setLocation(clean(request.location()));
        incident.setEvidenceUrl(clean(request.evidenceUrl()));
        incident.setAssignedUserId(request.assignedUserId());
        incident.setAssignedUserName(clean(request.assignedUserName()));
        incident.setResolutionNotes(clean(request.resolutionNotes()));

        IncidentStatus previousStatus = incident.getStatus();
        IncidentStatus newStatus = request.status() == null
                ? IncidentStatus.OPEN
                : request.status();

        incident.setStatus(newStatus);

        boolean resolved = newStatus == IncidentStatus.RESOLVED
                || newStatus == IncidentStatus.CLOSED;

        boolean wasResolved = previousStatus == IncidentStatus.RESOLVED
                || previousStatus == IncidentStatus.CLOSED;

        if (resolved && !wasResolved) {
            incident.setResolvedAt(LocalDateTime.now());
        }

        if (!resolved) {
            incident.setResolvedAt(null);
        }
    }

    private IncidentReport getIncidentForEvent(
            Long eventId,
            Long incidentId) {

        tenantSecurityService.getEventFromLoggedInPortal(eventId);

        IncidentReport incident =
                incidentRepository.findById(incidentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Incident report not found"
                                ));

        requireSameEvent(eventId, incident.getEvent());

        return incident;
    }

    // RESOURCES

    @Override
    @Transactional(readOnly = true)
    public List<EventResource> getResources(Long eventId) {
        requireOperationsAccess();
        tenantSecurityService.getEventFromLoggedInPortal(eventId);

        return resourceRepository
                .findByEventIdOrderByCreatedAtDesc(eventId);
    }

    @Override
    public EventResource createResource(
            Long eventId,
            ResourceRequest request) {

        requireOperationsAccess();

        Event event = tenantSecurityService
                .getEventFromLoggedInPortal(eventId);

        validateRequired(request.name(), "Resource name");

        EventResource resource = new EventResource();
        resource.setEvent(event);

        applyResource(eventId, resource, request);

        return resourceRepository.save(resource);
    }

    @Override
    public EventResource updateResource(
            Long eventId,
            Long resourceId,
            ResourceRequest request) {

        requireOperationsAccess();

        EventResource resource =
                getResourceForEvent(eventId, resourceId);

        applyResource(eventId, resource, request);

        return resourceRepository.save(resource);
    }

    @Override
    public void deleteResource(Long eventId, Long resourceId) {
        requireOperationsAccess();

        resourceRepository.delete(
                getResourceForEvent(eventId, resourceId)
        );
    }

    private void applyResource(
            Long eventId,
            EventResource resource,
            ResourceRequest request) {

        validateRequired(request.name(), "Resource name");

        resource.setName(request.name().trim());
        resource.setCategory(clean(request.category()));
        resource.setOwnershipType(request.ownershipType());
        resource.setTotalQuantity(request.totalQuantity());
        resource.setRequiredQuantity(request.requiredQuantity());
        resource.setAvailableQuantity(request.availableQuantity());
        resource.setAllocatedQuantity(request.allocatedQuantity());
        resource.setCondition(request.condition());
        resource.setStatus(request.status());
        resource.setLocation(clean(request.location()));
        resource.setResponsibleUserId(request.responsibleUserId());
        resource.setResponsibleUserName(
                clean(request.responsibleUserName())
        );
        resource.setCheckoutDateTime(request.checkoutDateTime());
        resource.setReturnDateTime(request.returnDateTime());
        resource.setNotes(clean(request.notes()));

        if (request.vendorId() == null) {
            resource.setVendor(null);
        } else {
            resource.setVendor(
                    getVendorForEvent(eventId, request.vendorId())
            );
        }
    }

    private EventResource getResourceForEvent(
            Long eventId,
            Long resourceId) {

        tenantSecurityService.getEventFromLoggedInPortal(eventId);

        EventResource resource =
                resourceRepository.findById(resourceId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Event resource not found"
                                ));

        requireSameEvent(eventId, resource.getEvent());

        return resource;
    }

    // VENDORS

    @Override
    @Transactional(readOnly = true)
    public List<EventVendor> getVendors(Long eventId) {
        requireOperationsAccess();
        tenantSecurityService.getEventFromLoggedInPortal(eventId);

        return vendorRepository
                .findByEventIdOrderByCreatedAtDesc(eventId);
    }

    @Override
    public EventVendor createVendor(
            Long eventId,
            VendorRequest request) {

        requireOperationsAccess();

        Event event = tenantSecurityService
                .getEventFromLoggedInPortal(eventId);

        validateRequired(request.companyName(), "Vendor company name");

        EventVendor vendor = new EventVendor();
        vendor.setEvent(event);

        applyVendor(vendor, request);

        return vendorRepository.save(vendor);
    }

    @Override
    public EventVendor updateVendor(
            Long eventId,
            Long vendorId,
            VendorRequest request) {

        requireOperationsAccess();

        EventVendor vendor = getVendorForEvent(eventId, vendorId);
        applyVendor(vendor, request);

        return vendorRepository.save(vendor);
    }

    @Override
    public void deleteVendor(Long eventId, Long vendorId) {
        requireOperationsAccess();

        EventVendor vendor = getVendorForEvent(eventId, vendorId);

        boolean usedByResource = resourceRepository
                .findByEventIdOrderByCreatedAtDesc(eventId)
                .stream()
                .anyMatch(resource ->
                        resource.getVendor() != null
                        && vendorId.equals(resource.getVendor().getId()));

        boolean usedByExpense = expenseRepository
                .findByEventIdOrderByCreatedAtDesc(eventId)
                .stream()
                .anyMatch(expense ->
                        expense.getVendor() != null
                        && vendorId.equals(expense.getVendor().getId()));

        if (usedByResource || usedByExpense) {
            throw new RuntimeException(
                    "Vendor is linked to a resource or expense"
            );
        }

        vendorRepository.delete(vendor);
    }

    private void applyVendor(
            EventVendor vendor,
            VendorRequest request) {

        validateRequired(
                request.companyName(),
                "Vendor company name"
        );

        vendor.setCompanyName(request.companyName().trim());
        vendor.setContactPerson(clean(request.contactPerson()));
        vendor.setEmail(clean(request.email()));
        vendor.setPhone(clean(request.phone()));
        vendor.setServiceCategory(clean(request.serviceCategory()));
        vendor.setStatus(request.status());
        vendor.setContractAmount(
                safeAmount(request.contractAmount())
        );
        vendor.setAdvancePaid(
                safeAmount(request.advancePaid())
        );
        vendor.setDeliveryDeadline(request.deliveryDeadline());
        vendor.setDeliveryStatus(request.deliveryStatus());
        vendor.setPaymentStatus(request.paymentStatus());
        vendor.setNotes(clean(request.notes()));
    }

    private EventVendor getVendorForEvent(
            Long eventId,
            Long vendorId) {

        tenantSecurityService.getEventFromLoggedInPortal(eventId);

        EventVendor vendor =
                vendorRepository.findById(vendorId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Event vendor not found"
                                ));

        requireSameEvent(eventId, vendor.getEvent());

        return vendor;
    }

    // BUDGET

    @Override
    public EventBudget getBudget(Long eventId) {
        requireOperationsAccess();

        Event event = tenantSecurityService
                .getEventFromLoggedInPortal(eventId);

        return budgetRepository.findByEventId(eventId)
                .orElseGet(() -> {
                    EventBudget budget = new EventBudget();
                    budget.setEvent(event);
                    budget.setApprovedBudget(BigDecimal.ZERO);
                    budget.setCurrency("INR");
                    budget.setCreatedByUserId(
                            tenantSecurityService
                                    .getLoggedInUser()
                                    .getId()
                    );
                    return budgetRepository.save(budget);
                });
    }

    @Override
    public EventBudget updateBudget(
            Long eventId,
            BudgetRequest request) {

        requireOperationsAccess();

        EventBudget budget = getBudget(eventId);
        budget.setApprovedBudget(
                safeAmount(request.approvedBudget())
        );
        budget.setCurrency(defaultCurrency(request.currency()));
        budget.setNotes(clean(request.notes()));

        return budgetRepository.save(budget);
    }

    // EXPENSES

    @Override
    @Transactional(readOnly = true)
    public List<EventExpense> getExpenses(Long eventId) {
        requireOperationsAccess();
        tenantSecurityService.getEventFromLoggedInPortal(eventId);

        return expenseRepository
                .findByEventIdOrderByCreatedAtDesc(eventId);
    }

    @Override
    public EventExpense createExpense(
            Long eventId,
            ExpenseRequest request) {

        requireOperationsAccess();

        Event event = tenantSecurityService
                .getEventFromLoggedInPortal(eventId);

        validateRequired(request.title(), "Expense title");
        validateRequired(request.category(), "Expense category");

        User loggedInUser = tenantSecurityService.getLoggedInUser();

        EventExpense expense = new EventExpense();
        expense.setEvent(event);
        expense.setEnteredByUserId(loggedInUser.getId());
        expense.setEnteredByUserName(loggedInUser.getEmail());

        applyExpense(eventId, expense, request);

        return expenseRepository.save(expense);
    }

    @Override
    public EventExpense updateExpense(
            Long eventId,
            Long expenseId,
            ExpenseRequest request) {

        requireOperationsAccess();

        EventExpense expense =
                getExpenseForEvent(eventId, expenseId);

        applyExpense(eventId, expense, request);

        return expenseRepository.save(expense);
    }

    @Override
    public void deleteExpense(Long eventId, Long expenseId) {
        requireOperationsAccess();

        expenseRepository.delete(
                getExpenseForEvent(eventId, expenseId)
        );
    }

    private void applyExpense(
            Long eventId,
            EventExpense expense,
            ExpenseRequest request) {

        validateRequired(request.title(), "Expense title");
        validateRequired(request.category(), "Expense category");

        expense.setTitle(request.title().trim());
        expense.setCategory(request.category().trim());
        expense.setDescription(clean(request.description()));
        expense.setSubtotal(safeAmount(request.subtotal()));
        expense.setTaxAmount(safeAmount(request.taxAmount()));
        expense.setAmountPaid(safeAmount(request.amountPaid()));
        expense.setCurrency(defaultCurrency(request.currency()));
        expense.setPaymentMethod(clean(request.paymentMethod()));
        expense.setPaymentDate(request.paymentDate());
        expense.setInvoiceNumber(clean(request.invoiceNumber()));
        expense.setReceiptUrl(clean(request.receiptUrl()));
        expense.setNotes(clean(request.notes()));

        if (request.vendorId() == null) {
            expense.setVendor(null);
        } else {
            expense.setVendor(
                    getVendorForEvent(eventId, request.vendorId())
            );
        }

        ApprovalStatus previousApproval =
                expense.getApprovalStatus();

        ApprovalStatus newApproval =
                request.approvalStatus() == null
                        ? ApprovalStatus.PENDING
                        : request.approvalStatus();

        expense.setApprovalStatus(newApproval);

        if (newApproval == ApprovalStatus.APPROVED
                && previousApproval != ApprovalStatus.APPROVED) {

            User approver = tenantSecurityService.getLoggedInUser();
            expense.setApprovedByUserId(approver.getId());
            expense.setApprovedByUserName(approver.getEmail());
        }

        if (newApproval != ApprovalStatus.APPROVED) {
            expense.setApprovedByUserId(null);
            expense.setApprovedByUserName(null);
        }

        if (request.paymentStatus() != null) {
            expense.setPaymentStatus(request.paymentStatus());
        } else {
            expense.setPaymentStatus(
                    calculatePaymentStatus(
                            request.subtotal(),
                            request.taxAmount(),
                            request.amountPaid()
                    )
            );
        }
    }

    private EventExpense getExpenseForEvent(
            Long eventId,
            Long expenseId) {

        tenantSecurityService.getEventFromLoggedInPortal(eventId);

        EventExpense expense =
                expenseRepository.findById(expenseId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Event expense not found"
                                ));

        requireSameEvent(eventId, expense.getEvent());

        return expense;
    }

    // COMMON HELPERS

    private PaymentStatus calculatePaymentStatus(
            BigDecimal subtotal,
            BigDecimal taxAmount,
            BigDecimal amountPaid) {

        BigDecimal total = safeAmount(subtotal)
                .add(safeAmount(taxAmount));

        BigDecimal paid = safeAmount(amountPaid);

        if (total.signum() == 0 || paid.signum() == 0) {
            return PaymentStatus.NOT_STARTED;
        }

        if (paid.compareTo(total) >= 0) {
            return PaymentStatus.PAID;
        }

        return PaymentStatus.PARTIALLY_PAID;
    }

    private void requireOperationsAccess() {
        tenantSecurityService.requirePortalAdminOrOrganizer();
    }

    private void notifyIncidentManagers(IncidentReport incident) {
        Event event = incident.getEvent();
        Map<Long, User> recipients = new LinkedHashMap<>();

        if (event.getPortal() != null && event.getPortal().getAdmin() != null) {
            recipients.put(event.getPortal().getAdmin().getId(), event.getPortal().getAdmin());
        }

        if (event.getOrganizer() != null) {
            recipients.put(event.getOrganizer().getId(), event.getOrganizer());
        }

        eventAssignmentRepository
                .findByEventIdAndActiveTrueOrderByCreatedAtDesc(event.getId())
                .stream()
                .filter(assignment -> assignment.getRoleName() == RoleName.COORDINATOR)
                .map(assignment -> assignment.getUser())
                .filter(user -> user != null && user.getId() != null)
                .forEach(user -> recipients.put(user.getId(), user));

        recipients.values().forEach(recipient -> {
            try {
                notificationService.createNotification(
                        recipient,
                        event.getPortal(),
                        event,
                        NotificationType.SYSTEM_ALERT,
                        "New incident reported",
                        incident.getTitle() + " (" + incident.getSeverity() + ") at "
                                + (incident.getLocation() == null || incident.getLocation().isBlank()
                                        ? "the event venue"
                                        : incident.getLocation()),
                        "/events/" + event.getId() + "/operations/incidents",
                        "INCIDENT_" + incident.getId() + "_USER_" + recipient.getId()
                );
            } catch (RuntimeException ignored) {
                // An unavailable notification must not discard the incident report.
            }
        });
    }

    private void requireIncidentReporterAccess(Long eventId) {
        Event event = tenantSecurityService
                .getEventFromLoggedInPortal(eventId);

        if (tenantSecurityService.isSuperAdmin()
                || tenantSecurityService.isPortalAdmin()
                || tenantSecurityService.isOrganizer()) {
            return;
        }

        User user = tenantSecurityService.getLoggedInUser();
        boolean assigned = staffAssignmentRepository
                .existsByEventIdAndStaffIdAndActiveTrue(
                        event.getId(),
                        user.getId()
                )
                || volunteerAssignmentRepository
                        .existsByVolunteerIdAndEventIdAndActiveTrue(
                                user.getId(),
                                event.getId()
                        )
                || coordinatorAssignmentRepository
                        .existsByCoordinatorIdAndEventIdAndActiveTrue(
                                user.getId(),
                                event.getId()
                        );

        if (!assigned) {
            throw new AccessDeniedException(
                    "You are not assigned to this event"
            );
        }
    }

    private void requireIncidentManagerAccess(Long eventId) {
        Event event = tenantSecurityService
                .getEventFromLoggedInPortal(eventId);

        if (tenantSecurityService.isSuperAdmin()
                || tenantSecurityService.isPortalAdmin()
                || tenantSecurityService.isOrganizer()) {
            return;
        }

        User user = tenantSecurityService.getLoggedInUser();
        boolean assignedCoordinator = tenantSecurityService.hasRole("COORDINATOR")
                && coordinatorAssignmentRepository
                        .existsByCoordinatorIdAndEventIdAndActiveTrue(
                                user.getId(),
                                event.getId()
                        );

        if (!assignedCoordinator) {
            throw new AccessDeniedException(
                    "You are not assigned to manage this event"
            );
        }
    }

    private void requireSameEvent(Long eventId, Event event) {
        if (event == null
                || event.getId() == null
                || !eventId.equals(event.getId())) {

            throw new RuntimeException(
                    "Record does not belong to this event"
            );
        }

        tenantSecurityService.requireEventInLoggedInPortal(event);
    }

    private void validateRequired(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(
                    fieldName + " is required"
            );
        }
    }

    private BigDecimal safeAmount(BigDecimal amount) {
        if (amount == null || amount.signum() < 0) {
            return BigDecimal.ZERO;
        }

        return amount;
    }

    private String defaultCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return "INR";
        }

        return currency.trim().toUpperCase();
    }

    private String clean(String value) {
        return value == null ? null : value.trim();
    }
}
