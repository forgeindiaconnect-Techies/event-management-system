package com.fic.event_management_system.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fic.event_management_system.entity.PublicParticipant;

public interface PublicParticipantRepository
        extends JpaRepository<PublicParticipant, Long> {

    Optional<PublicParticipant> findByEmail(String email);

}