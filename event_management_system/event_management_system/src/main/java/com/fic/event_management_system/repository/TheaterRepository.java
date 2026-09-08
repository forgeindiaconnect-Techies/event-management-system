package com.fic.event_management_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.fic.event_management_system.entity.Theater;
import java.util.List;
import java.util.Optional;

@Repository
public interface TheaterRepository extends JpaRepository<Theater, Long> {
    List<Theater> findByPortalId(Long portalId);
    List<Theater> findByTheaterPortalId(Long theaterPortalId);
    List<Theater> findByCityAndActiveTrue(String city);
    Optional<Theater> findByOwnerEmail(String ownerEmail);
}
