import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NaIcon } from '../icon/icon';

export interface NaSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

let nextSelectId = 0;

/**
 * Opinionated single-select with a custom listbox and full keyboard support.
 * Binds via `[(value)]` or `formControl`.
 *
 * `<na-select placeholder="Pick a plan" [options]="plans" [(value)]="plan" />`
 */
@Component({
  selector: 'na-select',
  standalone: true,
  imports: [NaIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './select.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NaSelect), multi: true },
  ],
  template: `
    <div class="na-select" [class.na-select--open]="open()">
      <button
        type="button"
        class="na-select__trigger"
        role="combobox"
        aria-haspopup="listbox"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="listId"
        [attr.aria-activedescendant]="activeDescendant()"
        [attr.aria-label]="ariaLabel() || placeholder()"
        [disabled]="disabled() || cvaDisabled()"
        (click)="toggle()"
        (keydown)="onTriggerKeydown($event)"
      >
        <span
          class="na-select__value"
          [class.na-select__value--placeholder]="!selectedLabel()"
        >
          {{ selectedLabel() || placeholder() }}
        </span>
        <na-icon name="chevron-down" [size]="16" tone="muted" />
      </button>

      @if (open()) {
        <ul class="na-select__menu" role="listbox" [id]="listId" [attr.aria-label]="ariaLabel() || placeholder()">
          @for (opt of options(); track opt.value; let i = $index) {
            <li
              class="na-select__option"
              role="option"
              [id]="optionId(i)"
              [class.na-select__option--active]="i === activeIndex()"
              [class.na-select__option--selected]="value() === opt.value"
              [class.na-select__option--disabled]="!!opt.disabled"
              [attr.aria-selected]="value() === opt.value"
              [attr.aria-disabled]="opt.disabled ? 'true' : null"
              (mousedown)="$event.preventDefault()"
              (mouseenter)="activeIndex.set(i)"
              (click)="pick(opt)"
            >
              <span>{{ opt.label }}</span>
              @if (value() === opt.value) {
                <na-icon name="check" [size]="14" tone="accent" />
              }
            </li>
          } @empty {
            <li class="na-select__empty" role="presentation">No options</li>
          }
        </ul>
      }
    </div>
  `,
})
export class NaSelect implements ControlValueAccessor {
  readonly options = input<NaSelectOption[]>([]);
  readonly placeholder = input('Select…');
  readonly ariaLabel = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly value = model<string | number | undefined>(undefined);

  readonly open = signal(false);
  readonly activeIndex = signal(-1);
  private readonly cvaDisabled = signal(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly uid = ++nextSelectId;

  readonly listId = `na-select-${this.uid}-listbox`;
  readonly selectedLabel = computed(
    () => this.options().find((opt) => opt.value === this.value())?.label || '',
  );
  readonly activeDescendant = computed(() => {
    if (!this.open()) return null;
    const index = this.activeIndex();
    return index >= 0 && index < this.options().length ? this.optionId(index) : null;
  });

  private onChange: (value: unknown) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  optionId(index: number): string {
    return `na-select-${this.uid}-option-${index}`;
  }

  toggle(): void {
    if (this.disabled() || this.cvaDisabled()) return;
    if (this.open()) {
      this.close();
    } else {
      this.openMenu();
    }
  }

  pick(option: NaSelectOption): void {
    if (option.disabled) return;
    this.value.set(option.value);
    this.onChange(option.value);
    this.onTouched();
    this.close();
  }

  onDocumentClick(event: Event): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled() || this.cvaDisabled()) return;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!this.open()) {
          this.openMenu();
          return;
        }
        this.move(event.key === 'ArrowDown' ? 1 : -1);
        return;
      }
      case 'Home':
      case 'End': {
        if (!this.open()) return;
        event.preventDefault();
        this.activeIndex.set(event.key === 'Home' ? this.firstEnabled() : this.lastEnabled());
        return;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        if (!this.open()) {
          this.openMenu();
          return;
        }
        const option = this.options()[this.activeIndex()];
        if (option) this.pick(option);
        return;
      }
      case 'Escape': {
        if (!this.open()) return;
        event.preventDefault();
        this.close();
        return;
      }
      default:
        return;
    }
  }

  writeValue(value: string | number | undefined): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
    if (isDisabled) this.close();
  }

  private openMenu(): void {
    this.open.set(true);
    const selected = this.options().findIndex((opt) => opt.value === this.value());
    this.activeIndex.set(selected >= 0 ? selected : this.firstEnabled());
  }

  private close(): void {
    this.open.set(false);
    this.activeIndex.set(-1);
  }

  private move(delta: 1 | -1): void {
    const options = this.options();
    if (!options.length) return;
    let index = this.activeIndex();
    for (let step = 0; step < options.length; step++) {
      index = (index + delta + options.length) % options.length;
      if (!options[index].disabled) {
        this.activeIndex.set(index);
        return;
      }
    }
  }

  private firstEnabled(): number {
    return this.options().findIndex((opt) => !opt.disabled);
  }

  private lastEnabled(): number {
    for (let i = this.options().length - 1; i >= 0; i--) {
      if (!this.options()[i].disabled) return i;
    }
    return -1;
  }
}
