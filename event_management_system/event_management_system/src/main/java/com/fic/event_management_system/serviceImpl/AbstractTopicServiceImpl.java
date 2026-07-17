package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.AbstractTopic;
import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.repository.AbstractTopicRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.AbstractTopicService;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AbstractTopicServiceImpl implements AbstractTopicService {

    private final AbstractTopicRepository repository;
    private final TenantSecurityService tenantSecurityService;

    public AbstractTopicServiceImpl(
            AbstractTopicRepository repository,
            TenantSecurityService tenantSecurityService) {

        this.repository = repository;
        this.tenantSecurityService = tenantSecurityService;
    }

    @Override
    public AbstractTopic createTopic(AbstractTopic topic) {
        if (topic.getEvent() == null || topic.getEvent().getId() == null) {
            throw new RuntimeException("Event is required for abstract topic");
        }

        Event event = tenantSecurityService.getEventFromLoggedInPortal(topic.getEvent().getId());
        topic.setEvent(event);

        return repository.save(topic);
    }

    @Override
    public AbstractTopic updateTopic(Long id, AbstractTopic topic) {
        AbstractTopic existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Abstract topic not found"));

        tenantSecurityService.requireEventInLoggedInPortal(existing.getEvent());

        existing.setTopicName(topic.getTopicName());
        existing.setSubmissionType(topic.getSubmissionType());
        existing.setDescription(topic.getDescription());
        existing.setStatus(topic.getStatus());

        if (topic.getEvent() != null && topic.getEvent().getId() != null) {
            Event event = tenantSecurityService.getEventFromLoggedInPortal(topic.getEvent().getId());
            existing.setEvent(event);
        }

        return repository.save(existing);
    }

    @Override
    public List<AbstractTopic> getTopicsByEvent(Long eventId) {
        tenantSecurityService.requireEventInLoggedInPortal(eventId);
        return repository.findByEventId(eventId);
    }

    @Override
    public void deleteTopic(Long id) {
        AbstractTopic existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Abstract topic not found"));

        tenantSecurityService.requireEventInLoggedInPortal(existing.getEvent());
        repository.delete(existing);
    }
}