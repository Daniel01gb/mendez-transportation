# Documentación del Proyecto — Mendez Transportation LLC

> Contexto completo del trabajo realizado para uso en futuras sesiones de desarrollo.

---

## 1. ¿Qué es este proyecto?

Sitio web profesional para **Mendez Transportation LLC**, una empresa de transporte médico no emergente (NEMT) en Central Florida. El objetivo es reemplazar o complementar su presencia en línea actual con un sitio moderno que refleje la calidad del servicio.

**Tipo de empresa:** NEMT (Non-Emergency Medical Transportation)  
**Área de cobertura:** Orange, Osceola, Seminole, Polk, Lake, Brevard (Central Florida)  
**Teléfonos:** (407) 569-5275 · (321) 696-0482  
**Email:** info@mendeztransport.com  
**Servicios:** Transporte ambulatorio, en silla de ruedas y en camilla

---

## 2. Estado del proyecto (Junio 2026)

| Item | Estado |
|------|--------|
| Sitio v1 (6 páginas públicas) | ✅ Completo |
| Propuesta v1 enviada al cliente | ✅ Enviada (PDF + Netlify preview) |
| Sitio v2 — Frontend portal (demo) | ✅ Completo |
| Sitio v2 — Backend API (MVP2) | ✅ Completo |
| Deploy Netlify para demo al cliente | ✅ Listo para subir |
| Aprobación del cliente | ⏳ Pendiente |

**Modelo de cobro acordado:**
- $250 al aprobar (50% upfront — Zelle o USDT)
- $250 en entrega
- $150/mes mantenimiento

---

## 3. Carpetas en el Desktop

| Carpeta | Contenido |
|---------|-----------|
| `mendes website/` | **Versión 1** — 6 páginas públicas, sin portal |
| `mendes website v2/` | **Versión 2** — v1 + login + portal + backend API |

### Estructura de `mendes website v2/` (post-refactorización)
```
mendes website v2/
├── css/
│   ├── base.css / navbar.css / hero.css / ...  — Sitio público
│   ├── login.css / portal.css                  — Portal paciente
│   ├── dispatcher.css                          — Panel dispatcher
│   └── driver.css                             — Driver PWA (dark theme)
├── js/
│   ├── auth.js / portal.js / booking.js        — Portal paciente
│   ├── dispatcher.js                          — Panel dispatcher
│   └── driver.js                             — Driver PWA
├── middleware/             — auth.js, rateLimit.js, validate.js
├── netlify/functions/      — api.js (handler serverless)
├── routes/
│   ├── auth.js            — Autenticación (3 roles)
│   ├── trip.js            — Datos del viaje (paciente)
│   ├── dispatcher.js      — Trips, stats, locations, snapshots
│   └── driver.js          — Trips del conductor, location, snapshot
├── utils/                  — email.js
├── index.html / about.html / services.html / areas.html / faq.html / contact.html
├── login.html / portal.html
├── dispatcher.html         — Panel del dispatcher (rol: dispatcher)
├── driver.html            — App del conductor PWA (rol: driver)
├── manifest.json          — PWA manifest (instalación desde Chrome)
├── sw.js                  — Service Worker (cache offline)
├── app.js                  — Express app (importable por server y Netlify)
├── server.js               — Arranque local
├── DOCUMENTACION.md
├── package.json
├── netlify.toml
└── .env.example
```

**Archivos eliminados en la refactorización (Junio 2026):**
- `footer.php`, `front-page.php`, `functions.php`, `style.css` — WordPress (no aplica en este MVP)
- `railway.toml` — config de Railway (se usa Netlify)
- `mendez-transportation-preview.html` — preview monolítico de 147KB
- `sugerencias.md` — notas temporales
- `db/` — SQLite experimental (arquitectura actual es stateless)

---

## 4. Versión 1 — Sitio Público (6 páginas)

### Páginas
| Archivo | Sección activa |
|---------|----------------|
| `index.html` | Home |
| `about.html` | About Us |
| `services.html` | Our Services |
| `areas.html` | Service Areas |
| `faq.html` | FAQ |
| `contact.html` | Contact Us |

### Stack
- HTML / CSS / JS puro (sin frameworks)
- Leaflet.js 1.9.4 (CDN) — mapa en sección de booking
- Google Fonts: Raleway (display) + Inter (body)
- Imágenes: Unsplash CDN

### Sistema de Diseño
```
Colores:
  --navy:        #1E2A6E   (primario)
  --navy-dark:   #0D1240   (fondo oscuro)
  --navy-light:  #2A3A8A
  --blue-mid:    #4A6FA5
  --blue-light:  #8AA4C8
  --off-white:   #F5F6FA   (fondos claros)

Tipografía:
  --font-display: Raleway   (títulos, navbar, labels)
  --font-body:    Inter     (párrafos, datos)

Border radius:
  --radius-sm:   6px
  --radius-md:   12px
  --radius-lg:   20px
  --radius-pill: 100px
```

