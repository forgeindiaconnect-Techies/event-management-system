package com.fic.event_management_system.dto;

public class TheaterPayoutLedgerResponse {
    private Long id;
    private String theater;
    private long tickets;
    private String comm;
    private double owed;
    private String acc;
    private String status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTheater() { return theater; }
    public void setTheater(String theater) { this.theater = theater; }
    
    public long getTickets() { return tickets; }
    public void setTickets(long tickets) { this.tickets = tickets; }
    
    public String getComm() { return comm; }
    public void setComm(String comm) { this.comm = comm; }
    
    public double getOwed() { return owed; }
    public void setOwed(double owed) { this.owed = owed; }
    
    public String getAcc() { return acc; }
    public void setAcc(String acc) { this.acc = acc; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
