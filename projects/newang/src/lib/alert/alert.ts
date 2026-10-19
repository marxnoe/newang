import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { NaIcon, NaIconName } from '../icon/icon';

export type NaAlertTone = 'info' | 'success' | 'warning' | 'danger';

const TONE_ICONS: Record<NaAlertTone, NaIconName> = {
  info: 'info',
  success: 'check',
  warning: 'alert',
  danger: 'alert',
};

/**
 * Flat alert with optional icon, description and close button.
 *
 * `<na-alert tone="warning" showIcon title="Careful" description="…" closable (closed)="…">Body</na-alert>`
 */
@Component({
  selector: 'na-alert',
  standalone: true,
  imports: [NaIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './alert.scss',
  template: `
    @if (!dismissed()) {
      <div
        class="na-alert na-alert--{{ tone() }}"
        [class.na-alert--with-icon]="showIcon() || icon()"
        [class.na-alert--closable]="closable()"
        role="alert"
      >
        @if (showIcon() || icon()) {
          <span class="na-alert__icon" aria-hidden="true">
            <na-icon [name]="resolvedIcon()" [size]="20" />
          </span>
        }
        <div class="na-alert__content">
          @if (title()) {
            <p class="na-alert__title">{{ title() }}</p>
          }
          @if (description()) {
            <p class="na-alert__description">{{ description() }}</p>
          }
          <div class="na-alert__body"><ng-content /></div>
        </div>
        @if (closable()) {
          <button class="na-alert__close" type="button" aria-label="Dismiss alert" (click)="close()">
            <na-icon name="x" [size]="16" />
          </button>
        }
      </div>
    }
  `,
})
export class NaAlert {
  readonly tone = input<NaAlertTone>('info');
  readonly title = input('');
  readonly description = input('');
  readonly showIcon = input(false, { transform: booleanAttribute });
  readonly icon = input<NaIconName | ''>('');
  readonly closable = input(false, { transform: booleanAttribute });
  readonly closed = output<void>();

  readonly resolvedIcon = computed<NaIconName>(() => this.icon() || TONE_ICONS[this.tone()]);
  readonly dismissed = signal(false);

  close(): void {
    if (this.dismissed()) return;
    this.dismissed.set(true);
    this.closed.emit();
  }
}
