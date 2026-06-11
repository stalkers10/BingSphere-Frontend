import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, finalize, Observable, of, shareReplay, tap } from 'rxjs';
import { apiUrl } from '../config/runtime-config';
import { HomePageResponse } from '../models/home';
import { Movie } from '../models/movie';
import { ChangePasswordPayload, UserProfile } from '../models/profile';
import { WatchlistItem } from '../models/watchlist';

export interface PaginatedMovieResponse {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: Movie[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private moviesUrl = apiUrl('movies/');
  private homeUrl = apiUrl('home/');
  private watchlistUrl = apiUrl('watchlist/');
  private profileUrl = apiUrl('profile/');
  private passwordUrl = apiUrl('profile/password/');
  private profileSubject = new BehaviorSubject<UserProfile | null>(null);
  private profileRequest$: Observable<UserProfile> | null = null;

  constructor(private http: HttpClient) { }

  getMovies(): Observable<Movie[] | PaginatedMovieResponse> {
    return this.http.get<Movie[] | PaginatedMovieResponse>(this.moviesUrl);
  }

  getHomePage(): Observable<HomePageResponse> {
    return this.http.get<HomePageResponse>(this.homeUrl);
  }

  getWatchlist(): Observable<WatchlistItem[]> {
    return this.http.get<WatchlistItem[]>(this.watchlistUrl);
  }

  removeFromWatchlist(id: number): Observable<void> {
    return this.http.delete<void>(`${this.watchlistUrl}${id}/`);
  }

  getMovieById(id: number): Observable<Movie> {
    return this.http.get<Movie>(`${this.moviesUrl}${id}/`);
  }

  profileChanges(): Observable<UserProfile | null> {
    return this.profileSubject.asObservable();
  }

  getProfileSnapshot() {
    return this.profileSubject.value;
  }

  clearProfileState() {
    this.profileSubject.next(null);
    this.profileRequest$ = null;
  }

  getProfile(forceRefresh = false): Observable<UserProfile> {
    if (!forceRefresh) {
      const cachedProfile = this.profileSubject.value;

      if (cachedProfile) {
        return of(cachedProfile);
      }

      if (this.profileRequest$) {
        return this.profileRequest$;
      }
    }

    this.profileRequest$ = this.http.get<UserProfile>(this.profileUrl).pipe(
      tap((profile) => this.profileSubject.next(profile)),
      finalize(() => {
        this.profileRequest$ = null;
      }),
      shareReplay(1),
    );

    return this.profileRequest$;
  }

  updateProfileAvatar(formData: FormData): Observable<UserProfile> {
    return this.http.patch<UserProfile>(this.profileUrl, formData).pipe(
      tap((profile) => this.profileSubject.next(profile)),
    );
  }

  removeProfileAvatar(): Observable<UserProfile> {
    return this.http.patch<UserProfile>(this.profileUrl, { remove_avatar: true }).pipe(
      tap((profile) => this.profileSubject.next(profile)),
    );
  }

  changePassword(payload: ChangePasswordPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.passwordUrl, payload);
  }
}
