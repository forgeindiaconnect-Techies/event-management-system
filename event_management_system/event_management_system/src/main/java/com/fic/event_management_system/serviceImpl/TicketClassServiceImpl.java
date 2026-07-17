package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.TicketClass;
import com.fic.event_management_system.repository.TicketClassRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.TicketClassService;
import com.fic.event_management_system.service.SubscriptionLimitService;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class TicketClassServiceImpl implements TicketClassService {

    private final TicketClassRepository ticketClassRepository;
    private final TenantSecurityService tenantSecurityService;
    private final SubscriptionLimitService subscriptionLimitService;

    public TicketClassServiceImpl(
            TicketClassRepository ticketClassRepository,
            TenantSecurityService tenantSecurityService,
            SubscriptionLimitService subscriptionLimitService) {

        this.ticketClassRepository = ticketClassRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.subscriptionLimitService = subscriptionLimitService;
    }

    @Override
    public List<TicketClass> getTicketClassesByEvent(Long eventId) {
        return ticketClassRepository.findByEventIdOrderByIdAsc(eventId);
    }

    @Override
    public TicketClass createTicketClass(Long eventId, TicketClass ticketClass) {
        Event event = tenantSecurityService.getEventFromLoggedInPortal(eventId);
        subscriptionLimitService.assertCanCreateTicketClass(eventId);

        ticketClass.setEvent(event);
        normalize(ticketClass);
        return ticketClassRepository.save(ticketClass);
    }

    @Override
    public TicketClass updateTicketClass(Long id, TicketClass ticketClass) {
        TicketClass existing = ticketClassRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket class not found"));

        tenantSecurityService.requireEventInLoggedInPortal(existing.getEvent());
        subscriptionLimitService.assertPortalIsWritable(
                existing.getEvent().getPortal().getId()
        );

        existing.setName(ticketClass.getName());
        existing.setPrice(ticketClass.getPrice());
        existing.setSeats(ticketClass.getSeats());
        existing.setSaleStatus(ticketClass.getSaleStatus());
        existing.setDescription(ticketClass.getDescription());
        existing.setBenefits(ticketClass.getBenefits());
        existing.setMaxPerBuyer(ticketClass.getMaxPerBuyer());
        existing.setActive(ticketClass.getActive());
        normalize(existing);

        return ticketClassRepository.save(existing);
    }

    @Override
    public void deleteTicketClass(Long id) {
        TicketClass existing = ticketClassRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket class not found"));

        tenantSecurityService.requireEventInLoggedInPortal(existing.getEvent());
        subscriptionLimitService.assertPortalIsWritable(
                existing.getEvent().getPortal().getId()
        );
        ticketClassRepository.delete(existing);
    }

    private void normalize(TicketClass ticketClass) {
        if (ticketClass.getPrice() == null) {
            ticketClass.setPrice(BigDecimal.ZERO);
        }
        if (ticketClass.getSeats() == null) {
            ticketClass.setSeats(0);
        }
        if (ticketClass.getSold() == null) {
            ticketClass.setSold(0);
        }
        if (ticketClass.getMaxPerBuyer() == null || ticketClass.getMaxPerBuyer() < 1) {
            ticketClass.setMaxPerBuyer(1);
        }
        if (ticketClass.getSaleStatus() == null || ticketClass.getSaleStatus().isBlank()) {
            ticketClass.setSaleStatus("Active");
        }
        if (ticketClass.getActive() == null) {
            ticketClass.setActive(true);
        }
    }
}
