/* ShowReady Build 103: admin Review tab. Read only.
   Shows what suppliers and organisers have entered, so anything unwanted can be spotted.
   Leaves out private messages, contact details and uploaded documents. Each look is logged (public.admin_views). */
(function () {
  'use strict';
  var R = { kind: 'suppliers', data: {}, q: '' };
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(d) { var m = String(d || '').match(/^(\d{4})-(\d\d)-(\d\d)/); return m ? +m[3] + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m[2] - 1] + ' ' + m[1] : ''; }
  function list(a) { return Array.isArray(a) && a.length ? a.map(esc).join(', ') : ''; }
  function sb() { return window.SRAdmin && window.SRAdmin.sb; }
  // Words worth a second look in what people have written
  var FLAG = /\b(cash only|crypto|bitcoin|guaranteed|whatsapp me|telegram|onlyfans|escort|adult|xxx|nude|cbd|vape|firearm|gun|knife|loan|investment|casino|bet|f+u+c+k|shit|cunt|nazi|http:\/\/)\b/i;

  function load(kind) {
    R.kind = kind;
    document.querySelectorAll('[data-rv]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.rv === kind)); });
    if (R.data[kind]) { draw(); return; }
    $('rvBody').innerHTML = '<p class="hint">Loading…</p>';
    var fn = { suppliers: 'admin_review_suppliers', events: 'admin_review_events', markets: 'admin_review_markets' }[kind];
    sb().rpc(fn).then(function (r) {
      if (r.error) { $('rvBody').innerHTML = '<p class="msg bad">' + esc(r.error.message) + '</p>'; return; }
      R.data[kind] = r.data || []; draw();
    });
  }
  function hit(o) { if (!R.q) return true; return JSON.stringify(o).toLowerCase().indexOf(R.q) !== -1; }
  function flag(text) { return FLAG.test(text || '') ? ' <span class="pill" style="background:#F7E0DC;color:#8A1F18">Check wording</span>' : ''; }

  function draw() {
    var rows = (R.data[R.kind] || []).filter(hit), h = '';
    if (R.kind === 'suppliers') {
      h = rows.map(function (s) {
        var d = s.details || {}, menus = d.menus || [], txt = [s.business, s.about, JSON.stringify(menus), JSON.stringify(s.act || {})].join(' ');
        return '<div class="card" style="margin:0 0 10px"><h3 style="margin:0">' + esc(s.business || '(no business name)') + flag(txt) +
          (s.logo_v ? ' <img src="https://osqlwddeobiklrpdnons.supabase.co/storage/v1/object/public/logos/' + esc(encodeURIComponent(s.owner)) + '/logo?v=' + esc(s.logo_v) + '" alt="" style="height:28px;vertical-align:middle;border-radius:6px" onerror="this.remove()">' : '') + '</h3>' +
          '<p class="hint" style="margin:4px 0">' + (s.listed ? 'Listed' : 'Not listed') + ' · ' + esc(s.town || s.outcode || 'no town') + (s.miles ? ' · travels ' + esc(s.miles) + ' miles' : '') + ' · plan ' + esc(s.plan) + (s.demo ? ' · demo' : '') + ' · joined ' + esc(fmt(s.joined)) + ' · updated ' + esc(fmt(s.updated_at)) + '</p>' +
          (s.about ? '<p style="white-space:pre-wrap;margin:6px 0">' + esc(s.about) + '</p>' : '<p class="hint">No description.</p>') +
          '<p class="hint" style="margin:4px 0">' + [list(s.services) && 'Services: ' + list(s.services), list(s.categories) && 'Categories: ' + list(s.categories), list(s.chips) && 'Details: ' + list(s.chips), list(s.event_types) && 'Events: ' + list(s.event_types), list(s.audiences) && 'Audiences: ' + list(s.audiences), s.adult ? 'Adult content: yes' : ''].filter(Boolean).join(' · ') + '</p>' +
          (menus.length ? '<details><summary>Menus and packages (' + menus.length + ')</summary>' + menus.map(function (m) { return '<p style="white-space:pre-wrap;margin:6px 0"><strong>' + esc(m.name || m.title || '') + '</strong> ' + esc(m.price || '') + '<br>' + esc(m.items || m.desc || m.text || '') + '</p>'; }).join('') + '</details>' : '') +
          (s.act && Object.keys(s.act).length ? '<details><summary>Act details</summary><pre style="white-space:pre-wrap;font:inherit;font-size:14px">' + esc(JSON.stringify(s.act, null, 1)) + '</pre></details>' : '') +
          '<p class="hint" style="margin:4px 0">' + (s.insured_until ? 'Insured to ' + esc(fmt(s.insured_until)) : 'No insurance date') + (s.dbs_until ? ' · DBS to ' + esc(fmt(s.dbs_until)) : '') + '</p></div>';
      }).join('');
    } else if (R.kind === 'events') {
      h = rows.map(function (e) {
        var acts = e.acts && typeof e.acts === 'object' ? Object.keys(e.acts).filter(function (k) { return e.acts[k]; }) : [];
        return '<div class="card" style="margin:0 0 10px"><h3 style="margin:0">' + esc(e.name || '(untitled plan)') + flag([e.name, e.desc].join(' ')) + '</h3>' +
          '<p class="hint" style="margin:4px 0">' + [e.date ? fmt(e.date) + (e.days > 1 ? ' (' + esc(e.days) + ' days)' : '') : 'No date', e.postcode ? esc(e.postcode) + '…' : '', e.people ? esc(e.people) + ' people' : '', e.type || '', e.entry === 'paid' ? 'paid entry' : '', e.alcohol && e.alcohol !== 'none' ? 'alcohol ' + esc(e.alcohol) : '', e.music && e.music !== 'none' ? 'music ' + esc(e.music) : '', Number(e.traders) ? esc(e.traders) + ' traders' : ''].filter(Boolean).join(' · ') +
          ' · by ' + esc(e.owner_name || 'no name') + ' (' + esc(e.role) + (e.demo ? ', demo' : '') + ') · updated ' + esc(fmt(e.updated_at)) + '</p>' +
          (e.desc ? '<p style="white-space:pre-wrap;margin:6px 0">' + esc(e.desc) + '</p>' : '') +
          (acts.length ? '<p class="hint" style="margin:4px 0">Activities: ' + esc(acts.join(', ')) + '</p>' : '') +
          (e.market ? '<p class="hint" style="margin:4px 0">Trader applications: ' + (e.market.open ? 'open' : 'closed') + ', ' + esc(e.market.apps) + ' received</p>' : '') + '</div>';
      }).join('');
    } else {
      h = rows.map(function (m) {
        return '<div class="card" style="margin:0 0 10px"><h3 style="margin:0">' + esc(m.name) + flag([m.intro, m.fee_note].join(' ')) + '</h3><p class="hint" style="margin:4px 0">' + esc(fmt(m.event_date)) + ' · ' + esc(m.town || '') + ' · ' + (m.open ? 'open' : 'closed') + ' · ' + m.apps.length + ' applications</p>' +
          (m.intro ? '<p style="white-space:pre-wrap;margin:6px 0">' + esc(m.intro) + '</p>' : '') + (m.fee_note ? '<p class="hint" style="white-space:pre-wrap">Fees: ' + esc(m.fee_note) + '</p>' : '') +
          (m.apps.length ? '<details><summary>Applications</summary><ul>' + m.apps.map(function (a) { return '<li><strong>' + esc(a.business) + '</strong> (' + esc(a.kind) + ', ' + esc(a.status) + ')' + flag(a.offer) + (a.offer ? ': ' + esc(a.offer) : '') + '</li>'; }).join('') + '</ul></details>' : '') + '</div>';
      }).join('');
    }
    $('rvBody').innerHTML = '<p class="hint">' + rows.length + ' shown. Read only: nothing here can be changed. Contact details, messages and uploaded documents are not shown.</p>' + (h || '<p class="hint">Nothing to show.</p>');
  }

  function ready() {
    var tabs = document.querySelector('.tabs');
    if (!tabs || !sb()) { setTimeout(ready, 300); return; }
    tabs.addEventListener('click', function (e) { var b = e.target.closest('[data-tab="review"]'); if (b) load(R.kind); });
    document.addEventListener('click', function (e) { var b = e.target.closest('[data-rv]'); if (b) load(b.dataset.rv); });
    $('rvSearch').addEventListener('input', function () { R.q = this.value.trim().toLowerCase(); draw(); });
  }
  ready();
})();
