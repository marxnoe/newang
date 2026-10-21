import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  computed,
  createComponent,
  inject,
  input,
  output,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NaIcon, NaIconName } from '../icon/icon';

export type NaMessageTone = 'info' | 'success' | 'warning' | 'danger';
export type NaMessageKind = 'message' | 'notification';

export interface NaMessageOptions {
  title?: string;
  /** Milliseconds before auto-dismiss. `0` keeps the message until dismissed. */
  duration?: number;
  kind?: NaMessageKind;
}

export type NaNotificationOptions = NaMessageOptions;

const TONE_ICONS: Record<NaMessageTone, NaIconName> = {
  info: 'info',
  success: 'check',
  warning: 'alert',
  danger: 'alert',
};

/** Internal rendering unit created by the imperative services. */
@Component({
  selector: 'na-message-item',
  standalone: true,
  imports: [NaIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './message.scss',
  template: `
    <div
      class="na-message na-message--{{ tone() }} na-message--{{ kind() }}"
      [attr.role]="tone() === 'danger' ? 'alert' : 'status'"
    >
      <na-icon [name]="icon()" [size]="kind() === 'notification' ? 20 : 16" [tone]="tone()" />
      <div class="na-message__content">
        @if (title()) {
          <p class="na-message__title">{{ title() }}</p>
        }
        <p class="na-message__text">{{ message() }}</p>
      </div>
      <button class="na-message__close" type="button" aria-label="Dismiss" (click)="closed.emit()">
        <na-icon name="x" [size]="14" />
      </button>
    </div>
  `,
})
export class NaMessageItem {
  readonly tone = input<NaMessageTone>('info');
  readonly title = input('');
  readonly message = input('');
  readonly kind = input<NaMessageKind>('message');
  readonly closed = output<void>();

  readonly icon = computed(() => TONE_ICONS[this.tone()]);
}

interface OpenMessage {
  host: HTMLElement;
  component: ComponentRef<NaMessageItem>;
  timer: ReturnType<typeof setTimeout> | null;
}

/**
 * Imperative toast service. Renders a fixed top-right stack with an
 * `aria-live` region. Every method returns an id for `dismiss(id)`.
 *
 * `message.success('Saved'); message.error('Upload failed', { duration: 0 });`
 */
@Injectable({ providedIn: 'root' })
export class NaMessage {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);
  private readonly document = inject(DOCUMENT);
  private readonly items = new Map<number, OpenMessage>();
  private stack: HTMLElement | null = null;
  private nextId = 0;

  success(message: string, options?: NaMessageOptions): number {
    return this.show('success', message, options);
  }

  info(message: string, options?: NaMessageOptions): number {
    return this.show('info', message, options);
  }

  warning(message: string, options?: NaMessageOptions): number {
    return this.show('warning', message, options);
  }

  error(message: string, options?: NaMessageOptions): number {
    return this.show('danger', message, options);
  }

  show(tone: NaMessageTone, message: string, options: NaMessageOptions = {}): number {
    const body = this.document.body;
    if (!body) return -1;

    const stack = this.ensureStack(body);
    const id = ++this.nextId;
    const host = this.document.createElement('na-message-item');
    stack.appendChild(host);

    const component = createComponent(NaMessageItem, {
      environmentInjector: this.injector,
      hostElement: host,
    });
    component.setInput('tone', tone);
    component.setInput('message', message);
    component.setInput('title', options.title || '');
    component.setInput('kind', options.kind || 'message');
    component.instance.closed.subscribe(() => this.dismiss(id));

    this.appRef.attachView(component.hostView);
    component.changeDetectorRef.detectChanges();

    const kind = options.kind || 'message';
    const duration = options.duration ?? (kind === 'notification' ? 6000 : 4000);
    const timer =
      duration > 0
        ? setTimeout(() => {
            this.dismiss(id);
          }, duration)
        : null;

    this.items.set(id, { host, component, timer });
    return id;
  }

  dismiss(id: number): void {
    const item = this.items.get(id);
    if (!item) return;
    if (item.timer) clearTimeout(item.timer);
    this.appRef.detachView(item.component.hostView);
    item.component.destroy();
    item.host.remove();
    this.items.delete(id);
    if (!this.items.size) {
      this.stack?.remove();
      this.stack = null;
    }
  }

  clear(): void {
    for (const id of [...this.items.keys()]) this.dismiss(id);
  }

  private ensureStack(body: HTMLElement): HTMLElement {
    if (this.stack) return this.stack;
    const stack = this.document.createElement('div');
    stack.className = 'na-message-stack';
    stack.setAttribute('aria-live', 'polite');
    body.appendChild(stack);
    this.stack = stack;
    return stack;
  }
}

/**
 * Larger notification variant of `NaMessage` (title + body, 6s default).
 *
 * `notification.success('Export ready', { title: 'Downloads', duration: 0 });`
 */
@Injectable({ providedIn: 'root' })
export class NaNotification {
  private readonly messages = inject(NaMessage);

  success(message: string, options?: NaNotificationOptions): number {
    return this.show('success', message, options);
  }

  info(message: string, options?: NaNotificationOptions): number {
    return this.show('info', message, options);
  }

  warning(message: string, options?: NaNotificationOptions): number {
    return this.show('warning', message, options);
  }

  error(message: string, options?: NaNotificationOptions): number {
    return this.show('danger', message, options);
  }

  show(tone: NaMessageTone, message: string, options: NaNotificationOptions = {}): number {
    return this.messages.show(tone, message, { ...options, kind: 'notification' });
  }

  dismiss(id: number): void {
    this.messages.dismiss(id);
  }

  clear(): void {
    this.messages.clear();
  }
}
