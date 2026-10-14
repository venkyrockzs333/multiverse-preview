// DOM-first UI shell: menu, keyboard, no-3D fallback. Loads immediately; needs no WebGL, GSAP or three.js.
const root = document.documentElement;
root.classList.add('js');
const burger = document.getElementById('burger'), menu = document.getElementById('menu');
const focusables = () => [burger, ...menu.querySelectorAll('a')];
export function setMenu(open) {
  if (open === !menu.hidden) return;
  root.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menu.hidden = !open;
  if (open) menu.querySelector('a').focus();
  dispatchEvent(new CustomEvent('menuchange', { detail: { open } }));
}
window.__ui = { setMenu, isOpen: () => !menu.hidden };
burger.addEventListener('click', () => setMenu(menu.hidden));
menu.addEventListener('click', (e) => { if (e.target.closest('a') && !window.__mvReady) setMenu(false); });
addEventListener('keydown', (e) => {
  if (menu.hidden) return;
  if (e.key === 'Escape') { setMenu(false); burger.focus(); }
  if (e.key === 'Tab') { // focus trap while the menu dialog is open
    const f = focusables(), i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  }
});
addEventListener('resize', () => { if (innerWidth > 1180 && !menu.hidden) setMenu(false); });

export function noWebGLFallback() {
  root.classList.add('no-webgl', 'ready');
  document.querySelectorAll('.reveal').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
}
