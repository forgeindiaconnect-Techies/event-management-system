package com.fic.event_management_system.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import com.fic.event_management_system.entity.*;
import com.fic.event_management_system.enums.PortalType;
import com.fic.event_management_system.repository.*;

import java.util.*;

@RestController
@RequestMapping("/api/theater")
@CrossOrigin(origins = "*")
@SuppressWarnings("null")
public class TheaterController {

    @Autowired
    private TheaterRepository theaterRepository;

    @Autowired
    private ScreenRepository screenRepository;

    @Autowired
    private SeatLayoutRepository seatLayoutRepository;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private ShowtimeSeatBookingRepository showtimeSeatBookingRepository;

    @Autowired
    private MovieBookedTicketRepository movieBookedTicketRepository;

    @Autowired
    private PartnerInviteTokenRepository partnerInviteTokenRepository;

    @Autowired
    private TheaterPortalRepository theaterPortalRepository;

    @Autowired
    private TheaterUserRepository theaterUserRepository;

    @Autowired
    private com.fic.event_management_system.service.TheaterNotificationService theaterNotificationService;

    @Autowired
    private com.fic.event_management_system.service.TheaterEmailService theaterEmailService;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    @jakarta.annotation.PostConstruct
    @SuppressWarnings("unchecked")
    public void cleanupWrongUserEntry() {
        try {
            List<SeatLayout> layouts = seatLayoutRepository.findAll();
            for (SeatLayout layout : layouts) {
                if (layout.getScreen() != null) {
                    Screen scr = layout.getScreen();
                    TheaterPortal targetTp = null;
                    if (scr.getTheater() != null && scr.getTheater().getTheaterPortal() != null) {
                        targetTp = scr.getTheater().getTheaterPortal();
                    }
                    if (targetTp == null && scr.getTheater() != null && scr.getTheater().getOwnerEmail() != null) {
                        targetTp = theaterPortalRepository.findByAdminUserEmail(scr.getTheater().getOwnerEmail()).orElse(null);
                    }
                    // Fix layout #7 / screen SILVI to point to its true portal (Gopal Multiplex - Portal 2)
                    if (targetTp == null || (layout.getId() != null && layout.getId() == 7L) || (scr.getId() != null && scr.getId() == 5L)) {
                        Optional<TheaterPortal> portalOpt = theaterPortalRepository.findById(2L);
                        if (portalOpt.isPresent()) {
                            targetTp = portalOpt.get();
                        }
                    }
                    if (targetTp != null) {
                        layout.setTheaterPortal(targetTp);
                        seatLayoutRepository.save(layout);
                        if (scr.getTheater() != null) {
                            Theater th = scr.getTheater();
                            if (th.getTheaterPortal() == null || !th.getTheaterPortal().getId().equals(targetTp.getId())) {
                                th.setTheaterPortal(targetTp);
                                theaterRepository.save(th);
                            }
                        }
                    }
                }
            }
            List<Showtime> existingShowtimes = showtimeRepository.findAll();
            for (Showtime st : existingShowtimes) {
                if (st.getScreen() != null && st.getScreen().getTheater() != null) {
                    if (st.getTheater() == null || !st.getTheater().getId().equals(st.getScreen().getTheater().getId())) {
                        st.setTheater(st.getScreen().getTheater());
                        showtimeRepository.save(st);
                    }
                }
            }

            // Ensure Theater 2 / Gopal Multiplex has showtimes in database
            List<Screen> gopalScreens = screenRepository.findByTheaterId(2L);
            if (gopalScreens == null || gopalScreens.isEmpty()) {
                Optional<TheaterPortal> gopalTp = theaterPortalRepository.findById(2L);
                if (gopalTp.isPresent()) {
                    List<Theater> ths = theaterRepository.findByPortalId(2L);
                    if (!ths.isEmpty()) {
                        gopalScreens = screenRepository.findByTheaterId(ths.get(0).getId());
                    }
                }
            }
            if (gopalScreens != null && !gopalScreens.isEmpty()) {
                Screen targetScr = gopalScreens.get(0);
                List<Showtime> stList = showtimeRepository.findByScreenId(targetScr.getId());
                if (stList == null || stList.isEmpty()) {
                    Showtime st1 = new Showtime();
                    st1.setMovieTitle("Avatar: Fire and Ash");
                    st1.setShowDate(java.time.LocalDate.now());
                    st1.setStartTime(java.time.LocalTime.of(14, 30));
                    st1.setScreen(targetScr);
                    st1.setTheater(targetScr.getTheater());
                    st1.setClassPrices("balcony(250),gold(200),silver(150)");
                    showtimeRepository.save(st1);

                    Showtime st2 = new Showtime();
                    st2.setMovieTitle("Coolie (2025)");
                    st2.setShowDate(java.time.LocalDate.now());
                    st2.setStartTime(java.time.LocalTime.of(18, 45));
                    st2.setScreen(targetScr);
                    st2.setTheater(targetScr.getTheater());
                    st2.setClassPrices("balcony(280),gold(220),silver(180)");
                    showtimeRepository.save(st2);
                }
            }

            List<Screen> allScreens = screenRepository.findAll();
            for (Screen scr : allScreens) {
                if (scr.getLayoutJson() != null && !scr.getLayoutJson().isBlank()) {
                    try {
                        Map<String, Object> map = objectMapper.readValue(scr.getLayoutJson(), Map.class);
                        Object secObj = map.get("sections");
                        int grandRaw = 0;
                        if (secObj instanceof List) {
                            for (Object sec : (List<?>) secObj) {
                                if (sec instanceof Map) {
                                    Map<?, ?> m = (Map<?, ?>) sec;
                                    int r = (m.get("rowsCount") instanceof Number) ? ((Number) m.get("rowsCount")).intValue() : 0;
                                    int s = (m.get("seatsPerRow") instanceof Number) ? ((Number) m.get("seatsPerRow")).intValue() : 0;
                                    grandRaw += (r * s);
                                }
                            }
                        }
                        int delCount = 0;
                        Object delObj = map.get("deletedSeats");
                        if (delObj instanceof Map) {
                            for (Object v : ((Map<?, ?>) delObj).values()) {
                                if (Boolean.TRUE.equals(v) || "true".equalsIgnoreCase(String.valueOf(v))) {
                                    delCount++;
                                }
                            }
                        }
                        if (grandRaw > 0) {
                            int trueCap = Math.max(0, grandRaw - delCount);
                            scr.setTotalCapacity(trueCap);
                            screenRepository.save(scr);
                        }
                    } catch (Exception ex) {}
                }
            }
        } catch (Exception e) {
            System.err.println("Seat layout & showtime portal fix warning: " + e.getMessage());
        }
    }

