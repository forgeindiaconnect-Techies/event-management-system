package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.AbstractFormField;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AbstractFormFieldRepository extends JpaRepository<AbstractFormField, Long> {
    List<AbstractFormField> findByEventIdOrderByDisplayOrderAsc(Long eventId);
}