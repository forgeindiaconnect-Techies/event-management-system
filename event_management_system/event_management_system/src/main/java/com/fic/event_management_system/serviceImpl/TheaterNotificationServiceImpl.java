package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.MovieBookedTicket;
import com.fic.event_management_system.entity.Showtime;
import com.fic.event_management_system.entity.TheaterNotification;
import com.fic.event_management_system.entity.TheaterPortal;
import com.fic.event_management_system.entity.TheaterUser;
import com.fic.event_management_system.repository.ShowtimeRepository;
import com.fic.event_management_system.repository.TheaterNotificationRepository;
import com.fic.event_management_system.repository.TheaterPortalRepository;
import com.fic.event_management_system.repository.TheaterUserRepository;
import com.fic.event_management_system.service.TheaterNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
@SuppressWarnings("null")
public class TheaterNotificationServiceImpl implements TheaterNotificationService {

    @Autowired
    private TheaterNotificationRepository theaterNotificationRepository;

    @Autowired
    private TheaterPortalRepository theaterPortalRepository;

    @Autowired
    private com.fic.event_management_system.repository.TheaterRepository theaterRepository;

    @Autowired
    private TheaterUserRepository theaterUserRepository;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Override
    public TheaterNotification createNotification(
            Long theaterPortalId,
            Long recipientUserId,
            String targetRole,
            String type,
            String title,
            String message,
            String actionUrl) {

        TheaterPortal portal = null;
        if (theaterPortalId != null) {
            portal = theaterPortalRepository.findById(theaterPortalId).orElse(null);
        }
        if (portal == null) {
            portal = theaterPortalRepository.findAll().stream().findFirst().orElse(null);
        }
        if (portal == null) {
            return null;
        }

        TheaterUser recipient = null;
        if (recipientUserId != null) {
            recipient = theaterUserRepository.findById(recipientUserId).orElse(null);
        }

        TheaterNotification notif = new TheaterNotification();
        notif.setTheaterPortal(portal);
        notif.setRecipient(recipient);
        notif.setTargetRole(targetRole != null ? targetRole : "ALL");
        notif.setType(type != null ? type : "SYSTEM_ALERT");
        notif.setTitle(title != null ? title.trim() : "Theater Notice");
        notif.setMessage(message != null ? message.trim() : "");
        notif.setActionUrl(actionUrl);
        notif.setRead(false);
        notif.setCreatedAt(LocalDateTime.now());

        return theaterNotificationRepository.save(notif);
    }

    @Override
    public void notifyNewBooking(MovieBookedTicket ticket, Long theaterPortalId) {
        if (ticket == null) return;

        TheaterPortal portal = null;
        if (theaterPortalId != null) {
            portal = theaterPortalRepository.findById(theaterPortalId).orElse(null);
        }

        // Try to resolve portal from Showtime
        if (portal == null && ticket.getShowtimeId() != null) {
            Showtime st = showtimeRepository.findById(ticket.getShowtimeId()).orElse(null);
            if (st != null && st.getTheater() != null && st.getTheater().getTheaterPortal() != null) {
                portal = st.getTheater().getTheaterPortal();
            }
        }

        // Fallback to primary portal
        if (portal == null) {
            portal = theaterPortalRepository.findAll().stream().findFirst().orElse(null);
        }
        if (portal == null) return;

        String movieTitle = ticket.getMovieTitle() != null ? ticket.getMovieTitle() : "Movie";
        String ticketId = ticket.getTicketId() != null ? ticket.getTicketId() : "N/A";
        String seats = ticket.getSeats() != null ? ticket.getSeats() : "General";
        String screen = ticket.getScreenName() != null ? ticket.getScreenName() : "Screen";
        String amountStr = ticket.getAmount() != null ? String.format("%.2f", ticket.getAmount()) : "0.00";
        String sourceLabel = "ONLINE_BOOKING".equalsIgnoreCase(ticket.getSource()) ? "Online Booking" : "Box Office Counter";

        String title = "🎟️ New Ticket Booking: " + movieTitle;
        String message = String.format("Ticket #%s • %s (%s) • ₹%s [%s]", ticketId, seats, screen, amountStr, sourceLabel);

        // 1. Alert Theater Owner
        TheaterNotification ownerNotif = new TheaterNotification();
        ownerNotif.setTheaterPortal(portal);
        ownerNotif.setTargetRole("THEATER_OWNER");
        ownerNotif.setType("TICKET_BOOKED");
        ownerNotif.setTitle(title);
        ownerNotif.setMessage(message);
        ownerNotif.setActionUrl("/theater/dashboard");
        ownerNotif.setRead(false);
        ownerNotif.setCreatedAt(LocalDateTime.now());

        // 2. Alert Theater Manager
        TheaterNotification managerNotif = new TheaterNotification();
        managerNotif.setTheaterPortal(portal);
        managerNotif.setTargetRole("THEATER_MANAGER");
        managerNotif.setType("TICKET_BOOKED");
        managerNotif.setTitle(title);
        managerNotif.setMessage(message);
        managerNotif.setActionUrl("/theater/manager-dashboard");
        managerNotif.setRead(false);
        managerNotif.setCreatedAt(LocalDateTime.now());

        // 3. Alert Counter Cashier
        TheaterNotification cashierNotif = new TheaterNotification();
        cashierNotif.setTheaterPortal(portal);
        cashierNotif.setTargetRole("CASHIER");
        cashierNotif.setType("TICKET_BOOKED");
        cashierNotif.setTitle(title);
        cashierNotif.setMessage(message);
        cashierNotif.setActionUrl("/theater/cashier-dashboard");
        cashierNotif.setRead(false);
        cashierNotif.setCreatedAt(LocalDateTime.now());

        theaterNotificationRepository.saveAll(List.of(ownerNotif, managerNotif, cashierNotif));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TheaterNotification> getNotificationsForUser(String authEmailOrUsername, Long portalId, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 50));
        TheaterUser user = resolveUser(authEmailOrUsername);

