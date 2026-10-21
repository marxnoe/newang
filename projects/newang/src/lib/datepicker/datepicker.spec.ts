import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { NaDatepicker } from './datepicker';

@Component({
  standalone: true,
  imports: [NaDatepicker, ReactiveFormsModule],
  template: `<form [formGroup]="form">
    <na-datepicker
      label="Start date"
      hint="Native picker"
      min="2026-01-01"
      formControlName="date"
    />
  </form>`,
})
class DatepickerHost {
  readonly form = new FormGroup({ date: new FormControl<string | Date>('') });
}

describe('NaDatepicker', () => {
  it('bridges native date input values through the control value accessor', async () => {
    await TestBed.configureTestingModule({ imports: [DatepickerHost] }).compileComponents();
    const f = TestBed.createComponent(DatepickerHost);
    f.detectChanges();
    const host: HTMLElement = f.nativeElement;
    const input = host.querySelector<HTMLInputElement>('input[type="date"]')!;

    expect(input.min).toBe('2026-01-01');
    expect(host.textContent).toContain('Start date');

    f.componentInstance.form.controls.date.setValue(new Date(2026, 0, 2));
    f.detectChanges();
    expect(input.value).toBe('2026-01-02');

    input.value = '2026-03-04';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    f.detectChanges();
    expect(f.componentInstance.form.value.date).toBe('2026-03-04');
  });

  it('renders an error and exposes the disabled state', () => {
    const f = TestBed.createComponent(NaDatepicker);
    f.componentRef.setInput('error', 'Required');
    f.componentRef.setInput('disabled', true);
    f.detectChanges();
    const host: HTMLElement = f.nativeElement;
    const input = host.querySelector<HTMLInputElement>('input')!;
    expect(input.disabled).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('Required');
  });
});
