// Zero-dependency build: copy static site to dist/ and stamp cache-busting version (git sha).
import { cpSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
const v = (() => { try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch { return String(Date.now()); } })();
rmSync('dist', { recursive: true, force: true }); mkdirSync('dist');
for (const p of ['index.html', 'robots.txt', '.nojekyll', 'css', 'js', 'fonts', 'assets', 'vendor']) cpSync(p, `dist/${p}`, { recursive: true });
const f = 'dist/index.html';
writeFileSync(f, readFileSync(f, 'utf8').replace(/\?v=\d+/g, `?v=${v}`));
console.log('built dist/ with v=' + v);
