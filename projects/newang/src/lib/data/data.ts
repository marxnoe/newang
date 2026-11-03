import { ChangeDetectionStrategy, Component, computed, input, numberAttribute } from '@angular/core';

export interface NaTableColumn {
  key: string;
  header: string;
}

export interface NaBreadcrumb {
  label: string;
  href?: string;
}

/**
 * Pre-styled table with empty state. No CSS needed:
 * `<na-table [columns]="[{key:'name',header:'Name'}]" [rows]="[{name:'Ada'}]" />`
 */
@Component({
  selector: 'na-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './data.scss',
  template: `
    <div class="na-table-wrap">
      <table class="na-table">
        <thead>
          <tr>
            @for (col of columns(); track col.key) {
              <th scope="col">{{ col.header }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track $index) {
            <tr>
              @for (col of columns(); track col.key) {
                <td>{{ row[col.key] }}</td>
              }
            </tr>
          } @empty {
            <tr>
              <td class="na-table__empty" [attr.colspan]="columns().length || 1">
                {{ emptyMessage() }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class NaTable {
  readonly columns = input<NaTableColumn[]>([]);
  readonly rows = input<Record<string, string | number>[]>([]);
  readonly emptyMessage = input('No rows to show.');
}

/** Simple stacked list with dividers. */
@Component({
  selector: 'na-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './data.scss',
  template: `<ul class="na-list"><ng-content /></ul>`,
})
export class NaList {}

/** Breadcrumbs with lime current page. Plain strings render as text; `{label, href}` items render as links. */
@Component({
  selector: 'na-breadcrumbs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './data.scss',
  template: `
    <nav class="na-crumbs" aria-label="Breadcrumb">
      @for (crumb of normalized(); track $index) {
        @if ($index > 0) {
          <span class="na-crumbs__sep" aria-hidden="true">/</span>
        }
        @if ($index === normalized().length - 1) {
          <span class="na-crumbs__current" aria-current="page">{{ crumb.label }}</span>
        } @else if (crumb.href) {
          <a class="na-crumbs__item na-crumbs__link" [href]="crumb.href">{{ crumb.label }}</a>
        } @else {
          <span class="na-crumbs__item">{{ crumb.label }}</span>
        }
      }
    </nav>
  `,
})
export class NaBreadcrumbs {
  readonly items = input<(string | NaBreadcrumb)[]>([]);

  normalized(): NaBreadcrumb[] {
    return this.items().map((c) => (typeof c === 'string' ? { label: c } : c));
  }
}

/** Inline spinner — flat lime ring, no glow. */
@Component({
  selector: 'na-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './data.scss',
  template: `<span class="na-spinner" role="status" [attr.aria-label]="label()"></span>`,
})
export class NaSpinner {
  readonly label = input('Loading');
}

export type NaProgressVariant = 'bar' | 'ring';
export type NaProgressTone = 'accent' | 'success' | 'warning' | 'danger';

/**
 * Flat progress — solid fill, no gradient. `value` is clamped to 0–100.
 *
 * `<na-progress [value]="45" />` draws a bar. `variant="ring"` draws a circle of
 * `size` px with projected content centred inside it:
 * `<na-progress variant="ring" [value]="80" tone="success">06:30</na-progress>`
 */
@Component({
  selector: 'na-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './data.scss',
  template: `
    @if (variant() === 'ring') {
      <div
        class="na-progress-ring na-progress--{{ tone() }}"
        role="progressbar"
        [attr.aria-valuenow]="clamped()"
        aria-valuemin="0"
        aria-valuemax="100"
        [style.width.px]="size()"
        [style.height.px]="size()"
      >
        <svg class="na-progress-ring__svg" viewBox="0 0 100 100" aria-hidden="true">
          <circle class="na-progress-ring__track" cx="50" cy="50" [attr.r]="radius()" [attr.stroke-width]="stroke()" />
          <circle
            class="na-progress-ring__fill"
            cx="50"
            cy="50"
            pathLength="100"
            [attr.r]="radius()"
            [attr.stroke-width]="stroke()"
            [attr.stroke-dasharray]="clamped() + ' 100'"
          />
        </svg>
        <div class="na-progress-ring__label"><ng-content /></div>
      </div>
    } @else {
      <div
        class="na-progress na-progress--{{ tone() }}"
        role="progressbar"
        [attr.aria-valuenow]="clamped()"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div class="na-progress__fill" [style.width.%]="clamped()"></div>
      </div>
    }
  `,
})
export class NaProgress {
  readonly value = input(0, { transform: numberAttribute });
  readonly variant = input<NaProgressVariant>('bar');
  readonly tone = input<NaProgressTone>('accent');
  /** Ring diameter in px. */
  readonly size = input(160, { transform: numberAttribute });
  /** Ring thickness in px at the given `size`. */
  readonly thickness = input(8, { transform: numberAttribute });

  // The SVG is drawn in a 100×100 box, so scale the px thickness into it.
  protected readonly stroke = computed(() => (this.thickness() / Math.max(1, this.size())) * 100);
  protected readonly radius = computed(() => 50 - this.stroke() / 2);

  clamped(): number {
    const v = this.value();
    if (Number.isNaN(v)) return 0;
    return Math.min(100, Math.max(0, v));
  }
}
