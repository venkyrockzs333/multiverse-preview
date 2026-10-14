// Fallback when WebGL is unavailable: no 3D, all content visible, menu + anchors still work.
const root = document.documentElement;
root.classList.add('ready');
document.querySelectorAll('.reveal').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
const burger = document.getElementById('burger'), menu = document.getElementById('menu');
function setMenu(open) {
  root.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menu.hidden = !open;
  if (open) { menu.querySelectorAll('li').forEach((li) => { li.style.opacity = 1; li.style.transform = 'none'; }); menu.querySelector('a').focus(); }
}
burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); } });
