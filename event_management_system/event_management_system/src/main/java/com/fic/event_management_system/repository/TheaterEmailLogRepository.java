package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.TheaterEmailLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TheaterEmailLogRepository extends JpaRepository<TheaterEmailLog, Long> {

    long countByStatus(String status);

    List<TheaterEmailLog> findAllByOrderByCreatedAtDesc();

    List<TheaterEmailLog> findTop100ByOrderByCreatedAtDesc();
}