        Long effectivePortalId = portalId;
        if (effectivePortalId != null && !theaterPortalRepository.existsById(effectivePortalId)) {
            com.fic.event_management_system.entity.Theater th = theaterRepository.findById(effectivePortalId).orElse(null);
            if (th != null && th.getTheaterPortal() != null) {
                effectivePortalId = th.getTheaterPortal().getId();
            }
        }
        if (effectivePortalId == null && user != null && user.getTheaterPortal() != null) {
            effectivePortalId = user.getTheaterPortal().getId();
        }
        if (effectivePortalId == null) {
            TheaterPortal first = theaterPortalRepository.findAll().stream().findFirst().orElse(null);
            if (first != null) effectivePortalId = first.getId();
        }

        if (effectivePortalId == null) {
            return new ArrayList<>();
        }

        if (user != null) {
            String role = user.getRole() != null ? user.getRole() : "";
            String duty = user.getDutyRole() != null ? user.getDutyRole() : "";
            return theaterNotificationRepository.findNotificationsForUser(effectivePortalId, user.getId(), role, duty, pageable);
        }

        return theaterNotificationRepository.findByTheaterPortalIdOrderByCreatedAtDesc(effectivePortalId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(String authEmailOrUsername, Long portalId) {
        TheaterUser user = resolveUser(authEmailOrUsername);

        Long effectivePortalId = portalId;
        if (effectivePortalId != null && !theaterPortalRepository.existsById(effectivePortalId)) {
            com.fic.event_management_system.entity.Theater th = theaterRepository.findById(effectivePortalId).orElse(null);
            if (th != null && th.getTheaterPortal() != null) {
                effectivePortalId = th.getTheaterPortal().getId();
            }
        }
        if (effectivePortalId == null && user != null && user.getTheaterPortal() != null) {
            effectivePortalId = user.getTheaterPortal().getId();
        }
        if (effectivePortalId == null) {
            TheaterPortal first = theaterPortalRepository.findAll().stream().findFirst().orElse(null);
            if (first != null) effectivePortalId = first.getId();
        }

        if (effectivePortalId == null) return 0L;

        if (user != null) {
            String role = user.getRole() != null ? user.getRole() : "";
            String duty = user.getDutyRole() != null ? user.getDutyRole() : "";
            return theaterNotificationRepository.countUnreadForUser(effectivePortalId, user.getId(), role, duty);
        }

        return theaterNotificationRepository.countByTheaterPortalIdAndReadFalse(effectivePortalId);
    }

    @Override
    public TheaterNotification markAsRead(Long notificationId, String authEmailOrUsername) {
        TheaterNotification notif = theaterNotificationRepository.findById(notificationId).orElse(null);
        if (notif != null) {
            notif.setRead(true);
            notif.setReadAt(LocalDateTime.now());
            return theaterNotificationRepository.save(notif);
        }
        return null;
    }

    @Override
    public int markAllAsRead(String authEmailOrUsername, Long portalId) {
        TheaterUser user = resolveUser(authEmailOrUsername);
        Long effectivePortalId = portalId;
        if (effectivePortalId != null && !theaterPortalRepository.existsById(effectivePortalId)) {
            com.fic.event_management_system.entity.Theater th = theaterRepository.findById(effectivePortalId).orElse(null);
            if (th != null && th.getTheaterPortal() != null) {
                effectivePortalId = th.getTheaterPortal().getId();
            }
        }
        if (effectivePortalId == null && user != null && user.getTheaterPortal() != null) {
            effectivePortalId = user.getTheaterPortal().getId();
        }
        if (effectivePortalId == null) {
            TheaterPortal first = theaterPortalRepository.findAll().stream().findFirst().orElse(null);
            if (first != null) effectivePortalId = first.getId();
        }
        if (effectivePortalId == null) return 0;

        return theaterNotificationRepository.markAllAsReadForPortal(effectivePortalId);
    }

    @Override
    public void deleteNotification(Long notificationId, String authEmailOrUsername) {
        if (notificationId != null && theaterNotificationRepository.existsById(notificationId)) {
            theaterNotificationRepository.deleteById(notificationId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<TheaterNotification> getAllNotificationsForSuperAdmin(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100));
        return theaterNotificationRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    @Override
    public List<TheaterNotification> broadcastNotification(
            Long portalId,
            String targetRole,
            String type,
            String title,
            String message,
            String actionUrl) {

        List<TheaterPortal> targetPortals = new ArrayList<>();
        if (portalId != null && portalId > 0) {
            TheaterPortal tp = theaterPortalRepository.findById(portalId).orElse(null);
            if (tp != null) {
                targetPortals.add(tp);
            } else {
                com.fic.event_management_system.entity.Theater th = theaterRepository.findById(portalId).orElse(null);
                if (th != null && th.getTheaterPortal() != null) {
                    targetPortals.add(th.getTheaterPortal());
                }
            }
        } else {
            targetPortals = new ArrayList<>(theaterPortalRepository.findAll());
            for (com.fic.event_management_system.entity.Theater th : theaterRepository.findAll()) {
                if (th.getTheaterPortal() != null && !targetPortals.contains(th.getTheaterPortal())) {
                    targetPortals.add(th.getTheaterPortal());
                }
            }
        }

        if (targetPortals.isEmpty()) {
            TheaterPortal fallbackPortal = new TheaterPortal();
            fallbackPortal.setPortalName("Central Cinema Network");
            fallbackPortal.setPortalCode("TH-CENTRAL-" + (System.currentTimeMillis() % 10000));
            fallbackPortal.setCity("Headquarters");
            fallbackPortal = theaterPortalRepository.save(fallbackPortal);
            targetPortals.add(fallbackPortal);
        }

        List<TheaterNotification> createdNotifs = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (TheaterPortal portal : targetPortals) {
            TheaterNotification notif = new TheaterNotification();
            notif.setTheaterPortal(portal);
            notif.setRecipient(null); // null means entire target audience
            notif.setTargetRole(targetRole != null && !targetRole.isBlank() ? targetRole.trim() : "ALL");
            notif.setType(type != null && !type.isBlank() ? type.trim() : "SYSTEM_ALERT");
            notif.setTitle(title != null && !title.isBlank() ? title.trim() : "System Announcement");
            notif.setMessage(message != null ? message.trim() : "");
            notif.setActionUrl(actionUrl != null && !actionUrl.isBlank() ? actionUrl.trim() : null);
            notif.setRead(false);
            notif.setCreatedAt(now);
            createdNotifs.add(notif);
        }

        return theaterNotificationRepository.saveAll(createdNotifs);
    }

    @Override
    public void deleteNotificationBySuperAdmin(Long notificationId) {
        if (notificationId != null && theaterNotificationRepository.existsById(notificationId)) {
            theaterNotificationRepository.deleteById(notificationId);
        }
    }

    private TheaterUser resolveUser(String authEmailOrUsername) {
        if (authEmailOrUsername == null || authEmailOrUsername.isBlank()) return null;
        return theaterUserRepository.findByEmailOrUsername(authEmailOrUsername, authEmailOrUsername).orElse(null);
    }
}
