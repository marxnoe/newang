import { TestBed } from '@angular/core/testing';
import { NaRadioGroup } from './radio';

describe('NaRadioGroup', () => {
  it('supports inline and segmented layouts with per-option disabled', () => {
    const f = TestBed.createComponent(NaRadioGroup);
    f.componentRef.setInput('options', [
      { value: 'file', label: 'File' },
      { value: 'url', label: 'URL' },
      { value: 'youtube', label: 'YouTube', disabled: true },
    ]);
    f.componentRef.setInput('orientation', 'inline');
    f.componentRef.setInput('variant', 'segmented');
    f.detectChanges();
    const host: HTMLElement = f.nativeElement;
    const options = host.querySelector('.na-radio-group__options');
    expect(options?.classList.contains('na-radio-group__options--inline')).toBe(true);
    expect(options?.classList.contains('na-radio-group__options--segmented')).toBe(true);
    const inputs = host.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(inputs[0].disabled).toBe(false);
    expect(inputs[2].disabled).toBe(true);
    expect(host.querySelectorAll('.na-radio')[2].classList.contains('na-radio--disabled')).toBe(true);
  });

  it('still binds a picked value through the model', () => {
    const f = TestBed.createComponent(NaRadioGroup);
    f.componentRef.setInput('options', [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
    f.detectChanges();
    const host: HTMLElement = f.nativeElement;
    const inputs = host.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    inputs[1].click();
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('b');
  });
});
