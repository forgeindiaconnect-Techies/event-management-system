package com.fic.event_management_system.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "seat_layouts")
public class SeatLayout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "screen_name")
    private String screenName;

    @Column(length = 1000)
    private String classes; // e.g. "gold(100),silver(200)"

    @Column(name = "total_seat_count")
    private Integer totalSeatCount = 0;

    @ManyToOne
    @JoinColumn(name = "screen_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"theater"})
    private Screen screen;

    @ManyToOne
    @JoinColumn(name = "theater_portal_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"theaters", "partnerInviteTokens"})
    private TheaterPortal theaterPortal;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getScreenName() {
        return screenName;
    }

    public void setScreenName(String screenName) {
        this.screenName = screenName;
    }

    public String getClasses() {
        return classes;
    }

    public void setClasses(String classes) {
        this.classes = classes;
    }

    public Integer getTotalSeatCount() {
        return totalSeatCount;
    }

    public void setTotalSeatCount(Integer totalSeatCount) {
        this.totalSeatCount = totalSeatCount;
    }

    public Screen getScreen() {
        return screen;
    }

    public void setScreen(Screen screen) {
        this.screen = screen;
    }

    public TheaterPortal getTheaterPortal() {
        return theaterPortal;
    }

    public void setTheaterPortal(TheaterPortal theaterPortal) {
        this.theaterPortal = theaterPortal;
    }
}
