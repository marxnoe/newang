import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
} from '@angular/core';

/**
 * Flat loading placeholder. Opacity pulse only — no gradients.
 *
 * `<na-skeleton [lines]="3" />` or `<na-skeleton circle [height]="40" />`
 */
@Component({
  selector: 'na-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './skeleton.scss',
  template: `
    <span
      class="na-skeleton"
      [attr.role]="label() ? 'status' : null"
      [attr.aria-label]="label() || null"
      [attr.aria-hidden]="label() ? null : 'true'"
    >
      @for (line of rows(); track $index) {
        @if (circle()) {
          <span
            class="na-skeleton__shape na-skeleton__shape--circle"
            [style.width.px]="height()"
            [style.height.px]="height()"
          ></span>
        } @else {
          <span
            class="na-skeleton__shape"
            [style.width]="widthCss()"
            [style.height.px]="height()"
          ></span>
        }
      }
    </span>
  `,
})
export class NaSkeleton {
  readonly width = input<string | number>('100%');
  readonly height = input(14, { transform: numberAttribute });
  readonly lines = input(1, { transform: numberAttribute });
  readonly circle = input(false, { transform: booleanAttribute });
  readonly label = input('');

  readonly rows = computed(() =>
    this.circle() ? [0] : Array.from({ length: Math.max(1, this.lines()) }),
  );
  readonly widthCss = computed(() =>
    typeof this.width() === 'number' ? `${this.width()}px` : this.width(),
  );
}
