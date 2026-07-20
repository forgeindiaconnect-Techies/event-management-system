package com.fic.event_management_system.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fic.event_management_system.enums.OperationsEnums.*;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name="event_vendors")
public class EventVendor {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @JsonIgnore @ManyToOne(optional=false) @JoinColumn(name="event_id") private Event event;
    @Column(nullable=false) private String companyName; private String contactPerson; private String email; private String phone; private String serviceCategory;
    @Enumerated(EnumType.STRING) private VendorStatus status=VendorStatus.PENDING;
    @Column(precision=14,scale=2) private BigDecimal contractAmount=BigDecimal.ZERO;
    @Column(precision=14,scale=2) private BigDecimal advancePaid=BigDecimal.ZERO;
    private LocalDateTime deliveryDeadline; @Enumerated(EnumType.STRING) private DeliveryStatus deliveryStatus=DeliveryStatus.NOT_SCHEDULED;
    @Enumerated(EnumType.STRING) private PaymentStatus paymentStatus=PaymentStatus.NOT_STARTED; @Column(length=3000) private String notes;
    private LocalDateTime createdAt; private LocalDateTime updatedAt;
    @PrePersist void create(){createdAt=LocalDateTime.now();updatedAt=createdAt;} @PreUpdate void update(){updatedAt=LocalDateTime.now();}
    public Long getId(){return id;} public void setId(Long v){id=v;} public Event getEvent(){return event;} public void setEvent(Event v){event=v;}
    public String getCompanyName(){return companyName;} public void setCompanyName(String v){companyName=v;} public String getContactPerson(){return contactPerson;} public void setContactPerson(String v){contactPerson=v;}
    public String getEmail(){return email;} public void setEmail(String v){email=v;} public String getPhone(){return phone;} public void setPhone(String v){phone=v;} public String getServiceCategory(){return serviceCategory;} public void setServiceCategory(String v){serviceCategory=v;}
    public VendorStatus getStatus(){return status;} public void setStatus(VendorStatus v){status=v;} public BigDecimal getContractAmount(){return contractAmount;} public void setContractAmount(BigDecimal v){contractAmount=v;}
    public BigDecimal getAdvancePaid(){return advancePaid;} public void setAdvancePaid(BigDecimal v){advancePaid=v;} public BigDecimal getBalanceAmount(){return nz(contractAmount).subtract(nz(advancePaid));}
    public LocalDateTime getDeliveryDeadline(){return deliveryDeadline;} public void setDeliveryDeadline(LocalDateTime v){deliveryDeadline=v;} public DeliveryStatus getDeliveryStatus(){return deliveryStatus;} public void setDeliveryStatus(DeliveryStatus v){deliveryStatus=v;}
    public PaymentStatus getPaymentStatus(){return paymentStatus;} public void setPaymentStatus(PaymentStatus v){paymentStatus=v;} public String getNotes(){return notes;} public void setNotes(String v){notes=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;} private BigDecimal nz(BigDecimal v){return v==null?BigDecimal.ZERO:v;}
}
