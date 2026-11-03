import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NaProgress } from './data';

@Component({
  standalone: true,
  imports: [NaProgress],
  template: `<na-progress variant="ring" [value]="value()" tone="danger" [size]="120"><b>06:30</b></na-progress>`,
})
class RingHost {
  value = signal(40);
}

describe('NaProgress ring', () => {
  it('draws the clamped value as the ring dash and projects the label', () => {
    const f = TestBed.createComponent(RingHost);
    f.detectChanges();
    const host: HTMLElement = f.nativeElement;
    const ring = host.querySelector<HTMLElement>('.na-progress-ring')!;
    expect(ring.getAttribute('role')).toBe('progressbar');
    expect(ring.classList).toContain('na-progress--danger');
    expect(ring.style.width).toBe('120px');
    expect(host.querySelector('.na-progress-ring__fill')?.getAttribute('stroke-dasharray')).toBe('40 100');
    expect(host.querySelector('.na-progress-ring__label')?.textContent).toContain('06:30');

    f.componentInstance.value.set(180);
    f.detectChanges();
    expect(ring.getAttribute('aria-valuenow')).toBe('100');
    expect(host.querySelector('.na-progress-ring__fill')?.getAttribute('stroke-dasharray')).toBe('100 100');
  });

  it('keeps the bar as the default', () => {
    const f = TestBed.createComponent(NaProgress);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.na-progress__fill')).not.toBeNull();
    expect(f.nativeElement.querySelector('.na-progress-ring')).toBeNull();
  });
});
