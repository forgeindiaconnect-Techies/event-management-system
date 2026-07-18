package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.*;
import com.fic.event_management_system.enums.*;
import com.fic.event_management_system.repository.*;
import com.fic.event_management_system.service.PortalRevenueService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class PortalRevenueServiceImpl implements PortalRevenueService {
    private final PortalPayoutAccountRepository payoutRepository;
    private final PortalRevenueTransactionRepository revenueRepository;
    @Value("${portal.revenue.platform-fee-percent:0}") private BigDecimal platformFeePercent;
    public PortalRevenueServiceImpl(PortalPayoutAccountRepository payoutRepository, PortalRevenueTransactionRepository revenueRepository){this.payoutRepository=payoutRepository;this.revenueRepository=revenueRepository;}

    @Override
    public void assertPortalCanReceivePayment(Registration registration){
        if(registration==null||registration.getEvent()==null||registration.getEvent().getPortal()==null) throw new RuntimeException("Registration event is not linked to a portal");
        if(!Boolean.TRUE.equals(registration.getEvent().getPaid())) return;
        PortalPayoutAccount account=payoutRepository.findByPortalId(registration.getEvent().getPortal().getId()).orElseThrow(()->new RuntimeException("This event portal has not connected a payout account"));
        if(account.getVerificationStatus()!=PayoutVerificationStatus.VERIFIED||account.getPayoutStatus()!=PayoutStatus.ACTIVE) throw new RuntimeException("This event portal payout account is not verified yet");
    }

    @Override @Transactional
    public void recordPaidRegistration(Registration registration){
        if(!Boolean.TRUE.equals(registration.getEvent().getPaid())) return;
        assertPortalCanReceivePayment(registration);
        Portal portal=registration.getEvent().getPortal();
        PortalPayoutAccount account=payoutRepository.findByPortalId(portal.getId()).orElseThrow(()->new RuntimeException("Payout account not found"));
        BigDecimal gross=registration.getTotalAmount()==null?BigDecimal.ZERO:registration.getTotalAmount().setScale(2,RoundingMode.HALF_UP);
        BigDecimal fee=gross.multiply(platformFeePercent).divide(new BigDecimal("100"),2,RoundingMode.HALF_UP);
        PortalRevenueTransaction transaction=revenueRepository.findByRegistrationId(registration.getId()).orElseGet(PortalRevenueTransaction::new);
        transaction.setRegistration(registration);transaction.setEvent(registration.getEvent());transaction.setPortal(portal);transaction.setPayoutAccount(account);
        transaction.setGrossAmount(gross);transaction.setPlatformFee(fee);transaction.setPortalAmount(gross.subtract(fee));transaction.setPaymentStatus(PaymentStatus.PAID);
        transaction.setPayoutStatus(account.getGatewayProvider()==GatewayProvider.DEVELOPMENT?RevenuePayoutStatus.SIMULATED:RevenuePayoutStatus.PENDING);
        transaction.setPaymentReference(registration.getTransactionReference());transaction.setPaidAt(registration.getPaymentDate());revenueRepository.save(transaction);
    }

    @Override @Transactional
    public void reverseRegistrationPayment(Registration registration){
        revenueRepository.findByRegistrationId(registration.getId()).ifPresent(transaction->{transaction.setPaymentStatus(registration.getPaymentStatus());transaction.setPayoutStatus(RevenuePayoutStatus.REVERSED);revenueRepository.save(transaction);});
    }
}