### Estructura CSS (index.html)
```
base.css          — variables, reset, body
navbar.css        — top bar, navbar, hamburger, drawer, FAB
hero.css          — carrusel Ken Burns, overlay, arrows, dots
stats.css         — banda de estadísticas (98% on-time, etc.)
services.css      — 3 cards de servicios
how-it-works.css  — 4 pasos con carrusel de fondo
booking.css       — stepper de 4 pasos + mapa Leaflet
about.css         — sección Why Choose Us
testimonials.css  — 3 tarjetas de testimonios
cta.css           — banner de llamada a la acción
footer.css        — footer completo con áreas, horarios, social
animations.css    — reveal, ripple, pulse, shimmer
responsive.css    — breakpoints móvil/tablet
```

### Patrones importantes

**Particles.js:** `initParticles(containerId, count)` es una función GLOBAL.
Nunca envolver en IIFE. Siempre llamar directamente.

**Z-index en secciones oscuras con carrusel:**
1. carousel div → z-index: 0
2. overlay div → z-index: 1
3. particles div → z-index: 2
4. bg-circle divs → z-index: 2
5. shimmer div → z-index: 3
6. contenido → z-index: 4

---

## 5. Versión 2 — Portal de Pacientes

La v2 es idéntica a la v1 + elementos nuevos:

### Archivos frontend añadidos
```
login.html          — Página de autenticación (3 pasos)
portal.html         — Dashboard con tracking en tiempo real
css/login.css       — Estilos del login y overlay de verificación
css/portal.css      — Estilos del portal/dashboard
js/auth.js          — Lógica del flujo de auth (llama a la API)
js/portal.js        — Tracking con Leaflet + polling a la API
```

### Archivos backend (MVP2)
```
app.js                      — Express app (sin listen, importable por servidor y Netlify)
server.js                   — Arranque local: sirve app.js + archivos estáticos
netlify/functions/api.js    — Handler serverless para Netlify
routes/auth.js              — Endpoints de autenticación (stateless, patient + dispatcher)
routes/trip.js              — Datos del viaje + posición del conductor (paciente)
routes/dispatcher.js        — Trips demo, stats, patch status (dispatcher)
middleware/auth.js          — requireSession, requireDispatcher, issueSession, clearSession
middleware/rateLimit.js     — Rate limiting: 10/15min login, 5/10min 2FA
middleware/validate.js      — Reglas express-validator para login, 2FA y trip
utils/email.js              — Nodemailer wrapper (consola si no hay SMTP)
netlify.toml                — Configuración de build y redirects para Netlify
.env.example                — Variables de entorno documentadas
package.json                — Dependencias Node.js
```

### Botón Login en navbar (todas las páginas)
Botón independiente fuera de los nav-links, con ícono de candado. Texto: **"Login"**. CSS en `navbar.css`:
```css
.btn-portal-nav { ... }    /* desktop: outlined cyan, shimmer on hover */
.drawer-portal-btn { ... } /* mobile drawer: borde cyan, fondo semitransparente */
```

---

## 6. Flujo de Autenticación del Portal

El flujo tiene **3 pasos**: 2 en `login.html` y 1 overlay en `portal.html`.

Un **indicador de progreso visual** (Sign In → 2FA Code → Trip Access) acompaña los 3 pasos:
- El paso activo se resalta en cyan con glow
- Los pasos completados muestran ✓ en verde
- Se actualiza en tiempo real via `setStepIndicator(n)` en `auth.js`

### Paso 1 — Sign In (`login.html`)
- Subtítulo: "Welcome back. Enter your credentials to check on your ride."
- **Email:** `demo@mendeztransport.com`
- **Password:** `Mendez2026!` (con toggle show/hide)
- Checkbox: **"Remember this device for 30 days"**
  - Si marcado: la cookie de sesión dura 30 días en vez de 8 horas
- Botón: "Sign In →"
- Al cargar: llama `GET /api/auth/me` — si la cookie sigue válida, salta directo al portal
- `POST /api/auth/login` valida credenciales y devuelve `maskedEmail`

### Paso 2 — 2FA (`login.html`)
- Muestra el email enmascarado del paso 1 (ej: `d***o@mendeztransport.com`)
- **Código:** `123456` (demo — aparece en consola del servidor si no hay SMTP)
- 6 inputs individuales con auto-avance y soporte para paste
- Auto-submit al completar los 6 dígitos (280ms delay)
- Countdown de 30s para reenviar → llama `POST /api/auth/resend-2fa`
- Botón "← Back" para volver al Paso 1 (retrocede el indicador)
- `POST /api/auth/verify-2fa` valida el código y emite cookie `httpOnly`

### Cómo funciona el 2FA sin base de datos (stateless)
El código 2FA se firma dentro de una **cookie JWT** (`mendez_2fa_pending`) de 10 minutos:
```
Login correcto → genera código → firma JWT({email, code}) → cookie httpOnly 10min
Verify 2FA   → lee cookie → verifica JWT → compara código → emite sesión
```
No se guarda nada en disco. Funciona igual en Netlify Functions y en local.

