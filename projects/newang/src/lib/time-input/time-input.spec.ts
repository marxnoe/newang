import { TestBed } from '@angular/core/testing';
import { NaTimeInput } from './time-input';

function setup(inputs: Record<string, unknown> = {}) {
  const f = TestBed.createComponent(NaTimeInput);
  for (const [k, v] of Object.entries(inputs)) f.componentRef.setInput(k, v);
  f.detectChanges();
  const host: HTMLElement = f.nativeElement;
  const segs = () => Array.from(host.querySelectorAll<HTMLInputElement>('.na-time-input__segment'));
  return { f, host, segs };
}

function key(el: HTMLInputElement, k: string) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, cancelable: true }));
}

describe('NaTimeInput', () => {
  it('renders hours and minutes from the value', () => {
    const { segs } = setup({ value: '9:05' });
    expect(segs().map((s) => s.value)).toEqual(['09', '05']);
  });

  it('shifts typed digits in from the right and clamps', () => {
    const { f, segs } = setup({ value: '09:00' });
    const [h] = segs();
    h.focus();
    f.detectChanges();
    key(h, '1');
    key(h, '7');
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('17:00');
    expect(h.value).toBe('17');
    key(h, '9');
    f.detectChanges();
    expect(h.value).toBe('79');
    expect(f.componentInstance.value()).toBe('23:00');
    h.blur();
    f.detectChanges();
    expect(h.value).toBe('23');
  });

  it('does not auto-advance after a segment is complete', () => {
    const { f, segs } = setup();
    const [h] = segs();
    h.focus();
    key(h, '1');
    key(h, '2');
    f.detectChanges();
    expect(document.activeElement).toBe(h);
  });

  it('steps with arrows, clears with Backspace and moves with ArrowRight', () => {
    const { f, segs } = setup({ value: '10:59' });
    const [h, m] = segs();
    m.focus();
    key(m, 'ArrowUp');
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('10:59');
    key(m, 'ArrowDown');
    key(m, 'Backspace');
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('10:00');
    h.focus();
    key(h, 'ArrowRight');
    expect(document.activeElement).toBe(m);
  });

  it('works as a form control', () => {
    const { f, segs } = setup();
    const changes: string[] = [];
    f.componentInstance.registerOnChange((v) => changes.push(v));
    f.componentInstance.writeValue('7:3');
    f.componentInstance.setDisabledState(true);
    f.detectChanges();
    expect(segs().map((s) => s.value)).toEqual(['07', '03']);
    expect(segs()[0].disabled).toBe(true);
    f.componentInstance.setDisabledState(false);
    f.detectChanges();
    segs()[1].focus();
    key(segs()[1], '4');
    expect(changes).toEqual(['07:34']);
  });
});
