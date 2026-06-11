import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api';
import { ChangePasswordPayload, UserProfile } from '../../models/profile';
import { FooterComponent } from '../footer/footer';
import { NavbarComponent } from '../navbar/navbar';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit, OnDestroy {
  profile: UserProfile | null = null;
  avatarPreviewUrl: string | null = null;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  isLoading = true;
  isUploadingAvatar = false;
  isChangingPassword = false;
  error: string | null = null;
  profileFeedback: string | null = null;
  profileFeedbackTone: 'success' | 'error' = 'success';
  passwordFeedback: string | null = null;
  passwordFeedbackTone: 'success' | 'error' = 'success';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  private hasAvatarLoadError = false;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  ngOnDestroy() {
    this.clearPreviewUrl();
  }

  get avatarSource() {
    if (this.hasAvatarLoadError) {
      return null;
    }

    return this.avatarPreviewUrl || this.profile?.avatar_url || null;
  }

  get profileInitial() {
    return this.buildUserInitial(this.profile);
  }

  get displayName() {
    const fullName = this.profile?.full_name?.trim();
    return fullName || this.profile?.username || 'Profile';
  }

  get joinedDateLabel() {
    if (!this.profile?.date_joined) {
      return 'Unavailable';
    }

    return new Date(this.profile.date_joined).toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.setProfileFeedback('Please select an image file.', 'error');
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    this.clearPreviewUrl();
    this.hasAvatarLoadError = false;
    this.avatarPreviewUrl = URL.createObjectURL(file);
    this.isUploadingAvatar = true;

    const formData = new FormData();
    formData.append('avatar', file);

    this.apiService.updateProfileAvatar(formData)
      .pipe(
        finalize(() => {
          this.isUploadingAvatar = false;
          input.value = '';
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (profile) => {
          this.profile = profile;
          this.hasAvatarLoadError = false;
          this.clearPreviewUrl();
          this.setProfileFeedback('Avatar updated successfully.', 'success');
        },
        error: (err) => {
          if (err.status === 401) {
            this.router.navigate(['/login']);
            return;
          }

          this.setProfileFeedback(
            this.extractApiError(err, 'Could not upload your avatar right now.'),
            'error',
          );
        },
      });
  }

  removeAvatar() {
    this.isUploadingAvatar = true;

    this.apiService.removeProfileAvatar()
      .pipe(
        finalize(() => {
          this.isUploadingAvatar = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (profile) => {
          this.profile = profile;
          this.hasAvatarLoadError = false;
          this.clearPreviewUrl();
          this.setProfileFeedback('Avatar removed.', 'success');
        },
        error: (err) => {
          if (err.status === 401) {
            this.router.navigate(['/login']);
            return;
          }

          this.setProfileFeedback(
            this.extractApiError(err, 'Could not remove your avatar right now.'),
            'error',
          );
        },
      });
  }

  changePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.setPasswordFeedback('Fill in all password fields.', 'error');
      this.cdr.detectChanges();
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.setPasswordFeedback('New passwords do not match.', 'error');
      this.cdr.detectChanges();
      return;
    }

    this.isChangingPassword = true;

    const payload: ChangePasswordPayload = {
      current_password: this.currentPassword,
      new_password: this.newPassword,
      confirm_password: this.confirmPassword,
    };

    this.apiService.changePassword(payload)
      .pipe(
        finalize(() => {
          this.isChangingPassword = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.setPasswordFeedback(response.message || 'Password changed successfully.', 'success');
        },
        error: (err) => {
          if (err.status === 401) {
            this.router.navigate(['/login']);
            return;
          }

          this.setPasswordFeedback(
            this.extractApiError(err, 'Could not change your password right now.'),
            'error',
          );
        },
      });
  }

  private loadProfile() {
    this.isLoading = true;

    this.apiService.getProfile()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (profile) => {
          this.profile = profile;
          this.hasAvatarLoadError = false;
          this.error = null;
        },
        error: (err) => {
          if (err.status === 401) {
            this.router.navigate(['/login']);
            return;
          }

          this.error = this.extractApiError(err, 'Unable to load your profile.');
        },
      });
  }

  onAvatarImageError() {
    this.hasAvatarLoadError = true;
  }

  private buildUserInitial(profile: UserProfile | null) {
    const source = [
      profile?.full_name,
      profile?.first_name,
      profile?.username,
    ]
      .find((value) => value?.trim())
      ?.trim();

    return (source?.charAt(0) || 'U').toUpperCase();
  }

  private setProfileFeedback(message: string, tone: 'success' | 'error') {
    this.profileFeedback = message;
    this.profileFeedbackTone = tone;
  }

  private setPasswordFeedback(message: string, tone: 'success' | 'error') {
    this.passwordFeedback = message;
    this.passwordFeedbackTone = tone;
  }

  private extractApiError(err: any, fallback: string) {
    const payload = err?.error;

    if (typeof payload === 'string') {
      return payload;
    }

    if (payload?.error && typeof payload.error === 'string') {
      return payload.error;
    }

    if (payload && typeof payload === 'object') {
      const firstEntry = Object.entries(payload)[0];

      if (firstEntry) {
        const [, value] = firstEntry;
        if (Array.isArray(value) && value.length) {
          return String(value[0]);
        }
        if (typeof value === 'string') {
          return value;
        }
      }
    }

    return err?.status ? `${fallback} Error ${err.status}.` : fallback;
  }

  private clearPreviewUrl() {
    if (this.avatarPreviewUrl) {
      URL.revokeObjectURL(this.avatarPreviewUrl);
      this.avatarPreviewUrl = null;
    }
  }
}
