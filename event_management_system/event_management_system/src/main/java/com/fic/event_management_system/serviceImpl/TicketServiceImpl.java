package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.Ticket;
import com.fic.event_management_system.enums.TicketStatus;
import com.fic.event_management_system.repository.EventAssignmentRepository;
import com.fic.event_management_system.repository.StaffAssignmentRepository;
import com.fic.event_management_system.repository.TicketRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.TicketService;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final StaffAssignmentRepository staffAssignmentRepository;
    private final EventAssignmentRepository eventAssignmentRepository;
    private final TenantSecurityService tenantSecurityService;

    public TicketServiceImpl(
            TicketRepository ticketRepository,
            StaffAssignmentRepository staffAssignmentRepository,
            EventAssignmentRepository eventAssignmentRepository,
            TenantSecurityService tenantSecurityService) {

        this.ticketRepository = ticketRepository;
        this.staffAssignmentRepository = staffAssignmentRepository;
        this.eventAssignmentRepository = eventAssignmentRepository;
        this.tenantSecurityService = tenantSecurityService;
    }

    @Override
    public List<Ticket> getAllTickets() {
        return ticketRepository.findByRegistration_Event_Portal_Id(
                tenantSecurityService.getLoggedInPortalId()
        );
    }

    @Override
    public Ticket getTicketById(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        requireTicketEventInLoggedInPortal(ticket);
        return ticket;
    }

    @Override
    public Ticket getTicketByRegistration(Long registrationId) {
        return ticketRepository.findFirstByRegistrationIdOrderByIdAsc(registrationId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
    }

    @Override
    public List<Ticket> getTicketsByRegistration(Long registrationId) {
        return ticketRepository.findByRegistrationIdOrderByIdAsc(registrationId);
    }

    @Override
    public Ticket markTicketAsUsed(Long ticketId) {
        Ticket ticket = getTicketById(ticketId);
        markTicketCheckIn(ticket);

        return ticketRepository.save(ticket);
    }

    @Override
    public Ticket cancelTicket(Long ticketId) {
        Ticket ticket = getTicketById(ticketId);
        ticket.setStatus(TicketStatus.CANCELLED);

        return ticketRepository.save(ticket);
    }

    @Override
    public Ticket verifyTicket(String qrCode, Long staffId) {
        Ticket ticket = ticketRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new RuntimeException("Invalid ticket"));

        Long eventId = ticket.getRegistration()
                .getEvent()
                .getId();

        boolean oldStaffAssigned = staffAssignmentRepository
                .existsByEventIdAndStaffId(eventId, staffId);

        boolean roleAssigned = eventAssignmentRepository
                .existsByUserIdAndEventIdAndActiveTrue(staffId, eventId);

        if (!oldStaffAssigned && !roleAssigned) {
            throw new RuntimeException("User is not assigned to this event");
        }

        if (ticket.getStatus() == TicketStatus.USED) {
            throw new RuntimeException("Ticket already used");
        }

        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            throw new RuntimeException("Ticket is cancelled");
        }

        markTicketCheckIn(ticket);

        return ticketRepository.save(ticket);
    }

    @Override
    public List<Ticket> getTicketsByEvent(Long eventId) {
        tenantSecurityService.requireEventInLoggedInPortal(eventId);
        return ticketRepository.findByRegistration_Event_Id(eventId);
    }

    @Override
    public List<Ticket> searchPublicTickets(String eventName, String emailOrPhone) {
        String safeEventName = eventName == null ? "" : eventName.trim();
        String safeEmailOrPhone = emailOrPhone == null ? "" : emailOrPhone.trim();

        if (safeEventName.isBlank() || safeEmailOrPhone.isBlank()) {
            return List.of();
        }

        return ticketRepository.findPublicTickets(safeEventName, safeEmailOrPhone);
    }

    private void requireTicketEventInLoggedInPortal(Ticket ticket) {
        if (ticket == null || ticket.getRegistration() == null || ticket.getRegistration().getEvent() == null) {
            throw new RuntimeException("Ticket is not linked to an event");
        }

        Event event = ticket.getRegistration().getEvent();
        tenantSecurityService.requireEventInLoggedInPortal(event);
    }

    private void markTicketCheckIn(Ticket ticket) {
        int quantity = ticket.getQuantity() == null || ticket.getQuantity() < 1 ? 1 : ticket.getQuantity();
        int checkedIn = ticket.getCheckedInQuantity() == null ? 0 : ticket.getCheckedInQuantity();

        if (checkedIn >= quantity) {
            throw new RuntimeException("Ticket already used");
        }

        ticket.setCheckedInQuantity(checkedIn + 1);

        if (ticket.getCheckedInQuantity() >= quantity) {
            ticket.setStatus(TicketStatus.USED);
        }

        ticket.getRegistration().setAttended(true);
    }
}