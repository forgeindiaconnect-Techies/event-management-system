package com.fic.event_management_system.dto;

public class LockCommissionRequest {
    private String noteTitle;
    private String noteMessage;
    private Boolean sendInApp = false;
    private Boolean sendEmail = false;

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
