/* driver.js — Driver PWA logic */
(function () {

  var trips         = [];
  var driver        = null;
  var installPrompt = null;
  var watchId       = null;
  var locationSendInterval = null;
  var lastPosition  = null;

  /* ── Register service worker ── */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  }

  /* ── PWA install prompt ── */
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    installPrompt = e;
    document.getElementById('installBar').style.display = 'flex';
  });

  window.acceptInstall = function () {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then(function () {
      installPrompt = null;
      document.getElementById('installBar').style.display = 'none';
    });
  };
  window.dismissInstall = function () {
    document.getElementById('installBar').style.display = 'none';
  };

  /* ── Geolocation ── */
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function openMapsApp(address, forNavigation) {
    var encoded = encodeURIComponent(address);
    if (forNavigation) {
      /* Navigation: Apple Maps on iOS, Google Maps on Android */
      if (isIOS()) {
        window.location.href = 'maps://?daddr=' + encoded;
      } else {
        window.open('https://maps.google.com/?daddr=' + encoded, '_blank');
      }
    } else {
      /* Just view location */
      if (isIOS()) {
        window.location.href = 'maps://?q=' + encoded;
      } else {
        window.open('https://maps.google.com/?q=' + encoded, '_blank');
      }
    }
  }
  window.openMapsApp = openMapsApp;

  function openWaze(address) {
    window.open('https://waze.com/ul?q=' + encodeURIComponent(address) + '&navigate=yes', '_blank');
  }
  window.openWaze = openWaze;

  function setLocationStatus(state, msg) {
    var bar = document.getElementById('locationBar');
    var txt = document.getElementById('locationText');
    if (!bar || !txt) return;
    bar.className = 'dr-location-bar ' + state;
    txt.textContent = msg;
    bar.style.display = 'flex';
  }

  function startLocationTracking() {
    if (!('geolocation' in navigator)) {
      setLocationStatus('denied', 'Location not available on this device');
      return;
    }

    setLocationStatus('requesting', 'Requesting location permission…');

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        lastPosition = pos.coords;
        setLocationStatus('active', '● Location active — sharing with dispatch');
        sendLocation(pos.coords);

        /* Watch continuously */
        watchId = navigator.geolocation.watchPosition(
          function (p) {
            lastPosition = p.coords;
            setLocationStatus('active', '● Location active — sharing with dispatch');
          },
          function () { setLocationStatus('warn', '⚠ Location signal lost'); },
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
        );

        /* Send position every 15 seconds */
        locationSendInterval = setInterval(function () {
          if (lastPosition) sendLocation(lastPosition);
        }, 15000);
      },
      function (err) {
        var msg = err.code === 1
          ? 'Location denied — tap to enable in browser settings'
          : 'Unable to get location';
        setLocationStatus('denied', '✕ ' + msg);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  /* Allow dispatcher to tap the banner to retry */
  window.retryLocation = function () {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    clearInterval(locationSendInterval);
    startLocationTracking();
  };

  function sendLocation(coords) {
    fetch('/api/driver/location', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy }),
      credentials: 'same-origin'
    }).catch(function () {});
  }

  /* ── Auth check + boot ── */
  fetch('/api/auth/me', { credentials: 'same-origin' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || d.role !== 'driver') { window.location.href = 'login.html'; return; }
      loadTrips();
      startLocationTracking();
    });

  function loadTrips() {
    fetch('/api/driver/trips', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        driver = data.driver;
        trips  = data.trips;
        render();
      })
      .catch(function () { window.location.href = 'login.html'; });
  }

  /* ── Render ── */
  function render() {
    /* Header */
    var initials = driver.name.split(' ').map(function (n) { return n[0]; }).join('');
    document.getElementById('driverAvatar').textContent = initials;
    document.getElementById('driverName').textContent   = driver.name;
    document.getElementById('driverMeta').textContent   = driver.vehicle + ' · ' + driver.plate;

    /* Date bar */
    var now = new Date();
    document.getElementById('dateLabel').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    var remaining = trips.filter(function (t) { return t.status !== 'completed'; }).length;
    document.getElementById('tripCount').textContent = remaining + ' trip' + (remaining !== 1 ? 's' : '') + ' remaining';

    /* Trip list */
    var container = document.getElementById('tripList');
    container.innerHTML = '';

    var active    = trips.filter(function (t) { return t.status === 'en_route'; });
    var upcoming  = trips.filter(function (t) { return t.status === 'confirmed'; });
    var done      = trips.filter(function (t) { return t.status === 'completed'; });

    if (active.length)   active.forEach(function (t)   { container.appendChild(buildCard(t)); });
    if (upcoming.length) upcoming.forEach(function (t)  { container.appendChild(buildCard(t)); });
    if (done.length) {
      var label = document.createElement('div');
      label.className = 'dr-section-label';
      label.textContent = 'Completed';
      container.appendChild(label);
      done.forEach(function (t) { container.appendChild(buildCard(t)); });
    }

    if (active.length === 0 && upcoming.length === 0 && done.length > 0) {
      var banner = document.createElement('div');
      banner.className = 'dr-done-banner';
      banner.innerHTML = [
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        '<h3>All done for today!</h3>',
        '<p>Great work, ' + driver.name.split(' ')[0] + '. All trips completed.</p>'
      ].join('');
      container.appendChild(banner);
    }

    document.getElementById('loading').style.display = 'none';
    container.style.display = 'flex';
  }

  function buildCard(trip) {
    var card = document.createElement('div');
    card.className = 'dr-card' + (trip.status === 'en_route' ? ' active' : '') + (trip.status === 'completed' ? ' completed' : '');

    var dest = JSON.stringify(trip.destination);
    var pick = JSON.stringify(trip.pickup);

    var mapsSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>';
    var mazeSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/></svg>';

    var actionButtons = '';
    if (trip.status === 'en_route') {
      actionButtons = [
        '<button class="dr-btn dr-btn-map" onclick="openMapsApp(' + dest + ',true)">',
        '  ' + mapsSvg + ' Navigate',
        '</button>',
        '<button class="dr-btn dr-btn-waze" onclick="openWaze(' + dest + ')">',
        '  ' + mazeSvg + ' Waze',
        '</button>',
        '<button class="dr-btn dr-btn-status" onclick="updateStatus(' + trip.id + ',\'completed\',this)">',
        '  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Complete',
        '</button>'
      ].join('');
    } else if (trip.status === 'confirmed') {
      actionButtons = [
        '<button class="dr-btn dr-btn-map" onclick="openMapsApp(' + pick + ',true)">',
        '  ' + mapsSvg + ' Navigate',
        '</button>',
        '<button class="dr-btn dr-btn-waze" onclick="openWaze(' + pick + ')">',
        '  ' + mazeSvg + ' Waze',
        '</button>',
        '<button class="dr-btn dr-btn-status start" onclick="updateStatus(' + trip.id + ',\'en_route\',this)">',
        '  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start',
        '</button>'
      ].join('');
    }

    var notesHtml = trip.notes ? [
      '<div class="dr-notes">',
      '  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
      '  ' + escHtml(trip.notes),
      '</div>'
    ].join('') : '';

    card.innerHTML = [
      '<div class="dr-card-header">',
      '  <div class="dr-card-left">',
      '    <div class="dr-status-dot ' + trip.status + '"></div>',
      '    <span class="dr-status-label ' + trip.status + '">' + statusLabel(trip.status) + '</span>',
      '    <span class="dr-trip-num">' + trip.number + '</span>',
      '  </div>',
      '  <span class="dr-trip-time">' + formatTime(trip.scheduled_at) + '</span>',
      '</div>',
      '<div class="dr-card-body">',
      '  <div class="dr-patient">' + escHtml(trip.patient_name) + '</div>',
      '  <div class="dr-patient-phone">' + escHtml(trip.patient_phone) + '</div>',
      '  <div class="dr-route">',
      '    <div class="dr-route-row">',
      '      <div class="dr-route-icon dr-route-pickup"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg></div>',
      '      <span class="dr-route-addr">' + escHtml(trip.pickup) + '</span>',
      '    </div>',
      '    <div class="dr-route-row"><div class="dr-route-line"></div></div>',
      '    <div class="dr-route-row">',
      '      <div class="dr-route-icon dr-route-dest"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>',
      '      <span class="dr-route-addr">' + escHtml(trip.destination) + '</span>',
      '    </div>',
      '  </div>',
      notesHtml,
      trip.status !== 'completed' ? '<div class="dr-actions">' + actionButtons + '</div>' : '',
      '</div>'
    ].join('');

    return card;
  }

  /* ── Status update ── */
  window.updateStatus = function (id, newStatus, btn) {
    btn.classList.add('loading');
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>';

    fetch('/api/driver/trips/' + id + '/status', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: newStatus }),
      credentials: 'same-origin'
    })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (!res.ok) { btn.classList.remove('loading'); return; }
      var trip = trips.find(function (t) { return t.id === id; });
      if (trip) trip.status = newStatus;
      render();
    })
    .catch(function () { btn.classList.remove('loading'); });
  };

  /* ── Logout ── */
  window.driverLogout = function () {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    clearInterval(locationSendInterval);
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).finally(function () {
      window.location.href = 'login.html';
    });
  };

  /* ── Helpers ── */
  function statusLabel(s) {
    return { en_route: 'En Route', confirmed: 'Upcoming', completed: 'Completed' }[s] || s;
  }
  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

})();
