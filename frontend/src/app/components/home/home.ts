import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HomeCollection, WatchProgress } from '../../models/home';
import { Movie } from '../../models/movie';
import { apiUrl } from '../../config/runtime-config';
import { ApiService } from '../../services/api';
import { FooterComponent } from '../footer/footer';
import { NavbarComponent } from '../navbar/navbar';

interface BrowseRow {
  id: string;
  title: string;
  description: string;
  variant: 'standard' | 'trending' | 'new-releases';
  displayStyle: 'poster' | 'landscape';
  layout: 'grid' | 'horizontal';
  movies: Movie[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
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
  catalog: Movie[] = [];
  filteredMovies: Movie[] = [];
  collections: HomeCollection[] = [];
  visibleRows: BrowseRow[] = [];
  continueWatching: WatchProgress[] = [];
  featuredMovie: Movie | null = null;
  searchQuery = '';
  isLoading = true;
  error: string | null = null;
  feedbackMessage: string | null = null;
  feedbackTone: 'success' | 'error' = 'success';
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly watchlistUrl = apiUrl('watchlist/');
  private defaultFeaturedMovie: Movie | null = null;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadHomePage();
  }

  playMovie(movieId: number) {
    this.router.navigate(['/watch', movieId]);
  }

  onSearchChange(query: string) {
    this.searchQuery = query;
    this.applyBrowseState();
  }

  loadHomePage() {
    this.apiService.getHomePage().subscribe({
      next: (data) => {
        this.catalog = data.catalog ?? [];
        this.collections = data.collections ?? [];
        this.continueWatching = data.continue_watching ?? [];
        this.defaultFeaturedMovie = data.featured ?? this.catalog[0] ?? null;
        this.error = null;
        this.applyBrowseState();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.error = `Unable to load the home catalog. ${err.status ? `Error ${err.status}.` : ''}`.trim();
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  addToWatchlist(movieId: number, event?: Event) {
    event?.stopPropagation();

    this.http.post(this.watchlistUrl, { movie: movieId }).subscribe({
      next: () => {
        this.showFeedback('Added to My List.', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.showFeedback(err.error?.error ?? 'Could not add this title right now.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  trackByMovieId(_: number, movie: Movie) {
    return movie.id;
  }

  trackByProgressId(_: number, progress: WatchProgress) {
    return progress.id;
  }

  getReleaseYear(movie: Movie) {
    return movie.release_date?.slice(0, 4) || 'New';
  }

  getGenreSummary(movie: Movie) {
    const genreNames = movie.genres?.map((genre) => genre.name).filter(Boolean) ?? [];
    return genreNames.length ? genreNames.slice(0, 2).join(' / ') : 'Featured title';
  }

  getDurationLabel(movie: Movie) {
    if (movie.runtime_label) {
      return movie.runtime_label;
    }

    const duration = movie.duration_minutes ?? 0;
    if (!duration) {
      return 'New';
    }

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    if (hours && minutes) {
      return `${hours}h ${minutes}m`;
    }

    if (hours) {
      return `${hours}h`;
    }

    return `${minutes}m`;
  }

  getHeroBackground(movie: Movie | null) {
    if (!movie) {
      return this.placeholderPoster;
    }

    return movie.backdrop || movie.thumbnail || this.placeholderPoster;
  }

  getProgressWidth(progress: WatchProgress) {
    return `${progress.progress_percent || 0}%`;
  }

  private applyBrowseState() {
    const query = this.searchQuery.trim().toLowerCase();
    const filtered = this.catalog.filter((movie) => {
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

    this.filteredMovies = filtered;
    this.featuredMovie = filtered[0] ?? this.defaultFeaturedMovie;

    if (!query) {
      this.visibleRows = this.collections.map((collection) => {
        const variant = this.getCollectionVariant(collection);

        return {
          id: collection.slug,
          title: collection.title,
          description: collection.description,
          variant,
          displayStyle: collection.display_style,
          layout: variant === 'trending' ? 'horizontal' : 'grid',
          movies: collection.items
            .slice()
            .sort((left, right) => left.position - right.position)
            .map((item) => item.movie)
            .slice(0, variant === 'trending' ? 10 : undefined),
        };
      });
      return;
    }

    this.visibleRows = filtered.length
      ? [
          {
            id: 'search-results',
            title: 'Search Results',
            description: `${filtered.length} title${filtered.length === 1 ? '' : 's'} matched your search.`,
            variant: 'standard',
            displayStyle: 'poster',
            layout: 'grid',
            movies: filtered,
          },
        ]
      : [];
  }

  private getCollectionVariant(
    collection: Pick<HomeCollection, 'slug' | 'title'>,
  ): BrowseRow['variant'] {
    const slug = collection.slug?.trim().toLowerCase() ?? '';
    const title = collection.title?.trim().toLowerCase() ?? '';

    if (slug.includes('trending') || title.includes('trending')) {
      return 'trending';
    }

    if (slug.includes('new-release') || title.includes('new release')) {
      return 'new-releases';
    }

    return 'standard';
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
}
