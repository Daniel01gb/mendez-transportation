const router = require('express').Router();
const { requireSession } = require('../middleware/auth');

/* Simulated 7-waypoint route (SW Orlando → AdventHealth pickup) */
const ROUTE = [
  [28.5212, -81.4385],
  [28.5280, -81.4220],
  [28.5360, -81.4080],
  [28.5435, -81.3980],
  [28.5510, -81.3900],
  [28.5585, -81.3848],
  [28.5650, -81.3799]
];
const TOTAL     = ROUTE.length - 1;   /* 6 moves */
const ETA_START = 8;
const STEP_MS   = 13000;              /* 13 s per step */

/* Demo trip data — pure constants, no database */
function tripData() {
  const pickup = new Date();
  pickup.setHours(8, 30, 0, 0);
  return {
    id:             1,
    trip_number:    process.env.DEMO_TRIP || 'MT-2026-4891',
    ssn4:           process.env.DEMO_SSN4 || '4891',
    patient_name:   'Maria Garcia',
    pickup_address: '601 E Rollins St, Orlando FL 32803',
    destination:    'Osceola Regional Medical Center, Kissimmee FL 34741',
    scheduled_at:   pickup.toISOString(),
    driver_name:    'Carlos Rivera',
    driver_vehicle: '2023 Toyota Sienna',
    driver_plate:   'FLA-4892',
    driver_rating:  4.9,
    status:         'en_route',
    user_id:        1
  };
}

/* ── GET /api/trip/current ── */
router.get('/trip/current', requireSession, (_req, res) => {
  res.json({ trip: tripData() });
});

/* ── GET /api/tracking/location ─────────────────────────────
   Polling endpoint (replaces SSE — Netlify Functions don't
   support long-lived streaming connections).
   Position is calculated from time elapsed since the JWT was
   issued, so each call returns the correct "live" position
   without any server-side state. */
router.get('/tracking/location', requireSession, (req, res) => {
  const issuedAt = (req.user.iat || 0) * 1000;
  const elapsed  = Math.max(0, Date.now() - issuedAt);
  const step     = Math.min(Math.floor(elapsed / STEP_MS), TOTAL);
  const [lat, lng] = ROUTE[step];
  const eta      = Math.round(ETA_START * (1 - step / TOTAL));
  res.json({ lat, lng, eta, step, total: TOTAL });
});

module.exports = router;