### Paso 3 — Verificación de Trip (`portal.html` overlay)
- Overlay fullscreen con indicador mostrando pasos 1 y 2 como done ✓
- Subtítulo: "Almost there. Enter your trip details to access real-time tracking."
- **Trip Number:** `MT-2026-4891`
- **Confirmation Code:** `7823` _(reemplazó al SSN last 4 — ya no se maneja PHI)_
- `POST /api/auth/verify-trip` valida contra las env vars del servidor
- Al verificar: guarda `mendez_trip_verified` en `sessionStorage` + fade-out del overlay
- Si ya está verificado en la sesión: overlay oculto directamente al cargar

### Claves de storage
```javascript
// Cookie httpOnly — manejada por el servidor
mendez_session       // JWT de sesión (8h o 30 días)
mendez_2fa_pending   // JWT temporal con el código 2FA (10 min)

// sessionStorage — manejado por el cliente
mendez_trip_verified // '1' si el trip fue verificado en esta sesión
```

### Logout (`portal.html` → botón Sign Out)
```javascript
window.portalLogout = function() {
  fetch('/api/auth/logout', { method: 'POST' }).finally(function() {
    sessionStorage.removeItem('mendez_trip_verified');
    window.location.href = 'login.html';
  });
};
```

---

## 7. Portal Dashboard

### Layout
```
[PORTAL NAVBAR] — Logo | "Patient Portal" badge | Back to site | MG avatar | Sign Out

[TRIP BANNER] — Trip MT-2026-4891 | Today, June 15 · 8:30 AM | Orlando→Kissimmee
               | 🔒 Secure session | ● Live

┌─────────────────┬──────────────────────────────────────────┐
│  SIDEBAR 330px  │            MAPA LEAFLET                  │
│                 │                                          │
│  [chip] ON THE WAY    (conductor animado moviéndose        │
│  ETA: 8 min     │   por ruta dashed hacia pickup)          │
│  Driver 2.3 mi  │                                          │
│                 │                                          │
│  Carlos Rivera  │                                          │
│  Sienna FLA-4892│                                          │
│  ⭐ 4.9         │                                          │
│                 ├──────────────────────────────────────────┤
│  Timeline:      │  ● DRIVER EN ROUTE  │ 2.3mi │ 8:30AM   │
│  ✅ Confirmed   │  Plate: FLA-4892   │ [Call Support]     │
│  ✅ Assigned    └──────────────────────────────────────────┘
│  🔵 En Route
│  ○ Arrived
│  ○ Completed
│
│  Pickup: 601 E Rollins
│  Dest: Osceola Regional
│
│  Upcoming:
│  Jun 18 · 9:00 AM
│  Jun 22 · 2:30 PM
└─────────────────┘
```

### Datos del portal desde la API
`portal.js` llama `GET /api/trip/current` al cargar y rellena:

| Elemento del DOM | `id` | Dato de la API |
|------------------|------|----------------|
| Iniciales del avatar | `portalAvatar` | `patient_name` (primeras letras) |
| Nombre del paciente | `portalPatientName` | `patient_name` |
| Trip # en banner | `tripNumberBanner` | `trip_number` |
| Fecha del banner | `bannerDate` | `scheduled_at` formateado |
| Hora de pickup | `bannerPickupTime` | `scheduled_at` formateado |
| Ruta resumen | `bannerRoute` | ciudades extraídas de las direcciones |
| Iniciales del conductor | `driverAvatar` | `driver_name` (primeras letras) |
| Nombre conductor | `driverName` | `driver_name` |
| Vehículo + placa | `driverVehicle` | `driver_vehicle · driver_plate` |
| Rating | `driverRating` | `driver_rating` |
| Placa en status bar | `statusBarPlate` | `driver_plate` |
| Dirección pickup | `pickupAddress` | `pickup_address` |
| Dirección destino | `destinationAddress` | `destination` |

### Tracking — Polling (no SSE)
El tracking usa **polling** en vez de SSE porque Netlify Functions no soporta conexiones de larga duración.

```
portal.js → GET /api/tracking/location  cada 13 segundos
servidor  → calcula posición desde (Date.now() - jwt.iat) / 13000
          → devuelve { lat, lng, eta, step, total }
portal.js → actualiza marker Leaflet + ETA + barra de progreso
```

Datos de la ruta (7 waypoints SW Orlando → AdventHealth):
```
DRIVER_START: [28.5212, -81.4385]
PICKUP:       [28.5650, -81.3799]  (AdventHealth Orlando, 601 E Rollins)
DESTINATION:  [28.3069, -81.4073]  (Osceola Regional, Kissimmee)
```

### ETA — Estados de color (`portal.js` + `portal.css`)

| Minutos | Color | Chip label | Clase CSS |
|---------|-------|------------|-----------|
| > 8 min | Cyan (default) | "On the way" | — |
| 5–8 min | Ámbar | "Getting close" | `eta-amber` |
| 1–4 min | Naranja | "Almost there" | `eta-orange` |
| 0 min | Verde | "Arriving now" | `eta-green` |

### Mejoras UX implementadas
- **"Secure session"** badge con ícono de escudo en el trip banner (oculto en móvil <640px)
- **Copy más humano** en login y overlay
- **Indicador de progreso** 3 pasos visible en toda la pantalla de login y overlay
- **Responsive mejorado:** navbar compacto, secciones con menos padding, mapa 48vh en móvil

