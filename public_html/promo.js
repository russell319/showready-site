/* ShowReady Build 104: promo tool engine (posters and social images).
   Draws a poster or social image from the organiser's event on a canvas, entirely in the browser.
   Styles, heading fonts, icon styles and icons are plain data below, so more can be added at any time
   without changing the layout code. Fonts are self-hosted OFL files in /fonts/promo/. */
(function () {
  'use strict';
  if (window.SRPromo) return;
  var P = window.SRPromo = { version: 104 };
  var FONT_BASE = '/fonts/promo/';
  // family -> [[weight, file]]
  var FONTS = {
    'Abril Fatface': [['400', 'abril-fatface-latin-400-normal']], 'Alfa Slab One': [['400', 'alfa-slab-one-latin-400-normal']],
    'Anton': [['400', 'anton-latin-400-normal']], 'Barlow Condensed': [['500', 'barlow-condensed-latin-500-normal'], ['700', 'barlow-condensed-latin-700-normal']],
    'Bebas Neue': [['400', 'bebas-neue-latin-400-normal']], 'Bricolage Grotesque': [['800', 'bricolage-grotesque-latin-800-normal']],
    'Caveat': [['700', 'caveat-latin-700-normal']], 'Cinzel': [['700', 'cinzel-latin-700-normal']], 'DM Serif Display': [['400', 'dm-serif-display-latin-400-normal']],
    'Fredoka': [['600', 'fredoka-latin-600-normal'], ['700', 'fredoka-latin-700-normal']], 'Great Vibes': [['400', 'great-vibes-latin-400-normal']],
    'Lato': [['400', 'lato-latin-400-normal'], ['700', 'lato-latin-700-normal']], 'Lobster': [['400', 'lobster-latin-400-normal']],
    'Manrope': [['700', 'manrope-latin-700-normal']], 'Montserrat': [['700', 'montserrat-latin-700-normal']], 'Orbitron': [['800', 'orbitron-latin-800-normal']],
    'Oswald': [['500', 'oswald-latin-500-normal'], ['700', 'oswald-latin-700-normal']], 'Permanent Marker': [['400', 'permanent-marker-latin-400-normal']],
    'Playfair Display': [['800', 'playfair-display-latin-800-normal']], 'Righteous': [['400', 'righteous-latin-400-normal']], 'Rye': [['400', 'rye-latin-400-normal']]
  };
  var loaded = {};
  P.loadFonts = function (families) {
    var jobs = [];
    (families || []).forEach(function (fam) {
      (FONTS[fam] || []).forEach(function (fw) {
        var key = fam + fw[0]; if (loaded[key]) { jobs.push(loaded[key]); return; }
        if (typeof FontFace === 'undefined') return;
        var ff = new FontFace(fam, 'url(' + FONT_BASE + fw[1] + '.woff2) format("woff2")', { weight: fw[0] });
        loaded[key] = ff.load().then(function (f) { document.fonts.add(f); }).catch(function () { delete loaded[key]; });
        jobs.push(loaded[key]);
      });
    });
    return Promise.all(jobs);
  };
  var STYLES = {
    fete: { name: 'Village fete', bg: '#F6EFDF', ink: '#2B2318', accent: '#B33A2B', accent2: '#2F5D3A', soft: '#E9DCC0', deco: 'bunting', title: 'Alfa Slab One', tw: '400', body: 'Lato', bw: '700' },
    rustic: { name: 'Rustic farm', bg: '#E8D7B8', ink: '#3A2714', accent: '#7A4A1E', accent2: '#5B6B2F', soft: '#D9C29A', deco: 'twine', title: 'Rye', tw: '400', body: 'Lato', bw: '700' },
    retro: { name: 'Retro 70s', bg: '#FBEBD0', ink: '#3B2316', accent: '#D9542A', accent2: '#E89B2E', soft: '#F4D7A6', deco: 'rays', title: 'Righteous', tw: '400', body: 'Montserrat', bw: '700' },
    modern: { name: 'Modern', bg: '#10241B', ink: '#FFFFFF', accent: '#F0A04B', accent2: '#5CC08C', soft: '#1C3A2C', deco: 'blocks', title: 'Bricolage Grotesque', tw: '800', body: 'Manrope', bw: '700' },
    sporty: { name: 'Sporty', bg: '#111111', ink: '#FFFFFF', accent: '#FFD400', accent2: '#FFD400', soft: '#2A2A2A', deco: 'stripes', title: 'Anton', tw: '400', body: 'Barlow Condensed', bw: '700' },
    fun: { name: 'Fun family', bg: '#FFE45C', ink: '#1A1A2E', accent: '#E8396B', accent2: '#2D7FF9', soft: '#FFF3A8', deco: 'confetti', title: 'Fredoka', tw: '700', body: 'Fredoka', bw: '600' },
    elegant: { name: 'Elegant', bg: '#14213D', ink: '#F5EFE3', accent: '#D4AF6A', accent2: '#D4AF6A', soft: '#1E2E52', deco: 'frame', title: 'Playfair Display', tw: '800', body: 'Lato', bw: '700' },
    garden: { name: 'Garden party', bg: '#F4F1EA', ink: '#2E3B2C', accent: '#6E8B5B', accent2: '#C9776B', soft: '#E3E8DA', deco: 'leaves', title: 'DM Serif Display', tw: '400', body: 'Lato', bw: '700', script: 'Great Vibes' },
    neon: { name: 'Festival night', bg: '#160A2E', ink: '#FFFFFF', accent: '#FF3EA5', accent2: '#2DE2E6', soft: '#2A1352', deco: 'grid', title: 'Orbitron', tw: '800', body: 'Montserrat', bw: '700' },
    handmade: { name: 'Handmade', bg: '#FFFDF7', ink: '#1F2A44', accent: '#E4572E', accent2: '#2E86AB', soft: '#F1ECDF', deco: 'doodles', title: 'Permanent Marker', tw: '400', body: 'Caveat', bw: '700' },
    christmas: { name: 'Christmas market', bg: '#0F3D2E', ink: '#FFFFFF', accent: '#C8102E', accent2: '#F2D27A', soft: '#16523E', deco: 'snow', title: 'Abril Fatface', tw: '400', body: 'Lato', bw: '700' },
    carnival: { name: 'Carnival', bg: '#FFF8EC', ink: '#2A1A1A', accent: '#D7263D', accent2: '#1B998B', soft: '#FBE3C9', deco: 'circus', title: 'Lobster', tw: '400', body: 'Oswald', bw: '500' }
  };
  P.STYLES = STYLES;
  // Heading fonts offered for every style: [family, weight, description]
  P.HEADINGS = [
    ['Bricolage Grotesque', '800', 'Bold and modern'], ['Alfa Slab One', '400', 'Chunky slab'], ['Playfair Display', '800', 'Classic serif'],
    ['Anton', '400', 'Tall and loud'], ['Fredoka', '700', 'Round and friendly'], ['Righteous', '400', 'Retro'],
    ['Abril Fatface', '400', 'Poster serif'], ['Lobster', '400', 'Script'], ['Bebas Neue', '400', 'Condensed caps'],
    ['Cinzel', '700', 'Roman capitals'], ['DM Serif Display', '400', 'Soft serif'], ['Permanent Marker', '400', 'Marker pen']
  ];
  // Icon styles, with the poster styles each one suits (used to rank them)
  P.ICON_STYLES = {
    line: { name: 'Line', suits: ['modern', 'elegant', 'garden'] },
    duotone: { name: 'Duotone', suits: ['fete', 'rustic', 'retro'] },
    solid: { name: 'Solid circle', suits: ['sporty', 'modern', 'christmas'] },
    sticker: { name: 'Sticker', suits: ['fun', 'carnival'] },
    hand: { name: 'Hand-drawn', suits: ['handmade', 'rustic'] },
    badge: { name: 'Badge', suits: ['fete', 'christmas', 'sporty'] },
    neon: { name: 'Neon', suits: ['neon'] },
    stamp: { name: 'Stamp', suits: ['retro', 'rustic', 'elegant'] }
  };
  P.iconStylesFor = function (styleId) {
    var ids = Object.keys(P.ICON_STYLES);
    return ids.filter(function (k) { return P.ICON_STYLES[k].suits.indexOf(styleId) !== -1; })
      .sort(function (a, b) { return P.ICON_STYLES[a].suits.indexOf(styleId) - P.ICON_STYLES[b].suits.indexOf(styleId); })
      .concat(ids.filter(function (k) { return P.ICON_STYLES[k].suits.indexOf(styleId) === -1; }));
  };
  // Icons for the "What's on" strip: key -> default label
  P.ICONS = {
    ride: 'Fairground rides', fair: 'Funfair', bigtop: 'Big top', fete: 'Fete', food: 'Food stalls', market: 'Food market', bootsale: 'Car boot sale',
    music: 'Live music', dj: 'DJ', bar: 'Bar', dog: 'Dog show', kids: 'Children’s activities', bouncy: 'Bouncy castle', inflatable: 'Inflatables',
    face: 'Face painting', arts: 'Arts and crafts', fireworks: 'Fireworks', bonfire: 'Bonfire', parking: 'Free parking'
  };
  var SIZES = {
    // qr: show the QR code; sponsors: show sponsor logos; lines: most price lines (people on phones use the link in the caption instead of a QR)
    a4: [1240, 1754, 'Poster (A4, A3, A5)', { qr: true, sponsors: true, lines: 5 }],
    portrait: [1080, 1350, 'Instagram and Facebook post (4:5)', { qr: false, sponsors: true, lines: 3, lineup: 2 }],
    square: [1080, 1080, 'Square post', { qr: false, sponsors: false, logo: false, lines: 1, lineup: 1 }],
    story: [1080, 1920, 'Story or reel cover (9:16)', { qr: false, sponsors: true, lines: 4 }],
    fbcover: [1920, 1005, 'Facebook event cover', { qr: false, sponsors: false, logo: false, lines: 1, lineup: 1 }]
  };
  P.SIZES = SIZES;
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function niceDate(d) { if (!d) return ''; var x = new Date(d + 'T12:00:00Z'); return DAYS[x.getUTCDay()] + ' ' + x.getUTCDate() + ' ' + MONTHS[x.getUTCMonth()] + ' ' + x.getUTCFullYear(); }

  // seeded random so a poster looks the same every time it's drawn
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; }; }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  function wrap(ctx, text, maxW) {
    var words = String(text || '').split(/\s+/), lines = [], line = '';
    words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    if (line) lines.push(line); return lines;
  }
  // biggest font size (down to min) that fits the text in maxLines lines
  function fit(ctx, text, family, weight, maxW, maxLines, start, min, maxH) {
    for (var s = start; s >= min; s -= 4) { ctx.font = weight + ' ' + s + 'px "' + family + '"'; var l = wrap(ctx, text, maxW); if (l.length <= maxLines && (!maxH || (l.length + 1.05) * s <= maxH) && l.every(function (z) { return ctx.measureText(z).width <= maxW; })) return { size: s, lines: l }; }
    ctx.font = weight + ' ' + min + 'px "' + family + '"'; return { size: min, lines: wrap(ctx, text, maxW).slice(0, maxLines) };
  }

  function deco(ctx, st, W, H, r) {
    var u = Math.min(W, H * 1.2); // top bands are sized to the short side so wide covers don't fill up with flags
    if (st.deco === 'bunting') {
      for (var row = 0; row < 2; row++) {
        var y0 = u * 0.03 + row * u * 0.055, n = Math.round(11 * W / u), fw = u / 11, cols = [st.accent, st.accent2, '#E0A21B', '#3C6E9E'];
        ctx.strokeStyle = st.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, y0); ctx.quadraticCurveTo(W / 2, y0 + u * 0.03, W, y0); ctx.stroke();
        for (var i = 0; i < n; i++) {
          var t = (i + 0.5) / n, x = t * W, y = y0 + u * 0.03 * 2 * t * (1 - t);
          ctx.fillStyle = cols[(i + row) % cols.length]; ctx.beginPath(); ctx.moveTo(x - fw / 2.6, y); ctx.lineTo(x + fw / 2.6, y); ctx.lineTo(x, y + fw / 1.6); ctx.closePath(); ctx.fill();
        }
      }
    } else if (st.deco === 'blocks') {
      ctx.fillStyle = st.soft; ctx.fillRect(W * 0.62, 0, W * 0.38, H * 0.42);
      ctx.fillStyle = st.accent; ctx.fillRect(W * 0.62, H * 0.42 - 18, W * 0.38, 18);
      ctx.fillStyle = st.accent2; ctx.beginPath(); ctx.arc(W * 0.81, H * 0.21, W * 0.12, 0, Math.PI * 2); ctx.fill();
    } else if (st.deco === 'confetti') {
      for (var k = 0; k < 900; k++) {
        var cx = r() * W, cy = r() * H * 0.8, edge = Math.min(W, H) * 0.07;
        if (cx > edge && cx < W - edge && cy > edge) continue;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(r() * 6.28);
        ctx.fillStyle = [st.accent, st.accent2, '#2BB673', '#FF8A00'][k % 4]; ctx.fillRect(-9, -4, 18, 8); ctx.restore();
      }
    } else if (st.deco === 'twine') {
      ctx.fillStyle = 'rgba(90,60,30,0.06)'; for (var q = 0; q < 2500; q++) ctx.fillRect(r() * W, r() * H, 2, 2);
      ctx.strokeStyle = st.accent; ctx.lineWidth = W * 0.004; ctx.setLineDash([W * 0.02, W * 0.012]); ctx.strokeRect(W * 0.035, W * 0.035, W - W * 0.07, H - W * 0.07); ctx.setLineDash([]);
      ctx.fillStyle = st.accent2; for (var wv = 0; wv < 3; wv++) { ctx.beginPath(); ctx.ellipse(W * 0.86 + wv * W * 0.03, W * 0.12 - wv * W * 0.02, W * 0.012, W * 0.04, 0.5, 0, 6.28); ctx.fill(); }
    } else if (st.deco === 'rays') {
      var cx0 = W * 0.88, cy0 = W * 0.06, cols2 = [st.accent, st.accent2, '#7A3B1D'];
      var rr0 = Math.min(W, H) * (H > W ? 0.12 : 0.085); for (var b2 = 3; b2 >= 1; b2--) { ctx.fillStyle = cols2[b2 - 1]; ctx.beginPath(); ctx.arc(cx0, cy0, rr0 * b2, 0, 6.28); ctx.fill(); }
      ctx.fillStyle = st.bg; ctx.beginPath(); ctx.arc(cx0, cy0, rr0 * 0.83, 0, 6.28); ctx.fill();
    } else if (st.deco === 'stripes') {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, u * 0.07); ctx.clip(); ctx.fillStyle = st.accent; ctx.fillRect(0, 0, W, u * 0.07);
      ctx.fillStyle = '#111'; for (var dx = -u * 0.1; dx < W + u * 0.1; dx += u * 0.06) { ctx.beginPath(); ctx.moveTo(dx, 0); ctx.lineTo(dx + u * 0.03, 0); ctx.lineTo(dx - u * 0.04, u * 0.07); ctx.lineTo(dx - u * 0.07, u * 0.07); ctx.fill(); } ctx.restore();
    } else if (st.deco === 'leaves') {
      [[0.9, 0.06, 0.6], [0.82, 0.03, -0.3], [0.96, 0.15, 1.2], [0.05, 0.9, 2.2], [0.12, 0.95, 2.8]].forEach(function (l, i) {
        ctx.save(); ctx.translate(W * l[0], H * l[1]); ctx.rotate(l[2]); ctx.fillStyle = i % 2 ? st.accent : '#9DB58A';
        for (var lf = 0; lf < 5; lf++) { ctx.beginPath(); ctx.ellipse(0, -lf * W * 0.035, W * 0.012, W * 0.03, lf % 2 ? 0.6 : -0.6, 0, 6.28); ctx.fill(); } ctx.restore();
      });
    } else if (st.deco === 'grid') {
      ctx.strokeStyle = 'rgba(45,226,230,0.25)'; ctx.lineWidth = 2;
      for (var gx = 0; gx <= 20; gx++) { ctx.beginPath(); ctx.moveTo(W / 2, H * 0.5); ctx.lineTo(gx * W / 20 * 3 - W, H); ctx.stroke(); }
      for (var gy = 0; gy < 10; gy++) { var yy = H * 0.5 + Math.pow(gy / 10, 2) * H * 0.5; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
      ctx.fillStyle = st.accent; ctx.shadowColor = st.accent; ctx.shadowBlur = 40; ctx.beginPath(); ctx.arc(W * 0.82, H * 0.14, W * 0.08, 0, 6.28); ctx.fill(); ctx.shadowBlur = 0;
    } else if (st.deco === 'doodles') {
      ctx.strokeStyle = st.accent2; ctx.lineWidth = W * 0.005; ctx.lineCap = 'round';
      for (var dd = 0; dd < 9; dd++) { var px = r() < 0.5 ? r() * W * 0.12 + W * 0.84 : r() * W, py = r() * H * 0.12 + W * 0.02; if (px < W * 0.84 && py > W * 0.06) continue;
        ctx.beginPath(); for (var sp = 0; sp < 5; sp++) { var an = sp * 1.2566 * 2 - 1.57; ctx.lineTo(px + Math.cos(an) * W * 0.02, py + Math.sin(an) * W * 0.02); } ctx.closePath(); ctx.stroke(); }
      ctx.strokeStyle = st.accent; ctx.beginPath(); ctx.moveTo(W * 0.08, W * 0.05); for (var zz = 0; zz < 12; zz++) ctx.lineTo(W * 0.08 + zz * W * 0.03, W * (zz % 2 ? 0.065 : 0.045)); ctx.stroke();
    } else if (st.deco === 'snow') {
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (var sn = 0; sn < 160; sn++) { var sx = r() * W, sy = r() * H * 0.85; if (sx > W * 0.07 && sx < W * 0.75 && sy > W * 0.08) continue; ctx.beginPath(); ctx.arc(sx, sy, W * (0.002 + r() * 0.005), 0, 6.28); ctx.fill(); }
      ctx.fillStyle = st.accent2; ctx.beginPath(); ctx.moveTo(W * 0.86, W * 0.06); ctx.lineTo(W * 0.94, W * 0.24); ctx.lineTo(W * 0.78, W * 0.24); ctx.fill(); ctx.beginPath(); ctx.moveTo(W * 0.86, W * 0.14); ctx.lineTo(W * 0.96, W * 0.34); ctx.lineTo(W * 0.76, W * 0.34); ctx.fill();
    } else if (st.deco === 'circus') {
      var n2 = Math.round(12 * W / u), w2 = W / n2, ch = u * 0.09;
      for (var ci = 0; ci < n2; ci++) { ctx.fillStyle = ci % 2 ? '#FFFFFF' : st.accent; ctx.fillRect(ci * w2, 0, w2, ch); ctx.beginPath(); ctx.arc(ci * w2 + w2 / 2, ch, w2 / 2, 0, Math.PI); ctx.fill(); }
    } else if (st.deco === 'frame') {
      ctx.strokeStyle = st.accent; ctx.lineWidth = 4; ctx.strokeRect(36, 36, W - 72, H - 72); ctx.lineWidth = 1.5; ctx.strokeRect(52, 52, W - 104, H - 104);
      [[52, 52], [W - 52, 52], [52, H - 52], [W - 52, H - 52]].forEach(function (c) { ctx.fillStyle = st.accent; ctx.beginPath(); ctx.arc(c[0], c[1], 9, 0, Math.PI * 2); ctx.fill(); });
    }
  }

  function glyph(ctx,k,mode){
    var S=ctx; S.beginPath();
    if(k==='ride'){S.arc(50,45,32,0,6.28);for(var i=0;i<8;i++){var a=i*.785;S.moveTo(50,45);S.lineTo(50+Math.cos(a)*32,45+Math.sin(a)*32);}S.moveTo(32,95);S.lineTo(50,45);S.lineTo(68,95);}
    if(k==='food'){S.moveTo(10,42);S.lineTo(90,42);S.lineTo(80,26);S.lineTo(20,26);S.closePath();S.rect(15,42,70,38);S.moveTo(37,88);S.arc(30,88,7,0,6.28);S.moveTo(77,88);S.arc(70,88,7,0,6.28);}
    if(k==='music'){S.ellipse(30,78,13,10,-.4,0,6.28);S.moveTo(88,68);S.ellipse(75,68,13,10,-.4,0,6.28);S.moveTo(41,76);S.lineTo(41,20);S.lineTo(86,10);S.lineTo(86,66);}
    if(k==='bar'){S.moveTo(22,14);S.lineTo(78,14);S.lineTo(50,50);S.closePath();S.moveTo(50,50);S.lineTo(50,86);S.moveTo(32,88);S.lineTo(68,88);}
    if(k==='dog'){S.arc(50,62,20,0,6.28);[[28,32],[72,32],[39,18],[61,18]].forEach(function(p){S.moveTo(p[0]+10,p[1]);S.arc(p[0],p[1],10,0,6.28);});}
    if(k==='kids'){S.ellipse(70,22,14,17,0,0,6.28);S.moveTo(66,40);S.lineTo(74,40);S.lineTo(70,44);S.closePath();S.moveTo(70,44);S.bezierCurveTo(64,50,58,48,52,54);S.moveTo(45,40);S.arc(36,40,9,0,6.28);S.moveTo(36,49);S.lineTo(36,72);S.lineTo(27,92);S.moveTo(36,72);S.lineTo(45,92);S.moveTo(24,64);S.lineTo(36,56);S.lineTo(52,54);}
    if(k==='bouncy'){S.rect(10,64,80,24);S.moveTo(14,64);S.lineTo(14,36);S.arc(22,36,8,Math.PI,0);S.lineTo(30,64);S.moveTo(70,64);S.lineTo(70,36);S.arc(78,36,8,Math.PI,0);S.lineTo(86,64);S.moveTo(30,50);S.arc(35,50,5,Math.PI,0);S.arc(45,50,5,Math.PI,0);S.arc(55,50,5,Math.PI,0);S.arc(65,50,5,Math.PI,0);S.moveTo(42,88);S.lineTo(42,78);S.arc(50,78,8,Math.PI,0);S.lineTo(58,88);}
    if(k==='face'){S.arc(50,54,36,0,6.28);S.moveTo(40,46);S.arc(37,46,3,0,6.28);S.moveTo(66,46);S.arc(63,46,3,0,6.28);S.moveTo(38,68);S.quadraticCurveTo(50,78,62,68);S.moveTo(16,52);S.lineTo(28,56);S.moveTo(16,62);S.lineTo(28,62);S.moveTo(84,52);S.lineTo(72,56);S.moveTo(84,62);S.lineTo(72,62);S.moveTo(44,22);S.lineTo(48,32);S.moveTo(56,22);S.lineTo(52,32);}
    if(k==='arts'){S.save();S.scale(.82,.82);S.moveTo(50,14);S.bezierCurveTo(14,14,6,50,14,70);S.bezierCurveTo(22,90,44,88,48,76);S.bezierCurveTo(52,66,64,70,72,72);S.bezierCurveTo(92,74,94,40,82,28);S.bezierCurveTo(74,20,62,14,50,14);S.moveTo(35,34);S.arc(30,34,5,0,6.28);S.moveTo(55,28);S.arc(50,28,5,0,6.28);S.moveTo(75,40);S.arc(70,40,5,0,6.28);S.moveTo(31,58);S.arc(26,58,5,0,6.28);S.restore();S.moveTo(92,52);S.lineTo(64,80);S.moveTo(64,80);S.lineTo(58,92);S.lineTo(70,86);S.closePath();}
    if(k==='fete'){S.moveTo(6,18);S.quadraticCurveTo(50,40,94,18);[[16,24],[38,30],[60,30],[82,24]].forEach(function(f){S.moveTo(f[0]-8,f[1]-1);S.lineTo(f[0],f[1]+16);S.lineTo(f[0]+8,f[1]+1);});S.moveTo(6,56);S.quadraticCurveTo(50,78,94,56);[[27,66],[50,69],[73,66]].forEach(function(f){S.moveTo(f[0]-8,f[1]-1);S.lineTo(f[0],f[1]+16);S.lineTo(f[0]+8,f[1]+1);});}
    if(k==='bigtop'){S.moveTo(50,4);S.lineTo(50,16);S.lineTo(62,10);S.lineTo(50,8);S.moveTo(50,16);S.quadraticCurveTo(30,40,10,48);S.lineTo(90,48);S.quadraticCurveTo(70,40,50,16);S.moveTo(50,16);S.lineTo(36,48);S.moveTo(50,16);S.lineTo(64,48);S.moveTo(14,48);S.lineTo(14,90);S.lineTo(86,90);S.lineTo(86,48);S.moveTo(40,90);S.lineTo(50,62);S.lineTo(60,90);}
    if(k==='inflatable'){S.moveTo(8,90);S.lineTo(8,28);S.arc(20,28,12,Math.PI,0);S.lineTo(32,40);S.bezierCurveTo(56,44,62,86,92,86);S.lineTo(92,90);S.closePath();S.moveTo(32,40);S.lineTo(32,90);S.moveTo(18,46);S.lineTo(18,60);S.moveTo(44,52);S.bezierCurveTo(56,62,64,78,80,80);}
    if(k==='fair'){S.moveTo(50,8);S.lineTo(88,34);S.lineTo(12,34);S.closePath();S.moveTo(12,34);S.arc(19.5,34,7.5,Math.PI,0,true);S.arc(34.5,34,7.5,Math.PI,0,true);S.arc(49.5,34,7.5,Math.PI,0,true);S.arc(64.5,34,7.5,Math.PI,0,true);S.arc(79.5,34,7.5,Math.PI,0,true);S.moveTo(24,42);S.lineTo(24,80);S.moveTo(50,42);S.lineTo(50,80);S.moveTo(76,42);S.lineTo(76,80);S.moveTo(18,56);S.lineTo(30,56);S.moveTo(44,64);S.lineTo(56,64);S.moveTo(70,56);S.lineTo(82,56);S.rect(10,80,80,10);}
    if(k==='bootsale'){S.save();S.translate(0,22);S.scale(.72,.72);S.moveTo(8,68);S.lineTo(8,52);S.lineTo(24,47);S.lineTo(35,30);S.lineTo(66,30);S.lineTo(79,47);S.lineTo(92,51);S.lineTo(92,68);S.closePath();S.moveTo(38,74);S.arc(28,74,10,0,6.28);S.moveTo(82,74);S.arc(72,74,10,0,6.28);S.restore();S.moveTo(60,10);S.lineTo(84,10);S.lineTo(96,22);S.lineTo(84,34);S.lineTo(60,34);S.closePath();S.moveTo(69,22);S.arc(66,22,3,0,6.28);S.moveTo(50,22);S.lineTo(60,22);}
    if(k==='market'){S.moveTo(8,20);S.lineTo(92,20);S.lineTo(92,34);S.arc(86,34,6,0,Math.PI);S.arc(74,34,6,0,Math.PI);S.arc(62,34,6,0,Math.PI);S.arc(50,34,6,0,Math.PI);S.arc(38,34,6,0,Math.PI);S.arc(26,34,6,0,Math.PI);S.arc(14,34,6,0,Math.PI);S.closePath();S.moveTo(36,20);S.lineTo(32,34);S.moveTo(64,20);S.lineTo(68,34);S.moveTo(14,40);S.lineTo(14,92);S.moveTo(86,40);S.lineTo(86,92);S.rect(14,66,72,14);S.moveTo(36,66);S.arc(30,66,6,Math.PI,0);S.moveTo(54,66);S.arc(48,66,6,Math.PI,0);S.moveTo(72,66);S.arc(66,66,6,Math.PI,0);}
    if(k==='dj'){S.rect(4,34,92,44);S.moveTo(39,56);S.arc(25,56,14,0,6.28);S.moveTo(28,56);S.arc(25,56,3,0,6.28);S.moveTo(89,56);S.arc(75,56,14,0,6.28);S.moveTo(78,56);S.arc(75,56,3,0,6.28);S.rect(44,40,12,32);S.moveTo(47,50);S.lineTo(53,50);S.moveTo(47,62);S.lineTo(53,62);S.moveTo(36,38);S.lineTo(36,46);S.moveTo(64,38);S.lineTo(64,46);S.moveTo(30,78);S.lineTo(30,90);S.moveTo(70,78);S.lineTo(70,90);}
    if(k==='fireworks'){[[38,38,26,10],[76,26,14,8],[74,72,12,8]].forEach(function(b){for(var i=0;i<b[3];i++){var a=i*6.283/b[3];S.moveTo(b[0]+Math.cos(a)*b[2]*0.35,b[1]+Math.sin(a)*b[2]*0.35);S.lineTo(b[0]+Math.cos(a)*b[2],b[1]+Math.sin(a)*b[2]);}});S.moveTo(38,64);S.lineTo(34,92);}
    if(k==='bonfire'){S.moveTo(50,8);S.bezierCurveTo(60,28,78,36,74,58);S.bezierCurveTo(72,72,60,78,50,78);S.bezierCurveTo(38,78,26,72,26,58);S.bezierCurveTo(26,44,38,40,40,26);S.bezierCurveTo(46,36,44,44,50,48);S.bezierCurveTo(54,36,52,22,50,8);S.moveTo(50,78);S.bezierCurveTo(44,72,42,62,50,56);S.bezierCurveTo(58,62,56,72,50,78);S.moveTo(12,92);S.lineTo(88,76);S.moveTo(12,76);S.lineTo(88,92);}
    if(k==='parking'){S.moveTo(8,68);S.lineTo(8,52);S.lineTo(24,47);S.lineTo(35,30);S.lineTo(66,30);S.lineTo(79,47);S.lineTo(92,51);S.lineTo(92,68);S.closePath();S.moveTo(39,35);S.lineTo(49,35);S.lineTo(49,46);S.lineTo(31,46);S.closePath();S.moveTo(55,35);S.lineTo(64,35);S.lineTo(72,46);S.lineTo(55,46);S.closePath();S.moveTo(38,74);S.arc(28,74,10,0,6.28);S.moveTo(82,74);S.arc(72,74,10,0,6.28);}
  }
  function jitter(ctx,f){ctx.save();for(var p=0;p<2;p++){ctx.save();ctx.translate((p?1:-1)*1.2,(p?-1:1)*1.0);ctx.rotate((p?1:-1)*0.012);f();ctx.restore();}ctx.restore();}
  var MODES={
   line:function(ctx,k,c){ctx.lineWidth=6;ctx.strokeStyle=c.main;glyph(ctx,k);ctx.stroke();},
   solid:function(ctx,k,c){ctx.fillStyle=c.main;ctx.beginPath();ctx.arc(50,50,50,0,6.28);ctx.fill();ctx.save();ctx.translate(20,20);ctx.scale(.6,.6);ctx.lineWidth=9;ctx.strokeStyle='#fff';ctx.fillStyle='#fff';glyph(ctx,k);ctx.stroke();ctx.restore();},
   duotone:function(ctx,k,c){ctx.fillStyle=c.soft;ctx.beginPath();ctx.arc(54,56,42,0,6.28);ctx.fill();ctx.lineWidth=6;ctx.strokeStyle=c.main;glyph(ctx,k);ctx.stroke();},
   sticker:function(ctx,k,c){ctx.save();ctx.shadowColor='rgba(0,0,0,.25)';ctx.shadowBlur=8;ctx.shadowOffsetY=4;ctx.lineJoin='round';ctx.lineWidth=22;ctx.strokeStyle='#fff';glyph(ctx,k);ctx.stroke();ctx.restore();ctx.lineWidth=9;ctx.strokeStyle=c.main;glyph(ctx,k);ctx.stroke();},
   hand:function(ctx,k,c){ctx.lineWidth=4;ctx.strokeStyle=c.main;jitter(ctx,function(){glyph(ctx,k);ctx.stroke();});},
   badge:function(ctx,k,c){ctx.fillStyle=c.main;var r=18;ctx.beginPath();ctx.moveTo(r,0);ctx.arcTo(100,0,100,100,r);ctx.arcTo(100,100,0,100,r);ctx.arcTo(0,100,0,0,r);ctx.arcTo(0,0,100,0,r);ctx.fill();ctx.strokeStyle=c.soft;ctx.lineWidth=3;ctx.strokeRect(7,7,86,86);ctx.save();ctx.translate(22,22);ctx.scale(.56,.56);ctx.lineWidth=10;ctx.strokeStyle='#fff';glyph(ctx,k);ctx.stroke();ctx.restore();},
   neon:function(ctx,k,c){ctx.fillStyle='#160A2E';ctx.beginPath();ctx.arc(50,50,50,0,6.28);ctx.fill();ctx.save();ctx.translate(15,15);ctx.scale(.7,.7);ctx.shadowColor=c.main;ctx.shadowBlur=16;ctx.lineWidth=7;ctx.strokeStyle=c.main;glyph(ctx,k);ctx.stroke();ctx.stroke();ctx.restore();},
   stamp:function(ctx,k,c){ctx.strokeStyle=c.main;ctx.lineWidth=5;ctx.setLineDash([6,5]);ctx.beginPath();ctx.arc(50,50,47,0,6.28);ctx.stroke();ctx.setLineDash([]);ctx.save();ctx.translate(20,20);ctx.scale(.6,.6);ctx.lineWidth=8;glyph(ctx,k);ctx.stroke();ctx.restore();}
  };
  
  // ---- icons: each glyph is drawn on a 100x100 box; the icon style decides the treatment
  function drawIcon(ctx, key, mode, x, y, size, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 100, size / 100); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    (MODES[mode] || MODES.line)(ctx, key, col); ctx.restore();
  }
  P.drawIcon = drawIcon;

  // ---- QR codes (qrcode-generator in /vendor)
  function qrDraw(ctx, text, x, y, size, dark) {
    if (!text || typeof window.qrcode !== 'function') return false;
    var q; try { q = window.qrcode(0, 'M'); q.addData(text); q.make(); } catch (e) { return false; }
    var n = q.getModuleCount(), quiet = 2, cell = size / (n + quiet * 2);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x, y, size, size); ctx.fillStyle = dark || '#000000';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) ctx.fillRect(Math.floor(x + (c + quiet) * cell), Math.floor(y + (r + quiet) * cell), Math.ceil(cell), Math.ceil(cell));
    return true;
  }
  P.qrDraw = qrDraw;
  function shortUrl(u) { return String(u || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, ''); }
  function contain(ctx, img, x, y, w, h) {
    if (!img || !img.width) return 0; var s = Math.min(w / img.width, h / img.height), dw = img.width * s, dh = img.height * s;
    ctx.drawImage(img, x, y + (h - dh) / 2, dw, dh); return dw;
  }
  function timeText(t) {
    if (!t) return ''; var m = /^(\d{1,2}):(\d{2})/.exec(t); if (!m) return t;
    var h = +m[1], mm = m[2], ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return h + (mm === '00' ? '' : '.' + mm) + ap;
  }

  // ---- facts from what the organiser has already entered. Promo settings (e.promo) override.
  P.suggestOn = function (e, sitePlan) {
    e = e || {}; var acts = e.acts || {}, items = (sitePlan && sitePlan.items) || [], on = [];
    var has = function (t) { return items.some(function (i) { return i.type === t; }); };
    var txt = ((e.eventName || '') + ' ' + (e.desc || '')).toLowerCase();
    if (/\bfete\b|f[êe]te/.test(txt)) on.push('fete');
    if (acts.rides || has('ride') || has('kidsride')) on.push('ride');
    if (/circus|big top/.test(txt)) on.push('bigtop');
    if (/boot sale|car boot/.test(txt)) on.push('bootsale');
    if (/food (market|festival|fair)|farmers.? market|street food/.test(txt)) on.push('market');
    else if ((Number(e.traders) || 0) > 0 || has('food') || has('trailer')) on.push('food');
    if (e.music === 'live') on.push('music'); else if (e.music === 'recorded') on.push('dj');
    if (e.alcohol === 'sold') on.push('bar');
    if (/\bdog/.test(txt) || acts.animals && /dog/.test(txt)) on.push('dog');
    if (has('bouncy')) on.push('bouncy');
    if (acts.inflatables || has('inflatable')) { if (on.indexOf('bouncy') === -1) on.push(/bouncy/.test(txt) ? 'bouncy' : 'inflatable'); }
    if (/face ?paint/.test(txt)) on.push('face');
    if (/craft/.test(txt)) on.push('arts');
    if ((e.audience || []).indexOf('children') !== -1 || /\bkids|children|family/.test(txt)) on.push('kids');
    if (e.fireworks) on.push('fireworks');
    if (acts.bonfire) on.push('bonfire');
    if (/parking/.test(txt)) on.push('parking');
    return on.filter(function (k, i) { return on.indexOf(k) === i; });
  };
  function niceRange(d, days) {
    if (!d) return ''; var one = niceDate(d); days = Number(days) || 1; if (days < 2) return one;
    var x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + days - 1);
    return one.replace(/ \d{4}$/, '') + ' to ' + DAYS[x.getUTCDay()] + ' ' + x.getUTCDate() + ' ' + MONTHS[x.getUTCMonth()] + ' ' + x.getUTCFullYear();
  }
  P.fromEvent = function (e, sitePlan, pack) {
    e = e || {}; var app = e.app || {}, pr = e.promo || {}, pk = pack || e.pack || {};
    var on = (pr.on || P.suggestOn(e, sitePlan)).map(function (k) { return [k, (pr.labels && pr.labels[k]) || P.ICONS[k] || k]; }).filter(function (o) { return P.ICONS[o[0]]; });
    var prices = (pr.prices || []).filter(function (p) { return p && (p.label || p.amount); });
    var free = e.entry !== 'paid';
    var main = prices.length ? [prices[0].label, prices[0].amount].filter(Boolean).join(' ') : (free ? 'Free entry' : (pr.ticketUrl ? 'Tickets online now' : 'Tickets on the gate'));
    var times = [timeText(app.start), timeText(app.end)].filter(Boolean).join(' to ');
    var venue = pr.venue || pk.venueName || String(app.address || '').split(',').slice(0, 2).join(',') || '';
    return {
      title: pr.title || e.eventName || 'Our event', kicker: pr.kicker || '', date: niceRange(e.date, e.days), time: pr.time || times, venue: venue,
      priceMain: main, priceLines: prices.slice(1).map(function (p) { return [p.label, p.amount].filter(Boolean).join(' '); }), priceNote: pr.priceNote || '',
      url: pr.ticketUrl || '', urlLabel: 'Scan for tickets', on: on, lineup: pr.lineup || '', charity: pr.charity || '', extra: pr.extra || ''
    };
  };
  P.traderFacts = function (e, market, link) {
    var f = P.fromEvent(e, null, null); e = e || {}; market = market || {};
    var kinds = (market.kinds && market.kinds.length) ? market.kinds : ['food', 'craft', 'retail'];
    var on = []; if (kinds.indexOf('food') !== -1 || kinds.indexOf('drink') !== -1) on.push(['food', 'Food and drink']);
    if (kinds.indexOf('craft') !== -1) on.push(['arts', 'Crafts']); if (kinds.indexOf('retail') !== -1) on.push(['market', 'Stalls']);
    if (kinds.indexOf('ride') !== -1 || kinds.indexOf('activity') !== -1) on.push(['ride', 'Rides and activities']);
    return {
      kicker: f.title, title: 'Traders wanted', date: f.date, time: f.time, venue: f.venue,
      priceMain: 'Apply online', priceLines: market.fee_note ? [market.fee_note] : [], priceNote: market.closes_on ? 'Applications close ' + niceDate(String(market.closes_on).slice(0, 10)) : '',
      url: link || '', urlLabel: 'Scan to apply', on: on.length ? on : [['food', 'Food and drink'], ['arts', 'Crafts'], ['market', 'Stalls']], lineup: '', charity: '', extra: ''
    };
  };

  // ---- the layout. opts: font [family, weight], iconStyle, scale, footer (show "Made with ShowReady"), charityLogo, sponsors [images]
  P.draw = function (canvas, facts, styleId, sizeId, opts) {
    opts = Object.assign({}, opts || {}); facts = facts || {};
    var st = Object.assign({}, STYLES[styleId] || STYLES.fete, opts.font ? { title: opts.font[0], tw: opts.font[1] } : {});
    var sz = SIZES[sizeId] || SIZES.a4, rules = sz[3] || {}; if (rules.logo === false) opts.charityLogo = null; var sc = opts.scale || 1, W = Math.round(sz[0] * sc), H = Math.round(sz[1] * sc);
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d'), r = rng(hash((facts.title || '') + styleId));
    var wide = W > H, sq = Math.abs(W - H) < 10, story = H / W > 1.6, U = wide ? H : W;
    var iconMode = opts.iconStyle || P.iconStylesFor(styleId)[0];
    var iconCol = { main: st.accent2 === st.ink ? st.accent : st.accent2, soft: st.soft };
    ctx.fillStyle = st.bg; ctx.fillRect(0, 0, W, H);
    deco(ctx, st, W, H, r);
    var pad = Math.round(U * 0.08), x = pad, maxW = W - pad * 2;
    var safeTop = story ? H * 0.1 : 0, safeBot = story ? H * 0.11 : 0;
    var du = Math.min(W, H * 1.2), decoH = { bunting: du * 0.145, circus: du * 0.135, stripes: du * 0.07 }[st.deco];
    var topY = safeTop + (decoH ? Math.max(decoH + U * 0.07, U * 0.2) : Math.max(U * 0.1, H * (wide ? 0.12 : 0.08)));
    function bodyFont(k) { return st.bw + ' ' + Math.round(U * k * (st.body === 'Caveat' ? 1.3 : 1)) + 'px "' + st.body + '"'; }
    var onCol = st.deco === 'blocks' || st.deco === 'frame' ? st.bg : '#FFFFFF';

    // footer: price block on the left, QR on the right
    var mainSize = Math.round(U * 0.05), lineSize = U * 0.026;
    ctx.font = bodyFont(0.026);
    var qrOn = !!facts.url && rules.qr !== false && opts.qr !== false && typeof window.qrcode === 'function';
    var priceW = qrOn ? maxW * 0.66 : maxW;
    var subLines = [];
    (facts.priceLines || []).forEach(function (l) { wrap(ctx, l, priceW).forEach(function (w) { subLines.push(w); }); });
    if (facts.priceNote) wrap(ctx, facts.priceNote, priceW).forEach(function (w) { subLines.push(w); });
    subLines = subLines.slice(0, rules.lines == null ? 5 : rules.lines);
    if (facts.charity && !opts.charityLogo) subLines.push(wrap(ctx, 'In aid of ' + facts.charity, priceW)[0]);
    var needH = U * 0.05 + mainSize * 1.1 + subLines.length * lineSize * 1.35 + U * 0.05 + (opts.footer ? U * 0.03 : 0);
    var fh = Math.max(H * (wide ? 0.2 : 0.14), needH, qrOn ? U * 0.27 : 0) + safeBot, fy = H - fh;
    ctx.fillStyle = st.accent; ctx.fillRect(0, fy, W, fh);
    ctx.fillStyle = onCol; ctx.textBaseline = 'alphabetic';
    ctx.font = st.tw + ' ' + mainSize + 'px "' + st.title + '"';
    var py = fy + U * 0.04 + mainSize; ctx.fillText(facts.priceMain || '', x, py, priceW);
    ctx.font = bodyFont(0.026); py += lineSize * 0.4;
    subLines.forEach(function (l) { py += lineSize * 1.35; ctx.fillText(l, x, py); });
    if (qrOn) {
      var qs = Math.min(fh - safeBot - U * 0.1, U * 0.2), qx = W - pad - qs, qy = fy + U * 0.03;
      qrDraw(ctx, facts.url, qx, qy, qs, '#111111');
      ctx.font = '700 ' + Math.round(U * 0.017) + 'px "Manrope"'; ctx.textAlign = 'center';
      ctx.fillText(facts.urlLabel || 'Scan me', qx + qs / 2, qy + qs + U * 0.025);
      var su = shortUrl(facts.url); if (su.length <= 34) ctx.fillText(su, qx + qs / 2, qy + qs + U * 0.047, qs * 1.6);
      ctx.textAlign = 'left';
    }
    if (opts.footer) {
      ctx.font = '700 ' + Math.round(U * 0.017) + 'px "Manrope"'; ctx.textAlign = qrOn ? 'left' : 'right';
      ctx.fillText('Made with ShowReady · beshowready.co.uk', qrOn ? x : W - pad, H - safeBot - U * 0.022); ctx.textAlign = 'left';
    }

    // strip above the footer: charity logo and sponsors
    var sponsors = rules.sponsors === false ? [] : (opts.sponsors || []).filter(function (i) { return i && i.width; });
    var sh = (opts.charityLogo || sponsors.length) ? U * (wide ? 0.11 : 0.085) : 0, sy = fy - sh;
    if (sh) {
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, sy, W, sh);
      var lh = sh * 0.62, ly = sy + (sh - lh) / 2, lx = x;
      ctx.fillStyle = '#333333'; ctx.font = '700 ' + Math.round(U * 0.02) + 'px "Manrope"';
      if (opts.charityLogo) {
        ctx.fillText('In aid of', lx, sy + sh / 2 + U * 0.006); lx += ctx.measureText('In aid of').width + U * 0.015;
        var lw = contain(ctx, opts.charityLogo, lx, ly, sh * 2.4, lh); lx += lw + U * 0.015;
        if (facts.charity) { ctx.font = '800 ' + Math.round(U * 0.024) + 'px "Manrope"'; var cn = wrap(ctx, facts.charity, sponsors.length ? W * 0.28 : W * 0.6)[0] || ''; ctx.fillText(cn, lx, sy + sh / 2 + U * 0.007); lx += ctx.measureText(cn).width + U * 0.03; }
      }
      if (sponsors.length) {
        var room = W - pad - lx - U * 0.02, each = Math.min(sh * 2.2, (room - U * 0.1) / sponsors.length);
        if (each > sh * 0.6) {
          var sxp = W - pad - sponsors.length * (each + U * 0.012);
          ctx.font = '700 ' + Math.round(U * 0.018) + 'px "Manrope"'; ctx.fillStyle = '#555555';
          var spw = ctx.measureText('Sponsored by').width;
          if (sxp - U * 0.01 - spw > lx) { ctx.textAlign = 'right'; ctx.fillText('Sponsored by', sxp - U * 0.01, sy + sh / 2 + U * 0.005); ctx.textAlign = 'left'; }
          sponsors.forEach(function (img, i) { contain(ctx, img, sxp + i * (each + U * 0.012), ly, each, lh); });
        }
      }
    }
    var bottom = (sh ? sy : fy) - U * 0.035;

    // measure everything below the title first, so the title gets whatever room is left
    ctx.font = bodyFont(0.036);
    var infoLines = []; [facts.time, facts.venue, facts.extra].filter(Boolean).forEach(function (l) { wrap(ctx, l, maxW).slice(0, 2).forEach(function (w) { infoLines.push(w); }); });
    var lineupLines = [];
    if (facts.lineup) { ctx.font = bodyFont(0.03); lineupLines = wrap(ctx, String(facts.lineup).split(/\s*[,\n]\s*/).filter(Boolean).join('  ·  '), maxW).slice(0, rules.lineup || 3); }
    var lineupH = lineupLines.length ? U * 0.075 + lineupLines.length * U * 0.042 : 0;
    var onList = (facts.on || []).slice(), showOn = onList.length && opts.showOn !== false;
    var cols = wide ? Math.min(onList.length, 6) : Math.min(onList.length, sq || onList.length > 6 ? 4 : 3), cell = maxW / Math.max(cols, 1), labelH = U * 0.075;
    var minIcon = U * (wide ? 0.08 : 0.1), onRows = showOn ? Math.ceil(onList.length / Math.max(cols, 1)) : 0, onMin = showOn ? U * 0.05 + onRows * (minIcon + labelH) : 0;
    ctx.font = bodyFont(0.032); var kick = facts.kicker ? wrap(ctx, facts.kicker, maxW).slice(0, 2) : [];
    var headFixed = kick.length * U * 0.042 + (kick.length ? U * 0.01 : 0) + U * 0.02 + infoLines.length * U * 0.048;
    var titleRoom = bottom - topY - headFixed - onMin - lineupH;
    if (lineupLines.length && titleRoom < U * 0.22) { titleRoom += lineupH; lineupLines = []; lineupH = 0; }
    while (onRows > 1 && titleRoom < U * 0.2) { onRows--; titleRoom += minIcon + labelH; }

    // header: kicker, date, title, time and venue
    var y = topY;
    if (kick.length) { ctx.fillStyle = st.ink; ctx.font = bodyFont(0.032); kick.forEach(function (l) { ctx.fillText(l, x, y); y += U * 0.042; }); y += U * 0.01; }
    ctx.fillStyle = st.accent; ctx.font = bodyFont(0.03);
    if (facts.date) { ctx.fillText(facts.date.toUpperCase(), x, y, maxW); }
    var tMax = ['blocks', 'rays', 'grid', 'snow'].indexOf(st.deco) !== -1 ? W * (wide ? 0.6 : 0.56) - (wide ? pad : 0) : maxW;
    var tMaxLines = wide || sq ? 2 : 3, tStart = Math.round(U * (sq ? 0.1 : 0.15)), tMin = Math.round(U * 0.05);
    var t = fit(ctx, facts.title || '', st.title, st.tw, tMax, tMaxLines, tStart, tMin, titleRoom);
    if (t.size === tMin && tMax < maxW) { tMax = maxW; t = fit(ctx, facts.title || '', st.title, st.tw, tMax, tMaxLines, tStart, tMin, titleRoom); }
    ctx.font = st.tw + ' ' + t.size + 'px "' + st.title + '"'; ctx.fillStyle = st.ink;
    y += t.size * 1.05;
    t.lines.forEach(function (l) { ctx.fillText(l, x, y); y += t.size; });
    y += U * 0.02;
    ctx.font = bodyFont(0.036); ctx.fillStyle = st.ink;
    infoLines.forEach(function (w) { ctx.fillText(w, x, y + U * 0.03); y += U * 0.048; });

    // What's on: centre the icons and line-up a little in any spare room
    var cRows = showOn ? Math.ceil(onList.length / cols) : 0, cIcon = Math.min(cell * 0.55, U * (wide ? 0.09 : 0.13));
    var spare = bottom - y - (showOn ? U * 0.05 + cRows * (cIcon + labelH) : 0) - lineupH;
    if (spare > 0) y += spare * 0.35;
    if (showOn) {
      y += U * 0.05;
      var avail = bottom - y - lineupH, list = onList;
      var iconS = Math.min(cell * 0.55, U * (wide ? 0.09 : 0.13)), rows = Math.ceil(list.length / cols);
      while (rows > 1 && rows * (iconS + labelH) > avail) { if (iconS > minIcon * 1.15) iconS *= 0.9; else rows--; }
      list = list.slice(0, rows * cols);
      if (rows * (iconS + labelH) > avail) iconS = Math.max(0, avail / rows - labelH);
      if (iconS >= U * 0.04) {
        list.forEach(function (o, i) {
          var cx = x + (i % cols) * cell, cy = y + Math.floor(i / cols) * (iconS + labelH);
          drawIcon(ctx, o[0], iconMode, cx, cy, iconS, iconCol);
          ctx.fillStyle = st.ink; ctx.font = bodyFont(0.026);
          wrap(ctx, o[1], cell - U * 0.02).slice(0, 2).forEach(function (w, k) { ctx.fillText(w, cx, cy + iconS + U * 0.04 + k * U * 0.03); });
        });
        y += rows * (iconS + labelH);
      }
    }
    if (lineupLines.length && y + lineupH <= bottom + U * 0.02) {
      y += U * 0.02; ctx.fillStyle = st.accent; ctx.font = bodyFont(0.022); ctx.fillText('LINE-UP', x, y + U * 0.02); y += U * 0.03;
      ctx.fillStyle = st.ink; ctx.font = bodyFont(0.03); lineupLines.forEach(function (l) { y += U * 0.042; ctx.fillText(l, x, y); });
    }
    return canvas;
  };

  // ---- exports
  P.toBlob = function (canvas, type) { return new Promise(function (res) { canvas.toBlob(res, type || 'image/png', 0.92); }); };
  var PAPER = { a5: [148, 210], a4: [210, 297], a3: [297, 420] };
  P.toPDF = function (canvas, paper) {
    var J = window.jspdf && window.jspdf.jsPDF; if (!J) throw new Error('PDF library missing');
    var p = PAPER[paper] || PAPER.a4, doc = new J({ unit: 'mm', format: [p[0], p[1]], orientation: 'portrait' });
    doc.addImage(canvas.toDataURL('image/jpeg', 0.94), 'JPEG', 0, 0, p[0], p[1]);
    return doc.output('blob');
  };
  P.fontsFor = function (styleId, font) {
    var st = STYLES[styleId] || STYLES.fete; return [font ? font[0] : st.title, st.body, 'Manrope'];
  };
})();
