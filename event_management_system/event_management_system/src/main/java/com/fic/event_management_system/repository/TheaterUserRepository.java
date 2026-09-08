package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.TheaterUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TheaterUserRepository extends JpaRepository<TheaterUser, Long> {
    Optional<TheaterUser> findByEmail(String email);
    Optional<TheaterUser> findByUsername(String username);
    Optional<TheaterUser> findByEmailOrUsername(String email, String username);
    java.util.List<TheaterUser> findByTheaterPortalId(Long theaterPortalId);
}
