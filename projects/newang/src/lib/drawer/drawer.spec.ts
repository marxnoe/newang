import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NaDrawer } from './drawer';

@Component({
  standalone: true,
  imports: [NaDrawer],
  template: `<na-drawer
    title="Filters"
    position="left"
    [open]="open()"
    (closed)="open.set(false)"
  >
    <p>Drawer body</p>
  </na-drawer>`,
})
class DrawerHost {
  readonly open = signal(true);
}

describe('NaDrawer', () => {
  it('renders a side panel and closes from the backdrop or Escape', async () => {
    await TestBed.configureTestingModule({ imports: [DrawerHost] }).compileComponents();
    const f = TestBed.createComponent(DrawerHost);
    f.detectChanges();
    const host: HTMLElement = f.nativeElement;

    const panel = host.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(panel.classList).toContain('na-drawer__panel--left');
    expect(panel.getAttribute('aria-label')).toBe('Filters');
    expect(panel.textContent).toContain('Drawer body');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    f.detectChanges();
    expect(host.querySelector('[role="dialog"]')).toBeNull();

    f.componentInstance.open.set(true);
    f.detectChanges();
    host.querySelector<HTMLElement>('.na-drawer__overlay')!.click();
    f.detectChanges();
    expect(host.querySelector('[role="dialog"]')).toBeNull();
  });
});