    // --- THEATER CRUD ---
    @GetMapping("/list")
    public ResponseEntity<List<Theater>> getAllTheaters() {
        return ResponseEntity.ok(theaterRepository.findAll());
    }

    @GetMapping("/my-theater")
    public ResponseEntity<?> getMyTheater(@RequestParam(required = false) String email, @RequestParam(required = false) Long portalId) {
        TheaterPortal portal = null;
        if (portalId != null) {
            portal = theaterPortalRepository.findById(portalId).orElse(null);
        }
        if (portal == null && email != null && !email.trim().isEmpty()) {
            portal = theaterPortalRepository.findByAdminUserEmail(email).orElse(null);
        }

        if (portal != null) {
            List<Theater> list = theaterRepository.findByTheaterPortalId(portal.getId());
            if (list.isEmpty()) {
                list = theaterRepository.findByPortalId(portal.getId());
            }
            if (!list.isEmpty()) {
                Theater th = list.get(0);
                th.setTheaterPortal(portal);
                if (portal.getPortalName() != null && !portal.getPortalName().isBlank()) {
                    th.setName(portal.getPortalName());
                }
                return ResponseEntity.ok(th);
            }

            Theater t = new Theater();
            t.setId(portal.getId());
            t.setName(portal.getPortalName());
            t.setCity(portal.getCity() != null ? portal.getCity() : "Chennai");
            t.setOwnerEmail(email);
            t.setTheaterPortal(portal);
            return ResponseEntity.ok(t);
        }

        if (email != null && !email.trim().isEmpty()) {
            Optional<Theater> existingTheater = theaterRepository.findByOwnerEmail(email);
            if (existingTheater.isPresent()) {
                return ResponseEntity.ok(existingTheater.get());
            }
        }

        // Graceful fallback to first available theater portal
        List<TheaterPortal> allPortals = theaterPortalRepository.findAll();
        if (!allPortals.isEmpty()) {
            TheaterPortal fallbackPortal = allPortals.get(0);
            List<Theater> list = theaterRepository.findByTheaterPortalId(fallbackPortal.getId());
            if (!list.isEmpty()) {
                Theater th = list.get(0);
                th.setTheaterPortal(fallbackPortal);
                return ResponseEntity.ok(th);
            }
            Theater t = new Theater();
            t.setId(fallbackPortal.getId());
            t.setName(fallbackPortal.getPortalName());
            t.setCity(fallbackPortal.getCity() != null ? fallbackPortal.getCity() : "Chennai");
            t.setTheaterPortal(fallbackPortal);
            return ResponseEntity.ok(t);
        }

        return ResponseEntity.notFound().build();
    }

