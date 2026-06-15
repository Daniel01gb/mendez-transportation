<?php
function emublog_setup() {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'html5', ['search-form','comment-form','comment-list','gallery','caption'] );
    add_theme_support( 'custom-logo' );

    register_nav_menus([
        'primary' => 'Menú principal',
        'footer'  => 'Menú footer',
    ]);
}
add_action( 'after_setup_theme', 'emublog_setup' );

function emublog_enqueue() {
    wp_enqueue_style( 'google-fonts',
        'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Inter:wght@300;400;500;600;700&display=swap',
        [], null );
    wp_enqueue_style( 'emublog-style', get_stylesheet_uri(), ['google-fonts'], '1.2' );
}
add_action( 'wp_enqueue_scripts', 'emublog_enqueue' );

function emublog_widgets_init() {
    register_sidebar([
        'name'          => 'Sidebar principal',
        'id'            => 'sidebar-1',
        'before_widget' => '<div class="widget">',
        'after_widget'  => '</div></div>',
        'before_title'  => '<div class="widget-head"><div class="widget-dot"></div><h3>',
        'after_title'   => '</h3></div><div class="widget-body">',
    ]);
}
add_action( 'widgets_init', 'emublog_widgets_init' );

/* ── Helper: devuelve slug CSS desde un objeto WP_Term ── */
function emublog_cat_slug_from_term( $term ) {
    $map = [
        'belleza'         => 'belleza',
        'salud'           => 'salud',
        'noticias'        => 'noticias',
        'deportes'        => 'deportes',
        'internacional'   => 'internacional',
        'entretenimiento' => 'entretenimiento',
        'tecnologia'      => 'tecnologia',
    ];
    return $map[ $term->slug ] ?? $map[ strtolower( remove_accents( $term->name ) ) ] ?? 'noticias';
}

/* ── Helper: devuelve slug CSS para la categoría ── */
function emublog_cat_slug( $post_id = null ) {
    $cats = get_the_category( $post_id );
    if ( empty($cats) ) return '';
    $map = [
        'belleza'         => 'belleza',
        'salud'           => 'salud',
        'noticias'        => 'noticias',
        'noticias-2'      => 'noticias',
        'deportes'        => 'deportes',
        'internacional'   => 'internacional',
        'entretenimiento' => 'entretenimiento',
        'tecnologia'      => 'tecnologia',
        'tecnología'      => 'tecnologia',
    ];
    $slug = strtolower( $cats[0]->slug );
    return $map[$slug] ?? $map[strtolower( remove_accents($cats[0]->name) )] ?? '';
}

/* ── Helper: etiqueta de categoría ── */
function emublog_cat_tag( $post_id = null ) {
    $cats = get_the_category( $post_id );
    if ( empty($cats) ) return '';
    $css  = emublog_cat_slug( $post_id );
    $name = $cats[0]->name;
    $url  = get_category_link( $cats[0]->term_id );
    return '<a href="' . esc_url($url) . '" class="cat-tag ' . esc_attr($css) . '">' . esc_html($name) . '</a>';
}

/* ── Helper: miniatura o placeholder ── */
function emublog_thumb( $size = 'large', $height = '190px' ) {
    if ( has_post_thumbnail() ) {
        $img = get_the_post_thumbnail( null, $size, ['style' => 'height:' . $height . ';width:100%;object-fit:cover;', 'loading' => 'lazy', 'decoding' => 'async'] );
    } else {
        $img = '<div class="no-thumb" style="height:' . esc_attr($height) . '">Sin imagen</div>';
    }
    return $img;
}

/* ── Tiempo relativo en español ── */
function emublog_time_ago() {
    $diff = time() - get_the_time('U');
    if ( $diff < 3600 )      return 'Hace ' . round($diff/60) . ' min';
    if ( $diff < 86400 )     return 'Hace ' . round($diff/3600) . 'h';
    if ( $diff < 2*86400 )   return 'Ayer';
    return get_the_date( 'd M Y' );
}

