/* ShowReady Build 103: trader applications for organisers (the Traders tab in the planner).
   Organisers open applications for one saved event, share the link, and approve, waitlist or decline traders.
   Traders apply at /apply/?m=CODE with a free ShowReady supplier account.
   Data: public.markets, public.market_applications, public.market_messages (see the Build 103 migration).
   Every write goes through a database function that checks the organiser owns the event. */
(function () {
  'use strict';
  if (window.SRTraders) return;
  var T = window.SRTraders = { market: null, apps: [], msgs: [], filter: 'applied', el: null, loading: false, limit: null, err: '' };

  var DOCS = {
    pl: 'Public liability insurance', food_reg: 'Food business registration', fhrs: 'Food hygiene rating',
    gas: 'Gas Safe certificate (LPG)', elec: 'Electrical safety (PAT) certificate', fire: 'Fire extinguisher and fire risk check',
    allergen: 'Allergen information for customers', risk: 'Their own risk assessment'
  };
  var DOC_ORDER = ['pl', 'food_reg', 'fhrs', 'gas', 'elec', 'fire', 'allergen', 'risk'];
  var KIND = { food: 'Food', drink: 'Drinks', craft: 'Crafts', retail: 'Retail', activity: 'Activity', ride: 'Ride or attraction', other: 'Other' };
  var STATUS = { applied: 'New', approved: 'Approved', waitlist: 'Waiting list', declined: 'Declined', withdrawn: 'Withdrawn' };
  var PITCH_TYPES = { food: ['F', 'Food pitch'], trader: ['T', 'Trade stand'], trailer: ['CT', 'Catering trailer'], gazebo: ['GZ', 'Gazebo'], ride: ['RD', 'Fairground ride'], kidsride: ['KR', 'Children’s ride'], bouncy: ['BC', 'Bouncy castle'], inflatable: ['IF', 'Inflatable'] };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nice(d) { if (!d) return ''; var x = new Date(String(d).slice(0, 10) + 'T12:00:00Z'); return isNaN(x) ? '' : x.getUTCDate() + ' ' + MONTHS[x.getUTCMonth()] + ' ' + x.getUTCFullYear(); }
  function A() { return window.SRAccount || {}; }
  function sb() { return A().client; }
  function ev() { try { return (window.SRPlanner && window.SRPlanner.event()) || {}; } catch (e) { return {}; } }
  function link() { return location.origin.replace(/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, 'https://beshowready.co.uk') + '/apply/?m=' + (T.market ? T.market.code : ''); }
  function friendly(err) {
    var m = (err && (err.message || err.error_description)) || String(err || '');
    if (/Failed to fetch|NetworkError/i.test(m)) return 'Couldn’t reach ShowReady. Check your connection and try again.';
    return m.replace(/^.*?ERROR:\s*/, '') || 'Something went wrong. Try again.';
  }

  var css = '.tr-wrap{display:flex;flex-direction:column;gap:14px}.tr-card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:16px}' +
    '.tr-card h3{margin:0 0 6px;font-size:17px}.tr-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.tr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}' +
    '.tr-link{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.tr-link input{flex:1 1 260px;min-height:44px;border:1px solid var(--line);border-radius:12px;padding:0 12px;font:inherit;background:var(--surface-2)}' +
    '.tr-chips{display:flex;gap:6px;flex-wrap:wrap}.tr-chip{min-height:36px;padding:0 12px;border-radius:999px;border:1px solid var(--line);background:var(--surface);font:inherit;font-size:14px;font-weight:700;cursor:pointer;color:var(--ink)}' +
    '.tr-chip[aria-pressed="true"]{background:var(--brand);border-color:var(--brand);color:var(--brand-ink,#fff)}' +
    '.tr-app{border:1px solid var(--line);border-radius:14px;padding:14px;background:var(--surface);display:flex;flex-direction:column;gap:10px}' +
    '.tr-app header{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline}.tr-app h4{margin:0;font-size:16px}' +
    '.tr-st{font-size:12px;font-weight:800;padding:3px 9px;border-radius:999px;background:var(--surface-2)}.tr-st.approved{background:#DDF0E4;color:#1E5A43}.tr-st.declined,.tr-st.withdrawn{background:#F3E3E1;color:#8A2D22}.tr-st.waitlist{background:#FBF0D9;color:#7A5300}' +
    '.tr-docs{list-style:none;margin:0;padding:0;display:grid;gap:4px;font-size:14px}.tr-docs li{display:flex;gap:8px;align-items:baseline}.tr-ok{color:#1E5A43;font-weight:800}.tr-bad{color:#B3261E;font-weight:800}.tr-warn{color:#8A5A00;font-weight:800}' +
    '.tr-acts{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.tr-acts .btn{min-height:40px}.tr-acts select,.tr-acts input[type=text]{min-height:40px;border:1px solid var(--line);border-radius:10px;padding:0 10px;font:inherit;background:var(--surface)}' +
    '.tr-meta{font-size:14px;color:var(--muted);display:flex;gap:14px;flex-wrap:wrap}.tr-msg textarea,.tr-set textarea{width:100%;min-height:84px;border:1px solid var(--line);border-radius:12px;padding:10px;font:inherit;box-sizing:border-box}' +
    '.tr-set input[type=text],.tr-set input[type=date],.tr-set input[type=number]{min-height:44px;border:1px solid var(--line);border-radius:12px;padding:0 12px;font:inherit;width:100%;box-sizing:border-box}' +
    '.tr-set .tr-docpick{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:6px}.tr-set label.ck{display:flex;gap:8px;align-items:center;font-size:15px;min-height:36px}' +
    '.tr-err{color:#B3261E;font-weight:700}.tr-small{font-size:13px;color:var(--muted)}.tr-count{font-weight:800}' +
    '.tr-note textarea{width:100%;min-height:44px;border:1px dashed var(--line);border-radius:10px;padding:8px;font:inherit;box-sizing:border-box;background:var(--surface-2)}' +
    '@media print{.tr-noprint{display:none!important}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ---- loading
  T.draw = function (el) {
    T.el = el || T.el; if (!T.el) return;
    var a = A();
    if (!a.user) {
      T.el.innerHTML = head() + '<div class="tr-card"><h3>Take trader applications online</h3><p>Food vans, stalls, crafts and rides apply through a link you share. You see their details and documents in one list, approve, waitlist or decline them, give them a pitch from your site plan and message them all at once.</p>' +
        '<p>Log in and save this plan to your account first. Traders apply free with a ShowReady supplier account.</p><p><button class="btn primary" type="button" data-tr="login">Log in or sign up</button></p></div>';
      return;
    }
    if (T.loading) return;
    T.loading = true;
    T.el.innerHTML = head() + '<div class="tr-card"><p class="muted">Loading your traders…</p></div>';
    Promise.resolve(a.ensurePlanId ? a.ensurePlanId() : null).then(function (pid) {
      T.planId = pid;
      if (!pid) throw new Error('Save this plan to your account first (Account, then Save).');
      return Promise.all([
        sb().from('markets').select('*').eq('plan_id', pid).maybeSingle(),
        sb().rpc('my_market_limit')
      ]);
    }).then(function (r) {
      if (r[0].error) throw r[0].error;
      T.market = r[0].data || null; T.limit = r[1].error ? null : r[1].data;
      if (!T.market) return null;
      return Promise.all([
        sb().from('market_applications').select('*').eq('market_id', T.market.id).order('created_at', { ascending: true }),
        sb().from('market_messages').select('*').eq('market_id', T.market.id).order('created_at', { ascending: false }).limit(20)
      ]).then(function (x) { if (x[0].error) throw x[0].error; T.apps = x[0].data || []; T.msgs = x[1].data || []; });
    }).then(function () { T.err = ''; T.loading = false; render(); })
      .catch(function (e) { T.loading = false; T.err = friendly(e); render(); });
  };

  function head() {
    return '<div class="section-head"><h2>Traders</h2><span>Applications, documents and pitches for food vans, stalls and rides</span></div>';
  }

  // ---- what a document line says, measured against the event date
  function docState(key, d, evDate) {
    d = d || {};
    var has = !!(d.ok || d.expires || d.rating || d.council || d.ref);
    if (!has) return { cls: 'tr-bad', txt: 'Not given' };
    if (key === 'fhrs') {
      var r = String(d.rating || '');
      if (r === 'awaiting') return { cls: 'tr-warn', txt: 'Awaiting inspection' + (d.council ? ', ' + d.council : '') };
      if (/^[0-5]$/.test(r)) return { cls: Number(r) >= 3 ? 'tr-ok' : 'tr-warn', txt: 'Rating ' + r + (d.council ? ', ' + d.council : '') };
    }
    if (d.expires) {
      var target = evDate || new Date().toISOString().slice(0, 10);
      if (d.expires < new Date().toISOString().slice(0, 10)) return { cls: 'tr-bad', txt: 'Expired ' + nice(d.expires) };
      if (d.expires < target) return { cls: 'tr-bad', txt: 'Expires before the event (' + nice(d.expires) + ')' };
      return { cls: 'tr-ok', txt: 'Valid to ' + nice(d.expires) + (d.cover ? ', £' + d.cover : '') + (d.insurer ? ', ' + d.insurer : '') };
    }
    if (key === 'food_reg') return { cls: 'tr-ok', txt: 'Registered' + (d.council ? ' with ' + d.council : '') + (d.ref ? ' (' + d.ref + ')' : '') };
    return { cls: 'tr-ok', txt: 'Confirmed' };
  }

  function pitchOptions(cur) {
    var items = []; try { items = ((window.SRPlanner && window.SRPlanner.sitePlan()) || {}).items || []; } catch (e) {}
    var n = {}, opts = [];
    items.forEach(function (it) { var p = PITCH_TYPES[it.type]; if (!p) return; n[it.type] = (n[it.type] || 0) + 1; opts.push(p[0] + n[it.type] + (it.label ? ' ' + it.label : ' ' + p[1] + ' ' + n[it.type])); });
    var taken = {}; T.apps.forEach(function (a) { if (a.pitch && a.status === 'approved') taken[a.pitch] = a.business; });
    var h = '<option value="">No pitch yet</option>';
    var seen = false;
    opts.forEach(function (o) { var v = o.slice(0, 40); if (v === cur) seen = true; h += '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(o) + (taken[v] && v !== cur ? ' (taken)' : '') + '</option>'; });
    if (cur && !seen) h += '<option value="' + esc(cur) + '" selected>' + esc(cur) + '</option>';
    h += '<option value="__own">Type a pitch name…</option>';
    return { html: h, count: opts.length };
  }

  // ---- render
  function render() {
    if (!T.el) return;
    var h = head();
    if (T.err) h += '<div class="tr-card"><p class="tr-err">' + esc(T.err) + '</p><p><button class="btn" type="button" data-tr="reload">Try again</button></p></div>';
    else if (!T.market) h += setupCard();
    else h += marketCard() + listCard() + messageCard();
    T.el.innerHTML = '<div class="tr-wrap">' + h + '</div>';
  }

  function settingsFields(m) {
    m = m || {};
    var need = m.need_docs || ['pl', 'food_reg', 'fhrs'];
    return '<div class="tr-set tr-grid">' +
      '<div class="field"><label class="mini" for="trClose">Applications close on (optional)</label><input id="trClose" type="date" value="' + esc(m.closes_on || '') + '"></div>' +
      '<div class="field"><label class="mini" for="trMax">Pitches available (optional)</label><input id="trMax" type="number" min="1" max="1000" value="' + esc(m.max_traders || '') + '"></div>' +
      '</div><div class="tr-set field"><label class="mini" for="trFee">Pitch fees and terms, shown to traders (optional)</label><textarea id="trFee" maxlength="600" placeholder="For example: £40 a pitch for food, £20 for crafts. Pay by bank transfer once approved. No refunds within 14 days of the event.">' + esc(m.fee_note || '') + '</textarea></div>' +
      '<div class="tr-set field"><label class="mini" for="trIntro">A note to traders (optional)</label><textarea id="trIntro" maxlength="1500" placeholder="What the event is, who comes, what you’re looking for, set-up times.">' + esc(m.intro || '') + '</textarea></div>' +
      '<div class="tr-set"><p class="mini" style="margin:6px 0">Ask traders for these (food items only apply to food and drink traders):</p><div class="tr-docpick">' +
      DOC_ORDER.map(function (k) { return '<label class="ck"><input type="checkbox" data-trdoc="' + k + '"' + (need.indexOf(k) !== -1 ? ' checked' : '') + '> ' + esc(DOCS[k]) + '</label>'; }).join('') + '</div></div>';
  }

  function setupCard() {
    var e = ev(), lim = T.limit;
    var h = '<div class="tr-card"><h3>Take trader applications online</h3>' +
      '<p>Share one link on social media, in emails or on posters. Traders apply with their menu or goods, pitch size, power needs and documents, and you decide who gets a pitch. ShowReady takes no commission on your pitch fees.</p>';
    if (lim === 0) {
      return h + '<p><strong>This needs the Market pass</strong> (one event, 12 months: up to 25 traders £39, up to 75 £69, up to 200 £119, all including VAT) or Pro Plus. <a href="/pricing/">See pricing</a></p></div>';
    }
    h += '<p class="tr-small">For <strong>' + esc(e.eventName || 'this event') + '</strong>' + (e.date ? ', ' + esc(nice(e.date)) : '') + '. Free during the pilot; from 1 February 2027 it’s part of the Market pass or Pro Plus.</p>' + settingsFields(null) +
      '<p class="tr-noprint"><button class="btn primary" type="button" data-tr="open">Start taking applications</button></p></div>';
    return h;
  }

  function counts() { var c = { applied: 0, approved: 0, waitlist: 0, declined: 0, withdrawn: 0 }; T.apps.forEach(function (a) { c[a.status] = (c[a.status] || 0) + 1; }); return c; }

  function marketCard() {
    var m = T.market, c = counts(), open = m.open && (!m.closes_on || m.closes_on >= new Date().toISOString().slice(0, 10));
    var lim = T.limit != null && T.limit < 1000 ? ' of ' + T.limit + ' your plan allows' : '';
    return '<div class="tr-card"><h3>' + esc(m.name) + (m.event_date ? ' · ' + esc(nice(m.event_date)) : '') + '</h3>' +
      '<p class="tr-meta"><span><span class="tr-count">' + c.approved + '</span> approved' + lim + (m.max_traders ? ' (' + m.max_traders + ' pitches)' : '') + '</span><span><span class="tr-count">' + c.applied + '</span> new</span><span><span class="tr-count">' + c.waitlist + '</span> waiting</span>' +
      '<span>' + (open ? '<strong style="color:#1E5A43">Open for applications</strong>' + (m.closes_on ? ' until ' + esc(nice(m.closes_on)) : '') : '<strong style="color:#8A2D22">Closed to new applications</strong>') + '</span></p>' +
      '<p class="mini" style="margin:10px 0 6px">Your application link. Share it on social media, in emails or on posters:</p>' +
      '<div class="tr-link tr-noprint"><input id="trLink" type="text" readonly value="' + esc(link()) + '" aria-label="Application link"><button class="btn" type="button" data-tr="copy">Copy link</button><a class="btn" href="' + esc(link()) + '" target="_blank" rel="noopener">Open it</a></div>' +
      '<div class="tr-row tr-noprint" style="margin-top:10px"><button class="btn" type="button" data-tr="toggle">' + (m.open ? 'Close applications' : 'Reopen applications') + '</button>' +
      '<button class="btn" type="button" data-tr="settings">Change details</button><button class="btn" type="button" data-tr="csv">Download traders list (spreadsheet)</button><button class="btn" type="button" data-tr="print">Print approved list</button></div>' +
      '<div id="trSettings" hidden style="margin-top:12px">' + settingsFields(m) + '<p><button class="btn primary" type="button" data-tr="save">Save changes</button> <span id="trSaved" class="tr-small"></span></p></div>' +
      '<p class="tr-small" style="margin-top:10px">The traders list has what your council’s food safety team usually asks for: each food trader’s name, contact, the council they’re registered with, their hygiene rating and insurance.</p></div>';
  }

  function listCard() {
    var c = counts();
    var h = '<div class="tr-card"><div class="tr-chips tr-noprint" role="group" aria-label="Show">' +
      ['applied', 'approved', 'waitlist', 'declined', 'withdrawn', 'all'].map(function (k) {
        var n = k === 'all' ? T.apps.length : (c[k] || 0);
        return '<button class="tr-chip" type="button" data-trf="' + k + '" aria-pressed="' + (T.filter === k) + '">' + (k === 'all' ? 'All' : STATUS[k]) + ' (' + n + ')</button>';
      }).join('') + '</div>';
    var list = T.apps.filter(function (a) { return T.filter === 'all' || a.status === T.filter; });
    if (!T.apps.length) h += '<p style="margin-top:12px">No applications yet. Share your link to get started.</p>';
    else if (!list.length) h += '<p style="margin-top:12px">None here.</p>';
    h += '<div style="display:flex;flex-direction:column;gap:10px;margin-top:12px">' + list.map(appCard).join('') + '</div></div>';
    return h;
  }

  function appCard(a) {
    var m = T.market, docs = a.docs || {}, need = m.need_docs || [];
    var foodish = a.kind === 'food' || a.kind === 'drink';
    var keys = need.filter(function (k) { return foodish || ['food_reg', 'fhrs', 'allergen'].indexOf(k) === -1; });
    Object.keys(docs).forEach(function (k) { if (keys.indexOf(k) === -1 && DOCS[k]) keys.push(k); });
    var po = pitchOptions(a.pitch);
    var size = a.pitch_w || a.pitch_d ? (a.pitch_w || '?') + ' m × ' + (a.pitch_d || '?') + ' m' : '';
    return '<article class="tr-app" data-app="' + esc(a.id) + '"><header><h4>' + esc(a.business) + ' <span class="tr-small">· ' + esc(KIND[a.kind] || a.kind) + '</span></h4><span class="tr-st ' + esc(a.status) + '">' + esc(STATUS[a.status] || a.status) + (a.status === 'approved' && a.pitch ? ' · ' + esc(a.pitch) : '') + '</span></header>' +
      (a.offer ? '<p style="margin:0;white-space:pre-wrap">' + esc(a.offer) + '</p>' : '') +
      '<p class="tr-meta">' + (size ? '<span>Pitch ' + esc(size) + '</span>' : '') + (a.power ? '<span>Power: ' + esc(a.power) + '</span>' : '') + (a.gas ? '<span>Uses gas (LPG)</span>' : '') + (a.vehicle ? '<span>Vehicle: ' + esc(a.vehicle) + '</span>' : '') + '</p>' +
      '<p class="tr-meta">' + [a.contact_name, a.phone, a.email].filter(Boolean).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '<span>Applied ' + esc(nice(a.created_at)) + '</span></p>' +
      (keys.length ? '<ul class="tr-docs">' + keys.map(function (k) { var s = docState(k, docs[k], m.event_date); return '<li><span class="' + s.cls + '">' + (s.cls === 'tr-ok' ? '✓' : s.cls === 'tr-warn' ? '!' : '✗') + '</span><span><strong>' + esc(DOCS[k]) + ':</strong> ' + esc(s.txt) + '</span></li>'; }).join('') + '</ul>' : '') +
      (a.trader_note ? '<p class="tr-small" style="margin:0">From the trader: ' + esc(a.trader_note) + '</p>' : '') +
      (a.status === 'withdrawn' ? '<p class="tr-small" style="margin:0">The trader withdrew this application.</p>' :
        '<div class="tr-acts tr-noprint">' +
        (a.status !== 'approved' ? '<button class="btn primary" type="button" data-trs="approved">Approve</button>' : '') +
        (a.status !== 'waitlist' ? '<button class="btn" type="button" data-trs="waitlist">Waiting list</button>' : '') +
        (a.status !== 'declined' ? '<button class="btn" type="button" data-trs="declined">Decline</button>' : '') +
        (a.status === 'approved' ? '<label class="tr-small" for="trp-' + esc(a.id) + '">Pitch</label><select id="trp-' + esc(a.id) + '" data-trpitch>' + po.html + '</select>' +
          '<label class="ck tr-small"><input type="checkbox" data-trpaid' + (a.paid ? ' checked' : '') + '> Paid</label>' : '') +
        '</div>' +
        (a.status === 'approved' && !po.count ? '<p class="tr-small tr-noprint" style="margin:0">Add food pitches or trade stands to your site plan to pick pitches from it, or type a pitch name.</p>' : '')) +
      '<div class="tr-note tr-noprint"><label class="tr-small" for="trn-' + esc(a.id) + '">Your private note (traders never see this)</label><textarea id="trn-' + esc(a.id) + '" data-trnote maxlength="600">' + esc(a.organiser_note || '') + '</textarea></div>' +
      '<p class="tr-small" style="margin:0" data-trmsg></p></article>';
  }

  function messageCard() {
    var h = '<div class="tr-card tr-msg tr-noprint"><h3>Message your traders</h3><p class="tr-small">Sent by email from ShowReady, and shown on each trader’s ShowReady desk. Use it for arrival times, the site map, payment reminders and changes on the day.</p>' +
      '<div class="tr-row" style="margin-bottom:8px"><label class="tr-small" for="trAud">Send to</label><select id="trAud" style="min-height:40px;border:1px solid var(--line);border-radius:10px;padding:0 10px;font:inherit"><option value="approved">Approved traders</option><option value="waitlist">Waiting list</option><option value="applied">New applications</option><option value="all">Everyone who applied</option></select></div>' +
      '<textarea id="trBody" maxlength="2000" placeholder="For example: Set-up from 7am, gates close to vehicles at 9:30. Enter by the farm track off Lees Road."></textarea>' +
      '<p><button class="btn primary" type="button" data-tr="send">Send message</button> <span id="trSent" class="tr-small"></span></p>';
    if (T.msgs.length) h += '<p class="mini" style="margin:12px 0 6px">Sent</p><ul style="margin:0;padding-left:18px;display:grid;gap:6px">' + T.msgs.map(function (m) {
      return '<li><span class="tr-small">' + esc(nice(m.created_at)) + ' to ' + esc({ approved: 'approved traders', waitlist: 'the waiting list', applied: 'new applications', all: 'everyone' }[m.audience]) + (m.sent_count != null ? ' (' + m.sent_count + ' emailed)' : '') + ':</span> ' + esc(m.body) + '</li>';
    }).join('') + '</ul>';
    return h + '</div>';
  }

  // ---- actions
  function readSettings() {
    var e = ev(), need = [];
    T.el.querySelectorAll('[data-trdoc]').forEach(function (c) { if (c.checked) need.push(c.getAttribute('data-trdoc')); });
    var pc = String(e.postcode || '').toUpperCase().replace(/\s+/g, ' ').trim();
    return {
      name: (e.eventName || '').trim() || 'My event', event_date: e.date || '', days: Number(e.days) || 1,
      outcode: pc ? pc.split(' ')[0] : '', town: e.town || '',
      closes_on: (T.el.querySelector('#trClose') || {}).value || '', max_traders: (T.el.querySelector('#trMax') || {}).value || '',
      fee_note: (T.el.querySelector('#trFee') || {}).value || '', intro: (T.el.querySelector('#trIntro') || {}).value || '', need_docs: need
    };
  }
  function decide(id, patch, row) {
    var say = row && row.querySelector('[data-trmsg]'); if (say) say.textContent = 'Saving…';
    return sb().rpc('market_decide', { p_app: id, p: patch }).then(function (r) {
      if (r.error) throw r.error;
      T.apps.forEach(function (a) { if (a.id === id) Object.keys(patch).forEach(function (k) { a[k] = patch[k]; }); });
      if (say) say.textContent = 'Saved.';
    }).catch(function (e) { if (say) { say.textContent = friendly(e); say.className = 'tr-err'; } return Promise.reject(e); });
  }
  function csv() {
    var rows = [['Business', 'Type', 'Status', 'Pitch', 'Paid', 'Contact', 'Phone', 'Email', 'Registered with council', 'Registration ref', 'Hygiene rating', 'Rated by', 'Insurance expires', 'Cover £', 'Gas cert expires', 'Electrical cert expires', 'Pitch size (m)', 'Power', 'Uses gas']];
    T.apps.filter(function (a) { return a.status !== 'withdrawn' && a.status !== 'declined'; }).forEach(function (a) {
      var d = a.docs || {};
      rows.push([a.business, KIND[a.kind] || a.kind, STATUS[a.status], a.pitch || '', a.paid ? 'Yes' : 'No', a.contact_name || '', a.phone || '', a.email || '',
        (d.food_reg || {}).council || '', (d.food_reg || {}).ref || '', (d.fhrs || {}).rating || '', (d.fhrs || {}).council || '', (d.pl || {}).expires || '', (d.pl || {}).cover || '',
        (d.gas || {}).expires || '', (d.elec || {}).expires || '', (a.pitch_w || a.pitch_d) ? (a.pitch_w || '') + ' x ' + (a.pitch_d || '') : '', a.power || '', a.gas ? 'Yes' : 'No']);
    });
    var text = rows.map(function (r) { return r.map(function (v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\r\n');
    var blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' });
    var aEl = document.createElement('a'); aEl.href = URL.createObjectURL(blob); aEl.download = (T.market.name || 'traders').replace(/[^\w ]+/g, '').trim().slice(0, 60) + ' - traders.csv';
    document.body.appendChild(aEl); aEl.click(); setTimeout(function () { URL.revokeObjectURL(aEl.href); aEl.remove(); }, 500);
  }
  function printList() {
    var list = T.apps.filter(function (a) { return a.status === 'approved'; });
    var w = window.open('', '_blank'); if (!w) return;
    var rows = list.map(function (a) { var d = a.docs || {}; return '<tr><td>' + esc(a.pitch || '') + '</td><td><strong>' + esc(a.business) + '</strong><br>' + esc(KIND[a.kind] || '') + '</td><td>' + esc([a.contact_name, a.phone].filter(Boolean).join(', ')) + '</td><td>' + esc((d.fhrs || {}).rating ? 'FHRS ' + d.fhrs.rating : '') + '</td><td>' + esc((d.pl || {}).expires ? 'PL to ' + nice(d.pl.expires) : '') + '</td><td>' + (a.paid ? 'Paid' : '') + '</td></tr>'; }).join('');
    w.document.write('<!doctype html><meta charset="utf-8"><title>Approved traders</title><style>body{font:14px Arial,sans-serif;margin:24px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px;text-align:left;vertical-align:top}</style>' +
      '<h1 style="font-size:20px">' + esc(T.market.name) + (T.market.event_date ? ' · ' + esc(nice(T.market.event_date)) : '') + '</h1><p>' + list.length + ' approved traders</p><table><tr><th>Pitch</th><th>Trader</th><th>Contact</th><th>Hygiene</th><th>Insurance</th><th>Paid</th></tr>' + rows + '</table><script>print()<\/script>');
    w.document.close();
  }

  document.addEventListener('click', function (e) {
    if (!T.el || !T.el.contains(e.target)) return;
    var b = e.target.closest('[data-tr]'), f = e.target.closest('[data-trf]'), s = e.target.closest('[data-trs]');
    if (f) { T.filter = f.getAttribute('data-trf'); render(); return; }
    if (s) {
      var row = s.closest('[data-app]'), id = row.getAttribute('data-app'), to = s.getAttribute('data-trs');
      s.disabled = true;
      decide(id, { status: to }, row).then(render, function () { s.disabled = false; });
      return;
    }
    if (!b) return;
    var act = b.getAttribute('data-tr');
    if (act === 'login') { if (A().open) A().open('signin'); return; }
    if (act === 'reload') { T.draw(); return; }
    if (act === 'copy') { var inp = T.el.querySelector('#trLink'); inp.select(); (navigator.clipboard ? navigator.clipboard.writeText(inp.value) : Promise.reject()).catch(function () { document.execCommand('copy'); }); b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy link'; }, 1600); return; }
    if (act === 'settings') { var box = T.el.querySelector('#trSettings'); box.hidden = !box.hidden; return; }
    if (act === 'csv') { csv(); return; }
    if (act === 'print') { printList(); return; }
    if (act === 'open' || act === 'save' || act === 'toggle') {
      var p = act === 'toggle' ? { open: !T.market.open } : readSettings();
      b.disabled = true; b.textContent = 'Saving…';
      sb().rpc('market_save', { p_plan: T.planId, p: p }).then(function (r) {
        if (r.error) throw r.error;
        if (act === 'open') { T.market = r.data; T.apps = []; T.msgs = []; render(); }
        else { T.market = r.data; render(); }
      }).catch(function (err) { b.disabled = false; b.textContent = 'Try again'; alertBox(friendly(err)); });
      return;
    }
    if (act === 'send') {
      var body = (T.el.querySelector('#trBody').value || '').trim(), aud = T.el.querySelector('#trAud').value, out = T.el.querySelector('#trSent');
      if (!body) { out.textContent = 'Write your message first.'; return; }
      var n = T.apps.filter(function (a) { return a.status !== 'withdrawn' && (aud === 'all' || a.status === aud); }).length;
      if (!n) { out.textContent = 'Nobody in that group yet.'; return; }
      b.disabled = true; out.textContent = 'Sending to ' + n + (n === 1 ? ' trader…' : ' traders…');
      sb().rpc('market_message', { p_market: T.market.id, p_audience: aud, p_body: body }).then(function (r) {
        if (r.error) throw r.error;
        T.msgs.unshift({ id: r.data, audience: aud, body: body, created_at: new Date().toISOString(), sent_count: null });
        render(); var o2 = T.el.querySelector('#trSent'); if (o2) o2.textContent = 'Sent. Emails go out within a minute.';
      }).catch(function (err) { b.disabled = false; out.textContent = friendly(err); });
    }
  });
  function alertBox(msg) { var p = document.createElement('p'); p.className = 'tr-err'; p.textContent = msg; var c = T.el.querySelector('.tr-card:last-child') || T.el; c.appendChild(p); }

  document.addEventListener('change', function (e) {
    if (!T.el || !T.el.contains(e.target)) return;
    var row = e.target.closest('[data-app]'); if (!row) return;
    var id = row.getAttribute('data-app');
    if (e.target.hasAttribute('data-trpitch')) {
      var v = e.target.value;
      if (v === '__own') { v = (prompt('Pitch name or number (for example A4)') || '').trim().slice(0, 40); if (!v) { render(); return; } }
      decide(id, { pitch: v }, row).then(render);
    } else if (e.target.hasAttribute('data-trpaid')) {
      decide(id, { paid: e.target.checked }, row);
    } else if (e.target.hasAttribute('data-trnote')) {
      decide(id, { organiser_note: e.target.value }, row);
    }
  });

  // Open the Traders tab from an email link (/app/?tab=traders)
  if (/[?&]tab=traders\b/.test(location.search)) {
    var tries = 0, t = setInterval(function () {
      var b = document.getElementById('tab-traders');
      if (b && !b.hidden && (A().user || ++tries > 20)) { clearInterval(t); b.click(); }
      else if (++tries > 40) clearInterval(t);
    }, 500);
  }
})();
