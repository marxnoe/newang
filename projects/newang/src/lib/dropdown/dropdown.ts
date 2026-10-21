import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  inject,
  input,
  model,
  output,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NaIcon } from '../icon/icon';

export interface NaDropdownItem {
  label: string;
  value: string | number;
  disabled?: boolean;
  danger?: boolean;
}

/**
 * Flat dropdown menu with keyboard navigation.
 *
 * `<na-dropdown label="Actions" [items]="items" (selected)="run($event)" />`
 */
@Component({
  selector: 'na-dropdown',
  standalone: true,
  imports: [NaIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './dropdown.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <div class="na-dropdown">
      <button
        #trigger
        type="button"
        class="na-dropdown__trigger"
        aria-haspopup="menu"
        [attr.aria-expanded]="open()"
        [disabled]="disabled()"
        (click)="toggle()"
        (keydown)="onTriggerKeydown($event)"
      >
        <span>{{ label() }}</span>
        <na-icon name="chevron-down" [size]="16" tone="muted" />
      </button>

      @if (open()) {
        <ul class="na-dropdown__menu" role="menu" [attr.aria-label]="label()">
          @for (item of items(); track item.value; let i = $index) {
            <li role="none">
              <button
                #menuItem
                type="button"
                role="menuitem"
                class="na-dropdown__item"
                [class.na-dropdown__item--danger]="item.danger"
                [disabled]="!!item.disabled"
                (click)="choose(item)"
                (keydown)="onItemKeydown($event, i)"
              >
                {{ item.label }}
              </button>
            </li>
          } @empty {
            <li class="na-dropdown__empty" role="presentation">No actions</li>
          }
        </ul>
      }
    </div>
  `,
})
export class NaDropdown {
  readonly label = input('Actions');
  readonly items = input<NaDropdownItem[]>([]);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly open = model(false);
  readonly selected = output<NaDropdownItem>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menuItems = viewChildren<ElementRef<HTMLButtonElement>>('menuItem');

  toggle(): void {
    if (this.disabled()) return;
    if (this.open()) {
      this.close();
    } else {
      this.openMenu();
    }
  }

  choose(item: NaDropdownItem): void {
    if (item.disabled) return;
    this.selected.emit(item);
    this.close();
    this.focusTrigger();
  }

  onDocumentClick(event: Event): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openMenu();
      this.focusItem(0);
    } else if (event.key === 'Escape') {
      this.close();
    }
  }

  onItemKeydown(event: KeyboardEvent, index: number): void {
    const buttons = this.menuItems().map((ref) => ref.nativeElement);
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusItem(this.nextEnabled(index, 1));
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.focusItem(this.nextEnabled(index, -1));
        return;
      case 'Home':
        event.preventDefault();
        this.focusItem(this.nextEnabled(-1, 1));
        return;
      case 'End':
        event.preventDefault();
        this.focusItem(this.nextEnabled(buttons.length, -1));
        return;
      case 'Escape':
        event.preventDefault();
        this.close();
        this.focusTrigger();
        return;
      case 'Tab':
        this.close();
        return;
      default:
        return;
    }
  }

  private openMenu(): void {
    this.open.set(true);
  }

  private close(): void {
    this.open.set(false);
  }

  private focusItem(index: number): void {
    const item = this.menuItems()[index]?.nativeElement;
    if (item) setTimeout(() => item.focus());
  }

  private focusTrigger(): void {
    const trigger = this.trigger()?.nativeElement;
    if (trigger) setTimeout(() => trigger.focus());
  }

  private nextEnabled(from: number, delta: 1 | -1): number {
    const items = this.items();
    if (!items.length) return -1;
    let index = from;
    for (let step = 0; step < items.length; step++) {
      index = (index + delta + items.length) % items.length;
      if (!items[index].disabled) return index;
    }
    return -1;
  }
}
