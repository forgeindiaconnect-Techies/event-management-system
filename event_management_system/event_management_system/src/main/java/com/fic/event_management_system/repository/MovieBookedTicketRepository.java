package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.MovieBookedTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovieBookedTicketRepository extends JpaRepository<MovieBookedTicket, Long> {
    List<MovieBookedTicket> findAllByOrderByCreatedAtDesc();
}
