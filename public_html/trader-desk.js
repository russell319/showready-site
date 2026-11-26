/* ShowReady Build 103: "Pitch applications" on the supplier desk.
   Shows a trader's applications to markets and events (from /apply/ links), where each is up to,
   their pitch once approved and the organiser's messages. Traders can withdraw while it's undecided. */
(function () {
  'use strict';
  if (window.SRTraderDesk) return;
  var D = window.SRTraderDesk = { list: [], box: null };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var STATUS = { applied: 'Sent, waiting for the organiser', approved: 'Approved', waitlist: 'Waiting list', declined: 'Not this time', withdrawn: 'You withdrew' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nice(d) { if (!d) return ''; var x = new Date(String(d).slice(0, 10) + 'T12:00:00Z'); return isNaN(x) ? '' : x.getUTCDate() + ' ' + MONTHS[x.getUTCMonth()] + ' ' + x.getUTCFullYear(); }

  var css = '.td-box{margin:18px 0;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:16px}.td-box h2{margin:0 0 4px}' +
    '.td-list{display:flex;flex-direction:column;gap:10px;margin-top:10px}.td-item{border:1px solid var(--line);border-radius:14px;padding:12px 14px}' +
    '.td-item header{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:baseline}.td-item h3{margin:0;font-size:16px}' +
    '.td-st{font-size:12px;font-weight:800;padding:3px 9px;border-radius:999px;background:var(--surface-2)}.td-st.approved{background:#DDF0E4;color:#1E5A43}.td-st.declined,.td-st.withdrawn{background:#F3E3E1;color:#8A2D22}.td-st.waitlist{background:#FBF0D9;color:#7A5300}' +
    '.td-msgs{margin:8px 0 0;padding-left:18px;font-size:14px}.td-msgs li{margin:4px 0;white-space:pre-wrap}.td-small{font-size:13px;color:var(--muted)}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function client() { var A = window.SRAccount; return A && A.user && A.client ? A.client : null; }

  D.load = function () {
    var c = client(); if (!c) return;
    c.rpc('my_market_applications').then(function (r) {
      if (r.error) return;
      D.list = r.data || [];
      draw();
    });
  };

  function draw() {
    if (!D.list.length) { if (D.box) D.box.hidden = true; return; }
    if (!D.box) {
      D.box = document.createElement('section'); D.box.className = 'td-box'; D.box.id = 'pitchApps'; D.box.setAttribute('aria-labelledby', 'tdTitle');
      var anchor = document.getElementById('reviews');
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(D.box, anchor); else (document.getElementById('desk') || document.body).appendChild(D.box);
    }
    D.box.hidden = false;
    var h = '<h2 id="tdTitle">Pitch applications</h2><p class="td-small">Markets and events you’ve applied to through a ShowReady link. You’ll get an email when an organiser decides or sends a message.</p><div class="td-list">';
    D.list.forEach(function (a) {
      var m = a.market || {};
      h += '<article class="td-item"><header><h3>' + esc(m.name) + (m.event_date ? ' · ' + esc(nice(m.event_date)) : '') + '</h3><span class="td-st ' + esc(a.status) + '">' + esc(STATUS[a.status] || a.status) + (a.status === 'approved' && a.pitch ? ' · pitch ' + esc(a.pitch) : '') + '</span></header>' +
        '<p class="td-small" style="margin:4px 0 0">As ' + esc(a.business) + ' · applied ' + esc(nice(a.created_at)) + (a.status === 'approved' ? (a.paid ? ' · pitch fee marked paid' : '') : '') + '</p>' +
        (a.status === 'approved' && m.fee_note ? '<p class="td-small" style="margin:4px 0 0;white-space:pre-wrap">Pitch fees: ' + esc(m.fee_note) + '</p>' : '') +
        ((a.messages || []).length ? '<ul class="td-msgs">' + a.messages.map(function (x) { return '<li><span class="td-small">' + esc(nice(x.at)) + ':</span> ' + esc(x.body) + '</li>'; }).join('') + '</ul>' : '') +
        '<p style="margin:8px 0 0;display:flex;gap:8px;flex-wrap:wrap">' +
        (a.status === 'applied' || a.status === 'waitlist' ? '<a class="btn small" href="/apply/?m=' + esc(m.code) + '">Change my application</a><button class="btn small" type="button" data-tdw="' + esc(a.id) + '">Withdraw</button>' : '') +
        (a.status === 'withdrawn' ? '<a class="btn small" href="/apply/?m=' + esc(m.code) + '">Apply again</a>' : '') + '</p></article>';
    });
    D.box.innerHTML = h + '</div>';
    if (/[?&]markets=open\b/.test(location.search)) { try { D.box.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {} }
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-tdw]'); if (!b) return;
    if (!confirm('Withdraw this application? The organiser will see that you withdrew.')) return;
    var c = client(); if (!c) return;
    b.disabled = true;
    c.rpc('market_withdraw', { p_app: b.getAttribute('data-tdw') }).then(function (r) { if (r.error) { b.disabled = false; alert(r.error.message); return; } D.load(); });
  });

  // Load once the account panel has signed the person in
  var tries = 0, t = setInterval(function () {
    if (client()) { clearInterval(t); D.load(); }
    else if (++tries > 60) clearInterval(t);
  }, 500);
})();
