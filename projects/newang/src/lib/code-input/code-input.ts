import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type NaCodeInputCharset = 'alphanumeric' | 'numeric';

/**
 * Segmented code entry: one box per character, for share codes, PINs and
 * one-time codes. Typing advances, Backspace on an empty box steps back,
 * paste and SMS autofill spread across the boxes.
 *
 * `<na-code-input [length]="5" label="Share code" [(value)]="code" (completed)="open($event)" />`
 */
@Component({
  selector: 'na-code-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './code-input.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NaCodeInput), multi: true },
  ],
  template: `
    <div class="na-code-input" role="group" [attr.aria-label]="label() || null">
      @for (slot of slots(); track $index) {
        <input
          #box
          class="na-code-input__box"
          type="text"
          [attr.inputmode]="charset() === 'numeric' ? 'numeric' : 'text'"
          [attr.autocomplete]="$index === 0 ? 'one-time-code' : 'off'"
          autocapitalize="characters"
          spellcheck="false"
          [attr.aria-label]="'Character ' + ($index + 1) + ' of ' + slots().length"
          [attr.aria-invalid]="invalid() ? 'true' : null"
          [value]="slot"
          [disabled]="disabled() || cvaDisabled()"
          (input)="onInput($index, $event)"
          (keydown)="onKeydown($index, $event)"
          (paste)="onPaste($index, $event)"
          (focus)="select($index)"
          (blur)="onTouched()"
        />
      }
    </div>
  `,
})
export class NaCodeInput implements ControlValueAccessor {
  readonly length = input(6, { transform: numberAttribute });
  readonly charset = input<NaCodeInputCharset>('alphanumeric');
  readonly uppercase = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Paints the danger border on every box, e.g. after a wrong code. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Accessible name for the group of boxes. */
  readonly label = input('');
  readonly value = model('');
  /** Emits the full code once every box is filled. */
  readonly completed = output<string>();

  private readonly boxes = viewChildren<ElementRef<HTMLInputElement>>('box');
  protected readonly cvaDisabled = signal(false);
  protected readonly slots = computed(() => {
    const chars = this.clean(this.value()).split('');
    return Array.from({ length: this.length() }, (_, i) => chars[i] ?? '');
  });

  private onChange: (v: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  /** Focuses the first empty box (or the last one when full). */
  focus(): void {
    const index = Math.min(this.clean(this.value()).length, this.length() - 1);
    this.boxes()[index]?.nativeElement.focus();
  }

  clear(): void {
    this.commit('');
    this.boxes()[0]?.nativeElement.focus();
  }

  protected onInput(index: number, event: Event): void {
    const box = event.target as HTMLInputElement;
    const previous = this.slots()[index];
    let typed = this.clean(box.value);
    // Re-sync the box: rejected characters must not linger in the DOM.
    box.value = previous;
    // Typing next to an existing character yields two; keep only the new one.
    if (previous && typed.length === 2) {
      typed = typed.startsWith(previous) ? typed.slice(1) : typed.slice(0, 1);
    }
    if (typed) this.fill(index, typed);
  }

  protected onPaste(index: number, event: ClipboardEvent): void {
    event.preventDefault();
    const text = this.clean(event.clipboardData?.getData('text') ?? '');
    if (text) this.fill(index, text);
  }

  protected onKeydown(index: number, event: KeyboardEvent): void {
    const slots = this.slots();
    if (event.key === 'Backspace') {
      event.preventDefault();
      const target = slots[index] ? index : Math.max(0, index - 1);
      this.commit(this.join(slots.map((c, i) => (i === target ? '' : c))));
      this.move(target);
    } else if (event.key === 'Delete') {
      event.preventDefault();
      this.commit(this.join(slots.map((c, i) => (i === index ? '' : c))));
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.move(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.move(index + 1);
    }
  }

  protected select(index: number): void {
    // Never leave a gap: focusing past the first empty box jumps back to it.
    const firstEmpty = this.slots().indexOf('');
    if (firstEmpty !== -1 && index > firstEmpty) {
      this.move(firstEmpty);
      return;
    }
    this.boxes()[index]?.nativeElement.select();
  }

  /** Writes `chars` starting at `index`, then focuses the next box. */
  private fill(index: number, chars: string): void {
    const slots = [...this.slots()];
    const start = Math.min(index, this.clean(this.value()).length);
    chars.split('').forEach((c, i) => {
      if (start + i < slots.length) slots[start + i] = c;
    });
    const value = this.join(slots);
    this.commit(value);
    this.move(Math.min(start + chars.length, this.length() - 1));
    if (value.length === this.length()) this.completed.emit(value);
  }

  private move(index: number): void {
    const box = this.boxes()[Math.max(0, Math.min(index, this.length() - 1))]?.nativeElement;
    box?.focus();
    box?.select();
  }

  private commit(value: string): void {
    if (value === this.value()) return;
    this.value.set(value);
    this.onChange(value);
  }

  private join(slots: string[]): string {
    return slots.join('');
  }

  private clean(raw: string): string {
    const pattern = this.charset() === 'numeric' ? /[^0-9]/g : /[^0-9a-z]/gi;
    const text = (raw ?? '').replace(pattern, '');
    return (this.uppercase() ? text.toUpperCase() : text).slice(0, this.length());
  }

  writeValue(v: string | null | undefined): void {
    this.value.set(this.clean(v ?? ''));
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
