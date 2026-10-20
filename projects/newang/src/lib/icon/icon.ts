import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
} from '@angular/core';

/** Closed icon set shipped with newAng. No second icon library required. */
export type NaIconName =
  | 'inbox'
  | 'check'
  | 'copy'
  | 'x'
  | 'upload'
  | 'download'
  | 'alert'
  | 'info'
  | 'chevron-up'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'spinner'
  | 'file'
  | 'trash'
  | 'search'
  | 'external-link'
  | 'eye'
  | 'refresh'
  | 'plus';

export type NaIconTone =
  | 'default'
  | 'muted'
  | 'faint'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

/**
 * Inline 24px-grid SVG icon. Decorative by default; pass `label` for a
 * standalone meaning. `size` accepts a number (px) or numeric string.
 *
 * `<na-icon name="inbox" size="20" tone="muted" />`
 */
@Component({
  selector: 'na-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './icon.scss',
  template: `
    <svg
      class="na-icon na-icon--{{ tone() }}"
      [class.na-icon--spin]="name() === 'spinner'"
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.role]="label() ? 'img' : null"
      [attr.aria-label]="label() || null"
      [attr.aria-hidden]="label() ? null : 'true'"
      [attr.focusable]="false"
    >
      @for (path of paths(); track $index) {
        <path [attr.d]="path" />
      }
    </svg>
  `,
})
export class NaIcon {
  readonly name = input<NaIconName>('info');
  readonly size = input(20, { transform: numberAttribute });
  readonly tone = input<NaIconTone>('default');
  readonly label = input('');

  readonly paths = computed(() => ICON_PATHS[this.name()] ?? ICON_PATHS.info);
}

// Single-path-per-shape coordinates on the 24×24 Feather grid.
// Every glyph is stroke-based so it inherits `currentColor` and tone.
const ICON_PATHS: Record<NaIconName, string[]> = {
  inbox: [
    'M22 12h-6l-2 3h-4l-2-3H2',
    'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
  ],
  check: ['M20 6 9 17l-5-5'],
  copy: [
    'M11 9h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z',
    'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  ],
  x: ['M18 6 6 18', 'M6 6l12 12'],
  upload: [
    'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4',
    'M17 8l-5-5-5 5',
    'M12 3v12',
  ],
  download: [
    'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4',
    'M7 10l5 5 5-5',
    'M12 15V3',
  ],
  alert: [
    'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
    'M12 9v4',
    'M12 17h.01',
  ],
  info: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M12 16v-4', 'M12 8h.01'],
  'chevron-up': ['M18 15l-6-6-6 6'],
  'chevron-down': ['M6 9l6 6 6-6'],
  'chevron-left': ['M15 18l-6-6 6-6'],
  'chevron-right': ['M9 18l6-6-6-6'],
  spinner: ['M21 12a9 9 0 1 1-6.219-8.56'],
  file: [
    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    'M14 2v6h6',
  ],
  trash: [
    'M3 6h18',
    'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
    'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  ],
  search: ['M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0z', 'M21 21l-4.35-4.35'],
  'external-link': [
    'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
    'M15 3h6v6',
    'M10 14 21 3',
  ],
  eye: [
    'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z',
    'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  ],
  refresh: [
    'M23 4v6h-6',
    'M1 20v-6h6',
    'M3.51 9a9 9 0 0 1 14.85-3.36L23 10',
    'M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  ],
  plus: ['M12 5v14', 'M5 12h14'],
};