    @PostMapping("/create")
    public ResponseEntity<?> createTheater(@RequestBody Map<String, Object> payload) {
        String name = (String) payload.getOrDefault("name", "Cinema Partner");
        String city = (String) payload.getOrDefault("city", "Chennai");
        String ownerEmail = (String) payload.getOrDefault("ownerEmail", "");
        String password = (String) payload.getOrDefault("password", "password123");
        String typeStr = (String) payload.getOrDefault("theaterType", "SINGLE_SCREEN");

        com.fic.event_management_system.enums.TheaterType tType = 
            "MULTIPLEX".equalsIgnoreCase(typeStr) ? 
            com.fic.event_management_system.enums.TheaterType.MULTIPLEX : 
            com.fic.event_management_system.enums.TheaterType.SINGLE_SCREEN;

        // 1. Create entry in dedicated 'theater_portals' table
        TheaterPortal tPortal = new TheaterPortal();
        tPortal.setPortalName(name);
        tPortal.setPortalCode("TH-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        tPortal.setCity(city);
        tPortal.setTheaterType(typeStr);
        tPortal = theaterPortalRepository.save(tPortal);

        String mobileNumber = (String) payload.getOrDefault("mobileNumber", (String) payload.getOrDefault("phoneNumber", ""));

        // 2. Create entry in dedicated 'theater_users' table
        TheaterUser tUser = null;
        if (ownerEmail != null && !ownerEmail.trim().isEmpty()) {
            Optional<TheaterUser> existingUser = theaterUserRepository.findByEmail(ownerEmail);
            if (existingUser.isPresent()) {
                tUser = existingUser.get();
                tUser.setTheaterPortal(tPortal);
                if (mobileNumber != null && !mobileNumber.isBlank()) tUser.setPhoneNumber(mobileNumber);
                tUser = theaterUserRepository.save(tUser);
            } else {
                tUser = new TheaterUser();
                tUser.setEmail(ownerEmail);
                tUser.setFirstName(name);
                tUser.setPassword(passwordEncoder.encode(password));
                tUser.setRole("THEATER_OWNER");
                tUser.setTheaterPortal(tPortal);
                if (mobileNumber != null && !mobileNumber.isBlank()) tUser.setPhoneNumber(mobileNumber);
                tUser = theaterUserRepository.save(tUser);
            }
            tPortal.setAdminUser(tUser);
            theaterPortalRepository.save(tPortal);
        }

        // 3. Create entry in 'theaters' table
        Theater theater = new Theater();
        theater.setName(name);
        theater.setCity(city);
        theater.setTheaterType(tType);
        theater.setOwnerEmail(ownerEmail);
        theater.setTheaterPortal(tPortal);
        Theater saved = theaterRepository.save(theater);

        Map<String, Object> resp = new HashMap<>();
        resp.put("theater", saved);
        resp.put("portalId", tPortal.getId());
        resp.put("portalCode", tPortal.getPortalCode());
        resp.put("portalName", tPortal.getPortalName());

        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTheaterById(@PathVariable Long id) {
        Optional<Theater> t = theaterRepository.findById(id);
        if (t.isPresent()) {
            return ResponseEntity.ok(t.get());
        }
        return ResponseEntity.notFound().build();
    }

    // --- SCREEN CRUD ---
    @GetMapping("/{theaterId}/screens")
    public ResponseEntity<List<Screen>> getScreensByTheater(@PathVariable Long theaterId) {
        List<Screen> screens = screenRepository.findByTheaterId(theaterId);
        if (screens != null && !screens.isEmpty()) {
            return ResponseEntity.ok(screens);
        }
        Optional<TheaterPortal> tp = theaterPortalRepository.findById(theaterId);
        if (tp.isPresent()) {
            List<Theater> theaters = theaterRepository.findByPortalId(theaterId);
            if (!theaters.isEmpty()) {
                return ResponseEntity.ok(screenRepository.findByTheaterId(theaters.get(0).getId()));
            }
        }
        return ResponseEntity.ok(java.util.Collections.emptyList());
    }

    @PostMapping("/{theaterId}/screens")
    public ResponseEntity<Screen> createScreen(@PathVariable Long theaterId, @RequestBody Screen screen) {
        Theater targetTheater = null;
        Optional<Theater> t = theaterRepository.findById(theaterId);
        if (t.isPresent()) {
            targetTheater = t.get();
        } else {
            Optional<TheaterPortal> tp = theaterPortalRepository.findById(theaterId);
            if (tp.isPresent()) {
                List<Theater> theaters = theaterRepository.findByTheaterPortalId(theaterId);
                if (theaters.isEmpty()) {
                    theaters = theaterRepository.findByPortalId(theaterId);
                }
                if (!theaters.isEmpty()) {
                    targetTheater = theaters.get(0);
                } else {
                    Theater newTh = new Theater();
                    newTh.setName(tp.get().getPortalName());
                    newTh.setCity(tp.get().getCity() != null ? tp.get().getCity() : "Chennai");
                    newTh.setTheaterPortal(tp.get());
                    targetTheater = theaterRepository.save(newTh);
                }
            }
        }

        if (targetTheater != null) {
            screen.setTheater(targetTheater);
            return ResponseEntity.ok(screenRepository.save(screen));
        }
        return ResponseEntity.badRequest().build();
    }

    @PutMapping("/screens/{screenId}")
    public ResponseEntity<?> updateScreen(@PathVariable Long screenId, @RequestBody Screen payload) {
        Optional<Screen> screenOpt = screenRepository.findById(screenId);
        if (screenOpt.isPresent()) {
            Screen scr = screenOpt.get();
            if (payload.getScreenName() != null && !payload.getScreenName().isBlank()) {
                scr.setScreenName(payload.getScreenName());
            }
            if (payload.getScreenType() != null && !payload.getScreenType().isBlank()) {
                scr.setScreenType(payload.getScreenType());
            }
            if (payload.getProjectionType() != null) scr.setProjectionType(payload.getProjectionType());
            if (payload.getSoundSystem() != null) scr.setSoundSystem(payload.getSoundSystem());
            if (payload.getScreenFormat() != null) scr.setScreenFormat(payload.getScreenFormat());

            return ResponseEntity.ok(screenRepository.save(scr));
        }
        return ResponseEntity.notFound().build();
    }

    @Transactional
    @DeleteMapping("/screens/{screenId}")
    public ResponseEntity<?> deleteScreen(@PathVariable Long screenId) {
        if (screenRepository.existsById(screenId)) {
            List<SeatLayout> layouts = seatLayoutRepository.findByScreenId(screenId);
            if (layouts != null && !layouts.isEmpty()) {
                seatLayoutRepository.deleteAll(layouts);
            }
            List<Showtime> showtimes = showtimeRepository.findByScreenId(screenId);
            if (showtimes != null && !showtimes.isEmpty()) {
                List<Long> stIds = showtimes.stream().map(Showtime::getId).toList();
                showtimeSeatBookingRepository.deleteByShowtimeIdIn(stIds);
                showtimeRepository.deleteAll(showtimes);
            }
            screenRepository.deleteById(screenId);
            return ResponseEntity.ok(Map.of("message", "Screen deleted successfully"));
        }
        return ResponseEntity.notFound().build();
    }

    // --- SEAT LAYOUT CRUD ---
    @GetMapping("/screens/{screenId}/layout")
    public ResponseEntity<?> getScreenLayoutJson(@PathVariable Long screenId) {
        Optional<Screen> screen = screenRepository.findById(screenId);
        if (screen.isPresent() && screen.get().getLayoutJson() != null && !screen.get().getLayoutJson().isBlank()) {
            return ResponseEntity.ok()
                    .header("Content-Type", "application/json")
                    .body(screen.get().getLayoutJson());
        }
        return ResponseEntity.ok()
                .header("Content-Type", "application/json")
                .body("{}");
    }

    @PostMapping("/screens/{screenId}/layout")
    public ResponseEntity<?> saveScreenLayoutJson(@PathVariable Long screenId, @RequestBody Map<String, Object> payload) {
        Optional<Screen> screenOpt = screenRepository.findById(screenId);
        if (screenOpt.isPresent()) {
            Screen screen = screenOpt.get();
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                String json = mapper.writeValueAsString(payload);
                screen.setLayoutJson(json);

                // Calculate capacity
                Object sectionsObj = payload.get("sections");
                if (sectionsObj instanceof List) {
                    List<?> sectionsList = (List<?>) sectionsObj;
                    int cap = 0;
                    for (Object sec : sectionsList) {
                        if (sec instanceof Map) {
                            Map<?, ?> m = (Map<?, ?>) sec;
                            Object rObj = m.get("rowsCount");
                            Object sObj = m.get("seatsPerRow");
                            int rows = (rObj instanceof Number) ? ((Number) rObj).intValue() : 0;
                            int seats = (sObj instanceof Number) ? ((Number) sObj).intValue() : 0;
                            cap += (rows * seats);
                        }
                    }
                    Object delObj = payload.get("deletedSeats");
                    if (delObj instanceof Map) {
                        cap = Math.max(0, cap - ((Map<?, ?>) delObj).size());
                    }
                    screen.setTotalCapacity(cap);
                }

                // Auto-sync single summary row in seat_layouts table
                TheaterPortal tp = (screen.getTheater() != null) ? screen.getTheater().getTheaterPortal() : null;
                if (tp == null && screen.getTheater() != null && screen.getTheater().getOwnerEmail() != null) {
                    tp = theaterPortalRepository.findByAdminUserEmail(screen.getTheater().getOwnerEmail()).orElse(null);
                }
                if (tp == null && screen.getTheater() != null && screen.getTheater().getId() != null) {
                    tp = theaterPortalRepository.findById(screen.getTheater().getId()).orElse(null);
                }

                List<SeatLayout> existing = seatLayoutRepository.findByScreenId(screenId);
                if (existing != null && !existing.isEmpty()) {
                    seatLayoutRepository.deleteAll(existing);
                }

                int grandRawSeats = 0;
                StringBuilder classesSb = new StringBuilder();
                if (sectionsObj instanceof List) {
                    List<?> sectionsList = (List<?>) sectionsObj;
                    for (Object sec : sectionsList) {
                        if (sec instanceof Map) {
                            Map<?, ?> m = (Map<?, ?>) sec;
                            String cName = (m.get("name") != null) ? m.get("name").toString().toLowerCase() : "standard";
                            int r = (m.get("rowsCount") instanceof Number) ? ((Number) m.get("rowsCount")).intValue() : 0;
                            int s = (m.get("seatsPerRow") instanceof Number) ? ((Number) m.get("seatsPerRow")).intValue() : 0;
                            int secCap = r * s;
                            grandRawSeats += secCap;
                            if (classesSb.length() > 0) classesSb.append(",");
                            classesSb.append(cName).append("(").append(secCap).append(")");
                        }
                    }
                }

                int deletedCount = 0;
                Object delObj = payload.get("deletedSeats");
                if (delObj instanceof Map) {
                    Map<?, ?> delMap = (Map<?, ?>) delObj;
                    for (Object v : delMap.values()) {
                        if (Boolean.TRUE.equals(v) || "true".equalsIgnoreCase(String.valueOf(v))) {
                            deletedCount++;
                        }
                    }
                }

                if (grandRawSeats > 0) {
                    int trueCapacity = Math.max(0, grandRawSeats - deletedCount);
                    screen.setTotalCapacity(trueCapacity);
                }

                SeatLayout summaryRow = new SeatLayout();
                summaryRow.setScreen(screen);
                summaryRow.setTheaterPortal(tp);
                summaryRow.setScreenName(screen.getScreenName());
                summaryRow.setClasses(classesSb.toString());
                summaryRow.setTotalSeatCount(screen.getTotalCapacity());
                seatLayoutRepository.save(summaryRow);

                screenRepository.save(screen);
                return ResponseEntity.ok(Map.of("message", "Screen layout saved successfully", "capacity", screen.getTotalCapacity()));
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Failed to parse layout json: " + e.getMessage());
            }
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/screens/{screenId}/seats")
    public ResponseEntity<List<SeatLayout>> getSeatLayout(@PathVariable Long screenId) {
        return ResponseEntity.ok(seatLayoutRepository.findByScreenId(screenId));
    }

    @PostMapping("/screens/{screenId}/seats/bulk")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> saveSeatLayoutBulk(@PathVariable Long screenId, @RequestBody List<SeatLayout> seatLayouts) {
        Optional<Screen> screenOpt = screenRepository.findById(screenId);
        if (!screenOpt.isPresent()) {
            return ResponseEntity.badRequest().body("Screen not found");
        }
        Screen screen = screenOpt.get();

        List<SeatLayout> existing = seatLayoutRepository.findByScreenId(screenId);
        if (existing != null && !existing.isEmpty()) {
            seatLayoutRepository.deleteAll(existing);
        }

        TheaterPortal tp = (screen.getTheater() != null) ? screen.getTheater().getTheaterPortal() : null;
        if (tp == null && screen.getTheater() != null && screen.getTheater().getOwnerEmail() != null) {
            tp = theaterPortalRepository.findByAdminUserEmail(screen.getTheater().getOwnerEmail()).orElse(null);
        }
        if (tp == null && screen.getTheater() != null && screen.getTheater().getId() != null) {
            tp = theaterPortalRepository.findById(screen.getTheater().getId()).orElse(null);
        }

        SeatLayout summaryRow = new SeatLayout();
        summaryRow.setScreen(screen);
        summaryRow.setTheaterPortal(tp);
        summaryRow.setScreenName(screen.getScreenName());

        StringBuilder classesSb = new StringBuilder();
        int grandTotalSeats = 0;

        if (seatLayouts != null && !seatLayouts.isEmpty() && seatLayouts.get(0).getClasses() != null && !seatLayouts.get(0).getClasses().isBlank()) {
            summaryRow.setClasses(seatLayouts.get(0).getClasses());
            summaryRow.setTotalSeatCount(seatLayouts.get(0).getTotalSeatCount() != null ? seatLayouts.get(0).getTotalSeatCount() : 0);
        } else if (seatLayouts != null) {
            for (SeatLayout input : seatLayouts) {
                String typeName = (input.getClasses() != null && !input.getClasses().isBlank())
                        ? input.getClasses().toLowerCase()
                        : "standard";

                int count = (input.getTotalSeatCount() != null) ? input.getTotalSeatCount() : 0;
                grandTotalSeats += count;

                if (classesSb.length() > 0) {
                    classesSb.append(",");
                }
                classesSb.append(typeName).append("(").append(count).append(")");
            }
            summaryRow.setClasses(classesSb.toString());
            summaryRow.setTotalSeatCount(grandTotalSeats);
        }

        SeatLayout saved = seatLayoutRepository.save(summaryRow);

        // Auto-update screen total_capacity in screens table
        screen.setTotalCapacity(summaryRow.getTotalSeatCount());
        screenRepository.save(screen);

        return ResponseEntity.ok(List.of(saved));
    }

    // --- SHOWTIME CRUD ---
    @GetMapping("/{theaterId}/showtimes")
    public ResponseEntity<List<Showtime>> getShowtimesByTheater(@PathVariable Long theaterId) {
        List<Showtime> list = showtimeRepository.findByTheaterId(theaterId);
        if (list == null || list.isEmpty()) {
            List<Screen> screens = screenRepository.findByTheaterId(theaterId);
            if (screens == null || screens.isEmpty()) {
                Optional<TheaterPortal> tp = theaterPortalRepository.findById(theaterId);
                if (tp.isPresent()) {
                    List<Theater> theaters = theaterRepository.findByPortalId(theaterId);
                    if (!theaters.isEmpty()) {
                        screens = screenRepository.findByTheaterId(theaters.get(0).getId());
                    }
                }
            }
            if (screens != null && !screens.isEmpty()) {
                list = new java.util.ArrayList<>();
                for (Screen scr : screens) {
                    List<Showtime> scrSt = showtimeRepository.findByScreenId(scr.getId());
                    if (scrSt != null) list.addAll(scrSt);
                }
            }
        }
        return ResponseEntity.ok(list != null ? list : java.util.Collections.emptyList());
    }

    @GetMapping("/public/showtimes")
    public ResponseEntity<List<Showtime>> getAllPublicShowtimes() {
        return ResponseEntity.ok(showtimeRepository.findAll());
    }

    @GetMapping("/screens/{screenId}/showtimes")
    public ResponseEntity<List<Showtime>> getShowtimes(@PathVariable Long screenId) {
        return ResponseEntity.ok(showtimeRepository.findByScreenId(screenId));
    }

    @PostMapping("/screens/{screenId}/showtimes")
    public ResponseEntity<?> createShowtime(@PathVariable Long screenId, @RequestBody Showtime showtime) {
        Optional<Screen> screen = screenRepository.findById(screenId);
        if (screen.isPresent()) {
            showtime.setScreen(screen.get());
            if (screen.get().getTheater() != null) {
                showtime.setTheater(screen.get().getTheater());
            }
            return ResponseEntity.ok(showtimeRepository.save(showtime));
        }
        return ResponseEntity.badRequest().build();
    }

    @PutMapping("/showtimes/{showtimeId}")
    public ResponseEntity<?> updateShowtime(@PathVariable Long showtimeId, @RequestBody Showtime payload) {
        Optional<Showtime> stOpt = showtimeRepository.findById(showtimeId);
        if (stOpt.isPresent()) {
            Showtime st = stOpt.get();
            if (payload.getMovieTitle() != null) st.setMovieTitle(payload.getMovieTitle());
            if (payload.getMovieId() != null) st.setMovieId(payload.getMovieId());
            if (payload.getPosterUrl() != null) st.setPosterUrl(payload.getPosterUrl());
            if (payload.getShowDate() != null) st.setShowDate(payload.getShowDate());
            if (payload.getStartTime() != null) st.setStartTime(payload.getStartTime());
            if (payload.getClassPrices() != null) st.setClassPrices(payload.getClassPrices());
            return ResponseEntity.ok(showtimeRepository.save(st));
        }
        return ResponseEntity.notFound().build();
    }

    @Transactional
    @DeleteMapping("/showtimes/{showtimeId}")
    public ResponseEntity<?> deleteShowtime(@PathVariable Long showtimeId) {
        if (showtimeRepository.existsById(showtimeId)) {
            showtimeSeatBookingRepository.deleteByShowtimeId(showtimeId);
            showtimeRepository.deleteById(showtimeId);
            return ResponseEntity.ok(Map.of("message", "Showtime deleted"));
        }
        return ResponseEntity.notFound().build();
    }

    // --- LIVE SEAT BOOKING & SYNCHRONIZATION ---

    @GetMapping("/showtimes/{showtimeId}/booked-seats")
    public ResponseEntity<List<String>> getBookedSeats(@PathVariable Long showtimeId) {
        List<ShowtimeSeatBooking> bookings = showtimeSeatBookingRepository.findByShowtimeId(showtimeId);
        List<String> seats = bookings.stream().map(ShowtimeSeatBooking::getSeatKey).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(seats);
    }

    @PostMapping("/showtimes/{showtimeId}/book-seats")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> bookSeats(@PathVariable Long showtimeId, @RequestBody Map<String, Object> payload) {
        Object seatKeysObj = payload.get("seatKeys");
        List<String> newSeatKeys = new java.util.ArrayList<>();
        if (seatKeysObj instanceof List<?>) {
            for (Object item : (List<?>) seatKeysObj) {
                if (item != null) newSeatKeys.add(String.valueOf(item));
            }
        }
        
        Optional<Showtime> optionalShowtime = showtimeRepository.findById(showtimeId);
        if (!optionalShowtime.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Showtime not found"));
        }
        Showtime showtime = optionalShowtime.get();

        // Get currently booked to avoid duplicates
        List<ShowtimeSeatBooking> existingBookings = showtimeSeatBookingRepository.findByShowtimeId(showtimeId);
        java.util.Set<String> existingKeys = existingBookings.stream().map(ShowtimeSeatBooking::getSeatKey).collect(java.util.stream.Collectors.toSet());

        List<ShowtimeSeatBooking> bookingsToSave = new java.util.ArrayList<>();
        for (String key : newSeatKeys) {
            if (!existingKeys.contains(key)) {
                ShowtimeSeatBooking b = new ShowtimeSeatBooking();
                b.setShowtime(showtime);
                b.setSeatKey(key);
                bookingsToSave.add(b);
                existingKeys.add(key); // for the response
            }
        }
        
        if (!bookingsToSave.isEmpty()) {
            showtimeSeatBookingRepository.saveAll(bookingsToSave);
        }

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Seats booked successfully",
            "showtimeId", showtimeId,
            "bookedSeats", new java.util.ArrayList<>(existingKeys)
        ));
    }

    @PostMapping("/showtimes/{showtimeId}/release-seats")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> releaseSeats(@PathVariable Long showtimeId, @RequestBody Map<String, Object> payload) {
        Object seatKeysObj = payload.get("seatKeys");
        List<String> keysToRemove = new java.util.ArrayList<>();
        if (seatKeysObj instanceof List<?>) {
            for (Object item : (List<?>) seatKeysObj) {
                if (item != null) keysToRemove.add(String.valueOf(item));
            }
        }
        
        if (!keysToRemove.isEmpty()) {
            showtimeSeatBookingRepository.deleteByShowtimeIdAndSeatKeyIn(showtimeId, keysToRemove);
        }
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Seats released successfully"
        ));
    }

    @GetMapping("/sales-history")
    public ResponseEntity<List<Map<String, Object>>> getSalesHistory(
            @RequestParam(required = false) Long theaterId,
            @RequestParam(required = false) Long portalId,
            @RequestParam(required = false) String theaterName
    ) {
        List<MovieBookedTicket> tickets = movieBookedTicketRepository.findAllByOrderByCreatedAtDesc();
        List<Map<String, Object>> response = new java.util.ArrayList<>();
        for (MovieBookedTicket t : tickets) {
            String showDate = t.getDate();
            String showTime = t.getTime();
            String resolvedTheaterName = t.getTheaterName();
            Long resolvedTheaterId = null;
            Long resolvedPortalId = null;

            if (t.getShowtimeId() != null) {
                try {
                    Optional<Showtime> stOpt = showtimeRepository.findById(t.getShowtimeId());
                    if (stOpt.isPresent()) {
                        Showtime st = stOpt.get();
                        if ((showDate == null || showDate.isEmpty()) && st.getShowDate() != null) {
                            showDate = st.getShowDate().toString();
                        }
                        if ((showTime == null || showTime.isEmpty()) && st.getStartTime() != null) {
                            showTime = st.getStartTime().toString();
                        }
                        if (st.getTheater() != null) {
                            resolvedTheaterId = st.getTheater().getId();
                            if (resolvedTheaterName == null || resolvedTheaterName.isEmpty()) {
                                resolvedTheaterName = st.getTheater().getName();
                            }
                            if (st.getTheater().getTheaterPortal() != null) {
                                resolvedPortalId = st.getTheater().getTheaterPortal().getId();
                            }
                        } else if (st.getScreen() != null && st.getScreen().getTheater() != null) {
                            resolvedTheaterId = st.getScreen().getTheater().getId();
                            if (resolvedTheaterName == null || resolvedTheaterName.isEmpty()) {
                                resolvedTheaterName = st.getScreen().getTheater().getName();
                            }
                            if (st.getScreen().getTheater().getTheaterPortal() != null) {
                                resolvedPortalId = st.getScreen().getTheater().getTheaterPortal().getId();
                            }
                        }
                    }
                } catch (Exception ignored) {}
            }

            // Filtering by theater / portal / theaterName
            if (theaterId != null) {
                if (resolvedTheaterId == null || !resolvedTheaterId.equals(theaterId)) {
                    continue;
                }
            } else if (portalId != null) {
                if (resolvedPortalId == null || !resolvedPortalId.equals(portalId)) {
                    continue;
                }
            } else if (theaterName != null && !theaterName.trim().isEmpty()) {
                String cleanTarget = theaterName.trim().toLowerCase();
                String cleanResolved = (resolvedTheaterName != null ? resolvedTheaterName : "").trim().toLowerCase();
                if (!cleanResolved.equals(cleanTarget) && !cleanResolved.contains(cleanTarget) && !cleanTarget.contains(cleanResolved)) {
                    continue;
                }
            }

            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", t.getId());
            map.put("ticketId", t.getTicketId());
            map.put("movieTitle", t.getMovieTitle());
            map.put("screenName", t.getScreenName());
            map.put("date", showDate != null ? showDate : (t.getCreatedAt() != null ? t.getCreatedAt().toLocalDate().toString() : ""));
            map.put("time", showTime != null ? showTime : "09:30 AM");
            map.put("theaterName", resolvedTheaterName != null ? resolvedTheaterName : "Gopal Multiplex");
            map.put("theaterId", resolvedTheaterId);
            map.put("portalId", resolvedPortalId);
            map.put("showtimeId", t.getShowtimeId());
            map.put("seats", t.getSeats());
            map.put("amount", t.getAmount());
            map.put("customerName", t.getCustomerName());
            map.put("customerPhone", t.getCustomerPhone());
            map.put("customerEmail", t.getCustomerEmail());
            map.put("paymentMode", t.getPaymentMode());
            map.put("status", t.getStatus() != null ? t.getStatus() : "VALID");
            map.put("source", t.getSource());
            map.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : null);
            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/sales-history/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteSale(@PathVariable Long id) {
        if (movieBookedTicketRepository.existsById(id)) {
            movieBookedTicketRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Sale deleted"));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/tickets/search")
    public ResponseEntity<List<Map<String, Object>>> searchMovieTickets(
            @RequestParam(required = false) String movieTitle,
            @RequestParam(required = false) String emailOrPhone,
            @RequestParam(required = false) String query) {

        List<MovieBookedTicket> tickets = movieBookedTicketRepository.findAllByOrderByCreatedAtDesc();
        List<Map<String, Object>> matched = new java.util.ArrayList<>();

        String cleanTitle = movieTitle != null ? movieTitle.trim().toLowerCase() : "";
        String cleanContact = emailOrPhone != null ? emailOrPhone.trim().toLowerCase() : "";
        String cleanQuery = query != null ? query.trim().toLowerCase() : "";
        String phoneDigits = cleanContact.replaceAll("[^0-9]", "");

        for (MovieBookedTicket t : tickets) {
            boolean titleMatches = true;
            boolean contactMatches = true;

            // Check title / ticketId match
            if (!cleanTitle.isEmpty()) {
                boolean matchesTitle = t.getMovieTitle() != null && t.getMovieTitle().toLowerCase().contains(cleanTitle);
                boolean matchesTicketId = t.getTicketId() != null && t.getTicketId().toLowerCase().contains(cleanTitle);
                if (!matchesTitle && !matchesTicketId) {
                    titleMatches = false;
                }
            }

            // Check contact match against phone, email, customer name, or ticketId
            if (!cleanContact.isEmpty()) {
                boolean matchesEmail = t.getCustomerEmail() != null && t.getCustomerEmail().toLowerCase().contains(cleanContact);
                boolean matchesName = t.getCustomerName() != null && t.getCustomerName().toLowerCase().contains(cleanContact);
                boolean matchesPhone = false;
                if (t.getCustomerPhone() != null) {
                    String tPhone = t.getCustomerPhone().replaceAll("[^0-9]", "");
                    if (!phoneDigits.isEmpty() && tPhone.contains(phoneDigits)) {
                        matchesPhone = true;
                    } else if (t.getCustomerPhone().toLowerCase().contains(cleanContact)) {
                        matchesPhone = true;
                    }
                }
                boolean matchesTicketId = t.getTicketId() != null && t.getTicketId().toLowerCase().contains(cleanContact);

                if (!matchesEmail && !matchesName && !matchesPhone && !matchesTicketId) {
                    contactMatches = false;
                }
            }

            // Omni-query match
            if (!cleanQuery.isEmpty()) {
                boolean qTitle = t.getMovieTitle() != null && t.getMovieTitle().toLowerCase().contains(cleanQuery);
                boolean qTicketId = t.getTicketId() != null && t.getTicketId().toLowerCase().contains(cleanQuery);
                boolean qName = t.getCustomerName() != null && t.getCustomerName().toLowerCase().contains(cleanQuery);
                boolean qEmail = t.getCustomerEmail() != null && t.getCustomerEmail().toLowerCase().contains(cleanQuery);
                boolean qPhone = t.getCustomerPhone() != null && t.getCustomerPhone().contains(cleanQuery);
                if (!qTitle && !qTicketId && !qName && !qEmail && !qPhone) {
                    titleMatches = false;
                }
            }

            if (titleMatches && contactMatches) {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", t.getId());
                map.put("ticketId", t.getTicketId());
                map.put("movieTitle", t.getMovieTitle());
                map.put("screenName", t.getScreenName());

                String showDate = t.getDate();
                String showTime = t.getTime();
                String theaterName = t.getTheaterName();

                if (t.getShowtimeId() != null) {
                    try {
                        Optional<Showtime> stOpt = showtimeRepository.findById(t.getShowtimeId());
                        if (stOpt.isPresent()) {
                            Showtime st = stOpt.get();
                            if ((showDate == null || showDate.isEmpty()) && st.getShowDate() != null) {
                                showDate = st.getShowDate().toString();
                            }
                            if ((showTime == null || showTime.isEmpty()) && st.getStartTime() != null) {
                                showTime = st.getStartTime().toString();
                            }
                            if ((theaterName == null || theaterName.isEmpty()) && st.getTheater() != null && st.getTheater().getName() != null) {
                                theaterName = st.getTheater().getName();
                            }
                        }
                    } catch (Exception ignored) {}
                }

                map.put("date", showDate != null ? showDate : (t.getCreatedAt() != null ? t.getCreatedAt().toLocalDate().toString() : ""));
                map.put("time", showTime != null ? showTime : "09:30 AM");
                map.put("theaterName", theaterName != null ? theaterName : "Gopal Multiplex");
                map.put("showtimeId", t.getShowtimeId());
                map.put("seats", t.getSeats());
                map.put("amount", t.getAmount());
                map.put("customerName", t.getCustomerName());
                map.put("customerPhone", t.getCustomerPhone());
                map.put("customerEmail", t.getCustomerEmail());
                map.put("paymentMode", t.getPaymentMode());
                map.put("status", t.getStatus() != null ? t.getStatus() : "CONFIRMED");
                map.put("source", t.getSource());
                map.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : null);
                matched.add(map);
            }
        }

        return ResponseEntity.ok(matched);
    }

    @PostMapping("/sales-history")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> recordSale(@RequestBody Map<String, Object> sale) {
        if (sale != null) {
            MovieBookedTicket t = new MovieBookedTicket();
            t.setTicketId((String) sale.get("ticketId"));
            t.setMovieTitle((String) sale.get("movieTitle"));
            t.setScreenName((String) sale.get("screenName"));

            String dateVal = (String) (sale.get("date") != null ? sale.get("date") : sale.get("showDate"));
            t.setDate(dateVal);

            String timeVal = (String) (sale.get("time") != null ? sale.get("time") : (sale.get("showTime") != null ? sale.get("showTime") : sale.get("startTime")));
            t.setTime(timeVal);

            String emailVal = (String) (sale.get("customerEmail") != null ? sale.get("customerEmail") : sale.get("email"));
            t.setCustomerEmail(emailVal);

            String thNameVal = (String) (sale.get("theaterName") != null ? sale.get("theaterName") : sale.get("portalName"));
            t.setTheaterName(thNameVal);
            
            Object stIdObj = sale.get("showtimeId");
            if (stIdObj != null) {
                try {
                    Long stId = Long.parseLong(String.valueOf(stIdObj));
                    t.setShowtimeId(stId);
                    
                    // Populate missing date/time/theaterName from Showtime if needed
                    if (dateVal == null || timeVal == null || thNameVal == null) {
                        try {
                            Optional<Showtime> stOpt = showtimeRepository.findById(stId);
                            if (stOpt.isPresent()) {
                                Showtime st = stOpt.get();
                                if (t.getDate() == null && st.getShowDate() != null) t.setDate(st.getShowDate().toString());
                                if (t.getTime() == null && st.getStartTime() != null) t.setTime(st.getStartTime().toString());
                                if (t.getTheaterName() == null && st.getTheater() != null && st.getTheater().getName() != null) {
                                    t.setTheaterName(st.getTheater().getName());
                                }
                            }
                        } catch (Exception ignored) {}
                    }
                } catch (NumberFormatException e) {
                    // Ignore
                }
            }
            
            Object seatsObj = sale.get("seats");
            if (seatsObj instanceof List<?>) {
                List<?> list = (List<?>) seatsObj;
                List<String> strList = new java.util.ArrayList<>();
                for (Object o : list) {
                    if (o != null) strList.add(String.valueOf(o));
                }
                t.setSeats(String.join(", ", strList));
            } else {
                t.setSeats(String.valueOf(seatsObj));
            }

            Object amtObj = sale.get("amount");
            if (amtObj != null) {
                try {
                    t.setAmount(Double.parseDouble(String.valueOf(amtObj)));
                } catch (NumberFormatException e) {
                    t.setAmount(0.0);
                }
            }

            t.setCustomerName((String) sale.get("customerName"));
            t.setCustomerPhone((String) sale.get("customerPhone"));
            t.setPaymentMode((String) sale.get("paymentMode"));
            t.setStatus((String) sale.get("status"));
            t.setSource((String) sale.get("source"));

            movieBookedTicketRepository.save(t);

            // Dispatch in-app notification to Owner, Manager, and Counter Cashier
            Long portalId = null;
            Object pIdObj = sale.get("theaterPortalId") != null ? sale.get("theaterPortalId") : sale.get("portalId");
            if (pIdObj != null) {
                try {
                    portalId = Long.parseLong(String.valueOf(pIdObj));
                } catch (Exception ignored) {}
            }
            try {
                theaterNotificationService.notifyNewBooking(t, portalId);
            } catch (Exception e) {
                System.err.println("Notice: Failed to dispatch theater booking notification: " + e.getMessage());
            }

            // Dispatch digital M-Ticket confirmation email to customer
            String customerEmail = (String) sale.get("customerEmail");
            if (customerEmail == null || customerEmail.isBlank()) {
                customerEmail = (String) sale.get("email");
            }

            if (customerEmail != null && !customerEmail.isBlank()) {
                String theaterName = "Thunder Cinemas";
                if (portalId != null) {
                    try {
                        var portalOpt = theaterPortalRepository.findById(portalId);
                        if (portalOpt.isPresent() && portalOpt.get().getPortalName() != null && !portalOpt.get().getPortalName().isBlank()) {
                            theaterName = portalOpt.get().getPortalName();
                        }
                    } catch (Exception ignored) {}
                }
                try {
                    theaterEmailService.sendTicketConfirmationEmail(t, customerEmail.trim(), theaterName, portalId);
                } catch (Exception ex) {
                    System.err.println("Notice: Failed to dispatch theater booking confirmation email: " + ex.getMessage());
                }
            }
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    // --- INVITE TOKEN MANAGEMENT (SUPER ADMIN) ---
    @GetMapping("/invites/list")
    public ResponseEntity<List<PartnerInviteToken>> getInviteTokens() {
        return ResponseEntity.ok(partnerInviteTokenRepository.findAll());
    }

    @PostMapping("/invites/generate")
    public ResponseEntity<PartnerInviteToken> generateInviteToken(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String partnerName = payload.get("partnerName");
        String city = payload.get("city");

        PartnerInviteToken tokenObj = new PartnerInviteToken();
        tokenObj.setEmail(email);
        tokenObj.setPartnerName(partnerName);
        tokenObj.setCity(city);
        tokenObj.setPortalType(PortalType.THEATER_PORTAL);
        tokenObj.setToken("th_" + UUID.randomUUID().toString().substring(0, 8));

        return ResponseEntity.ok(partnerInviteTokenRepository.save(tokenObj));
    }

    @GetMapping("/invites/validate/{token}")
    public ResponseEntity<?> validateToken(@PathVariable String token) {
        Optional<PartnerInviteToken> t = partnerInviteTokenRepository.findByToken(token);
        if (t.isPresent() && !t.get().getIsUsed()) {
            return ResponseEntity.ok(t.get());
        }
        return ResponseEntity.badRequest().body("Invalid or expired token");
    }

    // --- THEATER PORTAL PROFILE GET & UPDATE ---
    @GetMapping("/portal-profile/{portalId}")
    public ResponseEntity<?> getTheaterPortalProfile(@PathVariable Long portalId) {
        Optional<TheaterPortal> portalOpt = theaterPortalRepository.findById(portalId);
        if (!portalOpt.isPresent()) {
            Optional<Theater> thOpt = theaterRepository.findById(portalId);
            if (thOpt.isPresent() && thOpt.get().getTheaterPortal() != null) {
                portalOpt = Optional.of(thOpt.get().getTheaterPortal());
            }
        }
        if (!portalOpt.isPresent()) {
            portalOpt = theaterPortalRepository.findAll().stream().findFirst();
        }
        if (!portalOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        TheaterPortal portal = portalOpt.get();
        TheaterUser admin = portal.getAdminUser();
        if (admin == null) {
            Optional<TheaterUser> userOpt = theaterUserRepository.findByTheaterPortalId(portal.getId()).stream().findFirst();
            if (userOpt.isPresent()) {
                admin = userOpt.get();
            }
        }

        boolean foodBookingEnabled = false;
        List<Theater> portalTheaters = theaterRepository.findByTheaterPortalId(portal.getId());
        if (!portalTheaters.isEmpty()) {
            for (Theater t : portalTheaters) {
                if (Boolean.TRUE.equals(t.getEnableOnlineFoodBooking())) {
                    foodBookingEnabled = true;
                    break;
                }
            }
        } else {
            Optional<Theater> directTh = theaterRepository.findById(portalId);
            if (directTh.isPresent()) {
                foodBookingEnabled = Boolean.TRUE.equals(directTh.get().getEnableOnlineFoodBooking());
            }
        }

        Map<String, Object> profile = new HashMap<>();
        profile.put("portalId", portal.getId());
        profile.put("portalCode", portal.getPortalCode() != null ? portal.getPortalCode() : ("PORTAL_" + portal.getId()));
        profile.put("portalName", portal.getPortalName());
        profile.put("theaterType", portal.getTheaterType());
        profile.put("fullName", admin != null ? ((admin.getFirstName() != null ? admin.getFirstName() : "") + " " + (admin.getLastName() != null ? admin.getLastName() : "")).trim() : "Theater Partner");
        profile.put("email", admin != null ? admin.getEmail() : "");
        profile.put("mobileNumber", admin != null && admin.getPhoneNumber() != null ? admin.getPhoneNumber() : "");
        profile.put("enableOnlineFoodBooking", foodBookingEnabled);

        return ResponseEntity.ok(profile);
    }

    @PutMapping("/portal-profile/{portalId}")
    public ResponseEntity<?> updateTheaterPortalProfile(@PathVariable Long portalId, @RequestBody Map<String, Object> payload) {
        Optional<TheaterPortal> portalOpt = theaterPortalRepository.findById(portalId);
        if (!portalOpt.isPresent()) {
            Optional<Theater> thOpt = theaterRepository.findById(portalId);
            if (thOpt.isPresent() && thOpt.get().getTheaterPortal() != null) {
                portalOpt = Optional.of(thOpt.get().getTheaterPortal());
            }
        }
        if (!portalOpt.isPresent()) {
            portalOpt = theaterPortalRepository.findAll().stream().findFirst();
        }
        if (!portalOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        TheaterPortal portal = portalOpt.get();

        if (payload.containsKey("portalName") && payload.get("portalName") != null) {
            portal.setPortalName(payload.get("portalName").toString());
        }
        if (payload.containsKey("theaterType") && payload.get("theaterType") != null) {
            portal.setTheaterType(payload.get("theaterType").toString());
        }
        theaterPortalRepository.save(portal);

        if (payload.containsKey("enableOnlineFoodBooking")) {
            boolean enableFood = Boolean.parseBoolean(payload.get("enableOnlineFoodBooking").toString());
            List<Theater> portalTheaters = theaterRepository.findByTheaterPortalId(portal.getId());
            if (!portalTheaters.isEmpty()) {
                for (Theater t : portalTheaters) {
                    t.setEnableOnlineFoodBooking(enableFood);
                    theaterRepository.save(t);
                }
            } else {
                Optional<Theater> directTh = theaterRepository.findById(portalId);
                if (directTh.isPresent()) {
                    Theater t = directTh.get();
                    t.setEnableOnlineFoodBooking(enableFood);
                    theaterRepository.save(t);
                }
            }
        }

        TheaterUser admin = portal.getAdminUser();
        if (admin == null) {
            Optional<TheaterUser> userOpt = theaterUserRepository.findByTheaterPortalId(portal.getId()).stream().findFirst();
            if (userOpt.isPresent()) {
                admin = userOpt.get();
            }
        }

        if (admin != null) {
            if (payload.containsKey("fullName") && payload.get("fullName") != null) {
                String full = payload.get("fullName").toString().trim();
                String[] parts = full.split(" ", 2);
                admin.setFirstName(parts[0]);
                if (parts.length > 1) {
                    admin.setLastName(parts[1]);
                } else {
                    admin.setLastName("");
                }
            }
            if (payload.containsKey("email") && payload.get("email") != null) {
                admin.setEmail(payload.get("email").toString());
            }
            if (payload.containsKey("mobileNumber") && payload.get("mobileNumber") != null) {
                admin.setPhoneNumber(payload.get("mobileNumber").toString());
            }
            theaterUserRepository.save(admin);
        }

        return getTheaterPortalProfile(portal.getId());
    }

    @GetMapping("/user-profile")
    public ResponseEntity<?> getUserProfile(@RequestParam String email) {
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body("Email parameter is required");
        }
        Optional<TheaterUser> userOpt = theaterUserRepository.findByEmail(email.trim());
        if (userOpt.isPresent()) {
            TheaterUser u = userOpt.get();
            Map<String, Object> resp = new HashMap<>();
            resp.put("id", u.getId());
            resp.put("email", u.getEmail());
            resp.put("username", u.getUsername());
            String fullName = ((u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : "")).trim();
            if (fullName.isEmpty()) {
                fullName = (u.getUsername() != null && !u.getUsername().isBlank()) ? u.getUsername() : u.getEmail();
            }
            resp.put("fullName", fullName);
            resp.put("phoneNumber", u.getPhoneNumber() != null ? u.getPhoneNumber() : "");
            resp.put("role", u.getRole());
            if (u.getTheaterPortal() != null) {
                resp.put("portalId", u.getTheaterPortal().getId());
                resp.put("portalCode", u.getTheaterPortal().getPortalCode());
                resp.put("portalName", u.getTheaterPortal().getPortalName());
            }
            return ResponseEntity.ok(resp);
        }
        return ResponseEntity.notFound().build();
    }
}
