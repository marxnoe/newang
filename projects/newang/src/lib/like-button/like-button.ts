import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  model,
  numberAttribute,
} from '@angular/core';
import { HEART_PATH } from '../icon/icon';

export type NaLikeButtonSize = 'sm' | 'md';

/**
 * Heart toggle with a count. It only flips `liked` and emits; the consumer saves the like and
 * updates `count`.
 *
 * `<na-like-button [(liked)]="liked" [count]="likes" (likedChange)="save($event)" />`
 */
@Component({
  selector: 'na-like-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './like-button.scss',
  template: `
    <button
      type="button"
      class="na-like na-like--{{ size() }}"
      [class.na-like--on]="liked()"
      [attr.aria-pressed]="liked()"
      [attr.aria-label]="label() + ' (' + count() + ')'"
      [disabled]="disabled()"
      (click)="toggle()"
    >
      <svg
        class="na-like__heart"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path [attr.d]="heart" />
      </svg>
      <span class="na-like__count" aria-hidden="true">{{ count() }}</span>
    </button>
  `,
})
export class NaLikeButton {
  readonly liked = model(false);
  readonly count = input(0, { transform: numberAttribute });
  readonly size = input<NaLikeButtonSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Accessible name; the count is appended. */
  readonly label = input('Like');

  protected readonly heart = HEART_PATH;

  toggle(): void {
    if (this.disabled()) return;
    this.liked.set(!this.liked());
  }
}
