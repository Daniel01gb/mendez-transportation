/* ── PARTICLES ── */
function initParticles(containerId, count) {
  const container = document.getElementById(containerId);
  if (!container) return;
  function makeParticle() {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 3 + Math.random() * 6;
    const left = Math.random() * 100;
    const dur  = 7 + Math.random() * 12;
    const del  = Math.random() * 10;
    p.style.cssText = `width:${size}px;height:${size}px;left:${left}%;animation-duration:${dur}s;animation-delay:${del}s;`;
    container.appendChild(p);
    p.addEventListener('animationend', () => { p.remove(); makeParticle(); });
  }
  for (let i = 0; i < count; i++) makeParticle();
}
initParticles('particles', 28);
initParticles('howParticles', 22);
initParticles('footerParticles', 18);
