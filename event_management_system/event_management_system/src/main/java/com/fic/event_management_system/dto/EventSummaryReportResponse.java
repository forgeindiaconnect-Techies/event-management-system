package com.fic.event_management_system.dto;

public class EventSummaryReportResponse {

    private String eventName;
    private long totalRegistrations;
    private long participants;
    private long audience;
    private long checkedIn;
    private long free;
    private long paid;
    private long pending;
    private long failed;
    private long certificatesIssued;
    
	public String getEventName() {
		return eventName;
	}
	public void setEventName(String eventName) {
		this.eventName = eventName;
	}
	public long getTotalRegistrations() {
		return totalRegistrations;
	}
	public void setTotalRegistrations(long totalRegistrations) {
		this.totalRegistrations = totalRegistrations;
	}
	public long getParticipants() {
		return participants;
	}
	public void setParticipants(long participants) {
		this.participants = participants;
	}
	public long getAudience() {
		return audience;
	}
	public void setAudience(long audience) {
		this.audience = audience;
	}
	public long getCheckedIn() {
		return checkedIn;
	}
	public void setCheckedIn(long checkedIn) {
		this.checkedIn = checkedIn;
	}
	public long getFree() {
		return free;
	}
	public void setFree(long free) {
		this.free = free;
	}
	public long getPaid() {
		return paid;
	}
	public void setPaid(long paid) {
		this.paid = paid;
	}
	public long getPending() {
		return pending;
	}
	public void setPending(long pending) {
		this.pending = pending;
	}
	public long getFailed() {
		return failed;
	}
	public void setFailed(long failed) {
		this.failed = failed;
	}
	public long getCertificatesIssued() {
		return certificatesIssued;
	}
	public void setCertificatesIssued(long certificatesIssued) {
		this.certificatesIssued = certificatesIssued;
	}
	
    
}