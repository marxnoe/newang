import { TestBed } from '@angular/core/testing';
import { NaCodeInput } from './code-input';

function setup(inputs: Record<string, unknown> = {}) {
  const f = TestBed.createComponent(NaCodeInput);
  for (const [k, v] of Object.entries(inputs)) f.componentRef.setInput(k, v);
  f.detectChanges();
  const host: HTMLElement = f.nativeElement;
  const boxes = () => Array.from(host.querySelectorAll<HTMLInputElement>('.na-code-input__box'));
  return { f, host, boxes };
}

function type(box: HTMLInputElement, text: string) {
  box.value = text;
  box.dispatchEvent(new Event('input'));
}

function key(box: HTMLInputElement, k: string) {
  box.dispatchEvent(new KeyboardEvent('keydown', { key: k, cancelable: true }));
}

describe('NaCodeInput', () => {
  it('renders one box per character', () => {
    const { boxes } = setup({ length: 5 });
    expect(boxes().length).toBe(5);
    expect(boxes()[0].getAttribute('autocomplete')).toBe('one-time-code');
  });

  it('uppercases, drops invalid characters and advances focus', () => {
    const { f, boxes } = setup({ length: 4 });
    type(boxes()[0], 'k');
    f.detectChanges();
    type(boxes()[1], '-');
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('K');
    expect(boxes()[1].value).toBe('');
    expect(document.activeElement).toBe(boxes()[1]);
  });

  it('spreads a paste across the boxes and emits completed', () => {
    const { f, boxes } = setup({ length: 5 });
    const done: string[] = [];
    f.componentInstance.completed.subscribe((v) => done.push(v));
    const paste = new Event('paste', { cancelable: true }) as ClipboardEvent;
    Object.defineProperty(paste, 'clipboardData', { value: { getData: () => ' k7q-x2 ' } });
    boxes()[0].dispatchEvent(paste);
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('K7QX2');
    expect(boxes().map((b) => b.value).join('')).toBe('K7QX2');
    expect(done).toEqual(['K7QX2']);
  });

  it('handles autofill of the whole code into the first box', () => {
    const { f, boxes } = setup({ length: 6, charset: 'numeric' });
    type(boxes()[0], '12a3456');
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('123456');
  });

  it('steps back on Backspace in an empty box', () => {
    const { f, boxes } = setup({ length: 4, value: 'AB' });
    boxes()[2].focus();
    key(boxes()[2], 'Backspace');
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('A');
    expect(document.activeElement).toBe(boxes()[1]);
  });

  it('replaces the character in a filled box', () => {
    const { f, boxes } = setup({ length: 3, value: 'ABC' });
    type(boxes()[1], 'BZ');
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('AZC');
  });

  it('works as a form control', () => {
    const { f, boxes } = setup({ length: 3 });
    const seen: string[] = [];
    f.componentInstance.registerOnChange((v) => seen.push(v));
    f.componentInstance.writeValue('x9');
    f.componentInstance.setDisabledState(true);
    f.detectChanges();
    expect(boxes()[0].value).toBe('X');
    expect(boxes().every((b) => b.disabled)).toBe(true);
    expect(seen).toEqual([]);
  });
});
