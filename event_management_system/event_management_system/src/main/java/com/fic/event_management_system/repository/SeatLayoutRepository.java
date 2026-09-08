package com.fic.event_management_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.fic.event_management_system.entity.SeatLayout;
import java.util.List;

@Repository
public interface SeatLayoutRepository extends JpaRepository<SeatLayout, Long> {
    List<SeatLayout> findByScreenId(Long screenId);
    void deleteByScreenId(Long screenId);
}
