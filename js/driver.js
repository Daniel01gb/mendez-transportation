/* driver.js — Driver PWA logic */
(function () {

  var trips         = [];
  var driver        = null;
  var installPrompt = null;
  var incidentTripId     = null;
  var incidentTripNumber = null;
  var incidentPatient    = null;
  var incidentType       = null;
  var incidentPhotoUrl   = null;
  var watchId       = null;
  var locationSendInterval = null;
  var lastPosition  = null;
  var cabinStream   = null;
  var cabinSnapshotInterval = null;
  var cabinActive   = false;
  var peer          = null;
  var peerCalls     = [];
  var currentPeerId = null;
  var facingMode    = 'user'; /* 'user' = front (cabin), 'environment' = rear (road) */
  var micMuted      = false;
  /* iOS standalone (home screen PWA) blocks getUserMedia — detect early */
  var iosStandalone = /iPad|iPhone|iPod/.test(navigator.userAgent) && !!window.navigator.standalone;

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

        /* Send position every 5 seconds */
        locationSendInterval = setInterval(function () {
          if (lastPosition) sendLocation(lastPosition);
        }, 5000);
      },
      function (err) {
        var msg;
        if (err.code === 1 && iosStandalone) {
          msg = 'Allow location: Settings → Privacy → Location Services → Safari Websites';
        } else if (err.code === 1) {
          msg = 'Location denied — tap to enable in browser settings';
        } else {
          msg = 'Unable to get location';
        }
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

  /* ── iOS standalone notice ── */
  function showIOSNotice() {
    document.getElementById('iosNotice').style.display = 'flex';
  }
  window.openInSafari = function () {
    window.open(window.location.href, '_blank', 'noopener');
  };
  window.dismissIOSNotice = function () {
    document.getElementById('iosNotice').style.display = 'none';
  };

  /* ── Cabin camera ── */
  function setCameraStatus(state, msg) {
    var bar = document.getElementById('cameraBar');
    var txt = document.getElementById('cameraText');
    if (!bar || !txt) return;
    bar.className = 'dr-camera-bar ' + state;
    txt.textContent = msg;
  }

  window.toggleCabinCamera = function () {
    if (iosStandalone) { showIOSNotice(); return; }
    if (cabinActive) { stopCabinCamera(); } else { startCabinCamera(); }
  };

  function startCabinCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('unavail', 'Camera not available on this device');
      return;
    }
    setCameraStatus('requesting', 'Starting cabin camera…');
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
      audio: true
    }).then(function (stream) {
      cabinStream = stream;
      cabinActive = true;
      micMuted = false;
      var video = document.getElementById('cabinVideo');
      video.srcObject = stream;
      video.style.display = 'block';
      var label = facingMode === 'user' ? 'front (cabin)' : 'rear (road)';
      setCameraStatus('active', '● Live — ' + label + ' — dispatcher can connect');
      document.getElementById('cameraToggle').textContent = 'Disable';
      document.getElementById('cameraFlip').style.display = 'flex';
      if (stream.getAudioTracks().length > 0) {
        document.getElementById('cameraMic').style.display = 'flex';
        updateMicBtn();
      }
      startPeerStreaming(stream);
      setTimeout(captureAndSendSnapshot, 2000);
      cabinSnapshotInterval = setInterval(captureAndSendSnapshot, 60000);
    }).catch(function (err) {
      var msg = (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
        ? 'Camera/mic permission denied — tap to retry'
        : 'Unable to start camera';
      setCameraStatus('denied', '✕ ' + msg);
    });
  }

  function stopCabinCamera() {
    stopPeerStreaming();
    if (cabinStream) {
      cabinStream.getTracks().forEach(function (t) { t.stop(); });
      cabinStream = null;
    }
    clearInterval(cabinSnapshotInterval);
    cabinSnapshotInterval = null;
    cabinActive = false;
    var video = document.getElementById('cabinVideo');
    if (video) { video.srcObject = null; video.style.display = 'none'; }
    setCameraStatus('off', 'Cabin camera off');
    var toggle = document.getElementById('cameraToggle');
    if (toggle) toggle.textContent = 'Enable';
    document.getElementById('cameraFlip').style.display = 'none';
    document.getElementById('cameraMic').style.display  = 'none';
  }

  window.toggleMic = function () {
    if (!cabinStream) return;
    micMuted = !micMuted;
    cabinStream.getAudioTracks().forEach(function (t) { t.enabled = !micMuted; });
    updateMicBtn();
  };

  function updateMicBtn() {
    var btn = document.getElementById('cameraMic');
    if (!btn) return;
    btn.title = micMuted ? 'Unmute mic' : 'Mute mic';
    btn.classList.toggle('muted', micMuted);
    btn.querySelector('.mic-on').style.display  = micMuted ? 'none' : 'block';
    btn.querySelector('.mic-off').style.display = micMuted ? 'block' : 'none';
  }

  /* Flip between front (cabin) and rear (road) camera */
  window.flipCamera = function () {
    if (!cabinActive) return;
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    var label = facingMode === 'user' ? 'front (cabin)' : 'rear (road)';
    setCameraStatus('requesting', 'Switching to ' + label + ' camera…');

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    }).then(function (stream) {
      /* Stop old video tracks only — keep existing audio track alive */
      var existingAudio = cabinStream ? cabinStream.getAudioTracks() : [];
      if (cabinStream) cabinStream.getVideoTracks().forEach(function (t) { t.stop(); });

      /* Build combined stream: new video + existing audio */
      var newVideoTrack = stream.getVideoTracks()[0];
      var combined = new MediaStream();
      combined.addTrack(newVideoTrack);
      existingAudio.forEach(function (t) { combined.addTrack(t); });
      cabinStream = combined;

      /* Update preview */
      var video = document.getElementById('cabinVideo');
      video.srcObject = combined;

      /* Replace video track in all live WebRTC calls — no reconnect needed */
      peerCalls.forEach(function (call) {
        var pc = call.peerConnection;
        if (!pc) return;
        var sender = pc.getSenders().find(function (s) { return s.track && s.track.kind === 'video'; });
        if (sender) sender.replaceTrack(newVideoTrack).catch(function () {});
      });

      setCameraStatus('active', '● Live — ' + label + ' — dispatcher can connect');
    }).catch(function () {
      /* Revert facingMode on failure */
      facingMode = facingMode === 'user' ? 'environment' : 'user';
      var prevLabel = facingMode === 'user' ? 'front (cabin)' : 'rear (road)';
      setCameraStatus('active', '● Live — ' + prevLabel + ' — dispatcher can connect');
    });
  };

  /* ── WebRTC peer streaming (dispatcher connects here) ── */
  function startPeerStreaming(stream) {
    if (typeof Peer === 'undefined') return;
    currentPeerId = 'mz-drv-' + Math.random().toString(36).substr(2, 9);
    peer = new Peer(currentPeerId, {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });
    peer.on('open', function (id) { currentPeerId = id; });
    peer.on('call', function (call) {
      call.answer(stream);
      peerCalls.push(call);
      call.on('close', function () {
        peerCalls = peerCalls.filter(function (c) { return c !== call; });
      });
    });
    peer.on('error', function () {});
  }

  function stopPeerStreaming() {
    peerCalls.forEach(function (c) { try { c.close(); } catch (_) {} });
    peerCalls = [];
    if (peer) { try { peer.destroy(); } catch (_) {} peer = null; }
    currentPeerId = null;
  }

  function captureAndSendSnapshot() {
    var video = document.getElementById('cabinVideo');
    if (!video || !cabinActive || video.readyState < 2) return;
    var canvas = document.createElement('canvas');
    canvas.width = 320; canvas.height = 240;
    canvas.getContext('2d').drawImage(video, 0, 0, 320, 240);
    var dataUrl = canvas.toDataURL('image/jpeg', 0.65);
    fetch('/api/driver/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl: dataUrl }),
      credentials: 'same-origin'
    }).catch(function () {});
  }

  function sendLocation(coords) {
    fetch('/api/driver/location', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        lat:      coords.latitude,
        lng:      coords.longitude,
        accuracy: coords.accuracy,
        peerId:   currentPeerId || null
      }),
      credentials: 'same-origin'
    }).catch(function () {});
  }

  /* ── Auth check + boot ── */
  fetch('/api/auth/me', { credentials: 'same-origin' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || d.role !== 'driver') { window.location.href = 'login.html'; return; }
      if (iosStandalone) showIOSNotice();
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

    var incidentBadge = trip.incident
      ? '<div class="dr-incident-badge">⚠ Incident reported</div>'
      : '';
    var reportBtn = (trip.status !== 'completed' && !trip.incident)
      ? '<button class="dr-report-btn" onclick="openIncident(' + trip.id + ',\'' + trip.number + '\',\'' + escHtml(trip.patient_name).replace(/'/g,"\\'") + '\')">⚠ Report Incident</button>'
      : '';

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
      incidentBadge,
      reportBtn ? '<div class="dr-report-wrap">' + reportBtn + '</div>' : '',
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

  /* ── Incident report ── */
  window.openIncident = function (tripId, tripNumber, patientName) {
    incidentTripId     = tripId;
    incidentTripNumber = tripNumber;
    incidentPatient    = patientName;
    incidentType       = null;
    incidentPhotoUrl   = null;
    document.getElementById('incidentTripLabel').textContent = tripNumber + ' · ' + patientName;
    document.getElementById('incidentNotes').value = '';
    document.getElementById('incidentPhotoPreview').style.display = 'none';
    document.getElementById('incidentPhotoBtn').textContent = '';
    document.getElementById('incidentPhotoBtn').innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg> Take Photo / Choose from Library';
    document.getElementById('incidentPhotoInput').value = '';
    document.getElementById('incidentSubmitBtn').disabled = false;
    document.getElementById('incidentSubmitBtn').innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg> Submit Report';
    document.querySelectorAll('.dr-type-btn').forEach(function (b) { b.classList.remove('selected'); });
    document.getElementById('incidentOverlay').style.display = 'flex';
  };

  window.closeIncidentSheet = function () {
    document.getElementById('incidentOverlay').style.display = 'none';
  };
  window.closeIncidentOverlay = function (e) {
    if (e.target === document.getElementById('incidentOverlay')) closeIncidentSheet();
  };

  window.selectIncidentType = function (btn) {
    document.querySelectorAll('.dr-type-btn').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
    incidentType = btn.dataset.type;
  };

  window.handleIncidentPhoto = function (input) {
    var file = input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement('canvas');
        var maxW = 640, maxH = 480;
        var w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        incidentPhotoUrl = canvas.toDataURL('image/jpeg', 0.72);
        document.getElementById('incidentPhotoImg').src = incidentPhotoUrl;
        document.getElementById('incidentPhotoPreview').style.display = 'flex';
        document.getElementById('incidentPhotoBtn').textContent = '📷 Change Photo';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  window.removeIncidentPhoto = function () {
    incidentPhotoUrl = null;
    document.getElementById('incidentPhotoPreview').style.display = 'none';
    document.getElementById('incidentPhotoInput').value = '';
    document.getElementById('incidentPhotoBtn').innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg> Take Photo / Choose from Library';
  };

  window.submitIncident = function () {
    if (!incidentType) {
      var types = document.getElementById('incidentTypes');
      types.classList.add('shake');
      setTimeout(function () { types.classList.remove('shake'); }, 500);
      return;
    }
    var btn = document.getElementById('incidentSubmitBtn');
    btn.disabled = true;
    btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin .8s linear infinite"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Sending…';

    fetch('/api/driver/incident', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId:      incidentTripId,
        tripNumber:  incidentTripNumber,
        patientName: incidentPatient,
        type:        incidentType,
        notes:       document.getElementById('incidentNotes').value,
        photoDataUrl: incidentPhotoUrl,
        lat: lastPosition ? lastPosition.latitude  : null,
        lng: lastPosition ? lastPosition.longitude : null
      }),
      credentials: 'same-origin'
    })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (!res.ok) { btn.disabled = false; btn.textContent = 'Submit Report'; return; }
      var trip = trips.find(function (t) { return t.id === incidentTripId; });
      if (trip) trip.incident = { type: incidentType };
      closeIncidentSheet();
      render();
    })
    .catch(function () { btn.disabled = false; btn.textContent = 'Submit Report'; });
  };

  /* ── Logout ── */
  window.driverLogout = function () {
    stopCabinCamera();
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
