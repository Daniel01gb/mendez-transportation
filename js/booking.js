/* ── BOOKING MULTI-STEP FORM ── */
let bookingStep    = 1;
let selectedVehicle = '';
let transferType    = 'One Way';
let passengers      = 1;

function setStep(n, back = false) {
  const fromEl = document.getElementById('panel-' + bookingStep);
  const toEl   = document.getElementById('panel-' + n);

  // Animate out current
  if (fromEl && fromEl.classList.contains('active')) {
    fromEl.classList.add(back ? 'exiting-back' : 'exiting-fwd');
    fromEl.classList.remove('active');
    setTimeout(() => fromEl.classList.remove('exiting-fwd', 'exiting-back'), 300);
  }

  // Animate in next
  bookingStep = n;
  toEl.classList.add('active', back ? 'entering-back' : 'entering-fwd');
  setTimeout(() => toEl.classList.remove('entering-fwd', 'entering-back'), 420);

  // Update stepper indicators
  document.querySelectorAll('.booking-stepper .stepper-step').forEach((step, idx) => {
    const i = idx + 1;
    step.classList.remove('active', 'done');
    if (i === n) step.classList.add('active');
    if (i < n)   step.classList.add('done');
  });
  document.querySelectorAll('.booking-stepper .stepper-connector').forEach((conn, idx) => {
    conn.classList.toggle('done', idx < n - 1);
  });
}

function nextStep(from) {
  if (from === 1) {
    const p  = document.getElementById('pickup').value.trim();
    const d  = document.getElementById('dropoff').value.trim();
    const dt = document.getElementById('rideDate').value;
    if (!p || !d || !dt) {
      shakeField(!p ? 'pickup' : !d ? 'dropoff' : 'rideDate');
      return;
    }
  }
  if (from === 2 && !selectedVehicle) {
    const vg = document.querySelector('.vehicle-grid');
    vg.style.animation = 'none';
    vg.style.outline = '2px solid var(--navy)';
    vg.style.borderRadius = 'var(--radius-md)';
    setTimeout(() => { vg.style.outline = ''; }, 1200);
    return;
  }
  if (from === 3) {
    const fn = document.getElementById('fname').value.trim();
    const ph = document.getElementById('phone').value.trim();
    if (!fn || !ph) {
      shakeField(!fn ? 'fname' : 'phone');
      return;
    }
    populateSummary();
  }
  setStep(from + 1);
}
// Make nextStep globally accessible (used in HTML onclick attributes)
window.nextStep = nextStep;

function prevStep(from) { setStep(from - 1, true); }
window.prevStep = prevStep;

function shakeField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = '#e53e3e';
  el.style.animation = 'shake .4s';
  el.focus();
  setTimeout(() => { el.style.borderColor = ''; el.style.animation = ''; }, 1400);
}

function selectVehicle(card) {
  document.querySelectorAll('.vehicle-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  selectedVehicle = card.dataset.vehicle;
}
window.selectVehicle = selectVehicle;

// Transfer type pills
document.querySelectorAll('.pill-option').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.pill-option').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    transferType = pill.dataset.val;
  });
});

// Passenger stepper
document.getElementById('passMinus').addEventListener('click', () => {
  if (passengers > 1) { passengers--; document.getElementById('passVal').textContent = passengers; }
});
document.getElementById('passPlus').addEventListener('click', () => {
  if (passengers < 8) { passengers++; document.getElementById('passVal').textContent = passengers; }
});

function populateSummary() {
  const fmt = v => v || '—';
  const dateVal = document.getElementById('rideDate').value;
  const timeVal = document.getElementById('rideTime').value;
  let dateStr = '—';
  if (dateVal) {
    const d = new Date(dateVal + 'T00:00');
    dateStr = d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
    if (timeVal) dateStr += ' at ' + timeVal;
  }
  document.getElementById('sum-pickup').textContent     = fmt(document.getElementById('pickup').value.trim());
  document.getElementById('sum-dropoff').textContent    = fmt(document.getElementById('dropoff').value.trim());
  document.getElementById('sum-datetime').textContent   = dateStr;
  document.getElementById('sum-transfer').textContent   = transferType;
  document.getElementById('sum-passengers').textContent = passengers + (passengers === 1 ? ' passenger' : ' passengers');
  document.getElementById('sum-vehicle').textContent    = selectedVehicle || '—';
  const fn = document.getElementById('fname').value.trim();
  const ln = document.getElementById('lname').value.trim();
  document.getElementById('sum-name').textContent    = [fn, ln].filter(Boolean).join(' ') || '—';
  document.getElementById('sum-phone').textContent   = fmt(document.getElementById('phone').value.trim());
  document.getElementById('sum-email').textContent   = fmt(document.getElementById('email').value.trim());
  const notes = document.getElementById('notes').value.trim();
  document.getElementById('sum-notes').textContent   = notes || 'None';
}

