import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserProfile } from '../../models/profile';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Input() showSearch = false;
  @Input() searchQuery = '';
  @Input() userInitial = 'U';
  @Output() searchQueryChange = new EventEmitter<string>();
  profile: UserProfile | null = null;
  private profileSubscription: Subscription | null = null;
  private profileRequestSubscription: Subscription | null = null;
  private hasAvatarLoadError = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.profileSubscription = this.apiService.profileChanges().subscribe((profile) => {
      this.profile = profile;
      this.hasAvatarLoadError = false;
    });

    if (!this.apiService.getProfileSnapshot()) {
      this.profileRequestSubscription = this.apiService.getProfile().subscribe({
        error: () => {
          this.profile = null;
          this.hasAvatarLoadError = false;
        },
      });
    }
  }

  ngOnDestroy() {
    this.profileSubscription?.unsubscribe();
    this.profileRequestSubscription?.unsubscribe();
  }

  get avatarUrl() {
    if (this.hasAvatarLoadError) {
      return null;
    }

    return this.profile?.avatar_url || null;
  }

  get profileLabel() {
    return (
      this.profile?.full_name?.trim() ||
      this.profile?.first_name?.trim() ||
      this.profile?.username?.trim() ||
      'Profile'
    );
  }

  get resolvedInitial() {
    const initial = this.buildInitialFromProfile(this.profile);
    return initial || this.userInitial || 'U';
  }

  onSearchInput(event: Event) {
    this.searchQueryChange.emit((event.target as HTMLInputElement).value);
  }

  onAvatarError() {
    this.hasAvatarLoadError = true;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private buildInitialFromProfile(profile: UserProfile | null) {
    const source = [
      profile?.full_name,
      profile?.first_name,
      profile?.username,
    ]
      .find((value) => value?.trim())
      ?.trim();

    return source?.charAt(0).toUpperCase() || '';
  }
}
