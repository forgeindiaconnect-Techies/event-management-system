package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.MovieBookedTicket;
import com.fic.event_management_system.entity.TheaterInvitation;

public interface TheaterEmailService {

    void sendTheaterInvitationEmail(TheaterInvitation invitation, String link);

    void sendTicketConfirmationEmail(MovieBookedTicket ticket, String customerEmail, String theaterName, Long portalId);

    void sendManualSuperAdminEmail(String recipient, String subject, String body, String type, String theaterName, Long portalId);
}
