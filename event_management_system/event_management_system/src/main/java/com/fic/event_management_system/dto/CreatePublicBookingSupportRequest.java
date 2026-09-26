package com.fic.event_management_system.dto;

public class CreatePublicBookingSupportRequest {
    private String bookingType; // MOVIE, EVENT
    private String bookingReference;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String titleOrVenueName;
    private String category;
    private String priority;
    private String subject;
    private String description;

    public String getBookingType() { return bookingType; }
    public void setBookingType(String bookingType) { this.bookingType = bookingType; }

    public String getBookingReference() { return bookingReference; }
    public void setBookingReference(String bookingReference) { this.bookingReference = bookingReference; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getTitleOrVenueName() { return titleOrVenueName; }
    public void setTitleOrVenueName(String titleOrVenueName) { this.titleOrVenueName = titleOrVenueName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
