package com.fic.event_management_system.dto;

public class EventDashboardResponse {

    private Long eventId;
    private String eventName;
    private Long participants;
    private Long audience;
    private Long totalRegistrations;
    private Integer availableSeats;
    private Integer capacity;
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
	public Long getParticipants() {
		return participants;
	}
	public void setParticipants(Long participants) {
		this.participants = participants;
	}
	public Long getAudience() {
		return audience;
	}
	public void setAudience(Long audience) {
		this.audience = audience;
	}
	public Long getTotalRegistrations() {
		return totalRegistrations;
	}
	public void setTotalRegistrations(Long totalRegistrations) {
		this.totalRegistrations = totalRegistrations;
	}
	public Integer getAvailableSeats() {
		return availableSeats;
	}
	public void setAvailableSeats(Integer availableSeats) {
		this.availableSeats = availableSeats;
	}
	public Integer getCapacity() {
		return capacity;
	}
	public void setCapacity(Integer capacity) {
		this.capacity = capacity;
	}

    
    
}
