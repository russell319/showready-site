/* ShowReady site plan PDF (build 85), shared by pages that don't load the event pack (the Film page).
   The same scale drawing as the planner's site plan PDF: items at their real sizes, a key, quantities and,
   when the 3D map is open, a picture of the aerial view. Made in the browser with jsPDF. */
(function () {
  'use strict';
  if (window.SRSitePdf) return;
  var JSPDF = '/vendor/jspdf@2.5.1/jspdf.umd.min.js';
  var JSPDF_SRI = 'sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk';
  var loading = null;
  function load() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    if (loading) return loading;
    loading = new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = JSPDF; s.integrity = JSPDF_SRI; s.crossOrigin = 'anonymous';
      s.onload = function () { window.jspdf && window.jspdf.jsPDF ? res(window.jspdf.jsPDF) : rej(new Error('missing')); };
      s.onerror = function () { loading = null; rej(new Error('load')); };
      document.head.appendChild(s);
    });
    return loading;
  }
  // PDF's built-in fonts only cover Western European letters.
  function t(s) { return String(s == null ? '' : s).replace(/[←→↗↘]/g, '-').replace(/[²]/g, '2').replace(/[≈]/g, '~').replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF‘’“”–—•…€£]/g, ''); }
  var GREEN = [30, 90, 67], INK = [21, 35, 28], MUTED = [90, 104, 96], LINE = [214, 222, 216];

  function sitePlanPdf(jsPDF, sp, title, address) {
    // Build 114: the ShowReady mark on every page of every site plan, bottom left, clear of the map credits
    function srMark(d) { for (var pg = 1; pg <= d.getNumberOfPages(); pg++) { d.setPage(pg); var h = d.internal.pageSize.getHeight(); if (window.SRPlanMark) window.SRPlanMark.pdf(d, 12, h - 4); else { d.setFont('helvetica', 'normal'); d.setFontSize(7); d.setTextColor(30, 90, 67); d.text('Made with ShowReady \u00b7 beshowready.co.uk. Not checked or approved by ShowReady.', 12, h - 4); } } return d; }
    var SP = window.SRSitePlan; if (!SP || !sp) return null;
    var items = sp.items || [], lines = sp.lines || [];
    var a3 = sp.paper !== 'a4', paper = a3 ? 'A3' : 'A4';
    var doc = new jsPDF({ unit: 'mm', format: a3 ? 'a3' : 'a4', orientation: 'landscape' }), W = a3 ? 420 : 297, H = a3 ? 297 : 210, M = 12;
    var pts = [];
    items.forEach(function (it) { (SP._geo.footprint(it) || [[it.lat, it.lon]]).forEach(function (p) { pts.push(p); }); var z = SP.zoneOf && SP.zoneOf(it); if (z && z.kind === 'rect') z.pts.forEach(function (p) { pts.push(p); }); });
    lines.forEach(function (l) { (l.pts || []).forEach(function (p) { pts.push(p); }); });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor.apply(doc, GREEN); doc.text(t('Site plan: ' + (title || 'Your event')), M, 14);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor.apply(doc, MUTED);
    var today = new Date(); today = today.getDate() + ' ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][today.getMonth()] + ' ' + today.getFullYear();
    doc.text(t((address ? address + ' · ' : '') + 'Drawn to scale from the ShowReady site plan on ' + today + '. Sizes are as entered: check them on site.'), M, 19);
    if (!pts.length) { doc.setFontSize(12); doc.text('Nothing drawn yet. Add items on the Site plan tab, then download again.', M, 40); return srMark(doc); }
    var lat0 = pts.reduce(function (a, p) { return a + p[0]; }, 0) / pts.length, kx = 111320 * Math.cos(lat0 * Math.PI / 180), ky = 111320;
    function xy(p) { return [p[1] * kx, -p[0] * ky]; }
    var xs = pts.map(function (p) { return xy(p)[0]; }), ys = pts.map(function (p) { return xy(p)[1]; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var bw = Math.max(maxX - minX, 10), bh = Math.max(maxY - minY, 10);
    var box = { x: M, y: 24, w: W - 107, h: H - 24 - M };
    var s = Math.min((box.w - 10) / bw, (box.h - 10) / bh); // mm on paper per metre
    var ox = box.x + (box.w - bw * s) / 2, oy = box.y + (box.h - bh * s) / 2;
    function P2(p) { var q = xy(p); return [ox + (q[0] - minX) * s, oy + (q[1] - minY) * s]; }
    function rgb(hex) { var m = String(hex).replace('#', ''); return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)]; }
    doc.setDrawColor.apply(doc, LINE); doc.setLineWidth(0.3); doc.rect(box.x, box.y, box.w, box.h);
    // areas first, then lines, then items on top
    lines.forEach(function (l) {
      var st = SP.LINES[l.type] || SP.LINES.fence, c = rgb(st.c), q = (l.pts || []).map(P2); if (q.length < 2) return;
      doc.setDrawColor.apply(doc, c); doc.setLineWidth(st.area ? 0.5 : 0.8);
      if (doc.setLineDashPattern) doc.setLineDashPattern(st.dash ? [2.5, 1.5] : [], 0);
      if (st.area && q.length > 2) { doc.lines(q.slice(1).map(function (p, i) { return [p[0] - q[i][0], p[1] - q[i][1]]; }), q[0][0], q[0][1], [1, 1], 'S', true); }
      else for (var i = 1; i < q.length; i++) doc.line(q[i - 1][0], q[i - 1][1], q[i][0], q[i][1]);
      if (doc.setLineDashPattern) doc.setLineDashPattern([], 0);
    });
    // safety zones (dashed) under the items
    items.forEach(function (it) {
      var z = SP.zoneOf && SP.zoneOf(it); if (!z) return;
      var ty = SP.TYPES[it.type] || SP.TYPES.other; doc.setDrawColor.apply(doc, rgb(ty.c)); doc.setLineWidth(0.4);
      if (doc.setLineDashPattern) doc.setLineDashPattern([1.5, 1.2], 0);
      if (z.kind === 'circle') { var cc = P2([it.lat, it.lon]); doc.circle(cc[0], cc[1], z.r * s, 'S'); doc.setLineWidth(0.2); doc.circle(cc[0], cc[1], z.r2 * s, 'S'); }
      else { var zq = z.pts.map(P2); doc.lines(zq.slice(1).map(function (p, i) { return [p[0] - zq[i][0], p[1] - zq[i][1]]; }), zq[0][0], zq[0][1], [1, 1], 'S', true); }
      if (doc.setLineDashPattern) doc.setLineDashPattern([], 0);
    });
    var key = [];
    items.forEach(function (it) {
      var ty = SP.TYPES[it.type] || SP.TYPES.other, c = rgb(ty.c), n = 0;
      if (ty.numbered) items.some(function (x) { if (x.type === it.type) n++; return x.id === it.id; });
      var code = ty.numbered ? ty.k + n : ty.k, fp = SP._geo.footprint(it), ctr = P2([it.lat, it.lon]);
      doc.setFillColor.apply(doc, c); doc.setDrawColor.apply(doc, c); doc.setLineWidth(0.3);
      if (fp) { var q = fp.map(P2); doc.lines(q.slice(1).map(function (p, i) { return [p[0] - q[i][0], p[1] - q[i][1]]; }), q[0][0], q[0][1], [1, 1], 'FD', true); }
      var r = 2.6; doc.setFillColor(255, 255, 255); doc.circle(ctr[0], ctr[1], r, 'FD');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(code.length > 2 ? 5 : 6); doc.setTextColor.apply(doc, c);
      doc.text(t(code), ctr[0], ctr[1] + 0.8, { align: 'center' });
      key.push({ code: code, c: c, label: SP.labelOf(it, sp), size: it.w && it.d ? it.w + ' x ' + it.d + ' m' : '' });
    });
    // north arrow and scale bar
    var nx = box.x + box.w - 9, ny = box.y + 12; doc.setFillColor.apply(doc, INK); doc.triangle(nx, ny - 6, nx - 2.5, ny, nx + 2.5, ny, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor.apply(doc, INK); doc.text('N', nx, ny + 4, { align: 'center' });
    var nice = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000], target = 40 / s, bar = nice[0];
    nice.forEach(function (v) { if (v <= target) bar = v; });
    var bx = box.x + 5, by = box.y + box.h - 6; doc.setLineWidth(0.6); doc.setDrawColor.apply(doc, INK); doc.line(bx, by, bx + bar * s, by); doc.line(bx, by - 1.5, bx, by + 1.5); doc.line(bx + bar * s, by - 1.5, bx + bar * s, by + 1.5);
    doc.setFont('helvetica', 'normal'); doc.text(bar + ' m', bx + bar * s / 2, by - 2.2, { align: 'center' });
    doc.setFontSize(7); doc.setTextColor.apply(doc, MUTED); doc.text(t('Scale about 1:' + Math.round(1000 / s).toLocaleString('en-GB') + ' on ' + paper), bx, by + 4.5);
    // key
    var kx0 = box.x + box.w + 6, ky0 = box.y + 4; doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor.apply(doc, GREEN); doc.text('Key', kx0, ky0); ky0 += 6;
    doc.setFontSize(8);
    key.forEach(function (k) {
      if (ky0 > H - M - 4) return;
      doc.setFillColor.apply(doc, k.c); doc.roundedRect(kx0, ky0 - 3.2, 9, 4.4, 1.2, 1.2, 'F');
      doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255); doc.text(t(k.code), kx0 + 4.5, ky0, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setTextColor.apply(doc, INK); doc.text(t(k.label), kx0 + 11, ky0);
      if (k.size) { doc.setTextColor.apply(doc, MUTED); doc.text(t(k.size), W - M, ky0, { align: 'right' }); }
      ky0 += 5.2;
    });
    lines.forEach(function (l) {
      if (ky0 > H - M - 4) return;
      var st = SP.LINES[l.type] || SP.LINES.fence; doc.setDrawColor.apply(doc, rgb(st.c)); doc.setLineWidth(0.8); doc.line(kx0, ky0 - 1, kx0 + 9, ky0 - 1);
      doc.setTextColor.apply(doc, INK); doc.text(t(l.label || st.t), kx0 + 11, ky0);
      doc.setTextColor.apply(doc, MUTED); doc.text(t(st.area ? SP._geo.fmtArea(SP._geo.area(l.pts)) : SP._geo.fmtLen(SP._geo.length(l.pts))), W - M, ky0, { align: 'right' });
      ky0 += 5.2;
    });
    // ---- page 2: the figures and a schedule of every item (build 52)
    var F = SP.figures ? SP.figures(sp) : { rows: [] };
    doc.addPage(a3 ? 'a3' : 'a4', 'landscape');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor.apply(doc, GREEN); doc.text(t('Site figures and schedule: ' + (title || 'Your event')), M, 14);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor.apply(doc, MUTED); doc.text(t('Worked out from the site plan as drawn. Crowd capacity uses 2 people per m² standing; check it against your own risk assessment.'), M, 19);
    var y2 = 28, colW = (W - 2 * M - 10) / 2;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor.apply(doc, INK); doc.text('Figures', M, y2); y2 += 6; doc.setFontSize(9);
    (F.rows.length ? F.rows : [['Nothing to count yet', '']]).forEach(function (r) {
      doc.setFont('helvetica', 'normal'); doc.setTextColor.apply(doc, MUTED); doc.text(t(r[0]), M, y2);
      doc.setFont('helvetica', 'bold'); doc.setTextColor.apply(doc, INK); doc.text(t(String(r[1])), M + colW, y2, { align: 'right' });
      doc.setDrawColor.apply(doc, LINE); doc.setLineWidth(0.1); doc.line(M, y2 + 1.6, M + colW, y2 + 1.6); y2 += 6;
    });
    var x3 = M + colW + 10, y3 = 28;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor.apply(doc, INK); doc.text('Schedule of items', x3, y3); y3 += 6; doc.setFontSize(8);
    var cols = [x3, x3 + colW * 0.38, x3 + colW * 0.56, x3 + colW * 0.70];
    ['Item', 'Size', 'Area', 'Supplier and notes'].forEach(function (h, i) { doc.setTextColor.apply(doc, MUTED); doc.text(h, cols[i], y3); }); y3 += 4.5;
    var more = 0;
    items.forEach(function (it) {
      if (y3 > H - M) { more++; return; }
      var note = [it.supplier, it.contact, it.notes].filter(Boolean).join(' · ');
      doc.setFont('helvetica', 'normal'); doc.setTextColor.apply(doc, INK);
      doc.text(t(SP.labelOf(it, sp)).slice(0, 34), cols[0], y3);
      doc.text(t(it.w && it.d ? it.w + ' x ' + it.d + ' m' : ''), cols[1], y3);
      doc.text(t(it.w && it.d ? Math.round(it.w * it.d) + ' m²' : ''), cols[2], y3);
      var nl = doc.splitTextToSize(t(note), W - M - cols[3]); doc.setTextColor.apply(doc, MUTED); doc.text(nl.slice(0, 2), cols[3], y3);
      y3 += 4.2 * Math.max(1, Math.min(2, nl.length));
    });
    if (more) { doc.setTextColor.apply(doc, MUTED); doc.text(t('…and ' + more + ' more items on the plan.'), x3, H - M + 4); }
    // ---- page 3: the plan on its aerial photo or map, as drawn on screen (not to scale)
    var shot = SP.snapshot && SP.snapshot();
    if (shot) {
      doc.addPage(a3 ? 'a3' : 'a4', 'landscape');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor.apply(doc, GREEN); doc.text(t('Site view: ' + (title || 'Your event')), M, 14);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor.apply(doc, MUTED); doc.text(t('The plan over the map as shown in ShowReady' + (shot.pitched ? ' (3D view)' : '') + '. For distances, use the scale drawing on page 1.'), M, 19);
      var iw = W - 2 * M, ih = H - 26 - M, k = Math.min(iw / shot.w, ih / shot.h);
      try { doc.addImage(shot.url, 'JPEG', M + (iw - shot.w * k) / 2, 24, shot.w * k, shot.h * k); } catch (e) {}
    }
    return srMark(doc);
  }

  function save(name, blob) {
    if (window.claude && window.claude.use) {
      return window.claude.use('downloads').then(function (dl) { return dl ? dl.save({ filename: name, data: blob }).then(function () { return true; }) : false; });
    }
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    return Promise.resolve(true);
  }
  function fileName(s) { return (String(s || 'Site plan').replace(/[^\w \-]/g, '').slice(0, 50).trim() || 'Site plan'); }
  // download(plan, title, address): builds and saves the PDF. Resolves true when saved.
  function download(sp, title, address) {
    if (!sp || !((sp.items || []).length || (sp.lines || []).length)) return Promise.reject(new Error('empty'));
    return load().then(function (jsPDF) { return window.SRSitePdf.save('ShowReady site plan - ' + fileName(title) + '.pdf', sitePlanPdf(jsPDF, sp, title, address).output('blob')); });
  }
  window.SRSitePdf = { load: load, make: sitePlanPdf, download: download, save: save, t: t };
})();
