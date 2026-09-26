package com.fic.event_management_system.dto;

public class UpdateTheaterSupportRequest {
    private String status;
    private String priority;
    private String adminResponse;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getAdminResponse() { return adminResponse; }
    public void setAdminResponse(String adminResponse) { this.adminResponse = adminResponse; }
}
