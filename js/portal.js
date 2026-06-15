/* portal.js — Live driver tracking via SSE (API-backed) */

(function () {
  var PICKUP      = [28.5650, -81.3799];   /* AdventHealth Orlando, 601 E Rollins St */
  var DESTINATION = [28.3069, -81.4073];   /* Osceola Regional Medical Center, Kissimmee */

  /* Full route kept here for map rendering (polyline + bounds) */
  var ROUTE = [
    [28.5212, -81.4385],
    [28.5280, -81.4220],
    [28.5360, -81.4080],
    [28.5435, -81.3980],
    [28.5510, -81.3900],
    [28.5585, -81.3848],
    [28.5650, -81.3799]
  ];

  var map, driverMarker, routeLine;
  var etaMinutes = 8;

  document.addEventListener('DOMContentLoaded', function () {
    loadTripData();
    initMap();
    refreshEtaUI();   /* set initial color before SSE connects */
    startSSE();
  });

  /* ── Load trip data from API and populate DOM ── */
  function loadTripData() {
    fetch('/api/trip/current', { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) return;
        return r.json();
      })
      .then(function (data) {
        if (!data || !data.trip) return;
        var t = data.trip;

        /* Patient */
        var initials = t.patient_name.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase();
        setText('portalAvatar',      initials);
        setText('portalPatientName', t.patient_name);

        /* Trip banner */
        setText('tripNumberBanner', t.trip_number);

        var scheduled = new Date(t.scheduled_at);
        var today     = new Date();
        var isToday   = scheduled.toDateString() === today.toDateString();
        var dateLabel = isToday
          ? 'Today, ' + scheduled.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
          : scheduled.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        var timeLabel = scheduled.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        setText('bannerDate',        dateLabel);
        setText('bannerPickupTime',  timeLabel + ' Pickup');

        /* Extract city names for route label */
        var pickup  = t.pickup_address.split(',');
        var dest    = t.destination.split(',');
        var fromCity = (pickup[1] || pickup[0]).trim().replace(/FL.*/, '').trim();
        var toCity   = (dest[1]   || dest[0]).trim().replace(/FL.*/, '').trim();
        setText('bannerRoute', fromCity + ' → ' + toCity);

        /* Driver card */
        var driverInitials = t.driver_name.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase();
        setText('driverAvatar',  driverInitials);
        setText('driverName',    t.driver_name);
        setText('driverVehicle', t.driver_vehicle + ' · ' + t.driver_plate);
        setText('driverRating',  t.driver_rating.toFixed(1));
        setText('statusBarPlate', t.driver_plate);

        /* Route info */
        var pickupParts = t.pickup_address.split(',');
        setHtml('pickupAddress', pickupParts[0].trim() + '<br>' + pickupParts.slice(1).join(',').trim());

        var destParts = t.destination.split(',');
        setHtml('destinationAddress', destParts[0].trim() + '<br>' + destParts.slice(1).join(',').trim());
      })
      .catch(function () { /* keep fallback HTML values */ });
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }
  function setHtml(id, val) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = val;
  }

  /* ── Map init ── */
  function initMap() {
    map = L.map('trackingMap', {
      center: [28.545, -81.410],
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.attribution({ position: 'bottomleft', prefix: '' }).addTo(map);

    routeLine = L.polyline(ROUTE, {
      color: '#38bdf8',
      weight: 3,
      opacity: .65,
      dashArray: '8 6'
    }).addTo(map);

    L.marker(PICKUP, { icon: makePickupIcon() }).addTo(map)
      .bindPopup('<strong style="color:#1E2A6E">Your Pickup</strong><br>601 E Rollins St, Orlando');

    L.marker(DESTINATION, { icon: makeDestIcon() }).addTo(map)
      .bindPopup('<strong style="color:#1E2A6E">Destination</strong><br>Osceola Regional Medical Center');

    driverMarker = L.marker(ROUTE[0], { icon: makeCarIcon() }).addTo(map)
      .bindPopup('<strong style="color:#1E2A6E">Carlos Rivera</strong><br>2023 Toyota Sienna · FLA-4892');

    map.fitBounds(routeLine.getBounds(), { paddingTopLeft: [20, 20], paddingBottomRight: [20, 60] });
  }

  /* ── Polling tracking (Netlify Functions don't support SSE) ── */
  function startSSE() {
    var stopped = false;

    function poll() {
      if (stopped) return;
      fetch('/api/tracking/location', { credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d) return;
          if (driverMarker) driverMarker.setLatLng([d.lat, d.lng]);
          etaMinutes = d.eta;
          refreshEtaUI();
          updateProgressBar(d.step, d.total);
          if (d.step >= d.total) {
            stopped = true;
            onDriverArrived();
            return;
          }
          setTimeout(poll, 13000);
        })
        .catch(function () {
          if (!stopped) setTimeout(poll, 13000);
        });
    }

    setTimeout(poll, 1000); /* first poll after 1 s */
  }

  /* ── ETA UI ── */
  function refreshEtaUI() {
    var numEl    = document.getElementById('etaMinutes');
    var subEl    = document.getElementById('etaText');
    var card     = document.getElementById('etaCard');
    var chipLbl  = document.getElementById('etaChipLabel');

    if (numEl) numEl.textContent = etaMinutes;

    if (card) {
      card.classList.remove('eta-amber', 'eta-orange', 'eta-green');
      if (etaMinutes === 0)      card.classList.add('eta-green');
      else if (etaMinutes <= 4)  card.classList.add('eta-orange');
      else if (etaMinutes <= 8)  card.classList.add('eta-amber');
    }

    if (chipLbl) {
      if (etaMinutes === 0)      chipLbl.textContent = 'Arriving now';
      else if (etaMinutes <= 4)  chipLbl.textContent = 'Almost there';
      else if (etaMinutes <= 8)  chipLbl.textContent = 'Getting close';
      else                       chipLbl.textContent = 'On the way';
    }

    if (subEl) {
      if (etaMinutes === 0) {
        subEl.textContent = 'Your driver has arrived';
        subEl.style.color = '#4ade80';
      } else {
        var dist = (etaMinutes * 0.29).toFixed(1);
        subEl.textContent  = 'Driver is ' + dist + ' miles away';
        subEl.style.color  = '';
        var distEl = document.getElementById('driverDistance');
        if (distEl) distEl.textContent = dist + ' mi';
      }
    }
  }

  function updateProgressBar(step, total) {
    var pct = Math.round((step / total) * 100);
    var bar = document.getElementById('etaBar');
    if (bar) bar.style.width = pct + '%';
  }

  /* ── Arrival event ── */
  function onDriverArrived() {
    etaMinutes = 0;
    refreshEtaUI();
    updateProgressBar(1, 1);

    var pill = document.getElementById('statusPill');
    if (pill) { pill.textContent = '● Driver Arrived'; pill.classList.add('arrived'); }

    var step4   = document.getElementById('step4');
    var step3el = document.getElementById('step3');
    if (step4) step4.classList.add('active');
    if (step3el) { step3el.classList.remove('active'); step3el.classList.add('done'); }

    if (driverMarker) { driverMarker.setIcon(makeCarIconGreen()); driverMarker.openPopup(); }
  }

  /* ── Leaflet custom icons ── */
  function makePickupIcon() {
    return L.divIcon({
      html: '<div class="map-pickup-pin"><div class="map-pickup-circle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></div></div>',
      className: '', iconSize: [38, 48], iconAnchor: [19, 48], popupAnchor: [0, -50]
    });
  }

  function makeDestIcon() {
    return L.divIcon({
      html: '<div style="width:32px;height:32px;border-radius:50%;background:#22c55e;border:2.5px solid #4ade80;box-shadow:0 0 12px rgba(74,222,128,.45);display:flex;align-items:center;justify-content:center;color:white"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></div>',
      className: '', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -34]
    });
  }

  function makeCarIcon() {
    return L.divIcon({
      html: '<div class="map-car-wrap"><div class="map-car-ping"></div><div class="map-car-ping2"></div><div class="map-car-icon"><svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg></div></div>',
      className: '', iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -24]
    });
  }

  function makeCarIconGreen() {
    return L.divIcon({
      html: '<div style="width:40px;height:40px;border-radius:50%;background:#166534;border:2.5px solid #4ade80;box-shadow:0 0 16px rgba(74,222,128,.5);display:flex;align-items:center;justify-content:center;color:white"><svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg></div>',
      className: '', iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -24]
    });
  }
})();
