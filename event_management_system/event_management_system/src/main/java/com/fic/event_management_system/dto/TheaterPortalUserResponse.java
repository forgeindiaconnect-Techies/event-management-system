package com.fic.event_management_system.dto;

public class TheaterPortalUserResponse {
    private Long id;
    private String empId;
    private String name;
    private String email;
    private String portalId;
    private String theater;
    private String status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getEmpId() { return empId; }
    public void setEmpId(String empId) { this.empId = empId; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPortalId() { return portalId; }
    public void setPortalId(String portalId) { this.portalId = portalId; }
    
    public String getTheater() { return theater; }
    public void setTheater(String theater) { this.theater = theater; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
