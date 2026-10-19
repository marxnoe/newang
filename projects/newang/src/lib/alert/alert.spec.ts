import { TestBed } from '@angular/core/testing';
import { NaAlert } from './alert';

describe('NaAlert', () => {
  it('renders tone icon and description', () => {
    const f = TestBed.createComponent(NaAlert);
    f.componentRef.setInput('tone', 'warning');
    f.componentRef.setInput('title', 'Careful');
    f.componentRef.setInput('description', 'Check the file type first.');
    f.componentRef.setInput('showIcon', true);
    f.detectChanges();
    const host: HTMLElement = f.nativeElement;
    expect(host.querySelector('.na-alert--warning .na-alert__icon svg')).toBeTruthy();
    expect(host.querySelector('.na-alert__description')?.textContent).toBe('Check the file type first.');
  });

  it('uses an explicit icon and spacing contract for the body', () => {
    const f = TestBed.createComponent(NaAlert);
    f.componentRef.setInput('icon', 'inbox');
    f.detectChanges();
    expect(f.nativeElement.querySelector('.na-alert__icon svg')).toBeTruthy();
    expect(f.nativeElement.querySelector('.na-alert__body')).toBeTruthy();
  });

  it('closes itself and emits once', () => {
    const f = TestBed.createComponent(NaAlert);
    f.componentRef.setInput('title', 'Dismiss me');
    f.componentRef.setInput('closable', true);
    f.detectChanges();
    let closed = 0;
    f.componentInstance.closed.subscribe(() => closed++);
    const button = f.nativeElement.querySelector('.na-alert__close') as HTMLButtonElement;
    button.click();
    f.detectChanges();
    expect(closed).toBe(1);
    expect(f.nativeElement.querySelector('.na-alert')).toBe(null);
    f.componentInstance.close();
    expect(closed).toBe(1);
  });
});
