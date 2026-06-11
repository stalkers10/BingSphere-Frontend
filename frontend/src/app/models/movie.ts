export interface Genre {
  id: number;
  name: string;
}

export interface Movie {
  id: number;
  title: string;
  description: string;
  release_date: string;
  thumbnail: string | null;
  backdrop?: string | null;
  genres?: Genre[];
  video_url: string;
  content_type?: 'movie' | 'series';
  duration_minutes?: number;
  maturity_rating?: string;
  is_featured?: boolean;
  featured_rank?: number;
  runtime_label?: string;
  created_at?: string;
}
