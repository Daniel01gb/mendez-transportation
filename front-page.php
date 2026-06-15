<?php get_header(); ?>

<!-- ═══════════ HERO ═══════════ -->
<?php
$hero_args = ['posts_per_page' => 4, 'post_status' => 'publish'];
$sticky    = get_option('sticky_posts');
if ( ! empty($sticky) ) {
    $hero_args['post__in'] = [$sticky[0]];
    $hero_args['posts_per_page'] = 1;
}
$hero_q = new WP_Query(['posts_per_page' => 4, 'post_status' => 'publish']);
$hero_posts = [];
while ( $hero_q->have_posts() ) { $hero_q->the_post(); $hero_posts[] = get_post(); }
wp_reset_postdata();

$main_post = $hero_posts[0] ?? null;
$sec_posts = array_slice($hero_posts, 1, 3);
?>

<?php if ( $main_post ) : setup_postdata($main_post); ?>
<section class="hero-section">
  <div class="container">
    <div class="hero-grid">

      <div class="hero-featured">
        <?php if ( has_post_thumbnail($main_post) ) : ?>
          <?php echo get_the_post_thumbnail($main_post, 'full', ['alt' => esc_attr(get_the_title($main_post)), 'decoding' => 'async']); ?>
        <?php else : ?>
          <div style="width:100%;height:100%;background:#1a2030;"></div>
        <?php endif; ?>
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <?php echo emublog_cat_tag($main_post->ID); ?>
          <h1><?php echo esc_html(get_the_title($main_post)); ?></h1>
          <p><?php echo esc_html(wp_trim_words(wp_strip_all_tags(get_the_excerpt($main_post)), 22, '…')); ?></p>
          <div class="hero-meta">
            <span class="author">Por <?php echo esc_html(get_the_author_meta('display_name', $main_post->post_author)); ?></span>
            <span><?php echo emublog_time_ago_for($main_post->post_date); ?></span>
          </div>
        </div>
        <a href="<?php echo esc_url(get_permalink($main_post)); ?>" class="card-link" aria-label="<?php echo esc_attr(get_the_title($main_post)); ?>"></a>
      </div>

      <?php if ( ! empty($sec_posts) ) : ?>
      <div class="hero-secondary">
        <?php foreach ( $sec_posts as $sp ) : setup_postdata($sp); ?>
        <div class="hero-sec-item">
          <?php if ( has_post_thumbnail($sp) ) : ?>
            <?php echo get_the_post_thumbnail($sp, 'medium_large', ['alt' => '', 'loading' => 'lazy', 'decoding' => 'async']); ?>
          <?php else : ?>
            <div style="width:100%;height:100%;background:#1a2030;"></div>
          <?php endif; ?>
          <div class="hero-sec-overlay"></div>
          <div class="hero-sec-content">
            <?php echo emublog_cat_tag($sp->ID); ?>
            <h3><?php echo esc_html(get_the_title($sp)); ?></h3>
            <div class="hero-sec-meta"><?php echo emublog_time_ago_for($sp->post_date); ?></div>
          </div>
          <a href="<?php echo esc_url(get_permalink($sp)); ?>" class="card-link" aria-label="<?php echo esc_attr(get_the_title($sp)); ?>"></a>
        </div>
        <?php endforeach; wp_reset_postdata(); ?>
      </div>
      <?php endif; ?>

    </div>
  </div>
</section>
<?php endif; wp_reset_postdata(); ?>

