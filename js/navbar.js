/* ── NAVBAR SCROLL STATE ── */
const navbar = document.querySelector('.navbar');
function updateNavbar() {
  navbar.classList.toggle('scrolled', window.scrollY > 72);
}
window.addEventListener('scroll', updateNavbar, { passive: true });
updateNavbar();

/* ── HAMBURGER / MOBILE DRAWER ── */
const hamburger     = document.getElementById('hamburger');
const mobileNav     = document.getElementById('mobileNav');
const mobileOverlay = document.getElementById('mobileOverlay');

function toggleMenu(open) {
  hamburger.classList.toggle('open', open);
  mobileNav.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
hamburger.addEventListener('click', () => toggleMenu(!hamburger.classList.contains('open')));
mobileOverlay.addEventListener('click', () => toggleMenu(false));
mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

/* ── DRAWER CLOSE BUTTON ── */
document.getElementById('drawerClose').addEventListener('click', () => {
  document.getElementById('mobileNav').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
  document.body.style.overflow = '';
});

/* ── ACTIVE NAV LINK (IntersectionObserver for sections) ── */
(function initActiveNav() {
  const sections = [
    { id: 'home',        href: '#home' },
    { id: 'about',       href: '#about' },
    { id: 'services',    href: '#services' },
    { id: 'areas',       href: '#areas' },
    { id: 'faq',         href: '#faq' },
    { id: 'contact',     href: '#contact' },
  ];
  const navLinks = document.querySelectorAll('.nav-links a');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + id);
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) observer.observe(el);
  });
})();
