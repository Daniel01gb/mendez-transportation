/* ── HERO CAROUSEL ── */
(function initCarousel() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.carousel-dot');
  let current  = 0;
  let timer;

  function goTo(n) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (n + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function start() { timer = setInterval(next, 5500); }
  function reset() { clearInterval(timer); start(); }

  dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); reset(); }));
  document.querySelector('.carousel-arrow.next').addEventListener('click', () => { next(); reset(); });
  document.querySelector('.carousel-arrow.prev').addEventListener('click', () => { prev(); reset(); });

  // Swipe support on mobile
  let touchStartX = 0;
  const hero = document.querySelector('.hero');
  hero.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); reset(); }
  }, { passive: true });

  start();
})();

/* ── HOW IT WORKS CAROUSEL ── */
(function initHowCarousel() {
  const slides = document.querySelectorAll('.how-slide');
  const dots   = document.querySelectorAll('.how-dots .carousel-dot');
  if (!slides.length) return;
  let cur = 0, timer;

  function goTo(n) {
    slides[cur].classList.remove('active');
    dots[cur].classList.remove('active');
    cur = (n + slides.length) % slides.length;
    const s = slides[cur];
    s.classList.add('active');
    dots[cur].classList.add('active');
    s.style.animation = 'none';
    void s.offsetWidth;
    s.style.animation = '';
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo(cur + 1), 5500);
  }

  dots.forEach((d, i) => d.addEventListener('click', () => { goTo(i); resetTimer(); }));

  const howPrev = document.getElementById('howPrev');
  const howNext = document.getElementById('howNext');
  if (howPrev) howPrev.addEventListener('click', () => { goTo(cur - 1); resetTimer(); });
  if (howNext) howNext.addEventListener('click', () => { goTo(cur + 1); resetTimer(); });

  resetTimer();
})();
