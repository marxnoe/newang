import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NaApp, NaBadge, NaButton, NaFooter, NaHeader, NaPage, NaRow } from 'newang';

// Header usage mirrors the reported docs shell: full-width header whose
// actions slot is an na-row (nav, badge, link, button).
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NaApp,
    NaBadge,
    NaButton,
    NaFooter,
    NaHeader,
    NaPage,
    NaRow,
  ],
  template: `
    <na-app>
      <na-header title="NewAng Showcase" subtitle="Mock sites exercising every component" maxWidth="full">
        <na-row gap="md" align="center">
          <nav class="show-nav">
            <a class="show-link" routerLink="/" routerLinkActive="show-link--active" [routerLinkActiveOptions]="{ exact: true }">Landing</a>
            <a class="show-link" routerLink="/dashboard" routerLinkActive="show-link--active">Dashboard</a>
            <a class="show-link" routerLink="/signin" routerLinkActive="show-link--active">Sign in</a>
            <a class="show-link" routerLink="/gallery" routerLinkActive="show-link--active">Gallery</a>
          </nav>
          <na-badge>v1.3.0</na-badge>
          <a class="show-link" href="https://github.com/marxnoe/newang" target="_blank" rel="noopener">GitHub</a>
          <na-button routerLink="/signin">Get started</na-button>
        </na-row>
      </na-header>
      <na-page maxWidth="lg">
        <router-outlet />
      </na-page>
      <na-footer maxWidth="full">
        <span>NewAng visual test site — dark, square, zero CSS.</span>
        <span>v1.3.0</span>
      </na-footer>
    </na-app>
  `,
})
export class App {}
