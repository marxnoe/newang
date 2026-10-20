# newAng (`newang`)

Opinionated dark Angular component library. Pastel lime accent, flat static colors — no gradients, no glows. Near-zero consumer CSS: spacing, type, layout and form rhythm are baked into `na-*` components.

## Install

```bash
ng add newang
```

`ng add` detects your style setup. Plain-CSS apps get the compiled theme wired
into `angular.json`; Sass apps get the mixin import below.

### Plain CSS (no Sass)

Add one entry to `angular.json`:

```json
"styles": ["node_modules/newang/styles.css", "src/styles.css"]
```

The compiled file contains the tokens and global directive styles — the
component styles ship inside the Angular components. No Sass toolchain needed.

### SCSS

`ng add` wires the theme into `src/styles.scss`:

```scss
@use 'newang/styles' as na;
@include na.base();
```

Use the SCSS entry when you want to override `$na-*` tokens at build time.
For runtime tweaks, plain CSS custom properties on `:root` are enough.

Manual install:

```bash
npm i newang
```

## Zero-CSS usage

```html
<na-app>
  <na-page maxWidth="md">
    <na-stack gap="lg">
      <na-heading level="1">Sign in</na-heading>
      <na-field label="Email" hint="Work email" error="">
        <input naInput placeholder="you@co.com" />
      </na-field>
      <na-button variant="primary">Login</na-button>
    </na-stack>
  </na-page>
</na-app>
```

No `class=`, no `style=`, no stylesheets. Control everything with inputs: `gap`, `size`, `tone`, `variant`, `maxWidth`, `cols`.

## API notes

- `na-radio-group` is driven by an `options` input — there is no `na-radio` element:
  ```html
  <na-radio-group label="Plan" [options]="[{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }]" />
  ```
  Binds via `[(value)]` or `formControl`. `disabled` works both as an input and via `formControl.disable()`. Use `orientation="inline"` for a wrapping row, `variant="segmented"` for compact 2–3 way toggles, and `{ value, label, disabled }` for per-option disabling.
- `na-upload` POSTs `FormData` to `action` and reports progress:
  ```html
  <na-upload action="/upload" name="file" [limit]="1" accept="video/*" drag
    (change)="onChange($event)" (progress)="onProgress($event)" />
  ```
  `change`/`progress` payloads are `{ status: 'uploading' | 'done' | 'error', percent, response, error, file }`. `drag` enables drop handling; `limit` defaults to unlimited; each queued file has a Cancel/Remove button. The dropzone is a native button, so Enter/Space opens the picker.
- `na-icon` renders the closed built-in set (`inbox`, `check`, `copy`, `x`, `upload`, `download`, `alert`, `info`, `chevron-*`, `spinner`, plus a few utility glyphs): `<na-icon name="inbox" size="20" tone="muted" />`. Icons are decorative unless you pass `label`.
- `na-link copyable` adds a clipboard button with a visible `Copied!` state and `(copied)`: `<na-link href="…" copyable [copyText]="url">…</na-link>`. `copyText` falls back to `href`; clipboard API falls back to `execCommand`.
- `na-alert` supports `showIcon` (or an explicit `icon`), `description`, and `closable` + `(closed)`. Content still projects into the body slot.
- `na-tabs` accepts the original labels API or projected tabs with stable ids:
  ```html
  <na-tabs [(active)]="tabIndex" [(activeId)]="tabId">
    <na-tab id="upload" title="Upload file">…</na-tab>
    <na-tab id="youtube" title="YouTube">…</na-tab>
  </na-tabs>
  ```
  `active` stays index-based (existing API); `activeId` selects by stable `na-tab id`. Projected panels stay mounted while hidden, preserving form and scroll state.
- `na-split` takes `columns`, a space-separated CSS value (default `"280px 1fr"`):
  ```html
  <na-split columns="280px 1fr"><div>Side</div><div>Main</div></na-split>
  ```
- `na-field`'s `error` only renders the message. Add `[invalid]="true"` (or `aria-invalid="true"`) to the projected `input naInput` to paint the danger border.
- `na-button` defaults to `variant="primary"`, `size="md"`, `type="button"`; pass `fullWidth` for a block-level button. `loading` and `disabled` both render a flat inactive surface — the lime accent is reserved for live primary actions.
- `na-form` is a flat layout wrapper (fields + action row with a hairline). It has no surface or border of its own, so nesting it in `na-card` never produces a box inside a box.
- `na-page` defaults to `maxWidth="md"`.
- `na-header`/`na-footer` ship with 16px edge padding on all sides and default to `maxWidth="full"`; pass `sm`/`md`/`lg` to cap content to the `na-page` widths so shell aligns with page. They carry no outer margins: in the `header → page → footer` composition the section gaps come from `na-page` padding alone (32px), never doubled.
- `na-header` centres its actions slot against the whole title block (title plus subtitle). Below 768px the bar stacks: title first, actions beneath it. Long titles wrap rather than pushing actions out. The bottom hairline uses `--na-border`.
- `na-breadcrumbs` accepts plain strings or `{ label, href }` items — items with `href` render as links.
- `na-modal` closes on backdrop click, ✕, or `Escape` (handle `(closed)`).
- `na-progress` clamps `value` to 0–100.

