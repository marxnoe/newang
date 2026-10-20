import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  booleanAttribute,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NaIcon } from '../icon/icon';


/** `<na-heading level="1">Title</na-heading>` — size/weight/margins baked in.
 * Content projects through a single shared slot stamped into whichever
 * level renders (multiple `<ng-content>` across switch branches would only
 * ever fill one of them).
 */
@Component({
  selector: 'na-heading',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './typography.scss',
  template: `
    <ng-template #body><ng-content /></ng-template>
    @switch (level()) {
      @case (1) {
        <h1 class="na-h na-h1"><ng-container [ngTemplateOutlet]="body" /></h1>
      }
      @case (3) {
        <h3 class="na-h na-h3"><ng-container [ngTemplateOutlet]="body" /></h3>
      }
      @case (4) {
        <h4 class="na-h na-h4"><ng-container [ngTemplateOutlet]="body" /></h4>
      }
      @default {
        <h2 class="na-h na-h2"><ng-container [ngTemplateOutlet]="body" /></h2>
      }
    }
  `,
})
export class NaHeading {
  // Accepts `level="1"` (string) as well as `[level]="1"` — coerced to 1-4.
  readonly level = input<1 | 2 | 3 | 4>(2, {
    transform: (v: unknown): 1 | 2 | 3 | 4 => {
      const n = numberAttribute(v);
      return n === 1 || n === 3 || n === 4 ? n : 2;
    },
  });
}

/** `<na-text tone="muted" size="sm">…</na-text>` */
@Component({
  selector: 'na-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './typography.scss',
  template: `<p class="na-text na-text--{{ tone() }} na-text--{{ size() }}"><ng-content /></p>`,
})
export class NaText {
  readonly tone = input<'default' | 'muted' | 'faint' | 'accent'>('default');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
}

/**
 * `<na-link href="…">Docs</na-link>` — no `href` renders a placeholder link with no jump.
 * Add `copyable` for a clipboard button; `copyText` defaults to `href`.
 */
@Component({
  selector: 'na-link',
  standalone: true,
  imports: [NaIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './typography.scss',
  template: `
    <span class="na-link-wrap">
      <a class="na-link" [attr.href]="href() || null"><ng-content /></a>
      @if (copyable()) {
        <button
          type="button"
          class="na-link__copy"
          [class.na-link__copy--done]="copiedState()"
          [attr.aria-label]="copiedState() ? 'Copied' : 'Copy link'"
          (click)="copy($event)"
        >
          <na-icon [name]="copiedState() ? 'check' : 'copy'" [size]="14" />
          <span class="na-link__copy-label">{{ copiedState() ? 'Copied!' : 'Copy' }}</span>
        </button>
      }
    </span>
  `,
})
export class NaLink implements OnDestroy {
  readonly href = input('');
  readonly copyable = input(false, { transform: booleanAttribute });
  readonly copyText = input('');
  readonly copied = output<string>();

  readonly copiedState = signal(false);
  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  async copy(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const text = this.copyText() || this.href();
    if (!text) return;
    const ok = await writeToClipboard(text);
    if (!ok) return;
    this.copiedState.set(true);
    this.copied.emit(text);
    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => {
      this.copiedState.set(false);
      this.resetTimer = null;
    }, 2000);
  }

  ngOnDestroy(): void {
    if (this.resetTimer) clearTimeout(this.resetTimer);
  }
}

async function writeToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or insecure context — fall through to execCommand.
  }
  return legacyCopy(text);
}

function legacyCopy(text: string): boolean {
  if (typeof document === 'undefined') return false;
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.top = '-1000px';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(area);
  return ok;
}


/** `<na-code>npm i</na-code>` */
@Component({
  selector: 'na-code',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './typography.scss',
  template: `<code class="na-code"><ng-content /></code>`,
})
export class NaCode {}

/** Pre-spaced empty state with optional action slot. */
@Component({
  selector: 'na-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './typography.scss',
  template: `
    <div class="na-empty">
      <p class="na-empty__title">{{ title() }}</p>
      @if (description()) {
        <p class="na-empty__desc">{{ description() }}</p>
      }
      <div class="na-empty__action"><ng-content /></div>
    </div>
  `,
})
export class NaEmptyState {
  readonly title = input('Nothing here yet');
  readonly description = input('');
}