<!-- ═══════════ MAIN + SIDEBAR ═══════════ -->
<div class="main-wrapper">
  <div class="container">
    <div class="main-grid">
      <main>

        <!-- ÚLTIMAS NOTICIAS -->
        <?php
        $latest = new WP_Query(['posts_per_page' => 7, 'offset' => 4, 'post_status' => 'publish']);
        if ( $latest->have_posts() ) :
            $latest_posts = [];
            while ( $latest->have_posts() ) { $latest->the_post(); $latest_posts[] = get_post(); }
            wp_reset_postdata();
            $top  = $latest_posts[0];
            $rest = array_slice($latest_posts, 1);
        ?>
        <div class="content-section fade-in">
          <div class="section-header">
            <h2>Últimas Noticias</h2>
            <div class="header-line"></div>
            <a href="<?php echo esc_url(get_category_link(get_term_by('slug','noticias','category'))); ?>" class="view-all">Ver todo →</a>
          </div>

          <!-- Card destacado -->
          <article class="latest-featured">
            <div class="lf-img">
              <?php if ( has_post_thumbnail($top) ) :
                echo get_the_post_thumbnail($top, 'large', ['loading' => 'lazy', 'decoding' => 'async']);
              else : ?>
                <div class="no-thumb"></div>
              <?php endif; ?>
            </div>
            <div class="lf-body">
              <div class="nc-meta"><?php echo emublog_cat_tag($top->ID); ?><span class="nc-time"><?php echo emublog_time_ago_for($top->post_date); ?></span></div>
              <h2><?php echo esc_html(get_the_title($top)); ?></h2>
              <p><?php echo esc_html(wp_trim_words(wp_strip_all_tags(get_the_excerpt($top)), 28, '…')); ?></p>
              <span class="lf-read">Leer nota →</span>
            </div>
            <a href="<?php echo esc_url(get_permalink($top)); ?>" class="card-link" aria-label="<?php echo esc_attr(get_the_title($top)); ?>"></a>
          </article>

          <!-- Separador -->
          <div class="latest-divider">
            <span>Más noticias recientes</span>
          </div>

          <!-- Grid resto de artículos -->
          <div class="grid-3">
            <?php foreach ( $rest as $post ) : setup_postdata($post); ?>
            <article class="news-card">
              <div class="nc-img">
                <?php if ( has_post_thumbnail($post) ) :
                  echo get_the_post_thumbnail($post, 'medium_large', ['loading' => 'lazy', 'decoding' => 'async']);
                else : ?>
                  <div class="no-thumb"></div>
                <?php endif; ?>
              </div>
              <div class="nc-body">
                <div class="nc-meta"><?php echo emublog_cat_tag($post->ID); ?><span class="nc-time"><?php echo emublog_time_ago_for($post->post_date); ?></span></div>
                <h3><?php echo esc_html(get_the_title($post)); ?></h3>
                <p><?php echo esc_html(wp_trim_words(wp_strip_all_tags(get_the_excerpt($post)), 16, '…')); ?></p>
              </div>
              <a href="<?php echo esc_url(get_permalink($post)); ?>" class="card-link" aria-label="<?php echo esc_attr(get_the_title($post)); ?>"></a>
            </article>
            <?php endforeach; wp_reset_postdata(); ?>
          </div>
        </div>
        <?php endif; ?>

        <!-- SECCIONES POR CATEGORÍA -->
        <?php
        $sections = [
            ['slug' => 'salud',         'label' => 'Salud',          'css' => 'salud',         'color' => 'var(--c-salud)'],
            ['slug' => 'deportes',      'label' => 'Deportes',       'css' => 'deportes',      'color' => 'var(--c-deportes)'],
            ['slug' => 'internacional', 'label' => 'Internacional',  'css' => 'internacional', 'color' => 'var(--c-internacional)'],
            ['slug' => 'belleza',       'label' => 'Belleza',        'css' => 'belleza',       'color' => 'var(--c-belleza)'],
        ];

        foreach ( $sections as $sec ) :
            $term = get_term_by('slug', $sec['slug'], 'category');
            if ( ! $term ) continue;
            $sec_q = new WP_Query(['category_name' => $sec['slug'], 'posts_per_page' => 3, 'post_status' => 'publish']);
            if ( ! $sec_q->have_posts() ) continue;
            $sec_posts = [];
            while ( $sec_q->have_posts() ) { $sec_q->the_post(); $sec_posts[] = get_post(); }
            wp_reset_postdata();
            $feat = $sec_posts[0];
            $smalls = array_slice($sec_posts, 1, 2);
        ?>
        <div class="content-section fade-in" id="<?php echo esc_attr($sec['slug']); ?>">
          <div class="section-header <?php echo esc_attr($sec['css']); ?>">
            <h2><?php echo esc_html($sec['label']); ?></h2>
            <div class="header-line"></div>
            <a href="<?php echo esc_url(get_category_link($term->term_id)); ?>" class="view-all" style="color:<?php echo esc_attr($sec['color']); ?>">Ver todo →</a>
          </div>
          <div class="grid-2-stack">
            <article class="feat-card">
              <div class="feat-img">
                <?php if ( has_post_thumbnail($feat) ) :
                    echo get_the_post_thumbnail($feat, 'large', ['style' => 'height:255px;object-fit:cover;', 'loading' => 'lazy', 'decoding' => 'async']);
                else : ?>
                  <div class="no-thumb" style="height:255px;"></div>
                <?php endif; ?>
              </div>
              <div class="feat-body">
                <div class="nc-meta"><?php echo emublog_cat_tag($feat->ID); ?><span class="nc-time"><?php echo emublog_time_ago_for($feat->post_date); ?></span></div>
                <h3><?php echo esc_html(get_the_title($feat)); ?></h3>
                <p><?php echo esc_html(wp_trim_words(wp_strip_all_tags(get_the_excerpt($feat)), 22, '…')); ?></p>
              </div>
              <a href="<?php echo esc_url(get_permalink($feat)); ?>" class="card-link" aria-label="<?php echo esc_attr(get_the_title($feat)); ?>"></a>
            </article>
            <div class="sm-stack">
              <?php foreach ( $smalls as $sm ) : ?>
              <article class="sm-card">
                <div class="sm-img">
                  <?php if ( has_post_thumbnail($sm) ) :
                      echo get_the_post_thumbnail($sm, 'medium', ['style' => 'height:100%;object-fit:cover;', 'loading' => 'lazy', 'decoding' => 'async']);
                  else : ?>
                    <div class="no-thumb" style="height:100%;min-height:110px;"></div>
                  <?php endif; ?>
                </div>
                <div class="sm-body">
                  <div class="nc-meta"><?php echo emublog_cat_tag($sm->ID); ?><span class="nc-time"><?php echo emublog_time_ago_for($sm->post_date); ?></span></div>
                  <h4><?php echo esc_html(get_the_title($sm)); ?></h4>
                  <p><?php echo esc_html(wp_trim_words(wp_strip_all_tags(get_the_excerpt($sm)), 14, '…')); ?></p>
                </div>
                <a href="<?php echo esc_url(get_permalink($sm)); ?>" class="card-link" aria-label="<?php echo esc_attr(get_the_title($sm)); ?>"></a>
              </article>
              <?php endforeach; ?>
            </div>
          </div>
        </div>
        <?php endforeach; ?>

      </main>
      <?php get_sidebar(); ?>
    </div>
  </div>
</div>

<?php get_footer(); ?>
