import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FooterComponent } from '../footer/footer';

interface LegalHighlight {
  title: string;
  copy: string;
}

interface LegalSection {
  title: string;
  paragraphs: string[];
}

interface LegalPageContent {
  eyebrow: string;
  title: string;
  intro: string;
  effectiveDate: string;
  alternateLabel: string;
  alternateRoute: string;
  summary: string;
  highlights: LegalHighlight[];
  sections: LegalSection[];
}

const LEGAL_PAGES: Record<'privacy' | 'terms', LegalPageContent> = {
  privacy: {
    eyebrow: 'Privacy Policy',
    title: 'How Bingsphere handles your account and viewing information.',
    intro:
      'This page explains the basic information we collect to run accounts, save watchlists, and keep the streaming experience stable across sessions and devices.',
    effectiveDate: 'May 12, 2026',
    alternateLabel: 'Terms of Use',
    alternateRoute: '/terms-of-use',
    summary:
      'We keep the data needed to run your account, personalize core features, and protect the service, while limiting unnecessary sharing.',
    highlights: [
      {
        title: 'Account Details',
        copy: 'We store information such as your username, email address, and profile avatar when you choose to upload one.',
      },
      {
        title: 'Activity Signals',
        copy: 'Watch progress, saved movies, and home-page recommendations depend on the activity you create inside the app.',
      },
      {
        title: 'Security First',
        copy: 'Authentication and account protections rely on credentials, session tokens, and service logs used to detect misuse.',
      },
    ],
    sections: [
      {
        title: 'Information We Collect',
        paragraphs: [
          'Bingsphere collects the details you provide directly, including your account credentials, email address, and profile image when you upload one.',
          'We also store product data tied to your activity, such as watchlist selections, watch-progress records, and other account preferences needed to preserve your experience.',
        ],
      },
      {
        title: 'How We Use That Information',
        paragraphs: [
          'The service uses your information to authenticate access, load personalized home content, display your profile avatar, and keep your saved items available when you return.',
          'We may also use technical usage records to troubleshoot playback issues, improve reliability, and reduce suspicious or abusive access patterns.',
        ],
      },
      {
        title: 'When Information Is Shared',
        paragraphs: [
          'We do not describe this service as selling personal data. Information may be processed by infrastructure or hosting providers strictly to operate the application.',
          'If disclosure is required by law, security response, or platform protection needs, only the relevant information would be used for that purpose.',
        ],
      },
      {
        title: 'Your Choices and Retention',
        paragraphs: [
          'You can remove your avatar, update account details where supported, or stop using the service at any time. Some records may remain for operational, legal, or security reasons.',
          'If this policy changes in a material way, the version and content on this page should be updated so the new expectations are visible before continued use.',
        ],
      },
    ],
  },
  terms: {
    eyebrow: 'Terms of Use',
    title: 'The rules for using Bingsphere responsibly.',
    intro:
      'These terms set the expectations for access, acceptable behavior, account responsibility, and the general boundaries of the Bingsphere streaming experience.',
    effectiveDate: 'May 12, 2026',
    alternateLabel: 'Privacy Policy',
    alternateRoute: '/privacy-policy',
    summary:
      'By using Bingsphere, you agree to use the platform lawfully, protect your own account, and avoid actions that interfere with the service or other users.',
    highlights: [
      {
        title: 'Personal Access',
        copy: 'Accounts are intended for the registered user and should not be used in a way that bypasses normal access controls.',
      },
      {
        title: 'Platform Integrity',
        copy: 'Users must not abuse the application, attack the backend, automate harmful traffic, or attempt unauthorized data access.',
      },
      {
        title: 'Feature Availability',
        copy: 'Movie availability, catalog rows, and interface behavior may change as the product evolves or as content is updated.',
      },
    ],
    sections: [
      {
        title: 'Account Responsibility',
        paragraphs: [
          'You are responsible for maintaining the confidentiality of your login credentials and for activity that occurs through your account.',
          'If you believe your account has been compromised, you should stop using the exposed credentials and update them as soon as possible.',
        ],
      },
      {
        title: 'Acceptable Use',
        paragraphs: [
          'You agree not to misuse the service through scraping, reverse engineering, credential abuse, spam activity, malicious uploads, or attempts to disrupt availability.',
          'Any use that harms the platform, undermines security, or interferes with other users may lead to restricted access or account removal.',
        ],
      },
      {
        title: 'Content and Service Changes',
        paragraphs: [
          'Bingsphere may update the catalog, interface, routes, playback behavior, and supporting features over time without guaranteeing that any specific title or feature remains available.',
          'Reasonable maintenance, bug fixes, performance work, or backend changes may temporarily affect access to parts of the service.',
        ],
      },
      {
        title: 'Suspension and Updates',
        paragraphs: [
          'We may suspend or restrict access when needed to investigate abuse, enforce these terms, or protect the product and its supporting systems.',
          'If the rules change, the updated terms shown on this page will govern continued use from the date they become effective.',
        ],
      },
    ],
  },
};

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FooterComponent],
  templateUrl: './legal-page.html',
  styleUrl: './legal-page.scss',
})
export class LegalPageComponent {
  readonly page: LegalPageContent;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
  ) {
    const pageKey = (this.route.snapshot.data['page'] as 'privacy' | 'terms' | undefined) ?? 'privacy';
    this.page = LEGAL_PAGES[pageKey] ?? LEGAL_PAGES.privacy;
  }

  goBack() {
    this.location.back();
  }
}
