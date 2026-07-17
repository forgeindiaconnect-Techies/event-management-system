package com.fic.event_management_system.entity;

import com.fic.event_management_system.enums.PaymentStatus;
import com.fic.event_management_system.enums.RegistrationStatus;
import com.fic.event_management_system.enums.RegistrationType;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "registrations")
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime registrationDate;

    private String paymentMethod;

    private String transactionReference;

    private LocalDateTime paymentDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RegistrationStatus status = RegistrationStatus.REGISTERED;

    private Boolean attended = false;

    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne
    @JoinColumn(name = "public_participant_id", nullable = false)
    private PublicParticipant participant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RegistrationType registrationType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24, columnDefinition = "varchar(24)")
    private PaymentStatus paymentStatus;

    @ManyToOne
    @JoinColumn(name = "ticket_class_id")
    private TicketClass ticketClass;

    private Integer ticketQuantity = 1;

    private String qrGenerationMode = "PER_TICKET";

    private BigDecimal totalAmount = BigDecimal.ZERO;

    @PrePersist
    public void onCreate() {
        registrationDate = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public LocalDateTime getRegistrationDate() { return registrationDate; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getTransactionReference() { return transactionReference; }
    public LocalDateTime getPaymentDate() { return paymentDate; }
    public RegistrationStatus getStatus() { return status; }
    public Boolean getAttended() { return attended; }
    public Event getEvent() { return event; }
    public PublicParticipant getParticipant() { return participant; }
    public RegistrationType getRegistrationType() { return registrationType; }
    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public TicketClass getTicketClass() { return ticketClass; }
    public Integer getTicketQuantity() { return ticketQuantity; }
    public String getQrGenerationMode() { return qrGenerationMode; }
    public BigDecimal getTotalAmount() { return totalAmount; }

    public void setId(Long id) { this.id = id; }
    public void setRegistrationDate(LocalDateTime registrationDate) { this.registrationDate = registrationDate; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }
    public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }
    public void setStatus(RegistrationStatus status) { this.status = status; }
    public void setAttended(Boolean attended) { this.attended = attended; }
    public void setEvent(Event event) { this.event = event; }
    public void setParticipant(PublicParticipant participant) { this.participant = participant; }
    public void setRegistrationType(RegistrationType registrationType) { this.registrationType = registrationType; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }
    public void setTicketClass(TicketClass ticketClass) { this.ticketClass = ticketClass; }
    public void setTicketQuantity(Integer ticketQuantity) { this.ticketQuantity = ticketQuantity; }
    public void setQrGenerationMode(String qrGenerationMode) { this.qrGenerationMode = qrGenerationMode; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
}