### Seguridad adicional
- `login.html` y `portal.html` tienen `<meta name="robots" content="noindex, nofollow">` — los buscadores no indexan estas páginas
- **Confirmation Code** (no PHI) reemplaza al SSN en el Paso 3 — cumple mejor con buenas prácticas de manejo de datos sensibles

---

## 8. Backend API — Endpoints

Base URL en producción: `https://[sitio].netlify.app/api`  
Base URL local: `http://localhost:3000/api`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | — | Health check |
| GET | `/auth/me` | Cookie | Retorna usuario y `role` si la sesión es válida |
| POST | `/auth/login` | — | Valida email+pass, emite cookie 2FA pending |
| POST | `/auth/verify-2fa` | Cookie 2FA | Valida código, emite cookie de sesión con rol |
| POST | `/auth/resend-2fa` | Cookie 2FA | Reenvía código 2FA |
| POST | `/auth/verify-trip` | Cookie sesión | Valida trip number + Confirmation Code |
| POST | `/auth/logout` | — | Limpia cookies |
| GET | `/trip/current` | Cookie sesión | Retorna datos del viaje activo (paciente) |
| GET | `/tracking/location` | Cookie sesión | Posición actual del conductor (polling) |
| GET | `/dispatcher/trips` | Dispatcher | 6 viajes demo + 4 conductores |
| GET | `/dispatcher/stats` | Dispatcher | Conteo por status |
| PATCH | `/dispatcher/trips/:id/status` | Dispatcher | Actualiza status/driver/notas (demo — sin persistencia) |
| GET | `/dispatcher/locations` | Dispatcher | Posiciones GPS reales desde Netlify Blobs |
| GET | `/dispatcher/snapshot/:driverId` | Dispatcher | Último snapshot de la cabina del conductor |
| GET | `/driver/trips` | Driver | Viajes del día asignados al conductor |
| PATCH | `/driver/trips/:id/status` | Driver | Actualiza status del viaje (en_route / completed) |
| POST | `/driver/location` | Driver | Envía coordenadas GPS + peerId (WebRTC) a Netlify Blobs |
| POST | `/driver/snapshot` | Driver | Sube snapshot JPEG de la cabina a Netlify Blobs |

### Arquitectura stateless
- Sin base de datos — todo se valida contra variables de entorno o constantes
- El código 2FA viaja firmado dentro de la cookie `mendez_2fa_pending` (JWT 10min)
- La sesión viaja en la cookie `mendez_session` (JWT 8h o 30 días)
- La posición del conductor se calcula desde `jwt.iat` (tiempo de emisión del token)
- `ssn4` **NO** se incluye en la respuesta de `/api/trip/current` (se removió para no filtrar PHI al cliente)

### Guard de producción (`app.js`)
Al arrancar, el servidor valida que `JWT_SECRET` y las variables `DEMO_*` estén definidas.
Si alguna falta en producción (`NODE_ENV=production`), falla con error claro antes de aceptar tráfico.
Esto evita arranques silenciosos con valores vacíos que dejarían el sistema inseguro.

---

## 8b. Seguridad — Capas implementadas (Junio 2026)

### Paquetes de seguridad activos
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `helmet` | ^8.x | 13 headers de seguridad HTTP (CSP, HSTS, X-Frame-Options, etc.) |
| `cors` | ^2.x | CORS estricto: solo orígenes en lista blanca |
| `express-validator` | ^7.x | Sanitización y validación de inputs antes de procesarlos |
| `express-rate-limit` | ^7.x | Rate limiting por ruta (global, login, 2FA) |
| `nodemailer` | ^9.x | v9 — corrige 4 CVEs altos de SMTP injection y DoS |

### Helmet — Headers configurados (`app.js`)
```javascript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:     ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:      ["'self'", 'data:', 'https:'],
      connectSrc:  ["'self'"],
      frameSrc:    ["'none'"],
      objectSrc:   ["'none'"],
    }
  },
  crossOriginEmbedderPolicy: false   // Necesario para Leaflet/mapas externos
})
```

### CORS (`app.js`)
Solo acepta peticiones de orígenes en la variable `ALLOWED_ORIGINS` (separados por coma).
En dev local (sin esa variable), permite `localhost:3000` y `localhost:8888`.

**⚠️ PENDIENTE — Agregar en Netlify dashboard (`Site settings → Environment variables`):**
```
ALLOWED_ORIGINS = https://v2mn.netlify.app
```
Cuando haya dominio propio:
```
ALLOWED_ORIGINS = https://v2mn.netlify.app,https://mendeztransport.com
```
Sin esta variable en producción, **todas las peticiones del frontend serán bloqueadas por CORS**.

### Validación de inputs (`middleware/validate.js`)
Usa `express-validator`. Aplica antes de que el handler de la ruta procese nada:

| Ruta | Reglas |
|------|--------|
| `POST /auth/login` | email válido + normalizado, password string 1–128 chars |
| `POST /auth/verify-2fa` | code exactamente 6 dígitos numéricos (`/^\d{6}$/`) |
| `POST /auth/verify-trip` | tripNumber y confirmCode strings no vacíos, max 32/16 chars |

