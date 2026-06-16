/* dispatcher.js — Dispatcher panel logic */
(function () {

  var allTrips   = [];
  var allDrivers = [];
  var dispMap    = null;
  var markers    = {};
  var activeFilter  = 'all';
  var editingId     = null;
  var cabinDriverId = null;
  var cabinPeerId   = null;
  var dispPeer      = null;
  var incidentsByTrip = {}; /* tripId → incident report */

  /* ── Boot ── */
  fetch('/api/auth/me', { credentials: 'same-origin' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || d.role !== 'dispatcher') {
        window.location.href = 'login.html';
        return;
      }
      document.getElementById('adminName').textContent = 'Alex Rodriguez';
      loadAll();
    });

  function loadAll() {
    Promise.all([
      fetch('/api/dispatcher/trips',     { credentials: 'same-origin' }).then(function(r){return r.json();}),
      fetch('/api/dispatcher/stats',     { credentials: 'same-origin' }).then(function(r){return r.json();}),
      fetch('/api/dispatcher/locations', { credentials: 'same-origin' }).then(function(r){return r.json();}).catch(function(){return {locations:[]};}),
      fetch('/api/dispatcher/incidents', { credentials: 'same-origin' }).then(function(r){return r.json();}).catch(function(){return {incidents:[]};})
    ]).then(function (results) {
      var tripsData     = results[0];
      var stats         = results[1];
      var locationsData = results[2];
      var incidentsData = results[3];
      allTrips   = tripsData.trips;
      allDrivers = tripsData.drivers;
      applyRealLocations(allTrips, locationsData.locations || []);
      applyIncidents(incidentsData.incidents || []);
      renderStats(stats);
      renderTable(allTrips);
      initMap(allTrips);
      populateDriverDropdown(allDrivers);
      /* Poll real driver positions every 5s */
      setInterval(pollLocations, 5000);
      /* Poll incidents every 30s */
      setInterval(pollIncidents, 30000);
    }).catch(function () {
      window.location.href = 'login.html';
    });
  }

  function applyIncidents(incidents) {
    incidentsByTrip = {};
    incidents.forEach(function (inc) {
      if (!incidentsByTrip[inc.tripId]) incidentsByTrip[inc.tripId] = inc;
    });
  }

  function pollIncidents() {
    fetch('/api/dispatcher/incidents', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var prev = Object.keys(incidentsByTrip).length;
        applyIncidents(data.incidents || []);
        if (Object.keys(incidentsByTrip).length !== prev) renderTable(allTrips);
      }).catch(function () {});
  }

  function applyRealLocations(trips, locations) {
    locations.forEach(function (loc) {
      var trip = trips.find(function (t) {
        return t.driver && Number(t.driver.id) === Number(loc.driverId) && t.status === 'en_route';
      });
      if (trip) trip.driver_position = { lat: loc.lat, lng: loc.lng, real: true, updatedAt: loc.updatedAt };
    });
  }

  function pollLocations() {
    fetch('/api/dispatcher/locations', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        (data.locations || []).forEach(function (loc) {
          var trip = allTrips.find(function (t) {
            return t.driver && Number(t.driver.id) === Number(loc.driverId) && t.status === 'en_route';
          });
          if (!trip) return;
          trip.driver_position = { lat: loc.lat, lng: loc.lng, real: true, updatedAt: loc.updatedAt };
          var m = markers[trip.id];
          if (m) {
            m.setLatLng([loc.lat, loc.lng]);
            m.getPopup().setContent(buildPopup(trip, true));
          }
        });
      }).catch(function () {});
  }

  function buildPopup(trip, isReal) {
    var freshLabel = isReal ? ' <span style="color:#10B981;font-size:10px">● GPS</span>' : '';
    return '<div style="font-family:sans-serif;min-width:160px">' +
      '<div style="font-weight:700;color:#059669;font-size:11px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px">● En Route' + freshLabel + '</div>' +
      '<div style="font-weight:600;font-size:13px">' + (trip.driver ? trip.driver.name : '—') + '</div>' +
      '<div style="font-size:11px;color:#6B7280;margin-top:2px">' + trip.patient_name + ' · ' + trip.number + '</div>' +
      '</div>';
  }

  /* ── Stats ── */
  function renderStats(s) {
    setText('statTotal',     s.total);
    setText('statEnRoute',   s.en_route);
    setText('statPending',   s.pending);
    setText('statConfirmed', s.confirmed);
    setText('statCompleted', s.completed);
  }

  /* ── Table ── */
  function renderTable(trips) {
    var filtered = activeFilter === 'all'
      ? trips
      : trips.filter(function(t){ return t.status === activeFilter; });

    var tbody = document.getElementById('tripsBody');
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="disp-empty"><p>No trips match this filter.</p></div></td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(function(t) {
      var time   = formatTime(t.scheduled_at);
      var from   = shortAddr(t.pickup);
      var to     = shortAddr(t.destination);
      var driver = t.driver ? t.driver.name : '<span class="unassigned">— Unassigned</span>';
      var cabinBtn = '';
      if (t.status === 'en_route' && t.driver) {
        var driverNameEsc = t.driver.name.replace(/'/g, "\\'");
        /* Peer ID is deterministic: mz-drv-{driverId} — no need to read from Blobs */
        var peerId = 'mz-drv-' + t.driver.id;
        cabinBtn = '<button class="disp-cabin-btn live" onclick="viewCabin(' + t.driver.id + ',\'' + driverNameEsc + '\',\'' + peerId + '\')">🔴 Live</button>';
      }
      var incident    = incidentsByTrip[t.id];
      var incidentBtn = incident
        ? '<button class="disp-incident-btn" onclick="viewIncident(' + t.id + ')">⚠ Report</button>'
        : '';
      var statusCell  = statusBadge(t.status) + (incident ? ' <span class="disp-incident-dot" title="Incident reported">!</span>' : '');
      return [
        '<tr data-id="' + t.id + '">',
        '  <td><span class="trip-num">' + t.number.replace('MT-2026-', '#') + '</span></td>',
        '  <td><span class="patient-name">' + t.patient_name + '</span></td>',
        '  <td>' + statusCell + '</td>',
        '  <td><span class="trip-time">' + time + '</span></td>',
        '  <td class="driver-cell">' + driver + '</td>',
        '  <td class="route-cell"><span class="route-from">' + from + '</span><span class="route-arrow">→</span>' + to + '</td>',
        '  <td class="actions-cell">' + incidentBtn + cabinBtn + '<button class="disp-edit-btn" onclick="openEdit(' + t.id + ')">Edit</button></td>',
        '</tr>'
      ].join('');
    }).join('');
  }

  /* ── Map ── */
  function initMap(trips) {
    if (dispMap) { dispMap.remove(); dispMap = null; }
    dispMap = L.map('dispMap', { zoomControl: true }).setView([28.5383, -81.3792], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18
    }).addTo(dispMap);

    trips.forEach(function(t) {
      /* Driver position marker for active trips */
      if (t.status === 'en_route' && t.driver_position) {
        var icon = L.divIcon({
          className: '',
          html: '<div style="width:14px;height:14px;background:#10B981;border:2.5px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(16,185,129,.25)"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        var m = L.marker([t.driver_position.lat, t.driver_position.lng], { icon: icon }).addTo(dispMap);
        m.bindPopup(
          '<div style="font-family:sans-serif;min-width:160px">' +
          '<div style="font-weight:700;color:#059669;font-size:11px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px">● En Route</div>' +
          '<div style="font-weight:600;font-size:13px">' + (t.driver ? t.driver.name : '—') + '</div>' +
          '<div style="font-size:11px;color:#6B7280;margin-top:2px">' + t.patient_name + ' · ' + t.number + '</div>' +
          '</div>'
        );
        markers[t.id] = m;
      }

      /* Pickup pin */
      if (t.pickup_coords && t.status !== 'completed') {
        var pinColor = statusColor(t.status);
        var pickupIcon = L.divIcon({
          className: '',
          html: '<div style="width:10px;height:10px;background:' + pinColor + ';border:2px solid #fff;border-radius:50%;opacity:.8"></div>',
          iconSize: [10, 10],
          iconAnchor: [5, 5]
        });
        L.marker([t.pickup_coords.lat, t.pickup_coords.lng], { icon: pickupIcon }).addTo(dispMap)
          .bindPopup('<div style="font-family:sans-serif;font-size:12px"><strong>' + t.patient_name + '</strong><br>' + shortAddr(t.pickup) + '<br><span style="color:#6B7280">' + formatTime(t.scheduled_at) + '</span></div>');
      }
    });
  }

  /* ── Filter tabs ── */
  document.querySelectorAll('.disp-filter').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.disp-filter').forEach(function(b){ b.classList.remove('active'); });
      this.classList.add('active');
      activeFilter = this.dataset.filter;
      renderTable(allTrips);
    });
  });

  /* ── Edit modal ── */
  window.openEdit = function(id) {
    var trip = allTrips.find(function(t){ return t.id === id; });
    if (!trip) return;
    editingId = id;

    document.getElementById('modalTripNum').textContent  = trip.number;
    document.getElementById('modalPatient').textContent  = trip.patient_name;
    document.getElementById('editStatus').value          = trip.status;
    document.getElementById('editDriver').value          = trip.driver_id || '';
    document.getElementById('editNotes').value           = trip.notes || '';

    document.getElementById('editModal').classList.add('open');
  };

  window.closeEdit = function() {
    document.getElementById('editModal').classList.remove('open');
    editingId = null;
  };

  window.saveEdit = function() {
    if (!editingId) return;
    var status   = document.getElementById('editStatus').value;
    var driverId = document.getElementById('editDriver').value;
    var notes    = document.getElementById('editNotes').value;
    var btn      = document.getElementById('saveEditBtn');

    btn.classList.add('loading');
    btn.textContent = 'Saving…';

    fetch('/api/dispatcher/trips/' + editingId + '/status', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: status, driverId: driverId ? Number(driverId) : null, notes: notes }),
      credentials: 'same-origin'
    })
    .then(function(r){ return r.json(); })
    .then(function(res) {
      if (!res.ok) { alert('Error saving changes.'); return; }

      /* Update local state */
      var trip = allTrips.find(function(t){ return t.id === editingId; });
      if (trip) {
        trip.status   = res.status;
        trip.driver_id = res.driverId;
        trip.notes    = res.notes;
        trip.driver   = res.driverId ? allDrivers.find(function(d){ return d.id === res.driverId; }) || null : null;
      }

      /* Re-render */
      var stats = { total: allTrips.length, en_route: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
      allTrips.forEach(function(t){ if (t.status in stats) stats[t.status]++; });
      renderStats(stats);
      renderTable(allTrips);
      closeEdit();
    })
    .catch(function(){ alert('Connection error. Please try again.'); })
    .finally(function(){
      btn.classList.remove('loading');
      btn.textContent = 'Save Changes';
    });
  };

  /* Close modal on overlay click */
  document.getElementById('editModal').addEventListener('click', function(e) {
    if (e.target === this) closeEdit();
  });

  /* Close modal on Escape */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeEdit();
  });

  /* ── Incident report viewer ── */
  var INCIDENT_LABELS = {
    no_show: '🚫 No Show', no_answer: '📞 No Answer',
    wrong_address: '📍 Wrong Address', refused: '⛔ Patient Refused',
    vehicle_issue: '🔧 Vehicle Issue', other: '📝 Other'
  };

  window.viewIncident = function (tripId) {
    var inc = incidentsByTrip[tripId];
    if (!inc) return;
    var ts = new Date(inc.reportedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    var mapsUrl = (inc.lat && inc.lng)
      ? 'https://maps.google.com/?q=' + inc.lat + ',' + inc.lng
      : null;

    document.getElementById('incidentModalTitle').textContent  = inc.tripNumber + ' · ' + inc.patientName;
    document.getElementById('incidentModalType').textContent   = INCIDENT_LABELS[inc.type] || inc.type;
    document.getElementById('incidentModalDriver').textContent = inc.driverName + ' · ' + ts;
    document.getElementById('incidentModalNotes').textContent  = inc.notes || '—';

    var locEl = document.getElementById('incidentModalLocation');
    if (mapsUrl) {
      locEl.innerHTML = '<a href="' + mapsUrl + '" target="_blank" rel="noopener" style="color:#3B82F6">📍 View on Google Maps</a>';
    } else {
      locEl.textContent = '—';
    }

    var photoEl = document.getElementById('incidentModalPhoto');
    var noPhotoEl = document.getElementById('incidentModalNoPhoto');
    if (inc.photoDataUrl) {
      photoEl.src = inc.photoDataUrl;
      photoEl.style.display = 'block';
      noPhotoEl.style.display = 'none';
    } else {
      photoEl.style.display = 'none';
      noPhotoEl.style.display = 'flex';
    }

    document.getElementById('incidentModal').classList.add('open');
  };

  window.closeIncidentModal = function () {
    document.getElementById('incidentModal').classList.remove('open');
  };

  document.getElementById('incidentModal').addEventListener('click', function (e) {
    if (e.target === this) closeIncidentModal();
  });

  /* ── ICE servers (STUN + TURN for NAT traversal) ── */
  var ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80',              username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443',             username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
  ];

  /* ── Cabin view (WebRTC live + snapshot fallback) ── */
  window.viewCabin = function (driverId, driverName, peerId) {
    cabinDriverId = driverId;
    cabinPeerId   = peerId || null;
    document.getElementById('cabinModalDriver').textContent = driverName;
    document.getElementById('cabinModal').classList.add('open');
    if (peerId) {
      startLiveView(peerId);
    } else {
      fetchCabinSnapshot();
    }
  };

  window.closeCabin = function () {
    document.getElementById('cabinModal').classList.remove('open');
    var liveVideo = document.getElementById('cabinLiveVideo');
    liveVideo.srcObject = null;
    liveVideo.style.display = 'none';
    document.getElementById('cabinLiveBadge').style.display = 'none';
    document.getElementById('cabinSpeaker').style.display   = 'none';
    if (dispPeer) { try { dispPeer.destroy(); } catch (_) {} dispPeer = null; }
    cabinDriverId = null;
    cabinPeerId   = null;
  };

  window.toggleCabinAudio = function () {
    var video = document.getElementById('cabinLiveVideo');
    var btn   = document.getElementById('cabinSpeaker');
    if (!video) return;
    video.muted = !video.muted;
    btn.classList.toggle('muted', video.muted);
    btn.querySelector('.spk-on').style.display  = video.muted ? 'none'  : 'block';
    btn.querySelector('.spk-off').style.display = video.muted ? 'block' : 'none';
    btn.title = video.muted ? 'Unmute audio' : 'Mute audio';
  };

  window.refreshCabin = function () {
    if (cabinPeerId) { startLiveView(cabinPeerId); } else { fetchCabinSnapshot(); }
  };

  function cabinReset() {
    document.getElementById('cabinLoading').style.display    = 'none';
    document.getElementById('cabinLiveVideo').style.display  = 'none';
    document.getElementById('cabinImg').style.display        = 'none';
    document.getElementById('cabinNoFeed').style.display     = 'none';
    document.getElementById('cabinLiveBadge').style.display  = 'none';
    document.getElementById('cabinTimestamp').textContent    = '';
  }

  function startLiveView(peerId) {
    cabinReset();
    var loadingEl = document.getElementById('cabinLoading');
    loadingEl.style.display = 'flex';
    document.getElementById('cabinLoadingMsg').textContent = 'Connecting to driver…';

    if (dispPeer) { try { dispPeer.destroy(); } catch (_) {} dispPeer = null; }

    if (typeof Peer === 'undefined') { cabinReset(); showCabinNoFeed('WebRTC not available.'); return; }

    dispPeer = new Peer({ config: { iceServers: ICE_SERVERS } });

    var connectTimeout = setTimeout(function () {
      if (loadingEl.style.display !== 'none') {
        cabinReset();
        showCabinNoFeed('Connection timed out — driver may not be streaming.');
      }
    }, 10000);

    dispPeer.on('open', function () {
      var canvas = document.createElement('canvas');
      canvas.width = 1; canvas.height = 1;
      var dummyStream = canvas.captureStream(1);
      var call = dispPeer.call(peerId, dummyStream);

      call.on('stream', function (remoteStream) {
        clearTimeout(connectTimeout);
        cabinReset();
        var video = document.getElementById('cabinLiveVideo');
        video.srcObject = remoteStream;
        video.style.display = 'block';
        document.getElementById('cabinLiveBadge').style.display = 'flex';
        var spk = document.getElementById('cabinSpeaker');
        if (remoteStream.getAudioTracks().length > 0) {
          spk.style.display = 'flex';
          spk.classList.remove('muted');
          spk.querySelector('.spk-on').style.display  = 'block';
          spk.querySelector('.spk-off').style.display = 'none';
        }
      });

      call.on('error', function () {
        clearTimeout(connectTimeout);
        cabinReset();
        showCabinNoFeed('Connection error — driver may have stopped streaming.');
      });

      call.on('close', function () {
        clearTimeout(connectTimeout);
        if (document.getElementById('cabinModal').classList.contains('open')) {
          cabinReset();
          showCabinNoFeed('Stream ended by driver.');
        }
      });
    });

    dispPeer.on('error', function () {
      clearTimeout(connectTimeout);
      cabinReset();
      showCabinNoFeed('Could not connect — check your connection.');
    });
  }

  function showCabinNoFeed(msg) {
    document.getElementById('cabinNoFeedMsg').textContent = msg || 'Driver has not enabled the cabin camera yet.';
    document.getElementById('cabinNoFeed').style.display = 'flex';
  }

  function fetchCabinSnapshot() {
    if (!cabinDriverId) return;
    cabinReset();
    document.getElementById('cabinLoading').style.display = 'flex';
    document.getElementById('cabinLoadingMsg').textContent = 'Loading snapshot…';

    fetch('/api/dispatcher/snapshot/' + cabinDriverId, { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        cabinReset();
        if (data.snapshot && data.snapshot.dataUrl) {
          var img = document.getElementById('cabinImg');
          img.src = data.snapshot.dataUrl;
          img.style.display = 'block';
          var ts = new Date(data.snapshot.capturedAt).toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
          });
          document.getElementById('cabinTimestamp').textContent = 'Captured ' + ts;
        } else {
          showCabinNoFeed('Driver has not enabled the cabin camera yet.');
        }
      })
      .catch(function () { cabinReset(); showCabinNoFeed('Could not load snapshot.'); });
  }

  document.getElementById('cabinModal').addEventListener('click', function (e) {
    if (e.target === this) closeCabin();
  });

  /* ── Logout ── */
  window.dispLogout = function() {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).finally(function() {
      window.location.href = 'login.html';
    });
  };

  /* ── Helpers ── */
  function populateDriverDropdown(drivers) {
    var sel = document.getElementById('editDriver');
    drivers.forEach(function(d) {
      var opt = document.createElement('option');
      opt.value       = d.id;
      opt.textContent = d.name + ' · ' + d.plate;
      sel.appendChild(opt);
    });
  }

  function statusBadge(status) {
    var labels = { pending: 'Pending', confirmed: 'Confirmed', en_route: 'En Route', completed: 'Completed', cancelled: 'Cancelled' };
    return '<span class="status-badge ' + status + '">' + (labels[status] || status) + '</span>';
  }

  function statusColor(status) {
    return { pending: '#F59E0B', confirmed: '#3B82F6', en_route: '#10B981', completed: '#6B7280', cancelled: '#EF4444' }[status] || '#6B7280';
  }

  function formatTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  function shortAddr(addr) {
    if (!addr) return '—';
    return addr.split(',')[0];
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

})();
