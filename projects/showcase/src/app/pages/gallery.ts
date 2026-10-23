import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  NaAlert,
  NaAvatar,
  NaBadge,
  NaBreadcrumbs,
  NaButton,
  NaCard,
  NaCheckbox,
  NaCode,
  NaCodeInput,
  NaDatepicker,
  NaDivider,
  NaDrawer,
  NaDropdown,
  NaEmptyState,
  NaField,
  NaForm,
  NaGrid,
  NaHeader,
  NaHeading,
  NaIcon,
  NaInput,
  NaLink,
  NaList,
  NaMessage,
  NaModal,
  NaNotification,
  NaPagination,
  NaPopconfirm,
  NaProgress,
  NaRadioGroup,
  NaRow,
  NaSelect,
  NaSkeleton,
  NaSpacer,
  NaSpinner,
  NaSplit,
  NaStack,
  NaSwitch,
  NaTab,
  NaTable,
  NaTabs,
  NaText,
  NaToolbar,
  NaTooltip,
  NaUpload,
} from 'newang';
import type { NaDropdownItem, NaSelectOption } from 'newang';

// Exhaustive gallery: every component, every state, stable ids for Playwright.
@Component({
  selector: 'app-gallery',
  imports: [
    ReactiveFormsModule,
    NaStack,
    NaRow,
    NaGrid,
    NaSplit,
    NaDivider,
    NaSpacer,
    NaHeading,
    NaText,
    NaLink,
    NaCode,
    NaEmptyState,
    NaButton,
    NaField,
    NaInput,
    NaForm,
    NaHeader,
    NaSwitch,
    NaCheckbox,
    NaRadioGroup,
    NaCodeInput,
    NaCard,
    NaBadge,
    NaAlert,
    NaTable,
    NaList,
    NaBreadcrumbs,
    NaAvatar,
    NaSpinner,
    NaProgress,
    NaModal,
    NaTabs,
    NaTooltip,
    NaToolbar,
    NaIcon,
    NaUpload,
    NaTab,
    NaSelect,
    NaDatepicker,
    NaDropdown,
    NaDrawer,
    NaPopconfirm,
    NaPagination,
    NaSkeleton,
  ],
  template: `
    <na-stack gap="xl">
      <na-stack gap="sm">
        <na-heading level="1">Component gallery</na-heading>
        <na-text tone="muted">Every na-* component in every state. Screenshots feed visual review.</na-text>
      </na-stack>

      <section id="sec-buttons"><na-stack gap="md">
        <na-heading level="2">Buttons</na-heading>
        <na-row gap="sm">
          <na-button id="btn-primary" variant="primary">Primary</na-button>
          <na-button id="btn-secondary" variant="secondary">Secondary</na-button>
          <na-button id="btn-ghost" variant="ghost">Ghost</na-button>
          <na-button id="btn-danger" variant="danger">Danger</na-button>
        </na-row>
        <na-row gap="sm">
          <na-button id="btn-sm" size="sm">Small</na-button>
          <na-button id="btn-md" size="md">Medium</na-button>
          <na-button id="btn-lg" size="lg">Large</na-button>
          <na-button id="btn-loading" [loading]="true">Loading</na-button>
          <na-button id="btn-disabled" [disabled]="true">Disabled</na-button>
        </na-row>
        <na-button id="btn-block" fullWidth>Block button</na-button>
      </na-stack></section>

      <section id="sec-forms"><na-stack gap="md">
        <na-heading level="2">Forms</na-heading>
        <na-field label="Email" hint="Work email">
          <input naInput id="field-email" placeholder="you@co.com" />
        </na-field>
        <na-field label="Email" error="Enter a valid work email.">
          <input naInput id="field-error" placeholder="you@co.com" [invalid]="true" />
        </na-field>
        <na-field label="Disabled" hint="Cannot edit">
          <input naInput id="field-disabled" placeholder="locked" disabled />
        </na-field>
        <na-row gap="md">
          <na-switch id="sw-basic" label="Notifications" [(checked)]="swOn" />
          <na-switch id="sw-disabled" label="Locked" [disabled]="true" />
        </na-row>
        <na-row gap="md">
          <na-checkbox id="cb-basic" label="Remember me" [(checked)]="cbOn" />
          <na-checkbox id="cb-disabled" label="Locked" [disabled]="true" />
        </na-row>
        <na-radio-group
          id="radio-basic"
          label="Plan"
          [options]="[{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }, { value: 'team', label: 'Team' }]"
          [(value)]="plan"
        />
        <na-radio-group
          id="radio-disabled"
          label="Locked plan"
          [options]="[{ value: 'free', label: 'Free' }]"
          [disabled]="true"
        />
        <na-field label="Share code" hint="Paste, type or autofill — completes at 5 characters">
          <na-code-input id="code-basic" [length]="5" label="Share code" [(value)]="code" (completed)="codeDone.set($event)" />
        </na-field>
        <na-code-input id="code-invalid" [length]="4" charset="numeric" label="PIN" value="12" [invalid]="true" />
        <na-code-input id="code-disabled" [length]="4" label="Locked" value="AB" [disabled]="true" />
        <na-text tone="muted">code: {{ code() }} · completed: {{ codeDone() || 'no' }}</na-text>
        <na-card title="Reactive form disable()" subtitle="formControl.disable() must freeze the UI">
          <na-stack gap="sm">
            <na-switch id="sw-reactive" label="Reactive" [formControl]="reactive" />
            <na-row gap="sm">
              <na-button id="btn-disable-fc" size="sm" variant="secondary" (pressed)="reactive.disable()">Disable</na-button>
              <na-button id="btn-enable-fc" size="sm" variant="secondary" (pressed)="reactive.enable()">Enable</na-button>
            </na-row>
            <na-text tone="muted">picked plan: {{ plan() }} · switch: {{ swOn() }} · box: {{ cbOn() }}</na-text>
          </na-stack>
        </na-card>
        <na-form submitLabel="Save" (submitted)="saved.set(true)">
          <na-field label="Nickname" hint="Shown on your profile">
            <input naInput id="form-nick" placeholder="ada" />
          </na-field>
        </na-form>
        @if (saved()) { <na-alert id="form-saved" tone="success" title="Saved">Form submitted without errors.</na-alert> }
      </na-stack></section>

      <section id="sec-type"><na-stack gap="md">
        <na-heading level="2">Type</na-heading>
        <na-heading level="1">Heading one</na-heading>
        <na-heading level="2">Heading two</na-heading>
        <na-heading level="3">Heading three</na-heading>
        <na-heading level="4">Heading four</na-heading>
        <na-text>Default text</na-text>
        <na-text tone="muted">Muted text</na-text>
        <na-text tone="faint">Faint text</na-text>
        <na-text tone="accent">Accent text</na-text>
        <na-text size="sm">Small text</na-text>
        <na-text size="lg">Large text</na-text>
        <na-link id="link-href" href="/gallery">Link with href</na-link>
        <na-text><na-link id="link-bare">Bare link (no jump)</na-link></na-text>
        <na-code>npm i newang</na-code>
        <na-empty-state title="Nothing here yet" description="Create your first item to get going." />
      </na-stack></section>

      <section id="sec-display"><na-stack gap="md">
        <na-heading level="2">Display</na-heading>
        <na-row gap="sm">
          <na-badge>neutral</na-badge>
          <na-badge tone="lime">lime</na-badge>
          <na-badge tone="success">success</na-badge>
          <na-badge tone="warning">warning</na-badge>
          <na-badge tone="danger">danger</na-badge>
          <na-badge tone="info">info</na-badge>
        </na-row>
        <na-alert tone="info" title="Heads up">Info alert body copy.</na-alert>
        <na-alert tone="success" title="Done">Success alert body copy.</na-alert>
        <na-alert tone="warning" title="Careful">Warning alert body copy.</na-alert>
        <na-alert tone="danger" title="Failed">Danger alert body copy.</na-alert>
        <na-card title="Card title" subtitle="Card subtitle"><na-text tone="muted">Card body.</na-text></na-card>
        <na-breadcrumbs id="crumbs-str" [items]="['Home', 'Library', 'Gallery']" />
        <na-breadcrumbs id="crumbs-href" [items]="[{ label: 'Home', href: '/' }, { label: 'Gallery', href: '/gallery' }, 'Here']" />
        <na-row gap="sm">
          <na-avatar name="Ada Lovelace" />
          <na-avatar id="avatar-double" name="Ada  Lovelace" />
          <na-avatar id="avatar-sm" name="Al" size="sm" />
          <na-avatar id="avatar-lg" name="Al" size="lg" />
        </na-row>
        <na-row gap="sm">
          <na-spinner /> <na-text tone="muted">spinner</na-text>
        </na-row>
        <na-stack gap="sm">
          <na-progress id="prog-0" [value]="0" />
          <na-progress id="prog-45" [value]="45" />
          <na-progress id="prog-100" [value]="100" />
          <na-progress id="prog-150" [value]="150" />
          <na-progress id="prog-neg" [value]="-20" />
        </na-stack>
        <na-table
          [columns]="[{ key: 'name', header: 'Name' }, { key: 'role', header: 'Role' }]"
          [rows]="[{ name: 'Ada', role: 'Admin' }, { name: 'Grace', role: 'Editor' }]"
        />
        <na-table [columns]="[{ key: 'name', header: 'Name' }]" [rows]="[]" />
        <na-list>
          <li>First row</li>
          <li>Second row</li>
          <li>Third row</li>
        </na-list>
      </na-stack></section>

      <section id="sec-layout"><na-stack gap="md">
        <na-heading level="2">Layout</na-heading>
        <na-stack gap="sm">
          <div class="demo-box">stack a</div>
          <div class="demo-box">stack b</div>
        </na-stack>
        <na-row gap="sm">
          <div class="demo-box">row a</div>
          <div class="demo-box">row b</div>
          <na-spacer /><div class="demo-box">row c</div>
        </na-row>
        <na-grid cols="3" gap="sm">
          <div class="demo-box">1</div><div class="demo-box">2</div><div class="demo-box">3</div>
        </na-grid>
        <na-split columns="280px 1fr">
          <div class="demo-box">side 280px</div><div class="demo-box">main 1fr</div>
        </na-split>
        <na-divider />
        <na-text tone="muted">divider above</na-text>
      </na-stack></section>

      <section id="sec-overlay"><na-stack gap="md">
        <na-heading level="2">Overlay</na-heading>
        <na-button id="btn-open-modal" (pressed)="modalOpen.set(true)">Open modal</na-button>
        <na-modal id="demo-modal" title="Confirm delete" [open]="modalOpen()" (closed)="modalOpen.set(false)">
          <na-text tone="muted">This action cannot be undone.</na-text>
        </na-modal>
        <na-tabs id="demo-tabs" [tabs]="['One', 'Two', 'Three']" [(active)]="tab">
          <na-text tone="muted">Panel {{ tab() + 1 }} content.</na-text>
        </na-tabs>
        <na-row gap="md">
          <span id="tip-span" naTooltip="Saved!">Hover for tooltip</span>
          <na-button id="tip-btn" naTooltip="Runs the job">Button with tooltip</na-button>
          <span id="tip-empty" naTooltip="">Empty tooltip (no bubble)</span>
        </na-row>
      </na-stack></section>

      <section id="sec-migration"><na-stack gap="md">
        <na-heading level="2">Migration primitives</na-heading>
        <na-row id="icon-row" gap="sm">
          <na-icon name="inbox" />
          <na-icon name="check" tone="success" />
          <na-icon name="copy" tone="muted" />
          <na-icon name="x" tone="danger" />
          <na-icon name="upload" tone="accent" />
          <na-icon name="download" />
          <na-icon name="alert" tone="warning" />
          <na-icon name="info" tone="info" />
          <na-icon name="chevron-left" />
          <na-icon name="chevron-right" />
          <na-icon name="file" />
          <na-icon name="spinner" />
          <na-icon name="inbox" [size]="28" tone="muted" label="Inbox" />
        </na-row>

        <na-upload
          id="upload-demo"
          action="/upload"
          name="file"
          [limit]="2"
          accept="video/*,audio/*"
          drag
          (change)="uploadStatus.set($event.status)"
        />
        <na-text tone="muted">last upload status: {{ uploadStatus() }}</na-text>

        <na-row gap="md">
          <na-link
            id="link-copy"
            href="https://example.com/share/abc123"
            copyable
            copyText="https://example.com/share/abc123"
            (copied)="lastCopied.set($event)"
          >Copyable direct link</na-link>
          <na-text tone="muted">copied: {{ lastCopied() || 'nothing yet' }}</na-text>
        </na-row>

        @if (alertOpen()) {
          <na-alert
            id="alert-rich"
            tone="warning"
            showIcon
            title="Storage nearly full"
            description="Delete unused uploads or upgrade your plan before the next export."
            closable
            (closed)="alertOpen.set(false)"
          >
            Drafts are still saved locally.
          </na-alert>
        }

        <na-radio-group
          id="radio-segmented"
          label="Source"
          variant="segmented"
          orientation="inline"
          [options]="[
            { value: 'file', label: 'File' },
            { value: 'url', label: 'URL' },
            { value: 'youtube', label: 'YouTube', disabled: true }
          ]"
          [(value)]="source"
        />

        <na-tabs id="tabs-projected" [(active)]="tabIndex" [(activeId)]="tabKey">
          <na-tab id="upload-file" title="Upload file">
            <na-field label="Kept mounted" hint="Switch tabs and the value survives.">
              <input naInput id="tab-kept-input" placeholder="State survives" />
            </na-field>
          </na-tab>
          <na-tab id="youtube" title="YouTube">
            <na-text tone="muted">YouTube tab content.</na-text>
          </na-tab>
        </na-tabs>
      </na-stack></section>

      <section id="sec-p2"><na-stack gap="md">
        <na-heading level="2">P2 parity</na-heading>
        <na-text tone="muted">Select, datepicker, dropdown, drawer, message, popconfirm, pagination and skeleton.</na-text>
        <na-row gap="md">
          <na-field label="Plan">
            <na-select
              id="select-demo"
              [options]="selectOptions"
              [(value)]="selectValue"
              placeholder="Choose a plan"
            />
          </na-field>
          <na-datepicker
            id="datepicker-demo"
            label="Start date"
            hint="Native picker"
            [(value)]="dateValue"
          />
        </na-row>
        <na-row gap="md">
          <na-dropdown
            id="dropdown-demo"
            label="Actions"
            [items]="dropdownItems"
            (selected)="lastAction.set($event.label)"
          />
          <na-popconfirm
            id="popconfirm-demo"
            message="Delete this draft?"
            confirmLabel="Delete"
            (confirmed)="popconfirmCount.set(popconfirmCount() + 1)"
          >
            <na-button size="sm" variant="danger">Delete draft</na-button>
          </na-popconfirm>
          <na-text tone="muted">action: {{ lastAction() }} · confirmations: {{ popconfirmCount() }}</na-text>
        </na-row>
        <na-row gap="md">
          <na-button id="drawer-open" (pressed)="drawerOpen.set(true)">Open drawer</na-button>
          <na-button id="msg-success" (pressed)="messages.success('Draft saved')">Show message</na-button>
          <na-button id="msg-error" variant="danger" (pressed)="messages.error('Upload failed', { duration: 0 })">
            Sticky error
          </na-button>
          <na-button
            id="notif-demo"
            variant="secondary"
            (pressed)="notifications.success('Export ready', { title: 'Downloads' })"
          >
            Notification
          </na-button>
        </na-row>
        <na-pagination id="pagination-demo" [total]="95" [pageSize]="10" [(page)]="page" />
        <na-stack gap="sm">
          <na-skeleton [lines]="2" />
          <na-row gap="sm">
            <na-skeleton circle [height]="40" />
            <na-skeleton width="200px" [height]="40" />
          </na-row>
        </na-stack>
        <na-drawer id="demo-drawer" title="Filters" [open]="drawerOpen()" (closed)="drawerOpen.set(false)">
          <na-stack gap="sm">
            <na-text>Drawer body</na-text>
            <na-button size="sm" (pressed)="drawerOpen.set(false)">Close</na-button>
          </na-stack>
        </na-drawer>
      </na-stack></section>

      <section id="sec-shell"><na-stack gap="md">
        <na-heading level="2">Shell</na-heading>
        <na-header
          id="header-long"
          title="Supercalifragilisticexpialidocious_identifier_without_any_spaces_to_force_wrapping_behaviour"
          subtitle="Long titles wrap inside the bar and never push the actions off-canvas."
          maxWidth="full"
        >
          <na-button size="sm" variant="secondary">Edit</na-button>
        </na-header>
        <na-toolbar>
          <na-button size="sm" variant="secondary">Cut</na-button>
          <na-button size="sm" variant="secondary">Copy</na-button>
        </na-toolbar>
        <na-text tone="faint">Header and footer render globally around every page.</na-text>
      </na-stack></section>
    </na-stack>
  `,
})
export class GalleryPage {
  readonly swOn = signal(true);
  readonly cbOn = signal(false);
  readonly plan = signal<string | number>('pro');
  readonly saved = signal(false);
  readonly code = signal('');
  readonly codeDone = signal('');
  readonly modalOpen = signal(false);
  readonly tab = signal(0);
  readonly tabIndex = signal(0);
  readonly tabKey = signal<string | number>('upload-file');
  readonly uploadStatus = signal('idle');
  readonly lastCopied = signal('');
  readonly alertOpen = signal(true);
  readonly source = signal<string | number>('file');
  readonly reactive = new FormControl(true);
  readonly messages = inject(NaMessage);
  readonly notifications = inject(NaNotification);
  readonly selectOptions: NaSelectOption[] = [
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro' },
    { value: 'team', label: 'Team' },
    { value: 'enterprise', label: 'Enterprise', disabled: true },
  ];
  readonly dropdownItems: NaDropdownItem[] = [
    { label: 'Edit', value: 'edit' },
    { label: 'Duplicate', value: 'duplicate' },
    { label: 'Archive', value: 'archive', disabled: true },
    { label: 'Delete', value: 'delete', danger: true },
  ];
  readonly selectValue = signal<string | number | undefined>('pro');
  readonly dateValue = signal('');
  readonly lastAction = signal('none');
  readonly popconfirmCount = signal(0);
  readonly drawerOpen = signal(false);
  readonly page = signal(3);
}
