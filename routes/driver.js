const router = require('express').Router();
const { requireDriver } = require('../middleware/auth');

function makeTime(h, m) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

/* Carlos Rivera's demo schedule — 3 trips */
const DRIVER_INFO = {
  id: 1, name: 'Carlos Rivera',
  vehicle: '2023 Toyota Sienna', plate: 'FLA-4892', rating: 4.9
};

const DEMO_TRIPS = [
  {
    id: 1, number: 'MT-2026-4891',
    patient_name: 'Maria Garcia', patient_phone: '(407) 555-0191',
    status: 'en_route',
    pickup: '601 E Rollins St, Orlando FL 32803',
    destination: 'Osceola Regional Medical Center, Kissimmee FL 34741',
    scheduled_at: makeTime(8, 30), notes: 'Patient uses wheelchair — needs ramp.'
  },
  {
    id: 7, number: 'MT-2026-4897',
    patient_name: 'Susan Williams', patient_phone: '(407) 555-0247',
    status: 'confirmed',
    pickup: '4500 S Orange Ave, Orlando FL 32806',
    destination: 'Florida Hospital Orlando, Orlando FL 32803',
    scheduled_at: makeTime(11, 0), notes: ''
  },
  {
    id: 8, number: 'MT-2026-4898',
    patient_name: 'Thomas Baker', patient_phone: '(407) 555-0318',
    status: 'confirmed',
    pickup: '220 Palm Dr, Kissimmee FL 34743',
    destination: 'AdventHealth Kissimmee, 2450 N Orange Blossom Trail FL',
    scheduled_at: makeTime(15, 0), notes: 'Patient may need extra time boarding.'
  },
];

/* GET /api/driver/trips */
router.get('/trips', requireDriver, (_req, res) => {
  res.json({ driver: DRIVER_INFO, trips: DEMO_TRIPS });
});

/* PATCH /api/driver/trips/:id/status
   Demo-only: ack the update, frontend keeps local state. */
router.patch('/trips/:id/status', requireDriver, (req, res) => {
  const { status } = req.body || {};
  const valid = ['en_route', 'completed'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  res.json({ ok: true, id: Number(req.params.id), status });
});

module.exports = router;
