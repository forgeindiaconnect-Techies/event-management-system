package com.fic.event_management_system.controller;

import com.fic.event_management_system.entity.ExhibitorBooth;
import com.fic.event_management_system.service.ExhibitorBoothService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exhibitor-booths")
public class ExhibitorBoothController {

    private final ExhibitorBoothService boothService;

    public ExhibitorBoothController(ExhibitorBoothService boothService) {
        this.boothService = boothService;
    }

    @PostMapping
    public ExhibitorBooth createBooth(@RequestBody ExhibitorBooth booth) {
        return boothService.createBooth(booth);
    }

    @PutMapping("/{boothId}")
    public ExhibitorBooth updateBooth(
            @PathVariable Long boothId,
            @RequestBody ExhibitorBooth booth) {

        return boothService.updateBooth(boothId, booth);
    }

    @GetMapping("/{boothId}")
    public ExhibitorBooth getBoothById(@PathVariable Long boothId) {
        return boothService.getBoothById(boothId);
    }

    @GetMapping("/event/{eventId}")
    public List<ExhibitorBooth> getBoothsByEvent(@PathVariable Long eventId) {
        return boothService.getBoothsByEvent(eventId);
    }

    @DeleteMapping("/{boothId}")
    public String deleteBooth(@PathVariable Long boothId) {
        boothService.deleteBooth(boothId);
        return "Booth deleted successfully";
    }
}
