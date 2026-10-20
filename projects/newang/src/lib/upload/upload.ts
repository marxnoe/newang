import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NaIcon, NaIconName } from '../icon/icon';

export type NaUploadStatus = 'uploading' | 'done' | 'error';

/** One row in the upload queue. */
export interface NaUploadItem {
  uid: number;
  file: File;
  status: NaUploadStatus;
  percent: number;
  response: unknown;
  error: string | null;
}

/** Payload emitted by `(change)` and `(progress)`. */
export interface NaUploadChangeEvent {
  status: NaUploadStatus;
  percent: number;
  response: unknown;
  error: string | null;
  file: File;
}

/**
 * Drag-and-drop / picker upload. POSTs `FormData` to `action` with XHR so
 * progress is reported, and keeps a per-file queue with cancel/remove.
 *
 * `<na-upload action="/upload" name="file" [limit]="1" accept="video/*" drag
 *   (change)="onChange($event)" (progress)="onProgress($event)" />`
 */
@Component({
  selector: 'na-upload',
  standalone: true,
  imports: [NaIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './upload.scss',
  template: `
    <div class="na-upload" [class.na-upload--disabled]="disabled()">
      <button
        type="button"
        class="na-upload__dropzone"
        [class.na-upload__dropzone--drag]="drag()"
        [class.na-upload__dropzone--over]="dragging()"
        [disabled]="disabled()"
        (click)="openPicker()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
      >
        <na-icon name="upload" [size]="24" tone="muted" />
        <span class="na-upload__title">
          {{ drag() ? 'Drag files here or click to browse' : 'Choose a file' }}
        </span>
        <span class="na-upload__hint">
          {{ accept() ? 'Accepted: ' + accept() : 'All file types' }} · {{ limitLabel() }}
        </span>
      </button>

      <input
        #picker
        class="na-upload__input"
        type="file"
        [attr.name]="name()"
        [attr.accept]="accept() || null"
        [attr.multiple]="limit() === 1 ? null : ''"
        [disabled]="disabled()"
        (change)="onPickerChange($event)"
      />

      @if (files().length) {
        <ul class="na-upload__files">
          @for (item of files(); track item.uid) {
            <li class="na-upload__file na-upload__file--{{ item.status }}">
              <na-icon
                [name]="statusIcon(item)"
                [size]="16"
                [tone]="item.status === 'error' ? 'danger' : item.status === 'done' ? 'success' : 'muted'"
              />
              <div class="na-upload__meta">
                <span class="na-upload__name">{{ item.file.name }}</span>
                <span class="na-upload__detail">
                  @if (item.status === 'uploading') {
                    Uploading — {{ item.percent }}%
                  } @else if (item.status === 'done') {
                    Uploaded
                  } @else {
                    {{ item.error || 'Upload failed' }}
                  }
                </span>
                @if (item.status === 'uploading') {
                  <span class="na-upload__bar" aria-hidden="true">
                    <span class="na-upload__fill" [style.width.%]="item.percent"></span>
                  </span>
                }
              </div>
              <button
                type="button"
                class="na-upload__remove"
                [attr.aria-label]="item.status === 'uploading' ? 'Cancel ' + item.file.name : 'Remove ' + item.file.name"
                (click)="remove(item)"
              >
                {{ item.status === 'uploading' ? 'Cancel' : 'Remove' }}
              </button>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class NaUpload implements OnDestroy {
  readonly action = input('');
  readonly name = input('file');
  readonly limit = input(0, { transform: numberAttribute });
  readonly accept = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly drag = input(false, { transform: booleanAttribute });

  readonly change = output<NaUploadChangeEvent>();
  readonly progress = output<NaUploadChangeEvent>();
  readonly removed = output<NaUploadItem>();

  readonly files = signal<NaUploadItem[]>([]);
  readonly dragging = signal(false);
  readonly maxFiles = computed(() => (this.limit() > 0 ? this.limit() : Number.POSITIVE_INFINITY));
  readonly limitLabel = computed(() => (this.limit() > 0 ? `up to ${this.limit()}` : 'no limit'));

  private readonly picker = viewChild.required<ElementRef<HTMLInputElement>>('picker');
  private readonly requests = new Map<number, XMLHttpRequest>();
  private nextUid = 0;

  openPicker(): void {
    if (this.disabled()) return;
    this.picker().nativeElement.click();
  }

  onPickerChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addFiles(input.files);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    if (!this.drag() || this.disabled()) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    this.dragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    if (!this.drag()) return;
    event.preventDefault();
    this.dragging.set(false);
  }

  onDrop(event: DragEvent): void {
    if (!this.drag() || this.disabled()) return;
    event.preventDefault();
    this.dragging.set(false);
    if (event.dataTransfer) this.addFiles(event.dataTransfer.files);
  }

  addFiles(list: FileList | null): void {
    if (!list || this.disabled()) return;
    const room = Math.max(0, this.maxFiles() - this.files().length);
    const selected = Array.from(list).slice(0, room);
    for (const file of selected) {
      const item: NaUploadItem = {
        uid: ++this.nextUid,
        file,
        status: 'uploading',
        percent: 0,
        response: null,
        error: null,
      };
      this.files.update((files) => [...files, item]);
      this.change.emit(eventOf(item));
      this.start(item, file);
    }
  }

  remove(item: NaUploadItem): void {
    const request = this.requests.get(item.uid);
    if (request) {
      request.abort();
      this.requests.delete(item.uid);
    }
    this.files.update((files) => files.filter((f) => f.uid !== item.uid));
    this.removed.emit(item);
  }

  statusIcon(item: NaUploadItem): NaIconName {
    if (item.status === 'done') return 'check';
    if (item.status === 'error') return 'alert';
    return 'spinner';
  }

  ngOnDestroy(): void {
    for (const request of this.requests.values()) request.abort();
    this.requests.clear();
  }

  private start(item: NaUploadItem, file: File): void {
    const url = this.action();
    if (!url) {
      this.finish(item.uid, 'error', 0, null, 'No upload action configured.');
      return;
    }
    const request = new XMLHttpRequest();
    this.requests.set(item.uid, request);
    request.open('POST', url, true);

    request.upload.onprogress = (event: ProgressEvent) => {
      if (!event.lengthComputable || !event.total) return;
      const percent = Math.min(100, Math.max(0, Math.round((event.loaded / event.total) * 100)));
      const updated = this.patch(item.uid, { percent });
      if (updated) this.progress.emit(eventOf(updated));
    };

    request.onload = () => {
      this.requests.delete(item.uid);
      const ok = request.status >= 200 && request.status < 300;
      const response = parseResponse(request);
      if (ok) {
        this.finish(item.uid, 'done', 100, response, null);
      } else {
        const status = `${request.status} ${request.statusText}`.trim();
        this.finish(item.uid, 'error', 100, response, `Upload failed (${status || 'network error'}).`);
      }
    };

    request.onerror = () => {
      this.requests.delete(item.uid);
      this.finish(item.uid, 'error', 0, null, 'Network error during upload.');
    };

    const form = new FormData();
    form.append(this.name(), file, file.name);
    request.send(form);
  }

  private finish(
    uid: number,
    status: NaUploadStatus,
    percent: number,
    response: unknown,
    error: string | null,
  ): void {
    const updated = this.patch(uid, { status, percent, response, error });
    if (updated) this.change.emit(eventOf(updated));
  }

  private patch(uid: number, patch: Partial<NaUploadItem>): NaUploadItem | undefined {
    const current = this.files().find((item) => item.uid === uid);
    if (!current) return undefined;
    const updated = { ...current, ...patch };
    this.files.update((files) => files.map((item) => (item.uid === uid ? updated : item)));
    return updated;
  }
}

function eventOf(item: NaUploadItem): NaUploadChangeEvent {
  return {
    status: item.status,
    percent: item.percent,
    response: item.response,
    error: item.error,
    file: item.file,
  };
}

function parseResponse(request: XMLHttpRequest): unknown {
  const type = request.getResponseHeader('content-type') || '';
  if (type.includes('application/json')) {
    try {
      return JSON.parse(request.responseText);
    } catch {
      return request.responseText;
    }
  }
  return request.responseText;
}
