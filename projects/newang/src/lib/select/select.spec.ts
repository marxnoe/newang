import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { NaSelect, NaSelectOption } from './select';

@Component({
  standalone: true,
  imports: [NaSelect, ReactiveFormsModule],
  template: `<form [formGroup]="form">
    <na-select
      [options]="plans"
      formControlName="plan"
      placeholder="Pick a plan"
      [ariaLabel]="'Plan'"
    />
  </form>`,
})
class SelectHost {
  readonly plans: NaSelectOption[] = [
    { value: 'basic', label: 'Basic' },
    { value: 'pro', label: 'Pro' },
    { value: 'legacy', label: 'Legacy', disabled: true },
  ];
  readonly form = new FormGroup({ plan: new FormControl<string | number>('basic') });
}

describe('NaSelect', () => {
  it('works as a reactive form control and picks an option', async () => {
    await TestBed.configureTestingModule({ imports: [SelectHost] }).compileComponents();
    const f = TestBed.createComponent(SelectHost);
    f.detectChanges();
    const host: HTMLElement = f.nativeElement;
    const trigger = host.querySelector<HTMLButtonElement>('button[role="combobox"]')!;

    expect(trigger.textContent).toContain('Basic');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    trigger.click();
    f.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelectorAll('[role="option"]').length).toBe(3);
    expect(host.querySelector('[role="option"]')?.getAttribute('aria-selected')).toBe('true');

    host.querySelectorAll<HTMLElement>('[role="option"]')[1].click();
    f.detectChanges();
    expect(f.componentInstance.form.value.plan).toBe('pro');
    expect(trigger.textContent).toContain('Pro');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    f.componentInstance.form.controls.plan.setValue('basic');
    f.detectChanges();
    expect(trigger.textContent).toContain('Basic');
  });

  it('supports keyboard navigation and disabled state', async () => {
    await TestBed.configureTestingModule({ imports: [SelectHost] }).compileComponents();
    const f = TestBed.createComponent(SelectHost);
    f.detectChanges();
    const host: HTMLElement = f.nativeElement;
    const trigger = host.querySelector<HTMLButtonElement>('button[role="combobox"]')!;

    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    f.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    f.detectChanges();
    expect(f.componentInstance.form.value.plan).toBe('pro');

    f.componentInstance.form.disable();
    f.detectChanges();
    expect(trigger.disabled).toBe(true);
  });
});
