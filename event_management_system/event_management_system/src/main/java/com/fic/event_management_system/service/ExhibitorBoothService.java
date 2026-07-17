package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.ExhibitorBooth;

import java.util.List;

public interface ExhibitorBoothService {

    ExhibitorBooth createBooth(ExhibitorBooth booth);

    ExhibitorBooth updateBooth(Long boothId, ExhibitorBooth booth);

    List<ExhibitorBooth> getBoothsByEvent(Long eventId);

    ExhibitorBooth getBoothById(Long boothId);

    void deleteBooth(Long boothId);
}
