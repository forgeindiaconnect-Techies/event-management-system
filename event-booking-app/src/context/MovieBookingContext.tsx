import React, { createContext, useContext, useState } from 'react';
import { MovieItem, ShowtimeItem, BookedMovieTicket } from '../services/movieApi';

export interface MovieBookingState {
  selectedMovie: MovieItem | null;
  selectedShowtime: ShowtimeItem | null;
  selectedSeats: string[];
  seatPrices: Record<string, number>;
  totalSeatAmount: number;
  confirmedTicket: BookedMovieTicket | null;
  selectMovie: (movie: MovieItem) => void;
  selectShowtime: (showtime: ShowtimeItem) => void;
  toggleSeat: (seatKey: string, price: number) => void;
  clearBookingState: () => void;
  setConfirmedTicket: (ticket: BookedMovieTicket | null) => void;
}

const MovieBookingContext = createContext<MovieBookingState | undefined>(undefined);

export const MovieBookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedMovie, setSelectedMovie] = useState<MovieItem | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<ShowtimeItem | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [seatPrices, setSeatPrices] = useState<Record<string, number>>({});
  const [confirmedTicket, setConfirmedTicket] = useState<BookedMovieTicket | null>(null);

  const selectMovie = (movie: MovieItem) => {
    setSelectedMovie(movie);
  };

  const selectShowtime = (showtime: ShowtimeItem) => {
    setSelectedShowtime(showtime);
    setSelectedSeats([]);
    setSeatPrices({});
  };

  const toggleSeat = (seatKey: string, price: number) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatKey)) {
        const next = prev.filter((s) => s !== seatKey);
        setSeatPrices((prices) => {
          const updated = { ...prices };
          delete updated[seatKey];
          return updated;
        });
        return next;
      } else {
        if (prev.length >= 8) {
          return prev; // Max 8 seats limit per booking
        }
        setSeatPrices((prices) => ({ ...prices, [seatKey]: price }));
        return [...prev, seatKey];
      }
    });
  };

  const clearBookingState = () => {
    setSelectedSeats([]);
    setSeatPrices({});
  };

  const totalSeatAmount = selectedSeats.reduce(
    (sum, seat) => sum + (seatPrices[seat] || 200),
    0
  );

  return (
    <MovieBookingContext.Provider
      value={{
        selectedMovie,
        selectedShowtime,
        selectedSeats,
        seatPrices,
        totalSeatAmount,
        confirmedTicket,
        selectMovie,
        selectShowtime,
        toggleSeat,
        clearBookingState,
        setConfirmedTicket,
      }}
    >
      {children}
    </MovieBookingContext.Provider>
  );
};

export const useMovieBooking = () => {
  const context = useContext(MovieBookingContext);
  if (!context) {
    throw new Error('useMovieBooking must be used within a MovieBookingProvider');
  }
  return context;
};
