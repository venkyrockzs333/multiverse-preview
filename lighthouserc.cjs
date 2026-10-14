// Lighthouse CI: automated, headless Chromium with SwiftShader software GL. NOT real-device numbers.
const desktop = process.env.LH_PRESET === 'desktop';
const m = (v, level = 'error') => [level, { maxNumericValue: v, aggregationMethod: 'median-run' }];
// TBT under SwiftShader scales with runner CPU (measured: desktop median ~0.8 s on the box, 3.8 s on a GitHub
// runner, 7.9 s pinned to 1 core). It is a hard gate locally and a reported warning in CI; the CPU-independent
// gates in CI are the Playwright idle-loop test, LCP (simulated, stable), CLS, a11y and script size.
const tbtLevel = process.env.CI ? 'warn' : 'error';
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist', numberOfRuns: 3,
      settings: { ...(desktop ? { preset: 'desktop' } : {}), chromeFlags: '--no-sandbox --headless=new --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader' },
    },
    assert: { assertions: {
      'categories:performance': ['warn', { minScore: desktop ? 0.9 : 0.8, aggregationMethod: 'median-run' }],
      'categories:accessibility': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
      // regression budgets (Phase 1 medians: desktop TBT ~720 ms / LCP ~0.5 s; mobile TBT ~3.7 s / LCP ~2.0 s)
      'total-blocking-time': m(desktop ? 2000 : 7000, tbtLevel),
      'largest-contentful-paint': m(desktop ? 1200 : 3000),
      'cumulative-layout-shift': m(0.05),
      'resource-summary:script:size': ['error', { maxNumericValue: 1000000 }],
    } },
    upload: { target: 'filesystem', outputDir: `./.lighthouseci/${desktop ? 'desktop' : 'mobile'}` },
  },
};
