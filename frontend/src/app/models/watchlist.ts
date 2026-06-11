import { Movie } from './movie';

export interface WatchlistItem {
  id: number;
  movie: number;
  movie_details: Movie;
  added_date: string;
}
