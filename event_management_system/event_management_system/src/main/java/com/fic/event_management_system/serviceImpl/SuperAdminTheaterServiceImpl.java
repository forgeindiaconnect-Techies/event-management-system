package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.dto.*;
import com.fic.event_management_system.entity.*;
import com.fic.event_management_system.repository.*;
import com.fic.event_management_system.service.SuperAdminTheaterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class SuperAdminTheaterServiceImpl implements SuperAdminTheaterService {

    @Autowired private TheaterRepository theaterRepository;
    @Autowired private TheaterUserRepository theaterUserRepository;
    @Autowired private MovieBookedTicketRepository movieBookedTicketRepository;
    @Autowired private ShowtimeRepository showtimeRepository;
    @Autowired private ScreenRepository screenRepository;
    @Autowired private TheaterEmailLogRepository theaterEmailLogRepository;
    @Autowired private PlatformRevenueConfigRepository platformRevenueConfigRepository;
    @Autowired private TheaterPortalRepository theaterPortalRepository;
    @Autowired private MenuItemRepository menuItemRepository;
    @Autowired private FoodOrderRepository foodOrderRepository;
    @Autowired private TheaterNotificationRepository theaterNotificationRepository;
    @Autowired private SeatLayoutRepository seatLayoutRepository;
    @Autowired private ShowtimeSeatBookingRepository showtimeSeatBookingRepository;
    @Autowired private TheaterInvitationRepository theaterInvitationRepository;
    @Autowired private DeletedTheaterPortalRepository deletedTheaterPortalRepository;
    @Autowired private com.fic.event_management_system.service.TheaterNotificationService theaterNotificationService;
    @Autowired private com.fic.event_management_system.service.TheaterEmailService theaterEmailService;

    @jakarta.annotation.PostConstruct
    public void initDeletedPortals() {
        try {
            if (deletedTheaterPortalRepository.count() == 0) {
                // Seed record for the duplicate Naveen Cinemas portal (Portal #1) that was purged
                DeletedTheaterPortal dp = new DeletedTheaterPortal(
                        1L, "Naveen Cinemas (Duplicate)", "naveen.mj2.45@gmail.com",
                        "Duplicate Portal - Purged from Platform", "PERMANENT_PURGE", 3, 0L
                );
                deletedTheaterPortalRepository.save(dp);
            }
        } catch (Exception ignored) {}

        try {
            // Startup sync: Ensure username == employee_id across all TheaterUsers
            List<TheaterUser> users = theaterUserRepository.findAll();
            for (TheaterUser u : users) {
                boolean changed = false;
                if (u.getEmployeeId() != null && !u.getEmployeeId().isBlank()) {
                    if (!u.getEmployeeId().equals(u.getUsername())) {
                        u.setUsername(u.getEmployeeId());
                        changed = true;
                    }
                } else if (u.getUsername() != null && !u.getUsername().isBlank() && !u.getUsername().contains("-")) {
                    u.setEmployeeId(u.getUsername());
                    changed = true;
                }
                if (changed) {
                    theaterUserRepository.save(u);
                }
            }
        } catch (Exception ignored) {}
    }

    @Override
    public SuperAdminTheaterDashboardResponse getDashboardOverview() {
        SuperAdminTheaterDashboardResponse response = new SuperAdminTheaterDashboardResponse();
        
        List<Theater> theaters = theaterRepository.findAll();
        long deletedCount = deletedTheaterPortalRepository.count();
        response.setTotalTheaters(theaters.size() + deletedCount);
        response.setActiveTheaters(theaters.stream().filter(t -> Boolean.TRUE.equals(t.getActive())).count());
        
        List<MovieBookedTicket> tickets = movieBookedTicketRepository.findAll();
        long totalTicketsSold = 0;
        double totalRevenue = 0;
        
        for (MovieBookedTicket ticket : tickets) {
            int numSeats = ticket.getSeats() != null ? ticket.getSeats().split(",").length : 0;
            totalTicketsSold += numSeats;
            
            // Assume an average fee if we don't look up the specific theater
            // To be precise, we'd need to map showtime -> theater
            if (ticket.getShowtimeId() != null) {
                Showtime showtime = showtimeRepository.findById(ticket.getShowtimeId()).orElse(null);
                if (showtime != null && showtime.getTheater() != null) {
                    Double fee = showtime.getTheater().getConvenienceFeePerTicket();
                    if (fee == null) fee = 25.0; // default
                    totalRevenue += (numSeats * fee);
                }
            }
        }
        
        response.setTotalTicketsSold(totalTicketsSold);
        response.setTotalRevenue(totalRevenue);
        
        // Movies listed
        List<Showtime> showtimes = showtimeRepository.findAll();
        long moviesListed = showtimes.stream().map(Showtime::getMovieTitle).distinct().count();
        response.setTotalMoviesListed(moviesListed);
        
        // Day-by-day fee collection for the current month
        Map<Integer, Double> dailyRevenue = new HashMap<>();
        java.time.LocalDate now = java.time.LocalDate.now();
        int daysInMonth = now.lengthOfMonth();
        for (int i = 1; i <= daysInMonth; i++) {
            dailyRevenue.put(i, 0.0);
        }
        
        for (MovieBookedTicket ticket : tickets) {
            if (ticket.getCreatedAt() != null && 
                ticket.getCreatedAt().getYear() == now.getYear() && 
                ticket.getCreatedAt().getMonthValue() == now.getMonthValue()) {
                
                int day = ticket.getCreatedAt().getDayOfMonth();
                int numSeats = ticket.getSeats() != null ? ticket.getSeats().split(",").length : 0;
                double fee = 25.0;
                
                if (ticket.getShowtimeId() != null) {
                    Showtime showtime = showtimeRepository.findById(ticket.getShowtimeId()).orElse(null);
                    if (showtime != null && showtime.getTheater() != null && showtime.getTheater().getConvenienceFeePerTicket() != null) {
                        fee = showtime.getTheater().getConvenienceFeePerTicket();
                    }
                }
                dailyRevenue.put(day, dailyRevenue.get(day) + (numSeats * fee));
            }
        }
        
        List<SuperAdminTheaterDashboardResponse.MonthlyRevenueDTO> chartData = new ArrayList<>();
        for (int i = 1; i <= daysInMonth; i++) {
            chartData.add(new SuperAdminTheaterDashboardResponse.MonthlyRevenueDTO(String.valueOf(i), dailyRevenue.get(i)));
        }
        response.setRevenueChartData(chartData);
        
        return response;
    }

    @Override
    public List<TheaterDirectoryResponse> getTheaterPortals() {
        List<Theater> theaters = theaterRepository.findAll();
        List<TheaterDirectoryResponse> responses = new ArrayList<>();
        
        for (Theater t : theaters) {
            TheaterDirectoryResponse res = new TheaterDirectoryResponse();
            res.setId(t.getId());
            res.setName(t.getName());
            res.setOwner(t.getOwnerEmail() != null ? t.getOwnerEmail() : "N/A");
            
            List<Screen> screens = screenRepository.findByTheaterId(t.getId());
            res.setScreens(screens.size());
            
            int employees = 0;
            if (t.getTheaterPortal() != null) {
                List<TheaterUser> users = theaterUserRepository.findAll().stream()
                    .filter(u -> u.getTheaterPortal() != null && u.getTheaterPortal().getId().equals(t.getTheaterPortal().getId()))
                    .collect(Collectors.toList());
                employees = users.size();
            }
            res.setEmployees(employees);
            
            long ticketsSold = 0;
            double revenue = 0;
            List<Showtime> showtimes = showtimeRepository.findByTheaterId(t.getId());
            List<Long> showtimeIds = showtimes.stream().map(Showtime::getId).collect(Collectors.toList());
            
            List<MovieBookedTicket> bookedTickets = movieBookedTicketRepository.findAll().stream()
                .filter(tk -> tk.getShowtimeId() != null && showtimeIds.contains(tk.getShowtimeId()))
                .collect(Collectors.toList());
                
            for (MovieBookedTicket tk : bookedTickets) {
                int seats = tk.getSeats() != null ? tk.getSeats().split(",").length : 0;
                ticketsSold += seats;
                double fee = t.getConvenienceFeePerTicket() != null ? t.getConvenienceFeePerTicket() : 25.0;
                revenue += (seats * fee);
            }
            res.setTickets(ticketsSold);
            res.setRevenue(revenue);
            res.setStatus(Boolean.TRUE.equals(t.getActive()) ? "Active" : "Inactive");
            responses.add(res);
        }

        // Include deleted / purged theater portals so SuperAdmin can audit them
        try {
            List<DeletedTheaterPortal> deletedList = deletedTheaterPortalRepository.findAllByOrderByDeletedAtDesc();
            for (DeletedTheaterPortal dp : deletedList) {
                TheaterDirectoryResponse res = new TheaterDirectoryResponse();
                res.setId(dp.getOriginalTheaterId() != null ? dp.getOriginalTheaterId() : dp.getId());
                res.setName(dp.getName());
                res.setOwner(dp.getOwnerEmail() != null ? dp.getOwnerEmail() : "N/A");
                res.setScreens(dp.getScreensCount() != null ? dp.getScreensCount() : 0);
                res.setEmployees(0);
                res.setTickets(dp.getTicketsCount() != null ? dp.getTicketsCount() : 0L);
                res.setRevenue(0.0);
                res.setStatus("Deleted");
                responses.add(res);
            }
        } catch (Exception ignored) {}

        return responses;
    }

    @Override
    public List<TheaterPortalUserResponse> getTheaterUsers() {
        List<TheaterUser> users = theaterUserRepository.findAll();
        List<TheaterPortalUserResponse> responses = new ArrayList<>();

        // Group users by theaterPortal ID
        Map<Long, List<TheaterUser>> usersByPortal = users.stream()
                .collect(Collectors.groupingBy(
                        u -> u.getTheaterPortal() != null ? u.getTheaterPortal().getId() : -1L,
                        java.util.LinkedHashMap::new,
                        Collectors.toList()
                ));

        for (Map.Entry<Long, List<TheaterUser>> entry : usersByPortal.entrySet()) {
            List<TheaterUser> portalUsers = entry.getValue();
            // Sort employees by ID ascending so sequence numbers are stable and consistent
            portalUsers.sort(java.util.Comparator.comparing(TheaterUser::getId));

            String portalName = "EMP";
            if (!portalUsers.isEmpty() && portalUsers.get(0).getTheaterPortal() != null) {
                portalName = portalUsers.get(0).getTheaterPortal().getPortalName();
            }
            String prefix = generatePortalPrefix(portalName);

            int seq = 1;
            for (TheaterUser u : portalUsers) {
                TheaterPortalUserResponse res = new TheaterPortalUserResponse();
                res.setId(u.getId());

                String empId = prefix + String.format("%03d", seq++);
                res.setEmpId(empId);

                // Persist both employee ID and username so they are ALWAYS identical
                boolean changed = false;
                if (u.getEmployeeId() == null || !u.getEmployeeId().equals(empId)) {
                    u.setEmployeeId(empId);
                    changed = true;
                }
                if (u.getUsername() == null || !u.getUsername().equals(empId)) {
                    u.setUsername(empId);
                    changed = true;
                }
                if (changed) {
                    try {
                        theaterUserRepository.save(u);
                    } catch (Exception ignored) {}
                }

                // Also keep any associated theater_invitations record username synced to this exact employee ID
                if (u.getEmail() != null && u.getTheaterPortal() != null) {
                    try {
                        theaterInvitationRepository.findByTheaterPortalId(u.getTheaterPortal().getId())
                                .stream()
                                .filter(inv -> inv.getEmail() != null && inv.getEmail().equalsIgnoreCase(u.getEmail()))
                                .forEach(inv -> {
                                    if (inv.getUsername() == null || !inv.getUsername().equals(empId)) {
                                        inv.setUsername(empId);
                                        theaterInvitationRepository.save(inv);
                                    }
                                });
                    } catch (Exception ignored) {}
                }

                // Clean name formatting without trailing "null"
                String firstName = u.getFirstName() != null ? u.getFirstName().trim() : "";
                String lastName = (u.getLastName() != null && !u.getLastName().equalsIgnoreCase("null") && !u.getLastName().isBlank())
                        ? u.getLastName().trim() : "";
                String fullName = (firstName + " " + lastName).trim();
                if (fullName.isBlank()) fullName = u.getEmail();

                res.setName(fullName);
                res.setEmail(u.getEmail());
                res.setPortalId(u.getTheaterPortal() != null ? u.getTheaterPortal().getPortalCode() : "N/A");
                res.setTheater(u.getTheaterPortal() != null ? u.getTheaterPortal().getPortalName() : "N/A");
                res.setStatus(Boolean.TRUE.equals(u.getActive()) ? "Active" : "Inactive");
                responses.add(res);
            }
        }
        return responses;
    }

    private String generatePortalPrefix(String portalName) {
        if (portalName == null || portalName.isBlank()) return "EMP";
        String clean = portalName.replaceAll("[^a-zA-Z0-9\\s]", " ").trim();
        String[] words = clean.split("\\s+");
        if (words.length == 0 || words[0].isBlank()) return "EMP";

        if (words.length == 1) {
            String w = words[0].toUpperCase();
            return w.length() >= 3 ? w.substring(0, 3) : w;
        }

        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!w.isBlank()) {
                sb.append(Character.toUpperCase(w.charAt(0)));
            }
        }
        String prefix = sb.toString();
        if (prefix.length() < 2) {
            prefix = words[0].substring(0, Math.min(words[0].length(), 3)).toUpperCase();
        }
        return prefix;
    }

    @Override
    public List<TheaterPayoutLedgerResponse> getTheaterPayouts() {
        List<Theater> theaters = theaterRepository.findAll();
        List<TheaterPayoutLedgerResponse> responses = new ArrayList<>();
        PlatformRevenueConfig config = getOrCreateRevenueConfig();
        boolean isLocked = Boolean.TRUE.equals(config.getCommissionLocked());
        double commRate = isLocked ? 0.0 : (config.getCommissionPercentage() != null ? config.getCommissionPercentage() : 0.0);
        String commDisplay = isLocked ? "0%" : (commRate % 1 == 0 ? String.format("%.0f%%", commRate) : String.format("%.1f%%", commRate));
        
        for (Theater t : theaters) {
            List<Showtime> showtimes = showtimeRepository.findByTheaterId(t.getId());
            List<Long> showtimeIds = showtimes.stream().map(Showtime::getId).collect(Collectors.toList());
            
            List<MovieBookedTicket> bookedTickets = movieBookedTicketRepository.findAll().stream()
                .filter(tk -> tk.getShowtimeId() != null && showtimeIds.contains(tk.getShowtimeId()))
                .collect(Collectors.toList());
                
            if (bookedTickets.isEmpty()) continue;
            
            long ticketsSold = 0;
            double amountOwed = 0;
            
            for (MovieBookedTicket tk : bookedTickets) {
                int seats = tk.getSeats() != null ? tk.getSeats().split(",").length : 0;
                ticketsSold += seats;
                double fee = t.getConvenienceFeePerTicket() != null ? t.getConvenienceFeePerTicket() : 25.0;
                double gross = tk.getAmount() != null ? tk.getAmount() : 0.0;
                double baseAmt = Math.max(0.0, gross - (seats * fee));
                double commCut = baseAmt * (commRate / 100.0);
                amountOwed += (baseAmt - commCut);
            }
            
            if (ticketsSold == 0) continue;
            
            TheaterPayoutLedgerResponse res = new TheaterPayoutLedgerResponse();
            res.setId(t.getId());
            res.setTheater(t.getName());
            res.setTickets(ticketsSold);
            res.setComm(commDisplay);
            res.setOwed(Math.round(amountOwed * 100.0) / 100.0);
            res.setAcc("PENDING_SETUP");
            res.setStatus("Pending");
            responses.add(res);
        }
        return responses;
    }

    @Override
    public TheaterEmailStatsResponse getTheaterEmailStats() {
        TheaterEmailStatsResponse response = new TheaterEmailStatsResponse();
        if (theaterEmailLogRepository == null) {
            response.setTotalSent(0);
            response.setDeliveryRate(100.0);
            response.setBouncedFailed(0);
            response.setRecentLogs(new ArrayList<>());
            return response;
        }

        long totalSent = theaterEmailLogRepository.count();
        long bouncedFailed = theaterEmailLogRepository.countByStatus("Failed");
        long delivered = totalSent - bouncedFailed;

        double deliveryRate = 100.0;
        if (totalSent > 0) {
            deliveryRate = Math.round(((double) delivered / totalSent * 100.0) * 10.0) / 10.0;
        }

        response.setTotalSent(totalSent);
        response.setDeliveryRate(deliveryRate);
        response.setBouncedFailed(bouncedFailed);

        List<TheaterEmailLog> topLogs = theaterEmailLogRepository.findTop100ByOrderByCreatedAtDesc();
        List<TheaterEmailLogResponse> logResponses = topLogs.stream()
                .map(this::mapToTheaterEmailLogResponse)
                .collect(Collectors.toList());

        response.setRecentLogs(logResponses);
        return response;
    }

    @Override
    public List<TheaterEmailLogResponse> getTheaterEmailLogs() {
        if (theaterEmailLogRepository == null) {
            return new ArrayList<>();
        }
        return theaterEmailLogRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToTheaterEmailLogResponse)
                .collect(Collectors.toList());
    }

    private TheaterEmailLogResponse mapToTheaterEmailLogResponse(TheaterEmailLog log) {
        TheaterEmailLogResponse res = new TheaterEmailLogResponse();
        res.setId(log.getId());
        res.setSubject(log.getSubject());
        res.setRecipient(log.getRecipient());
        res.setTheater(log.getTheaterName() != null ? log.getTheaterName() : "Thunder Cinemas");
        res.setType(log.getType() != null ? log.getType() : "General");
        res.setStatus(log.getStatus() != null ? log.getStatus() : "Delivered");
        
        if (log.getCreatedAt() != null) {
            java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm");
            res.setTime(log.getCreatedAt().format(formatter));
        } else {
            res.setTime("Just now");
        }
        return res;
    }

    @Override
    public PlatformRevenueConfigDTO getRevenueSettings() {
        return mapToRevenueConfigDTO(getOrCreateRevenueConfig());
    }

    @Override
    public PlatformRevenueConfigDTO unlockCommission(UnlockCommissionRequest request) {
        PlatformRevenueConfig cfg = getOrCreateRevenueConfig();
        double rate = (request != null && request.getCommissionPercentage() != null && request.getCommissionPercentage() >= 0)
                ? request.getCommissionPercentage()
                : 10.0;
        cfg.setCommissionLocked(false);
        cfg.setCommissionPercentage(rate);
        cfg.setLastUnlockedAt(LocalDateTime.now());
        if (request != null) {
            cfg.setLastBroadcastSubject(request.getNoteTitle());
            cfg.setLastBroadcastNotes(request.getNoteMessage());
        }
        PlatformRevenueConfig saved = platformRevenueConfigRepository.save(cfg);

        String noteTitle = (request != null && request.getNoteTitle() != null && !request.getNoteTitle().isBlank())
                ? request.getNoteTitle()
                : "Notice: Platform Commission Policy Activated (" + rate + "%)";
        String noteMessage = (request != null && request.getNoteMessage() != null && !request.getNoteMessage().isBlank())
                ? request.getNoteMessage()
                : "The platform has updated the theater revenue structure. A platform commission rate of " + rate + "% is now active.";

        if (request != null && Boolean.TRUE.equals(request.getSendInApp()) && theaterNotificationService != null) {
            try {
                theaterNotificationService.broadcastNotification(null, "ALL", "COMMISSION_POLICY_UPDATE", noteTitle, noteMessage, "/theater/dashboard");
            } catch (Exception ignored) {}
        }

        if (request != null && Boolean.TRUE.equals(request.getSendEmail()) && theaterEmailService != null) {
            List<Theater> theaters = theaterRepository.findAll();
            for (Theater t : theaters) {
                if (t.getOwnerEmail() != null && !t.getOwnerEmail().isBlank()) {
                    try {
                        Long portalId = t.getTheaterPortal() != null ? t.getTheaterPortal().getId() : null;
                        theaterEmailService.sendManualSuperAdminEmail(t.getOwnerEmail(), noteTitle, noteMessage, "Policy Update", t.getName(), portalId);
                    } catch (Exception ignored) {}
                }
            }
        }

        return mapToRevenueConfigDTO(saved);
    }

    @Override
    public PlatformRevenueConfigDTO lockCommission(LockCommissionRequest request) {
        PlatformRevenueConfig cfg = getOrCreateRevenueConfig();
        cfg.setCommissionLocked(true);
        cfg.setCommissionPercentage(0.0);
        cfg.setLastLockedAt(LocalDateTime.now());
        if (request != null && request.getNoteTitle() != null && !request.getNoteTitle().isBlank()) {
            cfg.setLastBroadcastSubject(request.getNoteTitle());
        }
        if (request != null && request.getNoteMessage() != null && !request.getNoteMessage().isBlank()) {
            cfg.setLastBroadcastNotes(request.getNoteMessage());
        }
        PlatformRevenueConfig saved = platformRevenueConfigRepository.save(cfg);

        if (request != null && Boolean.TRUE.equals(request.getSendInApp()) && request.getNoteTitle() != null && !request.getNoteTitle().isBlank() && theaterNotificationService != null) {
            try {
                theaterNotificationService.broadcastNotification(null, "ALL", "COMMISSION_POLICY_UPDATE", request.getNoteTitle(), request.getNoteMessage(), "/theater/dashboard");
            } catch (Exception ignored) {}
        }

        if (request != null && Boolean.TRUE.equals(request.getSendEmail()) && request.getNoteTitle() != null && !request.getNoteTitle().isBlank() && theaterEmailService != null) {
            List<Theater> theaters = theaterRepository.findAll();
            for (Theater t : theaters) {
                if (t.getOwnerEmail() != null && !t.getOwnerEmail().isBlank()) {
                    try {
                        Long portalId = t.getTheaterPortal() != null ? t.getTheaterPortal().getId() : null;
                        theaterEmailService.sendManualSuperAdminEmail(t.getOwnerEmail(), request.getNoteTitle(), request.getNoteMessage(), "Policy Update", t.getName(), portalId);
                    } catch (Exception ignored) {}
                }
            }
        }

        return mapToRevenueConfigDTO(saved);
    }

    @Override
    public PlatformRevenueConfigDTO updateRevenueSettings(PlatformRevenueConfigDTO request) {
        PlatformRevenueConfig cfg = getOrCreateRevenueConfig();
        if (request != null && request.getConvenienceFeePercentage() != null && request.getConvenienceFeePercentage() >= 0) {
            cfg.setConvenienceFeePercentage(request.getConvenienceFeePercentage());
        }
        if (request != null && Boolean.FALSE.equals(cfg.getCommissionLocked()) && request.getCommissionPercentage() != null && request.getCommissionPercentage() >= 0) {
            cfg.setCommissionPercentage(request.getCommissionPercentage());
        }
        PlatformRevenueConfig saved = platformRevenueConfigRepository.save(cfg);
        return mapToRevenueConfigDTO(saved);
    }

    private PlatformRevenueConfig getOrCreateRevenueConfig() {
        if (platformRevenueConfigRepository == null) {
            PlatformRevenueConfig fallback = new PlatformRevenueConfig();
            fallback.setCommissionLocked(true);
            fallback.setCommissionPercentage(0.0);
            fallback.setConvenienceFeePercentage(10.0);
            return fallback;
        }
        return platformRevenueConfigRepository.findTopByOrderByIdAsc().orElseGet(() -> {
            PlatformRevenueConfig cfg = new PlatformRevenueConfig();
            cfg.setCommissionLocked(true);
            cfg.setCommissionPercentage(0.0);
            cfg.setConvenienceFeePercentage(10.0);
            return platformRevenueConfigRepository.save(cfg);
        });
    }

    private PlatformRevenueConfigDTO mapToRevenueConfigDTO(PlatformRevenueConfig cfg) {
        PlatformRevenueConfigDTO dto = new PlatformRevenueConfigDTO();
        dto.setId(cfg.getId());
        dto.setCommissionLocked(Boolean.TRUE.equals(cfg.getCommissionLocked()));
        dto.setCommissionPercentage(cfg.getCommissionPercentage() != null ? cfg.getCommissionPercentage() : 0.0);
        dto.setConvenienceFeePercentage(cfg.getConvenienceFeePercentage() != null ? cfg.getConvenienceFeePercentage() : 10.0);
        dto.setLastUnlockedAt(cfg.getLastUnlockedAt());
        dto.setLastLockedAt(cfg.getLastLockedAt());
        dto.setLastBroadcastSubject(cfg.getLastBroadcastSubject());
        dto.setLastBroadcastNotes(cfg.getLastBroadcastNotes());
        if (Boolean.TRUE.equals(cfg.getCommissionLocked())) {
            dto.setActiveStrategy("Acquisition Mode (Zero Commission for Theaters, " + dto.getConvenienceFeePercentage() + "% Convenience Fee for Users)");
        } else {
            dto.setActiveStrategy("Active Monetization (" + dto.getCommissionPercentage() + "% Commission Cut, " + dto.getConvenienceFeePercentage() + "% Convenience Fee)");
        }
        return dto;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void deleteTheaterPortal(Long theaterId, String reason, boolean permanent) {
        Theater theater = theaterRepository.findById(theaterId).orElse(null);
        if (theater == null) {
            // Check if passed ID was a theaterPortal id
            Optional<TheaterPortal> tpOpt = theaterPortalRepository.findById(theaterId);
            if (tpOpt.isPresent()) {
                List<Theater> ths = theaterRepository.findByTheaterPortalId(tpOpt.get().getId());
                if (!ths.isEmpty()) {
                    theater = ths.get(0);
                }
            }
        }

        if (theater == null) {
            throw new RuntimeException("Theater portal record not found with ID: " + theaterId);
        }

        String safeReason = (reason != null && !reason.isBlank()) ? reason.trim() : "SuperAdmin Portal Cleanup";

        if (!permanent) {
            // Soft delete / Deactivate / Close theater portal
            theater.setActive(false);
            theaterRepository.save(theater);
            return;
        }

        // Permanent deletion (Purge duplicate or unwanted test/closed portal)
        Long tId = theater.getId();
        TheaterPortal portal = theater.getTheaterPortal();

        // Record audit entry for deleted portal
        try {
            List<Screen> scList = screenRepository.findByTheaterId(tId);
            DeletedTheaterPortal dtp = new DeletedTheaterPortal(
                    theater.getId(),
                    theater.getName(),
                    theater.getOwnerEmail(),
                    safeReason,
                    permanent ? "PERMANENT_PURGE" : "DEACTIVATED",
                    scList != null ? scList.size() : 0,
                    0L
            );
            deletedTheaterPortalRepository.save(dtp);
        } catch (Exception ignored) {}

        // 1. Delete showtimes and associated ticket bookings / seat locks
        List<Showtime> showtimes = showtimeRepository.findByTheaterId(tId);
        if (!showtimes.isEmpty()) {
            List<Long> showtimeIds = showtimes.stream().map(Showtime::getId).collect(Collectors.toList());
            
            // Delete ShowtimeSeatBooking records
            try {
                showtimeSeatBookingRepository.deleteByShowtimeIdIn(showtimeIds);
            } catch (Exception ignored) {}

            // Delete MovieBookedTicket records
            List<MovieBookedTicket> bookedTickets = movieBookedTicketRepository.findAll().stream()
                    .filter(tk -> tk.getShowtimeId() != null && showtimeIds.contains(tk.getShowtimeId()))
                    .collect(Collectors.toList());
            if (!bookedTickets.isEmpty()) {
                movieBookedTicketRepository.deleteAll(bookedTickets);
            }
            showtimeRepository.deleteAll(showtimes);
        }

        // 2. Delete Screens and their child SeatLayouts
        List<Screen> screens = screenRepository.findByTheaterId(tId);
        if (!screens.isEmpty()) {
            for (Screen screen : screens) {
                try {
                    List<SeatLayout> layouts = seatLayoutRepository.findByScreenId(screen.getId());
                    if (layouts != null && !layouts.isEmpty()) {
                        seatLayoutRepository.deleteAll(layouts);
                    }
                } catch (Exception ignored) {}
            }
            screenRepository.deleteAll(screens);
        }

        // Clean up any seat layouts tied to this portal directly
        if (portal != null) {
            try {
                List<SeatLayout> portalLayouts = seatLayoutRepository.findByTheaterPortalId(portal.getId());
                if (portalLayouts != null && !portalLayouts.isEmpty()) {
                    seatLayoutRepository.deleteAll(portalLayouts);
                }
            } catch (Exception ignored) {}
        }

        // 3. Delete food orders first (this removes order_items via cascade)
        List<FoodOrder> foodOrders = foodOrderRepository.findByTheaterId(tId);
        if (!foodOrders.isEmpty()) {
            foodOrderRepository.deleteAll(foodOrders);
        }

        // 4. Delete menu items (this removes menu_item_options via cascade)
        List<MenuItem> menuItems = menuItemRepository.findByTheaterId(tId);
        if (!menuItems.isEmpty()) {
            menuItemRepository.deleteAll(menuItems);
        }

        // 5. Unlink and remove Theater & TheaterPortal
        theater.setTheaterPortal(null);
        theaterRepository.delete(theater);

        if (portal != null) {
            List<Theater> remainingTheaters = theaterRepository.findByTheaterPortalId(portal.getId());
            if (remainingTheaters.isEmpty()) {
                // Delete invitations for this portal
                try {
                    List<TheaterInvitation> invites = theaterInvitationRepository.findByTheaterPortalId(portal.getId());
                    if (invites != null && !invites.isEmpty()) {
                        theaterInvitationRepository.deleteAll(invites);
                    }
                } catch (Exception ignored) {}

                // Delete notifications for this portal
                List<TheaterNotification> notifications = theaterNotificationRepository.findAll().stream()
                        .filter(n -> n.getTheaterPortal() != null && n.getTheaterPortal().getId().equals(portal.getId()))
                        .collect(Collectors.toList());
                if (!notifications.isEmpty()) {
                    theaterNotificationRepository.deleteAll(notifications);
                }

                // Delete portal users/staff
                List<TheaterUser> users = theaterUserRepository.findAll().stream()
                        .filter(u -> u.getTheaterPortal() != null && u.getTheaterPortal().getId().equals(portal.getId()))
                        .collect(Collectors.toList());
                if (!users.isEmpty()) {
                    theaterUserRepository.deleteAll(users);
                }

                theaterPortalRepository.delete(portal);
            }
        }
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void deleteTheaterUser(Long userId) {
        TheaterUser user = theaterUserRepository.findById(userId).orElseThrow(
                () -> new RuntimeException("Portal employee record not found with ID: " + userId)
        );
        theaterUserRepository.delete(user);
    }
}
