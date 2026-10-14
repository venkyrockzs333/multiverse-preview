import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests', timeout: 45000, retries: 0, reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: { baseURL: process.env.BASE_URL || 'http://localhost:4173/', launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: process.env.BASE_URL ? undefined : { command: 'npx http-server dist -p 4173 -c-1 -s', url: 'http://localhost:4173/', reuseExistingServer: true },
});
