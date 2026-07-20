package com.fic.event_management_system.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.fic.event_management_system.entity.EventExpense;
import com.fic.event_management_system.enums.OperationsEnums.ApprovalStatus;
import com.fic.event_management_system.enums.OperationsEnums.PaymentStatus;

@Repository
public interface EventExpenseRepository
        extends JpaRepository<EventExpense, Long> {

    List<EventExpense> findByEventIdOrderByCreatedAtDesc(Long eventId);

    List<EventExpense> findByEventIdAndCategoryIgnoreCaseOrderByCreatedAtDesc(
            Long eventId,
            String category
    );

    List<EventExpense> findByEventIdAndPaymentStatusOrderByCreatedAtDesc(
            Long eventId,
            PaymentStatus paymentStatus
    );

    List<EventExpense> findByEventIdAndApprovalStatusOrderByCreatedAtDesc(
            Long eventId,
            ApprovalStatus approvalStatus
    );

    long countByEventId(Long eventId);

    @Query("""
        select coalesce(sum(e.totalAmount), 0)
        from EventExpense e
        where e.event.id = :eventId
          and e.approvalStatus = :approvalStatus
    """)
    BigDecimal sumTotalAmountByEventAndApprovalStatus(
            @Param("eventId") Long eventId,
            @Param("approvalStatus") ApprovalStatus approvalStatus
    );

    @Query("""
        select coalesce(sum(e.amountPaid), 0)
        from EventExpense e
        where e.event.id = :eventId
    """)
    BigDecimal sumAmountPaidByEventId(@Param("eventId") Long eventId);
}