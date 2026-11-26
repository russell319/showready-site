/* ShowReady Build 110: "Your acts" on the supplier desk, for entertainment agencies.
   Each act is its own entry (supplier_units, kind 'act') with its own types, 18+ setting and details.
   Organisers see each act as its own listing, booked through the agency; enquiries come to the agency's desk. */
(function () {
  'use strict';
  if (window.SRActs) return;
  var X = window.SRActs = { list: [], lim: null, box: null, editing: null, sig: '', busy: false, err: '' };
  var AUD = [['family', 'Families'], ['under5', 'Under 5s'], ['children', 'Children (5 to 11)'], ['teens', 'Teens (12 to 17)'], ['adults', 'Adults (18+)']];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function acct() { return window.SRAccount; }
  function client() { var A = acct(); return A && A.user && A.client ? A.client : null; }
  function owner() { var A = acct(); return A && A.user ? (A.owner ? A.owner() : A.user.id) : null; }
  function profile() { return (window.SRDesk && window.SRDesk.profile && window.SRDesk.profile()) || {}; }
  function types() { var c = window.SRCat && window.SRCat.find('entertainment'); return (c && c.chips) || []; }
  function $(id) { return document.getElementById(id); }

  var css = '.ac-box{margin:18px 0;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:16px}.ac-box h2{margin:0 0 4px}' +
    '.ac-list{list-style:none;margin:10px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}.ac-list li{border:1px solid var(--line);border-radius:14px;padding:10px 12px;display:flex;gap:10px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}' +
    '.ac-list b{display:block}.ac-small{font-size:13px;color:var(--muted)}.ac-form{border:1.5px solid var(--brand);border-radius:14px;padding:14px;margin-top:12px;display:flex;flex-direction:column;gap:10px}' +
    '.ac-form label{font-weight:700;font-size:14px;display:flex;flex-direction:column;gap:4px}.ac-form input[type=text],.ac-form input[type=number],.ac-form textarea,.ac-form select{font:inherit;font-size:15px;border:1px solid var(--line);border-radius:8px;padding:8px;background:var(--surface);color:var(--ink)}' +
    '.ac-chips{display:flex;flex-wrap:wrap;gap:6px}.ac-chips button{min-height:36px;padding:0 12px;border-radius:999px;border:1.5px solid var(--line);background:var(--surface);color:var(--ink);font:inherit;font-size:14px;font-weight:600;cursor:pointer}' +
    '.ac-chips button[aria-pressed="true"]{background:var(--brand);border-color:var(--brand);color:var(--brand-ink,#fff)}.ac-row{display:flex;gap:10px;flex-wrap:wrap}.ac-row label{flex:1 1 120px}.ac-err{color:var(--bad,#8A2D22);font-weight:700;margin:0}' +
    '.ac-tick{flex-direction:row!important;align-items:center;gap:8px!important}.ac-tick input{width:auto;min-height:0}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function shouldShow() { var p = profile(); return !!(p.saved && p.agency && client()); }

  X.load = function () {
    var c = client(), o = owner(); if (!c || !o) return;
    X.busy = true;
    Promise.all([
      c.from('supplier_units').select('id, name, chips, details, adult_content, audiences, about').eq('owner', o).eq('kind', 'act').order('created_at'),
      c.rpc('my_act_limits')
    ]).then(function (r) {
      X.busy = false;
      if (r[0].error) { X.list = []; X.err = 'Acts can’t be loaded just yet. We’re switching this on: try again later today.'; }
      else { X.list = r[0].data || []; X.err = ''; }
      X.lim = r[1] && !r[1].error && r[1].data ? r[1].data[0] || null : null;
      draw();
    }, function () { X.busy = false; X.err = 'Couldn’t load your acts. Check your connection and try again.'; draw(); });
  };

  function limitLine() {
    var l = X.lim, n = X.list.length; if (!l) return '';
    if (l.acts >= 1000) return 'Enterprise: no limit on acts. You’ve listed ' + n + '.';
    if (!l.acts) return 'Listing acts needs the Agency plan: £65 a month + VAT (£78), for up to 20 acts, 3 logins and national coverage.';
    return 'You’ve listed ' + n + ' of ' + l.acts + ' acts. For more than ' + l.acts + ', move to Enterprise.';
  }
  function full() { var l = X.lim; return !!l && l.acts < 1000 && X.list.length >= l.acts; }

  function formHtml(a) {
    a = a || { name: '', chips: [], details: {}, adult_content: false, audiences: [], about: '' };
    var d = a.details || {};
    return '<form class="ac-form" id="acForm" novalidate><h3 style="margin:0;font-size:17px">' + (a.id ? 'Edit ' + esc(a.name) : 'Add an act') + '</h3>' +
      '<label for="acName">Act name, as organisers will see it<input type="text" id="acName" maxlength="80" value="' + esc(a.name) + '"></label>' +
      '<div><span style="font-weight:700;font-size:14px">What kind of act? Tick all that fit</span><div class="ac-chips" id="acTypes" role="group" aria-label="Act types">' +
        types().map(function (t) { var on = (a.chips || []).indexOf(t) > -1; return '<button type="button" data-ac-type="' + esc(t) + '" aria-pressed="' + on + '">' + esc(t) + '</button>'; }).join('') + '</div></div>' +
      '<label class="ac-tick"><input type="checkbox" id="acAdult"' + (a.adult_content ? ' checked' : '') + '> This act includes adult material (18+ only)</label>' +
      '<p class="ac-small" style="margin:-6px 0 0">Adult acts are only shown to organisers whose audience is adults only, never for children, teens or family events.</p>' +
      '<div id="acAudRow"' + (a.adult_content ? ' hidden' : '') + '><span style="font-weight:700;font-size:14px">Audiences this act works for <span style="font-weight:500">(leave blank for any)</span></span><div class="ac-chips" id="acAud" role="group" aria-label="Audiences">' +
        AUD.map(function (x) { var on = (a.audiences || []).indexOf(x[0]) > -1; return '<button type="button" data-ac-aud="' + x[0] + '" aria-pressed="' + on + '">' + esc(x[1]) + '</button>'; }).join('') + '</div></div>' +
      '<div class="ac-row"><label for="acSet">Set length (minutes)<input type="number" id="acSet" min="0" value="' + esc(d.set_minutes || '') + '"></label>' +
        '<label for="acSets">Sets per booking<input type="number" id="acSets" min="0" value="' + esc(d.sets || '') + '"></label>' +
        '<label for="acPa">Brings own PA<select id="acPa"><option value=""></option><option' + (d.own_pa === 'Yes' ? ' selected' : '') + '>Yes</option><option' + (d.own_pa === 'No' ? ' selected' : '') + '>No</option></select></label>' +
        '<label for="acPower">Power<select id="acPower"><option value=""></option>' + ['Own generator', 'Needs a hook-up', 'No power needed'].map(function (o) { return '<option' + (d.power === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></label></div>' +
      '<label for="acAbout">About this act<textarea id="acAbout" maxlength="280" rows="2" placeholder="e.g. Five-piece soul and Motown band, two 60-minute sets, first dance learned to order">' + esc(a.about || '') + '</textarea></label>' +
      '<p class="ac-err" id="acErr" role="alert" hidden></p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" type="submit">' + (a.id ? 'Save act' : 'Add act') + '</button><button class="btn" type="button" data-ac="cancel">Cancel</button></div></form>';
  }

  function draw() {
    if (!shouldShow()) { if (X.box) X.box.hidden = true; return; }
    if (!X.box) {
      X.box = document.createElement('section'); X.box.className = 'ac-box'; X.box.id = 'agencyActs'; X.box.setAttribute('aria-labelledby', 'acTitle');
      var anchor = $('reviews');
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(X.box, anchor.nextSibling); else ($('desk') || document.body).appendChild(X.box);
    }
    X.box.hidden = false;
    var p = profile();
    var h = '<h2 id="acTitle">Your acts</h2><p class="ac-small">Each act is listed for organisers on its own, marked as booked through ' + esc(p.business || 'your agency') + '. Every enquiry comes to this desk with the act’s name on it. No commission: you agree fees directly with the organiser.</p>';
    if (X.err) h += '<p class="ac-err">' + esc(X.err) + '</p>';
    if (X.lim) h += '<p class="ac-small"><b>' + esc(limitLine()) + '</b></p>';
    if (X.list.length) h += '<ul class="ac-list">' + X.list.map(function (a) {
      var bits = (a.chips || []).slice(0, 4).join(', ') + ((a.chips || []).length > 4 ? '…' : '');
      return '<li><div style="min-width:0;flex:1"><b>' + esc(a.name) + '</b><span class="ac-small">' + esc(bits || 'No act types ticked yet') + (a.adult_content ? ' · Adult act (18+)' : '') + '</span></div>' +
        '<span style="display:flex;gap:6px"><button class="btn small" type="button" data-ac="edit" data-id="' + esc(a.id) + '">Edit</button><button class="btn small" type="button" data-ac="remove" data-id="' + esc(a.id) + '">Remove</button></span></li>';
    }).join('') + '</ul>';
    else if (!X.err && !X.busy) h += '<p>No acts yet. Add the first one below.</p>';
    if (X.editing) h += formHtml(X.editing === 'new' ? null : X.list.filter(function (a) { return a.id === X.editing; })[0]);
    else if (!X.err && !full() && !(X.lim && !X.lim.acts)) h += '<p style="margin:12px 0 0"><button class="btn primary" type="button" data-ac="new">Add an act</button></p>';
    else if (full()) h += '<p style="margin:12px 0 0"><a class="btn small primary" href="#enterprise" data-enterprise>Ask for an Enterprise quote</a></p>';
    X.box.innerHTML = h;
    if (X.editing) { var n = $('acName'); if (n && !n.value) n.focus(); }
  }

  function readForm() {
    var on = function (box, attr) { return Array.prototype.slice.call(document.querySelectorAll('#' + box + ' [' + attr + '][aria-pressed="true"]')).map(function (b) { return b.getAttribute(attr); }); };
    var adult = $('acAdult').checked, det = {};
    var sm = Number($('acSet').value), ss = Number($('acSets').value);
    if (sm > 0) det.set_minutes = Math.round(sm); if (ss > 0) det.sets = Math.round(ss);
    if ($('acPa').value) det.own_pa = $('acPa').value; if ($('acPower').value) det.power = $('acPower').value;
    return { name: $('acName').value.trim().slice(0, 80), chips: on('acTypes', 'data-ac-type').slice(0, 20), adult_content: adult,
      audiences: adult ? ['adults'] : on('acAud', 'data-ac-aud'), about: $('acAbout').value.trim().slice(0, 280) || null, details: det };
  }
  function showErr(t) { var e = $('acErr'); if (e) { e.textContent = t; e.hidden = !t; } }
  function niceErr(err) {
    var m = String((err && err.message) || '');
    if (/kind|column/i.test(m)) return 'Acts can’t be saved just yet. We’re switching this on: try again later today.';
    return m || 'Couldn’t save that. Try again.';
  }

  document.addEventListener('click', function (e) {
    var t = e.target; if (!X.box || !X.box.contains(t)) return;
    var tb = t.closest('[data-ac-type],[data-ac-aud]');
    if (tb) { tb.setAttribute('aria-pressed', String(tb.getAttribute('aria-pressed') !== 'true')); return; }
    var b = t.closest('[data-ac]'); if (!b) return;
    var act = b.getAttribute('data-ac'), id = b.getAttribute('data-id');
    if (act === 'new') { X.editing = 'new'; draw(); }
    else if (act === 'edit') { X.editing = id; draw(); }
    else if (act === 'cancel') { X.editing = null; draw(); }
    else if (act === 'remove') {
      var a = X.list.filter(function (x) { return x.id === id; })[0];
      if (!confirm('Remove ' + (a ? a.name : 'this act') + '? Organisers won’t find it any more. Enquiries already sent stay on your desk.')) return;
      b.disabled = true;
      client().from('supplier_units').delete().eq('id', id).then(function (r) { if (r.error) { b.disabled = false; alert(niceErr(r.error)); return; } X.editing = null; X.load(); });
    }
  });
  document.addEventListener('change', function (e) { if (e.target && e.target.id === 'acAdult') { var r = $('acAudRow'); if (r) r.hidden = e.target.checked; } });
  document.addEventListener('submit', function (e) {
    if (!e.target || e.target.id !== 'acForm') return;
    e.preventDefault();
    var v = readForm();
    if (!v.name) { showErr('Give the act a name.'); $('acName').focus(); return; }
    if (!v.chips.length) { showErr('Tick at least one kind of act, so organisers can find it.'); return; }
    var c = client(); if (!c) { showErr('Log in to save your acts.'); return; }
    var btn = e.target.querySelector('button[type=submit]'); btn.disabled = true; showErr('');
    var editing = X.editing !== 'new' ? X.editing : null;
    // The agency's profile has to be saved as an agency before acts can be added
    var ready = window.SRMarket && window.SRMarket.publish ? window.SRMarket.publish() : Promise.resolve();
    Promise.resolve(ready).then(function () {
      return editing ? c.from('supplier_units').update(v).eq('id', editing) : c.from('supplier_units').insert(Object.assign({ owner: owner(), kind: 'act' }, v));
    }).then(function (r) {
      if (r && r.error) throw r.error;
      X.editing = null; X.load();
    }).catch(function (err) { btn.disabled = false; showErr(niceErr(err)); });
  });

  // Redraw when the person logs in or out, or the profile switches to or from agency
  setInterval(function () {
    var A = acct(), p = profile(), sig = [A && A.user ? owner() : '', p.saved ? 1 : 0, p.agency ? 1 : 0, p.business || ''].join('|');
    if (sig === X.sig) return; X.sig = sig;
    if (shouldShow()) X.load(); else draw();
  }, 1500);
})();
