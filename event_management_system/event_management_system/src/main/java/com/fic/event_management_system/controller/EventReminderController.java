package com.fic.event_management_system.controller;

import com.fic.event_management_system.service.EventReminderService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reminders")
public class EventReminderController {

    private final EventReminderService eventReminderService;

    public EventReminderController(EventReminderService eventReminderService) {
        this.eventReminderService = eventReminderService;
    }

    @PostMapping("/send")
    public String sendRemindersManually() {
        eventReminderService.sendEventReminders();
        return "Reminder emails sent successfully";
    }
}