### Body limit
`express.json({ limit: '200kb' })` — subido de 16kb a 200kb para soportar los snapshots JPEG de la cabina (base64 ~40-80KB). El resto de los requests son minúsculos.

### Error handler global
El último middleware de `app.js` captura cualquier error no manejado y responde con `{ error: 'Internal server error' }` — nunca expone stack traces en producción.

### Resumen del estado de seguridad actual
| Capa | Estado |
|------|--------|
| HTTPS (TLS) | ✅ Netlify lo da automático |
| JWT httpOnly + SameSite Strict | ✅ middleware/auth.js |
| 2FA por email (6 dígitos, 10 min) | ✅ routes/auth.js |
| Rate limiting (login 10/15min, 2FA 5/10min) | ✅ middleware/rateLimit.js |
| Security headers (helmet) | ✅ app.js |
| CORS estricto | ✅ app.js (requiere ALLOWED_ORIGINS en Netlify) |
| Validación de inputs | ✅ middleware/validate.js |
| Body size limit | ✅ app.js |
| Guard de producción | ✅ app.js |
| noindex en login/portal | ✅ HTML meta tags |
| Sin PHI — Confirmation Code | ✅ |
| nodemailer sin CVEs | ✅ v9.x |
| Square Payments | ⏳ Fase siguiente |
| Audit log | ⏳ Fase siguiente |
| Rate limiting persistente (Redis) | ⏳ Fase siguiente |

---

## 8c. Panel del Dispatcher (demo — Junio 2026)

### Rol y acceso
- Credenciales separadas del paciente — mismo `login.html`, el JWT incluye `role: 'dispatcher'`
- Después del 2FA redirige a `dispatcher.html` (paciente va a `portal.html`)
- El backend usa `requireDispatcher` middleware: si `role !== 'dispatcher'` → 403

### Archivos del dispatcher
```
dispatcher.html        — Dashboard completo
css/dispatcher.css     — Estilos del panel (dark navbar, stats bar, tabla, mapa, modal)
js/dispatcher.js       — Lógica: carga trips/stats, tabla, filtros, mapa Leaflet, edit modal
routes/dispatcher.js   — GET /api/dispatcher/trips, GET /stats, PATCH /trips/:id/status
```

### Datos demo (6 viajes, 4 conductores)
| Trip # | Paciente | Status | Conductor | Hora |
|--------|----------|--------|-----------|------|
| MT-2026-4891 | Maria Garcia | en_route | Carlos Rivera | 8:30 AM |
| MT-2026-4892 | Robert Johnson | confirmed | Ana Martinez | 10:00 AM |
| MT-2026-4893 | Linda Chen | pending | — | 12:30 PM |
| MT-2026-4894 | James Wilson | completed | Miguel Santos | 6:00 AM |
| MT-2026-4895 | Patricia Brown | en_route | Luis Hernandez | 9:15 AM |
| MT-2026-4896 | Dorothy Martinez | pending | — | 2:00 PM |

### Conductores demo
| ID | Nombre | Vehículo | Placa | Rating |
|----|--------|----------|-------|--------|
| 1 | Carlos Rivera | 2023 Toyota Sienna | FLA-4892 | ⭐ 4.9 |
| 2 | Ana Martinez | 2022 Honda Odyssey | FLA-2341 | ⭐ 4.8 |
| 3 | Miguel Santos | 2023 Chrysler Pacifica | FLA-7821 | ⭐ 4.7 |
| 4 | Luis Hernandez | 2021 Toyota Sienna | FLA-5513 | ⭐ 4.8 |

### Funcionalidades del panel
- Stats bar: Total / En Route / Pending / Confirmed / Completed
- Tabla de viajes con filtros por status
- Mapa Leaflet con posiciones GPS reales de conductores (en_route) — se actualiza cada **5 segundos**
- Modal de edición: cambiar status, asignar conductor, agregar notas
- Cambios actualizan el estado en memoria del frontend (demo — sin persistencia en BD)
- **Botón 🔴 Live** (pulsante, rojo) en filas En Route → driver tiene cámara activa → video WebRTC en tiempo real
- **Botón 📷 Cabin** (verde) → driver no transmite en vivo pero tiene snapshot disponible
- Modal Cabin View: video live stream O último snapshot con timestamp; botón Reconnect y mute de audio

### Netlify Blobs — stores utilizados
| Store | Clave | Contenido |
|-------|-------|-----------|
| `driver-locations` | `driver-{id}` | `{ driverId, name, plate, lat, lng, accuracy, peerId, updatedAt }` |
| `driver-snapshots` | `snapshot-{id}` | `{ driverId, name, dataUrl, capturedAt }` |

`peerId` es el ID de PeerJS del driver cuando tiene la cámara activa — el dispatcher lo usa para conectarse directamente.

### Nota importante para backend real
Al conectar Supabase en Phase 3, `routes/dispatcher.js` reemplaza las constantes `DEMO_TRIPS`
y `DRIVERS` por queries a la base de datos. El frontend (`dispatcher.js`) no cambia.

---

## 8d. Driver PWA — App del Conductor ✅ Completa

