package com.fic.event_management_system.dto;

public class TheaterDirectoryResponse {
    private Long id;
    private String name;
    private int screens;
    private int employees;
    private double revenue;
    private String owner;
    private long tickets;
    private String status;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getScreens() { return screens; }
    public void setScreens(int screens) { this.screens = screens; }
    public int getEmployees() { return employees; }
    public void setEmployees(int employees) { this.employees = employees; }
    public double getRevenue() { return revenue; }
    public void setRevenue(double revenue) { this.revenue = revenue; }
    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }
    public long getTickets() { return tickets; }
    public void setTickets(long tickets) { this.tickets = tickets; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
