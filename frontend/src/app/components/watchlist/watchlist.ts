import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WatchlistItem } from '../../models/watchlist';
import { ApiService } from '../../services/api';
import { FooterComponent } from '../footer/footer';
import { NavbarComponent } from '../navbar/navbar';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './watchlist.html',
  styleUrl: './watchlist.scss',
})
export class Watchlist implements OnInit {
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

  items: WatchlistItem[] = [];
  filteredItems: WatchlistItem[] = [];
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
    this.loadWatchlist();
  }

  onSearchChange(query: string) {
    this.searchQuery = query;
    this.applyFilter();
  }

  playMovie(movieId: number) {
    this.router.navigate(['/watch', movieId]);
  }

  removeItem(item: WatchlistItem, event: Event) {
    event.stopPropagation();

    this.apiService.removeFromWatchlist(item.id).subscribe({
      next: () => {
        this.items = this.items.filter((currentItem) => currentItem.id !== item.id);
        this.applyFilter();
        this.showFeedback('Removed from My List.', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.showFeedback('Could not remove this title right now.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  trackByItemId(_: number, item: WatchlistItem) {
    return item.id;
  }

  getReleaseYear(item: WatchlistItem) {
    return item.movie_details.release_date?.slice(0, 4) || 'New';
  }

  getGenreSummary(item: WatchlistItem) {
    const genreNames = item.movie_details.genres?.map((genre) => genre.name).filter(Boolean) ?? [];
    return genreNames.length ? genreNames.join(' / ') : 'Saved title';
  }

  getSavedLabel(item: WatchlistItem) {
    const savedAt = new Date(item.added_date);
    return `Saved ${savedAt.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
  }

  private loadWatchlist() {
    this.apiService.getWatchlist().subscribe({
      next: (items) => {
        this.items = items;
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

        this.error = `Unable to load your watchlist. ${err.status ? `Error ${err.status}.` : ''}`.trim();
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private applyFilter() {
    const query = this.searchQuery.trim().toLowerCase();

    this.filteredItems = this.items.filter((item) => {
      if (!query) {
        return true;
      }

      const searchableText = [
        item.movie_details.title,
        item.movie_details.description,
        ...(item.movie_details.genres?.map((genre) => genre.name) ?? []),
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
}
