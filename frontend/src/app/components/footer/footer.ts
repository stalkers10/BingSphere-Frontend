import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FooterLink {
  label: string;
  route: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class FooterComponent {
  readonly footerLinks: FooterLink[] = [
    { label: 'Home', route: '/home' },
    { label: 'Movies', route: '/movies' },
    { label: 'My List', route: '/mylist' },
    { label: 'Profile', route: '/profile' },
    { label: 'Privacy Policy', route: '/privacy-policy' },
    { label: 'Terms of Use', route: '/terms-of-use' },
  ];
}
