/* ShowReady Build 104 (posting plan added in Build 111, see /campaign.js): the Promote tab (posters and social posts made from the organiser's event).
   Drawing is done by /promo.js (SRPromo) in the browser. Settings are kept on the event as e.promo and saved
   with the plan. Access: everything is free during the pilot; after that the Promo Pack (one event) or the
   Promo Campaign (all events) removes the "Made with ShowReady" footer and opens every format.
   Data: public.promo_access, read through public.my_promo(plan). */
(function () {
  'use strict';
  if (window.SRPromote) return;
  var V = '111';
  var LIBS = ['/promo.js?v=' + V, '/vendor/qrcode-generator@1.4.4/qrcode.js', '/campaign.js?v=' + V];
  var JSPDF = '/vendor/jspdf@2.5.1/jspdf.umd.min.js', JSZIP = '/vendor/jszip@3.10.1/jszip.min.js';
  var PRICES = { pack: '£14.99 per event', campaign: '£11 a month' };
  var S = window.SRPromote = { pview: /[?&]view=campaign\b/.test(location.search) ? 'campaign' : 'posters', el: null, style: null, size: 'a4', access: null, market: null, logos: { charity: null, sponsors: [] }, ready: false };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function A() { return window.SRAccount || {}; }
  function PL() { return window.SRPlanner || {}; }
  function ev() { try { return (PL().event && PL().event()) || {}; } catch (e) { return {}; } }
  function pr() { var e = ev(); if (!e.promo || typeof e.promo !== 'object') e.promo = {}; return e.promo; }
  function saveSoon() { clearTimeout(S.st); S.st = setTimeout(function () { try { PL().savePack && PL().savePack(); } catch (e) {} }, 600); }
  function load(src) {
    return new Promise(function (res, rej) {
      if (document.querySelector('script[data-pm="' + src + '"]')) { var t = setInterval(function () { if (S['ok' + src]) { clearInterval(t); res(); } }, 50); return; }
      var s = document.createElement('script'); s.src = src; s.async = true; s.setAttribute('data-pm', src);
      s.onload = function () { S['ok' + src] = true; res(); }; s.onerror = function () { rej(new Error('Couldn’t load ' + src)); }; document.head.appendChild(s);
    });
  }
  function libs() { return Promise.all(LIBS.map(load)); }

  var css = '.pm-wrap{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,440px);gap:18px;align-items:start}@media(max-width:900px){.pm-wrap{grid-template-columns:1fr}}' +
    '.pm-card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:16px;margin-bottom:14px}.pm-card h3{margin:0 0 8px;font-size:17px}' +
    '.pm-card label{display:block;font-weight:700;font-size:14px;margin:10px 0 4px}.pm-card input[type=text],.pm-card input[type=url],.pm-card textarea,.pm-card select{width:100%;min-height:44px;border:1px solid var(--line);border-radius:12px;padding:8px 12px;font:inherit;box-sizing:border-box;background:var(--surface)}' +
    '.pm-card textarea{min-height:70px}.pm-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.pm-row input{flex:1 1 120px}' +
    '.pm-chips{display:flex;flex-wrap:wrap;gap:6px}.pm-chip{min-height:38px;padding:0 12px;border-radius:999px;border:1px solid var(--line);background:var(--surface);font:inherit;font-size:14px;font-weight:700;cursor:pointer;color:var(--ink);display:inline-flex;align-items:center;gap:6px}' +
    '.pm-chip[aria-pressed="true"]{background:var(--brand);border-color:var(--brand);color:var(--brand-ink,#fff)}.pm-chip canvas{width:22px;height:22px}' +
    '.pm-styles{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px}.pm-style{border:2px solid var(--line);border-radius:12px;padding:4px;background:var(--surface);cursor:pointer;font:inherit;font-size:12px;font-weight:700;color:var(--ink)}' +
    '.pm-style[aria-pressed="true"]{border-color:var(--brand);box-shadow:0 0 0 2px var(--brand)}.pm-style canvas{width:100%;height:auto;display:block;border-radius:8px;margin-bottom:4px}' +
    '.pm-prev{position:sticky;top:12px}.pm-prev canvas{width:100%;height:auto;border-radius:10px;box-shadow:0 4px 18px rgba(0,0,0,.15);background:#eee}' +
    '.pm-small{font-size:13px;color:var(--muted)}.pm-ok{color:#1E5A43;font-weight:800}.pm-err{color:#B3261E;font-weight:700}.pm-acc{border-radius:12px;padding:10px 12px;background:var(--surface-2);font-size:14px;margin-bottom:10px}' +
    '.pm-on{display:grid;gap:6px;margin-top:8px}.pm-on .pm-row input{min-height:38px}.pm-cap{white-space:pre-wrap;background:var(--surface-2);border-radius:12px;padding:10px;font-size:14px}' +
    '.pm-logos{display:flex;gap:8px;flex-wrap:wrap}.pm-logo{position:relative;border:1px solid var(--line);border-radius:10px;padding:4px;background:#fff}.pm-logo img{height:44px;display:block}.pm-logo button{position:absolute;top:-8px;right:-8px;width:24px;height:24px;border-radius:50%;border:0;background:#B3261E;color:#fff;font-weight:800;cursor:pointer}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ---- access
  function checkAccess() {
    var a = A();
    if (!a.user || !a.client) { S.access = 'none'; return Promise.resolve('none'); }
    return Promise.resolve(a.ensurePlanId ? a.ensurePlanId() : null).then(function (pid) {
      S.planId = pid;
      return Promise.all([a.client.rpc('my_promo', { p_plan: pid || null }), pid ? a.client.from('markets').select('code,kinds,fee_note,closes_on,open').eq('plan_id', pid).maybeSingle() : { data: null }]);
    }).then(function (r) {
      S.access = (r[0] && !r[0].error && r[0].data) || 'none'; S.market = (r[1] && r[1].data) || null; return S.access;
    }).catch(function () { S.access = 'none'; return 'none'; });
  }
  // Ticket sites: the organiser signs up through ShowReady's referral link, sets up tickets there, then pastes their
  // event's ticket page here. The QR opens that page (buyers never see a sign-up page). "Own link" takes any web address.
  var TICKET_SITES = {
    'Ticket Tailor': /(^|\.)(tickettailor\.com|buytickets\.at)$/i,
    'TicketSource': /(^|\.)ticketsource\.(co\.uk|com|eu|us)$/i,
    'Skiddle': /(^|\.)skiddle\.com$/i
  };
  function ticketSites() {
    var st = window.SR_SETTINGS_LIVE || (typeof SR_DEFAULTS !== 'undefined' ? SR_DEFAULTS : {}), tk = st.ticketing || {};
    if (tk.enabled === false) return [];
    return [].concat(tk.community || [], tk.music || []).filter(function (x) { return x && x.name && x.url; });
  }
  function hostOf(u) { try { return new URL(u).hostname; } catch (e) { return ''; } }
  function ticketCheck(site, url) {
    if (!url) return '';
    if (!/^https:\/\//i.test(url) || !hostOf(url)) return 'That doesn’t look like a web address. Copy it from your browser’s address bar.';
    if (site && site !== 'own' && TICKET_SITES[site] && !TICKET_SITES[site].test(hostOf(url))) return 'That link isn’t a ' + site + ' page. Paste the link to your event’s ticket page on ' + site + ', or choose “My own link”.';
    return '';
  }
  function paid() { return S.access === 'pilot' || S.access === 'pack' || S.access === 'campaign'; }
  function accessHtml() {
    var a = S.access;
    if (a === 'pilot') return '<div class="pm-acc"><span class="pm-ok">Everything is free during the pilot.</span> From 1 February 2027 the full tool is the <strong>Promo Pack</strong> (' + PRICES.pack + ') or the <strong>Promo Campaign</strong> (' + PRICES.campaign + ', all your events). Prices include VAT.</div>';
    if (a === 'campaign') return '<div class="pm-acc"><span class="pm-ok">Promo Campaign:</span> every format for all your events.</div>';
    if (a === 'pack') return '<div class="pm-acc"><span class="pm-ok">Promo Pack:</span> every format for this event, with free updates until the event.</div>';
    return '<div class="pm-acc">Free: preview everything and download the A4 poster and square post with a small “Made with ShowReady” line. <strong>Promo Pack</strong> (' + PRICES.pack + ') unlocks every format without it, for this event. <strong>Promo Campaign</strong> (' + PRICES.campaign + ') covers all your events. ' +
      (A().user ? '<a href="mailto:hello@beshowready.co.uk?subject=Promo%20Pack">Ask us to switch it on</a>' : 'Log in and save your plan to keep your settings with your account.') + '</div>';
  }

  // ---- settings helpers
  function facts() { var P = window.SRPromo; return P.fromEvent(ev(), PL().sitePlan ? PL().sitePlan() : null, PL().pack ? PL().pack() : null); }
  function styleId() { var p = pr(); return p.style || S.style || 'fete'; }
  function fontOpt() { var p = pr(); return p.font ? p.font : null; }
  function iconStyle() { var p = pr(), P = window.SRPromo; return p.iconStyle && P.ICON_STYLES[p.iconStyle] ? p.iconStyle : P.iconStylesFor(styleId())[0]; }
  function onKeys() { var p = pr(); return p.on || window.SRPromo.suggestOn(ev(), PL().sitePlan ? PL().sitePlan() : null); }
  function img(src) { return new Promise(function (res) { if (!src) return res(null); var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { res(null); }; i.src = src; }); }
  function loadLogos() {
    var p = pr(), L = p.logos || {};
    return Promise.all([img(L.charity)].concat((L.sponsors || []).map(img))).then(function (r) { S.logos = { charity: r[0], sponsors: r.slice(1).filter(Boolean) }; });
  }
  function drawOpts(forDownload) {
    var p = pr(), footer = paid() ? !!p.showMade : true;
    return { font: fontOpt(), iconStyle: iconStyle(), footer: footer, charityLogo: S.logos.charity, sponsors: S.logos.sponsors, scale: forDownload || 1 };
  }

  // ---- render
  S.draw = function (el) {
    S.el = el || S.el; if (!S.el) return;
    S.el.innerHTML = '<div class="section-head"><h2>Promote</h2><span>Posters and social posts made from your event</span></div><p class="pm-small">Loading the poster maker…</p>';
    libs().then(function () { return Promise.all([checkAccess(), loadLogos()]); }).then(function () {
      var P = window.SRPromo; return P.loadFonts(P.fontsFor(styleId(), fontOpt()));
    }).then(function () { S.ready = true; build(); }).catch(function (err) {
      S.el.innerHTML = '<div class="pm-card"><p class="pm-err">' + esc(err.message || err) + '</p><p><button class="btn" type="button" onclick="SRPromote.draw()">Try again</button></p></div>';
    });
  };

  function viewSwitch() {
    return '<div class="pm-chips" role="group" aria-label="Promote" style="margin:0 0 12px"><button type="button" class="pm-chip" data-pview="posters" aria-pressed="' + (S.pview === 'posters') + '">Posters and posts</button><button type="button" class="pm-chip" data-pview="campaign" aria-pressed="' + (S.pview === 'campaign') + '">Posting plan</button></div>';
  }
  function build() {
    if (S.pview === 'campaign' && window.SRCampaign) {
      S.el.innerHTML = '<div class="section-head"><h2>Promote</h2><span>Posters and social posts made from your event</span></div>' + accessHtml() + viewSwitch() + '<div id="pmCampaign"></div>';
      S.el.querySelectorAll('[data-pview]').forEach(function (b) { b.addEventListener('click', function () { S.pview = b.getAttribute('data-pview'); build(); }); });
      window.SRCampaign.draw(document.getElementById('pmCampaign')); return;
    }
    var P = window.SRPromo, p = pr(), e = ev(), f = facts(), example = PL().example && PL().example();
    var prices = (p.prices && p.prices.length) ? p.prices : (e.entry === 'paid' ? [{ label: 'Adults', amount: '' }, { label: 'Children', amount: '' }] : []);
    var h = '<div class="section-head"><h2>Promote</h2><span>Posters and social posts made from your event</span></div>' + accessHtml() + viewSwitch();
    if (example) h += '<p class="note">This is the example event. Once you plan your own event, its name, date, times and activities fill in here automatically.</p>';
    h += '<div class="pm-wrap"><div>';
    // look
    h += '<div class="pm-card"><h3>1. Style</h3><div class="pm-styles" id="pmStyles">' + Object.keys(P.STYLES).map(function (k) { return '<button type="button" class="pm-style" data-style="' + k + '" aria-pressed="' + (k === styleId()) + '"><canvas width="248" height="350"></canvas>' + esc(P.STYLES[k].name) + '</button>'; }).join('') + '</div>' +
      '<label for="pmFont">Heading font</label><select id="pmFont"><option value="">The style’s own font</option>' + P.HEADINGS.map(function (x) { var on = p.font && p.font[0] === x[0]; return '<option value="' + esc(x[0]) + '|' + x[1] + '"' + (on ? ' selected' : '') + '>' + esc(x[0]) + ' (' + esc(x[2]) + ')</option>'; }).join('') + '</select>' +
      '<label>Icon style</label><div class="pm-chips" id="pmIconStyles">' + P.iconStylesFor(styleId()).map(function (k, i) { var suits = P.ICON_STYLES[k].suits.indexOf(styleId()) !== -1; return '<button type="button" class="pm-chip" data-istyle="' + k + '" aria-pressed="' + (k === iconStyle()) + '"><canvas width="44" height="44"></canvas>' + esc(P.ICON_STYLES[k].name) + (suits && i < 3 ? ' <span class="pm-small">suits</span>' : '') + '</button>'; }).join('') + '</div></div>';
    // details
    h += '<div class="pm-card"><h3>2. Details</h3>' +
      '<label for="pmTitle">Event name on the poster</label><input type="text" id="pmTitle" maxlength="80" value="' + esc(p.title || '') + '" placeholder="' + esc(e.eventName || 'Your event') + '">' +
      '<p class="pm-small">Date: ' + esc(f.date || 'not set yet (add it in your plan)') + '. Times: ' + esc(f.time || 'add start and finish times on the Applications tab') + '.</p>' +
      '<label for="pmVenue">Venue</label><input type="text" id="pmVenue" maxlength="90" value="' + esc(p.venue || '') + '" placeholder="' + esc(f.venue || 'e.g. Mossley Park') + '">' +
      '<label for="pmExtra">Extra line (optional)</label><input type="text" id="pmExtra" maxlength="90" value="' + esc(p.extra || '') + '" placeholder="e.g. Free parking · Dogs welcome on leads">' +
      '<label for="pmLineup">Line-up: bands, acts and DJs (optional, separate with commas)</label><textarea id="pmLineup" maxlength="400" placeholder="e.g. The Mossley Brass Band, DJ Sunny Dee">' + esc(p.lineup || '') + '</textarea></div>';
    // prices and tickets
    h += '<div class="pm-card"><h3>3. Prices and tickets</h3><p class="pm-small">The first line is shown large. Leave them all empty for “Free entry”.</p><div id="pmPrices">' +
      prices.map(function (x, i) { return priceRow(x, i); }).join('') + '</div><p><button type="button" class="btn small" data-pm="addPrice">Add a price</button></p>' +
      '<label for="pmPriceNote">Note under the prices (optional)</label><input type="text" id="pmPriceNote" maxlength="90" value="' + esc(p.priceNote || '') + '" placeholder="e.g. Advance tickets online, or pay on the gate">' +
      ticketHtml(p) + '</div>';
    // what's on
    var keys = onKeys();
    h += '<div class="pm-card"><h3>4. What’s on</h3><p class="pm-small">Tap to add or remove. Change any label, for example “Fireworks 7.30pm”.</p><div class="pm-chips" id="pmOnChips">' +
      Object.keys(P.ICONS).map(function (k) { return '<button type="button" class="pm-chip" data-on="' + k + '" aria-pressed="' + (keys.indexOf(k) !== -1) + '"><canvas width="44" height="44"></canvas>' + esc(P.ICONS[k]) + '</button>'; }).join('') +
      '</div><div class="pm-on" id="pmOnLabels">' + keys.map(function (k) { return '<div class="pm-row"><span style="min-width:120px;font-weight:700">' + esc(P.ICONS[k] || k) + '</span><input type="text" maxlength="40" data-label="' + k + '" value="' + esc((p.labels && p.labels[k]) || '') + '" placeholder="' + esc(P.ICONS[k] || '') + '"></div>'; }).join('') +
      '</div><p><button type="button" class="btn small" data-pm="resetOn">Go back to the suggested list</button></p></div>';
    // charity and sponsors
    var L = p.logos || {};
    h += '<div class="pm-card"><h3>5. Charity and sponsors (optional)</h3>' +
      '<label for="pmCharity">Charity or good cause</label><input type="text" id="pmCharity" maxlength="80" value="' + esc(p.charity || '') + '" placeholder="e.g. Willow Wood Hospice">' +
      '<label>Charity logo</label><div class="pm-logos">' + (L.charity ? '<span class="pm-logo"><img src="' + esc(L.charity) + '" alt="Charity logo"><button type="button" data-pm="delCharity" aria-label="Remove charity logo">×</button></span>' : '') + '</div>' +
      '<p><input type="file" id="pmCharityFile" accept="image/png,image/jpeg,image/webp,image/svg+xml"></p>' +
      '<label>Sponsor logos (up to 6)</label><div class="pm-logos">' + (L.sponsors || []).map(function (s, i) { return '<span class="pm-logo"><img src="' + esc(s) + '" alt="Sponsor logo ' + (i + 1) + '"><button type="button" data-pm="delSponsor" data-i="' + i + '" aria-label="Remove sponsor logo ' + (i + 1) + '">×</button></span>'; }).join('') + '</div>' +
      ((L.sponsors || []).length < 6 ? '<p><input type="file" id="pmSponsorFile" accept="image/png,image/jpeg,image/webp,image/svg+xml"></p>' : '') +
      '<label class="ck" style="display:flex;gap:8px;font-weight:400"><input type="checkbox" id="pmLogoOk"' + (p.logoOk ? ' checked' : '') + '> I have permission to use these logos.</label>' +
      '<p class="pm-small">Logos only appear on your posters once this is ticked. Square posts and the Facebook cover show the charity name instead of logos, to keep them readable.</p></div>';
    // trader poster
    h += '<div class="pm-card"><h3>Trader recruiting poster</h3>' + (S.market && S.market.code
      ? '<p>A poster asking food traders, stalls and crafts to apply, with a QR code to your application link.</p><p><button type="button" class="btn" data-pm="traderPoster" aria-pressed="' + (!!S.traderMode) + '">' + (S.traderMode ? 'Back to the event poster' : 'Show the trader poster') + '</button></p>'
      : '<p class="pm-small">Open trader applications on the Traders tab first, then come back here for a poster with a QR code to your application link.</p>') + '</div>';
    h += '</div>';
    // preview and downloads
    h += '<div class="pm-prev"><div class="pm-card"><h3>Preview</h3><div class="pm-chips" id="pmSizes">' + Object.keys(P.SIZES).map(function (k) { return '<button type="button" class="pm-chip" data-size="' + k + '" aria-pressed="' + (k === S.size) + '">' + esc(P.SIZES[k][2]) + '</button>'; }).join('') + '</div>' +
      '<p style="margin:12px 0"><canvas id="pmCanvas" aria-label="Poster preview" role="img"></canvas></p><div id="pmDl"></div>' +
      (paid() ? '<label class="ck" style="display:flex;gap:8px;font-weight:400;font-size:14px"><input type="checkbox" id="pmMade"' + (p.showMade ? ' checked' : '') + '> Show “Made with ShowReady” on my posters</label>' : '') +
      '<p class="pm-err" id="pmErr" role="alert"></p></div>' +
      '<div class="pm-card"><h3>Caption</h3><div class="pm-cap" id="pmCap"></div><p><button type="button" class="btn small" data-pm="copyCap">Copy caption</button> <span class="pm-small" id="pmCapMsg" aria-live="polite"></span></p>' +
      '<details><summary><strong>How to post it</strong></summary><ul class="pm-small">' +
      '<li><strong>Facebook page or event:</strong> download the 4:5 post, then Create post, Photo, choose the file, paste the caption.</li>' +
      '<li><strong>Facebook event cover:</strong> open your event, Edit, Change photo, Upload, choose the Facebook event cover file.</li>' +
      '<li><strong>Instagram:</strong> download the 4:5 post to your phone, tap +, Post, pick it, paste the caption. Put the ticket link in your bio or a story link sticker.</li>' +
      '<li><strong>Stories:</strong> download the 9:16 story, add it to your story, then add a Link sticker with your ticket link.</li>' +
      '<li><strong>Facebook groups, WhatsApp and Nextdoor:</strong> post the square image with the caption. Check each group’s rules on adverts first.</li>' +
      '<li><strong>Printing:</strong> the A4 and A3 PDFs print edge to edge at a print shop. On a home printer choose “fit to page”.</li></ul></details></div></div></div>';
    S.el.innerHTML = h;
    thumbs(); preview(); wire();
  }
  function ticketHtml(p) {
    var sites = ticketSites(), site = p.ticketSite || (p.ticketUrl ? 'own' : ''), cur = sites.filter(function (x) { return x.name === site; })[0];
    var h = '<label for="pmTicketSite">Selling tickets online? (optional)</label><select id="pmTicketSite"><option value="">No online tickets</option>' +
      sites.map(function (x) { return '<option value="' + esc(x.name) + '"' + (x.name === site ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') +
      '<option value="own"' + (site === 'own' ? ' selected' : '') + '>My own link</option></select>';
    if (cur) h += '<p class="pm-small">' + esc(cur.note || '') + '</p><ol class="pm-small" style="padding-left:18px;margin:6px 0">' +
      '<li><a href="' + esc(cur.url) + '" target="_blank" rel="noopener sponsored">Open ' + esc(cur.name) + ' and set up your tickets</a> (opens in a new tab). Sign up, create your event and set your ticket prices there; ' + esc(cur.name) + ' takes the payments.</li>' +
      '<li>When your event is ready, copy its ticket page link from ' + esc(cur.name) + ' and paste it below.</li><li>Your posters get a QR code that opens that page. Test it with your phone before you print.</li></ol>';
    if (site) h += '<label for="pmTicket">' + (site === 'own' ? 'Your ticket page link' : 'Your ' + esc(site) + ' event link') + '</label><input type="url" id="pmTicket" maxlength="300" value="' + esc(p.ticketUrl || '') + '" placeholder="https://…">' +
      '<p class="pm-err" id="pmTicketErr" role="alert">' + esc(ticketCheck(site, p.ticketUrl || '')) + '</p>';
    var tk = (window.SR_SETTINGS_LIVE || (typeof SR_DEFAULTS !== 'undefined' ? SR_DEFAULTS : {})).ticketing || {};
    if (cur && tk.disclosure) h += '<p class="pm-small">' + esc(tk.disclosure) + '</p>';
    return h;
  }
  function priceRow(x, i) { return '<div class="pm-row" data-price="' + i + '" style="margin-bottom:6px"><input type="text" maxlength="30" data-pl="label" value="' + esc(x.label || '') + '" placeholder="e.g. Adults" aria-label="Ticket type ' + (i + 1) + '"><input type="text" maxlength="20" data-pl="amount" value="' + esc(x.amount || '') + '" placeholder="e.g. £5" aria-label="Price ' + (i + 1) + '"><button type="button" class="btn small" data-pm="delPrice" data-i="' + i + '" aria-label="Remove price ' + (i + 1) + '">Remove</button></div>'; }

  function thumbs() {
    var P = window.SRPromo, f = facts();
    var fams = []; Object.keys(P.STYLES).forEach(function (k) { fams = fams.concat(P.fontsFor(k)); });
    P.loadFonts(fams).then(function () {
      S.el.querySelectorAll('[data-style] canvas').forEach(function (c) {
        var k = c.parentNode.getAttribute('data-style'), big = document.createElement('canvas');
        P.draw(big, { title: f.title, date: f.date, priceMain: f.priceMain, on: f.on.slice(0, 3) }, k, 'a4', { font: null, scale: 0.25 });
        c.getContext('2d').drawImage(big, 0, 0, c.width, c.height);
      });
    });
    var col = function () { var st = P.STYLES[styleId()]; return { main: st.accent2 === st.ink ? st.accent : st.accent2, soft: st.soft }; };
    S.el.querySelectorAll('[data-istyle] canvas').forEach(function (c) { var x = c.getContext('2d'); x.clearRect(0, 0, 44, 44); P.drawIcon(x, 'music', c.parentNode.getAttribute('data-istyle'), 2, 2, 40, col()); });
    S.el.querySelectorAll('[data-on] canvas').forEach(function (c) { var x = c.getContext('2d'); P.drawIcon(x, c.parentNode.getAttribute('data-on'), 'line', 4, 4, 36, { main: '#1E5A43', soft: '#DDEBE3' }); });
  }
  function currentFacts() {
    var P = window.SRPromo;
    if (S.traderMode && S.market) return P.traderFacts(ev(), S.market, traderLink());
    return facts();
  }
  function traderLink() { return 'https://beshowready.co.uk/apply/?m=' + encodeURIComponent(S.market.code); }
  function preview() {
    var P = window.SRPromo, c = document.getElementById('pmCanvas'); if (!c) return;
    P.loadFonts(P.fontsFor(styleId(), fontOpt())).then(function () {
      P.draw(c, currentFacts(), styleId(), S.size, drawOpts());
      caption(); downloads();
    });
  }
  function caption() {
    var f = facts(), on = f.on.map(function (o) { return o[1]; }), el = document.getElementById('pmCap'); if (!el) return;
    var lines = [f.title + (f.date ? ' is on ' + f.date : '') + (f.time ? ', ' + f.time : '') + (f.venue ? ' at ' + f.venue : '') + '.'];
    if (on.length) lines.push(on.slice(0, -1).join(', ') + (on.length > 1 ? ' and ' : '') + on[on.length - 1] + '.');
    if (f.lineup) lines.push('Line-up: ' + String(f.lineup).split(/\s*[,\n]\s*/).filter(Boolean).join(', ') + '.');
    lines.push([f.priceMain].concat(f.priceLines).join(' · ') + (f.priceNote ? '. ' + f.priceNote : '') + '.');
    if (f.url) lines.push('Tickets: ' + f.url);
    if (f.charity) lines.push('All in aid of ' + f.charity + '.');
    var tag = '#' + String(f.title || '').replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean).map(function (w) { return w[0].toUpperCase() + w.slice(1); }).join('');
    if (tag.length > 2 && tag.length < 40) lines.push(tag);
    el.textContent = lines.join('\n\n');
  }
  function downloads() {
    var el = document.getElementById('pmDl'); if (!el) return;
    var full = paid(), sz = S.size, h = '';
    var freeOk = sz === 'a4' || sz === 'square';
    if (full || freeOk) h += '<button type="button" class="btn primary" data-pm="png">Download image (PNG)</button> ';
    if (sz === 'a4' && (full || freeOk)) h += '<button type="button" class="btn" data-pm="pdf" data-paper="a4">A4 PDF</button> ';
    if (sz === 'a4' && full) h += '<button type="button" class="btn" data-pm="pdf" data-paper="a3">A3 PDF</button> <button type="button" class="btn" data-pm="pdf" data-paper="a5">A5 flyer PDF</button> ';
    if (full) h += '<p><button type="button" class="btn" data-pm="zip">Download every format (zip)</button></p>';
    if (!full && !freeOk) h += '<p class="pm-small">This format comes with the Promo Pack (' + PRICES.pack + ') or the Promo Campaign.</p>';
    el.innerHTML = h;
  }
  function fname(sz, ext) { var t = String(currentFacts().title || 'poster').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'poster'; return t + (S.traderMode ? '-traders' : '') + '-' + sz + '.' + ext; }
  function save(blob, name) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
  function render(sz, scale) { var P = window.SRPromo, c = document.createElement('canvas'); P.draw(c, currentFacts(), styleId(), sz, drawOpts(scale)); return c; }
  function doDownload(kind, paper) {
    var P = window.SRPromo, err = document.getElementById('pmErr'); err.textContent = '';
    return P.loadFonts(P.fontsFor(styleId(), fontOpt())).then(function () {
      if (kind === 'png') return P.toBlob(render(S.size, 1)).then(function (b) { save(b, fname(S.size, 'png')); });
      if (kind === 'pdf') return load(JSPDF).then(function () { save(P.toPDF(render('a4', paper === 'a3' ? 2 : 1.4), paper), fname(paper, 'pdf')); });
      if (kind === 'zip') return Promise.all([load(JSZIP), load(JSPDF)]).then(function () {
        var z = new window.JSZip(), jobs = Object.keys(P.SIZES).map(function (k) { return P.toBlob(render(k, 1)).then(function (b) { z.file(fname(k, 'png'), b); }); });
        z.file(fname('a4', 'pdf'), P.toPDF(render('a4', 1.4), 'a4')); z.file(fname('a3', 'pdf'), P.toPDF(render('a4', 2), 'a3')); z.file(fname('a5', 'pdf'), P.toPDF(render('a4', 1.4), 'a5'));
        z.file('caption.txt', (document.getElementById('pmCap') || {}).textContent || '');
        return Promise.all(jobs).then(function () { return z.generateAsync({ type: 'blob' }); }).then(function (b) { save(b, fname('all', 'zip')); });
      });
    }).catch(function (x) { err.textContent = 'Couldn’t make the file: ' + (x.message || x); });
  }
  function readLogo(file) {
    return new Promise(function (res, rej) {
      if (!file) return rej(new Error('No file chosen'));
      if (file.size > 5 * 1024 * 1024) return rej(new Error('That file is over 5 MB. Use a smaller logo.'));
      var r = new FileReader(); r.onerror = function () { rej(new Error('Couldn’t read that file')); };
      r.onload = function () {
        var i = new Image(); i.onerror = function () { rej(new Error('That doesn’t look like an image')); };
        i.onload = function () {
          var m = 360, s = Math.min(1, m / Math.max(i.width || m, i.height || m)), c = document.createElement('canvas');
          c.width = Math.max(1, Math.round((i.width || m) * s)); c.height = Math.max(1, Math.round((i.height || m) * s)); c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
          var d = c.toDataURL('image/webp', 0.88); if (d.indexOf('data:image/webp') !== 0) d = c.toDataURL('image/png');
          res(d);
        };
        i.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }

  function wire() {
    var root = S.el, P = window.SRPromo;
    function set(k, v) { var p = pr(); if (v === '' || v == null) delete p[k]; else p[k] = v; saveSoon(); }
    function upd() { preview(); }
    ['Title|title', 'Venue|venue', 'Extra|extra', 'Lineup|lineup', 'PriceNote|priceNote', 'Charity|charity'].forEach(function (x) {
      var a = x.split('|'), el = document.getElementById('pm' + a[0]); if (!el) return;
      el.addEventListener('input', function () {
        var v = el.value.trim();
        set(a[1], v); clearTimeout(S.it); S.it = setTimeout(upd, 250);
      });
    });
    function readPrices() {
      var rows = []; root.querySelectorAll('#pmPrices [data-price]').forEach(function (r) { rows.push({ label: r.querySelector('[data-pl=label]').value.trim(), amount: r.querySelector('[data-pl=amount]').value.trim() }); });
      set('prices', rows.filter(function (x) { return x.label || x.amount; })); clearTimeout(S.it); S.it = setTimeout(upd, 250);
    }
    root.querySelector('#pmPrices').addEventListener('input', readPrices);
    root.querySelector('#pmOnLabels').addEventListener('input', function (ev2) {
      var k = ev2.target.getAttribute('data-label'); if (!k) return; var p = pr(); p.labels = p.labels || {};
      if (ev2.target.value.trim()) p.labels[k] = ev2.target.value.trim(); else delete p.labels[k]; saveSoon(); clearTimeout(S.it); S.it = setTimeout(upd, 250);
    });
    var ts = document.getElementById('pmTicketSite');
    if (ts) ts.addEventListener('change', function () { var p = pr(); if (ts.value) p.ticketSite = ts.value; else { delete p.ticketSite; delete p.ticketUrl; } saveSoon(); build(); });
    var tu = document.getElementById('pmTicket');
    if (tu) tu.addEventListener('input', function () {
      var v = tu.value.trim(); if (v && !/^https?:\/\//i.test(v)) v = 'https://' + v; v = v.replace(/^http:\/\//i, 'https://');
      var p = pr(), msg = ticketCheck(p.ticketSite || 'own', v); document.getElementById('pmTicketErr').textContent = msg;
      if (!v || !msg) { if (v) p.ticketUrl = v; else delete p.ticketUrl; } else delete p.ticketUrl;
      saveSoon(); clearTimeout(S.it); S.it = setTimeout(upd, 250);
    });
    root.querySelector('#pmFont').addEventListener('change', function () { var v = this.value; set('font', v ? v.split('|') : null); upd(); });
    var lo = document.getElementById('pmLogoOk'); if (lo) lo.addEventListener('change', function () { set('logoOk', lo.checked || null); loadLogos().then(upd); });
    var mm = document.getElementById('pmMade'); if (mm) mm.addEventListener('change', function () { set('showMade', mm.checked || null); upd(); });
    function addFile(id, kind) {
      var inp = document.getElementById(id); if (!inp) return;
      inp.addEventListener('change', function () {
        var err = document.getElementById('pmErr');
        readLogo(inp.files[0]).then(function (d) {
          var p = pr(); p.logos = p.logos || {};
          if (kind === 'charity') p.logos.charity = d; else { p.logos.sponsors = (p.logos.sponsors || []).slice(0, 5); p.logos.sponsors.push(d); }
          saveSoon(); return loadLogos();
        }).then(build).catch(function (x) { if (err) err.textContent = x.message || String(x); });
      });
    }
    addFile('pmCharityFile', 'charity'); addFile('pmSponsorFile', 'sponsor');
    root.addEventListener('click', function (ev2) {
      var b = ev2.target.closest('button'); if (!b || !root.contains(b)) return;
      var p = pr();
      if (b.hasAttribute('data-pview')) { S.pview = b.getAttribute('data-pview'); build(); return; }
      if (b.hasAttribute('data-style')) { set('style', b.getAttribute('data-style')); delete p.iconStyle; P.loadFonts(P.fontsFor(styleId(), fontOpt())).then(build); return; }
      if (b.hasAttribute('data-istyle')) { set('iconStyle', b.getAttribute('data-istyle')); root.querySelectorAll('[data-istyle]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); upd(); return; }
      if (b.hasAttribute('data-size')) { S.size = b.getAttribute('data-size'); root.querySelectorAll('[data-size]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); upd(); return; }
      if (b.hasAttribute('data-on')) {
        var k = b.getAttribute('data-on'), keys = onKeys().slice(), i = keys.indexOf(k);
        if (i === -1) keys.push(k); else keys.splice(i, 1);
        set('on', keys); build(); return;
      }
      var a = b.getAttribute('data-pm'); if (!a) return;
      if (a === 'addPrice') { var rows = (p.prices || []).slice(); rows.push({ label: '', amount: '' }); p.prices = rows; var box = document.getElementById('pmPrices'); box.insertAdjacentHTML('beforeend', priceRow({}, box.children.length)); box.lastChild.querySelector('input').focus(); }
      else if (a === 'delPrice') { b.closest('[data-price]').remove(); readPrices(); }
      else if (a === 'resetOn') { delete p.on; delete p.labels; saveSoon(); build(); }
      else if (a === 'delCharity') { if (p.logos) delete p.logos.charity; saveSoon(); loadLogos().then(build); }
      else if (a === 'delSponsor') { if (p.logos && p.logos.sponsors) p.logos.sponsors.splice(+b.getAttribute('data-i'), 1); saveSoon(); loadLogos().then(build); }
      else if (a === 'traderPoster') { S.traderMode = !S.traderMode; build(); }
      else if (a === 'png' || a === 'pdf' || a === 'zip') { b.disabled = true; doDownload(a, b.getAttribute('data-paper')).then(function () { b.disabled = false; }); }
      else if (a === 'copyCap') {
        var t = (document.getElementById('pmCap') || {}).textContent || '', msg = document.getElementById('pmCapMsg');
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { msg.textContent = 'Copied.'; }, function () { msg.textContent = 'Select the text and copy it.'; });
      }
    });
  }
  // used by /campaign.js
  S.api = { ev: ev, pr: pr, facts: facts, styleId: styleId, fontOpt: fontOpt, drawOpts: function (sc) { return drawOpts(sc); }, saveSoon: saveSoon, save: save };
  // logos only show once the organiser confirms permission
  var _lo = loadLogos;
  loadLogos = function () { var p = pr(); if (!p.logoOk) { S.logos = { charity: null, sponsors: [] }; return Promise.resolve(); } return _lo(); };

  // Open from a link (/app/?tab=promote)
  if (/[?&]tab=promote\b/.test(location.search)) {
    var tries = 0, t = setInterval(function () {
      var b = document.getElementById('tab-promote');
      if (b && !b.hidden && (A().user || ++tries > 20)) { clearInterval(t); b.click(); }
      else if (++tries > 40) clearInterval(t);
    }, 500);
  }
})();
