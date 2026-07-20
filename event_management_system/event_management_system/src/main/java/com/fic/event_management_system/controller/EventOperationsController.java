package com.fic.event_management_system.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
import com.fic.event_management_system.service.EventOperationsService;

@RestController
@RequestMapping("/api/events/{eventId}/operations")
public class EventOperationsController {

    private final EventOperationsService operationsService;

    public EventOperationsController(
            EventOperationsService operationsService) {
        this.operationsService = operationsService;
    }

    // OVERVIEW

    @GetMapping("/overview")
    public ResponseEntity<OperationsOverviewResponse> getOverview(
            @PathVariable Long eventId) {

        return ResponseEntity.ok(
                operationsService.getOverview(eventId)
        );
    }

    // TASKS AND CHECKLISTS

    @GetMapping("/tasks")
    public ResponseEntity<List<OperationalTask>> getTasks(
            @PathVariable Long eventId) {

        return ResponseEntity.ok(
                operationsService.getTasks(eventId)
        );
    }

    @PostMapping("/tasks")
    public ResponseEntity<OperationalTask> createTask(
            @PathVariable Long eventId,
            @RequestBody TaskRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(operationsService.createTask(eventId, request));
    }

    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<OperationalTask> updateTask(
            @PathVariable Long eventId,
            @PathVariable Long taskId,
            @RequestBody TaskRequest request) {

        return ResponseEntity.ok(
                operationsService.updateTask(eventId, taskId, request)
        );
    }

    @DeleteMapping("/tasks/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long eventId,
            @PathVariable Long taskId) {

        operationsService.deleteTask(eventId, taskId);
        return ResponseEntity.noContent().build();
    }

    // INCIDENTS

    @GetMapping("/incidents")
    public ResponseEntity<List<IncidentReport>> getIncidents(
            @PathVariable Long eventId) {

        return ResponseEntity.ok(
                operationsService.getIncidents(eventId)
        );
    }

    @PostMapping("/incidents")
    public ResponseEntity<IncidentReport> createIncident(
            @PathVariable Long eventId,
            @RequestBody IncidentRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(
                        operationsService.createIncident(
                                eventId,
                                request
                        )
                );
    }

    @PutMapping("/incidents/{incidentId}")
    public ResponseEntity<IncidentReport> updateIncident(
            @PathVariable Long eventId,
            @PathVariable Long incidentId,
            @RequestBody IncidentRequest request) {

        return ResponseEntity.ok(
                operationsService.updateIncident(
                        eventId,
                        incidentId,
                        request
                )
        );
    }

    @DeleteMapping("/incidents/{incidentId}")
    public ResponseEntity<Void> deleteIncident(
            @PathVariable Long eventId,
            @PathVariable Long incidentId) {

        operationsService.deleteIncident(eventId, incidentId);
        return ResponseEntity.noContent().build();
    }

    // RESOURCES

    @GetMapping("/resources")
    public ResponseEntity<List<EventResource>> getResources(
            @PathVariable Long eventId) {

        return ResponseEntity.ok(
                operationsService.getResources(eventId)
        );
    }

    @PostMapping("/resources")
    public ResponseEntity<EventResource> createResource(
            @PathVariable Long eventId,
            @RequestBody ResourceRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(
                        operationsService.createResource(
                                eventId,
                                request
                        )
                );
    }

    @PutMapping("/resources/{resourceId}")
    public ResponseEntity<EventResource> updateResource(
            @PathVariable Long eventId,
            @PathVariable Long resourceId,
            @RequestBody ResourceRequest request) {

        return ResponseEntity.ok(
                operationsService.updateResource(
                        eventId,
                        resourceId,
                        request
                )
        );
    }

    @DeleteMapping("/resources/{resourceId}")
    public ResponseEntity<Void> deleteResource(
            @PathVariable Long eventId,
            @PathVariable Long resourceId) {

        operationsService.deleteResource(eventId, resourceId);
        return ResponseEntity.noContent().build();
    }

    // VENDORS

    @GetMapping("/vendors")
    public ResponseEntity<List<EventVendor>> getVendors(
            @PathVariable Long eventId) {

        return ResponseEntity.ok(
                operationsService.getVendors(eventId)
        );
    }

    @PostMapping("/vendors")
    public ResponseEntity<EventVendor> createVendor(
            @PathVariable Long eventId,
            @RequestBody VendorRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(
                        operationsService.createVendor(
                                eventId,
                                request
                        )
                );
    }

    @PutMapping("/vendors/{vendorId}")
    public ResponseEntity<EventVendor> updateVendor(
            @PathVariable Long eventId,
            @PathVariable Long vendorId,
            @RequestBody VendorRequest request) {

        return ResponseEntity.ok(
                operationsService.updateVendor(
                        eventId,
                        vendorId,
                        request
                )
        );
    }

    @DeleteMapping("/vendors/{vendorId}")
    public ResponseEntity<Void> deleteVendor(
            @PathVariable Long eventId,
            @PathVariable Long vendorId) {

        operationsService.deleteVendor(eventId, vendorId);
        return ResponseEntity.noContent().build();
    }

    // BUDGET

    @GetMapping("/budget")
    public ResponseEntity<EventBudget> getBudget(
            @PathVariable Long eventId) {

        return ResponseEntity.ok(
                operationsService.getBudget(eventId)
        );
    }

    @PutMapping("/budget")
    public ResponseEntity<EventBudget> updateBudget(
            @PathVariable Long eventId,
            @RequestBody BudgetRequest request) {

        return ResponseEntity.ok(
                operationsService.updateBudget(eventId, request)
        );
    }

    // EXPENSES

    @GetMapping("/expenses")
    public ResponseEntity<List<EventExpense>> getExpenses(
            @PathVariable Long eventId) {

        return ResponseEntity.ok(
                operationsService.getExpenses(eventId)
        );
    }

    @PostMapping("/expenses")
    public ResponseEntity<EventExpense> createExpense(
            @PathVariable Long eventId,
            @RequestBody ExpenseRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(
                        operationsService.createExpense(
                                eventId,
                                request
                        )
                );
    }

    @PutMapping("/expenses/{expenseId}")
    public ResponseEntity<EventExpense> updateExpense(
            @PathVariable Long eventId,
            @PathVariable Long expenseId,
            @RequestBody ExpenseRequest request) {

        return ResponseEntity.ok(
                operationsService.updateExpense(
                        eventId,
                        expenseId,
                        request
                )
        );
    }

    @DeleteMapping("/expenses/{expenseId}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable Long eventId,
            @PathVariable Long expenseId) {

        operationsService.deleteExpense(eventId, expenseId);
        return ResponseEntity.noContent().build();
    }
}