package com.fic.event_management_system.dto;

import com.fic.event_management_system.enums.SupportRequestPriority;
import com.fic.event_management_system.enums.SupportRequestType;

public class CreateSupportRequestRequest {

    private SupportRequestType type;
    private String subject;
    private String description;
    private String screenshotUrl;
    private String contactEmail;
    private SupportRequestPriority priority;
    private String currentPage;
    private Long portalId;

    public SupportRequestType getType() {
        return type;
    }

    public void setType(SupportRequestType type) {
        this.type = type;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getScreenshotUrl() {
        return screenshotUrl;
    }

    public void setScreenshotUrl(String screenshotUrl) {
        this.screenshotUrl = screenshotUrl;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public SupportRequestPriority getPriority() {
        return priority;
    }

    public void setPriority(SupportRequestPriority priority) {
        this.priority = priority;
    }

    public String getCurrentPage() {
        return currentPage;
    }

    public void setCurrentPage(String currentPage) {
        this.currentPage = currentPage;
    }

    public Long getPortalId() {
        return portalId;
    }

    public void setPortalId(Long portalId) {
        this.portalId = portalId;
    }
}