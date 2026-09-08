package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.Movie;
import com.fic.event_management_system.repository.MovieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MovieService {

    private final MovieRepository movieRepository;

    @Autowired
    public MovieService(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    public List<Movie> getAllMovies() {
        return movieRepository.findAll();
    }

    @SuppressWarnings("null")
    public Optional<Movie> getMovieById(Long id) {
        return movieRepository.findById(id);
    }

    @SuppressWarnings("null")
    public Movie createMovie(Movie movie) {
        return movieRepository.save(movie);
    }

    @SuppressWarnings("null")
    public Movie updateMovie(Long id, Movie movieDetails) {
        return movieRepository.findById(id).map(movie -> {
            movie.setTitle(movieDetails.getTitle());
            movie.setPosterUrl(movieDetails.getPosterUrl());
            movie.setTrailerUrl(movieDetails.getTrailerUrl());
            movie.setSynopsis(movieDetails.getSynopsis());
            movie.setGenre(movieDetails.getGenre());
            movie.setLanguage(movieDetails.getLanguage());
            movie.setCastAndCrew(movieDetails.getCastAndCrew());
            movie.setDurationMinutes(movieDetails.getDurationMinutes());
            movie.setCertification(movieDetails.getCertification());
            movie.setReleaseDate(movieDetails.getReleaseDate());
            return movieRepository.save(movie);
        }).orElseThrow(() -> new RuntimeException("Movie not found with id " + id));
    }

    @SuppressWarnings("null")
    public void deleteMovie(Long id) {
        movieRepository.deleteById(id);
    }
}