/* ── Extracto sin shortcodes ── */
function emublog_excerpt( $len = 120 ) {
    $ex = get_the_excerpt();
    if ( ! $ex ) $ex = wp_strip_all_tags( get_the_content() );
    return wp_trim_words( $ex, 20, '…' );
}

/* ── Tiempo relativo con fecha específica ── */
function emublog_time_ago_for( $date ) {
    $diff = time() - strtotime($date);
    if ( $diff < 3600 )    return 'Hace ' . round($diff/60) . ' min';
    if ( $diff < 86400 )   return 'Hace ' . round($diff/3600) . 'h';
    if ( $diff < 2*86400 ) return 'Ayer';
    return date_i18n('d M Y', strtotime($date));
}

/* ═══════════════════════════════════════════════════
   HERRAMIENTA ADMIN: RE-CATALOGACIÓN MASIVA
═══════════════════════════════════════════════════ */
if ( is_admin() ) {
    add_action( 'admin_menu', 'emublog_recatalog_menu' );
}

function emublog_recatalog_menu() {
    add_management_page(
        'Re-catalogar Artículos',
        'Re-catalogar',
        'manage_options',
        'emublog-recatalog',
        'emublog_recatalog_page'
    );
}

function emublog_cat_keywords() {
    return [
        'deportes' => [
            'Mundial', 'fútbol', 'futbol', 'Champions', 'selección', 'estadio',
            'Copa del', 'Messi', 'Ronaldo', 'Real Madrid', 'Atlético', 'Liverpool',
            'UEFA', 'goleador', 'portero', 'delantero', 'afición', 'Barça',
            'Mbappé', 'Haaland', 'Benzema', 'Neymar', 'Vinicius', 'Modric',
            'Bundesliga', 'Premier League', 'La Liga', 'Serie A', 'Ligue 1',
            'ciclismo', 'maratón', 'baloncesto', 'béisbol', 'natación',
            'Fórmula 1', 'F1', 'MMA', 'UFC', 'boxeo', 'tenis', 'pádel',
            'atletismo', 'temporada', 'fichaje', 'técnico deportivo',
        ],
        'internacional' => [
            'Trump', 'Putin', 'Zelensky', 'Biden', 'Hegseth', 'Milei',
            'Irán', 'Rusia', 'Ucrania', 'Israel', 'Gaza', 'Palestina', 'Hamás',
            'China', 'Corea del Norte', 'Siria', 'Afganistán',
            'OTAN', 'ONU', 'NATO', 'Pentágono', 'Kremlin',
            'guerra', 'nuclear', 'misil', 'bomba', 'ataque militar',
            'diplomático', 'sanción', 'tratado', 'acuerdo de paz',
            'senador', 'congreso', 'parlamento', 'presidente de',
            'terrorismo', 'terrorista', 'conflicto armado',
        ],
        'entretenimiento' => [
            'película', 'cine', 'Netflix', 'HBO', 'Disney+', 'Amazon Prime',
            'actor', 'actriz', 'director de cine', 'Hollywood',
            'cantante', 'concierto', 'álbum', 'gira musical', 'Grammy', 'Oscar',
            'serie de televisión', 'reality', 'televisión', 'telenovela',
            'estreno de', 'famoso', 'famosa', 'celebrity', 'red carpet',
            'boda de', 'divorcio de', 'romance', 'Backrooms',
            'festival de', 'espectáculo', 'videoclip',
        ],
        'tecnologia' => [
            'inteligencia artificial', 'IA', 'ChatGPT', 'OpenAI',
            'Apple', 'Google', 'Microsoft', 'Samsung', 'Tesla', 'Meta',
            'criptomoneda', 'Bitcoin', 'blockchain', 'NFT',
            'software', 'startup', 'aplicación', 'app móvil',
            'centro de datos', 'robot', 'automatización', 'metaverso',
            'chip', 'procesador', 'smartphone', '5G', '6G',
            'ciberseguridad', 'hackeo', 'hacker', 'malware',
            'programación', 'código', 'tecnológico', 'tecnología',
        ],
        'salud' => [
            'remedio casero', 'remedio natural', 'medicina natural',
            'hierba medicinal', 'planta medicinal', 'infusión de',
            'té de', 'cúrcuma', 'jengibre', 'aloe vera', 'sábila',
            'propiedades del', 'propiedades de la', 'beneficios del',
            'beneficios de la', 'para qué sirve', 'cómo usar',
            'ajo y', 'miel y', 'limón y', 'canela y', 'avena con',
            'aceite de', 'vinagre de manzana',
            'diabetes', 'colesterol', 'presión arterial', 'hipertensión',
            'cáncer', 'tumor', 'cirugía', 'médico', 'hospital', 'clínica',
            'enfermedad', 'síntoma', 'diagnóstico', 'tratamiento médico',
            'riñones', 'hígado', 'corazón', 'pulmones', 'páncreas',
            'sistema inmune', 'vacuna', 'virus', 'bacteria', 'infección',
            'vitamina', 'mineral', 'nutrición', 'dieta saludable',
            'salud mental', 'ansiedad', 'depresión', 'estrés',
            'antiinflamatorio', 'antibiótico', 'medicamento',
        ],
        'belleza' => [
            'piel seca', 'piel grasa', 'piel mixta', 'cutis',
            'cabello', 'pelo seco', 'pelo graso', 'caída del pelo',
            'maquillaje', 'base de maquillaje', 'labial', 'rímel',
            'crema hidratante', 'serum', 'colágeno', 'ácido hialurónico',
            'arrugas', 'antiedad', 'antienvejecimiento', 'manchas en la piel',
            'acné', 'espinillas', 'poros', 'exfoliante',
            'mascarilla facial', 'tónico', 'uñas', 'manicura', 'pedicura',
            'depilación', 'tinte para', 'coloración', 'peluquería',
        ],
    ];
}

