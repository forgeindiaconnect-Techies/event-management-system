package com.fic.event_management_system.service;

import java.util.List;

import com.fic.event_management_system.dto.EventOperationsDtos.BudgetRequest;
import com.fic.event_management_system.dto.EventOperationsDtos.ExpenseRequest;
import com.fic.event_management_system.dto.EventOperationsDtos.IncidentRequest;
import com.fic.event_management_system.dto.EventOperationsDtos.OperationsOverviewResponse;
import com.fic.event_management_system.dto.EventOperationsDtos.ResourceRequest;
import com.fic.event_management_system.dto.EventOperationsDtos.TaskRequest;
import com.fic.event_management_system.dto.EventOperationsDtos.VendorRequest;
import com.fic.event_management_system.entity.EventBudget;
import com.fic.event_management_system.entity.EventExpense;
import com.fic.event_management_system.entity.EventResource;
import com.fic.event_management_system.entity.EventVendor;
import com.fic.event_management_system.entity.IncidentReport;
import com.fic.event_management_system.entity.OperationalTask;

public interface EventOperationsService {

    OperationsOverviewResponse getOverview(Long eventId);

    List<OperationalTask> getTasks(Long eventId);

    OperationalTask createTask(Long eventId, TaskRequest request);

    OperationalTask updateTask(Long eventId, Long taskId, TaskRequest request);

    void deleteTask(Long eventId, Long taskId);

    List<IncidentReport> getIncidents(Long eventId);

    List<IncidentReport> getMyIncidents(Long eventId);

    IncidentReport createIncident(Long eventId, IncidentRequest request);

    IncidentReport updateIncident(
            Long eventId,
            Long incidentId,
            IncidentRequest request
    );

    void deleteIncident(Long eventId, Long incidentId);

    List<EventResource> getResources(Long eventId);

    EventResource createResource(Long eventId, ResourceRequest request);

    EventResource updateResource(
            Long eventId,
            Long resourceId,
            ResourceRequest request
    );

    void deleteResource(Long eventId, Long resourceId);

    List<EventVendor> getVendors(Long eventId);

    EventVendor createVendor(Long eventId, VendorRequest request);

    EventVendor updateVendor(
            Long eventId,
            Long vendorId,
            VendorRequest request
    );

    void deleteVendor(Long eventId, Long vendorId);

    EventBudget getBudget(Long eventId);

    EventBudget updateBudget(Long eventId, BudgetRequest request);

    List<EventExpense> getExpenses(Long eventId);

    EventExpense createExpense(Long eventId, ExpenseRequest request);

    EventExpense updateExpense(
            Long eventId,
            Long expenseId,
            ExpenseRequest request
    );

    void deleteExpense(Long eventId, Long expenseId);
}
