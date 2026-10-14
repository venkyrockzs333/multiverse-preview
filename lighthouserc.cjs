const desktop = process.env.LH_PRESET === 'desktop';
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist', numberOfRuns: 1,
      settings: { ...(desktop ? { preset: 'desktop' } : {}), chromeFlags: '--no-sandbox --headless=new --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader' },
    },
    assert: { assertions: {
      'categories:performance': ['warn', { minScore: desktop ? 0.9 : 0.8 }],
      'categories:accessibility': ['error', { minScore: 0.9 }],
      'categories:best-practices': ['warn', { minScore: 0.9 }],
    } },
    upload: { target: 'filesystem', outputDir: `./.lighthouseci/${desktop ? 'desktop' : 'mobile'}` },
  },
};
