package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.TheaterInvitation;

public interface TheaterEmailService {

    void sendTheaterInvitationEmail(TheaterInvitation invitation, String link);
}
