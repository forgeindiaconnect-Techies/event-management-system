package com.fic.event_management_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.fic.event_management_system.entity.Showtime;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {
    List<Showtime> findByScreenId(Long screenId);
    List<Showtime> findByScreenIdAndShowDate(Long screenId, LocalDate showDate);
    List<Showtime> findByTheaterId(Long theaterId);
    List<Showtime> findByMovieId(Long movieId);
    List<Showtime> findByMovieTitle(String movieTitle);
}