function emublog_score_post( $post_id, $keywords_map ) {
    $post  = get_post( $post_id );
    $title = mb_strtolower( $post->post_title );
    $body  = mb_strtolower( wp_strip_all_tags( $post->post_content ) );
    $scores = [];

    foreach ( $keywords_map as $cat => $keywords ) {
        $score = 0;
        foreach ( $keywords as $kw ) {
            $kw_l = mb_strtolower( $kw );
            if ( str_contains( $title, $kw_l ) ) $score += 4;
            $score += substr_count( $body, $kw_l );
        }
        if ( $score > 0 ) $scores[ $cat ] = $score;
    }

    arsort( $scores );
    return $scores;
}

function emublog_run_recatalog( $dry_run = true, $source_slugs = ['noticias', 'uncategorized'] ) {
    $keywords_map = emublog_cat_keywords();

    $cat_ids = [];
    foreach ( array_keys( $keywords_map ) as $slug ) {
        $t = get_term_by( 'slug', $slug, 'category' )
          ?? get_term_by( 'slug', remove_accents( $slug ), 'category' );
        if ( $t ) $cat_ids[ $slug ] = $t->term_id;
    }

    $source_ids = [];
    foreach ( $source_slugs as $s ) {
        $t = get_term_by( 'slug', $s, 'category' );
        if ( $t ) $source_ids[] = $t->term_id;
    }

    if ( empty( $source_ids ) ) {
        return '<div class="notice notice-error inline"><p>No se encontraron las categorías fuente.</p></div>';
    }

    $posts = get_posts([
        'posts_per_page' => -1,
        'post_status'    => 'publish',
        'category__in'   => $source_ids,
        'fields'         => 'ids',
    ]);

    $total = count( $posts );
    $moved = 0; $skipped = 0;
    $rows_by_cat = [];

    foreach ( $posts as $post_id ) {
        $scores = emublog_score_post( $post_id, $keywords_map );

        if ( empty( $scores ) || reset( $scores ) < 3 ) {
            $skipped++;
            continue;
        }

        $best_cat   = array_key_first( $scores );
        $best_score = $scores[ $best_cat ];
        $new_id     = $cat_ids[ $best_cat ] ?? null;

        if ( ! $new_id ) { $skipped++; continue; }

        $rows_by_cat[ $best_cat ][] = [
            'id'    => $post_id,
            'title' => get_the_title( $post_id ),
            'score' => $best_score,
        ];

        if ( ! $dry_run ) {
            wp_set_post_categories( $post_id, [ $new_id ] );
        }
        $moved++;
    }

    $label  = $dry_run ? 'Se moverían' : 'Se movieron';
    $type   = $dry_run ? 'notice-info' : 'notice-success';
    $html   = '<div class="notice ' . $type . ' inline" style="margin:1rem 0">'
            . '<p><strong>' . $label . ' ' . $moved . ' de ' . $total . ' artículos</strong>'
            . ' &nbsp;·&nbsp; ' . $skipped . ' sin clasificación clara (se quedan en Noticias)</p></div>';

    if ( ! empty( $rows_by_cat ) ) {
        $cat_labels = [
            'deportes'       => '🏅 Deportes',
            'internacional'  => '🌍 Internacional',
            'entretenimiento'=> '🎬 Entretenimiento',
            'tecnologia'     => '💻 Tecnología',
            'remedios'       => '🌿 Remedios Naturales',
            'salud'          => '❤️ Salud',
            'belleza'        => '✨ Belleza',
        ];

        $html .= '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1rem;margin-top:1rem">';
        foreach ( $rows_by_cat as $cat => $items ) {
            $label_str = $cat_labels[ $cat ] ?? $cat;
            $html .= '<div style="background:#fff;border:1px solid #ddd;border-radius:6px;overflow:hidden">'
                   . '<div style="background:#1d2327;color:#fff;padding:.5rem .85rem;font-weight:600;font-size:.8rem">'
                   . esc_html( $label_str ) . ' — ' . count( $items ) . ' artículos</div>'
                   . '<ul style="margin:0;padding:.5rem .85rem;max-height:200px;overflow-y:auto;list-style:disc;font-size:.8rem">';
            foreach ( $items as $item ) {
                $html .= '<li style="padding:.2rem 0;border-bottom:1px solid #f0f0f0">'
                       . '<a href="' . esc_url( get_edit_post_link( $item['id'] ) ) . '" target="_blank">'
                       . esc_html( $item['title'] ) . '</a>'
                       . ' <span style="color:#888">(' . $item['score'] . 'pts)</span></li>';
            }
            $html .= '</ul></div>';
        }
        $html .= '</div>';
    }

    return $html;
}

