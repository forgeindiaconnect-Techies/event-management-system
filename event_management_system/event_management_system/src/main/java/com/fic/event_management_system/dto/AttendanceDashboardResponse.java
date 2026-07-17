package com.fic.event_management_system.dto;

public class AttendanceDashboardResponse {

    private Long eventId;
    private String eventName;

    private Long totalRegistrations;
    private Long checkedIn;
    private Long notCheckedIn;

    private Long participantsCheckedIn;
    private Long audienceCheckedIn;
	public Long getEventId() {
		return eventId;
	}
	public void setEventId(Long eventId) {
		this.eventId = eventId;
	}
	public String getEventName() {
		return eventName;
	}
	public void setEventName(String eventName) {
		this.eventName = eventName;
	}
	public Long getTotalRegistrations() {
		return totalRegistrations;
	}
	public void setTotalRegistrations(Long totalRegistrations) {
		this.totalRegistrations = totalRegistrations;
	}
	public Long getCheckedIn() {
		return checkedIn;
	}
	public void setCheckedIn(Long checkedIn) {
		this.checkedIn = checkedIn;
	}
	public Long getNotCheckedIn() {
		return notCheckedIn;
	}
	public void setNotCheckedIn(Long notCheckedIn) {
		this.notCheckedIn = notCheckedIn;
	}
	public Long getParticipantsCheckedIn() {
		return participantsCheckedIn;
	}
	public void setParticipantsCheckedIn(Long participantsCheckedIn) {
		this.participantsCheckedIn = participantsCheckedIn;
	}
	public Long getAudienceCheckedIn() {
		return audienceCheckedIn;
	}
	public void setAudienceCheckedIn(Long audienceCheckedIn) {
		this.audienceCheckedIn = audienceCheckedIn;
	}

    
    
}
