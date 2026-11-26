/* ShowReady admin tools (build 80).
   Admin accounts get an Admin button (bottom left) to open any area of the site, in one of two modes:
   - Full access: your own account. Every area is open and admin accounts get the top plan limits. What you enter is kept.
   - Demo: a throwaway demo account, shown as any role and plan. Everything in it is deleted when you leave demo mode or sign out.
   Switching happens on /admin/demo.html so no open app can save into the wrong account. */
(function () {
  'use strict';
  if (window.SRAdminTools) return;
  window.SRAdminTools = true;
  if (/^\/admin\/demo(\.html)?$/.test(location.pathname)) return;
  var TOKEN = 'sb-osqlwddeobiklrpdnons-auth-token', URL_ = 'https://osqlwddeobiklrpdnons.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcWx3ZGRlb2Jpa2xycGRub25zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNjgwNzQsImV4cCI6MjEwODk0NDA3NH0.PmCrxAOxs8FgOIRokr_K9Mv-kPf1FByvMhEaINxcGAk';
  var ROLES = [['organiser', 'Organiser'], ['supplier', 'Supplier'], ['both', 'Organiser and supplier'], ['film', 'Film & TV']];
  var PLANS = {
    organiser: [['free', 'Free'], ['event-pass', 'Event pass'], ['pro', 'Pro'], ['pro-plus', 'Pro Plus'], ['enterprise', 'Enterprise']],
    supplier: [['free', 'Free'], ['vendor-pro', 'Vendor Pro'], ['vendor-business', 'Vendor Business'], ['enterprise', 'Enterprise']],
    both: [['free', 'Free'], ['combined', 'Combined'], ['enterprise', 'Enterprise']],
    film: [['free', 'Free'], ['film-pass', 'Production Pass'], ['film-pro', 'Film Pro'], ['film-studio', 'Film Studio']]
  };
  var AREAS = [['/', 'Home'], ['/app/', 'Plan an event (organiser app)'], ['/suppliers/', 'Supplier desk'], ['/film/', 'Film & TV'],
    ['/toolkit.html', 'Tools and pricing'], ['/plan/', 'Council licence pages'], ['/admin/', 'Admin']];
  var HOME_FOR = { organiser: '/app/', supplier: '/suppliers/', both: '/app/', film: '/film/' };

  function read(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function label(list, id) { for (var i = 0; i < list.length; i++) if (list[i][0] === id) return list[i][1]; return id; }
  function here() { return location.pathname + location.search; }
  function go(q) { location.href = '/admin/demo.html?' + q; }
  function session() { var s = read(TOKEN); return s && s.user ? s : null; }

  var demo = read('srdemo-on'), s = session();
  if (demo) {
    if (!s) { location.replace('/admin/demo.html?do=signout'); return; } // signed out inside demo mode: delete the demo data
    if (s.user.id !== demo.user) { location.replace('/admin/demo.html?do=tidy&to=' + encodeURIComponent(here())); return; }
    // Signing out from the account panel removes the sign-in: catch it and delete the demo data
    setInterval(function () { if (!session()) location.replace('/admin/demo.html?do=signout'); }, 1500);
    ready(function () { build(true); });
    return;
  }
  if (!s) return;
  var cache = read('srdemo-admin');
  if (cache && cache.user === s.user.id && Date.now() - cache.at < 3600e3) { if (cache.admin) ready(function () { build(false); }); return; }
  if (!s.access_token || (s.expires_at && s.expires_at * 1000 < Date.now())) { if (cache && cache.user === s.user.id && cache.admin) ready(function () { build(false); }); return; }
  fetch(URL_ + '/rest/v1/profiles?select=is_admin&id=eq.' + encodeURIComponent(s.user.id), { headers: { apikey: ANON, Authorization: 'Bearer ' + s.access_token } })
    .then(function (r) { return r.ok ? r.json() : null; }).then(function (rows) {
      if (!rows) return;
      var admin = !!(rows[0] && rows[0].is_admin === true);
      write('srdemo-admin', { user: s.user.id, admin: admin, at: Date.now() });
      if (admin) ready(function () { build(false); });
    }).catch(function () {});

  function ready(f) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', f); else f(); }

  function options(list, sel) { return list.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (x[0] === sel ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join(''); }

  function build(inDemo) {
    // Build 89: tell the page this is a real admin (not demo), so the pricing page can show test checkout buttons
    if (!inDemo) { window.SR_IS_ADMIN = true; try { window.dispatchEvent(new Event('sr-admin')); } catch (e) {} }
    var css = '.sra-pill{position:fixed;left:12px;bottom:12px;z-index:70;display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 14px;border-radius:999px;border:0;background:#14213D;color:#fff;font:700 14px/1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.25);cursor:pointer}' +
      '.sra-pill:focus-visible,.sra-bar button:focus-visible{outline:3px solid #F2B705;outline-offset:2px}' +
      '.sra-panel{position:fixed;left:12px;bottom:62px;z-index:71;width:min(380px,calc(100vw - 24px));max-height:calc(100vh - 80px);overflow:auto;background:#fff;color:#1a1a1a;border:1px solid #d9dde3;border-top:6px solid #14213D;border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.3);padding:16px 18px;font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}' +
      '.sra-panel[hidden]{display:none}.sra-panel h2{margin:0 0 8px;font-size:18px}.sra-panel p{margin:6px 0}.sra-panel .mut{color:#555;font-size:13px}' +
      '.sra-panel label{display:block;font-weight:700;font-size:14px;margin:10px 0 4px}.sra-panel select{width:100%;min-height:40px;border:1px solid #c4c9d0;border-radius:10px;padding:0 10px;font:inherit;background:#fff;color:#1a1a1a}' +
      '.sra-modes{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0;border:0;padding:0}.sra-modes legend{font-weight:700;font-size:14px;margin-bottom:4px;padding:0}' +
      '.sra-modes label{display:flex;align-items:center;justify-content:center;gap:6px;min-height:40px;margin:0;border:1px solid #c4c9d0;border-radius:10px;cursor:pointer;font-size:14px}' +
      '.sra-modes input{accent-color:#14213D}.sra-modes label.on{border-color:#14213D;background:#eef1f7}' +
      '.sra-go{list-style:none;margin:6px 0 0;padding:0;display:grid;gap:4px}.sra-go a{display:block;padding:8px 10px;border-radius:8px;color:#14213D;font-weight:600;text-decoration:none;border:1px solid #e3e6ea}.sra-go a:hover{background:#eef1f7}' +
      '.sra-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;margin-top:12px;border-radius:10px;border:0;background:#14213D;color:#fff;font:inherit;font-weight:700;cursor:pointer}.sra-btn.alt{background:#fff;color:#14213D;border:1px solid #14213D}' +
      '.sra-bar{position:fixed;left:0;right:0;bottom:0;z-index:70;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px 12px;padding:8px 12px;background:#F2B705;color:#1a1a1a;font:600 14px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 -4px 14px rgba(0,0,0,.2)}' +
      '.sra-bar b{font-weight:800}.sra-bar button{min-height:36px;padding:0 14px;border-radius:999px;border:1px solid #1a1a1a;background:#fff;color:#1a1a1a;font:inherit;font-weight:700;cursor:pointer}.sra-bar button.dark{background:#1a1a1a;color:#fff}' +
      'body.sra-demo{padding-bottom:64px}body.sra-demo .sra-panel{bottom:70px}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    var panel = document.createElement('div'); panel.className = 'sra-panel'; panel.hidden = true; panel.id = 'sraPanel';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-labelledby', 'sraTitle');
    document.body.appendChild(panel);

    var opener;
    if (inDemo) {
      document.body.classList.add('sra-demo');
      var bar = document.createElement('div'); bar.className = 'sra-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Demo mode');
      bar.innerHTML = '<span><b>Demo mode</b> · ' + esc(label(ROLES, demo.role)) + ' · ' + esc(label(PLANS[demo.role] || [], demo.plan)) + ' plan. Nothing you enter is kept.</span>' +
        '<button type="button" id="sraChange" aria-controls="sraPanel" aria-expanded="false">Change or go to</button><button type="button" class="dark" id="sraLeave">Leave demo</button>';
      document.body.appendChild(bar);
      opener = bar.querySelector('#sraChange');
      bar.querySelector('#sraLeave').addEventListener('click', function () { go('do=leave'); });
    } else {
      opener = document.createElement('button'); opener.type = 'button'; opener.className = 'sra-pill'; opener.textContent = 'Admin';
      opener.setAttribute('aria-controls', 'sraPanel'); opener.setAttribute('aria-expanded', 'false');
      document.body.appendChild(opener);
    }
    var mode = inDemo ? 'demo' : 'full';
    function render() {
      var role = inDemo ? demo.role : 'organiser';
      var h = '<h2 id="sraTitle">' + (inDemo ? 'Demo mode' : 'Admin') + '</h2>';
      if (!inDemo) {
        h += '<fieldset class="sra-modes"><legend>Mode</legend>' +
          '<label class="' + (mode === 'full' ? 'on' : '') + '"><input type="radio" name="sraMode" value="full"' + (mode === 'full' ? ' checked' : '') + '> Full access</label>' +
          '<label class="' + (mode === 'demo' ? 'on' : '') + '"><input type="radio" name="sraMode" value="demo"' + (mode === 'demo' ? ' checked' : '') + '> Demo</label></fieldset>';
      }
      if (mode === 'full') {
        h += '<p>You’re on your own account. Every area is open, with the top plan limits. <b>What you enter here is kept.</b></p><p style="font-weight:700;margin-top:10px">Go to</p><ul class="sra-go">' +
          AREAS.map(function (a) { return '<li><a href="' + a[0] + '">' + esc(a[1]) + '</a></li>'; }).join('') + '</ul>';
      } else {
        h += inDemo ? '<p>Change how the demo account looks, or open another area. Your demo data stays until you leave.</p>'
          : '<p>Opens a separate demo account. <b>Everything you enter in it is deleted when you leave demo mode or sign out.</b> Your own account isn’t touched.</p>';
        h += '<label for="sraRole">Show the site as</label><select id="sraRole">' + options(ROLES, role) + '</select>' +
          '<label for="sraPlan">Plan</label><select id="sraPlan">' + options(PLANS[role], inDemo ? demo.plan : PLANS[role][0][0]) + '</select>' +
          '<label for="sraTo">Open</label><select id="sraTo">' + options(AREAS, inDemo ? location.pathname : HOME_FOR[role]) + '</select>' +
          '<button type="button" class="sra-btn" id="sraStart">' + (inDemo ? 'Apply' : 'Start demo') + '</button>' +
          '<p class="mut" style="margin-top:12px">In demo mode, enquiries, team invites, feedback and payments are switched off, and the demo listing is hidden from everyone else, so no real user sees it.</p>';
        if (inDemo) h += '<button type="button" class="sra-btn alt" id="sraLeave2">Leave demo and delete the demo data</button>';
      }
      panel.innerHTML = h;
      var r = panel.querySelector('#sraRole');
      if (r) r.addEventListener('change', function () {
        panel.querySelector('#sraPlan').innerHTML = options(PLANS[r.value], PLANS[r.value][0][0]);
        if (!inDemo) panel.querySelector('#sraTo').value = HOME_FOR[r.value];
      });
      var b = panel.querySelector('#sraStart');
      if (b) b.addEventListener('click', function () {
        var q = 'role=' + encodeURIComponent(panel.querySelector('#sraRole').value) + '&plan=' + encodeURIComponent(panel.querySelector('#sraPlan').value) + '&to=' + encodeURIComponent(panel.querySelector('#sraTo').value);
        go((inDemo ? 'do=set&' : 'do=start&') + q);
      });
      var l2 = panel.querySelector('#sraLeave2'); if (l2) l2.addEventListener('click', function () { go('do=leave'); });
      Array.prototype.forEach.call(panel.querySelectorAll('input[name=sraMode]'), function (x) { x.addEventListener('change', function () { mode = x.value; render(); var f = panel.querySelector('input[name=sraMode]:checked'); if (f) f.focus(); }); });
    }
    function setOpen(o) { if (o) render(); panel.hidden = !o; opener.setAttribute('aria-expanded', String(o)); if (o) { var f = panel.querySelector('input,select,a,button'); if (f) f.focus(); } }
    opener.addEventListener('click', function (e) { e.stopPropagation(); setOpen(panel.hidden); });
    document.addEventListener('click', function (e) { if (!panel.hidden && !panel.contains(e.target) && e.target !== opener) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { setOpen(false); opener.focus(); } });
  }
})();
