package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.ShowtimeSeatBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface ShowtimeSeatBookingRepository extends JpaRepository<ShowtimeSeatBooking, Long> {
    List<ShowtimeSeatBooking> findByShowtimeId(Long showtimeId);
    void deleteByShowtimeIdAndSeatKeyIn(Long showtimeId, List<String> seatKeys);
    void deleteByShowtimeId(Long showtimeId);
    void deleteByShowtimeIdIn(List<Long> showtimeIds);
}
