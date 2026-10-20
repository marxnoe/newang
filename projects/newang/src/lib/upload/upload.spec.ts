import { TestBed } from '@angular/core/testing';
import { NaUpload, NaUploadChangeEvent } from './upload';

class FakeUpload {
  onprogress: ((event: ProgressEvent) => void) | null = null;
}

class FakeXhr {
  static instances: FakeXhr[] = [];
  upload = new FakeUpload();
  status = 200;
  statusText = 'OK';
  responseText = '{"ok":true}';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  open(): void {}
  send(): void {
    FakeXhr.instances.push(this);
  }
  abort(): void {}
  getResponseHeader(): string {
    return 'application/json';
  }
}

function fileList(files: File[]): FileList {
  return files as unknown as FileList;
}

describe('NaUpload', () => {
  beforeEach(() => {
    FakeXhr.instances = [];
    vi.stubGlobal('XMLHttpRequest', FakeXhr);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports progress, completion and allows removing a file', () => {
    const f = TestBed.createComponent(NaUpload);
    f.componentRef.setInput('action', '/upload');
    f.detectChanges();
    const events: NaUploadChangeEvent[] = [];
    const progress: NaUploadChangeEvent[] = [];
    f.componentInstance.change.subscribe((e) => events.push(e));
    f.componentInstance.progress.subscribe((e) => progress.push(e));

    const file = new File(['video'], 'clip.mp4', { type: 'video/mp4' });
    f.componentInstance.addFiles(fileList([file]));
    f.detectChanges();
    expect(f.componentInstance.files().length).toBe(1);
    expect(f.nativeElement.querySelector('.na-upload__name')?.textContent).toBe('clip.mp4');
    expect(events[0].status).toBe('uploading');

    const xhr = FakeXhr.instances[0];
    xhr.upload.onprogress?.({
      lengthComputable: true,
      loaded: 50,
      total: 100,
    } as unknown as ProgressEvent);
    f.detectChanges();
    expect(f.componentInstance.files()[0].percent).toBe(50);
    expect(progress[0].percent).toBe(50);

    xhr.onload?.();
    f.detectChanges();
    expect(f.componentInstance.files()[0].status).toBe('done');
    expect(events.at(-1)?.status).toBe('done');
    expect(f.nativeElement.querySelector('.na-upload__detail')?.textContent).toContain('Uploaded');

    (f.nativeElement.querySelector('.na-upload__remove') as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.componentInstance.files().length).toBe(0);
  });

  it('enforces the limit and reports a missing action as an error', () => {
    const f = TestBed.createComponent(NaUpload);
    f.componentRef.setInput('limit', 1);
    f.detectChanges();
    const events: NaUploadChangeEvent[] = [];
    f.componentInstance.change.subscribe((e) => events.push(e));
    f.componentInstance.addFiles(
      fileList([new File(['a'], 'a.txt'), new File(['b'], 'b.txt')]),
    );
    f.detectChanges();
    expect(f.componentInstance.files().length).toBe(1);
    expect(events.at(-1)?.status).toBe('error');
    expect(events.at(-1)?.error).toContain('No upload action');
  });
});
