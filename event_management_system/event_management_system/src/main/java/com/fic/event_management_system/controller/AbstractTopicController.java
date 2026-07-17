package com.fic.event_management_system.controller;

import com.fic.event_management_system.entity.AbstractTopic;
import com.fic.event_management_system.service.AbstractTopicService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/abstract-topics")
public class AbstractTopicController {

    private final AbstractTopicService abstractTopicService;

    public AbstractTopicController(AbstractTopicService abstractTopicService) {
        this.abstractTopicService = abstractTopicService;
    }

    @GetMapping("/event/{eventId}")
    public List<AbstractTopic> getTopicsByEvent(@PathVariable Long eventId) {
        return abstractTopicService.getTopicsByEvent(eventId);
    }

    @PostMapping
    public AbstractTopic createTopic(@RequestBody AbstractTopic topic) {
        return abstractTopicService.createTopic(topic);
    }

    @PutMapping("/{id}")
    public AbstractTopic updateTopic(
            @PathVariable Long id,
            @RequestBody AbstractTopic topic) {

        return abstractTopicService.updateTopic(id, topic);
    }

    @DeleteMapping("/{id}")
    public String deleteTopic(@PathVariable Long id) {
        abstractTopicService.deleteTopic(id);
        return "Abstract topic deleted successfully";
    }
}