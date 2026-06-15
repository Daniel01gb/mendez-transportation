/* dispatcher.js — Dispatcher panel logic */
(function () {

  var allTrips   = [];
  var allDrivers = [];
  var dispMap    = null;
  var markers    = {};
  var activeFilter = 'all';
  var editingId    = null;

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
      fetch('/api/dispatcher/trips',  { credentials: 'same-origin' }).then(function(r){return r.json();}),
      fetch('/api/dispatcher/stats',  { credentials: 'same-origin' }).then(function(r){return r.json();})
    ]).then(function (results) {
      var tripsData = results[0];
      var stats     = results[1];
      allTrips   = tripsData.trips;
      allDrivers = tripsData.drivers;
      renderStats(stats);
      renderTable(allTrips);
      initMap(allTrips);
      populateDriverDropdown(allDrivers);
    }).catch(function () {
      window.location.href = 'login.html';
    });
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
      return [
        '<tr data-id="' + t.id + '">',
        '  <td><span class="trip-num">' + t.number.replace('MT-2026-', '#') + '</span></td>',
        '  <td><span class="patient-name">' + t.patient_name + '</span></td>',
        '  <td>' + statusBadge(t.status) + '</td>',
        '  <td><span class="trip-time">' + time + '</span></td>',
        '  <td class="driver-cell">' + driver + '</td>',
        '  <td class="route-cell"><span class="route-from">' + from + '</span><span class="route-arrow">→</span>' + to + '</td>',
        '  <td><button class="disp-edit-btn" onclick="openEdit(' + t.id + ')">Edit</button></td>',
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
