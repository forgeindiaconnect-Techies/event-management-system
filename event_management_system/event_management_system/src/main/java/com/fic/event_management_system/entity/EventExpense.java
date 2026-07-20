package com.fic.event_management_system.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fic.event_management_system.enums.OperationsEnums.ApprovalStatus;
import com.fic.event_management_system.enums.OperationsEnums.PaymentStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "event_expenses")
public class EventExpense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id")
    private EventVendor vendor;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "amount_paid", nullable = false, precision = 15, scale = 2)
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Column(nullable = false, length = 10)
    private String currency = "INR";

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 30)
    private PaymentStatus paymentStatus = PaymentStatus.NOT_STARTED;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 30)
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "invoice_number", length = 100)
    private String invoiceNumber;

    @Column(name = "receipt_url", length = 1000)
    private String receiptUrl;

    @Column(name = "entered_by_user_id")
    private Long enteredByUserId;

    @Column(name = "entered_by_user_name", length = 150)
    private String enteredByUserName;

    @Column(name = "approved_by_user_id")
    private Long approvedByUserId;

    @Column(name = "approved_by_user_name", length = 150)
    private String approvedByUserName;

    @Column(length = 1000)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        normalizeValues();
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        normalizeValues();
        updatedAt = LocalDateTime.now();
    }

    private void normalizeValues() {
        title = clean(title);
        category = clean(category);

        subtotal = nonNegative(subtotal);
        taxAmount = nonNegative(taxAmount);
        amountPaid = nonNegative(amountPaid);

        totalAmount = subtotal.add(taxAmount);

        if (amountPaid.compareTo(totalAmount) > 0) {
            amountPaid = totalAmount;
        }

        if (currency == null || currency.isBlank()) {
            currency = "INR";
        } else {
            currency = currency.trim().toUpperCase();
        }

        if (paymentStatus == null) {
            paymentStatus = PaymentStatus.NOT_STARTED;
        }

        if (approvalStatus == null) {
            approvalStatus = ApprovalStatus.PENDING;
        }
    }

    private BigDecimal nonNegative(BigDecimal value) {
        if (value == null || value.signum() < 0) {
            return BigDecimal.ZERO;
        }
        return value;
    }

    private String clean(String value) {
        return value == null ? null : value.trim();
    }

    @Transient
    public BigDecimal getBalanceAmount() {
        return totalAmount.subtract(amountPaid);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Event getEvent() {
        return event;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

    public EventVendor getVendor() {
        return vendor;
    }

    public void setVendor(EventVendor vendor) {
        this.vendor = vendor;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getAmountPaid() {
        return amountPaid;
    }

    public void setAmountPaid(BigDecimal amountPaid) {
        this.amountPaid = amountPaid;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public ApprovalStatus getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(ApprovalStatus approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public String getReceiptUrl() {
        return receiptUrl;
    }

    public void setReceiptUrl(String receiptUrl) {
        this.receiptUrl = receiptUrl;
    }

    public Long getEnteredByUserId() {
        return enteredByUserId;
    }

    public void setEnteredByUserId(Long enteredByUserId) {
        this.enteredByUserId = enteredByUserId;
    }

    public String getEnteredByUserName() {
        return enteredByUserName;
    }

    public void setEnteredByUserName(String enteredByUserName) {
        this.enteredByUserName = enteredByUserName;
    }

    public Long getApprovedByUserId() {
        return approvedByUserId;
    }

    public void setApprovedByUserId(Long approvedByUserId) {
        this.approvedByUserId = approvedByUserId;
    }

    public String getApprovedByUserName() {
        return approvedByUserName;
    }

    public void setApprovedByUserName(String approvedByUserName) {
        this.approvedByUserName = approvedByUserName;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
