import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NaPopconfirm } from './popconfirm';

@Component({
  standalone: true,
  imports: [NaPopconfirm],
  template: `<na-popconfirm
    message="Delete this item?"
    confirmLabel="Delete"
    (confirmed)="confirmed = confirmed + 1"
    (cancelled)="cancelled = cancelled + 1"
  >
    <button class="trigger" type="button">Delete</button>
  </na-popconfirm>`,
})
class PopconfirmHost {
  confirmed = 0;
  cancelled = 0;
}

describe('NaPopconfirm', () => {
  it('opens from the projected trigger and confirms or cancels', async () => {
    await TestBed.configureTestingModule({ imports: [PopconfirmHost] }).compileComponents();
    const f = TestBed.createComponent(PopconfirmHost);
    f.detectChanges();
    const host: HTMLElement = f.nativeElement;
    const trigger = host.querySelector<HTMLButtonElement>('.trigger')!;

    trigger.click();
    f.detectChanges();
    const bubble = host.querySelector('[role="alertdialog"]')!;
    expect(bubble.textContent).toContain('Delete this item?');

    host.querySelector<HTMLButtonElement>('.na-popconfirm__button--confirm')!.click();
    f.detectChanges();
    expect(f.componentInstance.confirmed).toBe(1);
    expect(host.querySelector('[role="alertdialog"]')).toBeNull();

    trigger.click();
    f.detectChanges();
    host.querySelector<HTMLButtonElement>('.na-popconfirm__button--cancel')!.click();
    f.detectChanges();
    expect(f.componentInstance.cancelled).toBe(1);
    expect(host.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('closes with Escape and outside clicks', async () => {
    await TestBed.configureTestingModule({ imports: [PopconfirmHost] }).compileComponents();
    const f = TestBed.createComponent(PopconfirmHost);
    f.detectChanges();
    const host: HTMLElement = f.nativeElement;
    const trigger = host.querySelector<HTMLButtonElement>('.trigger')!;

    trigger.click();
    f.detectChanges();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    f.detectChanges();
    expect(host.querySelector('[role="alertdialog"]')).toBeNull();

    trigger.click();
    f.detectChanges();
    document.body.click();
    f.detectChanges();
    expect(host.querySelector('[role="alertdialog"]')).toBeNull();
  });
});
