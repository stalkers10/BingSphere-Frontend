import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Movie } from '../../models/movie';
import { ApiService, PaginatedMovieResponse } from '../../services/api';
import { FooterComponent } from '../footer/footer';
import { NavbarComponent } from '../navbar/navbar';

@Component({
  selector: 'app-movie-list',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList implements OnInit {
  readonly placeholderPoster = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 960">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#321211" />
          <stop offset="100%" stop-color="#090303" />
        </linearGradient>
      </defs>
      <rect width="640" height="960" fill="url(#bg)" />
      <rect x="54" y="54" width="532" height="852" rx="24" fill="none" stroke="#ff6a61" stroke-opacity="0.32" />
      <text x="50%" y="46%" fill="#ffb4aa" font-family="Arial, sans-serif" font-size="54" text-anchor="middle">No Poster</text>
      <text x="50%" y="54%" fill="#ffffff" fill-opacity="0.72" font-family="Arial, sans-serif" font-size="30" text-anchor="middle">Bings Sphere</text>
    </svg>`,
  )}`;

  movies: Movie[] = [];
  filteredMovies: Movie[] = [];
  searchQuery = '';
  isLoading = true;
  error: string | null = null;
  feedbackMessage: string | null = null;
  feedbackTone: 'success' | 'error' = 'success';
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadMovies();
  }

  onSearchChange(query: string) {
    this.searchQuery = query;
    this.applyFilter();
  }

  playMovie(movieId: number, event?: Event) {
    event?.stopPropagation();
    this.router.navigate(['/watch', movieId]);
  }

  addToWatchlist(movieId: number, event?: Event) {
    event?.stopPropagation();

    this.apiService.addToWatchlist(movieId).subscribe({
      next: () => {
        this.showFeedback('Added to My List.', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.showFeedback(this.getWatchlistErrorMessage(err), 'error');
        this.cdr.detectChanges();
      }
    });
  }

  trackByMovieId(_: number, movie: Movie) {
    return movie.id;
  }

  getReleaseYear(movie: Movie) {
    return movie.release_date?.slice(0, 4) || 'New';
  }

  getGenreSummary(movie: Movie) {
    const genreNames = movie.genres?.map((genre) => genre.name).filter(Boolean) ?? [];
    return genreNames.length ? genreNames.join(' / ') : 'Featured title';
  }

  getUploadedLabel(movie: Movie) {
    if (!movie.created_at) {
      return 'Recently uploaded';
    }

    const uploadedAt = new Date(movie.created_at);
    return `Uploaded ${uploadedAt.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
  }

  private loadMovies() {
    this.apiService.getMovies().subscribe({
      next: (data) => {
        this.movies = this.extractMovies(data).sort((left, right) => {
          return (right.created_at ?? '').localeCompare(left.created_at ?? '');
        });
        this.error = null;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.error = `Unable to load the uploaded movies. ${err.status ? `Error ${err.status}.` : ''}`.trim();
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private extractMovies(data: Movie[] | PaginatedMovieResponse) {
    return Array.isArray(data) ? data : (data.results ?? []);
  }

  private applyFilter() {
    const query = this.searchQuery.trim().toLowerCase();

    this.filteredMovies = this.movies.filter((movie) => {
      if (!query) {
        return true;
      }

      const searchableText = [
        movie.title,
        movie.description,
        ...(movie.genres?.map((genre) => genre.name) ?? []),
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }

  private showFeedback(message: string, tone: 'success' | 'error') {
    this.feedbackMessage = message;
    this.feedbackTone = tone;

    if (this.feedbackTimer) {
      window.clearTimeout(this.feedbackTimer);
    }

    this.feedbackTimer = window.setTimeout(() => {
      this.feedbackMessage = null;
      this.feedbackTimer = null;
      this.cdr.detectChanges();
    }, 3000);
  }

  private getWatchlistErrorMessage(err: any) {
    const errorPayload = err?.error;

    if (typeof errorPayload === 'string') {
      return errorPayload;
    }

    return (
      errorPayload?.error ??
      errorPayload?.detail ??
      errorPayload?.non_field_errors?.[0] ??
      errorPayload?.movie?.[0] ??
      'Could not add this title right now.'
    );
  }
}
