package com.fic.event_management_system.dto;

public class EventRatingSummaryResponse {

    private Long eventId;
    private String eventName;
    private Long totalFeedbacks;
    private Double averageRating;
    private Long fiveStar;
    private Long fourStar;
    private Long threeStar;
    private Long twoStar;
    private Long oneStar;
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
	public Long getTotalFeedbacks() {
		return totalFeedbacks;
	}
	public void setTotalFeedbacks(Long totalFeedbacks) {
		this.totalFeedbacks = totalFeedbacks;
	}
	public Double getAverageRating() {
		return averageRating;
	}
	public void setAverageRating(Double averageRating) {
		this.averageRating = averageRating;
	}
	public Long getFiveStar() {
		return fiveStar;
	}
	public void setFiveStar(Long fiveStar) {
		this.fiveStar = fiveStar;
	}
	public Long getFourStar() {
		return fourStar;
	}
	public void setFourStar(Long fourStar) {
		this.fourStar = fourStar;
	}
	public Long getThreeStar() {
		return threeStar;
	}
	public void setThreeStar(Long threeStar) {
		this.threeStar = threeStar;
	}
	public Long getTwoStar() {
		return twoStar;
	}
	public void setTwoStar(Long twoStar) {
		this.twoStar = twoStar;
	}
	public Long getOneStar() {
		return oneStar;
	}
	public void setOneStar(Long oneStar) {
		this.oneStar = oneStar;
	}

    
}