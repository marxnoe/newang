import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NaTab, NaTabs } from './tabs';

@Component({
  standalone: true,
  imports: [NaTabs, NaTab],
  template: `
    <na-tabs [(active)]="active" [(activeId)]="activeId">
      <na-tab id="upload" title="Upload">
        <input id="kept" />
      </na-tab>
      <na-tab id="youtube" title="YouTube">YouTube panel</na-tab>
    </na-tabs>
  `,
})
class ProjectedHost {
  readonly active = signal(0);
  readonly activeId = signal<string | number | null>(null);
}

describe('NaTabs', () => {
  it('keeps projected content mounted and toggles visibility by stable id', async () => {
    await TestBed.configureTestingModule({ imports: [ProjectedHost] }).compileComponents();
    const f = TestBed.createComponent(ProjectedHost);
    f.detectChanges();
    const host: HTMLElement = f.nativeElement;
    const buttons = host.querySelectorAll<HTMLButtonElement>('button[role="tab"]');
    expect(buttons.length).toBe(2);
    expect(buttons[0].id).toBe('na-tab-upload-button');
    expect(buttons[0].getAttribute('aria-controls')).toBe('na-tab-upload-panel');
    expect(host.querySelector('#na-tab-upload-panel')?.hasAttribute('hidden')).toBe(false);
    expect(host.querySelector('#na-tab-youtube-panel')?.hasAttribute('hidden')).toBe(true);
    expect(host.querySelector('#kept')).toBeTruthy();

    buttons[1].click();
    f.detectChanges();
    expect(f.componentInstance.active()).toBe(1);
    expect(f.componentInstance.activeId()).toBe('youtube');
    expect(host.querySelector('#na-tab-upload-panel')?.hasAttribute('hidden')).toBe(true);
    expect(host.querySelector('#na-tab-youtube-panel')?.hasAttribute('hidden')).toBe(false);
    // Hidden, not destroyed — form state survives.
    expect(host.querySelector('#kept')).toBeTruthy();
  });

  it('selects a projected tab programmatically by stable id', async () => {
    await TestBed.configureTestingModule({ imports: [ProjectedHost] }).compileComponents();
    const f = TestBed.createComponent(ProjectedHost);
    f.detectChanges();
    f.componentInstance.activeId.set('youtube');
    f.detectChanges();
    const host: HTMLElement = f.nativeElement;
    expect(host.querySelector('#na-tab-youtube-panel')?.hasAttribute('hidden')).toBe(false);
    expect(host.querySelector('#na-tab-upload-panel')?.hasAttribute('hidden')).toBe(true);
  });

  it('keeps the index-based labels API working', () => {
    const f = TestBed.createComponent(NaTabs);
    f.componentRef.setInput('tabs', ['One', 'Two']);
    f.componentRef.setInput('active', 1);
    f.detectChanges();
    const host: HTMLElement = f.nativeElement;
    const buttons = host.querySelectorAll<HTMLButtonElement>('button[role="tab"]');
    expect(buttons[1].getAttribute('aria-selected')).toBe('true');
    buttons[0].click();
    f.detectChanges();
    expect(f.componentInstance.active()).toBe(0);
  });
});
