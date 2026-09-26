package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.PlatformRevenueConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlatformRevenueConfigRepository extends JpaRepository<PlatformRevenueConfig, Long> {
    Optional<PlatformRevenueConfig> findTopByOrderByIdAsc();
}