function emublog_recatalog_page() {
    if ( ! current_user_can( 'manage_options' ) ) return;

    $action = sanitize_key( $_POST['emublog_action'] ?? '' );
    $nonce  = $_POST['emublog_nonce'] ?? '';

    echo '<div class="wrap">';
    echo '<h1 style="display:flex;align-items:center;gap:.5rem">📂 Re-catalogar Artículos</h1>';
    echo '<p style="max-width:620px;color:#555">Analiza el título y contenido de cada artículo en <strong>Noticias</strong> y <strong>Sin categoría</strong> y los mueve a la categoría con mayor coincidencia de palabras clave.<br>Usa primero <em>Vista previa</em> para revisar antes de ejecutar.</p>';
    echo '<hr style="margin:1.2rem 0">';

    if ( $action && wp_verify_nonce( $nonce, 'emublog_recatalog' ) ) {
        $dry_run = ( $action === 'preview' );
        echo emublog_run_recatalog( $dry_run );
    }

    echo '<form method="post" style="margin-top:1.5rem;display:flex;gap:1rem;align-items:center">';
    wp_nonce_field( 'emublog_recatalog', 'emublog_nonce' );
    echo '<button type="submit" name="emublog_action" value="preview" class="button button-secondary" style="font-size:.95rem;padding:.45rem 1.1rem">🔍 Vista previa</button>';
    echo '<button type="submit" name="emublog_action" value="execute" class="button button-primary" style="font-size:.95rem;padding:.45rem 1.1rem" onclick="return confirm(\'¿Mover los artículos? Esta acción no se puede deshacer fácilmente.\')">⚡ Ejecutar</button>';
    echo '<span style="color:#888;font-size:.85rem">La vista previa no hace cambios.</span>';
    echo '</form></div>';
}