function confirmBooking() {
  const p4 = document.getElementById('panel-4');
  p4.classList.add('exiting-fwd');
  p4.classList.remove('active');
  setTimeout(() => {
    p4.classList.remove('exiting-fwd');
    const s = document.getElementById('bookingSuccess');
    s.style.display = 'block';
    s.classList.add('show');
    document.querySelector('.booking-stepper').style.display = 'none';
  }, 300);
}
window.confirmBooking = confirmBooking;

/*
 * ── BOOKING MAP — MVP: OpenStreetMap + Nominatim (free, no API key) ──
 *
 * PRODUCTION UPGRADE (when MVP is approved):
 *   Replace with Google Maps JavaScript API:
 *   - google.maps.places.Autocomplete  → real-time address suggestions while typing
 *   - google.maps.DirectionsService    → actual route with turn-by-turn distance & ETA
 *   - google.maps.Map                  → full Google Maps experience
 *   Requires: Google Maps API key with Places + Directions + Maps JS enabled.
 */
let bMap = null, pickupMarker = null, dropoffMarker = null;
let pickupCoords = null, dropoffCoords = null;
let routeLine = null, geoTimer = null;

const mkIcon = color => L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:${color};border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.35);"></div>`,
  iconSize: [14,14], iconAnchor: [7,7]
});

function initBookingMap() {
  if (bMap) { bMap.invalidateSize(); return; }
  bMap = L.map('bookingMapFull', { zoomControl: true, scrollWheelZoom: false, attributionControl: false })
           .setView([28.29, -81.4], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(bMap);
  L.control.attribution({ prefix: '© <a href="https://openstreetmap.org">OSM</a>' }).addTo(bMap);
  document.getElementById('mapPlaceholder').classList.add('hidden');
}

// Auto-init map when booking section scrolls into view
new IntersectionObserver((entries, obs) => {
  if (entries[0].isIntersecting) { initBookingMap(); obs.disconnect(); }
}, { threshold: 0.15 }).observe(document.getElementById('booking'));

function geocode(address, isPickup) {
  if (!bMap) initBookingMap();

  fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(address + ' Florida')}`)
    .then(r => r.json())
    .then(data => {
      if (!data.length) return;
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      const latlng = [lat, lon];
      const label = data[0].display_name.split(',').slice(0,2).join(',').trim();

      if (isPickup) {
        if (pickupMarker) bMap.removeLayer(pickupMarker);
        pickupMarker = L.marker(latlng, { icon: mkIcon('#1E2A6E') }).bindPopup('<b>Pickup</b><br>' + label).addTo(bMap);
        pickupCoords = latlng;
        document.getElementById('mapRoutePickup').textContent = label;
      } else {
        if (dropoffMarker) bMap.removeLayer(dropoffMarker);
        dropoffMarker = L.marker(latlng, { icon: mkIcon('#e53e3e') }).bindPopup('<b>Drop-off</b><br>' + label).addTo(bMap);
        dropoffCoords = latlng;
        document.getElementById('mapRouteDropoff').textContent = label;
      }

      // Show route card as soon as pickup is placed
      if (pickupCoords) document.getElementById('mapRouteCard').style.display = 'block';

      if (routeLine) bMap.removeLayer(routeLine);
      if (pickupCoords && dropoffCoords) {
        routeLine = L.polyline([pickupCoords, dropoffCoords], {
          color: '#4A6FA5', weight: 2.5, dashArray: '7 6', opacity: .75
        }).addTo(bMap);
        bMap.fitBounds([pickupCoords, dropoffCoords], { padding: [50, 50] });
      } else {
        bMap.setView(latlng, 13);
      }
      setTimeout(() => bMap.invalidateSize(), 150);
    })
    .catch(() => {});
}

function debounceGeo(el, isPickup) {
  clearTimeout(geoTimer);
  geoTimer = setTimeout(() => {
    const v = el.value.trim();
    if (v.length >= 6) geocode(v, isPickup);
  }, 850);
}

document.getElementById('pickup').addEventListener('input',  function() { debounceGeo(this, true);  });
document.getElementById('dropoff').addEventListener('input', function() { debounceGeo(this, false); });
