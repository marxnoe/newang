import { TestBed } from '@angular/core/testing';
import { NaSkeleton } from './skeleton';

describe('NaSkeleton', () => {
  it('renders lines and exposes a status label only when provided', () => {
    const f = TestBed.createComponent(NaSkeleton);
    f.componentRef.setInput('lines', 3);
    f.componentRef.setInput('height', 20);
    f.detectChanges();
    const host: HTMLElement = f.nativeElement;
    expect(host.querySelectorAll('.na-skeleton__shape').length).toBe(3);
    expect(host.querySelector('.na-skeleton')?.getAttribute('aria-hidden')).toBe('true');

    f.componentRef.setInput('label', 'Loading invoices');
    f.detectChanges();
    expect(host.querySelector('.na-skeleton')?.getAttribute('role')).toBe('status');
    expect(host.querySelector('.na-skeleton')?.getAttribute('aria-label')).toBe('Loading invoices');
  });

  it('renders a circle using the height as its size', () => {
    const f = TestBed.createComponent(NaSkeleton);
    f.componentRef.setInput('circle', true);
    f.componentRef.setInput('height', 40);
    f.detectChanges();
    const shape = (f.nativeElement as HTMLElement).querySelector<HTMLElement>('.na-skeleton__shape')!;
    expect(shape.classList).toContain('na-skeleton__shape--circle');
    expect(shape.style.width).toBe('40px');
  });

  it('normalizes numeric widths to pixels', () => {
    const f = TestBed.createComponent(NaSkeleton);
    f.componentRef.setInput('width', 120);
    f.detectChanges();
    const shape = (f.nativeElement as HTMLElement).querySelector<HTMLElement>('.na-skeleton__shape')!;
    expect(shape.style.width).toBe('120px');
  });
});
