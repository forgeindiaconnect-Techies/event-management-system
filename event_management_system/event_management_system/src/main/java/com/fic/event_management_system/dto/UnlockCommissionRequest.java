package com.fic.event_management_system.dto;

public class UnlockCommissionRequest {
    private Double commissionPercentage;
    private String noteTitle;
    private String noteMessage;
    private Boolean sendInApp = true;
    private Boolean sendEmail = true;

    public Double getCommissionPercentage() {
        return commissionPercentage;
    }

    public void setCommissionPercentage(Double commissionPercentage) {
        this.commissionPercentage = commissionPercentage;
    }

    public String getNoteTitle() {
        return noteTitle;
    }

    public void setNoteTitle(String noteTitle) {
        this.noteTitle = noteTitle;
    }

    public String getNoteMessage() {
        return noteMessage;
    }

    public void setNoteMessage(String noteMessage) {
        this.noteMessage = noteMessage;
    }

    public Boolean getSendInApp() {
        return sendInApp;
    }

    public void setSendInApp(Boolean sendInApp) {
        this.sendInApp = sendInApp;
    }

    public Boolean getSendEmail() {
        return sendEmail;
    }

    public void setSendEmail(Boolean sendEmail) {
        this.sendEmail = sendEmail;
    }
}
