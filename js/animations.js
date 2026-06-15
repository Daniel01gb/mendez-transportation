/* ── SCROLL REVEAL (all directions) ── */
const revealAll = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 90);
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
revealAll.forEach(el => revealObs.observe(el));

/* ── COUNTER ANIMATION ── */
function animateCounter(el, target, duration = 1800) {
  let start = 0;
  const step = (ts) => {
    if (!start) start = ts;
    const p = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(eased * target);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}
const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target, parseInt(entry.target.dataset.count));
      counterObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach(el => counterObs.observe(el));

/* ── CARD TILT ── */
function applyTilt(card) {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    card.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-6px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)';
    card.style.transform = '';
    setTimeout(() => card.style.transition = '', 500);
  });
  card.addEventListener('mouseenter', () => { card.style.transition = 'transform .1s'; });
}
document.querySelectorAll('.service-card, .stat-card').forEach(applyTilt);

/* ── RIPPLE EFFECT ── */
function addRipple(e, el) {
  const r = document.createElement('div');
  r.className = 'ripple';
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px`;
  el.appendChild(r);
  r.addEventListener('animationend', () => r.remove());
}
// Make addRipple globally accessible (used in HTML onclick attributes)
window.addRipple = addRipple;

document.querySelectorAll('.ripple-host').forEach(el => {
  el.addEventListener('click', e => addRipple(e, el));
});
document.querySelectorAll('.btn-primary, .btn-secondary, .btn-cta-phone').forEach(el => {
  el.classList.add('ripple-host');
  el.addEventListener('click', e => addRipple(e, el));
});

/* ── SHAKE KEYFRAME (injected dynamically) ── */
const shakeStyle = document.createElement('style');
shakeStyle.textContent = '@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }';
document.head.appendChild(shakeStyle);
