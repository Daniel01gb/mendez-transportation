const router       = require('express').Router();
const brokerRouter = require('express').Router();
const https        = require('https');
const crypto       = require('crypto');
const { requireDispatcher }                      = require('../middleware/auth');
const { dispatcherProxyLimiter, brokerLimiter }  = require('../middleware/rateLimit');

const BROKER_KEY = process.env.BROKER_KEY || 'Broker2026!';
var nextReqNum   = 15; /* demo has MT-REQ-0012, 0013, 0014 → next is 0015 */

function _safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) { crypto.timingSafeEqual(ba, ba); return false; }
  return crypto.timingSafeEqual(ba, bb);
}

/* Server-side fetch helper — avoids browser CORS/SSL issues */
function _fetchJSON(url) {
  return new Promise(function (resolve, reject) {
    https.get(url, { headers: { 'User-Agent': 'MendezTransport-Dispatcher/1.0' } }, function (res) {
      var raw = '';
      res.on('data', function (c) { raw += c; });
      res.on('end', function () { try { resolve(JSON.parse(raw)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

var _blobsError = null;
function getBlobs() {
  try { return require('@netlify/blobs').getStore('driver-locations'); }
  catch (e) { _blobsError = e.message; return null; }
}

function getSnapshotBlobs() {
  try { return require('@netlify/blobs').getStore('driver-snapshots'); }
  catch (_) { return null; }
}

function getIncidentBlobs() {
  try { return require('@netlify/blobs').getStore('driver-incidents'); }
  catch (_) { return null; }
}

const DRIVERS = [
  { id: 1, name: 'Carlos Rivera',  vehicle: '2023 Toyota Sienna',    plate: 'FLA-4892', rating: 4.9 },
  { id: 2, name: 'Ana Martinez',   vehicle: '2022 Honda Odyssey',     plate: 'FLA-2341', rating: 4.8 },
  { id: 3, name: 'Miguel Santos',  vehicle: '2023 Chrysler Pacifica', plate: 'FLA-7821', rating: 4.7 },
  { id: 4, name: 'Luis Hernandez', vehicle: '2021 Toyota Sienna',     plate: 'FLA-5513', rating: 4.8 },
];

function makeTime(h, m) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/* Active driver positions for en_route trips (simulated) */
const DRIVER_POSITIONS = {
  1: { lat: 28.5435, lng: -81.3980 }, /* Carlos — between Orlando and Kissimmee */
  4: { lat: 28.6320, lng: -81.3840 }, /* Luis — Altamonte Springs area */
};

const DEMO_TRIPS = [
  {
    id: 1, number: 'MT-2026-4891', patient_name: 'Maria Garcia',
    status: 'en_route', driver_id: 1,
    pickup: '601 E Rollins St, Orlando FL 32803',
    destination: 'Osceola Regional Medical Center, Kissimmee FL',
    pickup_coords:  { lat: 28.5650, lng: -81.3799 },
    dest_coords:    { lat: 28.3069, lng: -81.4073 },
    scheduled_at: makeTime(8, 30), notes: ''
  },
  {
    id: 2, number: 'MT-2026-4892', patient_name: 'Robert Johnson',
    status: 'confirmed', driver_id: 2,
    pickup: '1234 Oak Ave, Orlando FL 32806',
    destination: 'AdventHealth Orlando, 601 E Rollins St',
    pickup_coords:  { lat: 28.5245, lng: -81.3765 },
    dest_coords:    { lat: 28.5650, lng: -81.3799 },
    scheduled_at: makeTime(10, 0), notes: ''
  },
  {
    id: 3, number: 'MT-2026-4893', patient_name: 'Linda Chen',
    status: 'pending', driver_id: null,
    pickup: '789 Pine St, Kissimmee FL 34741',
    destination: 'Florida Hospital Celebration, Celebration FL',
    pickup_coords:  { lat: 28.3069, lng: -81.4073 },
    dest_coords:    { lat: 28.3242, lng: -81.5482 },
    scheduled_at: makeTime(12, 30), notes: ''
  },
  {
    id: 4, number: 'MT-2026-4894', patient_name: 'James Wilson',
    status: 'completed', driver_id: 3,
    pickup: '456 Elm Rd, Sanford FL 32771',
    destination: 'Central Florida Regional Hospital, Sanford FL',
    pickup_coords:  { lat: 28.7989, lng: -81.2731 },
    dest_coords:    { lat: 28.8086, lng: -81.2637 },
    scheduled_at: makeTime(6, 0), notes: ''
  },
  {
    id: 5, number: 'MT-2026-4895', patient_name: 'Patricia Brown',
    status: 'en_route', driver_id: 4,
    pickup: '222 Lake Dr, Altamonte Springs FL 32701',
    destination: 'AdventHealth Altamonte Springs, FL 32701',
    pickup_coords:  { lat: 28.6531, lng: -81.3656 },
    dest_coords:    { lat: 28.6636, lng: -81.3793 },
    scheduled_at: makeTime(9, 15), notes: ''
  },
  {
    id: 6, number: 'MT-2026-4896', patient_name: 'Dorothy Martinez',
    status: 'pending', driver_id: null,
    pickup: '901 State Rd 192, Kissimmee FL 34747',
    destination: 'Osceola Regional Medical Center, Kissimmee FL',
    pickup_coords:  { lat: 28.3200, lng: -81.4300 },
    dest_coords:    { lat: 28.3069, lng: -81.4073 },
    scheduled_at: makeTime(14, 0), notes: ''
  },
];

/* Proposed trips (insurance requests) — in-memory for demo session */
var PROPOSED_TRIPS = [
  {
    id: 101, number: 'MT-REQ-0012',
    patient_name: 'Elena Ruiz',
    pickup:      '1000 Lee Rd, Orlando FL 32810',
    destination: 'AdventHealth Orlando, 601 E Rollins St, Orlando FL 32803',
    pickup_coords:  { lat: 28.5967, lng: -81.4017 },
    dest_coords:    { lat: 28.5650, lng: -81.3799 },
    scheduled_at: makeTime(11, 0),
    insurance: 'Medicaid',
    notes: 'Wheelchair accessible vehicle required',
    submitted_at: new Date().toISOString()
  },
  {
    id: 102, number: 'MT-REQ-0013',
    patient_name: 'Thomas Scott',
    pickup:      '3200 S Orange Ave, Orlando FL 32806',
    destination: 'Florida Hospital Celebration, Celebration FL 34747',
    pickup_coords:  { lat: 28.5018, lng: -81.3736 },
    dest_coords:    { lat: 28.3242, lng: -81.5482 },
    scheduled_at: makeTime(13, 30),
    insurance: 'UnitedHealth',
    notes: '',
    submitted_at: new Date().toISOString()
  },
  {
    id: 103, number: 'MT-REQ-0014',
    patient_name: 'Grace Kim',
    pickup:      '5800 Vineland Rd, Orlando FL 32819',
    destination: 'Dr. Phillips Hospital, 9400 Turkey Lake Rd, Orlando FL 32819',
    pickup_coords:  { lat: 28.4720, lng: -81.4799 },
    dest_coords:    { lat: 28.4564, lng: -81.4698 },
    scheduled_at: makeTime(15, 0),
    insurance: 'Sunshine Health',
    notes: 'Spanish-speaking driver preferred',
    submitted_at: new Date().toISOString()
  }
];

var nextTripNum = 4897; /* increments with each new trip created */

/* ── Driver history log (in-memory) ──
   One entry per trip that reaches a terminal state (completed/cancelled/abandoned)
   while assigned to a driver. Powers the "Drivers" tab — full trip history + miles per driver. */
var DRIVER_LOGS = { 1: [], 2: [], 3: [], 4: [] };

function logDriverEvent(driverId, entry) {
  if (!DRIVER_LOGS[driverId]) DRIVER_LOGS[driverId] = [];
  DRIVER_LOGS[driverId].unshift(entry);
}

/* Seed demo history so the Drivers tab isn't empty on first load */
(function seedDriverLogs() {
  const seed = [
    { driverId: 1, tripNumber: 'MT-2026-4850', patientName: 'Helen Ortiz',     status: 'completed', miles: 14.2, pickup: '300 N Mills Ave, Orlando FL',        destination: 'AdventHealth Orlando, 601 E Rollins St',           scheduledAt: makeTime(8, 0),  loggedAt: daysAgo(6), notes: '' },
    { driverId: 1, tripNumber: 'MT-2026-4861', patientName: 'Walter Diaz',      status: 'completed', miles: 9.8,  pickup: '1500 Lee Rd, Winter Park FL',         destination: 'Winnie Palmer Hospital, Orlando FL',                scheduledAt: makeTime(13, 0), loggedAt: daysAgo(4), notes: '' },
    { driverId: 1, tripNumber: 'MT-2026-4872', patientName: 'Connie Sanchez',   status: 'abandoned', miles: 6.1,  pickup: '700 W Colonial Dr, Orlando FL',       destination: 'Orlando Health, 52 W Underwood St',                 scheduledAt: makeTime(15, 30), loggedAt: daysAgo(2), notes: 'Driver dejó de responder llamadas y mensajes ~35 min después de iniciar la ruta. GPS se detuvo en Colonial Dr y no volvió a actualizar. Se contactó al paciente, confirmó que el conductor nunca llegó.' },
    { driverId: 2, tripNumber: 'MT-2026-4855', patientName: 'Nathan Brooks',    status: 'completed', miles: 11.4, pickup: '2200 N Alafaya Trail, Orlando FL',     destination: 'AdventHealth East Orlando, FL',                     scheduledAt: makeTime(9, 0),  loggedAt: daysAgo(5), notes: '' },
    { driverId: 2, tripNumber: 'MT-2026-4868', patientName: 'Diane Foster',     status: 'cancelled', miles: 0,    pickup: '900 S Semoran Blvd, Orlando FL',       destination: 'Orlando Regional Medical Center, FL',               scheduledAt: makeTime(11, 30), loggedAt: daysAgo(3), notes: 'Paciente canceló antes de la hora de pickup.' },
    { driverId: 3, tripNumber: 'MT-2026-4849', patientName: 'James Wilson',     status: 'completed', miles: 8.6,  pickup: '456 Elm Rd, Sanford FL 32771',         destination: 'Central Florida Regional Hospital, Sanford FL',     scheduledAt: makeTime(6, 0),  loggedAt: daysAgo(1), notes: '' },
    { driverId: 3, tripNumber: 'MT-2026-4859', patientName: 'Barbara Lane',     status: 'completed', miles: 17.3, pickup: '4100 S Orange Blossom Trl, Orlando FL', destination: 'Osceola Regional Medical Center, Kissimmee FL',     scheduledAt: makeTime(10, 0), loggedAt: daysAgo(7), notes: '' },
    { driverId: 4, tripNumber: 'MT-2026-4863', patientName: 'Edward Price',     status: 'completed', miles: 5.9,  pickup: '650 W State Rd 436, Altamonte Springs FL', destination: 'AdventHealth Altamonte Springs, FL',             scheduledAt: makeTime(8, 45), loggedAt: daysAgo(4), notes: '' },
    { driverId: 4, tripNumber: 'MT-2026-4870', patientName: 'Rosa Mendoza',     status: 'abandoned', miles: 3.4,  pickup: '1100 Maitland Center Cmns, Maitland FL', destination: 'AdventHealth Orlando, 601 E Rollins St',           scheduledAt: makeTime(16, 0), loggedAt: daysAgo(1), notes: 'Conductor reportó que el paciente no estaba en la dirección de pickup y no respondió el teléfono. Se esperó 20 min en el lugar.' }
  ];
  seed.forEach(s => {
    logDriverEvent(s.driverId, {
      tripId: null, tripNumber: s.tripNumber, patientName: s.patientName,
      status: s.status, miles: s.miles, notes: s.notes, photo: null,
      pickup: s.pickup, destination: s.destination, scheduledAt: s.scheduledAt, loggedAt: s.loggedAt
    });
  });
})();

/* GET /api/dispatcher/proposed */
router.get('/proposed', requireDispatcher, (_req, res) => {
  res.json({ proposed: PROPOSED_TRIPS, drivers: DRIVERS });
});

/* POST /api/dispatcher/proposed/:id/accept */
router.post('/proposed/:id/accept', requireDispatcher, (req, res) => {
  const id  = Number(req.params.id);
  const idx = PROPOSED_TRIPS.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found.' });
  const { driverId } = req.body || {};
  const req_trip = PROPOSED_TRIPS.splice(idx, 1)[0];
  const driver   = driverId ? DRIVERS.find(d => d.id === Number(driverId)) || null : null;
  const newTrip  = {
    id:           DEMO_TRIPS.length + 100 + Math.floor(Math.random() * 100),
    number:       'MT-2026-' + nextTripNum++,
    patient_name: req_trip.patient_name,
    status:       driver ? 'confirmed' : 'pending',
    driver_id:    driver ? driver.id : null,
    pickup:       req_trip.pickup,
    destination:  req_trip.destination,
    pickup_coords: req_trip.pickup_coords || null,
    dest_coords:   req_trip.dest_coords   || null,
    scheduled_at:  req_trip.scheduled_at,
    notes:         req_trip.notes
  };
  DEMO_TRIPS.push(newTrip);
  res.json({ ok: true, trip: { ...newTrip, driver } });
});

/* POST /api/dispatcher/proposed/:id/reject */
router.post('/proposed/:id/reject', requireDispatcher, (_req, res) => {
  const id  = Number(_req.params.id);
  const idx = PROPOSED_TRIPS.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found.' });
  PROPOSED_TRIPS.splice(idx, 1);
  res.json({ ok: true });
});

/* POST /api/dispatcher/trips — create a new trip */
router.post('/trips', requireDispatcher, (req, res) => {
  const { patient_name, pickup, destination, scheduled_at, insurance, notes, driver_id } = req.body || {};
  if (!patient_name || !pickup || !destination || !scheduled_at)
    return res.status(400).json({ error: 'Missing required fields.' });
  const driver  = driver_id ? DRIVERS.find(d => d.id === Number(driver_id)) || null : null;
  const newTrip = {
    id:           DEMO_TRIPS.length + 200 + Math.floor(Math.random() * 100),
    number:       'MT-2026-' + nextTripNum++,
    patient_name,
    status:       driver ? 'confirmed' : 'pending',
    driver_id:    driver ? driver.id : null,
    pickup,
    destination,
    pickup_coords: null,
    dest_coords:   null,
    scheduled_at,
    notes: notes || ''
  };
  DEMO_TRIPS.push(newTrip);
  const counts = { total: DEMO_TRIPS.length, en_route: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  DEMO_TRIPS.forEach(t => { if (t.status in counts) counts[t.status]++; });
  res.json({ ok: true, trip: { ...newTrip, driver }, stats: counts });
});

/* GET /api/dispatcher/locations — real driver positions from Netlify Blobs */
router.get('/locations', requireDispatcher, async (_req, res) => {
  const store = getBlobs();
  if (!store) return res.json({ locations: [], _debug: 'store_null', _error: _blobsError });
  try {
    const { blobs } = await store.list();
    const locations = await Promise.all(
      blobs.map(function (b) { return store.get(b.key, { type: 'json' }); })
    );
    res.json({ locations: locations.filter(Boolean), _debug: 'ok_' + blobs.length });
  } catch (e) {
    res.json({ locations: [], _debug: 'error: ' + e.message });
  }
});

/* GET /api/dispatcher/trips */
router.get('/trips', requireDispatcher, (_req, res) => {
  const trips = DEMO_TRIPS.map(t => ({
    ...t,
    driver: t.driver_id ? DRIVERS.find(d => d.id === t.driver_id) || null : null,
    driver_position: DRIVER_POSITIONS[t.driver_id] || null
  }));
  res.json({ trips, drivers: DRIVERS });
});

/* GET /api/dispatcher/stats */
router.get('/stats', requireDispatcher, (_req, res) => {
  const counts = { total: DEMO_TRIPS.length, en_route: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, proposed: PROPOSED_TRIPS.length };
  DEMO_TRIPS.forEach(t => { if (t.status in counts) counts[t.status]++; });
  res.json(counts);
});

/* GET /api/dispatcher/incidents — all incident reports from Netlify Blobs */
router.get('/incidents', requireDispatcher, async (_req, res) => {
  const store = getIncidentBlobs();
  if (!store) return res.json({ incidents: [] });
  try {
    const { blobs } = await store.list();
    const incidents = await Promise.all(
      blobs.map(b => store.get(b.key, { type: 'json' }))
    );
    res.json({ incidents: incidents.filter(Boolean) });
  } catch (_) {
    res.json({ incidents: [] });
  }
});

/* GET /api/dispatcher/snapshot/:driverId — latest cabin snapshot from Netlify Blobs */
router.get('/snapshot/:driverId', requireDispatcher, async (req, res) => {
  const driverId = Number(req.params.driverId);
  if (!Number.isInteger(driverId) || driverId < 1)
    return res.status(400).json({ error: 'Invalid driverId.' });
  const store = getSnapshotBlobs();
  if (!store) return res.json({ snapshot: null });
  try {
    const snap = await store.get('snapshot-' + driverId, { type: 'json' });
    res.json({ snapshot: snap || null });
  } catch (_) {
    res.json({ snapshot: null });
  }
});

/* PATCH /api/dispatcher/trips/:id/status
   Persists the change on DEMO_TRIPS for the lifetime of the server process,
   and — when the trip reaches a terminal state — logs an entry to the
   assigned driver's history (DRIVER_LOGS), powering the Drivers tab. */
router.patch('/trips/:id/status', requireDispatcher, (req, res) => {
  const id   = Number(req.params.id);
  const trip = DEMO_TRIPS.find(t => t.id === id);
  if (!trip) return res.status(404).json({ error: 'Trip not found.' });

  const { status, driverId, notes, evidenceNotes, evidencePhoto, distanceMiles } = req.body || {};
  const valid = ['pending', 'confirmed', 'en_route', 'completed', 'cancelled', 'abandoned'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

  const prevStatus = trip.status;
  trip.status    = status;
  trip.driver_id = driverId ? Number(driverId) : null;
  trip.notes     = String(notes || '').slice(0, 1000);
  if (distanceMiles != null && isFinite(Number(distanceMiles))) trip.distance_miles = Number(distanceMiles);

  if (status === 'abandoned') {
    trip.abandoned_notes = String(evidenceNotes || '').slice(0, 1000);
    trip.abandoned_photo = (typeof evidencePhoto === 'string' && evidencePhoto.startsWith('data:image/')) ? evidencePhoto.slice(0, 400000) : null;
  }

  const TERMINAL = ['completed', 'cancelled', 'abandoned'];
  if (TERMINAL.includes(status) && status !== prevStatus && trip.driver_id) {
    logDriverEvent(trip.driver_id, {
      tripId: trip.id, tripNumber: trip.number, patientName: trip.patient_name,
      status, miles: trip.distance_miles != null ? trip.distance_miles : null,
      notes: status === 'abandoned' ? trip.abandoned_notes : trip.notes,
      photo: status === 'abandoned' ? trip.abandoned_photo : null,
      pickup: trip.pickup, destination: trip.destination,
      scheduledAt: trip.scheduled_at, loggedAt: new Date().toISOString()
    });
  }

  res.json({ ok: true, id: trip.id, status: trip.status, driverId: trip.driver_id, notes: trip.notes });
});

/* GET /api/dispatcher/drivers — list with summary history stats */
router.get('/drivers', requireDispatcher, (_req, res) => {
  const list = DRIVERS.map(d => {
    const logs = DRIVER_LOGS[d.id] || [];
    const totalMiles = logs.reduce((sum, l) => sum + (l.miles || 0), 0);
    return {
      ...d,
      totalTrips: logs.length,
      totalMiles: Math.round(totalMiles * 10) / 10,
      completed: logs.filter(l => l.status === 'completed').length,
      abandoned: logs.filter(l => l.status === 'abandoned').length,
      cancelled: logs.filter(l => l.status === 'cancelled').length
    };
  });
  res.json({ drivers: list });
});

/* GET /api/dispatcher/drivers/:id/history — full trip log + totals for one driver */
router.get('/drivers/:id/history', requireDispatcher, (req, res) => {
  const id     = Number(req.params.id);
  const driver = DRIVERS.find(d => d.id === id);
  if (!driver) return res.status(404).json({ error: 'Driver not found.' });
  const logs = (DRIVER_LOGS[id] || []).slice().sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));
  const totalMiles = logs.reduce((sum, l) => sum + (l.miles || 0), 0);
  res.json({ driver, history: logs, totalTrips: logs.length, totalMiles: Math.round(totalMiles * 10) / 10 });
});

/* GET /api/dispatcher/miles?fromLat=&fromLng=&toLat=&toLng=
   Calls OSRM server-side. Falls back to Haversine × 1.3 if OSRM is unreachable. */
router.get('/miles', dispatcherProxyLimiter, requireDispatcher, async (req, res) => {
  const nums = [req.query.fromLat, req.query.fromLng, req.query.toLat, req.query.toLng].map(Number);
  if (nums.some(n => !isFinite(n) || isNaN(n))) return res.status(400).json({ error: 'Invalid coordinates.' });
  const [fLat, fLng, tLat, tLng] = nums;
  if (Math.abs(fLat) > 90 || Math.abs(tLat) > 90 || Math.abs(fLng) > 180 || Math.abs(tLng) > 180)
    return res.status(400).json({ error: 'Coordinates out of range.' });
  try {
    const d = await _fetchJSON(
      `https://router.project-osrm.org/route/v1/driving/${fLng},${fLat};${tLng},${tLat}?overview=false`
    );
    if (d.routes && d.routes[0]) {
      return res.json({ miles: Math.round(d.routes[0].distance / 1609.344 * 10) / 10, method: 'road' });
    }
  } catch (_) {}
  /* Haversine fallback */
  const R = 3958.8, toRad = x => x * Math.PI / 180;
  const dLat = toRad(tLat - fLat), dLng = toRad(tLng - fLng);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(fLat)) * Math.cos(toRad(tLat)) * Math.sin(dLng/2)**2;
  const straight = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  res.json({ miles: Math.round(straight * 1.3 * 10) / 10, method: 'estimated' });
});

/* GET /api/dispatcher/geocode?address=
   Photon geocoding server-side (proper User-Agent, bbox Florida). */
router.get('/geocode', dispatcherProxyLimiter, requireDispatcher, async (req, res) => {
  const address = (req.query.address || '').trim();
  if (!address || address.length > 300) return res.status(400).json({ error: 'Invalid address.' });
  const q = address.includes(', FL') ? address : address + ', FL';
  try {
    const d = await _fetchJSON(
      'https://photon.komoot.io/api/?q=' + encodeURIComponent(q) + '&limit=1&lang=en&bbox=-87.6,24.5,-80.0,31.0'
    );
    if (d.features && d.features.length) {
      const [lng, lat] = d.features[0].geometry.coordinates;
      return res.json({ lat, lng });
    }
  } catch (_) {}
  res.json({ lat: null, lng: null });
});

/* ── Broker portal endpoints (no dispatcher auth — uses shared BROKER_KEY) ── */

/* POST /api/broker/verify — check access code without exposing it */
brokerRouter.post('/verify', brokerLimiter, (req, res) => {
  const { brokerKey } = req.body || {};
  if (!brokerKey || !_safeEqual(brokerKey, BROKER_KEY))
    return res.status(401).json({ ok: false, error: 'Invalid access code.' });
  res.json({ ok: true });
});

/* POST /api/broker/submit */
brokerRouter.post('/submit', brokerLimiter, (req, res) => {
  const { brokerKey, patientName, insurance, memberId, tripType,
          pickup, destination, tripDate, tripTime,
          notes, contactName, contactPhone } = req.body || {};

  if (!brokerKey || !_safeEqual(brokerKey, BROKER_KEY))
    return res.status(401).json({ error: 'Invalid access code. Please contact Mendez Transportation.' });

  if (!patientName || !insurance || !pickup || !destination || !tripDate || !tripTime)
    return res.status(400).json({ error: 'Missing required fields.' });

  /* Sanitize lengths */
  const clean = s => String(s || '').trim();
  const pName     = clean(patientName).slice(0, 100);
  const pIns      = clean(insurance).slice(0, 80);
  const pPickup   = clean(pickup).slice(0, 200);
  const pDest     = clean(destination).slice(0, 200);
  const pNotes    = clean(notes).slice(0, 500);
  const pMember   = clean(memberId).slice(0, 50);
  const pContact  = clean(contactName).slice(0, 100);
  const pPhone    = clean(contactPhone).slice(0, 20);
  const pType     = ['ambulatory','wheelchair','stretcher'].includes(tripType) ? tripType : 'ambulatory';

  let scheduledAt;
  try {
    const d = new Date(tripDate + 'T' + tripTime + ':00');
    if (isNaN(d.getTime())) throw new Error();
    scheduledAt = d.toISOString();
  } catch (_) {
    return res.status(400).json({ error: 'Invalid date or time.' });
  }

  const reqNum = 'MT-REQ-' + String(nextReqNum++).padStart(4, '0');

  PROPOSED_TRIPS.push({
    id:           300 + nextReqNum,
    number:       reqNum,
    patient_name: pName,
    pickup:       pPickup,
    destination:  pDest,
    pickup_coords: null,
    dest_coords:   null,
    scheduled_at:  scheduledAt,
    insurance:     pIns,
    trip_type:     pType,
    member_id:     pMember,
    notes:         pNotes,
    contact_name:  pContact,
    contact_phone: pPhone,
    submitted_at:  new Date().toISOString(),
    source:        'broker_portal'
  });

  console.log(`[BROKER] New trip request ${reqNum} — ${pName} (${pIns})`);
  res.json({ ok: true, requestNumber: reqNum });
});

/* POST /api/broker/batch — submit multiple trips at once (up to 50) */
brokerRouter.post('/batch', brokerLimiter, (req, res) => {
  const { brokerKey, trips } = req.body || {};

  if (!brokerKey || !_safeEqual(brokerKey, BROKER_KEY))
    return res.status(401).json({ error: 'Invalid access code. Please contact Mendez Transportation.' });

  if (!Array.isArray(trips) || !trips.length)
    return res.status(400).json({ error: 'No trips to submit.' });

  if (trips.length > 50)
    return res.status(400).json({ error: 'Maximum 50 trips per batch. Split into smaller batches.' });

  const clean  = s => String(s || '').trim();
  const results = [];

  for (const t of trips) {
    const { patientName, insurance, memberId, tripType,
            pickup, destination, tripDate, tripTime, notes, contactName, contactPhone } = t;

    if (!patientName || !insurance || !pickup || !destination || !tripDate || !tripTime) {
      results.push({ ok: false, error: 'Missing required fields', patientName: clean(patientName) });
      continue;
    }

    let scheduledAt;
    try {
      const d = new Date(tripDate + 'T' + tripTime + ':00');
      if (isNaN(d.getTime())) throw new Error();
      scheduledAt = d.toISOString();
    } catch (_) {
      results.push({ ok: false, error: 'Invalid date or time', patientName: clean(patientName) });
      continue;
    }

    const reqNum = 'MT-REQ-' + String(nextReqNum++).padStart(4, '0');

    PROPOSED_TRIPS.push({
      id:           300 + nextReqNum,
      number:       reqNum,
      patient_name: clean(patientName).slice(0, 100),
      pickup:       clean(pickup).slice(0, 200),
      destination:  clean(destination).slice(0, 200),
      pickup_coords: null,
      dest_coords:   null,
      scheduled_at:  scheduledAt,
      insurance:     clean(insurance).slice(0, 80),
      trip_type:     ['ambulatory','wheelchair','stretcher'].includes(tripType) ? tripType : 'ambulatory',
      member_id:     clean(memberId).slice(0, 50),
      notes:         clean(notes).slice(0, 500),
      contact_name:  clean(contactName).slice(0, 100),
      contact_phone: clean(contactPhone).slice(0, 20),
      submitted_at:  new Date().toISOString(),
      source:        'broker_portal'
    });

    results.push({ ok: true, requestNumber: reqNum, patientName: clean(patientName) });
  }

  const ok = results.filter(r => r.ok).length;
  console.log(`[BROKER BATCH] ${ok}/${trips.length} trips submitted`);
  res.json({ ok: true, submitted: ok, total: trips.length, results });
});

module.exports = { router, brokerRouter };
