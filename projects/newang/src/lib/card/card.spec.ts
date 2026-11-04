import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NaCard } from './card';

@Component({
  standalone: true,
  imports: [NaCard],
  template: `<na-card title="MediaLinker" subtitle="Share files" [href]="href()" target="_blank"
    ><p>Body</p></na-card
  >`,
})
class LinkHost {
  href = signal('https://example.com');
}

describe('NaCard', () => {
  it('renders as a link when href is set', () => {
    const f = TestBed.createComponent(LinkHost);
    f.detectChanges();
    const host: HTMLElement = f.nativeElement;
    const a = host.querySelector<HTMLAnchorElement>('a.na-card')!;
    expect(a.getAttribute('href')).toBe('https://example.com');
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener');
    expect(a.querySelector('.na-card__title')?.textContent).toContain('MediaLinker');
    expect(a.querySelector('.na-card__mark')).not.toBeNull();
    expect(a.querySelector('.na-card__body p')?.textContent).toBe('Body');
    expect(host.querySelector('section')).toBeNull();

    f.componentInstance.href.set('');
    f.detectChanges();
    expect(host.querySelector('a')).toBeNull();
    expect(host.querySelector('section.na-card .na-card__body p')?.textContent).toBe('Body');
  });

  it('stays a plain section by default', () => {
    const f = TestBed.createComponent(NaCard);
    f.detectChanges();
    expect(f.nativeElement.querySelector('section.na-card')).not.toBeNull();
    expect(f.nativeElement.querySelector('.na-card__mark')).toBeNull();
  });
});
