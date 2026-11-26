/* ShowReady logos (build 83).
   Any signed-in user can add their own logo. It shows in the page header for them, on their supplier
   listing and market cards, and on the cover of the event pack PDF.
   Logos are shrunk in the browser to fit 512 x 512 pixels (WebP, or PNG where WebP isn't available) before
   upload, so each one is a few tens of KB. They live in the public "logos" bucket at <user id>/logo.
   Only the owner can write there; demo accounts and accounts whose logo was removed after a report can't. */
(function () {
  'use strict';
  if (window.SRLogo) return;
  var BASE = 'https://osqlwddeobiklrpdnons.supabase.co/storage/v1/object/public/logos/';
  var KEY = 'showready-logo', MAX_IN = 10 * 1024 * 1024, MAX_OUT = 300 * 1024;
  var ctx = { client: null, uid: null, v: null, after: null, msg: '', kind: '', busy: false };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function url(uid, v) { return uid && v ? BASE + encodeURIComponent(uid) + '/logo?v=' + encodeURIComponent(v) : ''; }
  function img(uid, v, cls, alt) {
    var u = url(uid, v); if (!u) return '';
    return '<img class="srlogo' + (cls ? ' srlogo-' + cls : '') + '" src="' + esc(u) + '" alt="' + esc(alt || 'Logo') + '" loading="lazy" decoding="async" onerror="this.remove()">';
  }
  // Only while that same user is signed in on this browser
  function readMine() {
    try {
      var m = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!m) return null;
      var t = JSON.parse(localStorage.getItem('sb-osqlwddeobiklrpdnons-auth-token') || 'null');
      return t && t.user && t.user.id === m.uid ? m : null;
    } catch (e) { return null; }
  }
  function writeMine(uid, v) { try { if (uid && v) localStorage.setItem(KEY, JSON.stringify({ uid: uid, v: v })); else localStorage.removeItem(KEY); } catch (e) {} }

  // ---- styles
  var css = '.srlogo{display:block;object-fit:contain;background:#fff;border-radius:8px}' +
    '.srlogo-head{height:34px;width:auto;max-width:120px;padding:2px 6px;border:1px solid rgba(0,0,0,.08)}' +
    '.srlogo-card{float:right;width:64px;height:64px;margin:0 0 8px 12px;border:1px solid #e3e6e1;padding:4px}' +
    '.srlogo-big{width:120px;height:120px;border:1px solid #e3e6e1;padding:6px}' +
    '.srlogo-box{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin:8px 0}' +
    '.srlogo-empty{width:120px;height:120px;border:2px dashed #c9cec6;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#6b7280;font-size:13px;text-align:center;padding:8px;box-sizing:border-box}' +
    '.srlogo-file{position:absolute;width:1px;height:1px;opacity:0;overflow:hidden;clip:rect(0 0 0 0);pointer-events:none}' +
    '.srlogo-rep{background:none;border:0;padding:0;color:#6b7280;font-size:12px;text-decoration:underline;cursor:pointer;clear:both}' +
    '#srMyLogo{margin-left:10px}@media (max-width:440px){#srMyLogo{display:none}}';
  function addCss() { if (document.getElementById('srLogoCss')) return; var s = document.createElement('style'); s.id = 'srLogoCss'; s.textContent = css; (document.head || document.documentElement).appendChild(s); }

  // ---- the user's own logo in the page header
  function paint() {
    var m = readMine(), cur = document.getElementById('srMyLogo');
    var brand = document.querySelector('.topbar .brand, .top .logo, header .logo, header .brand');
    if (!m || !brand) { if (cur) cur.remove(); return; }
    var u = url(m.uid, m.v);
    if (cur) { if (cur.getAttribute('src') !== u) cur.setAttribute('src', u); return; }
    var i = document.createElement('img'); i.id = 'srMyLogo'; i.className = 'srlogo srlogo-head'; i.alt = 'Your logo'; i.src = u;
    i.onerror = function () { i.remove(); };
    brand.insertAdjacentElement('afterend', i);
  }
  function setMine(uid, v) { ctx.v = v || null; writeMine(uid, v); paint(); }

  // ---- shrink in the browser
  function prepare(file) {
    return new Promise(function (res, rej) {
      if (!file) return rej(new Error('Choose a picture first.'));
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return rej(new Error('Use a PNG, JPG or WebP picture. SVG and other files aren’t accepted.'));
      if (file.size > MAX_IN) return rej(new Error('That picture is over 10 MB. Use a smaller copy.'));
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        URL.revokeObjectURL(u);
        if (!im.naturalWidth || !im.naturalHeight) return rej(new Error('That picture couldn’t be read. Try another file.'));
        var tries = [[512, 0.86], [384, 0.8], [256, 0.75]];
        (function next(k) {
          var t = tries[k], s = Math.min(1, t[0] / Math.max(im.naturalWidth, im.naturalHeight));
          var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.naturalWidth * s)); c.height = Math.max(1, Math.round(im.naturalHeight * s));
          var g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, c.width, c.height);
          c.toBlob(function (b) {
            if (!b) return rej(new Error('That picture couldn’t be read. Try another file.'));
            if (b.type !== 'image/webp' && b.type !== 'image/png') return rej(new Error('Your browser couldn’t prepare the picture.'));
            if (b.size > MAX_OUT && k < tries.length - 1) return next(k + 1);
            if (b.size > MAX_OUT) return rej(new Error('That picture is too detailed to shrink. Try a simpler version of your logo.'));
            res(b);
          }, 'image/webp', t[1]);
        })(0);
      };
      im.onerror = function () { URL.revokeObjectURL(u); rej(new Error('That picture couldn’t be read. Try another file.')); };
      im.src = u;
    });
  }
  function nice(e) {
    var m = (e && (e.message || e.error_description || e.error)) || '';
    if (/demo/i.test(m)) return 'Logos can’t be added in demo mode.';
    if (/row-level security|policy|unauthori[sz]ed|403/i.test(m)) return 'You can’t add a logo to this account.';
    if (/fetch|network/i.test(m)) return 'Couldn’t reach ShowReady. Check your connection and try again.';
    return m || 'Something went wrong. Try again.';
  }
  function upload(file) {
    if (!ctx.client || !ctx.uid) return Promise.reject(new Error('Log in first.'));
    var uid = ctx.uid, c = ctx.client, v = Date.now();
    return prepare(file).then(function (b) {
      return c.storage.from('logos').upload(uid + '/logo', b, { upsert: true, contentType: b.type, cacheControl: '31536000' });
    }).then(function (r) { if (r && r.error) throw r.error; return c.rpc('set_my_logo', { v: v }); })
      .then(function (r) { if (r && r.error) throw r.error; setMine(uid, v); });
  }
  function remove() {
    if (!ctx.client || !ctx.uid) return Promise.reject(new Error('Log in first.'));
    var uid = ctx.uid, c = ctx.client;
    return c.rpc('set_my_logo', { v: null }).then(function (r) {
      if (r && r.error) throw r.error;
      return c.storage.from('logos').remove([uid + '/logo']).catch(function () {});
    }).then(function () { setMine(uid, null); });
  }

  // ---- account panel section
  function html() {
    if (!ctx.uid) return '';
    var has = !!ctx.v;
    return '<hr><h2 style="font-size:16px">Your logo</h2>' +
      '<p class="muted" style="font-size:13px">Optional. It shows at the top of your pages, on your supplier listing and on the cover of your event pack. PNG, JPG or WebP; a square logo on a plain or see-through background works best.</p>' +
      '<div class="srlogo-box">' + (has ? img(ctx.uid, ctx.v, 'big', 'Your logo') : '<div class="srlogo-empty">No logo yet</div>') +
      '<div class="row" style="margin:0"><label class="btn small" for="srLogoFile" style="cursor:pointer">' + (has ? 'Change logo' : 'Add a logo') + '</label>' +
      '<input type="file" id="srLogoFile" class="srlogo-file" accept="image/png,image/jpeg,image/webp">' +
      (has ? '<button class="btn small" type="button" data-logo-act="remove">Remove</button>' : '') + '</div></div>' +
      (ctx.msg ? '<div class="msg ' + (ctx.kind === 'bad' ? 'bad' : 'ok') + '" role="status">' + esc(ctx.msg) + '</div>' : '');
  }
  function say(m, k) { ctx.msg = m; ctx.kind = k || ''; if (ctx.after) ctx.after(); }
  // The account panel calls this whenever it loads the profile
  function bind(client, uid, v, after) {
    if (uid !== ctx.uid) { ctx.msg = ''; }
    ctx.client = client; ctx.uid = uid || null; ctx.after = after || null;
    if (uid) setMine(uid, v); else { ctx.v = null; writeMine(null); paint(); }
  }

  document.addEventListener('change', function (e) {
    var f = e.target; if (!f || f.id !== 'srLogoFile' || !f.files || !f.files[0] || ctx.busy) return;
    ctx.busy = true; say('Uploading your logo…');
    upload(f.files[0]).then(function () { say('Logo saved.'); }, function (err) { say(nice(err), 'bad'); })
      .then(function () { ctx.busy = false; f.value = ''; if (ctx.after) ctx.after(); });
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-logo-act],[data-logo-report]') : null; if (!b) return;
    if (b.getAttribute('data-logo-act') === 'remove') {
      if (ctx.busy) return; ctx.busy = true; say('Removing…');
      remove().then(function () { say('Logo removed.'); }, function (err) { say(nice(err), 'bad'); }).then(function () { ctx.busy = false; if (ctx.after) ctx.after(); });
      return;
    }
    var owner = b.getAttribute('data-logo-report');
    if (owner) {
      e.preventDefault();
      if (!ctx.client || !ctx.uid) { b.textContent = 'Log in to report a logo.'; return; }
      b.disabled = true;
      ctx.client.from('logo_reports').insert({ owner: owner, reporter: ctx.uid, reason: 'Reported from the supplier list' }).then(function (r) {
        b.textContent = r && r.error && !/duplicate|unique/i.test(r.error.message || '') ? 'Couldn’t send the report. Try again later.' : 'Thanks, we’ll check this logo.';
      }, function () { b.textContent = 'Couldn’t send the report. Try again later.'; });
    }
  });

  // ---- for the event pack PDF: the logo as a PNG data URL and its size
  function pdfImage() {
    var m = readMine(); if (!m) return Promise.resolve(null);
    return new Promise(function (res) {
      var im = new Image(); im.crossOrigin = 'anonymous';
      var done = setTimeout(function () { res(null); }, 6000);
      im.onload = function () {
        clearTimeout(done);
        try { var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); res({ data: c.toDataURL('image/png'), w: c.width, h: c.height }); }
        catch (e) { res(null); }
      };
      im.onerror = function () { clearTimeout(done); res(null); };
      im.src = url(m.uid, m.v);
    });
  }

  window.SRLogo = { url: url, img: img, bind: bind, html: html, paint: paint, prepare: prepare, pdfImage: pdfImage, mine: readMine,
    reportBtn: function (owner) { return '<button type="button" class="srlogo-rep" data-logo-report="' + esc(owner) + '">Report this logo</button>'; } };
  addCss();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paint); else paint();
})();
