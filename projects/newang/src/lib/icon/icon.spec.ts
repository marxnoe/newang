import { TestBed } from '@angular/core/testing';
import { NaIcon } from './icon';

describe('NaIcon', () => {
  it('renders the requested glyph as a decorative SVG by default', () => {
    const f = TestBed.createComponent(NaIcon);
    f.componentRef.setInput('name', 'inbox');
    f.detectChanges();
    const svg = f.nativeElement.querySelector('svg');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('role')).toBe(null);
    expect(svg.querySelectorAll('path').length).toBeGreaterThan(1);
  });

  it('accepts a label, tone and numeric string size', () => {
    const f = TestBed.createComponent(NaIcon);
    f.componentRef.setInput('name', 'check');
    f.componentRef.setInput('label', 'Done');
    f.componentRef.setInput('tone', 'success');
    f.componentRef.setInput('size', '32');
    f.detectChanges();
    const svg = f.nativeElement.querySelector('svg');
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Done');
    expect(svg.getAttribute('width')).toBe('32');
    expect(svg.classList.contains('na-icon--success')).toBe(true);
  });

  it('spinner glyph opts into rotation', () => {
    const f = TestBed.createComponent(NaIcon);
    f.componentRef.setInput('name', 'spinner');
    f.detectChanges();
    expect(f.nativeElement.querySelector('svg').classList.contains('na-icon--spin')).toBe(true);
  });
});
