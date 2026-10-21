import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

/**
 * Inline confirmation bubble around a projected trigger.
 *
 * `<na-popconfirm message="Delete this?" (confirmed)="remove()"><na-button>Delete</na-button></na-popconfirm>`
 */
@Component({
  selector: 'na-popconfirm',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './popconfirm.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(window:keydown)': 'onWindowKeydown($event)',
  },
  template: `
    <div class="na-popconfirm">
      <span class="na-popconfirm__trigger" (click)="toggle()"><ng-content /></span>
      @if (open()) {
        <div class="na-popconfirm__bubble" role="alertdialog" [attr.aria-label]="message()">
          <p class="na-popconfirm__message">{{ message() }}</p>
          <div class="na-popconfirm__actions">
            <button
              type="button"
              class="na-popconfirm__button na-popconfirm__button--cancel"
              (click)="cancel()"
            >
              {{ cancelLabel() }}
            </button>
            <button
              #confirmButton
              type="button"
              class="na-popconfirm__button na-popconfirm__button--confirm"
              (click)="confirm()"
            >
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class NaPopconfirm {
  readonly message = input('Are you sure?');
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  readonly open = signal(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');

  toggle(): void {
    if (this.disabled()) return;
    if (this.open()) {
      this.close();
    } else {
      this.open.set(true);
      setTimeout(() => this.confirmButton()?.nativeElement.focus());
    }
  }

  confirm(): void {
    this.open.set(false);
    this.confirmed.emit();
  }

  cancel(): void {
    this.open.set(false);
    this.cancelled.emit();
  }

  onDocumentClick(event: Event): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  onWindowKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open()) this.close();
  }

  private close(): void {
    this.open.set(false);
  }
}
