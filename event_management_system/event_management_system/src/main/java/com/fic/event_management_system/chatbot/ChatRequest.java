package com.fic.event_management_system.chatbot;

public record ChatRequest(
        String message,
        String role,
        Long portalId,
        Long eventId
) {
}
