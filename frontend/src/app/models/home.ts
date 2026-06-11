import { Movie } from './movie';

export interface HomeCollectionItem {
  position: number;
  movie: Movie;
}

export interface HomeCollection {
  id: number;
  title: string;
  slug: string;
  description: string;
  display_style: 'poster' | 'landscape';
  display_order: number;
  items: HomeCollectionItem[];
}

export interface WatchProgress {
  id: number;
  movie: Movie;
  progress_seconds: number;
  duration_seconds: number;
  episode_label: string;
  progress_percent: number;
  updated_at: string;
}

export interface HomePageResponse {
  featured: Movie | null;
  catalog: Movie[];
  collections: HomeCollection[];
  continue_watching: WatchProgress[];
}
