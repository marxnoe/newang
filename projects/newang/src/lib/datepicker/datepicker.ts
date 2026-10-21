import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Native date input in an opinionated field shell. The native picker is
 * intentional: it is the most accessible and mobile-friendly date control.
 *
 * `<na-datepicker label="Start date" [(value)]="date" />`
 */
@Component({
  selector: 'na-datepicker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './datepicker.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NaDatepicker), multi: true },
  ],
  template: `
    <label class="na-datepicker">
      @if (label()) {
        <span class="na-datepicker__label">
          {{ label() }} @if (required()) {
            <span class="na-datepicker__asterisk" aria-hidden="true">*</span>
          }
        </span>
      }
      <input
        class="na-input na-datepicker__input"
        type="date"
        [value]="value()"
        [attr.min]="min() || null"
        [attr.max]="max() || null"
        [attr.aria-label]="label() || null"
        [attr.aria-invalid]="error() ? 'true' : null"
        [required]="required()"
        [disabled]="disabled() || cvaDisabled()"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      @if (error()) {
        <span class="na-datepicker__error" role="alert">{{ error() }}</span>
      } @else if (hint()) {
        <span class="na-datepicker__hint">{{ hint() }}</span>
      }
    </label>
  `,
})
export class NaDatepicker implements ControlValueAccessor {
  readonly label = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly min = input('');
  readonly max = input('');
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly value = model('');

  private readonly cvaDisabled = signal(false);
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.onChange(value);
  }

  writeValue(value: string | Date | null): void {
    this.value.set(normalizeDate(value));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}

function normalizeDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  if (Number.isNaN(value.getTime())) return '';
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}
