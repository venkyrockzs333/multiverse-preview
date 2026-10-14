// Zero-dependency build: copy static site to dist/ and stamp cache-busting version (git sha).
import { existsSync, cpSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
const v = (() => { try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch { return String(Date.now()); } })();
rmSync('dist', { recursive: true, force: true }); mkdirSync('dist');
for (const p of ['index.html', 'robots.txt', '.nojekyll', 'css', 'js', 'fonts', 'assets', 'vendor']) cpSync(p, `dist/${p}`, { recursive: true });
const f = 'dist/index.html';
writeFileSync(f, readFileSync(f, 'utf8').replace(/\?v=\d+/g, `?v=${v}`));
// Résumé: the public build always ships the phone-free PDF. RESUME_WITH_PHONE=1 swaps in the private
// source (private/ is git-ignored and never deployed by CI) for local/offline use only.
if (process.env.RESUME_WITH_PHONE === '1' && existsSync('private/Resume_source_with_phone.pdf')) {
  cpSync('private/Resume_source_with_phone.pdf', 'dist/assets/Venkateshwarlu_Boda_Resume.pdf');
  console.warn('WARNING: dist contains the résumé WITH phone number. Do not deploy.');
}
console.log('built dist/ with v=' + v);
