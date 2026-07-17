package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.AbstractTopic;
import java.util.List;

public interface AbstractTopicService {
    AbstractTopic createTopic(AbstractTopic topic);

    AbstractTopic updateTopic(Long id, AbstractTopic topic);

    List<AbstractTopic> getTopicsByEvent(Long eventId);

    void deleteTopic(Long id);
}