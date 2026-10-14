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
  await page.goto('./'); await page.waitForTimeout(2000);
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
  console.log('AXE', JSON.stringify(r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length }))));
  expect(bad, JSON.stringify(bad.map((v) => v.id))).toEqual([]);
});
