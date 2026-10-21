import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NaDropdown, NaDropdownItem } from './dropdown';

@Component({
  standalone: true,
  imports: [NaDropdown],
  template: `<na-dropdown
    label="Actions"
    [items]="items"
    (selected)="chosen = $event"
  />`,
})
class DropdownHost {
  readonly items: NaDropdownItem[] = [
    { label: 'Edit', value: 'edit' },
    { label: 'Delete', value: 'delete', danger: true },
    { label: 'Archive', value: 'archive', disabled: true },
  ];
  chosen: NaDropdownItem | null = null;
}

describe('NaDropdown', () => {
  it('opens, selects an item and closes', async () => {
    await TestBed.configureTestingModule({ imports: [DropdownHost] }).compileComponents();
    const f = TestBed.createComponent(DropdownHost);
    f.detectChanges();
    const host: HTMLElement = f.nativeElement;
    const trigger = host.querySelector<HTMLButtonElement>('.na-dropdown__trigger')!;

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    trigger.click();
    f.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelectorAll('[role="menuitem"]').length).toBe(3);
    expect(host.querySelectorAll('[role="menuitem"]')[2].hasAttribute('disabled')).toBe(true);

    host.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')[1].click();
    f.detectChanges();
    expect(f.componentInstance.chosen?.value).toBe('delete');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on Escape or an outside click', async () => {
    await TestBed.configureTestingModule({ imports: [DropdownHost] }).compileComponents();
    const f = TestBed.createComponent(DropdownHost);
    f.detectChanges();
    const host: HTMLElement = f.nativeElement;
    const trigger = host.querySelector<HTMLButtonElement>('.na-dropdown__trigger')!;

    trigger.click();
    f.detectChanges();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    f.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    trigger.click();
    f.detectChanges();
    document.body.click();
    f.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens from the keyboard and closes from a menu item', async () => {
    await TestBed.configureTestingModule({ imports: [DropdownHost] }).compileComponents();
    const f = TestBed.createComponent(DropdownHost);
    f.detectChanges();
    const host: HTMLElement = f.nativeElement;
    const trigger = host.querySelector<HTMLButtonElement>('.na-dropdown__trigger')!;

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    f.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    host
      .querySelector<HTMLButtonElement>('[role="menuitem"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    f.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});
