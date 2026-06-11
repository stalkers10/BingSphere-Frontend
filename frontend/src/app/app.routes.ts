import { Routes } from '@angular/router';
import { AuthComponent } from './components/auth/auth';
import { Home } from './components/home/home';
import { LegalPageComponent } from './components/legal-page/legal-page';
import { MovieList } from './components/movie-list/movie-list';
import { Profile } from './components/profile/profile';
import { VideoPlayer } from './components/video-player/video-player';
import { Watchlist } from './components/watchlist/watchlist';

export const routes: Routes = [
  { path: 'login', component: AuthComponent },
  { path: 'privacy-policy', component: LegalPageComponent, data: { page: 'privacy' } },
  { path: 'terms-of-use', component: LegalPageComponent, data: { page: 'terms' } },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'mylist', component: Watchlist },
  { path: 'movies', component: MovieList },
  { path: 'watch/:id', component: VideoPlayer },
  { path: 'profile', component: Profile },
];
