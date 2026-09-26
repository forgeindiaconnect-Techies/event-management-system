package com.fic.event_management_system.dto;

public class CreateTheaterSupportRequest {
    private Long theaterPortalId;
    private String theaterName;
    private String city;
    private Long requesterId;
    private String requesterName;
    private String dutyRole;
    private String contactEmail;
    private String contactPhone;
    private String category;
    private String priority;
    private String subject;
    private String description;
    private String screenshotUrl;

    public Long getTheaterPortalId() { return theaterPortalId; }
    public void setTheaterPortalId(Long theaterPortalId) { this.theaterPortalId = theaterPortalId; }

    public String getTheaterName() { return theaterName; }
    public void setTheaterName(String theaterName) { this.theaterName = theaterName; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public Long getRequesterId() { return requesterId; }
    public void setRequesterId(Long requesterId) { this.requesterId = requesterId; }

    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }

    public String getDutyRole() { return dutyRole; }
    public void setDutyRole(String dutyRole) { this.dutyRole = dutyRole; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getScreenshotUrl() { return screenshotUrl; }
    public void setScreenshotUrl(String screenshotUrl) { this.screenshotUrl = screenshotUrl; }
}
