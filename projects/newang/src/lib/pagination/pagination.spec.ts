import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NaPagination } from './pagination';

@Component({
  standalone: true,
  imports: [NaPagination],
  template: `<na-pagination
    [total]="total()"
    [pageSize]="10"
    [page]="page()"
    (pageChange)="page.set($event); changes.push($event)"
  />`,
})
class PaginationHost {
  readonly total = signal(200);
  readonly page = signal(10);
  readonly changes: number[] = [];
}

describe('NaPagination', () => {
  it('renders a bounded window and emits page changes', async () => {
    await TestBed.configureTestingModule({ imports: [PaginationHost] }).compileComponents();
    const f = TestBed.createComponent(PaginationHost);
    f.detectChanges();
    const host: HTMLElement = f.nativeElement;

    const buttons = [...host.querySelectorAll<HTMLButtonElement>('.na-pagination__button')];
    const pageButtons = buttons.filter((button) => button.getAttribute('aria-label')?.startsWith('Page '));
    expect(pageButtons.map((button) => button.textContent?.trim())).toEqual(['1', '9', '10', '11', '20']);
    expect(host.querySelectorAll('.na-pagination__ellipsis').length).toBe(2);
    expect(host.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('10');

    pageButtons.find((button) => button.textContent?.trim() === '11')!.click();
    f.detectChanges();
    expect(f.componentInstance.page()).toBe(11);
    expect(f.componentInstance.changes).toEqual([11]);
    expect(host.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('11');
  });

  it('disables every control when requested', async () => {
    const f = TestBed.createComponent(NaPagination);
    f.componentRef.setInput('total', 50);
    f.componentRef.setInput('disabled', true);
    f.detectChanges();
    const buttons = [...(f.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')];
    expect(buttons.every((button) => button.disabled)).toBe(true);
  });
});