### Concepto
PWA (Progressive Web App) — página web móvil que el conductor instala desde Chrome en su teléfono
sin pasar por Play Store ni App Store. Abre como app nativa fullscreen con ícono en pantalla de inicio.

### Compatibilidad por dispositivo

| Función | Android (home screen) | iPhone (home screen) | iPhone (Safari) |
|---|---|---|---|
| Cámara | ✅ | ❌ | ✅ |
| Micrófono | ✅ | ❌ | ✅ |
| Ubicación GPS | ✅ | ✅* | ✅ |
| WebRTC video live | ✅ | ❌ | ✅ |
| Instalable home screen | ✅ | ✅ | — |

*En iPhone standalone la ubicación funciona pero puede requerir aprobarla en Settings → Privacy → Location Services → Safari Websites.

**Causa:** iOS/WebKit bloquea `getUserMedia` (cámara + micrófono) cuando la PWA corre en modo standalone (home screen). Es una limitación de Apple, no del código. Android Chrome no tiene esta restricción.

**Solución implementada:** la app detecta `window.navigator.standalone === true` en iOS y muestra un banner ámbar con botón **"Open in Safari →"** que abre la misma URL en Mobile Safari donde todo funciona.

**Recomendación al cliente:**
- Conductores con **Android** → instalar desde Chrome, usar desde home screen sin problema
- Conductores con **iPhone** → usar desde **Safari** (no instalar como app, o tocar "Open in Safari" cuando aparezca el aviso)

### Instalación por el conductor (una sola vez)
```
Android:
1. Dispatcher envía link por WhatsApp
2. Conductor abre en Chrome
3. Chrome muestra banner: "Agregar Mendez Driver a pantalla de inicio"
4. Toca "Agregar" → ícono en el teléfono → funciona completo desde ahí

iPhone:
1. Conductor abre el link en Safari (NO Chrome)
2. Compartir → "Agregar a pantalla de inicio" (opcional, solo para el ícono)
3. Usar siempre desde Safari para tener cámara y micrófono
```

### Archivos del conductor
```
driver.html        — App PWA del conductor (dark theme, mobile-first)
css/driver.css     — Estilos: dark bg, tarjetas de viaje, location bar, camera bar, botones 48px
js/driver.js       — Lógica completa: viajes, mapas, GPS, cámara, WebRTC, mic
manifest.json      — Nombre "Mendez Driver", tema oscuro, standalone
sw.js              — Service Worker: cache-first shell, network-first /api/
routes/driver.js   — API: trips, location, snapshot, status
```

### Rol en el sistema de auth
Rol `role: 'driver'` en el JWT — mismo `login.html`, `requireDriver` middleware.
Al verificar 2FA con credenciales de driver, redirige a `driver.html`.

### Viajes demo de Carlos Rivera (driver_id: 1)
| Trip # | Paciente | Status | Hora | Nota |
|--------|----------|--------|------|------|
| MT-2026-4891 | Maria Garcia | en_route | 8:30 AM | Silla de ruedas — necesita rampa |
| MT-2026-4897 | Susan Williams | confirmed | 11:00 AM | — |
| MT-2026-4898 | Thomas Baker | confirmed | 3:00 PM | Tiempo extra para abordar |

### Funcionalidades implementadas

**Viajes y navegación:**
- Tarjetas de viaje con status, paciente, pickup/destino, hora, notas
- Botón **Navigate** → Apple Maps en iOS (`maps://?daddr=`), Google Maps en Android
- Botón **Waze** → `https://waze.com/ul?q=...&navigate=yes`
- Botón **Start** (confirmed → en_route) / **Complete** (en_route → completed)
- Badge "All done for today!" cuando todos los viajes están completados

**GPS en tiempo real:**
- Solicita permiso de ubicación al cargar
- Barra de estado: 🔵 Requesting → 🟢 Active → 🟡 Signal lost → 🔴 Denied
- Tap en la barra para reintentar si se deniega
- Envía coordenadas al backend (Netlify Blobs) **cada 5 segundos**
- El dispatcher ve la posición en el mapa actualizándose cada 5s

**Cámara de cabina:**
- Barra de cámara con 3 controles (cuando activa): **🎤 Mic** · **↺ Flip** · **Disable**
- Botón **Enable** → solicita permisos de cámara + micrófono
- Cámara frontal por defecto (`facingMode: 'user'` → apunta a la cabina desde el tablero)
- **↺ Flip** → alterna cámara frontal/trasera SIN cortar el stream WebRTC (`replaceTrack()`)
  - Frontal (`user`): vista de la cabina / pasajero
  - Trasera (`environment`): vista de la carretera
- **🎤 Mic** → mute/unmute del micrófono (se pone rojo cuando muteado)
- Preview del video en la barra de cámara
- Auto-captura snapshot JPEG 320×240 cada 60s → sube a Netlify Blobs (`driver-snapshots`)
- Al activar la cámara, genera un **Peer ID** aleatorio (`mz-drv-XXXXXXXX`) y lo incluye en cada ping de GPS

**WebRTC (PeerJS):**
- Driver crea un `Peer` con ID aleatorio al activar la cámara
- Responde llamadas entrantes del dispatcher con el stream completo (video + audio)
- Al cerrar sesión: detiene cámara, micrófono, GPS y destruye el peer

