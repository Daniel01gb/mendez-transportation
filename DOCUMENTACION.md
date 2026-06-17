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
| WebRTC live video driver→dispatcher | ✅ Funcional (probado en local + tunnel) |
| Cabin View inline (reemplaza modal) | ✅ Completo |
| Sistema de tabs del dispatcher | ✅ Completo |
| Tab: Insurance Requests (propuestas de seguros) | ✅ Completo |
| Tab: New Trip (crear viajes manualmente) | ✅ Completo |
| Trip Detail Accordion + mapa dedicado + ETA | ✅ Completo |
| Dark Mode (toggle + localStorage) | ✅ Completo |
| Responsive mobile del panel dispatcher (tabs, detalle, ETA) | ✅ Completo — ver Sesión 17 Jun 2026 |
| Login único con redirect automático por rol (sin hub.html) | ✅ Completo |
| Deploy Netlify (`dreamy-travesseiro-61a309`) | ⚠️ Cuenta sin créditos temporalmente |
| GPS real en mapa del dispatcher | ⚠️ Netlify Blobs no funciona en Functions v1 |
| Aprobación del cliente | ⏳ Reunión MVP — 16 Junio 2026 |

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
├── broker-login.html       — Login del portal de brokers (acceso por código)
├── broker.html            — Portal de brokers (tabla de viajes simultáneos)
├── css/broker.css         — Estilos del portal de brokers (dark dashboard)
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
- Página **única y genérica** para los 3 roles (paciente, dispatcher, driver) — no hay pantalla de "elige tu rol" ni parámetro `?role=` en la URL. El backend determina el rol según las credenciales y `auth.js` redirige automáticamente al destino correcto tras el 2FA (`dispatcher.html` / `driver.html` / `portal.html`).
- Subtítulo genérico: "Welcome back. Sign in to access your portal, panel or app."
- Demo hint lista las 3 cuentas de prueba (paciente, dispatcher, driver) para que cualquiera pueda probar sin necesidad de un link distinto por rol
- **Email:** `demo@mendeztransport.com`
- **Password:** `Mendez2026!` (con toggle show/hide)
- Checkbox: **"Remember this device for 30 days"**
  - Si marcado: la cookie de sesión dura 30 días en vez de 8 horas
- Botón: "Sign In →"
- Al cargar: llama `GET /api/auth/me` — si la cookie sigue válida, salta directo al portal/panel correcto
- `POST /api/auth/login` valida credenciales y devuelve `maskedEmail`

> **Nota histórica:** existió brevemente una página `hub.html` ("elige tu portal") con tarjetas por rol — se eliminó porque el cliente no la pidió ni la necesitaba; el login único con redirect automático por rol ya cubre el caso de uso.

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
| GET | `/dispatcher/stats` | Dispatcher | Conteo por status (incluye `proposed`) |
| PATCH | `/dispatcher/trips/:id/status` | Dispatcher | Actualiza status/driver/notas — **persiste en `DEMO_TRIPS`** (antes solo hacía eco) y registra el evento en el historial del conductor si el status llega a completed/cancelled/abandoned |
| POST | `/dispatcher/trips` | Dispatcher | Crea nuevo viaje (agrega a DEMO_TRIPS en memoria) |
| GET | `/dispatcher/proposed` | Dispatcher | Lista solicitudes de seguros pendientes |
| POST | `/dispatcher/proposed/:id/accept` | Dispatcher | Acepta solicitud, asigna conductor, mueve a viajes activos |
| POST | `/dispatcher/proposed/:id/reject` | Dispatcher | Rechaza y elimina solicitud |
| GET | `/dispatcher/drivers` | Dispatcher | Lista de conductores + resumen (total viajes, millas totales, abandonos) |
| GET | `/dispatcher/drivers/:id/history` | Dispatcher | Historial completo de un conductor: cada viaje con millas, evidencia/notas |
| GET | `/dispatcher/locations` | Dispatcher | Posiciones GPS reales desde Netlify Blobs |
| GET | `/dispatcher/snapshot/:driverId` | Dispatcher | Último snapshot de la cabina del conductor |
| GET | `/dispatcher/incidents` | Dispatcher | Lista todos los reportes de incidentes (Netlify Blobs) |
| GET | `/dispatcher/miles` | Dispatcher | Distancia en millas vía OSRM (fallback Haversine × 1.3) |
| GET | `/dispatcher/geocode` | Dispatcher | Geocodifica dirección vía Photon (bbox Florida) |
| POST | `/broker/verify` | BROKER_KEY | Valida código de acceso del broker (sin exponerlo) |
| POST | `/broker/submit` | BROKER_KEY | Envía un viaje individual desde el portal del broker |
| POST | `/broker/batch` | BROKER_KEY | Envía hasta 50 viajes en lote — devuelve array de Request # |
| GET | `/driver/trips` | Driver | Viajes del día asignados al conductor |
| PATCH | `/driver/trips/:id/status` | Driver | Actualiza status del viaje (en_route / completed) |
| POST | `/driver/location` | Driver | Envía coordenadas GPS + peerId (WebRTC) a Netlify Blobs |
| POST | `/driver/snapshot` | Driver | Sube snapshot JPEG de la cabina a Netlify Blobs |
| POST | `/driver/incident` | Driver | Reporta un incidente con foto de evidencia a Netlify Blobs |

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
      defaultSrc:    ["'self'"],
      scriptSrc:     ["'self'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
      scriptSrcAttr: ["'unsafe-inline'"],   // permite onclick= en HTML (PeerJS, Leaflet)
      styleSrc:      ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com',
                      'https://unpkg.com', 'https://cdn.jsdelivr.net'],
      fontSrc:       ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:        ["'self'", 'data:', 'https:'],
      connectSrc:    ["'self'", 'wss://0.peerjs.com', 'https://0.peerjs.com', 'wss://*.peerjs.com'],
      frameSrc:      ["'none'"],
      objectSrc:     ["'none'"],
    }
  },
  crossOriginEmbedderPolicy: false   // Necesario para Leaflet/mapas externos
})
```

**Cambios vs. configuración original:**
- `scriptSrc` ahora permite `unpkg.com` y `cdn.jsdelivr.net` (donde viven PeerJS y Leaflet)
- `scriptSrcAttr: ['unsafe-inline']` permite handlers `onclick=` en HTML — necesario porque sin esto Helmet bloquea todos los botones del dispatcher y la cámara del driver
- `connectSrc` incluye los servidores WebSocket de PeerJS para señalización WebRTC

### CORS (`app.js`)
- **En desarrollo** (`NODE_ENV !== 'production'`): permite **todos los orígenes** — necesario para acceder desde tunnel URLs (`localhost.run`, `ngrok`) y desde el celular en la misma red
- **En producción**: solo acepta orígenes listados en `ALLOWED_ORIGINS` (env var separada por comas)

**⚠️ Configurar en Netlify antes de re-activar el deploy:**
```
ALLOWED_ORIGINS = https://dreamy-travesseiro-61a309.netlify.app
```
Con dominio propio:
```
ALLOWED_ORIGINS = https://dreamy-travesseiro-61a309.netlify.app,https://mendeztransport.com
```

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
css/dispatcher.css     — Estilos del panel (dark navbar, stats bar, tabla, mapa, modals, dark mode)
js/dispatcher.js       — Lógica completa: trips, tabla, filtros, mapa, tabs, detail accordion, dark mode
routes/dispatcher.js   — Todos los endpoints del dispatcher (trips, stats, proposed, create, etc.)
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

### Propuestas de seguros demo (in-memory)
| ID | # Solicitud | Paciente | Seguro | Hora | Nota |
|----|-------------|----------|--------|------|------|
| 101 | MT-REQ-0012 | Elena Ruiz | Medicaid | 11:00 AM | Wheelchair accessible required |
| 102 | MT-REQ-0013 | Thomas Scott | UnitedHealth | 1:30 PM | — |
| 103 | MT-REQ-0014 | Grace Kim | Sunshine Health | 3:00 PM | Spanish-speaking driver preferred |

### Layout del panel — Sistema de Tabs

La página usa una barra de tabs pegada debajo del navbar:
```
[Dispatch Board]  [Insurance Requests 🔴3]  [+ New Trip]
```

**Menú plegable en mobile (Junio 2026, fix responsive):** en pantallas ≤768px la barra de tabs colapsa en un botón único (`#dispTabToggle`) que muestra el nombre del tab activo + flecha ▾. Al tocarlo se despliega `#dispTabList` como dropdown absoluto debajo del botón con las 3 opciones; se cierra solo al elegir un tab o al tocar fuera del menú (`document` click listener). Antes la barra de tabs no tenía wrap ni scroll y el tab "New Trip" quedaba fuera del viewport sin forma de alcanzarlo.

