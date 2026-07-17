package com.fic.event_management_system.config;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.fic.event_management_system.service.EmailService;

@Component
public class EmailQueueScheduler {

    private final EmailService emailService;

    public EmailQueueScheduler(EmailService emailService) {
        this.emailService = emailService;
    }

    @Scheduled(fixedDelayString = "${notification.email.queue-delay-ms:30000}")
    public void processEmailQueue() {
        emailService.processPendingEmails();
    }
}
