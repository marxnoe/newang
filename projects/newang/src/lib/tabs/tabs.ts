import {
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  inject,
  input,
  model,
} from '@angular/core';

let nextTabsId = 0;
let nextTabId = 0;

export type NaTabKey = string | number;

/**
 * Opinionated tabs. Two APIs share the same visual language:
 *
 * Labels in (index-based):
 * `<na-tabs [tabs]="['One','Two']" [(active)]="i"><ng-content /></na-tabs>`
 *
 * Projected (stable keys, content stays mounted):
 * `<na-tabs [(activeId)]="key"><na-tab id="upload" title="Upload">…</na-tab></na-tabs>`
 */
@Component({
  selector: 'na-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './tabs.scss',
  template: `
    <div class="na-tabs" role="tablist">
      @if (projectedTabs().length) {
        @for (tab of projectedTabs(); track tab.id() || $index) {
          <button
            type="button"
            role="tab"
            class="na-tabs__tab"
            [id]="tab.tabButtonId()"
            [class.na-tabs__tab--active]="isTabActive(tab)"
            [attr.aria-selected]="isTabActive(tab)"
            [attr.aria-controls]="tab.panelId()"
            (click)="selectTab(tab, $index)"
          >
            {{ tab.title() }}
          </button>
        }
      } @else {
        @for (tab of tabs(); track $index) {
          <button
            type="button"
            role="tab"
            class="na-tabs__tab"
            [id]="tabButtonId($index)"
            [class.na-tabs__tab--active]="$index === active()"
            [attr.aria-selected]="$index === active()"
            (click)="active.set($index)"
          >
            {{ tab }}
          </button>
        }
      }
    </div>
    <div class="na-tabs__panel"><ng-content /></div>
  `,
})
export class NaTabs {
  readonly tabs = input<string[]>([]);
  /** Index-based selection used by the labels API. */
  readonly active = model<number>(0);
  /** Stable id selection for projected `<na-tab id="…">`. Wins over `active` when set. */
  readonly activeId = model<NaTabKey | null>(null);
  readonly projectedTabs = contentChildren(NaTab);

  private readonly uid = ++nextTabsId;

  tabButtonId(index: number): string {
    return `na-tabs-${this.uid}-tab-${index}`;
  }

  isTabActive(tab: NaTab): boolean {
    const index = this.projectedTabs().indexOf(tab);
    if (index < 0) return false;
    const id = tab.id();
    const explicit = this.activeId();
    if (id && explicit !== null) return explicit === id;
    if (!id && explicit !== null) return explicit === index;
    return this.active() === index;
  }

  selectTab(tab: NaTab, index: number): void {
    if (tab.id()) this.activeId.set(tab.id());
    this.active.set(index);
  }
}

/**
 * A projected tab. Content remains in the DOM while inactive (hidden), so
 * forms and scroll state survive tab switches.
 */
@Component({
  selector: 'na-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './tabs.scss',
  template: `
    <div
      class="na-tab__panel"
      role="tabpanel"
      [id]="panelId()"
      [attr.aria-labelledby]="tabButtonId()"
      [hidden]="!tabs.isTabActive(this)"
    >
      <ng-content />
    </div>
  `,
})
export class NaTab {
  readonly title = input('');
  readonly id = input('');

  readonly tabs = inject(NaTabs);

  private readonly uid = ++nextTabId;

  tabButtonId(): string {
    return this.id() ? `na-tab-${this.id()}-button` : `na-tab-${this.uid}-button`;
  }

  panelId(): string {
    return this.id() ? `na-tab-${this.id()}-panel` : `na-tab-${this.uid}-panel`;
  }
}
