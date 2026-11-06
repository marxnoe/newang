import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NaLikeButton } from './like-button';

describe('NaLikeButton', () => {
  let fixture: ComponentFixture<NaLikeButton>;
  let button: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NaLikeButton] }).compileComponents();
    fixture = TestBed.createComponent(NaLikeButton);
    fixture.componentRef.setInput('count', 4);
    fixture.detectChanges();
    button = fixture.nativeElement.querySelector('button.na-like');
  });

  it('shows the count and an accessible name', () => {
    expect(button.textContent?.trim()).toBe('4');
    expect(button.getAttribute('aria-label')).toBe('Like (4)');
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('toggles liked and emits the new value', () => {
    const seen: boolean[] = [];
    fixture.componentInstance.liked.subscribe((v) => seen.push(v));
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.classList.contains('na-like--on')).toBe(true);
    button.click();
    fixture.detectChanges();
    expect(seen).toEqual([true, false]);
  });

  it('does nothing while disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    button.click();
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
    expect(fixture.componentInstance.liked()).toBe(false);
  });
});
