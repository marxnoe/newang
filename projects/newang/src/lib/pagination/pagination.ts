import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  model,
  numberAttribute,
} from '@angular/core';
import { NaIcon } from '../icon/icon';

export type NaPaginationItem = number | 'ellipsis';

/**
 * Flat page switcher with a bounded window.
 *
 * `<na-pagination [total]="120" [pageSize]="10" [(page)]="page" />`
 */
@Component({
  selector: 'na-pagination',
  standalone: true,
  imports: [NaIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './pagination.scss',
  template: `
    <nav class="na-pagination" role="navigation" aria-label="Pagination">
      <button
        type="button"
        class="na-pagination__button na-pagination__button--arrow"
        aria-label="Previous page"
        [disabled]="disabled() || current() <= 1"
        (click)="go(current() - 1)"
      >
        <na-icon name="chevron-left" [size]="16" />
      </button>

      @for (item of items(); track $index) {
        @if (item === 'ellipsis') {
          <span class="na-pagination__ellipsis" aria-hidden="true">…</span>
        } @else {
          <button
            type="button"
            class="na-pagination__button"
            [class.na-pagination__button--active]="item === current()"
            [attr.aria-current]="item === current() ? 'page' : null"
            [attr.aria-label]="'Page ' + item"
            [disabled]="disabled()"
            (click)="go(item)"
          >
            {{ item }}
          </button>
        }
      }

      <button
        type="button"
        class="na-pagination__button na-pagination__button--arrow"
        aria-label="Next page"
        [disabled]="disabled() || current() >= pageCount()"
        (click)="go(current() + 1)"
      >
        <na-icon name="chevron-right" [size]="16" />
      </button>
    </nav>
  `,
})
export class NaPagination {
  readonly total = input(0, { transform: numberAttribute });
  readonly pageSize = input(10, { transform: numberAttribute });
  readonly page = model(1);
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly pageCount = computed(() => {
    const size = Math.max(1, this.pageSize());
    return Math.max(1, Math.ceil(Math.max(0, this.total()) / size));
  });

  readonly current = computed(() => {
    const page = Number.isNaN(this.page()) ? 1 : this.page();
    return Math.min(this.pageCount(), Math.max(1, Math.trunc(page)));
  });

  readonly items = computed<NaPaginationItem[]>(() => {
    const count = this.pageCount();
    const page = this.current();
    if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, 'ellipsis', count];
    if (page >= count - 3) {
      return [1, 'ellipsis', count - 4, count - 3, count - 2, count - 1, count];
    }
    return [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', count];
  });

  go(page: number): void {
    if (this.disabled()) return;
    const next = Math.min(this.pageCount(), Math.max(1, page));
    if (next === this.current()) return;
    this.page.set(next);
  }
}
