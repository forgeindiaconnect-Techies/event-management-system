package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.DeletedTheaterPortal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeletedTheaterPortalRepository extends JpaRepository<DeletedTheaterPortal, Long> {
    List<DeletedTheaterPortal> findAllByOrderByDeletedAtDesc();
}
