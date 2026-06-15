const router = require('express').Router();
const { requireDispatcher } = require('../middleware/auth');

function getBlobs() {
  try { return require('@netlify/blobs').getStore('driver-locations'); }
  catch (_) { return null; }
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

/* GET /api/dispatcher/locations — real driver positions from Netlify Blobs */
router.get('/locations', requireDispatcher, async (_req, res) => {
  const store = getBlobs();
  if (!store) return res.json({ locations: [] });
  try {
    const { blobs } = await store.list();
    const locations = await Promise.all(
      blobs.map(function (b) { return store.get(b.key, { type: 'json' }); })
    );
    res.json({ locations: locations.filter(Boolean) });
  } catch (e) {
    res.json({ locations: [] });
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
  const counts = { total: DEMO_TRIPS.length, en_route: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
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
   Demo-only: acknowledges the update — no persistence in stateless env.
   The frontend maintains the updated state in memory for the session. */
router.patch('/trips/:id/status', requireDispatcher, (req, res) => {
  const { status, driverId, notes } = req.body || {};
  const valid = ['pending', 'confirmed', 'en_route', 'completed', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  res.json({ ok: true, id: Number(req.params.id), status, driverId: driverId || null, notes: notes || '' });
});

module.exports = router;
