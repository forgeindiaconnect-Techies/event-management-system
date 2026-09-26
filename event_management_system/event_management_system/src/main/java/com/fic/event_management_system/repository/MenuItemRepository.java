package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByTheaterId(Long theaterId);
    List<MenuItem> findByTheaterIdAndIsAvailableTrue(Long theaterId);
}
