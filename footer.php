<?php
$cat_links = [];
$cat_names = ['Noticias','Salud','Deportes','Internacional','Tecnología','Entretenimiento'];
$cat_slugs = ['noticias','salud','deportes','internacional','tecnologia','entretenimiento'];
foreach ( $cat_slugs as $i => $slug ) {
    $term = get_term_by('slug', $slug, 'category');
    $cat_links[] = ['name' => $cat_names[$i], 'url' => $term ? get_category_link($term->term_id) : '#'];
}
?>

<footer class="footer">
  <div class="container">
    <div class="footer-grid">

      <div class="f-brand">
        <h2>Emu<span>Blog</span></h2>
        <p>Noticias verificadas de México y Estados Unidos. Análisis profundo y cobertura en tiempo real de los temas que importan a nuestra comunidad hispanohablante.</p>
        <p style="font-size:.75rem;color:rgba(255,255,255,.3);margin-top:-.4rem;">Periodismo independiente · Sin agenda política</p>
        <div class="f-social">
          <a href="#" class="f-social-btn" title="Twitter/X">𝕏</a>
          <a href="#" class="f-social-btn" title="Facebook">f</a>
          <a href="#" class="f-social-btn" title="Instagram">◻</a>
          <a href="#" class="f-social-btn" title="YouTube">▶</a>
        </div>
      </div>

      <div class="f-col">
        <h4>Secciones</h4>
        <ul class="f-links">
          <?php foreach ( $cat_links as $cl ) : ?>
          <li><a href="<?php echo esc_url($cl['url']); ?>"><?php echo esc_html($cl['name']); ?></a></li>
          <?php endforeach; ?>
        </ul>
      </div>


<div class="f-col">
        <h4>Contacto</h4>
        <ul class="f-links">
          <li><a href="<?php echo esc_url(home_url('/enviar-noticia')); ?>">Enviar una noticia</a></li>
          <li><a href="<?php echo esc_url(home_url('/correcciones')); ?>">Solicitar correcciones</a></li>
          <li><a href="<?php echo esc_url(home_url('/contacto')); ?>">Carta al editor</a></li>
          <li><a href="<?php echo esc_url(home_url('/soporte')); ?>">Soporte técnico</a></li>
        </ul>
      </div>

    </div>
    <div class="footer-bar">
      <span>© <?php echo date('Y'); ?> EmuBlog — Todos los derechos reservados</span>
      <ul class="footer-bar-links">
        <li><a href="<?php echo esc_url(home_url('/aviso-legal')); ?>">Aviso Legal</a></li>
        <li><a href="<?php echo esc_url(home_url('/cookies')); ?>">Política de Cookies</a></li>
        <li><a href="<?php echo esc_url(home_url('/privacidad')); ?>">Política de Privacidad</a></li>
        <li><a href="<?php echo esc_url(home_url('/nosotros')); ?>">Sobre Nosotros</a></li>
        <li><a href="<?php echo esc_url(home_url('/terminos')); ?>">Términos y Condiciones</a></li>
      </ul>
    </div>
  </div>
</footer>

<script>
// ── DARK MODE ──
const html      = document.documentElement;
const btn       = document.getElementById('darkToggle');
const particles = document.getElementById('page-particles');
const saved     = localStorage.getItem('emublog-theme') || 'light';

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  if (particles) particles.classList.toggle('active', theme === 'dark');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

applyTheme(saved);

if (btn) {
  btn.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem('emublog-theme', next);
    applyTheme(next);
  });
}
// ── HAMBURGER ──
const drawer      = document.getElementById('drawer');
const drawerBg    = document.getElementById('drawerBg');
const drawerClose = document.getElementById('drawerClose');
const hamburger   = document.getElementById('hamburgerBtn');
if (hamburger && drawer) {
  hamburger.addEventListener('click', () => drawer.classList.add('open'));
  drawerBg.addEventListener('click',  () => drawer.classList.remove('open'));
  drawerClose.addEventListener('click', () => drawer.classList.remove('open'));
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => drawer.classList.remove('open')));
}
// ── SEARCH DROPDOWN ──
const searchToggle  = document.getElementById('searchToggle');
const searchOverlay = document.getElementById('searchOverlay');
const searchClose   = document.getElementById('searchClose');
const searchInput   = document.getElementById('searchInput');
function openSearch() {
  searchOverlay.classList.add('open');
  searchOverlay.setAttribute('aria-hidden', 'false');
  if (searchInput) setTimeout(() => searchInput.focus(), 80);
}
function closeSearch() {
  searchOverlay.classList.remove('open');
  searchOverlay.setAttribute('aria-hidden', 'true');
}
if (searchToggle && searchOverlay) {
  searchToggle.addEventListener('click', e => {
    e.stopPropagation();
    searchOverlay.classList.contains('open') ? closeSearch() : openSearch();
  });
  if (searchClose) searchClose.addEventListener('click', e => { e.stopPropagation(); closeSearch(); });
  document.addEventListener('click', e => {
    if (!searchOverlay.contains(e.target) && e.target !== searchToggle) closeSearch();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeSearch(); if (drawer) drawer.classList.remove('open'); }
  });
}
// ── SCROLL FADE-IN ──
const emublogObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); emublogObserver.unobserve(e.target); }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.fade-in').forEach(el => emublogObserver.observe(el));
// ── ACTIVE NAV ON SCROLL ──
const sections = document.querySelectorAll('[id]');
const navLinks = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 90) current = s.id; });
  navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href')?.endsWith('#' + current)));
}, { passive: true });
</script>
<?php wp_footer(); ?>
</body>
</html>
