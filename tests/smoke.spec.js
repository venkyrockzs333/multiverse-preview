import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function collect(page) {
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  return errs;
}

test('loads with no console errors, preview markers present', async ({ page }) => {
  const errs = collect(page);
  const res = await page.goto('./'); expect(res.status()).toBe(200);
  await page.waitForTimeout(2500);
  await expect(page).toHaveTitle(/Project Engineer at Wipro/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('.preview-badge')).toBeVisible();
  expect(errs).toEqual([]);
});

test('no K2, no phone number, verified contact links', async ({ page }) => {
  await page.goto('./');
  const html = await page.content();
  expect(html).not.toMatch(/\bK2\b/);
  expect(html).not.toMatch(/78937|98222|tel:/);
  await expect(page.locator('a[href="mailto:venkateshwarluboda1806@gmail.com"]').first()).toBeAttached();
  await expect(page.locator('a[href="https://www.linkedin.com/in/venkateshwarlu-boda-901b50270/"]').first()).toBeAttached();
  for (const t of ['PowerShell', 'Visual Studio<', 'Windows Update']) expect(html).not.toContain(t);
});

test('nav anchors resolve to sections', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  const hrefs = await page.locator('.nav-links a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThan(3);
  for (const h of hrefs) expect(await page.locator(h).count(), h).toBe(1);
  await page.locator('.nav-links a[href="#projects"]').click();
  await expect.poll(async () => page.evaluate(() => Math.abs(document.querySelector('#projects').getBoundingClientRect().top)), { timeout: 8000 }).toBeLessThan(150);
});

test('mobile menu opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  const b = page.locator('#burger');
  await expect(b).toBeVisible();
  await b.click();
  await expect(b).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(b).toHaveAttribute('aria-expanded', 'false');
});

test('reduced motion: content visible, no errors', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage(); const errs = collect(page);
  await page.goto('./'); await page.waitForTimeout(1500);
  await page.locator('#contact').scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
  const op = await page.locator('#contact h2').evaluate((e) => getComputedStyle(e).opacity);
  expect(Number(op)).toBeGreaterThan(0.9);
  expect(errs).toEqual([]); await ctx.close();
});

test('WebGL disabled: page still usable, no uncaught errors', async ({ browser }) => {
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/i.test(t) ? null : orig.call(this, t, ...a); };
  });
  const page = await ctx.newPage(); const errs = collect(page);
  await page.goto('./'); await page.waitForTimeout(2000);
  await expect(page.locator('h1')).toBeVisible();
  await page.locator('#contact').scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
  await expect(page.locator('#contact h2')).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/no-webgl/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#burger').click();
  await expect(page.locator('#menu')).toBeVisible();
  expect(errs).toEqual([]);
  await ctx.close();
});

test('axe-core: no serious/critical violations', async ({ page }) => {
  await page.goto('./'); await page.waitForFunction(() => window.__mvReady || document.documentElement.classList.contains('no-webgl'), null, { timeout: 15000 });
  await page.waitForTimeout(6000); // let the hero intro finish so axe sees final, not mid-fade, colours
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
  console.log('AXE', JSON.stringify(r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length }))));
  expect(bad, JSON.stringify(bad.map((v) => v.id))).toEqual([]);
});

// Perf regression: once idle, no app rAF work and no WebGL draw calls (true on-demand rendering).
// Note: ScrollTrigger 3.15 keeps its own empty `_rafBugFix` rAF alive by design; it is counted separately.
test('perf: idle = 0 WebGL draws and 0 app rAF callbacks; wakes on scroll', async ({ page }) => {
  await page.addInitScript(() => {
    window.__raf = 0; window.__rafST = 0; window.__draws = 0;
    const o = window.requestAnimationFrame.bind(window);
    // app rAF = gsap.ticker (drives render + Lenis) or any other non-ScrollTrigger caller
    window.requestAnimationFrame = (cb) => { const st = /ScrollTrigger\.min\.js/.test(new Error().stack || ''); return o((t) => { st ? window.__rafST++ : window.__raf++; cb(t); }); };
    for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) if (C) for (const m of ['drawElements', 'drawArrays']) {
      const f = C.prototype[m]; C.prototype[m] = function (...a) { window.__draws++; return f.apply(this, a); };
    }
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  await page.waitForFunction(() => window.__mvReady, null, { timeout: 15000 });
  // wait (max 20 s) until the app loop has gone to sleep: intro tweens end, then gsap.ticker autoSleeps
  await expect.poll(async () => { const a = await page.evaluate(() => window.__raf); await page.waitForTimeout(1000); return (await page.evaluate(() => window.__raf)) - a; }, { timeout: 20000, intervals: [0] }).toBe(0);
  const s0 = await page.evaluate(() => ({ r: window.__raf, d: window.__draws, st: window.__rafST }));
  await page.waitForTimeout(2000);
  const s1 = await page.evaluate(() => ({ r: window.__raf, d: window.__draws, st: window.__rafST }));
  console.log('IDLE_2S app_raf', s1.r - s0.r, 'draws', s1.d - s0.d, 'scrolltrigger_noop_raf', s1.st - s0.st);
  expect(s1.d - s0.d).toBe(0);
  expect(s1.r - s0.r).toBe(0);
  await page.mouse.move(700, 450); await page.mouse.wheel(0, 600); await page.waitForTimeout(700);
  const s2 = await page.evaluate(() => ({ r: window.__raf, d: window.__draws }));
  console.log('WAKE app_raf', s2.r - s1.r, 'draws', s2.d - s1.d);
  expect(s2.d - s1.d).toBeGreaterThan(5);
});

test('3D layer is deferred: three.js not requested before first paint', async ({ page }) => {
  const order = []; page.on('request', (r) => order.push(r.url()));
  await page.goto('./');
  const fcp = await page.evaluate(() => new Promise((ok) => new PerformanceObserver((l) => { const e = l.getEntriesByName('first-contentful-paint')[0]; if (e) ok(e.startTime); }).observe({ type: 'paint', buffered: true })));
  await page.waitForFunction(() => window.__mvReady, null, { timeout: 15000 });
  const three = await page.evaluate(() => performance.getEntriesByType('resource').find((r) => /three\.module/.test(r.name)).startTime);
  console.log('FCP', Math.round(fcp), 'THREE_START', Math.round(three));
  expect(three).toBeGreaterThan(fcp);
});
