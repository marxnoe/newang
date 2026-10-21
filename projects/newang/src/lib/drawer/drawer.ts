import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';
import { NaIcon } from '../icon/icon';

export type NaDrawerPosition = 'left' | 'right';

/**
 * Full-height side panel. Same open/closed contract as `na-modal`:
 * `<na-drawer title="Filters" [open]="open" (closed)="open=false">…</na-drawer>`
 */
@Component({
  selector: 'na-drawer',
  standalone: true,
  imports: [NaIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './drawer.scss',
  host: {
    '(window:keydown)': 'onWindowKeydown($event)',
  },
  template: `
    @if (open()) {
      <div class="na-drawer__overlay" (click)="closed.emit()">
        <aside
          class="na-drawer__panel na-drawer__panel--{{ position() }}"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="title()"
          [style.width]="width()"
          (click)="$event.stopPropagation()"
        >
          <header class="na-drawer__header">
            <h2 class="na-drawer__title">{{ title() }}</h2>
            <button class="na-drawer__close" type="button" aria-label="Close" (click)="closed.emit()">
              <na-icon name="x" [size]="16" />
            </button>
          </header>
          <div class="na-drawer__body"><ng-content /></div>
        </aside>
      </div>
    }
  `,
})
export class NaDrawer {
  readonly title = input('Panel');
  readonly open = input(false, { transform: booleanAttribute });
  readonly position = input<NaDrawerPosition>('right');
  readonly width = input('min(420px, 100%)');
  readonly closed = output<void>();

  onWindowKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open()) this.closed.emit();
  }
}