**Tab: Dispatch Board** — vista principal (trips + mapa)
- Stats bar: Total / En Route / Pending / Confirmed / Completed
- Tabla de viajes con filtros por status
- Mapa Leaflet con posiciones GPS de conductores (en_route) — actualiza cada 5 segundos
- **Panel Cabin View inline** (`#livePanel`) — no es modal, aparece como sección debajo de la tabla/mapa

**Tab: Insurance Requests** — solicitudes de seguros
- Carga vía `GET /api/dispatcher/proposed`
- Cards con: # solicitud, badge del seguro, hora, nombre del paciente, ruta ↑ pickup / ↓ destino, notas (caja ámbar)
- Cada card tiene: dropdown de conductor + botón **✓ Accept** + botón **✕ Reject**
- Al aceptar: el viaje pasa a `DEMO_TRIPS` como `confirmed` (o `pending` si no se asignó conductor), desaparece de la lista, la tabla de Dispatch Board se actualiza en tiempo real
- Badge rojo con el conteo de solicitudes pendientes en el tab (se actualiza al aceptar/rechazar)

**Tab: New Trip** — creación manual de viajes
- Formulario con: Patient Name, Insurance (10 opciones), Pickup Address, Destination, Date, Time, Assign Driver, Notes
- Al crear: viaje aparece inmediatamente en la tabla del Dispatch Board
- Stats bar se actualiza con el conteo nuevo
- Mensaje de confirmación con el número de trip generado

### Cabin View — Panel Inline (no modal)

Reemplaza el anterior modal popup. Al hacer clic en **🔴 Live**:
- Aparece `#livePanel` (dentro de `<main>`, `grid-column: 1 / -1`) con clase `.open`
- La página hace scroll suave hasta el panel
- Contiene: header con nombre del conductor + botones Reconnect/✕, video `<video>` para stream WebRTC, estados loading/no-feed/live-badge
- Botón ✕ cierra el panel y destruye el peer WebRTC
- El video se muestra con `max-height: 480px; object-fit: contain`

### Trip Detail Accordion

**Arquitectura (rediseñada — Junio 2026, fix mobile):** el panel de detalle **ya no se inserta como `<tr>` dentro de la tabla**. Originalmente se insertaba una fila `<tr class="disp-detail-row" colspan=7>` debajo de la fila clickeada, pero esa fila heredaba el ancho horizontal-scrollable de la tabla (la tabla mide más que el viewport en mobile por las columnas), dejando los botones del header del panel (Live/Edit/✕) fuera del área visible sin scroll. Ahora:
- Existe un `<div id="tripDetailMount">` fijo en el HTML, justo después de `.disp-table-wrap` y antes de `#tripsPagination` — fuera de la tabla, a ancho completo del panel.
- Al hacer clic en cualquier fila (excepto en un botón): `openTripDetail()` llena `tripDetailMount.innerHTML` con el panel y hace `scrollIntoView()`.
- La fila clickeada recibe clase `.detail-open` (resaltado azul sutil) — se mantiene como indicador visual aunque el panel ya no esté "dentro" de esa fila.
- Solo puede haber un detalle abierto a la vez (variable `expandedTripId`); clic en la misma fila lo colapsa, clic en otra fila lo reemplaza.
- Cambiar de página/filtro/búsqueda o guardar una edición colapsa el detalle automáticamente (`renderTable()` llama `closeTripDetail()` al inicio).

**Botones del header del panel — consolidados, sin duplicados (Junio 2026):**
Antes existían botones "🔴 Live" y "Edit" tanto en la fila de la tabla (columna de acciones) como en el header del panel de detalle — duplicados e inconsistentes en mobile. Ahora la tabla **solo muestra el botón "⚠ Report" de incidentes** (si aplica); Live, Edit y el mapa viven exclusivamente en el panel de detalle.

```
┌─────────────────────────────────────────────────────────────────┐
│ #4891  [En Route]  [● GPS Live]                                │
│ [📍 View Map] [🔴 Live] [Edit] [✕]                              │
├─────────────────────────────────────────────────────────────────┤
│ PATIENT          Maria Garcia                                   │
│ DRIVER            Carlos Rivera · 2023 Toyota Sienna · FLA-4892 │
│ SCHEDULED         8:30 AM                                       │
│ PICKUP            601 E Rollins St…                             │
│ DESTINATION       Osceola Regional…                             │
│ DISTANCE          21.7 mi via road                              │
│ ETA               [~39 min to destination]  ← badge con fondo   │
└─────────────────────────────────────────────────────────────────┘
        (mapa oculto hasta tocar "📍 View Map")
```

El header (`.disp-detail-header`) usa `flex-wrap: wrap` para que los botones nunca se corten en pantallas angostas — en mobile pasan a una segunda línea en vez de desbordar.

**Mapa bajo demanda — botón "📍 View Map" (Junio 2026):**
El mapa Leaflet del detalle ya no se carga automáticamente al abrir el panel (antes consumía datos/CPU en cada apertura, incluso sin necesitarlo). Ahora:
- El panel renderiza `#detailMapWrap-{id}` con `display:none` por defecto.
- Botón `📍 View Map` (mismo estilo `.disp-cabin-btn` que el de cámara) llama `toggleDetailMap(tripId)`.
- Primer clic: muestra el wrapper, agrega clase `.map-open` a `.disp-detail-body` (activa el grid de 2 columnas `260px 1fr` en desktop — en mobile siempre es 1 columna, mapa debajo) y llama `initDetailMap(trip)` de forma perezosa.
- Clics siguientes: solo alterna `display` + `invalidateSize()` (no recrea el mapa).
- Botón cambia su texto a `📍 Hide Map` mientras está abierto.
- `detailMap` (instancia Leaflet) se destruye igual que antes al colapsar el panel completo (`closeTripDetail()`).

**Contenido del mapa (sin cambios):**
- 🟢 Marcador verde pulsante = posición del conductor (si en_route con GPS)
- 🔵 Marcador azul = coordenadas de pickup
- 🔴 Marcador rojo = coordenadas de destino
- Línea azul punteada: driver → destino (o pickup → destino si no hay GPS), reemplazada por ruta real OSRM cuando responde
- `fitBounds()` automático para mostrar los 3 puntos

**ETA (Estimated Time of Arrival) — ahora como badge con fondo (Junio 2026):**
Antes el ETA era texto plano en color (verde/ámbar/rojo) sobre el fondo claro del panel — bajo contraste, casi invisible. Ahora es una pastilla con fondo tintado, igual patrón que los status badges:
- Clases CSS: `.eta-green` (fondo `rgba(16,185,129,.14)`, texto `#059669`), `.eta-amber`, `.eta-red`, `.eta-muted` (sin GPS / no en_route)
- Helper JS `etaClassForMins(mins)` centraliza el umbral: 🔴 rojo (<5 min) · 🟡 ámbar (<15 min) · 🟢 verde (≥15 min)
- Fórmula base: distancia Haversine (millas) entre posición del conductor y `dest_coords`, dividida entre 25 mph promedio NEMT urbano; se reemplaza por el tiempo real de OSRM cuando el mapa carga la ruta
- Se actualiza cada 5 segundos junto con `pollLocations()` (solo si el panel está abierto)
- Para trips no en_route: muestra "Scheduled · HH:MM AM" (`eta-muted`)
- Para trips completed: muestra "Completed" (`eta-muted`)

### Dark Mode

Botón sol/luna en el navbar (entre admin info y Sign Out):
- Alterna clase `.dark` en `<body>`
- Preferencia guardada en `localStorage('disp-dark')` — persiste entre sesiones
- Sol se muestra en dark mode (click → light), luna se muestra en light mode (click → dark)

**Paleta dark:**
```css
--disp-bg:     #10131E   /* fondo principal */
--disp-panel:  #181B2E   /* panels, tarjetas */
--disp-border: #252840   /* bordes */
--disp-text:   #DDE1F5   /* texto principal */
--disp-muted:  #848CB5   /* texto secundario */
/* Acento: indigo #818CF8 / #3730A3 — reemplaza el navy #1E2A6E */
```