**iOS Standalone — aviso automático:**
- Detecta `navigator.standalone === true` en iOS al cargar
- Muestra banner ámbar: "Camera & microphone unavailable"
- Botón **Open in Safari →** → `window.open(url, '_blank')` abre Mobile Safari
- Al tocar Enable en modo standalone también muestra el banner
- Error de location en standalone incluye ruta: *Settings → Privacy → Location Services*

### Integración con brokers (roadmap)
| Opción | Descripción | Costo estimado |
|--------|-------------|----------------|
| Formulario web | Brokers/facilidades envían viajes desde URL privada → aparece en dispatcher como `pending` | ~$200–300 |
| Email → trip | Webhook parsea email del broker y crea el viaje automáticamente | ~$100–150 |
| API Modivcare/MTM | Integración directa con plataforma del broker | Fase separada, requiere acuerdo |

---

## 9. Credenciales Demo

### Paciente
| Paso | Campo | Valor |
|------|-------|-------|
| Sign In | Email | `demo@mendeztransport.com` |
| Sign In | Password | `Mendez2026!` |
| 2FA | Código | `123456` |
| Portal | Trip Number | `MT-2026-4891` |
| Portal | Confirmation Code | `7823` |

### Dispatcher
| Paso | Campo | Valor |
|------|-------|-------|
| Sign In | Email | `dispatcher@mendeztransport.com` |
| Sign In | Password | `Dispatch2026!` |
| 2FA | Código | `654321` |
| Panel | — | Acceso directo a `dispatcher.html` (sin verificación de trip) |

### Driver (Conductor)
| Paso | Campo | Valor |
|------|-------|-------|
| Sign In | Email | `driver@mendeztransport.com` |
| Sign In | Password | `Driver2026!` |
| 2FA | Código | `789012` |
| App | — | Acceso directo a `driver.html` (sin verificación de trip) |

> Todas las credenciales son configurables vía variables de entorno (`DEMO_*`, `DISPATCHER_*`, `DRIVER_*`).
> El código 2FA usa el valor fijo de env var mientras no haya SMTP configurado.

### Datos del viaje demo

| Campo | Valor |
|-------|-------|
| Paciente | Maria Garcia (iniciales MG) |
| Conductor | Carlos Rivera |
| Vehículo | 2023 Toyota Sienna · FLA-4892 |
| Rating | ⭐ 4.9 |
| Pickup | 601 E Rollins St, Orlando FL 32803 |
| Destino | Osceola Regional Medical Center, Kissimmee FL 34741 |
| Fecha | Today · 8:30 AM (dinámico — siempre es hoy) |

---

## 10. Deploy en Netlify

### Variables de entorno requeridas en Netlify
| Variable | Descripción | Obligatoria |
|----------|-------------|-------------|
| `JWT_SECRET` | Cadena aleatoria larga para firmar los JWT | ✅ Sí |
| `ALLOWED_ORIGINS` | Orígenes permitidos en CORS (`https://dreamy-travesseiro-61a309.netlify.app`) | ✅ Configurado |
| `DEMO_EMAIL` | Email del demo (default: demo@mendeztransport.com) | No |
| `DEMO_PASS` | Password del demo (default: Mendez2026!) | No |
| `DEMO_CODE` | Código 2FA fijo (default: 123456) | No |
| `DEMO_TRIP` | Trip number del demo (default: MT-2026-4891) | No |
| `DEMO_CONF` | Confirmation Code del demo (default: 7823) | No |
| `DISPATCHER_EMAIL` | Email del dispatcher (default: dispatcher@mendeztransport.com) | No |
| `DISPATCHER_PASS` | Password del dispatcher (default: Dispatch2026!) | No |
| `DISPATCHER_CODE` | Código 2FA del dispatcher (default: 654321) | No |
| `DRIVER_EMAIL` | Email del conductor (default: driver@mendeztransport.com) | No |
| `DRIVER_PASS` | Password del conductor (default: Driver2026!) | No |
| `DRIVER_CODE` | Código 2FA del conductor (default: 789012) | No |
| `SMTP_HOST` | Servidor SMTP para email real | No |
| `SMTP_PORT` | Puerto SMTP (default: 587) | No |
| `SMTP_USER` | Usuario SMTP | No |
| `SMTP_PASS` | Password SMTP | No |
| `SMTP_FROM` | From address del email | No |

> Variables configuradas vía CLI en el nuevo sitio. `ALLOWED_ORIGINS` apunta a `https://dreamy-travesseiro-61a309.netlify.app`. ✅

### Deploy en producción

**Cuenta Netlify activa:** `danielguilln666@gmail.com`  
**Site:** `dreamy-travesseiro-61a309` (ID: `dcf0e080-e850-4832-bd6e-831ec15a6c96`)  
**URL:** `https://dreamy-travesseiro-61a309.netlify.app`

El auto-deploy desde GitHub está activo en esta cuenta — cada push a `master` despliega automáticamente.

Para deploy manual desde CLI:
```bash
npx netlify deploy --prod
```
Si el CLI no está vinculado: `npx netlify link --id dcf0e080-e850-4832-bd6e-831ec15a6c96`  
Si la sesión expiró: `npx netlify logout` → `npx netlify login` (con danielguilln666@gmail.com)

