import { ChangeDetectionStrategy, Component, booleanAttribute, forwardRef, input, model, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextRadioGroupId = 0;

export interface NaRadioOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export type NaRadioOrientation = 'vertical' | 'inline';
export type NaRadioVariant = 'default' | 'segmented';

/**
 * Radio group driven by an `options` input. Binds via `[(value)]` or `formControl`:
 * `<na-radio-group label="Plan" [options]="[{value:'free',label:'Free'},{value:'pro',label:'Pro'}]" />`
 *
 * Use `orientation="inline"` for a wrapping row and `variant="segmented"` for
 * compact 2–3 way toggles. Set `disabled` per option where needed.
 */
@Component({
  selector: 'na-radio-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './radio.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NaRadioGroup), multi: true },
  ],
  template: `
    <div class="na-radio-group" role="radiogroup" [attr.aria-label]="label()">
      @if (label()) {
        <p class="na-radio-group__label">{{ label() }}</p>
      }
      <div
        class="na-radio-group__options na-radio-group__options--{{ orientation() }} na-radio-group__options--{{ variant() }}"
      >
        @for (opt of options(); track opt.value) {
          <label
            class="na-radio"
            [class.na-radio--disabled]="disabled() || cvaDisabled() || !!opt.disabled"
          >
            <input
              type="radio"
              class="na-radio__input"
              [name]="groupName()"
              [value]="opt.value"
              [checked]="value() === opt.value"
              [disabled]="disabled() || cvaDisabled() || !!opt.disabled"
              (change)="pick(opt.value)"
              (blur)="onTouched()"
            />
            <span class="na-radio__dot" aria-hidden="true"></span>
            <span class="na-radio__label">{{ opt.label }}</span>
          </label>
        }
      </div>
    </div>
  `,
})
export class NaRadioGroup implements ControlValueAccessor {
  readonly label = input('');
  readonly options = input<NaRadioOption[]>([]);
  readonly value = model<string | number | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly orientation = input<NaRadioOrientation>('vertical');
  readonly variant = input<NaRadioVariant>('default');
  private readonly cvaDisabled = signal(false);
  // Deterministic per-instance fallback (module counter) so SSR and client
  // renders generate matching `name` values in the same tree order.
  readonly groupName = input(`na-radio-${++nextRadioGroupId}`);

  private onChange: (v: unknown) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  pick(v: string | number): void {
    this.value.set(v);
    this.onChange(v);
  }

  writeValue(v: string | number | undefined): void {
    this.value.set(v);
  }
  registerOnChange(fn: (v: unknown) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
