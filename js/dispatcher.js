/* dispatcher.js — Dispatcher panel logic */
(function () {

  var allTrips        = [];
  var allDrivers      = [];
  var dispMap         = null;
  var _dispTile       = null;
  var _detailTile     = null;
  var markers         = {};
  var activeFilter    = 'all';
  var editingId       = null;
  var cabinDriverId   = null;
  var cabinPeerId     = null;
  var dispPeer        = null;
  var incidentsByTrip = {};
  var proposedTrips   = [];
  var expandedTripId  = null;
  var detailMap       = null;
  var detailDrvMarker = null;
  var currentPage     = 1;
  var pageSize        = 15;
  var searchQuery     = '';
  var reviewedTrips   = new Set();
  var _confirmCb      = null;
  var _driverHistory  = [];
  var _dhExpandedIdx  = null;

  /* ── Toast system ── */
  function showToast(msg, type, dur) {
    type = type || 'success';
    dur  = dur  || 3500;
    var container = document.getElementById('toastContainer');
    if (!container) return;
    var icon = type === 'success'
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
      : type === 'error'
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    var toast = document.createElement('div');
    toast.className = 'disp-toast disp-toast-' + type;
    toast.innerHTML = icon + '<span>' + escHtml(msg) + '</span>';
    container.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('disp-toast-show'); });
    setTimeout(function () {
      toast.classList.remove('disp-toast-show');
      setTimeout(function () { toast.remove(); }, 380);
    }, dur);
  }

  /* ── Confirm modal ── */
  function showConfirm(title, body, onConfirm) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmBody').textContent  = body;
    _confirmCb = onConfirm;
    document.getElementById('confirmModal').classList.add('open');
  }

  window._confirmOk = function () {
    document.getElementById('confirmModal').classList.remove('open');
    if (_confirmCb) { _confirmCb(); _confirmCb = null; }
  };

  window._confirmCancel = function () {
    document.getElementById('confirmModal').classList.remove('open');
    _confirmCb = null;
  };

  document.getElementById('confirmModal').addEventListener('click', function (e) {
    if (e.target === this) window._confirmCancel();
  });

  /* ── Boot ── */
  fetch('/api/auth/me', { credentials: 'same-origin' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || d.role !== 'dispatcher') { window.location.href = 'login.html'; return; }
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
      allTrips   = results[0].trips;
      allDrivers = results[0].drivers;
      applyRealLocations(allTrips, results[2].locations || []);
      applyIncidents(results[3].incidents || []);
      renderStats(results[1]);
      renderTable(allTrips);
      initMap(allTrips);
      populateDriverDropdown(allDrivers);
      fetch('/api/dispatcher/proposed', { credentials: 'same-origin' })
        .then(function(r){return r.json();})
        .then(function(d) {
          var accepted = JSON.parse(sessionStorage.getItem('disp-accepted') || '[]');
          var rejected = JSON.parse(sessionStorage.getItem('disp-rejected') || '[]');
          proposedTrips = (d.proposed || []).filter(function(t) {
            return accepted.indexOf(t.id) === -1 && rejected.indexOf(t.id) === -1;
          });
          updateRequestsBadge(proposedTrips.length);
        }).catch(function(){});
      var ntDate = document.getElementById('ntDate');
      if (ntDate) ntDate.value = new Date().toISOString().slice(0, 10);
      /* Calculate road miles for demo trips that already have coords (staggered 180ms) */
      allTrips.filter(function(t) { return t.pickup_coords && t.dest_coords; })
        .forEach(function(trip, idx) {
          setTimeout(function() {
            osrmMiles(trip.pickup_coords, trip.dest_coords).then(function(miles) {
              trip.distance_miles = miles;
              updateTripMilesUI(trip.id, miles);
            });
          }, idx * 180);
        });
      setInterval(pollLocations, 5000);
      setInterval(pollIncidents, 30000);
    }).catch(function () { window.location.href = 'login.html'; });
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
        var curr = Object.keys(incidentsByTrip).length;
        if (curr !== prev) {
          renderTable(allTrips);
          if (curr > prev) showToast('New incident report received', 'warning');
        }
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
        var now = Date.now();
        (data.locations || []).forEach(function (loc) {
          var trip = allTrips.find(function (t) {
            return t.driver && Number(t.driver.id) === Number(loc.driverId) && t.status === 'en_route';
          });
          if (!trip) return;
          trip.driver_position = { lat: loc.lat, lng: loc.lng, real: true, updatedAt: loc.updatedAt };
          var m = markers[trip.id];
          if (m) { m.setLatLng([loc.lat, loc.lng]); m.getPopup().setContent(buildPopup(trip, true)); }
        });
        /* GPS offline detection */
        allTrips.forEach(function (t) {
          if (t.status !== 'en_route') return;
          var isOffline = false;
          if (t.driver_position && t.driver_position.updatedAt) {
            isOffline = (now - new Date(t.driver_position.updatedAt).getTime()) > 60000;
          }
          var row = document.querySelector('tr[data-id="' + t.id + '"]');
          if (row) row.classList.toggle('gps-offline', isOffline);
          var m = markers[t.id];
          if (m && m.getElement()) m.getElement().style.opacity = isOffline ? '.35' : '1';
        });
        updateDetailMapPosition();
      }).catch(function () {});
  }

  function buildPopup(trip, isReal) {
    var gps = isReal ? ' <span style="color:#10B981;font-size:10px">● GPS</span>' : '';
    return '<div style="font-family:sans-serif;min-width:160px">' +
      '<div style="font-weight:700;color:#059669;font-size:11px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px">● En Route' + gps + '</div>' +
      '<div style="font-weight:600;font-size:13px">' + escHtml(trip.driver ? trip.driver.name : '—') + '</div>' +
      '<div style="font-size:11px;color:#6B7280;margin-top:2px">' + escHtml(trip.patient_name) + ' · ' + escHtml(trip.number) + '</div>' +
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
    closeTripDetail();
    var filtered = activeFilter === 'all' ? trips : trips.filter(function(t){ return t.status === activeFilter; });
    if (searchQuery) {
      var q = searchQuery.toLowerCase();
      filtered = filtered.filter(function(t) {
        return t.patient_name.toLowerCase().indexOf(q) !== -1 ||
               t.number.toLowerCase().indexOf(q) !== -1 ||
               (t.pickup || '').toLowerCase().indexOf(q) !== -1;
      });
    }
    var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    var paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    var tbody = document.getElementById('tripsBody');

    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="disp-empty">' +
        '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
        '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>' +
        '<rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>' +
        '<p>' + (searchQuery ? 'No trips match "' + escHtml(searchQuery) + '".' : 'No trips match this filter.') + '</p></div></td></tr>';
      renderPagination(0, 1, 1);
      return;
    }

    tbody.innerHTML = paged.map(function(t) {
      var time      = formatTime(t.scheduled_at);
      var from      = shortAddr(t.pickup);
      var to        = shortAddr(t.destination);
      var driver    = t.driver ? t.driver.name : '<span class="unassigned">— Unassigned</span>';
      var incident    = incidentsByTrip[t.id];
      var isReviewed  = reviewedTrips.has(t.id);
      var incidentBtn = incident
        ? '<button class="disp-incident-btn' + (isReviewed ? ' reviewed' : '') + '" onclick="event.stopPropagation();viewIncident(' + t.id + ')">' + (isReviewed ? '✓ Reviewed' : '⚠ Report') + '</button>'
        : '';
      var incidentDot = (incident && !isReviewed) ? ' <span class="disp-incident-dot" title="Incident reported">!</span>' : '';
      return [
        '<tr data-id="' + t.id + '" class="disp-trip-row" onclick="openTripDetail(event,' + t.id + ')">',
        '  <td><span class="trip-num">' + t.number.replace('MT-2026-', '#') + '</span></td>',
        '  <td><span class="patient-name">' + escHtml(t.patient_name) + '</span></td>',
        '  <td>' + statusBadge(t.status) + incidentDot + '</td>',
        '  <td><span class="trip-time">' + time + '</span></td>',
        '  <td class="driver-cell">' + driver + '</td>',
        '  <td class="route-cell"><span class="route-from">' + from + '</span><span class="route-arrow">→</span>' + to + ' <span class="trip-miles" id="miles-' + t.id + '">' + (t.distance_miles != null ? t.distance_miles + ' mi' : '') + '</span></td>',
        '  <td class="actions-cell">' + incidentBtn + '</td>',
        '</tr>'
      ].join('');
    }).join('');

    renderPagination(filtered.length, currentPage, totalPages);
  }

  function renderPagination(total, page, totalPages) {
    var el = document.getElementById('tripsPagination');
    if (!el) return;
    if (total <= pageSize) { el.innerHTML = ''; return; }
    var html = '<div class="disp-pagination">';
    html += '<span class="disp-page-info">Showing ' +
      Math.min((page - 1) * pageSize + 1, total) + '–' + Math.min(page * pageSize, total) + ' of ' + total + '</span>';
    html += '<div class="disp-page-btns">';
    html += '<button class="disp-page-btn" onclick="changePage(-1)"' + (page <= 1 ? ' disabled' : '') + '>← Prev</button>';
    for (var i = 1; i <= totalPages && i <= 10; i++) {
      html += '<button class="disp-page-btn' + (i === page ? ' active' : '') + '" onclick="gotoPage(' + i + ')">' + i + '</button>';
    }
    html += '<button class="disp-page-btn" onclick="changePage(1)"' + (page >= totalPages ? ' disabled' : '') + '>Next →</button>';
    html += '</div></div>';
    el.innerHTML = html;
  }

  window.changePage = function (dir) { currentPage += dir; renderTable(allTrips); };
  window.gotoPage   = function (p)   { currentPage = p;   renderTable(allTrips); };

  /* ── Map tiles ── */
  function buildTileLayer() {
    if (document.body.classList.contains('dark')) {
      return L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> © <a href="https://carto.com">CARTO</a>',
        subdomains: 'abcd', maxZoom: 19
      });
    }
    return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 18
    });
  }

  /* ── Overview map ── */
  function initMap(trips) {
    if (dispMap) { dispMap.remove(); dispMap = null; markers = {}; _dispTile = null; }
    dispMap = L.map('dispMap', { zoomControl: true }).setView([28.5383, -81.3792], 10);
    _dispTile = buildTileLayer().addTo(dispMap);

    trips.forEach(function(t) {
      if (t.status === 'en_route' && t.driver_position) {
        var icon = L.divIcon({
          className: '',
          html: '<div style="width:14px;height:14px;background:#10B981;border:2.5px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(16,185,129,.25)"></div>',
          iconSize: [14, 14], iconAnchor: [7, 7]
        });
        var m = L.marker([t.driver_position.lat, t.driver_position.lng], { icon: icon }).addTo(dispMap);
        m.bindPopup(buildPopup(t, !!t.driver_position.real));
        markers[t.id] = m;
      }
      if (t.pickup_coords && t.status !== 'completed') {
        var pinColor = statusColor(t.status);
        var pIcon = L.divIcon({
          className: '',
          html: '<div style="width:10px;height:10px;background:' + pinColor + ';border:2px solid #fff;border-radius:50%;opacity:.8"></div>',
          iconSize: [10, 10], iconAnchor: [5, 5]
        });
        L.marker([t.pickup_coords.lat, t.pickup_coords.lng], { icon: pIcon }).addTo(dispMap)
          .bindPopup('<div style="font-family:sans-serif;font-size:12px"><strong>' + escHtml(t.patient_name) + '</strong><br>' + escHtml(shortAddr(t.pickup)) + '<br><span style="color:#6B7280">' + escHtml(formatTime(t.scheduled_at)) + '</span></div>');
      }
    });
  }

  /* ── Search ── */
  var _searchEl = document.getElementById('tripSearch');
  if (_searchEl) {
    _searchEl.addEventListener('input', function () {
      searchQuery = this.value.trim();
      currentPage = 1;
      renderTable(allTrips);
    });
  }

  /* ── Filter tabs ── */
  document.querySelectorAll('.disp-filter').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.disp-filter').forEach(function(b){ b.classList.remove('active'); });
      this.classList.add('active');
      activeFilter = this.dataset.filter;
      currentPage  = 1;
      renderTable(allTrips);
    });
  });

  /* ── Edit modal ── */
  var _abandonedPhotoUrl = null;

  window.openEdit = function(id) {
    var trip = allTrips.find(function(t){ return t.id === id; });
    if (!trip) return;
    editingId = id;
    document.getElementById('modalTripNum').textContent = trip.number;
    document.getElementById('modalPatient').textContent = trip.patient_name;
    document.getElementById('editStatus').value         = trip.status;
    document.getElementById('editDriver').value         = trip.driver_id || '';
    document.getElementById('editNotes').value          = trip.notes || '';
    document.getElementById('editAbandonedNotes').value = trip.abandoned_notes || '';
    document.getElementById('editAbandonedPhoto').value = '';
    _abandonedPhotoUrl = trip.abandoned_photo || null;
    var preview = document.getElementById('editAbandonedPreview');
    if (_abandonedPhotoUrl) { preview.src = _abandonedPhotoUrl; preview.style.display = 'block'; }
    else { preview.style.display = 'none'; }
    onEditStatusChange();
    document.getElementById('editModal').classList.add('open');
  };

  window.closeEdit = function() {
    document.getElementById('editModal').classList.remove('open');
    editingId = null;
    _abandonedPhotoUrl = null;
  };

  window.onEditStatusChange = function () {
    var status  = document.getElementById('editStatus').value;
    var section = document.getElementById('editAbandonedSection');
    section.style.display = status === 'abandoned' ? '' : 'none';
  };

  window.onAbandonedPhotoChange = function (input) {
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
        _abandonedPhotoUrl = canvas.toDataURL('image/jpeg', 0.72);
        var preview = document.getElementById('editAbandonedPreview');
        preview.src = _abandonedPhotoUrl; preview.style.display = 'block';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  window.saveEdit = function() {
    if (!editingId) return;
    var status   = document.getElementById('editStatus').value;
    var driverId = document.getElementById('editDriver').value;
    var notes    = document.getElementById('editNotes').value;
    var btn      = document.getElementById('saveEditBtn');
    var trip     = allTrips.find(function(t){ return t.id === editingId; });

    if (driverId && trip && driverHasOverlap(Number(driverId), trip.scheduled_at, editingId)) {
      showToast('Warning: driver already has a trip near this time', 'warning', 4500);
    }

    var body = {
      status: status,
      driverId: driverId ? Number(driverId) : null,
      notes: notes,
      distanceMiles: trip ? trip.distance_miles : null
    };
    if (status === 'abandoned') {
      body.evidenceNotes = document.getElementById('editAbandonedNotes').value;
      body.evidencePhoto = _abandonedPhotoUrl;
    }

    btn.classList.add('loading'); btn.textContent = 'Saving…';
    fetch('/api/dispatcher/trips/' + editingId + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'same-origin'
    })
    .then(function(r){ return r.json(); })
    .then(function(res) {
      if (!res.ok) { showToast('Error saving changes.', 'error'); return; }
      if (trip) {
        trip.status    = res.status;
        trip.driver_id = res.driverId;
        trip.notes     = res.notes;
        trip.driver    = res.driverId ? allDrivers.find(function(d){ return d.id === res.driverId; }) || null : null;
        if (status === 'abandoned') {
          trip.abandoned_notes = body.evidenceNotes;
          trip.abandoned_photo = body.evidencePhoto;
        }
      }
      var stats = { total: allTrips.length, en_route: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, abandoned: 0 };
      allTrips.forEach(function(t){ if (t.status in stats) stats[t.status]++; });
      renderStats(stats);
      renderTable(allTrips);
      closeEdit();
      showToast((trip ? trip.number : 'Trip') + ' updated successfully', 'success');
    })
    .catch(function(){ showToast('Connection error. Please try again.', 'error'); })
    .finally(function(){ btn.classList.remove('loading'); btn.textContent = 'Save Changes'; });
  };

  document.getElementById('editModal').addEventListener('click', function(e) { if (e.target === this) closeEdit(); });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (document.getElementById('editModal').classList.contains('open'))    closeEdit();
      if (document.getElementById('confirmModal').classList.contains('open')) window._confirmCancel();
      if (document.getElementById('incidentModal').classList.contains('open')) closeIncidentModal();
      if (document.getElementById('evidenceModal').classList.contains('open')) closeEvidenceModal();
    }
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
    var mapsUrl = (inc.lat && inc.lng) ? 'https://maps.google.com/?q=' + inc.lat + ',' + inc.lng : null;

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

    var photoEl   = document.getElementById('incidentModalPhoto');
    var noPhotoEl = document.getElementById('incidentModalNoPhoto');
    if (inc.photoDataUrl) {
      photoEl.src = inc.photoDataUrl; photoEl.style.display = 'block'; noPhotoEl.style.display = 'none';
    } else {
      photoEl.style.display = 'none'; noPhotoEl.style.display = 'flex';
    }

    var reviewBtn = document.getElementById('incidentReviewBtn');
    if (reviewBtn) {
      var reviewed = reviewedTrips.has(tripId);
      reviewBtn.textContent     = reviewed ? '✓ Reviewed' : 'Mark Reviewed';
      reviewBtn.disabled        = reviewed;
      reviewBtn.dataset.tripId  = tripId;
    }

    document.getElementById('incidentModal').classList.add('open');
  };

  window.markIncidentReviewed = function () {
    var btn = document.getElementById('incidentReviewBtn');
    if (!btn || btn.disabled) return;
    var tripId = Number(btn.dataset.tripId);
    reviewedTrips.add(tripId);
    btn.textContent = '✓ Reviewed';
    btn.disabled    = true;
    renderTable(allTrips);
    showToast('Incident marked as reviewed', 'success');
  };

  window.closeIncidentModal = function () {
    document.getElementById('incidentModal').classList.remove('open');
  };

  document.getElementById('incidentModal').addEventListener('click', function (e) {
    if (e.target === this) closeIncidentModal();
  });

  /* ── Overlap check ── */
  function driverHasOverlap(driverId, scheduledAt, excludeId) {
    var sched = new Date(scheduledAt).getTime();
    return allTrips.some(function (t) {
      if (t.id === excludeId) return false;
      if (t.driver_id !== driverId) return false;
      if (t.status === 'completed' || t.status === 'cancelled') return false;
      return Math.abs(new Date(t.scheduled_at).getTime() - sched) < 90 * 60 * 1000;
    });
  }

  /* ── ICE / WebRTC ── */
  var ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80',               username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443',              username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
  ];

  window.viewCabin = function (driverId, driverName, peerId) {
    cabinDriverId = driverId; cabinPeerId = peerId || null;
    document.getElementById('cabinModalDriver').textContent = driverName;
    document.getElementById('livePanel').classList.add('open');
    document.getElementById('livePanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (peerId) startLiveView(peerId); else fetchCabinSnapshot();
  };

  window.closeCabin = function () {
    document.getElementById('livePanel').classList.remove('open');
    var v = document.getElementById('cabinLiveVideo');
    v.srcObject = null; v.style.display = 'none';
    document.getElementById('cabinLiveBadge').style.display = 'none';
    document.getElementById('cabinSpeaker').style.display   = 'none';
    if (dispPeer) { try { dispPeer.destroy(); } catch (_) {} dispPeer = null; }
    cabinDriverId = null; cabinPeerId = null;
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
    if (cabinPeerId) startLiveView(cabinPeerId); else fetchCabinSnapshot();
  };

  function cabinReset() {
    ['cabinLoading','cabinLiveVideo','cabinImg','cabinNoFeed','cabinLiveBadge'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    document.getElementById('cabinTimestamp').textContent = '';
  }

  function startLiveView(peerId) {
    cabinReset();
    var loadEl = document.getElementById('cabinLoading');
    loadEl.style.display = 'flex';
    document.getElementById('cabinLoadingMsg').textContent = 'Connecting to driver…';
    if (dispPeer) { try { dispPeer.destroy(); } catch (_) {} dispPeer = null; }
    if (typeof Peer === 'undefined') { cabinReset(); showCabinNoFeed('WebRTC not available.'); return; }

    dispPeer = new Peer({ config: { iceServers: ICE_SERVERS } });
    var timeout = setTimeout(function () {
      if (loadEl.style.display !== 'none') { cabinReset(); showCabinNoFeed('Connection timed out — driver may not be streaming.'); }
    }, 10000);

    dispPeer.on('open', function () {
      var canvas = document.createElement('canvas'); canvas.width = 1; canvas.height = 1;
      var call = dispPeer.call(peerId, canvas.captureStream(1));
      call.on('stream', function (stream) {
        clearTimeout(timeout); cabinReset();
        var v = document.getElementById('cabinLiveVideo');
        v.srcObject = stream; v.style.display = 'block';
        document.getElementById('cabinLiveBadge').style.display = 'flex';
        var spk = document.getElementById('cabinSpeaker');
        if (stream.getAudioTracks().length > 0) {
          spk.style.display = 'flex'; spk.classList.remove('muted');
          spk.querySelector('.spk-on').style.display = 'block';
          spk.querySelector('.spk-off').style.display = 'none';
        }
      });
      call.on('error', function () { clearTimeout(timeout); cabinReset(); showCabinNoFeed('Connection error.'); });
      call.on('close', function () {
        clearTimeout(timeout);
        if (document.getElementById('livePanel').classList.contains('open')) {
          cabinReset(); showCabinNoFeed('Stream ended by driver.');
        }
      });
    });
    dispPeer.on('error', function () { clearTimeout(timeout); cabinReset(); showCabinNoFeed('Could not connect — check your connection.'); });
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
          img.src = data.snapshot.dataUrl; img.style.display = 'block';
          var ts = new Date(data.snapshot.capturedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
          document.getElementById('cabinTimestamp').textContent = 'Captured ' + ts;
        } else { showCabinNoFeed('Driver has not enabled the cabin camera yet.'); }
      })
      .catch(function () { cabinReset(); showCabinNoFeed('Could not load snapshot.'); });
  }

  /* ── Dark mode ── */
  (function () { if (localStorage.getItem('disp-dark') === '1') applyDark(true); })();

  function applyDark(on) {
    document.body.classList.toggle('dark', on);
    var btn = document.getElementById('darkToggle');
    if (!btn) return;
    btn.querySelector('.icon-sun').style.display  = on ? 'none' : '';
    btn.querySelector('.icon-moon').style.display = on ? ''     : 'none';
  }

  window.toggleDarkMode = function () {
    var isDark = document.body.classList.contains('dark');
    applyDark(!isDark);
    localStorage.setItem('disp-dark', isDark ? '0' : '1');
    if (dispMap && _dispTile) {
      dispMap.removeLayer(_dispTile);
      _dispTile = buildTileLayer().addTo(dispMap);
    }
    if (detailMap && _detailTile) {
      detailMap.removeLayer(_detailTile);
      _detailTile = buildTileLayer().addTo(detailMap);
    }
  };

  /* ── Logout ── */
  window.dispLogout = function() {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
      .finally(function() { window.location.href = 'login.html'; });
  };

  /* ── Helpers ── */
  function populateDriverDropdown(drivers) {
    ['editDriver', 'ntDriver'].forEach(function (selId) {
      var sel = document.getElementById(selId);
      if (!sel) return;
      drivers.forEach(function(d) {
        var opt = document.createElement('option');
        opt.value = d.id; opt.textContent = d.name + ' · ' + d.plate;
        sel.appendChild(opt);
      });
    });
  }

  function statusBadge(status) {
    var labels = { pending: 'Pending', confirmed: 'Confirmed', en_route: 'En Route', completed: 'Completed', cancelled: 'Cancelled', abandoned: 'Abandoned' };
    return '<span class="status-badge ' + status + '">' + (labels[status] || status) + '</span>';
  }

  function statusColor(status) {
    return { pending: '#F59E0B', confirmed: '#3B82F6', en_route: '#10B981', completed: '#6B7280', cancelled: '#EF4444', abandoned: '#92400E' }[status] || '#6B7280';
  }

  function formatTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  function shortAddr(addr) { return addr ? addr.split(',')[0] : '—'; }

  function setText(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Road mileage — proxied through backend (avoids browser CORS/SSL issues) ── */

  /* Geocode via backend → Photon (proper User-Agent, Florida bbox) */
  function geocodeAddress(address) {
    return fetch('/api/dispatcher/geocode?address=' + encodeURIComponent(address))
      .then(function(r) { return r.json(); })
      .then(function(d) { return (d.lat && d.lng) ? { lat: d.lat, lng: d.lng } : null; })
      .catch(function() { return null; });
  }

  /* Road distance via backend → OSRM, Haversine fallback if OSRM unreachable */
  function osrmMiles(from, to) {
    return fetch(
      '/api/dispatcher/miles?fromLat=' + from.lat + '&fromLng=' + from.lng +
      '&toLat=' + to.lat + '&toLng=' + to.lng
    )
    .then(function(r) { return r.json(); })
    .then(function(d) { return d.miles != null ? d.miles : null; })
    .catch(function() { return null; });
  }

  /* Geocode addresses if needed, then compute road miles. Caches on trip object. */
  function calcTripMiles(trip) {
    if (trip.distance_miles !== undefined) return Promise.resolve(trip.distance_miles);
    if (trip.pickup_coords && trip.dest_coords) {
      return osrmMiles(trip.pickup_coords, trip.dest_coords)
        .then(function(mi) { trip.distance_miles = mi; return mi; });
    }
    return geocodeAddress(trip.pickup)
      .then(function(c) {
        if (!c) { trip.distance_miles = null; return null; }
        trip.pickup_coords = c;
        return geocodeAddress(trip.destination);
      })
      .then(function(c) {
        if (!c) { trip.distance_miles = null; return null; }
        trip.dest_coords = c;
        return osrmMiles(trip.pickup_coords, c);
      })
      .then(function(mi) { trip.distance_miles = mi; return mi; });
  }

  /* Update every UI element that shows miles for a given trip id */
  function updateTripMilesUI(tripId, miles) {
    var label = miles != null ? miles + ' mi' : '';
    var tableEl = document.getElementById('miles-' + tripId);
    if (tableEl) tableEl.textContent = label;
    var detailEl = document.getElementById('detailMiles-' + tripId);
    if (detailEl) detailEl.textContent = label ? label + ' via road' : '—';
    var reqEl = document.getElementById('reqMiles-' + tripId);
    if (reqEl) reqEl.textContent = label ? label + ' via road' : '—';
  }

  /* Staggered calculation for proposed/broker trips */
  function calcProposedMiles(trips) {
    var pending = trips.filter(function(t) { return t.distance_miles === undefined; });
    if (!pending.length) return;
    var i = 0;
    function step() {
      if (i >= pending.length) return;
      var trip = pending[i++];
      calcTripMiles(trip).then(function(miles) {
        updateTripMilesUI(trip.id, miles);
        setTimeout(step, 250);
      }).catch(function() { setTimeout(step, 250); });
    }
    step();
  }

  /* ── ETA (Haversine fallback — OSRM overrides when detail map loads) ── */
  function haversineMi(lat1, lng1, lat2, lng2) {
    var R = 3958.8, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
    var a = Math.sin(dLat/2)*Math.sin(dLat/2) +
            Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function calcEta(driverPos, destCoords) {
    if (!driverPos || !destCoords) return null;
    return Math.max(1, Math.round(haversineMi(driverPos.lat, driverPos.lng, destCoords.lat, destCoords.lng) / 25 * 60));
  }

  function etaClassForMins(mins) {
    return mins < 5 ? 'eta-red' : mins < 15 ? 'eta-amber' : 'eta-green';
  }

  function etaText(trip) {
    if (trip.status === 'completed') return { text: 'Completed', cls: 'eta-muted' };
    if (trip.status === 'cancelled') return { text: 'Cancelled', cls: 'eta-muted' };
    if (trip.status === 'abandoned') return { text: '⚠ Route Abandoned', cls: 'eta-red' };
    if (trip.status !== 'en_route')  return { text: 'Scheduled · ' + formatTime(trip.scheduled_at), cls: 'eta-muted' };
    var eta = calcEta(trip.driver_position, trip.dest_coords);
    if (eta === null) return { text: 'Waiting for GPS signal…', cls: 'eta-muted' };
    return { text: '~' + eta + ' min to destination', cls: etaClassForMins(eta) };
  }

  /* ── Trip detail accordion ── */
  window.openTripDetail = function (e, id) {
    if (e.target.closest('button') || e.target.closest('a')) return;
    if (expandedTripId === id) { closeTripDetail(); return; }
    closeTripDetail();
    var trip = allTrips.find(function (t) { return t.id === id; });
    if (!trip) return;
    expandedTripId = id;
    var row = document.querySelector('tr[data-id="' + id + '"]');
    if (row) row.classList.add('detail-open');
    var mount = document.getElementById('tripDetailMount');
    if (!mount) return;
    mount.innerHTML = buildDetailPanel(trip);
    setTimeout(function () {
      mount.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
  };

  window.closeTripDetail = function () {
    if (!expandedTripId) return;
    var row = document.querySelector('tr[data-id="' + expandedTripId + '"]');
    if (row) row.classList.remove('detail-open');
    var mount = document.getElementById('tripDetailMount');
    if (mount) mount.innerHTML = '';
    if (detailMap) { try { detailMap.remove(); } catch (_) {} detailMap = null; _detailTile = null; }
    detailDrvMarker = null; expandedTripId = null;
  };

  function buildDetailPanel(trip) {
    var driver   = trip.driver;
    var eta      = etaText(trip);
    var hasGps   = trip.status === 'en_route' && trip.driver_position;
    var gpsBadge = hasGps
      ? '<span class="disp-detail-gps">● GPS Live</span>'
      : (trip.status === 'en_route' ? '<span class="disp-detail-gps" style="background:rgba(245,158,11,.1);color:#B45309;border-color:rgba(245,158,11,.3)">● GPS Pending</span>' : '');
    var liveBtn = (trip.status === 'en_route' && driver)
      ? '<button class="disp-cabin-btn live" onclick="event.stopPropagation();viewCabin(' + driver.id + ',' + escHtml(JSON.stringify(driver.name)) + ',\'mz-drv-' + driver.id + '\')">🔴 Live</button>'
      : '';
    var mapBtn = '<button class="disp-cabin-btn" id="mapToggleBtn-' + trip.id + '" onclick="event.stopPropagation();toggleDetailMap(' + trip.id + ')">📍 View Map</button>';
    var driverHtml = driver
      ? escHtml(driver.name) + '<br><span style="font-size:.76rem;color:var(--disp-muted)">' + escHtml(driver.vehicle) + ' · ' + escHtml(driver.plate) + '</span>'
      : '<span class="unassigned">— Unassigned</span>';
    var notesHtml = trip.notes
      ? '<div class="disp-detail-section"><div class="disp-detail-label">Notes</div><div class="disp-detail-value">' + escHtml(trip.notes) + '</div></div>'
      : '';
    var legendHtml = '';
    if (hasGps)          legendHtml += '<span><span class="disp-legend-dot" style="background:#10B981"></span>Driver</span>';
    if (trip.pickup_coords) legendHtml += '<span><span class="disp-legend-dot" style="background:#3B82F6"></span>Pickup</span>';
    if (trip.dest_coords)   legendHtml += '<span><span class="disp-legend-dot" style="background:#EF4444"></span>Destination</span>';

    return '<div class="disp-trip-detail">' +
      '<div class="disp-detail-header">' +
        '<div class="disp-detail-head-left"><span class="trip-num">' + trip.number.replace('MT-2026-','#') + '</span>' + statusBadge(trip.status) + gpsBadge + '</div>' +
        '<div class="disp-detail-head-right">' + mapBtn + liveBtn +
          '<button class="disp-btn-save" style="padding:.35rem .8rem;font-size:.78rem" onclick="event.stopPropagation();openEdit(' + trip.id + ')">Edit</button>' +
          '<button class="disp-modal-close" onclick="event.stopPropagation();closeTripDetail()">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="disp-detail-body">' +
        '<div class="disp-detail-info">' +
          '<div class="disp-detail-section"><div class="disp-detail-label">Patient</div><div class="disp-detail-value">' + escHtml(trip.patient_name) + '</div></div>' +
          '<div class="disp-detail-section"><div class="disp-detail-label">Driver</div><div class="disp-detail-value">' + driverHtml + '</div></div>' +
          '<div class="disp-detail-section"><div class="disp-detail-label">Scheduled</div><div class="disp-detail-value">' + formatTime(trip.scheduled_at) + '</div></div>' +
          '<div class="disp-detail-section"><div class="disp-detail-label">Pickup</div><div class="disp-detail-value">' + escHtml(trip.pickup) + '</div></div>' +
          '<div class="disp-detail-section"><div class="disp-detail-label">Destination</div><div class="disp-detail-value">' + escHtml(trip.destination) + '</div></div>' +
          '<div class="disp-detail-section"><div class="disp-detail-label">Distance</div>' +
            '<div class="disp-detail-value" id="detailMiles-' + trip.id + '">' + (trip.distance_miles != null ? trip.distance_miles + ' mi via road' : '—') + '</div>' +
          '</div>' +
          '<div class="disp-detail-section"><div class="disp-detail-label">ETA</div>' +
            '<div class="disp-detail-value disp-detail-eta ' + eta.cls + '" id="detailEta-' + trip.id + '">' + eta.text + '</div>' +
          '</div>' + notesHtml +
        '</div>' +
        '<div class="disp-detail-map-wrap" id="detailMapWrap-' + trip.id + '" style="display:none">' +
          '<div id="detailMapContainer"></div>' +
          (legendHtml ? '<div class="disp-detail-legend">' + legendHtml + '</div>' : '') +
        '</div>' +
      '</div></div>';
  }

  window.toggleDetailMap = function (tripId) {
    var trip = allTrips.find(function (t) { return t.id === tripId; });
    var wrap = document.getElementById('detailMapWrap-' + tripId);
    var body = document.querySelector('.disp-detail-body');
    var btn  = document.getElementById('mapToggleBtn-' + tripId);
    if (!trip || !wrap) return;
    var opening = wrap.style.display === 'none';
    if (opening) {
      wrap.style.display = '';
      if (body) body.classList.add('map-open');
      if (btn) btn.textContent = '📍 Hide Map';
      if (!detailMap) {
        setTimeout(function () { initDetailMap(trip); }, 30);
      } else {
        setTimeout(function () { detailMap.invalidateSize(); }, 30);
      }
    } else {
      wrap.style.display = 'none';
      if (body) body.classList.remove('map-open');
      if (btn) btn.textContent = '📍 View Map';
    }
  };

  function initDetailMap(trip) {
    if (detailMap) { try { detailMap.remove(); } catch (_) {} detailMap = null; _detailTile = null; }
    detailDrvMarker = null;
    var container = document.getElementById('detailMapContainer');
    if (!container) return;

    var center = trip.driver_position
      ? [trip.driver_position.lat, trip.driver_position.lng]
      : (trip.pickup_coords ? [trip.pickup_coords.lat, trip.pickup_coords.lng] : [28.5383, -81.3792]);

    detailMap = L.map('detailMapContainer', { zoomControl: true }).setView(center, 12);
    _detailTile = buildTileLayer().addTo(detailMap);

    var bounds = [], routeFrom = null, routeTo = null;

    if (trip.pickup_coords) {
      var pi = L.divIcon({ className: '', html: '<div style="width:13px;height:13px;background:#3B82F6;border:2.5px solid #fff;border-radius:50%;box-shadow:0 1px 5px rgba(0,0,0,.35)"></div>', iconSize: [13,13], iconAnchor: [6,6] });
      L.marker([trip.pickup_coords.lat, trip.pickup_coords.lng], { icon: pi }).addTo(detailMap).bindPopup('<b>Pickup</b><br>' + trip.pickup);
      bounds.push([trip.pickup_coords.lat, trip.pickup_coords.lng]);
      routeFrom = [trip.pickup_coords.lat, trip.pickup_coords.lng];
    }
    if (trip.dest_coords) {
      var di = L.divIcon({ className: '', html: '<div style="width:15px;height:15px;background:#EF4444;border:2.5px solid #fff;border-radius:50%;box-shadow:0 1px 5px rgba(0,0,0,.35)"></div>', iconSize: [15,15], iconAnchor: [7,7] });
      L.marker([trip.dest_coords.lat, trip.dest_coords.lng], { icon: di }).addTo(detailMap).bindPopup('<b>Destination</b><br>' + trip.destination);
      bounds.push([trip.dest_coords.lat, trip.dest_coords.lng]);
      routeTo = [trip.dest_coords.lat, trip.dest_coords.lng];
    }
    if (trip.driver_position) {
      var dri = L.divIcon({ className: '', html: '<div style="width:17px;height:17px;background:#10B981;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 5px rgba(16,185,129,.28)"></div>', iconSize: [17,17], iconAnchor: [8,8] });
      detailDrvMarker = L.marker([trip.driver_position.lat, trip.driver_position.lng], { icon: dri }).addTo(detailMap)
        .bindPopup('<b>' + (trip.driver ? trip.driver.name : 'Driver') + '</b><br>En Route');
      bounds.push([trip.driver_position.lat, trip.driver_position.lng]);
      routeFrom = [trip.driver_position.lat, trip.driver_position.lng];
    }

    /* Dashed fallback line, replaced by OSRM polyline */
    var fallbackLine = null;
    if (routeFrom && routeTo) {
      fallbackLine = L.polyline([routeFrom, routeTo], { color: '#3B82F6', weight: 2.5, opacity: 0.4, dashArray: '8 5' }).addTo(detailMap);
      /* OSRM real road route */
      var mapSnap  = detailMap;
      var tripSnap = trip;
      fetch('https://router.project-osrm.org/route/v1/driving/' +
        routeFrom[1] + ',' + routeFrom[0] + ';' +
        routeTo[1]   + ',' + routeTo[0]   +
        '?overview=full&geometries=geojson')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data.routes || !data.routes[0] || !mapSnap._container) return;
          if (fallbackLine) { try { mapSnap.removeLayer(fallbackLine); } catch (_) {} }
          L.geoJSON(data.routes[0].geometry, { style: { color: '#3B82F6', weight: 3, opacity: 0.75 } }).addTo(mapSnap);
          if (tripSnap.status === 'en_route') {
            var mins  = Math.round(data.routes[0].duration / 60);
            var etaEl = document.getElementById('detailEta-' + tripSnap.id);
            if (etaEl) {
              etaEl.textContent = '~' + mins + ' min via road';
              etaEl.className  = 'disp-detail-value disp-detail-eta ' + etaClassForMins(mins);
            }
          }
        })
        .catch(function () { /* keep dashed line */ });
    }

    if (bounds.length > 1) detailMap.fitBounds(bounds, { padding: [28, 28] });
    setTimeout(function () { if (detailMap) detailMap.invalidateSize(); }, 120);
  }

  function updateDetailMapPosition() {
    if (!expandedTripId || !detailMap) return;
    var trip = allTrips.find(function (t) { return t.id === expandedTripId; });
    if (!trip || !trip.driver_position) return;
    if (detailDrvMarker) detailDrvMarker.setLatLng([trip.driver_position.lat, trip.driver_position.lng]);
    var eta = etaText(trip);
    var el  = document.getElementById('detailEta-' + expandedTripId);
    if (el) { el.textContent = eta.text; el.className = 'disp-detail-value disp-detail-eta ' + eta.cls; }
  }

  /* ── Tab navigation ── */
  var TAB_LABELS = { board: 'Dispatch Board', requests: 'Insurance Requests', newtrip: 'New Trip', drivers: 'Drivers' };
  var tabBarEl     = document.getElementById('dispTabBar');
  var tabToggleEl  = document.getElementById('dispTabToggle');
  var tabToggleLbl = document.getElementById('dispTabToggleLabel');

  document.querySelectorAll('.disp-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tab = this.dataset.tab;
      document.querySelectorAll('.disp-tab').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      document.getElementById('tabBoard').style.display    = tab === 'board'    ? '' : 'none';
      document.getElementById('tabRequests').style.display = tab === 'requests' ? '' : 'none';
      document.getElementById('tabNewtrip').style.display  = tab === 'newtrip'  ? '' : 'none';
      document.getElementById('tabDrivers').style.display  = tab === 'drivers'  ? '' : 'none';
      if (tab === 'requests') loadProposed();
      if (tab === 'drivers')  { closeDriverHistory(); loadDrivers(); }
      if (tabToggleLbl) tabToggleLbl.textContent = TAB_LABELS[tab] || TAB_LABELS.board;
      closeTabMenu();
    });
  });

  function closeTabMenu() {
    if (!tabBarEl) return;
    tabBarEl.classList.remove('open');
    if (tabToggleEl) tabToggleEl.setAttribute('aria-expanded', 'false');
  }

  if (tabToggleEl) {
    tabToggleEl.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = tabBarEl.classList.toggle('open');
      tabToggleEl.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (tabBarEl.classList.contains('open') && !tabBarEl.contains(e.target)) closeTabMenu();
    });
  }

  /* ── Drivers tab — history & total miles per driver ── */
  function loadDrivers() {
    var grid = document.getElementById('driversGrid');
    fetch('/api/dispatcher/drivers', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var drivers = d.drivers || [];
        if (!drivers.length) { grid.innerHTML = '<div class="disp-empty"><p>No drivers found.</p></div>'; return; }
        grid.innerHTML = drivers.map(function (drv) {
          return '<div class="disp-driver-card" onclick="viewDriverHistory(' + drv.id + ')">' +
            '<div class="disp-driver-card-top">' +
              '<div class="disp-driver-avatar">' + escHtml(drv.name.split(' ').map(function(p){return p[0];}).join('')) + '</div>' +
              '<div><div class="disp-driver-card-name">' + escHtml(drv.name) + '</div>' +
              '<div class="disp-driver-card-vehicle">' + escHtml(drv.vehicle) + ' · ' + escHtml(drv.plate) + '</div></div>' +
            '</div>' +
            '<div class="disp-driver-card-stats">' +
              '<span><strong>' + drv.totalTrips + '</strong> trips</span>' +
              '<span><strong>' + drv.totalMiles + '</strong> mi total</span>' +
              (drv.abandoned > 0 ? '<span class="disp-driver-warn"><strong>' + drv.abandoned + '</strong> abandoned</span>' : '') +
            '</div>' +
          '</div>';
        }).join('');
      })
      .catch(function () { grid.innerHTML = '<div class="disp-empty"><p>Could not load drivers.</p></div>'; });
  }

  window.viewDriverHistory = function (driverId) {
    fetch('/api/dispatcher/drivers/' + driverId + '/history', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.driver) return;
        document.getElementById('driversGrid').style.display       = 'none';
        document.getElementById('driverHistoryPanel').style.display = '';
        document.getElementById('dhName').textContent    = d.driver.name;
        document.getElementById('dhVehicle').textContent = d.driver.vehicle + ' · ' + d.driver.plate + ' · ⭐ ' + d.driver.rating;
        document.getElementById('dhTotalTrips').textContent = d.totalTrips;
        document.getElementById('dhTotalMiles').textContent = d.totalMiles + ' mi';
        document.getElementById('dhCompleted').textContent  = d.history.filter(function(h){ return h.status === 'completed'; }).length;
        document.getElementById('dhAbandoned').textContent  = d.history.filter(function(h){ return h.status === 'abandoned'; }).length;
        _driverHistory = d.history;
        _dhExpandedIdx = null;
        var mount = document.getElementById('dhEvidenceMount');
        if (mount) mount.innerHTML = '';
        var body = document.getElementById('dhHistoryBody');
        if (!d.history.length) {
          body.innerHTML = '<tr><td colspan="6"><div class="disp-empty"><p>No trip history yet.</p></div></td></tr>';
          return;
        }
        body.innerHTML = d.history.map(function (h, idx) {
          var hasEvidence = h.notes || h.photo;
          var evidence = hasEvidence
            ? '<button class="disp-cabin-btn" id="dhEvBtn-' + idx + '" onclick="toggleDhEvidence(' + idx + ')">' + (h.photo ? '📷' : '📝') + ' View ' + (h.photo && h.notes ? 'Note' : h.photo ? 'Photo' : 'Note') + '</button>'
            : '<span class="unassigned">—</span>';
          return '<tr>' +
            '<td><span class="trip-num">' + escHtml(h.tripNumber) + '</span></td>' +
            '<td>' + escHtml(h.patientName) + '</td>' +
            '<td>' + statusBadge(h.status) + '</td>' +
            '<td>' + new Date(h.loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + '</td>' +
            '<td>' + (h.miles != null ? h.miles + ' mi' : '—') + '</td>' +
            '<td>' + evidence + '</td>' +
          '</tr>';
        }).join('');
      })
      .catch(function () { showToast('Could not load driver history.', 'error'); });
  };

  window.toggleDhEvidence = function (idx) {
    var mount = document.getElementById('dhEvidenceMount');
    var entry = _driverHistory[idx];
    if (!mount || !entry) return;

    if (_dhExpandedIdx !== null) {
      var prevBtn = document.getElementById('dhEvBtn-' + _dhExpandedIdx);
      if (prevBtn) prevBtn.classList.remove('live');
    }
    if (_dhExpandedIdx === idx) {
      mount.innerHTML = '';
      _dhExpandedIdx = null;
      return;
    }
    _dhExpandedIdx = idx;
    var btn = document.getElementById('dhEvBtn-' + idx);
    if (btn) btn.classList.add('live');

    mount.innerHTML =
      '<div class="disp-dh-evidence">' +
        '<div class="disp-dh-evidence-head">' +
          '<span class="trip-num">' + escHtml(entry.tripNumber) + '</span>' + statusBadge(entry.status) +
          '<button class="disp-modal-close" onclick="toggleDhEvidence(' + idx + ')">✕</button>' +
        '</div>' +
        (entry.notes ? '<div class="disp-dh-evidence-notes">' + escHtml(entry.notes) + '</div>' : '<div class="disp-dh-evidence-notes unassigned">No written notes for this trip.</div>') +
        (entry.photo ? '<img class="disp-dh-evidence-photo" src="' + entry.photo + '" alt="Evidence photo" onclick="viewEvidencePhoto(' + escHtml(JSON.stringify(entry.photo)) + ')">' : '') +
      '</div>';
    mount.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  window.closeDriverHistory = function () {
    document.getElementById('driverHistoryPanel').style.display = 'none';
    document.getElementById('driversGrid').style.display        = '';
    var mount = document.getElementById('dhEvidenceMount');
    if (mount) mount.innerHTML = '';
    _dhExpandedIdx = null;
  };

  window.viewEvidencePhoto = function (dataUrl) {
    document.getElementById('evidenceModalImg').src = dataUrl;
    document.getElementById('evidenceModal').classList.add('open');
  };
  window.closeEvidenceModal = function () {
    document.getElementById('evidenceModal').classList.remove('open');
  };

  /* ── Insurance Requests ── */
  function updateRequestsBadge(n) {
    var badge = document.getElementById('requestsBadge');
    if (!badge) return;
    if (n > 0) { badge.textContent = n; badge.style.display = 'inline'; } else { badge.style.display = 'none'; }
  }

  function loadProposed() {
    fetch('/api/dispatcher/proposed', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var accepted = JSON.parse(sessionStorage.getItem('disp-accepted') || '[]');
        var rejected = JSON.parse(sessionStorage.getItem('disp-rejected') || '[]');
        proposedTrips = (d.proposed || []).filter(function (t) {
          return accepted.indexOf(t.id) === -1 && rejected.indexOf(t.id) === -1;
        });
        renderRequests(proposedTrips, d.drivers || allDrivers);
        updateRequestsBadge(proposedTrips.length);
        calcProposedMiles(proposedTrips);
      }).catch(function () {});
  }

  var REQ_EMPTY_HTML = '<div class="disp-req-empty">' +
    '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">' +
    '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>' +
    '<polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' +
    '<p>No pending insurance requests.</p></div>';

  function renderRequests(trips, drivers) {
    var list = document.getElementById('requestsList');
    if (!list) return;
    if (!trips.length) { list.innerHTML = REQ_EMPTY_HTML; return; }
    var driverOpts = '<option value="">— Unassigned —</option>' +
      (drivers || allDrivers).map(function (d) { return '<option value="' + d.id + '">' + escHtml(d.name) + '</option>'; }).join('');
    list.innerHTML = trips.map(function (t) {
      var time  = new Date(t.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      var notes = t.notes ? '<div class="disp-req-notes">⚠ ' + escHtml(t.notes) + '</div>' : '';
      return '<div class="disp-req-card" id="reqCard-' + t.id + '">' +
        '<div class="disp-req-head"><div class="disp-req-meta"><div class="disp-req-num">' + escHtml(t.number) + '</div>' +
        '<span class="disp-req-insurance">' + escHtml(t.insurance) + '</span></div><span class="disp-req-time">' + time + '</span></div>' +
        '<div class="disp-req-patient">' + escHtml(t.patient_name) + '</div>' +
        '<div class="disp-req-route"><div class="disp-req-route-from">' + escHtml(t.pickup) + '</div><div class="disp-req-route-to">' + escHtml(t.destination) + '</div>' +
        '<div class="disp-req-distance" id="reqMiles-' + t.id + '">' + (t.distance_miles != null ? t.distance_miles + ' mi via road' : '📍 Calculating miles…') + '</div></div>' +
        notes +
        '<div class="disp-req-assign"><select id="reqDrv-' + t.id + '">' + driverOpts + '</select>' +
        '<button class="disp-req-accept" onclick="acceptProposed(' + t.id + ')">✓ Accept</button>' +
        '<button class="disp-req-reject" onclick="rejectProposed(' + t.id + ')">✕ Reject</button></div>' +
      '</div>';
    }).join('');
  }

  window.acceptProposed = function (id) {
    var sel      = document.getElementById('reqDrv-' + id);
    var driverId = sel ? sel.value : '';
    var trip     = proposedTrips.find(function (t) { return t.id === id; });
    if (driverId && trip && driverHasOverlap(Number(driverId), trip.scheduled_at, null)) {
      showToast('Warning: driver already has a nearby trip at this time', 'warning', 4500);
    }
    var card = document.getElementById('reqCard-' + id);
    if (card) { card.style.opacity = '.5'; card.style.pointerEvents = 'none'; }
    fetch('/api/dispatcher/proposed/' + id + '/accept', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId: driverId ? Number(driverId) : null })
    }).then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.ok) { if (card) { card.style.opacity = '1'; card.style.pointerEvents = ''; } return; }
        var accepted = JSON.parse(sessionStorage.getItem('disp-accepted') || '[]');
        accepted.push(id); sessionStorage.setItem('disp-accepted', JSON.stringify(accepted));
        if (card) card.remove();
        proposedTrips = proposedTrips.filter(function (t) { return t.id !== id; });
        updateRequestsBadge(proposedTrips.length);
        if (!proposedTrips.length) document.getElementById('requestsList').innerHTML = REQ_EMPTY_HTML;
        var newTrip = Object.assign({}, data.trip, {
          driver:         data.trip.driver || null,
          driver_position: null,
          pickup_coords:  trip ? (trip.pickup_coords  || null) : null,
          dest_coords:    trip ? (trip.dest_coords    || null) : null,
          distance_miles: trip ? trip.distance_miles           : undefined
        });
        allTrips.push(newTrip);
        renderTable(allTrips);
        fetch('/api/dispatcher/stats', { credentials: 'same-origin' }).then(function(r){return r.json();}).then(renderStats).catch(function(){});
        showToast((trip ? trip.number : 'Request') + ' accepted and added to dispatch board', 'success');
        /* If we don't have miles yet, calculate now */
        if (newTrip.distance_miles === undefined) {
          calcTripMiles(newTrip).then(function(miles) { updateTripMilesUI(newTrip.id, miles); });
        }
      }).catch(function () { if (card) { card.style.opacity = '1'; card.style.pointerEvents = ''; } });
  };

  window.rejectProposed = function (id) {
    var trip = proposedTrips.find(function (t) { return t.id === id; });
    var name = trip ? trip.patient_name : 'this request';
    showConfirm(
      'Reject Insurance Request',
      'Reject trip request for ' + name + '? This cannot be undone.',
      function () {
        var card = document.getElementById('reqCard-' + id);
        if (card) { card.style.opacity = '.35'; card.style.pointerEvents = 'none'; }
        fetch('/api/dispatcher/proposed/' + id + '/reject', { method: 'POST', credentials: 'same-origin' })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (!data.ok) { if (card) { card.style.opacity = '1'; card.style.pointerEvents = ''; } return; }
            var rejected = JSON.parse(sessionStorage.getItem('disp-rejected') || '[]');
            rejected.push(id); sessionStorage.setItem('disp-rejected', JSON.stringify(rejected));
            if (card) setTimeout(function () { card.remove(); }, 250);
            proposedTrips = proposedTrips.filter(function (t) { return t.id !== id; });
            updateRequestsBadge(proposedTrips.length);
            if (!proposedTrips.length) setTimeout(function () { document.getElementById('requestsList').innerHTML = REQ_EMPTY_HTML; }, 300);
            showToast('Insurance request rejected', 'warning');
          }).catch(function () { if (card) { card.style.opacity = '1'; card.style.pointerEvents = ''; } });
      }
    );
  };

  /* ── New Trip form ── */
  window.submitNewTrip = function (e) {
    e.preventDefault();
    var patient   = document.getElementById('ntPatient').value.trim();
    var insurance = document.getElementById('ntInsurance').value;
    var pickup    = document.getElementById('ntPickup').value.trim();
    var dest      = document.getElementById('ntDest').value.trim();
    var date      = document.getElementById('ntDate').value;
    var time      = document.getElementById('ntTime').value;
    var driverId  = document.getElementById('ntDriver').value;
    var notes     = document.getElementById('ntNotes').value.trim();
    var msg       = document.getElementById('ntMsg');

    if (!patient || !pickup || !dest || !date || !time) {
      msg.className = 'disp-form-msg error'; msg.textContent = 'Please fill in all required fields.'; return;
    }

    var scheduledAt = new Date(date + 'T' + time + ':00').toISOString();
    if (driverId && driverHasOverlap(Number(driverId), scheduledAt, null)) {
      showToast('Warning: driver already has a trip near this time', 'warning', 4500);
    }

    var btn = e.target.querySelector('[type="submit"]');
    btn.disabled = true; msg.className = 'disp-form-msg'; msg.textContent = 'Creating…';

    fetch('/api/dispatcher/trips', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_name: patient, pickup: pickup, destination: dest, scheduled_at: scheduledAt, insurance: insurance, notes: notes, driver_id: driverId ? Number(driverId) : null })
    }).then(function (r) { return r.json(); })
      .then(function (data) {
        btn.disabled = false;
        if (!data.ok) { msg.className = 'disp-form-msg error'; msg.textContent = data.error || 'Error creating trip.'; return; }
        msg.className = 'disp-form-msg success'; msg.textContent = data.trip.number + ' created.';
        e.target.reset();
        document.getElementById('ntDate').value = new Date().toISOString().slice(0, 10);
        var newTrip = Object.assign({}, data.trip, { driver: data.trip.driver || null, driver_position: null });
        allTrips.push(newTrip);
        renderTable(allTrips);
        if (data.stats) renderStats(data.stats);
        showToast('Trip ' + data.trip.number + ' created successfully', 'success');
        /* Geocode addresses and calculate road miles in background */
        calcTripMiles(newTrip).then(function(miles) { updateTripMilesUI(newTrip.id, miles); });
        setTimeout(function () { msg.textContent = ''; msg.className = 'disp-form-msg'; }, 4000);
      }).catch(function () {
        btn.disabled = false; msg.className = 'disp-form-msg error'; msg.textContent = 'Connection error. Try again.';
      });
  };

})();
