package com.fic.event_management_system.config;

import com.fic.event_management_system.service.SubscriptionService;
import com.fic.event_management_system.service.SubscriptionPaymentService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class SubscriptionExpiryScheduler {

    private final SubscriptionService subscriptionService;
    private final SubscriptionPaymentService subscriptionPaymentService;

    public SubscriptionExpiryScheduler(
            SubscriptionService subscriptionService,
            SubscriptionPaymentService subscriptionPaymentService
    ) {
        this.subscriptionService = subscriptionService;
        this.subscriptionPaymentService = subscriptionPaymentService;
    }

    // Runs once every hour.
    @Scheduled(cron = "0 0 * * * *")
    public void expireSubscriptions() {
        subscriptionService.expireEndedSubscriptions();
        subscriptionService.sendExpiryWarnings();
    }

    // Development payment orders are checked every five minutes.
    @Scheduled(cron = "0 */5 * * * *")
    public void expirePendingPayments() {
        subscriptionPaymentService.expirePendingPayments();
    }
}
