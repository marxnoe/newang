import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NaIcon } from '../icon/icon';

/** Flat card with baked-in padding. Header/body/footer via projection.
 * Set `href` to make the whole card a link: it renders as an `<a>` with a
 * hover border, focus ring and an external-link mark by the title. */
@Component({
  selector: 'na-card',
  standalone: true,
  imports: [NgTemplateOutlet, NaIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './card.scss',
  template: `
    <ng-template #inner>
      @if (title() || subtitle()) {
        <header class="na-card__header">
          @if (title()) {
            <h3 class="na-card__title">
              {{ title() }}
              @if (href()) {
                <na-icon class="na-card__mark" name="external-link" [size]="14" />
              }
            </h3>
          }
          @if (subtitle()) {
            <p class="na-card__subtitle">{{ subtitle() }}</p>
          }
        </header>
      }
      <div class="na-card__body"><ng-content /></div>
    </ng-template>
    @if (href()) {
      <a
        class="na-card na-card--link"
        [attr.href]="href()"
        [attr.target]="target() || null"
        [attr.rel]="target() === '_blank' ? 'noopener' : null"
        ><ng-container [ngTemplateOutlet]="inner"
      /></a>
    } @else {
      <section class="na-card"><ng-container [ngTemplateOutlet]="inner" /></section>
    }
  `,
})
export class NaCard {
  readonly title = input('');
  readonly subtitle = input('');
  readonly href = input('');
  readonly target = input('');
}
