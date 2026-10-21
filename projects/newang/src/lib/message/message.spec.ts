import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NaMessage, NaNotification } from './message';

describe('NaMessage', () => {
  let messages: NaMessage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    messages = TestBed.inject(NaMessage);
  });

  afterEach(() => {
    messages.clear();
    document.querySelector('.na-message-stack')?.remove();
    vi.useRealTimers();
  });

  it('creates a dismissible aria-live message', () => {
    const id = messages.success('Saved');
    const stack = document.querySelector<HTMLElement>('.na-message-stack')!;
    const item = stack.querySelector<HTMLElement>('[role="status"]')!;

    expect(stack.getAttribute('aria-live')).toBe('polite');
    expect(item.textContent).toContain('Saved');
    expect(item.classList).toContain('na-message--success');
    expect(item.querySelector('.na-message__close')).toBeTruthy();

    item.querySelector<HTMLButtonElement>('.na-message__close')!.click();
    expect(document.querySelector('.na-message-stack')).toBeNull();
    messages.dismiss(id);
  });

  it('auto-dismisses after the requested duration', () => {
    vi.useFakeTimers();
    messages.warning('Careful', { duration: 100 });
    expect(document.querySelector('.na-message-stack')).toBeTruthy();

    vi.advanceTimersByTime(100);
    expect(document.querySelector('.na-message-stack')).toBeNull();
  });

  it('renders the notification variant with a title', () => {
    const notifications = TestBed.inject(NaNotification);
    notifications.success('Export ready', { title: 'Downloads' });
    const item = document.querySelector<HTMLElement>('.na-message')!;

    expect(item.classList).toContain('na-message--notification');
    expect(item.querySelector('.na-message__title')?.textContent).toContain('Downloads');
    expect(item.textContent).toContain('Export ready');
  });
});
