package com.fic.event_management_system.entity;

import com.fic.event_management_system.enums.TicketStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String ticketNumber;

    private String qrCode;

    private LocalDateTime issueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketStatus status = TicketStatus.ACTIVE;

    @ManyToOne
    @JoinColumn(name = "registration_id", nullable = false)
    private Registration registration;

    @ManyToOne
    @JoinColumn(name = "ticket_class_id")
    private TicketClass ticketClass;

    private Integer quantity = 1;

    private Integer checkedInQuantity = 0;

    private String qrMode = "PER_TICKET";

    @PrePersist
    public void onCreate() {
        issueDate = LocalDateTime.now();
    }

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getTicketNumber() {
		return ticketNumber;
	}

	public void setTicketNumber(String ticketNumber) {
		this.ticketNumber = ticketNumber;
	}

	public String getQrCode() {
		return qrCode;
	}

	public void setQrCode(String qrCode) {
		this.qrCode = qrCode;
	}

	public LocalDateTime getIssueDate() {
		return issueDate;
	}

	public void setIssueDate(LocalDateTime issueDate) {
		this.issueDate = issueDate;
	}

	public TicketStatus getStatus() {
		return status;
	}

	public void setStatus(TicketStatus status) {
		this.status = status;
	}

	public Registration getRegistration() {
		return registration;
	}

	public void setRegistration(Registration registration) {
		this.registration = registration;
	}

	public TicketClass getTicketClass() {
		return ticketClass;
	}

	public void setTicketClass(TicketClass ticketClass) {
		this.ticketClass = ticketClass;
	}

	public Integer getQuantity() {
		return quantity;
	}

	public void setQuantity(Integer quantity) {
		this.quantity = quantity;
	}

	public Integer getCheckedInQuantity() {
		return checkedInQuantity;
	}

	public void setCheckedInQuantity(Integer checkedInQuantity) {
		this.checkedInQuantity = checkedInQuantity;
	}

	public String getQrMode() {
		return qrMode;
	}

	public void setQrMode(String qrMode) {
		this.qrMode = qrMode;
	}

    
}