## Components

| Area | Components |
| --- | --- |
| Actions | `na-button` |
| Forms | `na-field`, `na-form`, `input[naInput]`, `na-switch`, `na-checkbox`, `na-radio-group`, `na-upload` |
| Layout | `na-app`, `na-page`, `na-stack`, `na-row`, `na-grid`, `na-split`, `na-divider`, `na-spacer` |
| Type | `na-heading`, `na-text`, `na-link`, `na-code`, `na-empty-state`, `na-icon` |
| Display | `na-card`, `na-badge`, `na-alert`, `na-table`, `na-list`, `na-breadcrumbs`, `na-avatar`, `na-spinner`, `na-progress` |
| Overlay | `na-modal`, `na-tabs`, `na-tab`, `naTooltip` |
| Shell | `na-header`, `na-footer`, `na-toolbar` |

## Theme

Dark-only for v1. Tokens live in `newang/styles` (`$na-bg`, `$na-accent`, …) as `!default` SCSS variables mirrored to `--na-*` CSS custom properties — colors, radii (`--na-radius-sm/md/lg`), spacing (`--na-space-xs`…`--na-space-xl`) and fonts (`--na-font`, `--na-mono`). Components read them via `var(--na-*, <fallback>)`, so consumers can re-skin at runtime with plain CSS, no SCSS rebuild needed — and plain-CSS apps can skip Sass entirely with the precompiled `newang/styles.css`. Flat elevation via 1px borders; focus is a 2px lime `outline`. Stylelint bans `linear-gradient`, `box-shadow` (except `none`), `text-shadow` and `drop-shadow`.

One system, not ad-hoc values. Everything sizes off shared tokens: `--na-fs-xs`…`--na-fs-3xl` (12/13/14/16/18/24/30), `--na-weight-medium/semibold/bold` (500/600/700), `--na-control-h-sm/md/lg` (32/40/48, shared by inputs, buttons, tabs and form actions), `--na-focus-offset` (2px everywhere) and `--na-dur` (120ms on every interactive element).

Square by default, round on purpose: all corner radii ship as `0`. The only round elements are radio dots (a round radio is what distinguishes it from a checkbox), the switch track/thumb (toggle affordance) and spinner rings including the button loading spinner (rotation needs a circle). Everything else — cards, alerts, badges, avatars, progress, inputs, buttons, modals, tooltips — is square. Set `--na-radius-sm/md/lg` to bring roundness back globally.

## Releases

Every push to `main` runs CI (stylelint, build, tests) then `semantic-release`: conventional commits → version bump → CHANGELOG → GitHub Release → `npm publish`.

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:` …

Publishing uses **npm OIDC trusted publishing** — no long-lived tokens, no rotation, plus provenance attestation. Two one-time setup steps (npm classic tokens are revoked and granular bypass-2FA tokens are being phased out, so tokens are not an option):

1. **Manual first publish** (needs your interactive login/2FA — CI can never do the first one):
   ```bash
   npm ci
   npm run build
   cd dist/newang && npm publish --access public
   ```
   Then anyone can run `ng add newang` to get the latest release.
2. **npmjs.com → `newang` package → Settings → Trusted Publishers → Manage Trusted Publishers → GitHub Actions**: organization/user `mobn0`, repository `newang`, workflow file `release.yml`, no environment.

After that, every `feat:`/`fix:` push publishes automatically with zero secrets to manage.

## Develop

```bash
npm ci
npm run build
npm run test
npm run lint:style
```

Visual tests: `projects/showcase` is a mock-site app (landing, dashboard,
sign-in, full component gallery) exercised by Playwright, everything in
Docker — see `e2e/run.mjs`:

```bash
docker network create newang-e2e
docker build -f e2e/Dockerfile.showcase -t newang-showcase .
docker build -f e2e/Dockerfile.e2e -t newang-e2e .
docker run -d --name showcase --network newang-e2e newang-showcase
docker run --rm --network newang-e2e -e BASE_URL=http://showcase \
  -v ./e2e/results:/results newang-e2e
```
