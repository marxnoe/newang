// Visual + functional sweep of every na-* component, executed inside Docker.
// BASE_URL: showcase container. OUT: mounted volume for screenshots + summary.
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://showcase';
const OUT = process.env.OUT ?? '/results';
mkdirSync(OUT, { recursive: true });

const failures = [];
const measures = {};
const fail = (name, detail) => {
  failures.push({ name, detail });
  console.log(`FAIL ${name}: ${detail}`);
};
const ok = (name) => console.log(`ok ${name}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  permissions: ['clipboard-read', 'clipboard-write'],
});

// Polls a condition (instant Playwright getters don't retry). Distinguishes
// "never happens" (real bug) from "render race" (timing).
async function poll(label, fn, timeout = 4000) {
  const t0 = Date.now();
  let last;
  while (Date.now() - t0 < timeout) {
    last = await fn();
    if (last) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  fail(label, `condition never true (last=${JSON.stringify(last)})`);
  return false;
}

async function newPage(route) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  return { page, errors };
}

function checkJsErrors(label, errors) {
  if (errors.length) fail(`${label} js-errors`, errors.join(' | '));
  else ok(`${label} js-errors`);
}

// --- 1. every route loads clean + full-page screenshots -------------------
for (const route of ['/', '/dashboard', '/signin', '/gallery']) {
  const { page, errors } = await newPage(route);
  checkJsErrors(`route ${route}`, errors);
  const name = route === '/' ? 'landing' : route.slice(1);
  await page.screenshot({ path: `${OUT}/${name}-desktop.png`, fullPage: true });
  await page.close();
}
ok('route screenshots');

// --- 2. shell nav works ----------------------------------------------------
{
  const { page, errors } = await newPage('/');
  for (const [link, heading] of [
    ['Dashboard', 'Good evening, Ada'],
    ['Sign in', 'Sign in'],
    ['Gallery', 'Component gallery'],
  ]) {
    await page.getByRole('link', { name: link, exact: true }).click();
    await page.locator('na-page').getByRole('heading', { name: heading }).waitFor();
    ok(`nav -> ${link}`);
  }
  checkJsErrors('nav', errors);
  await page.close();
  ok('nav');
}

// --- 3. gallery interactions ------------------------------------------------
const { page, errors: galleryErrors } = await newPage('/gallery');

// buttons
if (!(await page.locator('#btn-disabled button').isDisabled())) fail('button', 'disabled not disabled');
if (!(await page.locator('#btn-loading .na-btn__spinner').count())) fail('button', 'loading spinner missing');
await page.locator('#btn-block').screenshot({ path: `${OUT}/btn-block.png` });
ok('buttons');

// switch / checkbox / radio — the native input is visually hidden (sr-only),
// so drive them the way a user does: click the visible label.
const swCheck = async () => page.locator('#sw-basic input').isChecked();
await page.locator('#sw-basic .na-switch').click();
await poll('switch', async () => (await swCheck()) === false);

await page.locator('#cb-basic .na-check').click();
await poll('checkbox', async () => page.locator('#cb-basic input').isChecked());

await page.locator('#radio-basic label', { hasText: 'Team' }).click();
await poll('radio', async () => page.locator('#radio-basic input').nth(2).isChecked());
await poll('radio-echo', async () => page.getByText('picked plan: team').count().then((n) => n > 0));
ok('toggles+radio');

// reactive disable (setDisabledState)
await page.locator('#btn-disable-fc button').click();
await poll('cva-disable', async () => page.locator('#sw-reactive input').isDisabled());
await page.locator('#btn-enable-fc button').click();
await poll('cva-enable', async () => page.locator('#sw-reactive input').isDisabled().then((d) => !d));
ok('cva-disabled');

// form submit
await page.locator('#form-nick').fill('ada');
await page.locator('na-form button[type="submit"]').click();
await poll('form-submit', async () => page.locator('#form-saved').count().then((n) => n > 0));
ok('form-submit');

// modal: open, Escape closes, backdrop closes
await page.locator('#btn-open-modal button').click();
await page.locator('na-modal [role="dialog"]').waitFor();
await page.screenshot({ path: `${OUT}/modal-open.png` });
await page.keyboard.press('Escape');
await poll('modal-escape', async () => page.locator('na-modal [role="dialog"]').count().then((n) => n === 0));
await page.locator('#btn-open-modal button').click();
await page.locator('na-modal [role="dialog"]').waitFor();
await page.locator('na-modal .na-modal__overlay').click({ position: { x: 40, y: 700 } });
await poll('modal-backdrop', async () => page.locator('na-modal [role="dialog"]').count().then((n) => n === 0));
ok('modal');

// tabs
await page.locator('#demo-tabs button[role="tab"]').nth(2).click();
await poll('tabs', async () => page.getByText('Panel 3 content.').count().then((n) => n > 0));
ok('tabs');

// projected tabs keep content mounted and switch by stable id
await page.locator('#tab-kept-input').fill('survives');
await page.locator('#tabs-projected button[role="tab"]').nth(1).click();
await poll('tabs-projected-hide', async () =>
  page.locator('#na-tab-upload-file-panel').getAttribute('hidden').then((h) => h !== null),
);
await page.locator('#tabs-projected button[role="tab"]').nth(0).click();
await poll('tabs-projected-state', async () =>
  page.locator('#tab-kept-input').inputValue().then((v) => v === 'survives'),
);
ok('tabs projected');

// icons ship as inline SVG (decorative unless labelled)
const iconCount = await page.locator('#icon-row svg').count();
const iconHidden = await page
  .locator('#icon-row svg')
  .evaluateAll((els) => els.filter((el) => el.getAttribute('aria-hidden') !== 'true').length);
if (iconCount < 12) fail('icons', `only ${iconCount} svg glyphs`);
if (iconHidden !== 1) fail('icons', `expected one labelled icon, got ${iconHidden}`);
ok('icons');

// copyable link: visible Copied! state + (copied) output
await page.locator('#link-copy .na-link__copy').click();
await poll('copy-label', async () =>
  page.locator('#link-copy .na-link__copy-label').textContent().then((t) => t === 'Copied!'),
);
await poll('copy-output', async () =>
  page.getByText('copied: https://example.com/share/abc123').count().then((n) => n > 0),
);
ok('copyable link');

// alert icon + description + close
if (!(await page.locator('#alert-rich .na-alert__icon svg').count())) fail('alert-icon', 'missing');
if (!(await page.locator('#alert-rich .na-alert__description').count()))
  fail('alert-description', 'missing');
await page.locator('#alert-rich .na-alert__close').click();
await poll('alert-close', async () => page.locator('#alert-rich').count().then((n) => n === 0));
ok('alert rich');

// segmented radio: inline, per-option disabled and selection
if (!(await page.locator('#radio-segmented .na-radio-group__options--segmented').count()))
  fail('radio-segmented', 'segmented class missing');
if (!(await page.locator('#radio-segmented input').nth(2).isDisabled()))
  fail('radio-segmented', 'third option should be disabled');
await page.locator('#radio-segmented .na-radio', { hasText: 'URL' }).click();
await poll('radio-segmented-pick', async () =>
  page.locator('#radio-segmented input').nth(1).isChecked(),
);
ok('radio segmented');

// upload dropzone: native button (keyboard) + drag-over state without consumer CSS
const dropTag = await page
  .locator('#upload-demo .na-upload__dropzone')
  .evaluate((el) => el.tagName);
if (dropTag !== 'BUTTON') fail('upload-keyboard', `dropzone is <${dropTag}>, expected <BUTTON>`);
await page.locator('#upload-demo .na-upload__dropzone').evaluate((el) => {
  const data = new DataTransfer();
  el.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }));
});
await poll('upload-dragover', async () =>
  page
    .locator('#upload-demo .na-upload__dropzone')
    .evaluate((el) => el.classList.contains('na-upload__dropzone--over')),
);
await page.locator('#upload-demo .na-upload__dropzone').evaluate((el) => {
  el.dispatchEvent(new DragEvent('dragleave', { bubbles: true, cancelable: true }));
});
await poll('upload-dragleave', async () =>
  page
    .locator('#upload-demo .na-upload__dropzone')
    .evaluate((el) => !el.classList.contains('na-upload__dropzone--over')),
);
ok('upload dropzone');

// P2 parity: select, datepicker, dropdown, popconfirm, drawer, pagination,
// skeleton, imperative message/notification.
await page.locator('#select-demo button[role="combobox"]').click();
await page.locator('#select-demo [role="option"]').first().waitFor();
if ((await page.locator('#select-demo [role="option"]').nth(3).getAttribute('aria-disabled')) !== 'true')
  fail('select', 'disabled option not disabled');
// Drive the listbox from the keyboard: ArrowDown moves from Pro to Team and
// Enter selects. This also avoids Playwright retrying a click when the option
// is detached as the menu closes.
await page.keyboard.press('ArrowDown');
await page.keyboard.press('Enter');
await poll('select', async () =>
  page.locator('#select-demo button[role="combobox"]').textContent().then((t) => t?.includes('Team')),
);
await poll('select-close', async () =>
  page
    .locator('#select-demo button[role="combobox"]')
    .getAttribute('aria-expanded')
    .then((v) => v === 'false'),
);
ok('select');

await page.locator('#datepicker-demo input[type="date"]').fill('2026-05-06');
await poll('datepicker', async () =>
  page.locator('#datepicker-demo input[type="date"]').inputValue().then((v) => v === '2026-05-06'),
);
ok('datepicker');

await page.locator('#dropdown-demo button').click();
await page.locator('#dropdown-demo [role="menuitem"]', { hasText: 'Edit' }).click();
await poll('dropdown', async () => page.getByText('action: Edit').count().then((n) => n > 0));
ok('dropdown');

await page.locator('#popconfirm-demo .na-popconfirm__trigger button').click();
await page.locator('#popconfirm-demo [role="alertdialog"]').waitFor();
await page.locator('#popconfirm-demo .na-popconfirm__button--confirm').click();
await poll('popconfirm', async () => page.getByText('confirmations: 1').count().then((n) => n > 0));
ok('popconfirm');

await page.locator('#drawer-open button').click();
await page.locator('#demo-drawer [role="dialog"]').waitFor();
await page.keyboard.press('Escape');
await poll('drawer-escape', async () =>
  page.locator('#demo-drawer [role="dialog"]').count().then((n) => n === 0),
);
await page.locator('#drawer-open button').click();
await page.locator('#demo-drawer [role="dialog"]').waitFor();
await page.locator('#demo-drawer .na-drawer__overlay').click({ position: { x: 40, y: 400 } });
await poll('drawer-backdrop', async () =>
  page.locator('#demo-drawer [role="dialog"]').count().then((n) => n === 0),
);
ok('drawer');

const initialPage = await page.locator('#pagination-demo [aria-current="page"]').textContent();
if (initialPage?.trim() !== '3') fail('pagination', `initial page ${initialPage}`);
await page.locator('#pagination-demo [aria-label="Page 4"]').click();
await poll('pagination', async () =>
  page
    .locator('#pagination-demo [aria-current="page"]')
    .textContent()
    .then((t) => t?.trim() === '4'),
);
ok('pagination');

if ((await page.locator('#sec-p2 .na-skeleton__shape').count()) < 4) fail('skeleton', 'shapes missing');
if (!(await page.locator('#sec-p2 .na-skeleton__shape--circle').count())) fail('skeleton', 'circle missing');
ok('skeleton');

await page.locator('#msg-success button').click();
await poll('message-success', async () =>
  page.locator('.na-message-stack .na-message--success', { hasText: 'Draft saved' }).count().then((n) => n > 0),
);
await page.locator('.na-message-stack .na-message__close').first().click();
await poll('message-dismiss', async () => page.locator('.na-message-stack').count().then((n) => n === 0));

await page.locator('#msg-error button').click();
await poll('message-error', async () =>
  page.locator('.na-message-stack .na-message--danger[role="alert"]').count().then((n) => n > 0),
);
await page.locator('.na-message-stack .na-message__close').first().click();

await page.locator('#notif-demo button').click();
await poll('notification', async () =>
  page.locator('.na-message-stack .na-message--notification .na-message__title', { hasText: 'Downloads' }).count().then((n) => n > 0),
);
await page.locator('.na-message-stack .na-message__close').first().click();
await poll('message-stack-clear', async () => page.locator('.na-message-stack').count().then((n) => n === 0));
ok('message/notification');

// tooltip attributes
const tipSpanTab = await page.locator('#tip-span').getAttribute('tabindex');
const tipBtnTab = await page.locator('#tip-btn').getAttribute('tabindex');
const tipEmptyData = await page.locator('#tip-empty').getAttribute('data-na-tooltip');
const tipEmptyTab = await page.locator('#tip-empty').getAttribute('tabindex');
if (tipSpanTab !== '0') fail('tooltip', `span tabindex=${tipSpanTab}`);
if (tipBtnTab !== null) fail('tooltip', `button tabindex=${tipBtnTab}`);
if (tipEmptyData !== null) fail('tooltip', `empty bubble data=${tipEmptyData}`);
if (tipEmptyTab !== null) fail('tooltip', `empty tabindex=${tipEmptyTab}`);
await page.locator('#tip-span').hover();
await page.locator('#sec-overlay').screenshot({ path: `${OUT}/tooltip-hover.png` });
ok('tooltip');

// breadcrumbs
const crumbLinks = page.locator('#crumbs-href a.na-crumbs__link');
if ((await crumbLinks.nth(0).getAttribute('href')) !== '/') fail('breadcrumbs', 'home href wrong');
if ((await crumbLinks.nth(1).getAttribute('href')) !== '/gallery') fail('breadcrumbs', 'gallery href wrong');
if (!(await page.locator('#crumbs-href .na-crumbs__current').count())) fail('breadcrumbs', 'current missing');
ok('breadcrumbs');

// progress clamp
const aria150 = await page.locator('#prog-150 [role="progressbar"]').getAttribute('aria-valuenow');
const ariaNeg = await page.locator('#prog-neg [role="progressbar"]').getAttribute('aria-valuenow');
const w100 = await page.locator('#prog-100 .na-progress__fill').evaluate((el) => el.getBoundingClientRect().width);
const w150 = await page.locator('#prog-150 .na-progress__fill').evaluate((el) => el.getBoundingClientRect().width);
measures.progress = { aria150, ariaNeg, w100, w150 };
if (aria150 !== '100' || ariaNeg !== '0') fail('progress', `aria ${aria150}/${ariaNeg}`);
if (w150 > w100 + 0.5) fail('progress', `overflow: 150 fill ${w150}px > 100 fill ${w100}px`);
ok('progress');

// avatar initials + sizes (size input is suspected dead — measured, not assumed)
const dbl = await page.locator('#avatar-double .na-avatar__initials').textContent();
measures.avatarInitials = dbl;
if (dbl !== 'AL') fail('avatar', `double-space initials="${dbl}"`);
for (const id of ['#avatar-sm', '#avatar-lg']) {
  measures[id] = await page.locator(id).evaluate((el) => el.getBoundingClientRect().width);
}
const smW = measures['#avatar-sm'];
const lgW = measures['#avatar-lg'];
const mdW = await page.locator('na-avatar:not([id])').first().evaluate((el) => el.getBoundingClientRect().width);
measures.avatarWidths = { sm: smW, md: mdW, lg: lgW };
if (smW === mdW && mdW === lgW) fail('avatar', `size input dead: sm=${smW} md=${mdW} lg=${lgW}`);
ok('avatar');

// bare link has no href (no top-jump)
if ((await page.locator('#link-bare').getAttribute('href')) !== null) fail('link', 'bare link has href');
ok('link');

// mobile pass: landing + gallery full page
const mob = await browser.newContext({ viewport: { width: 390, height: 844 } });
for (const [route, name] of [['/', 'landing'], ['/gallery', 'gallery']]) {
  const p = await mob.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(BASE + route, { waitUntil: 'networkidle' });
  if (errs.length) fail(`${name} mobile`, errs.join(' | '));
  await p.screenshot({ path: `${OUT}/${name}-mobile.png`, fullPage: true });
  await p.close();
}
ok('mobile screenshots');

checkJsErrors('gallery', galleryErrors);

// --- 4. design-system rhythm (locks the type/control/motion system) --------
{
  const h = async (sel) =>
    page.locator(sel).first().evaluate((el) => el.getBoundingClientRect().height);
  const rhythm = {
    input: await h('#field-email'),
    btnMd: await h('#btn-md button'),
    btnSm: await h('#btn-sm button'),
    btnLg: await h('#btn-lg button'),
    tab: await h('#demo-tabs button[role="tab"]'),
    formSubmit: await h('na-form button[type="submit"]'),
  };
  measures.rhythm = rhythm;
  // Sizes share a baseline per step; only the md tier must match exactly.
  const expected = { input: 40, btnMd: 40, tab: 40, formSubmit: 40, btnSm: 32, btnLg: 48 };
  for (const [k, want] of Object.entries(expected)) {
    if (Math.abs(rhythm[k] - want) > 1.5) fail(`rhythm ${k}`, `${rhythm[k]}px, expected ${want}px`);
  }
  if (!(rhythm.btnSm < rhythm.btnMd && rhythm.btnMd < rhythm.btnLg))
    fail('rhythm sizes', `sm=${rhythm.btnSm} md=${rhythm.btnMd} lg=${rhythm.btnLg}`);

  // Focus offsets must agree. Unfocused elements report the computed default
  // (0px), so read them off a :focus-visible rule instead of live state.
  const offsets = await page.evaluate(() => {
    const rules = [...document.styleSheets]
      .flatMap((sh) => {
        try {
          return [...sh.cssRules];
        } catch {
          return [];
        }
      })
      .filter((r) => r.selectorText && r.selectorText.includes('focus-visible'));
    const map = {};
    for (const r of rules) {
      const off = r.style.outlineOffset || r.style.getPropertyValue('outline-offset');
      if (off) map[r.selectorText.replace(/\s+/g, ' ').trim()] = off;
    }
    return map;
  });
  measures.focusOffsets = offsets;
  const vals = new Set(Object.values(offsets));
  if (vals.size > 1) fail('focus-offset', JSON.stringify(offsets));
  // All rules must resolve to the same offset (through the token).
  for (const v of vals) {
    if (!/var\(--na-focus-offset,\s*2px\)$/.test(v) && v !== '2px')
      fail('focus-offset', `unresolved: ${v}`);
  }

  // every container shares one border weight/color; controls use --na-border resting
  const borders = await page.evaluate(() => {
    const cs = (sel) => {
      const s = getComputedStyle(document.querySelector(sel));
      return `${s.borderTopWidth} ${s.borderTopColor}`;
    };
    return { card: cs('.na-card'), alert: cs('.na-alert'), table: cs('.na-table-wrap'), input: cs('#field-email') };
  });
  measures.borders = borders;
  if (new Set([borders.card, borders.alert, borders.table]).size !== 1)
    fail('borders', JSON.stringify(borders));

  // type ramp: no component should render an off-ramp size
  const ramp = new Set(['12px', '13px', '14px', '16px', '18px', '24px', '30px']);
  const sizes = await page.evaluate(() => {
    const pick = (sel) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el).fontSize : null;
    };
    return {
      h1: pick('na-heading h1'),
      h2: pick('#sec-buttons h2'),
      h3: pick('#sec-type na-heading h3'),
      cardTitle: pick('.na-card__title'),
      fieldLabel: pick('.na-field__label'),
      hint: pick('.na-field__hint'),
      badge: pick('.na-badge'),
      headerTitle: pick('.na-header__title'),
    };
  });
  measures.typeSizes = sizes;
  for (const [k, v] of Object.entries(sizes)) if (!ramp.has(v)) fail(`type-ramp ${k}`, `${v} off-ramp`);
  if (!(parseInt(sizes.h1) > parseInt(sizes.h2) && parseInt(sizes.h2) > parseInt(sizes.h3)))
    fail('type-scale', `h1=${sizes.h1} h2=${sizes.h2} h3=${sizes.h3}`);
  if (parseInt(sizes.h2) <= parseInt(sizes.headerTitle))
    fail('type-scale', `h2 ${sizes.h2} must outrank header title ${sizes.headerTitle}`);

  // no weight outside 500/600/700
  const weights = await page.evaluate(() =>
    [...document.querySelectorAll('na-card__title, .na-alert__title, .na-field__label, .na-badge, h1, h2')]
      .map((el) => getComputedStyle(el).fontWeight)
      .filter((w) => !['500', '600', '700'].includes(w)),
  );
  if (weights.length) fail('font-weights', `off-ramp: ${[...new Set(weights)].join(',')}`);

  // na-form must be flat (no box inside a box) and empty-state solid
  const formFlat = await page.evaluate(() => {
    const s = getComputedStyle(document.querySelector('na-form .na-form'));
    return { bg: s.backgroundColor, bw: s.borderTopWidth, pad: s.paddingTop };
  });
  measures.formFlat = formFlat;
  if (formFlat.bw !== '0px' || formFlat.pad !== '0px' || formFlat.bg !== 'rgba(0, 0, 0, 0)')
    fail('form-flat', JSON.stringify(formFlat));
  const emptyBorder = await page.evaluate(() => getComputedStyle(document.querySelector('.na-empty')).borderTopStyle);
  if (emptyBorder !== 'solid') fail('empty-state', `border-style=${emptyBorder}`);
  ok('rhythm/type/borders');
}

// Control boxes must align to a shared baseline, not sit 1px proud/short.
{
  const boxes = await page.evaluate(() => {
    const box = (sel, hostSel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const host = el.closest(hostSel);
      const r = el.getBoundingClientRect();
      const hr = host.getBoundingClientRect();
      return {
        top: +(r.top - hr.top).toFixed(1),
        h: +r.height.toFixed(1),
        rowH: +hr.height.toFixed(1),
      };
    };
    return {
      check: box('.na-check__box', 'na-checkbox'),
      radio: box('.na-radio__dot', '.na-radio'),
      switchTrack: box('.na-switch__track', 'na-switch'),
    };
  });
  measures.boxes = boxes;
  for (const [k, v] of Object.entries(boxes)) {
    if (!v) {
      fail(`box-missing ${k}`, 'selector not found');
      continue;
    }
    if (v.h > 24) fail(`box-size ${k}`, `${v.h}px too tall`);
    // vertically centred inside its 40px row: offset should be ~11px each way
    const off = v.top;
    if (Math.abs(off - (v.rowH - v.h) / 2) > 1.5) fail(`box-align ${k}`, `top=${off} row=${v.rowH} box=${v.h}`);
  }
  ok('control alignment');
}

// --- 4b. shell header across viewports --------------------------------------
// Exact usage under review: na-header maxWidth="full" with an na-row in the
// actions slot. Measures gutters, vertical centring, stacking and overflow.
{
  const headerRuns = {};
  for (const width of [1440, 1024, 900, 768, 390]) {
    const vp = await browser.newPage({ viewport: { width, height: 900 } });
    await vp.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const m = await vp.evaluate(() => {
      const header = document.querySelector('na-header .na-header');
      const titles = header.querySelector('.na-header__titles').getBoundingClientRect();
      const actions = header.querySelector('.na-header__actions').getBoundingClientRect();
      const bar = header.getBoundingClientRect();
      const hs = getComputedStyle(header);
      const page = document.querySelector('na-page .na-page');
      const footer = document.querySelector('na-footer .na-footer');
      return {
        leftGutter: +(titles.left - bar.left).toFixed(1),
        rightGutter: +(bar.right - actions.right).toFixed(1),
        rightOverflow: +Math.max(0, actions.right - (bar.right - parseFloat(hs.paddingRight))).toFixed(1),
        actionsInset: +(actions.left - bar.left).toFixed(1),
        stacked: actions.top >= titles.bottom - 0.5,
        collide: actions.top < titles.bottom - 0.5 && titles.right > actions.left + 0.5,
        centreDelta: +Math.abs((titles.top + titles.bottom) / 2 - (actions.top + actions.bottom) / 2).toFixed(1),
        // Frame rhythm: bar owns its edge padding; the gaps around na-page
        // must be exactly one section step (32), never doubled.
        topPad: parseFloat(hs.paddingTop),
        hairlineGap: +(page.firstElementChild.getBoundingClientRect().top - bar.bottom).toFixed(1),
        footerGap: +(footer.getBoundingClientRect().top - page.lastElementChild.getBoundingClientRect().bottom).toFixed(1),
        footerPadBottom: parseFloat(getComputedStyle(footer).paddingBottom),
        scrollW: document.documentElement.scrollWidth,
        innerW: window.innerWidth,
      };
    });
    headerRuns[width] = m;
    const tag = `header@${width}`;
    if (m.scrollW > m.innerW) fail(`${tag} overflow`, `scrollWidth ${m.scrollW} > ${m.innerW}`);
    if (m.rightOverflow > 1.5) fail(`${tag} overflow-right`, `actions exceed content box by ${m.rightOverflow}px`);
    if (m.collide) fail(`${tag} collide`, 'title and actions overlap');
    if (Math.abs(m.topPad - 16) > 1.5) fail(`${tag} top-pad`, `${m.topPad}px, expected 16`);
    if (Math.abs(m.hairlineGap - 32) > 1.5) fail(`${tag} hairline-gap`, `${m.hairlineGap}px, expected 32`);
    if (Math.abs(m.footerGap - 32) > 1.5) fail(`${tag} footer-gap`, `${m.footerGap}px, expected 32`);
    if (Math.abs(m.footerPadBottom - 16) > 1.5) fail(`${tag} footer-pad`, `${m.footerPadBottom}px, expected 16`);
    if (m.stacked) {
      if (Math.abs(m.actionsInset - 16) > 1.5) fail(`${tag} stacked-inset`, `${m.actionsInset}px, expected 16`);
    } else {
      if (Math.abs(m.leftGutter - 16) > 1.5) fail(`${tag} left-gutter`, `${m.leftGutter}px, expected 16`);
      if (Math.abs(m.rightGutter - 16) > 1.5) fail(`${tag} right-gutter`, `${m.rightGutter}px, expected 16`);
      if (m.centreDelta > 1.5) fail(`${tag} centring`, `${m.centreDelta}px off-centre`);
    }
    await vp.locator('na-header').screenshot({ path: `${OUT}/header-${width}.png` });
    await vp.close();
  }
  measures.header = headerRuns;
  console.log('header metrics:', JSON.stringify(headerRuns));
  ok('header across viewports');

  // Long unbroken title: must wrap inside the bar, not overflow or overlap actions.
  const longRuns = {};
  for (const width of [1440, 390]) {
    const vp = await browser.newPage({ viewport: { width, height: 900 } });
    await vp.goto(`${BASE}/gallery`, { waitUntil: 'networkidle' });
    const m = await vp.evaluate(() => {
      const host = document.querySelector('#header-long');
      const titles = host.querySelector('.na-header__titles').getBoundingClientRect();
      const actions = host.querySelector('.na-header__actions').getBoundingClientRect();
      return {
        titlesRight: +titles.right.toFixed(1),
        actionsRight: +actions.right.toFixed(1),
        collide: actions.top < titles.bottom - 0.5 && titles.right > actions.left + 0.5,
        innerW: window.innerWidth,
      };
    });
    longRuns[width] = m;
    const tag = `header-long@${width}`;
    if (m.titlesRight > m.innerW + 0.5) fail(`${tag} overflow`, `title box ends at ${m.titlesRight} > ${m.innerW}`);
    if (m.actionsRight > m.innerW + 0.5) fail(`${tag} overflow`, `actions end at ${m.actionsRight} > ${m.innerW}`);
    if (m.collide) fail(`${tag} collide`, 'title and actions overlap');
    await vp.locator('#header-long').screenshot({ path: `${OUT}/header-long-${width}.png` });
    await vp.close();
  }
  measures.headerLong = longRuns;
  console.log('header-long metrics:', JSON.stringify(longRuns));
  ok('header long title');

  // Bottom hairline must be token-driven: overriding --na-border has to repaint it.
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const hairline = await p.evaluate(() => {
    const header = document.querySelector('na-header .na-header');
    const footer = document.querySelector('na-footer .na-footer');
    const root = document.documentElement;
    const read = () => [getComputedStyle(header).borderBottomColor, getComputedStyle(footer).borderTopColor];
    const before = read();
    root.style.setProperty('--na-border', 'rgb(255, 0, 0)');
    const overridden = read();
    root.style.removeProperty('--na-border');
    return { before, overridden };
  });
  measures.hairline = hairline;
  if (!hairline.overridden.every((c) => c === 'rgb(255, 0, 0)')) {
    fail('hairline', `not token-driven: ${JSON.stringify(hairline)}`);
  }
  await p.close();
  ok('hairline token');
}

// --- 5. per-section close-ups for visual review -----------------------------
for (const sec of ['sec-buttons', 'sec-forms', 'sec-type', 'sec-display', 'sec-layout', 'sec-overlay', 'sec-migration']) {
  await page.locator(`#${sec}`).screenshot({ path: `${OUT}/${sec}.png` });
}
ok('section close-ups');

checkJsErrors('gallery (post-measure)', galleryErrors);
await page.close();
await browser.close();

writeFileSync(`${OUT}/summary.json`, JSON.stringify({ failures, measures }, null, 2));
console.log(`\n${failures.length} failures`);
process.exit(failures.length ? 1 : 0);