> **Cuenta anterior (agotó créditos):** danielagb984@gmail.com — site v2mn (`bc01b9a0-1abd-4bdb-b423-fb96ae45f2ae`)

### Pasos para subir por primera vez (nuevo entorno)
```bash
git init
git add .
git commit -m "Mendez Transportation MVP2"
git remote add origin https://github.com/Daniel01gb/mendez-transportation.git
git push -u origin master
npx netlify link --id bc01b9a0-1abd-4bdb-b423-fb96ae45f2ae
npx netlify deploy --prod
```

### Cómo funciona el redirect
```
/api/* → /.netlify/functions/api (serverless Express)
/*     → archivos estáticos del CDN de Netlify
```

### Desarrollo local
```bash
node server.js
# abre http://localhost:3000
```

---

## 11. Próximos pasos (si aprueban)

### MVP actual — lo que ya está demo-listo ✅
- [x] Sitio público (6 páginas)
- [x] Portal del paciente (login + 2FA + tracking)
- [x] Panel del dispatcher (viajes, mapa Leaflet live, filtros, edit modal, cabin view)
- [x] Sistema de roles JWT (patient / dispatcher / driver)
- [x] Seguridad: helmet, CORS, express-validator, rate limiting
- [x] Driver PWA — app del conductor completa:
  - [x] Viajes del día, navegación (Apple Maps / Google Maps / Waze)
  - [x] GPS en tiempo real (5s) → mapa del dispatcher se actualiza en vivo
  - [x] Cámara de cabina con flip frontal/trasera
  - [x] Micrófono — audio en el stream
  - [x] Video WebRTC en vivo (~1s delay) vía PeerJS → dispatcher ve **🔴 Live**
  - [x] Snapshot automático cada 60s → fallback cuando no hay stream en vivo
  - [x] Instalable como PWA (manifest.json + service worker)

### Phase 3 — Backend real (post-aprobación)
- [ ] Base de datos real (Supabase PostgreSQL)
- [ ] Email 2FA real — SMTP (SendGrid recomendado)
- [ ] Usuarios reales con contraseñas hasheadas (bcrypt ya importado)
- [ ] GPS real del conductor (Supabase Realtime)
- [ ] Dispatcher puede crear/asignar/cancelar viajes reales
- [ ] Rate limiting persistente (Upstash Redis)
- [ ] Logs de auditoría (login, 2FA, trip verify, logout)
- [ ] Formulario de brokers (facilidades médicas envían trips directamente)
- [ ] Square Payments para cobro de co-pays

### Fixes mobile aplicados
- **iOS Safari `position:fixed`** — `html { overflow-x: hidden }` agregado a `base.css`
- **FAB "Book Your Ride" eliminado** — reemplazado por bounce en `btn-primary` del hero

### Animaciones de botones (CTAs)
| Botón | Archivo | Animación |
|-------|---------|-----------|
| `btn-primary` — "Book Your Ride Now" (hero) | `hero.css` | `btnBounce`: sube/baja 7px · loop 2s · pausa en hover |
| `btn-portal-nav` — "Login" (navbar) | `navbar.css` | `loginBounce`: izquierda→derecha 6px · loop 2s · pausa en hover |

---

## 12. Propuesta de precios (oficial — Junio 2026)

| Item | Precio |
|------|--------|
| Sitio v1 — 6 páginas públicas | $500 |
| Portal de pacientes Phase 2 (login + 2FA + tracking + backend API) | $750 |
| **Bundle Phase 1 + Phase 2** | **$1,100** _(ahorra $150)_ |
| Backend real + GPS real + BD + panel dispatcher (Phase 3) | $800–1,200 |
| Mantenimiento — solo sitio público (Phase 1) | $150/mes |
| Mantenimiento — sitio completo + portal + API (Phase 1 + 2) | $250/mes |

### Archivos de propuesta generados

| Archivo | Contenido |
|---------|-----------|
| `Desktop/propuesta-mendez.html` | Propuesta Phase 1 — rediseño web ($500) |
| `Desktop/propuesta-mendez-portal.html` | Propuesta Phase 2 — portal de pacientes ($750) |
| `Desktop/propuesta-mendez-comparacion.html` | Comparación ambas fases + bundle ($1,100) |

> Los tres archivos HTML se imprimen a PDF con Ctrl+P → Guardar como PDF desde el navegador.

---

*Documentación actualizada el 15 de Junio 2026 — Driver PWA completa con compatibilidad Android/iOS documentada: Android funciona al 100% desde home screen; iPhone requiere Safari (WebKit bloquea getUserMedia en standalone). Banner automático en iOS standalone con botón "Open in Safari". GPS 5s, cámara cabina, flip frontal/trasera, micrófono, video WebRTC en vivo (PeerJS ~1s delay), snapshot fallback 60s. Panel dispatcher: 🔴 Live / 📷 Cabin, mapa 5s, Cabin View modal con video+audio. 3 roles JWT. Deploy activo en Netlify `dreamy-travesseiro-61a309`.*
