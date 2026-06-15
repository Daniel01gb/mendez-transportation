/* auth.js — Login flow + portal trip verification (API-backed) */

(function () {

  /* ── Logout (called from portal.html) ── */
  window.portalLogout = function () {
    fetch('/api/auth/logout', { method: 'POST' }).finally(function () {
      sessionStorage.removeItem('mendez_trip_verified');
      window.location.href = 'login.html';
    });
  };

  /* ══════════ PORTAL — Trip verification overlay ══════════ */
  var tripOverlay = document.getElementById('tripVerifyOverlay');
  if (tripOverlay) {

    /* Check auth first — if cookie expired, send back to login */
    fetch('/api/auth/me', { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) window.location.href = 'login.html';
    });

    if (sessionStorage.getItem('mendez_trip_verified') === '1') {
      tripOverlay.style.display = 'none';
    } else {
      var pVerifyBtn   = document.getElementById('portalVerifyBtn');
      var pTripInput   = document.getElementById('portalTripNumber');
      var pConfInput   = document.getElementById('portalConfCode');
      var pVerifyError = document.getElementById('portalVerifyError');

      pVerifyBtn.addEventListener('click', handlePortalVerify);
      pTripInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') handlePortalVerify(); });
      pConfInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') handlePortalVerify(); });

      function handlePortalVerify() {
        var trip = pTripInput.value.trim();
        var conf = pConfInput.value.trim();
        hideError(pVerifyError);

        if (!trip) return showError(pVerifyError, 'Please enter your trip number.');
        if (!/^\d{4,6}$/.test(conf)) return showError(pVerifyError, 'Please enter your confirmation code.');

        pVerifyBtn.classList.add('loading');
        pVerifyBtn.disabled = true;

        fetch('/api/auth/verify-trip', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ tripNumber: trip, confirmCode: conf }),
          credentials: 'same-origin'
        })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
          if (!res.ok) {
            showError(pVerifyError, res.data.error || 'Trip not found. Check your details.');
            pVerifyBtn.classList.remove('loading');
            pVerifyBtn.disabled = false;
            return;
          }
          sessionStorage.setItem('mendez_trip_verified', '1');
          tripOverlay.classList.add('trip-overlay-out');
          setTimeout(function () { tripOverlay.style.display = 'none'; }, 420);
        })
        .catch(function () {
          showError(pVerifyError, 'Connection error. Please try again.');
          pVerifyBtn.classList.remove('loading');
          pVerifyBtn.disabled = false;
        });
      }
    }
    return; /* stop — rest of file is login-only */
  }

  /* ══════════ LOGIN PAGE ══════════ */
  var loginStep = document.getElementById('loginStep');
  if (!loginStep) return;

  /* If cookie is still valid → redirect to correct dashboard by role */
  fetch('/api/auth/me', { credentials: 'same-origin' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (d) window.location.href = d.role === 'dispatcher' ? 'dispatcher.html' : d.role === 'driver' ? 'driver.html' : 'portal.html';
    });

  /* ── Elements ── */
  var verifyStep  = document.getElementById('verifyStep');
  var loginBtn    = document.getElementById('loginBtn');
  var verifyBtn   = document.getElementById('verifyBtn');
  var backBtn     = document.getElementById('backBtn');
  var resendLink  = document.getElementById('resendLink');
  var resendLabel = document.getElementById('resendLabel');
  var loginError  = document.getElementById('loginError');
  var verifyError = document.getElementById('verifyError');
  var codeInputs  = Array.from(document.querySelectorAll('.code-digit'));
  var togglePw    = document.getElementById('togglePw');
  var passwordEl  = document.getElementById('password');
  var resendInterval = null;
  var pendingEmail   = '';  /* stored after step 1 to use in step 2 */

  /* ── Password show/hide ── */
  var eyeOpen   = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  var eyeClosed = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
  togglePw.addEventListener('click', function () {
    var hidden = passwordEl.type === 'password';
    passwordEl.type    = hidden ? 'text' : 'password';
    togglePw.innerHTML = hidden ? eyeClosed : eyeOpen;
  });

  /* ── Step 1: Sign In ── */
  loginBtn.addEventListener('click', handleStep1);
  document.getElementById('email').addEventListener('keydown',    function (e) { if (e.key === 'Enter') handleStep1(); });
  document.getElementById('password').addEventListener('keydown', function (e) { if (e.key === 'Enter') handleStep1(); });

  function handleStep1() {
    var email = document.getElementById('email').value.trim();
    var pass  = document.getElementById('password').value;
    hideError(loginError);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return showError(loginError, 'Please enter a valid email address.');
    if (!pass)
      return showError(loginError, 'Please enter your password.');

    loginBtn.classList.add('loading');
    loginBtn.disabled = true;

    fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: email, password: pass }),
      credentials: 'same-origin'
    })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      loginBtn.classList.remove('loading');
      loginBtn.disabled = false;

      if (!res.ok) return showError(loginError, res.data.error || 'Invalid email or password.');

      pendingEmail = email;
      document.getElementById('maskedEmail').textContent = res.data.maskedEmail;
      showVerifyStep();
    })
    .catch(function () {
      loginBtn.classList.remove('loading');
      loginBtn.disabled = false;
      showError(loginError, 'Connection error. Please try again.');
    });
  }

  function setStepIndicator(n) {
    [1, 2, 3].forEach(function (i) {
      var item  = document.getElementById('si' + i);
      var track = document.getElementById('st' + i);
      if (!item) return;
      item.classList.remove('active', 'done');
      if (i < n)  item.classList.add('done');
      if (i === n) item.classList.add('active');
      if (track) track.classList.toggle('done', i < n);
    });
  }

  function showVerifyStep() {
    setStepIndicator(2);
    loginStep.style.display  = 'none';
    verifyStep.style.display = 'flex';
    codeInputs.forEach(function (inp) { inp.value = ''; inp.classList.remove('filled'); });
    hideError(verifyError);
    startResendTimer();
    setTimeout(function () { if (codeInputs[0]) codeInputs[0].focus(); }, 80);
  }

  /* ── Code digit inputs ── */
  codeInputs.forEach(function (inp, i) {
    inp.addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '').slice(0, 1);
      this.classList.toggle('filled', !!this.value);
      if (this.value && i < codeInputs.length - 1) codeInputs[i + 1].focus();
      var code = codeInputs.map(function (c) { return c.value; }).join('');
      if (code.length === 6) setTimeout(handleVerify, 280);
    });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !this.value && i > 0)              codeInputs[i - 1].focus();
      if (e.key === 'ArrowLeft'  && i > 0)          { e.preventDefault(); codeInputs[i - 1].focus(); }
      if (e.key === 'ArrowRight' && i < codeInputs.length - 1) { e.preventDefault(); codeInputs[i + 1].focus(); }
    });
    inp.addEventListener('paste', function (e) {
      e.preventDefault();
      var pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      pasted.slice(0, 6).split('').forEach(function (ch, j) {
        if (codeInputs[j]) { codeInputs[j].value = ch; codeInputs[j].classList.add('filled'); }
      });
      var last = Math.min(pasted.length, 6) - 1;
      if (codeInputs[last]) codeInputs[last].focus();
      if (pasted.length >= 6) setTimeout(handleVerify, 280);
    });
  });

  /* ── Step 2: Verify 2FA code ── */
  verifyBtn.addEventListener('click', handleVerify);

  function handleVerify() {
    var code = codeInputs.map(function (c) { return c.value; }).join('');
    hideError(verifyError);
    if (code.length !== 6) return showError(verifyError, 'Please enter the complete 6-digit code.');

    verifyBtn.classList.add('loading');
    verifyBtn.disabled = true;

    var rememberDevice = !!(document.getElementById('trustDevice') && document.getElementById('trustDevice').checked);

    fetch('/api/auth/verify-2fa', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: pendingEmail, code: code, rememberDevice: rememberDevice }),
      credentials: 'same-origin'
    })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      if (!res.ok) {
        showError(verifyError, res.data.error || 'Incorrect code. Please try again.');
        verifyBtn.classList.remove('loading');
        verifyBtn.disabled = false;
        return;
      }
      verifyBtn.innerHTML = '&#10003; Verified!';
      verifyBtn.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
      verifyBtn.style.color      = '#fff';
      var dest = res.data.role === 'dispatcher' ? 'dispatcher.html' : res.data.role === 'driver' ? 'driver.html' : 'portal.html';
      setTimeout(function () { window.location.href = dest; }, 600);
    })
    .catch(function () {
      showError(verifyError, 'Connection error. Please try again.');
      verifyBtn.classList.remove('loading');
      verifyBtn.disabled = false;
    });
  }

  /* ── Back ── */
  backBtn.addEventListener('click', function () {
    setStepIndicator(1);
    verifyStep.style.display = 'none';
    loginStep.style.display  = 'flex';
    hideError(verifyError);
    clearInterval(resendInterval);
  });

  /* ── Resend timer ── */
  function startResendTimer() {
    var seconds = 30;
    resendLink.style.opacity      = '0.38';
    resendLink.style.pointerEvents = 'none';
    resendLabel.textContent       = '(30s)';
    clearInterval(resendInterval);
    resendInterval = setInterval(function () {
      seconds--;
      resendLabel.textContent = seconds > 0 ? '(' + seconds + 's)' : '';
      if (seconds <= 0) {
        clearInterval(resendInterval);
        resendLink.style.opacity       = '1';
        resendLink.style.pointerEvents = 'auto';
      }
    }, 1000);
  }

  resendLink.addEventListener('click', function (e) {
    e.preventDefault();
    if (this.style.pointerEvents === 'none') return;
    codeInputs.forEach(function (inp) { inp.value = ''; inp.classList.remove('filled'); });
    startResendTimer();
    if (codeInputs[0]) codeInputs[0].focus();

    if (pendingEmail) {
      fetch('/api/auth/resend-2fa', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: pendingEmail }),
        credentials: 'same-origin'
      }).catch(function () { /* silent — code already queued */ });
    }
  });

  /* ── Helpers ── */
  function showError(el, msg) {
    el.querySelector('span').textContent = msg;
    el.style.display = 'flex';
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }
  function hideError(el) {
    el.style.display = 'none';
    el.classList.remove('shake');
  }
})();
