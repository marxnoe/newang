import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  model,
  signal,
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

type Segment = 0 | 1;

const MAX: Record<Segment, number> = { 0: 23, 1: 59 };

/**
 * 24-hour `HH:mm` entry made of two segments, no AM/PM. Digits enter on the
 * right and shift left like a native time input, whatever the caret does.
 * Finishing a segment never jumps to the other one.
 *
 * `<na-time-input label="Start" [(value)]="start" />`
 */
@Component({
  selector: 'na-time-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './time-input.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NaTimeInput), multi: true },
  ],
  template: `
    <div
      class="na-time-input"
      role="group"
      [class.na-time-input--invalid]="invalid()"
      [class.na-time-input--disabled]="isDisabled()"
      [attr.aria-label]="label() || null"
    >
      @for (seg of segments; track seg) {
        @if (seg === 1) {
          <span class="na-time-input__sep" aria-hidden="true">:</span>
        }
        <input
          #box
          class="na-time-input__segment"
          type="text"
          inputmode="numeric"
          readonly
          [attr.aria-label]="seg === 0 ? 'Hours' : 'Minutes'"
          [attr.aria-valuenow]="parts()[seg]"
          aria-valuemin="0"
          [attr.aria-valuemax]="max[seg]"
          role="spinbutton"
          [attr.aria-invalid]="invalid() ? 'true' : null"
          [value]="text(seg)"
          [disabled]="isDisabled()"
          (keydown)="onKeydown(seg, $event)"
          (focus)="onFocus(seg, $event)"
          (blur)="onBlur()"
        />
      }
    </div>
  `,
})
export class NaTimeInput implements ControlValueAccessor {
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Paints the danger border. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Accessible name for the field. */
  readonly label = input('');
  /** `HH:mm`, 24-hour. Empty input reads as 00:00. */
  readonly value = model('00:00');

  protected readonly segments: Segment[] = [0, 1];
  protected readonly max = MAX;
  private readonly boxes = viewChildren<ElementRef<HTMLInputElement>>('box');
  private readonly cvaDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  protected readonly parts = computed(() => parse(this.value()));
  // Raw digits of the focused segment: they may briefly exceed the max
  // (typing "9" then "9" shows "99") until the field loses focus.
  private readonly draft = signal<{ seg: Segment; text: string } | null>(null);

  private onChange: (v: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  focus(): void {
    this.boxes()[0]?.nativeElement.focus();
  }

  protected text(seg: Segment): string {
    const d = this.draft();
    return d && d.seg === seg ? d.text : pad(this.parts()[seg]);
  }

  protected onFocus(seg: Segment, event: FocusEvent): void {
    this.draft.set({ seg, text: pad(this.parts()[seg]) });
    (event.target as HTMLInputElement).select();
  }

  protected onBlur(): void {
    this.draft.set(null);
    this.onTouched();
  }

  protected onKeydown(seg: Segment, event: KeyboardEvent): void {
    const key = event.key;
    if (/^[0-9]$/.test(key)) {
      event.preventDefault();
      const text = (this.text(seg) + key).slice(-2);
      this.draft.set({ seg, text });
      this.set(seg, Math.min(parseInt(text, 10), MAX[seg]));
    } else if (key === 'Backspace' || key === 'Delete') {
      event.preventDefault();
      this.draft.set({ seg, text: '00' });
      this.set(seg, 0);
    } else if (key === 'ArrowUp' || key === 'ArrowDown') {
      event.preventDefault();
      const step = key === 'ArrowUp' ? 1 : -1;
      const next = Math.max(0, Math.min(MAX[seg], this.parts()[seg] + step));
      this.draft.set({ seg, text: pad(next) });
      this.set(seg, next);
    } else if (key === 'ArrowRight' || key === ':') {
      event.preventDefault();
      if (seg === 0) this.boxes()[1]?.nativeElement.focus();
    } else if (key === 'ArrowLeft') {
      event.preventDefault();
      if (seg === 1) this.boxes()[0]?.nativeElement.focus();
    } else if (key !== 'Tab') {
      event.preventDefault();
    }
  }

  private set(seg: Segment, n: number): void {
    const parts = [...this.parts()];
    parts[seg] = n;
    const value = `${pad(parts[0])}:${pad(parts[1])}`;
    if (value === this.value()) return;
    this.value.set(value);
    this.onChange(value);
  }

  writeValue(v: string | null | undefined): void {
    const [h, m] = parse(v ?? '');
    this.value.set(`${pad(h)}:${pad(m)}`);
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}

function parse(value: string): [number, number] {
  const match = /^(\d{1,2}):(\d{1,2})$/.exec((value ?? '').trim());
  if (!match) return [0, 0];
  return [Math.min(+match[1], MAX[0]), Math.min(+match[2], MAX[1])];
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