**Elementos cubiertos por dark mode:**
- Body, stats bar, panels, tabla (headers `#FAFBFF→dark`, filas hover)
- Trip numbers (azul navy → indigo #818CF8)
- Filtros y botones de acción
- Modales (edit, incident) — inputs, selects, textareas
- Live cabin panel + cabin body
- Trip detail accordion (header, info, leyenda)
- Cards de insurance requests (fondo, select, caja de notas)
- Formulario New Trip (todos los campos)
- Scrollbar custom (webkit) en dark
- Implementado con `body.dark { ... }` CSS — sin JavaScript extra salvo para el toggle

### Funcionalidades del panel (resumen completo)
- Stats bar: Total / En Route / Pending / Confirmed / Completed
- Tabla de viajes con filtros por status (fila clickeable → detail accordion)
- **Búsqueda en tiempo real** — input `#tripSearch` filtra por nombre, número o dirección de pickup
- **Paginación client-side** — 15 filas por página; `renderPagination()` genera botones prev/next + numerados
- Mapa Leaflet overview con posiciones GPS (en_route) — polling 5s
- **Trip Detail Accordion** — mapa dedicado + ETA real vía OSRM + polyline de ruta real
- Modal de edición: cambiar status, asignar conductor, agregar notas
- **Validación de solapamiento de conductor** — `driverHasOverlap()` bloquea asignar el mismo driver a dos viajes dentro de 90 minutos
- **Botón 🔴 Live** — vive únicamente en el panel de detalle (ya no duplicado en la fila de la tabla) → abre Cabin View inline (no modal)
- **Panel Cabin View inline** (`#livePanel`) — video WebRTC, Reconnect, mute audio
- **Mapa del detalle bajo demanda** — botón "📍 View Map" carga el Leaflet map solo al tocarlo (antes se cargaba siempre al abrir el detalle)
- **Tab bar plegable en mobile** (≤768px) — botón único con el tab activo, despliega dropdown con las 3 opciones
- **Tab: Insurance Requests** — propuestas de seguros con accept/reject/assign; SessionStorage evita que reaparezcan al cambiar tab
- **Tab: New Trip** — crear viaje manualmente con todos los campos
- **Distancia en millas automática** — todas las solicitudes y viajes muestran millas reales de carretera (proxy backend → OSRM, fallback Haversine)
- **Punto rojo `!`** cuando el trip tiene incidente; **Botón ⚠ Report** abre modal detalle
- **Botón "Mark Reviewed"** en modal de incidente — cambia punto `!` a `✓` verde sin recargar
- Incidentes polled cada 30s
- **Dark mode** — toggle en navbar, persiste en localStorage; tiles del mapa cambian a CartoDB Dark Matter en vivo
- **Detección GPS offline** — filas `en_route` donde GPS no actualiza en >60s muestran badge ámbar y marcador semitransparente
- **Toast notifications** — overlay bottom-right deslizante, 3 tipos (success/error/warning), `aria-live` accesible
- **Modal de confirmación genérico** — callback-based, reutilizable para cualquier acción destructiva
- **Status "Abandoned" (ruta abandonada)** — nueva opción en el modal de edición, con sección de evidencia opcional
- **Tab: Drivers** — historial completo de viajes por conductor + millas totales

### Status "Abandoned" — ruta abandonada por el conductor (Junio 2026)

**Contexto:** ocurre con cierta frecuencia que un conductor deja de responder o abandona la ruta sin completarla. El dispatcher necesitaba una forma de documentarlo en el sistema, con evidencia opcional (texto y/o foto — no obligatorio, ya que no siempre hay una captura a mano).

- Nueva opción **"Abandoned"** en el `<select>` de status del modal de edición (`#editStatus`)
- Al seleccionarla, aparece la sección `#editAbandonedSection` (oculta por defecto, `onEditStatusChange()` la muestra/oculta):
  - Textarea para describir qué pasó (`#editAbandonedNotes`)
  - Input de foto opcional (`#editAbandonedPhoto`) — se redimensiona a 640×480 JPEG 72% en canvas antes de guardarse (mismo patrón que el reporte de incidentes del driver)
  - **Ninguno de los dos campos es obligatorio** — el dispatcher puede guardar solo con texto, solo con foto, ambos, o ninguno
- Badge de status propio: fondo `rgba(146,64,14,.12)` / texto `#92400E` (distinto del rojo de "Cancelled" para diferenciarlos a simple vista)
- Filtro **"Abandoned"** agregado a `.disp-filters` en Dispatch Board
- En el panel de detalle, el ETA muestra "⚠ Route Abandoned" (badge rojo) en vez de intentar calcular tiempo

### Tab: Drivers — historial de viajes por conductor (Junio 2026)

**Contexto:** el dispatcher necesitaba ver, para cada conductor, todo lo que pasó con sus viajes — incluyendo abandonos — y el total de millas recorridas, en cualquier momento, sin tener que revisar viaje por viaje.

**Flujo:**
1. Grid de tarjetas (`#driversGrid`) — una por conductor, con iniciales, vehículo, total de viajes, millas totales y conteo de abandonos (si hay)
2. Click en una tarjeta → `viewDriverHistory(driverId)` carga `GET /api/dispatcher/drivers/:id/history` y muestra `#driverHistoryPanel`:
   - Header con nombre, vehículo, placa, rating + botón "← Back to Drivers"
   - 4 stats: Total Trips, Total Miles, Completed, Abandoned
   - Tabla con cada viaje del historial: # de trip, paciente, status (badge), fecha, millas, y una columna "Evidence/Notes" con un botón compacto si hay evidencia
3. Botón "← Back to Drivers" (`closeDriverHistory()`) vuelve al grid

**Evidencia — panel expandible bajo la tabla (no inline en la celda, fix Junio 2026):**
La primera versión mostraba el texto de la nota directamente en la celda de la tabla — en mobile se veía apretado y feo (mismo tipo de problema que ya habíamos resuelto con el mapa y la cámara del Trip Detail Accordion). Se aplicó el mismo patrón "click y carga abajo":
- La celda solo muestra un botón: "📝 View Note" / "📷 View Photo" (según tenga texto, foto, o ambos)
- Click → `toggleDhEvidence(idx)` renderiza la entrada completa (trip #, status, notas con `white-space:pre-wrap`, foto si existe) dentro de `#dhEvidenceMount` — un `<div>` fuera de la tabla, después de `.disp-table-wrap`, igual patrón que `#tripDetailMount`
- El botón activo se resalta con la clase `.live` (mismo glow rojo que "🔴 Live") mientras su evidencia está expandida
- Solo una evidencia expandida a la vez (`_dhExpandedIdx`); click en el mismo botón la cierra
- Click en la foto dentro del panel abre `#evidenceModal` para verla en grande

**Cómo se llena el historial (backend, `routes/dispatcher.js`):**
- `DRIVER_LOGS` — objeto en memoria `{ driverId: [...entries] }`, sembrado con datos demo al arrancar el servidor (incluye 2 abandonos de ejemplo con evidencia en texto)
- Cada vez que `PATCH /dispatcher/trips/:id/status` cambia el status de un viaje **a** `completed`, `cancelled` o `abandoned` (y el viaje tiene conductor asignado), se agrega una entrada al log de ese conductor — automático, sin acción manual adicional
- **Deduplicación:** solo se registra si el status realmente cambió (`status !== prevStatus`) — guardar el mismo status dos veces no duplica la entrada
- Las millas de cada entrada vienen del campo `distance_miles` que el frontend ya calculó (ver "Distancia en millas — Sistema automático") y envía en el PATCH como `distanceMiles`
- **Nota de arquitectura:** este fix también corrigió que `PATCH /trips/:id/status` antes **no persistía nada** en `DEMO_TRIPS` (solo hacía eco de lo recibido) — ahora sí actualiza el array en memoria del servidor

**Endpoints:**
```
GET /api/dispatcher/drivers              → [{ id, name, vehicle, plate, rating, totalTrips, totalMiles, completed, abandoned, cancelled }]
GET /api/dispatcher/drivers/:id/history  → { driver, history: [...], totalTrips, totalMiles }
```

**Entrada de historial (shape):**
```js
{ tripId, tripNumber, patientName, status, miles, notes, photo, pickup, destination, scheduledAt, loggedAt }
```

### Distancia en millas — Sistema automático

Todas las rutas muestran distancia real de carretera sin intervención manual.

**Arquitectura: proxy backend (no llamadas externas desde el navegador)**

El navegador nunca llama directamente a OSRM ni Photon — todo va a través del backend en `localhost:3000`. Esto elimina problemas de CORS, SSL y rate limiting que ocurren cuando el browser intenta acceder a esos servicios.

```
Browser → GET /api/dispatcher/miles?fromLat=…  →  Node.js → OSRM (server-side)
Browser → GET /api/dispatcher/geocode?address=… →  Node.js → Photon (server-side)
```

**Flujo de cálculo:**
1. Si el viaje tiene `pickup_coords` y `dest_coords`: llama `/api/dispatcher/miles` directamente
2. Si solo tiene dirección en texto (viajes creados manualmente): llama `/api/dispatcher/geocode` por cada dirección, luego `/api/dispatcher/miles`
3. El resultado se cachea en `trip.distance_miles` — no recalcula si ya existe
4. `updateTripMilesUI(tripId, miles)` actualiza simultáneamente 3 lugares en el DOM

**Funciones JS (js/dispatcher.js):**
```js
geocodeAddress(address)    // llama /api/dispatcher/geocode → { lat, lng }
osrmMiles(from, to)        // llama /api/dispatcher/miles → número de millas
calcTripMiles(trip)        // orquesta geocoding + distancia, cachea en trip.distance_miles
updateTripMilesUI(id, mi)  // actualiza #miles-{id}, #detailMiles-{id}, #reqMiles-{id}
calcProposedMiles(trips)   // batch secuencial con 250ms entre trips
```

**Endpoints backend (routes/dispatcher.js):**

`GET /api/dispatcher/miles?fromLat=&fromLng=&toLat=&toLng=`
- Llama OSRM server-side con `https` nativo de Node.js
- Si OSRM falla: calcula **Haversine × 1.3** como distancia estimada de carretera
- Responde `{ miles: 12.4, method: 'road' | 'estimated' }`

`GET /api/dispatcher/geocode?address=`
- Llama Photon (`photon.komoot.io`) con `User-Agent: MendezTransport-Dispatcher/1.0`
- bbox Florida: `-87.6,24.5,-80.0,31.0`
- Responde `{ lat, lng }` o `{ lat: null, lng: null }` si no encuentra

**Coordenadas en datos demo:**
- Los 6 `DEMO_TRIPS` ya tenían `pickup_coords`/`dest_coords` → nunca necesitan geocoding
- Los 3 `PROPOSED_TRIPS` ahora también tienen coords hardcodeadas → van directo a `/miles`
- Al aceptar una propuesta, el handler transfiere `pickup_coords`/`dest_coords` al nuevo trip
- Solo los viajes creados desde el formulario "New Trip" pasan por geocoding

**Dónde aparece en el UI:**
| Lugar | ID del elemento | Formato |
|-------|----------------|---------|
| Columna Ruta en tabla | `#miles-{id}` | `12.4 mi` (badge `.trip-miles`) |
| Panel de detalle del viaje | `#detailMiles-{id}` | `12.4 mi via road` |
| Cards de Insurance Requests | `#reqMiles-{id}` | `12.4 mi via road` o `📍 Calculating miles…` |

**Inicio de cálculo por contexto:**
- Viajes demo con coords: `loadAll()` hace batch con `setTimeout(idx * 180ms)` al arrancar
- Viajes aceptados de broker: el accept handler transfiere coords del objeto propuesta
- Viajes creados manualmente: `submitNewTrip()` llama `calcTripMiles()` tras crear el trip

### ETA mejorada — OSRM real (Trip Detail Accordion)

- Al abrir el acordeón, muestra la línea punteada fallback de inmediato
- Cuando OSRM responde: reemplaza la línea con la ruta real de carretera (polyline GeoJSON azul `#3B82F6`)
- ETA muestra tiempo de conducción real: `~12 min via road`
- Colores: 🔴 rojo (<5 min) · 🟡 ámbar (<15 min) · 🟢 verde (≥15 min)

### Dark Mode — Tiles del mapa

Al alternar dark mode, los tiles cambian en vivo sin reinicializar el mapa:
- **Light:** OpenStreetMap estándar (`tile.openstreetmap.org`)
- **Dark:** CartoDB Dark Matter (`basemaps.cartocdn.com/dark_all/`)
- `_dispTile` y `_detailTile` permiten `removeLayer()` + reemplazar sin destruir la instancia
- `buildTileLayer()` detecta `document.body.classList.contains('dark')` y retorna el tile correcto

### Nuevos elementos HTML (dispatcher.html)

| Elemento | ID / clase | Propósito |
|----------|-----------|-----------|
| Div de toasts | `#toastContainer` | Overlay fixed bottom-right para notificaciones |
| Modal confirmación | `#confirmModal` | Título + cuerpo + Cancel + Confirm (`.disp-btn-danger`) |
| Botón Mark Reviewed | `#incidentReviewBtn` | En footer del modal de incidente |
| Input de búsqueda | `#tripSearch` | Junto a los filtros, dentro de `.disp-board-controls` |
| Div paginación | `#tripsPagination` | Después del `.disp-table-wrap`, dentro de `.disp-panel` |
| Wrapper de controles | `.disp-board-controls` | Flex container para filtros + búsqueda |

### Nuevas variables JS (dispatcher.js)

```js
var currentPage   = 1;         // página actual de la tabla
var pageSize      = 15;        // filas por página
var searchQuery   = '';        // texto del input de búsqueda
var reviewedTrips = new Set(); // IDs de incidentes ya revisados
var _confirmCb    = null;      // callback del modal de confirmación
var _dispTile     = null;      // tile layer del mapa overview
var _detailTile   = null;      // tile layer del mapa de detalle
```

**Funciones nuevas (fix responsive — Junio 2026):**
```js
toggleDetailMap(tripId)   // muestra/oculta #detailMapWrap-{id}; init perezoso de initDetailMap()
etaClassForMins(mins)     // devuelve 'eta-green' | 'eta-amber' | 'eta-red' según minutos
closeTabMenu()            // cierra el dropdown de tabs en mobile (#dispTabBar.open)
```

**Funciones nuevas (Drivers tab + Abandoned — Junio 2026):**
```js
loadDrivers()                  // GET /api/dispatcher/drivers → renderiza #driversGrid
viewDriverHistory(driverId)    // GET /api/dispatcher/drivers/:id/history → renderiza #driverHistoryPanel
closeDriverHistory()           // vuelve de la vista de historial al grid de conductores
toggleDhEvidence(idx)          // expande/colapsa #dhEvidenceMount con la evidencia de esa fila del historial
onEditStatusChange()           // muestra/oculta #editAbandonedSection según el status elegido
onAbandonedPhotoChange(input)  // lee el file input, redimensiona a 640×480 JPEG 72% en canvas
viewEvidencePhoto(dataUrl) / closeEvidenceModal()  // modal para ver la foto de evidencia en grande
```

### Nuevas clases CSS (dispatcher.css)

| Clase | Propósito |
|-------|-----------|
| `.disp-toast-container` | Overlay fixed bottom-right |
| `.disp-toast` / `.disp-toast-{success\|error\|warning}` | Toast individual con icono SVG |
| `.disp-toast-show` | Activa transición slide-in |
| `.disp-confirm-modal` | Variante del modal genérico (más angosta) |
| `.disp-btn-danger` | Botón rojo para acciones destructivas |
| `.disp-board-controls` | Flex row: filtros + búsqueda |
| `.disp-search-wrap` | Wrapper input con ícono SVG via CSS background |
| `.disp-pagination` / `.disp-page-btns` / `.disp-page-btn.active` | Paginación |
| `.gps-offline` | Fila con badge ámbar cuando GPS no actualiza en >60s |
| `.disp-incident-btn.reviewed` | Botón verde `✓ Reviewed` |
| `.trip-miles` | Badge inline en celda ruta (`:empty { display: none }`) |
| `.disp-req-distance` | Línea de distancia en cards de Insurance Requests |
| `.disp-tab-toggle` / `.disp-tab-list` | Botón colapsado + dropdown del tab bar en mobile (≤768px) |
| `.disp-detail-eta.eta-{green\|amber\|red\|muted}` | Badge con fondo para el ETA (antes era texto plano sin fondo) |
| `.disp-detail-body.map-open` | Activa el grid de 2 columnas (260px + mapa) solo cuando el mapa está visible |
| `#detailMapWrap-{id}` | Wrapper del mapa del detalle, oculto por defecto hasta tocar "📍 View Map" |
| `#tripDetailMount` | Contenedor del panel de detalle, fuera de la tabla (ver nota de arquitectura en Trip Detail Accordion) |

### Netlify Blobs — stores utilizados
| Store | Clave | Contenido |
|-------|-------|-----------|
| `driver-locations` | `driver-{id}` | `{ driverId, name, plate, lat, lng, accuracy, updatedAt }` |
| `driver-snapshots` | `snapshot-{id}` | `{ driverId, name, dataUrl, capturedAt }` |
| `driver-incidents` | `incident-{tripId}-{timestamp}` | `{ tripId, tripNumber, patientName, driverId, driverName, type, notes, photoDataUrl, lat, lng, reportedAt }` |

**⚠️ Problema conocido — Netlify Blobs en Functions v1:**  
`@netlify/blobs` v10 requiere `NETLIFY_BLOBS_CONTEXT` que Netlify solo inyecta en Functions v2. Con el handler `serverless-http` (Functions v1) la variable no llega → `getStore()` falla → GPS real y snapshots no funcionan en producción Netlify. El WebRTC **no depende de Blobs** (peer ID es determinístico), por lo que el live video SÍ funciona. La solución definitiva es migrar a Functions v2 o agregar `NETLIFY_TOKEN` + `NETLIFY_SITE_ID` explícitos (Phase 3).

### GET `/api/dispatcher/incidents` — Detalle
- Retorna array de todos los incidentes ordenados por `reportedAt` descendente
- Cada incidente incluye: tipo, conductor, paciente, trip, coordenadas GPS, notas, foto (base64 JPEG)
- El dispatcher los agrupa por `tripId` en memoria con `incidentsByTrip`
- Se actualiza cada 30 segundos vía `pollIncidents()`

### POST `/api/driver/incident` — Detalle
Body JSON (max 400kb por la foto):
```json
{
  "tripId": "MT-2026-4891",
  "tripNumber": "MT-2026-4891",
  "patientName": "Maria Garcia",
  "type": "no_show",
  "notes": "Esperé 10 minutos. Nadie respondió.",
  "photoDataUrl": "data:image/jpeg;base64,...",
  "lat": 28.565,
  "lng": -81.379
}
```
Tipos válidos: `no_show` · `no_answer` · `wrong_address` · `refused` · `vehicle_issue` · `other`  
La foto se redimensiona a **640×480 JPEG 72%** en el cliente (canvas) antes de enviarse para mantener el payload bajo 200kb.

### Nota importante para backend real
Al conectar Supabase en Phase 3, `routes/dispatcher.js` reemplaza las constantes `DEMO_TRIPS`
y `DRIVERS` por queries a la base de datos. El frontend (`dispatcher.js`) no cambia.

---

## 8e. Portal de Brokers / Seguros

### Concepto
Página privada donde coordinadores de seguros (Medicaid, Sunshine Health, etc.) envían solicitudes de viaje para sus miembros. Las solicitudes aparecen en la tab **Insurance Requests** del dispatcher para ser aceptadas o rechazadas.

### Flujo completo

```
broker-login.html   ←  coordinador entra código de acceso
       ↓  POST /api/broker/verify (timing-safe)
broker.html         ←  tabla editable, hasta 20+ viajes simultáneos
       ↓  POST /api/broker/batch
dispatcher panel    ←  tab Insurance Requests muestra los viajes nuevos
```

### Acceso y seguridad
- **Login:** `http://localhost:3000/broker-login.html`
- **Código:** `Broker2026!` (variable de entorno `BROKER_KEY`)
- El código se valida en el servidor con `crypto.timingSafeEqual()` — nunca en el cliente
- Tras login exitoso: el código se guarda en `sessionStorage` (no en URL)
- `broker.html` lee el código de `sessionStorage` o de `?key=` en la URL (backward-compat)
- Si no hay código → redirección automática a `broker-login.html`

### Archivos
```
broker-login.html    — Página de login con acceso por código
broker.html          — Portal con tabla editable para 20+ viajes
css/broker.css       — Dark dashboard (misma paleta que el dispatcher)
```

### Diseño — Dark Dashboard
Misma paleta oscura que el dispatcher:
```css
--bg:       #0B0E1A
--card:     #161B30
--border:   #252A48
--accent:   #7C83F7   /* índigo */
--green:    #34D399
--red:      #F87171
--font:     Inter + Raleway
```

### Interfaz — Tabla editable tipo spreadsheet

Columnas por fila de viaje:
| # | Patient Name* | Insurance* | Type | Pickup* | Destination* | Date* | Time* | Notes | × |
|---|---|---|---|---|---|---|---|---|---|

Funcionalidades:
- **Empieza con 3 filas** vacías al cargar
- **+ Add Trip Row** — agrega filas sin límite
- **Tab** navega entre celdas; **Enter** en la columna Notes crea una nueva fila
- **× por fila** — elimina esa fila
- **Import CSV** — importa hasta 50 viajes de un archivo CSV
- **Download Template** — descarga plantilla CSV con columnas y ejemplos
- **Clear All** — limpia todo con confirmación
- **Contador** en tiempo real ("3 trips", "15 trips") en el badge del toolbar
- **Submit X Trips →** — botón sticky en la parte inferior, valida y envía en lote
- **Validación** — resalta en rojo las celdas vacías obligatorias antes de enviar
- **Spinner** durante el envío
- **Overlay de resultados** — tabla con cada Request # generado, estado ✓/✗, botón "Copy All Numbers"

### Importación CSV
Formato esperado (columnas en orden):
```
Patient Name, Insurance, Pickup Address, Destination, Date (YYYY-MM-DD o MM/DD/YYYY), Time (HH:MM o HH:MM AM/PM), Trip Type (ambulatory/wheelchair/stretcher), Notes
```
- El parser maneja comillas, comas dentro de campos y ambos formatos de fecha/hora
- Filas inválidas (menos de 4 columnas) se ignoran silenciosamente

### Endpoints backend (`routes/dispatcher.js`)

**`POST /api/broker/verify`** — Auth rateLimit (20/15min)
```json
Body:   { "brokerKey": "Broker2026!" }
200:    { "ok": true }
401:    { "ok": false, "error": "Invalid access code." }
```

**`POST /api/broker/submit`** — Un viaje individual
```json
Body: { brokerKey, patientName, insurance, memberId, tripType, pickup,
        destination, tripDate, tripTime, notes, contactName, contactPhone }
200:  { "ok": true, "requestNumber": "MT-REQ-0015" }
401:  { "error": "Invalid access code." }
400:  { "error": "Missing required fields." }
```

**`POST /api/broker/batch`** — Hasta 50 viajes (lote)
```json
Body: { "brokerKey": "...", "trips": [ {...}, {...}, ... ] }
200:  {
  "ok": true,
  "submitted": 3,
  "total": 3,
  "results": [
    { "ok": true, "requestNumber": "MT-REQ-0015", "patientName": "Ana Lopez" },
    { "ok": true, "requestNumber": "MT-REQ-0016", "patientName": "Robert Smith" },
    { "ok": false, "error": "Missing required fields", "patientName": "" }
  ]
}
```

### Numeración de solicitudes
`nextReqNum` — contador en memoria, arranca en 15 (para que los demos sean 0012-0014).
Formato: `MT-REQ-XXXX` con cero-padding a 4 dígitos.
Se resetea al reiniciar el servidor (arquitectura stateless demo).

### Credenciales del broker
| Campo | Valor |
|-------|-------|
| URL login | `http://localhost:3000/broker-login.html` |
| Código de acceso | `Broker2026!` |
| Variable de entorno | `BROKER_KEY` |

### Variable de entorno
```bash
# .env o Netlify env vars
BROKER_KEY=Broker2026!
```
Documentado en `.env.example`.

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
- Al activar la cámara, registra un **Peer ID determinístico**: `mz-drv-{driver.id}` (ej. `mz-drv-1` para Carlos Rivera)

**WebRTC (PeerJS):**
- Driver crea un `Peer` con ID determinístico `mz-drv-{driverId}` al activar la cámara
- Si el ID ya está tomado (reconexión rápida), reintenta con sufijo: `mz-drv-1-{timestamp36}`
- Responde llamadas entrantes del dispatcher con el stream completo (video + audio)
- **El dispatcher calcula el peer ID directamente** desde `trip.driver.id` — no depende de Netlify Blobs
- TURN servers (Open Relay) incluidos para funcionar a través de NAT/firewalls
- Al cerrar sesión: detiene cámara, micrófono, GPS y destruye el peer

**Reporte de incidentes:**
- Botón **⚠ Report Incident** visible en cada viaje activo (desaparece tras enviar el reporte)
- Bottom sheet (panel deslizante desde abajo) con 6 tipos de incidente:
  - 🚫 No Show · 📞 No Answer · 📍 Wrong Address · ⛔ Patient Refused · 🔧 Vehicle Issue · 📝 Other
- Campo de notas libre
- Foto de evidencia: abre selector/cámara con `<input type="file" capture="environment">` — **funciona en iOS standalone** (no usa `getUserMedia`)
- La foto se redimensiona a 640×480 JPEG 72% en un canvas antes de enviarse
- Al enviarse: badge rojo `⚠ INCIDENTE REPORTADO` aparece en la tarjeta del viaje; el botón de reportar desaparece
- El reporte incluye las coordenadas GPS en ese momento (si disponibles)

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

No se necesita `.env` — todas las variables tienen defaults en el código. El rate limiter es en memoria y se resetea al reiniciar el servidor.

### Testing con celular (tunnel HTTPS)
La cámara y el GPS del celular **requieren HTTPS**. Para exponer localhost al celular:

```bash
# Terminal 1 — servidor
node server.js

# Terminal 2 — tunnel público HTTPS (sin cuenta requerida)
ssh -R 80:localhost:3000 nokey@localhost.run
# → da una URL como https://xxxxxx.lhr.life
```

- **Laptop (dispatcher):** `http://localhost:3000/dispatcher.html`
- **Celular (driver):** `https://xxxxxx.lhr.live/driver.html`

El tunnel funciona desde cualquier red (4G/5G, WiFi distinto). Solo requiere que la laptop tenga internet.

**Alternativa con ngrok** (requiere cuenta gratuita):
```bash
ngrok http 3000
```

---

## 11. Próximos pasos (si aprueban)

### MVP actual — lo que ya está demo-listo ✅
- [x] Sitio público (6 páginas)
- [x] Portal del paciente (login + 2FA + tracking)
- [x] Panel del dispatcher completo:
  - [x] Stats bar, tabla con filtros, mapa Leaflet overview (polling 5s), edit modal
  - [x] Sistema de tabs: Dispatch Board / Insurance Requests / New Trip
  - [x] Cabin View inline (panel `#livePanel` — sin modal popup)
  - [x] Trip Detail Accordion — mapa dedicado + ETA real OSRM + polyline de ruta real
  - [x] Reportes de incidentes — punto `!` + modal detalle + botón Mark Reviewed
  - [x] Dark mode — toggle navbar, localStorage, tiles CartoDB Dark Matter en vivo
  - [x] Búsqueda en tiempo real por nombre / número / pickup
  - [x] Paginación client-side (15 filas/página)
  - [x] Toast notifications (success / error / warning)
  - [x] Modal de confirmación genérico reutilizable
  - [x] SessionStorage para propuestas aceptadas/rechazadas (no reaparecen al cambiar tab)
  - [x] Validación de solapamiento de conductor (90 minutos)
  - [x] Detección GPS offline (badge ámbar + marcador semitransparente si >60s sin update)
  - [x] Distancia en millas automática — OSRM + Nominatim geocoding (tabla + detalle + requests)
- [x] Sistema de roles JWT (patient / dispatcher / driver)
- [x] Seguridad: helmet, CORS, express-validator, rate limiting
- [x] Driver PWA — app del conductor completa:
  - [x] Viajes del día, navegación (Apple Maps / Google Maps / Waze)
  - [x] GPS en tiempo real (5s) → mapa del dispatcher se actualiza en vivo
  - [x] Cámara de cabina con flip frontal/trasera
  - [x] Micrófono — audio en el stream
  - [x] Video WebRTC en vivo (~1s delay) vía PeerJS → dispatcher ve **🔴 Live** ✅ **verificado**
  - [x] Peer ID determinístico `mz-drv-{id}` — no depende de Netlify Blobs
  - [x] TURN servers (Open Relay) para conexión a través de NAT
  - [x] Snapshot automático cada 60s
  - [x] Instalable como PWA (manifest.json + service worker)
  - [x] Reporte de incidentes con 6 tipos, notas y foto de evidencia
- [x] Panel del dispatcher — reportes de incidentes:
  - [x] Punto rojo `!` en tabla cuando hay incidente en el trip
  - [x] Modal con tipo, conductor, timestamp, Google Maps link, notas y foto
- [x] Panel del dispatcher — Cabin View inline (reemplaza modal popup):
  - [x] `#livePanel` dentro de `<main>` — aparece debajo de tabla/mapa al clickear 🔴 Live
  - [x] Scroll suave hasta el panel; botón ✕ cierra y destruye peer WebRTC
- [x] Panel del dispatcher — Sistema de tabs:
  - [x] Tab "Dispatch Board" — vista principal existente
  - [x] Tab "Insurance Requests" — propuestas de seguros (accept/reject/assign driver)
  - [x] Tab "New Trip" — formulario para crear viajes manualmente
  - [x] Badge rojo en tab con conteo de solicitudes pendientes
- [x] Panel del dispatcher — Trip Detail Accordion:
  - [x] Click en fila → panel expandible con info completa del viaje
  - [x] Mapa Leaflet dedicado por viaje (instancia separada) con driver + pickup + destination
  - [x] ETA calculada con Haversine distance / 25 mph, colores por urgencia
  - [x] ETA se actualiza cada 5s junto con pollLocations()
  - [x] Línea punteada driver → destino en el mapa de detalle
- [x] Panel del dispatcher — Dark Mode:
  - [x] Toggle sol/luna en navbar, persiste en localStorage
  - [x] Cubre todos los elementos: tabla, modales, forms, cards, cabin panel, detail accordion

### Limitaciones conocidas en demo local
| Feature | Local | Netlify (cuando vuelva) |
|---------|-------|------------------------|
| Login / auth / 2FA | ✅ | ✅ |
| Tabla de trips dispatcher | ✅ | ✅ |
| 🔴 Live WebRTC (video) | ✅ (con tunnel HTTPS) | ✅ |
| GPS real en mapa | ❌ sin Blobs | ❌ mismo problema |
| Snapshot de cabina | ❌ sin Blobs | ❌ mismo problema |
| Incidentes (guardar/ver) | ❌ sin Blobs | ❌ mismo problema |
| GPS simulado en mapa | ✅ posiciones estáticas | ✅ posiciones estáticas |

### Portal de brokers ✅
- [x] Login con código de acceso (`broker-login.html`) — dark dashboard, animación fadeUp
- [x] Validación server-side timing-safe (`POST /api/broker/verify`)
- [x] Código guardado en `sessionStorage` — no expuesto en URL
- [x] Auto-redirect a login si no hay código en `broker.html`
- [x] Tabla editable para 20+ viajes simultáneos
- [x] Navegación teclado: Tab entre celdas, Enter en última columna agrega fila
- [x] Botón × por fila, + Add Trip Row, Clear All con confirmación
- [x] Import CSV con parser de fecha/hora flexible (YYYY-MM-DD, MM/DD/YYYY, AM/PM)
- [x] Download Template CSV
- [x] Submit batch (`POST /api/broker/batch`) — hasta 50 viajes por envío
- [x] Validación con highlight rojo en celdas vacías obligatorias
- [x] Overlay de resultados con tabla de Request #, estado ✓/✗, Copy All Numbers
- [x] Spinner + estado disabled durante envío
- [x] Fix CSS: `[hidden] { display: none !important }` — evita que `display:flex` sobreescriba `hidden`

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

---

## 13. Historial de sesiones de desarrollo

### Sesión actual (17 Jun 2026) — Login único + responsive mobile completo del dispatcher

**Contexto:** demo al manager probada en vivo desde el celular vía tunnel (`ssh -R 80:localhost:3000 nokey@localhost.run`). Aparecieron varios bugs de mobile que no se veían en desktop; cada uno se diagnosticó reproduciéndolo con un navegador headless (Chrome vía Playwright, instalado y desinstalado solo para verificar — no quedó como dependencia del proyecto) simulando viewport de iPhone (390px).

**1. Login único — eliminado `hub.html`**
- Se había creado por error una pantalla intermedia "elige tu portal" (`hub.html`) con tarjetas por rol — no era lo pedido
- `login.html` volvió a ser una página única y genérica (sin `?role=`), con demo hint listando las 3 cuentas de prueba
- El redirect automático por rol tras 2FA ya existía en `auth.js` y no necesitó cambios
- `broker-login.html`: el link "Portal select → hub.html" se cambió a "Staff login → login.html"

**2. Tab bar plegable en mobile**
- A ≤768px, `.disp-tab-bar` no tenía wrap ni scroll — el tab "New Trip" quedaba inalcanzable
- Ahora colapsa en `#dispTabToggle` (botón con el tab activo + flecha) que despliega `#dispTabList` como dropdown

**3. Trip Detail Accordion no se veía en mobile (causa real, no solo "falta de espacio")**
- Diagnóstico con headless browser: el `<td colspan="7">` de la fila de detalle coincidía con `nth-child(1)`, la misma regla que oculta la columna "#" en pantallas ≤480px (`display:none`) — el panel se insertaba en el DOM pero con altura 0, invisible
- Fix inmediato: excluir `.disp-detail-row` de esas reglas (`tr.disp-trip-row td:nth-child(...)`)
- Fix definitivo (más adelante en la sesión): el panel se sacó de la tabla por completo — ver punto 6

**4. CSS Grid blowout — diseño "pegado a los bordes" sin padding**
- `.disp-panel` (grid item de `.disp-main`) no tenía `min-width:0` → el contenido ancho de la tabla forzaba a toda la columna del grid (y la página) a expandirse más allá del viewport
- Fix: `min-width:0` en `.disp-panel`, `.disp-detail-body`, `.disp-detail-info`; `overflow-wrap: anywhere` en `.disp-detail-value` para que direcciones largas ya no se corten

**5. Navbar desbordado en mobile**
- "Mendez Transportation" + badge "Dispatcher" + botón "Sign Out" no entraban en 390px
- Fix en ≤480px: marca truncada con ellipsis ("Mendez Trans…"), badge de rol oculto, botón Sign Out solo con ícono (`.logout-label` oculto)

**6. ETA casi invisible → badge con fondo**
- El ETA usaba texto plano en color sin fondo — bajo contraste sobre el panel claro
- Ahora es una pastilla con fondo tintado (`.eta-green/.eta-amber/.eta-red/.eta-muted`), mismo patrón que los status badges existentes
- `etaClassForMins()` centraliza el cálculo, usado en los 3 lugares donde se actualiza el ETA (apertura del panel, polling GPS cada 5s, respuesta de ruta real OSRM)

**7. Mapa del detalle → botón "📍 View Map" (bajo demanda)**
- A pedido explícito: el mapa Leaflet ya no se carga automático al abrir el detalle, solo al tocar el botón (mismo patrón que "🔴 Live" de la cámara)
- `toggleDetailMap(tripId)` muestra/oculta `#detailMapWrap-{id}` e inicializa el mapa de forma perezosa la primera vez

**8. Refactor estructural: panel de detalle fuera de la tabla**
- Causa raíz de varios bugs de header cortado: el panel vivía dentro de un `<td>` de la misma tabla con scroll horizontal propio (la tabla mide ~538px en una pantalla de 390px por las columnas) — los botones del header quedaban fuera del área visible sin scroll
- Fix: nuevo `<div id="tripDetailMount">` fuera de `.disp-table-wrap`, a ancho completo; `openTripDetail()`/`closeTripDetail()` ya no manipulan `<tr>`/`<td>`, solo `mount.innerHTML`
- `.disp-detail-header` ahora usa `flex-wrap:wrap` como defensa adicional

**9. Botones duplicados — Live/Edit ya no se repiten**
- La tabla mostraba "🔴 Live" y "Edit" por fila, y el panel de detalle (abierto al hacer clic en esa misma fila) repetía los mismos controles
- Fix: se quitaron `cabinBtn` y `disp-edit-btn` del `actions-cell` de la tabla — esos controles ahora viven únicamente en el panel de detalle; la tabla solo conserva el botón "⚠ Report" de incidentes
- CSS muerto de `.disp-edit-btn` eliminado (incluyendo overrides de dark mode)

**10. Status "Abandoned" + historial de viajes por conductor (feature nueva, no fix)**
- Contexto del cliente: los conductores a veces abandonan la ruta sin completarla, y no había forma de documentarlo ni de ver el historial de un conductor
- Nuevo status `abandoned` (badge propio, distinto color del de `cancelled`) con sección de evidencia opcional (texto + foto, ninguno obligatorio) en el modal de edición
- Nueva tab **"Drivers"** (4ta tab) — grid de conductores con resumen, click abre historial completo con millas por viaje y millas totales
- Fix de paso: `PATCH /trips/:id/status` no persistía nada en el backend (solo hacía eco) — ahora sí actualiza `DEMO_TRIPS` y registra cada trip terminal (completed/cancelled/abandoned) en `DRIVER_LOGS` por conductor, con deduplicación si el status no cambió
- Ver detalle completo en sección 8c → "Status Abandoned" y "Tab: Drivers"

**Metodología usada para diagnosticar (reutilizable en sesiones futuras):** instalar temporalmente `playwright-core` (`npm install -D playwright-core`), apuntar a `executablePath` de Chrome ya instalado en el sistema (`C:\Program Files\Google\Chrome\Application\chrome.exe`), abrir página con `viewport` de mobile (390×844, `isMobile:true`), automatizar login+2FA, hacer `tap()`/`click()` en el elemento, e inspeccionar `getBoundingClientRect()` / `getComputedStyle()` antes de confiar en capturas. Desinstalar `playwright-core` al terminar (`npm uninstall playwright-core`) para no dejarlo como dependencia.

### Sesión anterior (16 Jun 2026) — WebRTC + fixes de Netlify
- WebRTC live video verificado y funcional: peer IDs determinísticos (`mz-drv-{driverId}`)
- Fix 3 deploys Netlify fallidos: revertido `api.js` a handler simple `serverless(app)`
- CSP actualizado: unpkg.com/cdn.jsdelivr.net, `scriptSrcAttr: unsafe-inline`, PeerJS WS en connectSrc
- CORS en dev permite todos los orígenes (tunnels, celulares en LAN)
- TURN servers Open Relay para NAT traversal
- Testing local: `node server.js` + `ssh -R 80:localhost:3000 nokey@localhost.run`
- Netlify Blobs: Functions v1 no recibe `NETLIFY_BLOBS_CONTEXT` → GPS real no funciona en Netlify

### Sesión anterior (16 Jun 2026) — Dispatcher: 4 features nuevas

**1. Cabin View → Panel Inline**
- Eliminado modal popup `#cabinModal` (era `disp-modal-overlay`)
- Reemplazado por `#livePanel` dentro de `<main>` con `grid-column: 1 / -1`
- Al abrir: añade clase `.open`, scroll suave; al cerrar: remueve clase, destruye peer
- JS: `viewCabin()` y `closeCabin()` actualizados — sin click-outside listener

**2. Tab System + Insurance Requests + New Trip**
- Tab bar debajo del navbar (mismo fondo navy, borde inferior azul en tab activo)
- `id="tabBoard"` en `<main>`, `#tabRequests` y `#tabNewtrip` como `<section>` después del main
- Nuevos endpoints backend en `routes/dispatcher.js`:
  - `GET /proposed` — 3 solicitudes demo (Medicaid, UnitedHealth, Sunshine Health)
  - `POST /proposed/:id/accept` — mueve a DEMO_TRIPS, asigna conductor, devuelve trip
  - `POST /proposed/:id/reject` — elimina de PROPOSED_TRIPS
  - `POST /trips` — crea viaje, incrementa `nextTripNum`, devuelve stats actualizadas
- Stats badge `proposed` añadido a `GET /stats`
- JS: `loadProposed()`, `renderRequests()`, `acceptProposed()`, `rejectProposed()`, `submitNewTrip()`, `updateRequestsBadge()`
- CSS: `.disp-tab-bar`, `.disp-tab`, `.disp-tab-badge`, `.disp-req-card`, `.disp-req-*`, `.disp-new-trip-form`, `.disp-form-grid`, `.disp-field`

**3. Trip Detail Accordion**
- `<tr>` de la tabla tiene `onclick="openTripDetail(event, id)"` — ignora clicks en botones via `e.target.closest('button')`
- Al expandir: inserta `<tr class="disp-detail-row">` con `colspan=7` debajo de la fila
- Panel tiene 2 columnas: info (260px) + mapa Leaflet dedicado (`detailMap`)
- `detailMap` es instancia separada de `dispMap` — se destruye al colapsar
- ETA: Haversine distance → `dist / 25 mph * 60 min`, verde/ámbar/rojo según urgencia
- `updateDetailMapPosition()` llamada en cada tick de `pollLocations()` (cada 5s)
- `renderTable()` llama `closeTripDetail()` al inicio para evitar huerfanos DOM
- CSS: `.disp-trip-row`, `.detail-open`, `.disp-detail-row`, `.disp-trip-detail`, `.disp-detail-*`, `#detailMapContainer`, `.disp-detail-legend`, `.disp-legend-dot`

**4. Dark Mode**
- Botón `.disp-dark-toggle` en navbar con SVG sol + luna (uno oculto según modo)
- `body.dark` clase: override de 5 variables CSS (`--disp-bg`, `--disp-panel`, `--disp-border`, `--disp-text`, `--disp-muted`) + ~40 reglas de overrides específicos
- Acento dark: indigo `#818CF8` / `#3730A3` en lugar del navy `#1E2A6E`
- `localStorage('disp-dark')` — `'1'` = dark, `'0'` = light; se aplica en el IIFE al cargar
- Scrollbar custom webkit en dark mode
- JS: `applyDark(bool)`, `toggleDarkMode()` (expuesta en `window`)

### Sesión actual (16 Jun 2026) — Dispatcher: 10 mejoras de panel + cálculo automático de millas

**1. Toast notification system**
- `showToast(msg, type, dur)` — overlay bottom-right con slide-in CSS, 3 variantes (success/error/warning)
- `#toastContainer` en HTML, `aria-live="polite"` para accesibilidad
- Reemplaza los `alert()` del panel en todas las acciones (aceptar/rechazar/guardar/crear)

**2. Modal de confirmación genérico**
- `showConfirm(title, body, onConfirm)` — patrón callback `_confirmCb`
- `#confirmModal` en HTML con botones Cancel (`_confirmCancel`) y Confirm (`_confirmOk`)
- Usado en reject de propuestas y cancelar viajes

**3. Búsqueda en tiempo real**
- Input `#tripSearch` en `.disp-board-controls` junto a los filtros de status
- Filtra `allTrips` por `patient_name`, `number` y `pickup` (case-insensitive, `indexOf`)
- Resetea `currentPage = 1` al cambiar el texto

**4. Paginación client-side**
- 15 filas por página (`pageSize = 15`), variable `currentPage`
- `renderPagination(total, current, totalPages)` genera div `#tripsPagination` con prev/next + botones numerados
- `changePage()` y `gotoPage()` expuestas en `window` para los `onclick=` del HTML generado

**5. SessionStorage para propuestas**
- Arrays `disp-accepted` y `disp-rejected` en sessionStorage
- Al aceptar/rechazar una propuesta: el ID se agrega al array correspondiente
- `loadProposed()` filtra los resultados del servidor para excluir IDs ya procesados en esta sesión

**6. OSRM real routing en Trip Detail Accordion**
- Reemplaza la línea punteada Haversine por ruta real de carretera
- Fallback: línea punteada se muestra de inmediato; polyline OSRM la reemplaza cuando llega
- ETA muestra tiempo real de conducción: `~12 min via road`

**7. CartoDB Dark Matter tiles (dark mode)**
- `buildTileLayer()` devuelve tile OSM (light) o CartoDB Dark Matter (dark) según `body.dark`
- `toggleDarkMode` hace `removeLayer(_dispTile)` + `removeLayer(_detailTile)` y recrea los tiles sin reinicializar los mapas
- `_dispTile` y `_detailTile` se inicializan en `initMap()` e `initDetailMap()`

**8. Detección GPS offline**
- En `pollLocations()`, por cada trip `en_route`: compara `Date.now() - new Date(updatedAt).getTime() > 60000`
- Si offline: añade clase `.gps-offline` a la fila (badge ámbar en status cell) y opacidad 0.35 al marcador
- Si vuelve online: remueve la clase y restaura opacidad

**9. Incident review — Mark Reviewed**
- `reviewedTrips = new Set()` en scope del módulo
- `markIncidentReviewed()` agrega el ID al set, cambia el punto `!` a `✓` en la tabla, re-renderiza
- Botón `#incidentReviewBtn` en footer del modal de incidente

**10. Validación de solapamiento de conductor**
- `driverHasOverlap(driverId, scheduledAt, excludeId)` revisa todos los trips no cancelados/completados
- Ventana de 90 minutos — bloquea guardado en el edit modal con toast de error si hay conflicto

**Cálculo automático de millas en carretera**
- Nuevas funciones: `geocodeAddress()`, `osrmMiles()`, `calcTripMiles()`, `updateTripMilesUI()`, `calcProposedMiles()`
- Viajes demo batch-calculados al arrancar (`loadAll`) con `setTimeout(idx * 180ms)`
- Propuestas de seguros calculadas en `loadProposed()` con `calcProposedMiles()`
- Viajes aceptados: transfieren coords y millas ya calculadas de la propuesta (sin llamadas extra)
- Viajes creados manualmente: `submitNewTrip()` llama `calcTripMiles()` tras insertar
- Rate limiting Nominatim: 1150ms entre las dos geocodificaciones de un mismo viaje; 1250ms entre viajes en batch
- Millas mostradas en 3 lugares: tabla (`#miles-{id}`), detalle (`#detailMiles-{id}`), requests (`#reqMiles-{id}`)

### Fix (16 Jun 2026) — Millas no cargaban en Insurance Requests

**Causa raíz:** Las llamadas a OSRM y Nominatim/Photon se hacían directamente desde el navegador. El servidor de demo de OSRM (`router.project-osrm.org`) fallaba por problemas de SSL/TLS desde Windows, y Nominatim bloqueaba requests sin User-Agent correcto.

**Solución:** Mover todas las llamadas externas al backend (Node.js). El browser ahora solo llama a `localhost:3000/api/dispatcher/miles` y `/api/dispatcher/geocode`.

**Cambios en `routes/dispatcher.js`:**
- Agregado `const https = require('https')` y helper `_fetchJSON(url)` con User-Agent
- Nuevo endpoint `GET /miles`: llama OSRM server-side, cae en Haversine × 1.3 si OSRM no responde
- Nuevo endpoint `GET /geocode`: llama Photon con User-Agent propio y bbox Florida
- Coordenadas reales (`pickup_coords`/`dest_coords`) agregadas a los 3 `PROPOSED_TRIPS` → eliminan la necesidad de geocoding para el caso demo
- Accept handler actualizado para transferir esas coords al nuevo trip activo

**Cambios en `js/dispatcher.js`:**
- `geocodeAddress()`: ahora llama `GET /api/dispatcher/geocode` (antes: Photon directo)
- `osrmMiles()`: ahora llama `GET /api/dispatcher/miles` (antes: OSRM directo con retry)
- `calcTripMiles()`: sin delay artificial entre geocoding calls (backend es local)
- `calcProposedMiles()`: delay reducido a 250ms entre trips (todo es local)

### Sesión actual (16 Jun 2026) — Portal de Brokers completo

**Contexto:** El manager de la empresa recibe emails de seguros con solicitudes de viaje. Se construyó un portal privado donde los coordinadores de seguros pueden entrar y presentar sus viajes directamente al sistema, apareciendo en la tab Insurance Requests del dispatcher.

**1. Portal rediseñado — Dark Dashboard**
- Diseño original (tema claro, un viaje a la vez) rechazado por el cliente
- Reescritura completa de `broker.html` y `css/broker.css`
- Mismo sistema de colores del dispatcher: `#0B0E1A` fondo, `#161B30` panels, `#7C83F7` índigo
- Tabla tipo spreadsheet para 20+ viajes simultáneos
- Inputs siempre visibles (fondo sutil + borde por defecto, no transparentes)
- Filas alternadas, hover con acento índigo, separadores verticales entre columnas

**2. `broker-login.html` — nueva página de login**
- Card centrada sobre fondo oscuro con grid sutil
- Input tipo `password` con toggle show/hide
- Validación contra `POST /api/broker/verify` (server-side, timing-safe)
- En éxito: guarda código en `sessionStorage`, redirige a `broker.html`
- En error: animación shake + mensaje rojo
- Auto-focus al cargar

**3. Nuevos endpoints en `routes/dispatcher.js`**
- `POST /api/broker/verify` — valida BROKER_KEY sin exponer el valor, usa `brokerLimiter`
- `POST /api/broker/batch` — acepta array de hasta 50 viajes, devuelve resultados individuales con sus Request Numbers

**4. `broker.html` actualizado**
- Lee código de `sessionStorage` como fallback de `?key=` en URL
- Si no hay código → redirect automático a `broker-login.html`
- URL limpia: si vino del login, elimina el `?key=` del historial con `history.replaceState`
- Import CSV con parser robusto (comillas, formatos de fecha/hora múltiples)
- Overlay de resultados con animación glassmorphism

**5. Fix crítico de CSS**
- El overlay de resultados (`.brk-overlay { display: flex }`) sobreescribía el atributo `hidden`
- **Fix:** `[hidden] { display: none !important }` en la primera línea de `broker.css`
- El mismo fix aplica a la barra de error de acceso (`.brk-info { display: flex }`)

**6. `.env.example` actualizado**
- Agregada entrada `BROKER_KEY=Broker2026!` al final del archivo

*Documentación actualizada el 17 de Junio 2026.*
