package com.fic.event_management_system.dto;

import com.fic.event_management_system.enums.SupportRequestPriority;
import com.fic.event_management_system.enums.SupportRequestStatus;

public class UpdateSupportRequestRequest {

    private SupportRequestStatus status;
    private SupportRequestPriority priority;
    private String adminResponse;

    public SupportRequestStatus getStatus() {
        return status;
    }

    public void setStatus(SupportRequestStatus status) {
        this.status = status;
    }

    public SupportRequestPriority getPriority() {
        return priority;
    }

    public void setPriority(SupportRequestPriority priority) {
        this.priority = priority;
    }

    public String getAdminResponse() {
        return adminResponse;
    }

    public void setAdminResponse(String adminResponse) {
        this.adminResponse = adminResponse;
    }
}