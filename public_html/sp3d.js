// ShowReady site plan: 3D models for the 3D view (Build 93).
// Loaded only when someone switches the site plan to 3D, and only where WebGL works.
// Draws each item as a simple model in a MapLibre custom layer using three.js.
// Original artwork. Sizes follow each item's width (w) and depth (d) in metres.
import * as T from '/vendor/three@0.170.0/three.module.min.js';

var MLAT = 111320;
function mLon(lat) { return 111320 * Math.cos(lat * Math.PI / 180); }

// shared materials
var MATS = {};
function M(c, o) { var k = c + JSON.stringify(o || {}); if (!MATS[k]) MATS[k] = new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o || {})); return MATS[k]; }
function B(c, o) { var k = 'b' + c + JSON.stringify(o || {}); if (!MATS[k]) MATS[k] = new T.MeshBasicMaterial(Object.assign({ color: c }, o || {})); return MATS[k]; }
var GEO = { box: new T.BoxGeometry(1, 1, 1), cyl: new T.CylinderGeometry(1, 1, 1, 16), cone4: new T.ConeGeometry(Math.SQRT1_2, 1, 4), sph: new T.SphereGeometry(1, 12, 10) };
GEO.cone4.rotateY(Math.PI / 4);

function box(p, w, h, d, m, x, y, z) { var b = new T.Mesh(GEO.box, m); b.scale.set(Math.max(w, 0.01), Math.max(h, 0.01), Math.max(d, 0.01)); b.position.set(x || 0, (y || 0) + h / 2, z || 0); p.add(b); return b; }
function cyl(p, r, h, m, x, y, z, rt) { var g = rt === undefined ? GEO.cyl : new T.CylinderGeometry(rt, r, 1, 16); var c = new T.Mesh(g, m); c.scale.set(rt === undefined ? r : 1, h, rt === undefined ? r : 1); c.position.set(x || 0, (y || 0) + h / 2, z || 0); p.add(c); return c; }
function pyr(p, w, h, d, m, y) { var c = new T.Mesh(GEO.cone4, m); c.scale.set(w, h, d); c.position.y = (y || 0) + h / 2; p.add(c); return c; }
function wheel(p, x, z, r) { var c = new T.Mesh(GEO.cyl, M('#161616')); c.scale.set(r, 0.25, r); c.rotation.x = Math.PI / 2; c.position.set(x, r, z); p.add(c); }
function gable(p, len, span, rise, m, y, alongX) {
  var s = new T.Shape(); s.moveTo(-span / 2, 0); s.lineTo(0, rise); s.lineTo(span / 2, 0); s.lineTo(-span / 2, 0);
  var g = new T.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }); g.translate(0, 0, -len / 2);
  var r = new T.Mesh(g, m); r.position.y = y; if (alongX) r.rotation.y = Math.PI / 2; p.add(r); return r;
}
function shadow(p, w, d, round) {
  var g = round ? new T.CircleGeometry(0.5, 32) : new T.PlaneGeometry(1, 1);
  var s = new T.Mesh(g, B('#000000', { transparent: true, opacity: 0.22, depthWrite: false })); s.rotation.x = -Math.PI / 2; s.scale.set(w * 1.06 + 0.3, d * 1.06 + 0.3, 1); s.position.set(0.25, 0.03, 0.25); p.add(s);
}
// a texture of ShowReady's top-down drawing of the item, for roofs of vehicles and units
var TEX = {};
function topTex(SP, type, w, d, onload) {
  var k = type + '|' + w + '|' + d; if (TEX[k]) return TEX[k];
  var url = SP._draw(type, w, d); if (!url) return null;
  var img = new Image(); var t = new T.Texture(img); t.colorSpace = T.SRGBColorSpace;
  img.onload = function () { t.needsUpdate = true; onload && onload(); }; img.src = url; TEX[k] = t; return t;
}
// a box whose top shows the drawing (top face is index 2 in BoxGeometry)
function texBox(p, SP, type, w, h, d, side, y, x, z, rp) {
  var t = topTex(SP, type, w, d, rp); var top = t ? new T.MeshStandardMaterial({ map: t, roughness: 0.7 }) : M(side);
  var b = new T.Mesh(GEO.box, [M(side), M(side), top, M(side), M(side), M(side)]); b.scale.set(w, h, d); b.position.set(x || 0, (y || 0) + h / 2, z || 0); p.add(b); return b;
}

var LIGHTS = ['#ffd36b', '#b9a0ff', '#ff6b9a', '#6bd3ff'];
// ---- Build 94: European vehicles ------------------------------------------------------------
// Each vehicle is built along X with its front at +X, wheels on the ground, width W across Z.
// style: rigid (flat-fronted lorry), artic (tractor unit + semi-trailer), van (Sprinter-type),
// luton (coachbuilt motorhome), bus (double-decker), fifth (pickup + fifth-wheel caravan),
// rv (American A-class), trailer (towed, A-frame drawbar), car.
var VEH = {
  food: { s: 'van', c: '#fafaf7', h: 2.9, hatch: 1, awn: '#e0483a' },
  icecream: { s: 'van', c: '#fbe3ee', h: 2.8, hatch: 1, awn: '#d86a9a', stripe: '#79c3e8' },
  trailer: { s: 'trailer', c: '#f2f2ee', h: 2.6, hatch: 1, awn: '#e0483a' },
  catering: { s: 'rigid', c: '#ecebe6', h: 3.6, hatch: 1, awn: '#e0483a', cabC: '#e8e8e2' },
  techtruck: { s: 'auto', c: '#eceff1', h: 3.9, cabC: '#ffffff' },
  honeywagon: { s: 'auto', c: '#f5f7f8', h: 4, stripe: '#2E6DA4', win: 1, cabC: '#2E6DA4' },
  makeup: { s: 'auto', c: '#f5f2f7', h: 4, stripe: '#7A3E9D', win: 1, cabC: '#ffffff' },
  diningbus: { s: 'bus', c: '#c9a66b', h: 4.3 },
  artisttrailer: { s: 'trailer', c: '#f4f0f6', h: 3.3, stripe: '#8E5B9E', win: 1 },
  welfareunit: { s: 'van', c: '#e9f3f2', h: 2.8, stripe: '#00897B', win: 1 },
  gentruck: { s: 'rigid', c: '#e3b51c', h: 3.4, louvre: 1, cabC: '#eeeeee' },
  hgv: { s: 'auto', c: '#f0f0ee', h: 4, cabC: '#2f4d7a' },
  artic: { s: 'artic', c: '#f0f0ee', h: 4, cabC: '#b3261e' },
  horsebox: { s: 'rigid', c: '#e7ddc8', h: 3.5, cabC: '#3a5a40', horse: 1 },
  motorhome: { s: 'luton', c: '#f6f3ec', h: 3.1, stripe: '#8a6a45', win: 1 },
  rv: { s: 'rv', c: '#f4f1ea', h: 3.6, stripe: '#8a6a45' },
  fifthwheel: { s: 'fifth', c: '#f4f1ea', h: 3.8, stripe: '#6b5136', truck: '#2b3a4a' },
  rvslide: { s: 'rv', c: '#f4f1ea', h: 3.6, stripe: '#8a6a45', slide: 0.85 },
  aclass: { s: 'rv', euro: 1, c: '#f7f7f5', h: 3, stripe: '#7d8790' },
  aclassslide: { s: 'rv', euro: 1, c: '#f7f7f5', h: 3, stripe: '#7d8790', slide: 0.6 },
  fifthwheelslide: { s: 'fifth', c: '#f4f1ea', h: 3.8, stripe: '#6b5136', truck: '#2b3a4a', slide: 0.8 },
  fifthcaravan: { s: 'fifth', c: '#f4f1ea', h: 3.8, stripe: '#6b5136', noTruck: 1 },
  fifthcaravanslide: { s: 'fifth', c: '#f4f1ea', h: 3.8, stripe: '#6b5136', noTruck: 1, slide: 0.8 },
  van: { s: 'van', c: '#e8edf0', h: 2.7 },
  car: { s: 'car', c: '#3d5a80', h: 1.5 },
  bowser: { s: 'trailer', c: '#2E6DA4', h: 2, tank: 1 },
  atm: { s: 'trailer', c: '#37474F', h: 2.4, atm: 1 }
};
var GLASS = M('#1c2a33', { roughness: 0.15, metalness: 0.3 });
function profile(p, pts, W, m, x0, y0) {
  var s = new T.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  var g = new T.ExtrudeGeometry(s, { depth: W, bevelEnabled: false }); g.translate(0, 0, -W / 2);
  var mesh = new T.Mesh(g, m); mesh.position.set(x0 || 0, y0 || 0, 0); p.add(mesh); return mesh;
}
function wheels(p, x, W, r, dual) { [-1, 1].forEach(function (s) { var c = new T.Mesh(GEO.cyl, M('#161616')); c.scale.set(r, dual ? 0.5 : 0.3, r); c.rotation.x = Math.PI / 2; c.position.set(x, r, s * (W / 2 - (dual ? 0.3 : 0.2))); p.add(c); var hub = new T.Mesh(GEO.cyl, M('#9aa0a6', { metalness: 0.7 })); hub.scale.set(r * 0.5, (dual ? 0.5 : 0.3) + 0.02, r * 0.5); hub.rotation.x = Math.PI / 2; hub.position.copy(c.position); p.add(hub); }); }
function sideWins(p, x0, x1, y0, y1, W, n) { var len = (x1 - x0) / n; for (var i = 0; i < n; i++) [-1, 1].forEach(function (s) { box(p, len * 0.8, y1 - y0, 0.03, GLASS, x0 + (i + 0.5) * len, y0, s * (W / 2 + 0.01)); }); }
function stripe(p, x0, x1, y, W, c) { [-1, 1].forEach(function (s) { box(p, x1 - x0, 0.18, 0.02, M(c), (x0 + x1) / 2, y, s * (W / 2 + 0.015)); }); }
// flat-fronted European cab: rear at x0, front at x0 + cl
function cabOver(p, x0, cl, ch, W, c) {
  var paint = M(c, { roughness: 0.45, metalness: 0.15 });
  profile(p, [[0, 0.55], [cl, 0.55], [cl, 1.55], [cl - 0.12, ch - 0.2], [cl - 0.3, ch], [0, ch]], W, paint, x0, 0);
  var ws = box(p, 0.04, ch - 1.95, W * 0.88, GLASS, x0 + cl - 0.08, 1.7, 0); ws.rotation.z = 0.06;
  box(p, 0.06, 0.6, W * 0.7, M('#2b2b2b'), x0 + cl + 0.01, 0.85, 0);
  box(p, 0.25, 0.3, W, M('#3a3a3a'), x0 + cl - 0.05, 0.45, 0);
  [-1, 1].forEach(function (s) { box(p, 0.05, 0.18, 0.35, B('#fff6d8'), x0 + cl + 0.02, 0.62, s * (W / 2 - 0.3)); box(p, cl * 0.45, 0.75, 0.03, GLASS, x0 + cl * 0.6, ch - 1.15, s * (W / 2 + 0.01)); box(p, 0.08, 0.5, 0.06, M('#222'), x0 + cl - 0.1, ch - 1.2, s * (W / 2 + 0.25)); box(p, 0.05, 0.05, 0.3, M('#222'), x0 + cl - 0.1, ch - 0.95, s * (W / 2 + 0.12)); });
}
// van front (Sprinter / Transit type): rear of cab at x0, front at x0 + cl, roof height rh
function vanFront(p, x0, cl, rh, W, c) {
  var paint = M(c, { roughness: 0.45, metalness: 0.15 });
  profile(p, [[0, 0.4], [cl, 0.4], [cl, 0.95], [cl - 0.15, 1.15], [cl - 0.85, 1.25], [cl - 1.45, rh - 0.1], [cl - 1.6, rh], [0, rh]], W, paint, x0, 0);
  var ws = box(p, 0.04, rh - 1.35, W * 0.86, GLASS, x0 + cl - 1.15, 1.25, 0); ws.rotation.z = 0.55;
  box(p, 0.05, 0.4, W * 0.6, M('#2b2b2b'), x0 + cl + 0.01, 0.55, 0);
  [-1, 1].forEach(function (s) { box(p, 0.05, 0.15, 0.3, B('#fff6d8'), x0 + cl - 0.05, 0.85, s * (W / 2 - 0.25)); box(p, 0.7, 0.55, 0.03, GLASS, x0 + cl - 1.55, rh - 0.85, s * (W / 2 + 0.01)); box(p, 0.06, 0.25, 0.06, M('#222'), x0 + cl - 1.2, 1.35, s * (W / 2 + 0.15)); });
}
function hatch(p, x0, x1, W, y, awn) {
  box(p, (x1 - x0), 0.95, 0.05, M('#2b2b2b'), (x0 + x1) / 2, y, W / 2 + 0.01);
  box(p, (x1 - x0), 0.08, 0.45, M('#d9d9d9', { metalness: 0.5 }), (x0 + x1) / 2, y - 0.08, W / 2 + 0.25);
  var n = 7; for (var i = 0; i < n; i++) { var a = box(p, (x1 - x0) / n, 0.05, 1.1, M(i % 2 ? '#ffffff' : awn), x0 + (i + 0.5) * (x1 - x0) / n, y + 1.15, W / 2 + 0.5); a.rotation.x = 0.25; }
}
// slide-out rooms, deployed: a big lounge slide on one side and a bedroom slide on the other
function slideOuts(p, xa0, xa1, xb0, xb1, y0, y1, Wb, P, m, stripeC) {
  [[xa0, xa1, -1], [xb0, xb1, 1]].forEach(function (r) {
    var len = r[1] - r[0], zc = r[2] * (Wb / 2 + P / 2 - 0.02);
    box(p, len, y1 - y0, P, m, (r[0] + r[1]) / 2, y0, zc);
    box(p, len + 0.06, 0.08, P + 0.05, M('#d6d1c6'), (r[0] + r[1]) / 2, y1, zc);
    box(p, len * 0.6, (y1 - y0) * 0.35, 0.03, GLASS, (r[0] + r[1]) / 2, y0 + (y1 - y0) * 0.45, r[2] * (Wb / 2 + P + 0.0));
    if (stripeC) box(p, len, 0.18, 0.02, M(stripeC), (r[0] + r[1]) / 2, y0 + 0.25, r[2] * (Wb / 2 + P + 0.01));
  });
}
function vehicle(SP, it, type, L, W, rp) {
  var v = VEH[type], g2 = new T.Group(), s = v.s, h = v.h, body = M(v.c, { roughness: 0.5 });
  var SL = v.slide || 0; W = W - 2 * SL;
  if (s === 'auto') s = L >= 13 ? 'artic' : 'rigid';
  if (s === 'rigid') {
    var cl = Math.min(2.3, L * 0.3), bl = L - cl - 0.15, fl = 1.15;
    cabOver(g2, L / 2 - cl, cl, Math.min(3.2, h - 0.2), W, v.cabC || '#ffffff');
    box(g2, L - 0.6, 0.3, W * 0.7, M('#222'), -0.1, 0.55, 0);
    box(g2, bl, h - fl, W, body, -L / 2 + bl / 2, fl, 0);
    if (v.stripe) stripe(g2, -L / 2 + 0.2, -L / 2 + bl - 0.2, fl + 0.4, W, v.stripe);
    if (v.win) sideWins(g2, -L / 2 + 0.6, -L / 2 + bl - 0.6, fl + 1.1, fl + 1.9, W, Math.max(2, Math.round(bl / 2.2)));
    if (v.hatch) hatch(g2, -L / 2 + bl * 0.15, -L / 2 + bl * 0.85, W, fl + 0.9, v.awn);
    if (v.louvre) for (var lv = 0; lv < 8; lv++) [-1, 1].forEach(function (sd) { box(g2, 0.06, h - fl - 0.6, 0.02, M('#5a4a00'), -L / 2 + 0.6 + lv * (bl - 1.2) / 7, fl + 0.3, sd * (W / 2 + 0.01)); });
    if (v.horse) [-1, 1].forEach(function (sd) { for (var hw = 0; hw < 3; hw++) box(g2, 0.7, 0.5, 0.03, GLASS, -L / 2 + 1 + hw * 1.2, fl + 1.4, sd * (W / 2 + 0.01)); box(g2, bl * 0.4, 0.05, 0.03, M('#8a6a45'), -L / 2 + bl * 0.3, fl + 0.2, sd * (W / 2 + 0.02)); });
    box(g2, 0.04, h - fl - 0.1, W * 0.96, M('#cfd3d6'), -L / 2 - 0.01, fl + 0.05, 0);
    wheels(g2, L / 2 - cl * 0.55, W, 0.5); wheels(g2, -L / 2 + Math.min(2.2, bl * 0.28), W, 0.5, true); if (L > 9) wheels(g2, -L / 2 + Math.min(3.5, bl * 0.42), W, 0.5, true);
  } else if (s === 'artic') {
    var tcl = 2.3, tl = 5.9, trL = L - tcl - 0.9, fl2 = 1.25;
    cabOver(g2, L / 2 - tcl, tcl, 3.4, W, v.cabC || '#b3261e');
    profile(g2, [[0, 3.4], [tcl - 0.35, 3.4], [tcl - 0.6, 3.9], [0, 3.95]], W * 0.9, M(v.cabC || '#b3261e', { roughness: 0.45 }), L / 2 - tcl, 0);
    box(g2, tl, 0.3, W * 0.7, M('#222'), L / 2 - tl / 2, 0.6, 0);
    box(g2, 0.3, 0.6, 0.5, M('#444', { metalness: 0.5 }), L / 2 - tcl - 0.4, 0.9, W * 0.3);
    box(g2, trL, h - fl2, W, body, -L / 2 + trL / 2, fl2, 0);
    box(g2, trL, 0.25, W * 0.6, M('#333'), -L / 2 + trL / 2, fl2 - 0.25, 0);
    if (v.stripe) stripe(g2, -L / 2 + 0.3, -L / 2 + trL - 0.3, fl2 + 0.4, W, v.stripe);
    if (v.win) sideWins(g2, -L / 2 + 0.8, -L / 2 + trL - 0.8, fl2 + 1.2, fl2 + 2, W, Math.round(trL / 2.4));
    [-1, 1].forEach(function (sd) { box(g2, 0.12, fl2 - 0.1, 0.12, M('#555'), -L / 2 + trL - 2.4, 0, sd * (W / 2 - 0.4)); });
    box(g2, 0.04, h - fl2 - 0.1, W * 0.96, M('#cfd3d6'), -L / 2 - 0.01, fl2 + 0.05, 0);
    wheels(g2, L / 2 - 1.2, W, 0.5); wheels(g2, L / 2 - 4.7, W, 0.5, true);
    [1.3, 2.65, 4].forEach(function (x) { wheels(g2, -L / 2 + x, W, 0.5, true); });
  } else if (s === 'van' || s === 'luton') {
    var vcl = 2.4, rh = s === 'luton' ? 2.5 : Math.min(2.7, h);
    vanFront(g2, L / 2 - vcl, vcl, rh, W * 0.95, s === 'luton' ? '#ffffff' : v.c);
    if (s === 'luton') {
      var bl3 = L - vcl + 0.2; box(g2, bl3, h - 0.45, W, body, -L / 2 + bl3 / 2, 0.45, 0);
      profile(g2, [[0, rh], [1.3, rh + 0.05], [1.5, rh + 0.35], [1.4, h - 0.05], [0, h]], W, body, L / 2 - vcl + 0.2, 0);
      sideWins(g2, -L / 2 + 0.6, -L / 2 + bl3 - 0.6, 1.4, 2.1, W, 3); box(g2, 0.6, 0.3, W * 0.6, GLASS, L / 2 - vcl + 1.3, h - 0.45, 0);
    } else {
      var bl4 = L - vcl + 0.4; box(g2, bl4, rh - 0.4, W * 0.95, body, -L / 2 + bl4 / 2, 0.4, 0);
      if (v.win) sideWins(g2, -L / 2 + 0.4, -L / 2 + bl4 - 0.4, 1.4, 2.1, W * 0.95, 3);
      if (v.hatch) hatch(g2, -L / 2 + 0.4, -L / 2 + bl4 - 0.3, W * 0.95, 1.2, v.awn);
      if (h > rh + 0.1) box(g2, bl4 * 0.8, h - rh, W * 0.8, body, -L / 2 + bl4 * 0.45, rh, 0);
    }
    if (v.stripe) stripe(g2, -L / 2 + 0.2, L / 2 - 0.3, 0.9, W * 0.95, v.stripe);
    wheels(g2, L / 2 - 0.9, W * 0.95, 0.36); wheels(g2, -L / 2 + Math.min(1.4, L * 0.25), W * 0.95, 0.36, s === 'luton');
  } else if (s === 'bus') {
    var bp = M(v.c, { roughness: 0.45 });
    profile(g2, [[0, 0.35], [L, 0.35], [L, h - 0.25], [L - 0.2, h], [0.2, h], [0, h - 0.2]], W, bp, -L / 2, 0);
    [[1.1, 1.9], [2.6, 3.7]].forEach(function (r) { sideWins(g2, -L / 2 + 0.4, L / 2 - 0.6, r[0], r[1], W, Math.round(L / 1.6)); box(g2, 0.04, r[1] - r[0], W * 0.85, GLASS, L / 2 + 0.01, r[0], 0); });
    box(g2, L, 0.12, 0.02, M('#7a2d2d'), 0, 2.25, W / 2 + 0.02); box(g2, L, 0.12, 0.02, M('#7a2d2d'), 0, 2.25, -W / 2 - 0.02);
    wheels(g2, L / 2 - 2.3, W, 0.5); wheels(g2, -L / 2 + 2.8, W, 0.5, true);
  } else if (s === 'rv') {
    var rp2 = M(v.c, { roughness: 0.4 });
    profile(g2, [[0, 0.5], [L, 0.5], [L + 0.05, 1.2], [L - 0.15, 1.5], [L - 0.35, h - 0.35], [L - 0.6, h], [0.1, h], [0, h - 0.1]], W, rp2, -L / 2, 0);
    var rws = box(g2, 0.04, h - 1.95, W * 0.9, GLASS, L / 2 - 0.3, 1.55, 0); rws.rotation.z = 0.12;
    box(g2, 0.06, 0.4, W * 0.75, M('#9aa0a6', { metalness: 0.6 }), L / 2 + 0.05, 0.7, 0);
    sideWins(g2, -L / 2 + 0.8, L / 2 - 1.6, 1.6, 2.3, W, 4);
    [-1, 1].forEach(function (sd) { var sw = box(g2, L * 0.7, 0.25, 0.02, M(v.stripe), -L * 0.1, 1.15, sd * (W / 2 + 0.015)); sw.rotation.x = 0; if (!v.euro) box(g2, L * 0.5, 0.12, 0.02, M('#c9a227'), -L * 0.15, 1.45, sd * (W / 2 + 0.015)); });
    box(g2, L * 0.25, 0.35, W * 0.6, M('#e8e5de'), -L * 0.15, h, 0);
    if (v.euro) { wheels(g2, L / 2 - 1.2, W, 0.38); wheels(g2, -L / 2 + L * 0.3, W, 0.38); } else { wheels(g2, L / 2 - 1.4, W, 0.5); wheels(g2, -L / 2 + L * 0.28, W, 0.5, true); }
    if (SL) slideOuts(g2, -L * 0.1, L * 0.25, -L / 2 + 0.6, -L / 2 + 0.6 + L * 0.22, 0.85, h - 0.45, W, SL, rp2, v.stripe);
  } else if (s === 'fifth') {
    var pk = M(v.truck || '#333', { roughness: 0.35, metalness: 0.35 }), pkL = 5.9, pkW = Math.min(2.05, W * 0.85), x0 = v.noTruck ? L / 2 - 2.2 : L / 2 - pkL;
    if (!v.noTruck) {
    profile(g2, [[0, 0.55], [pkL, 0.55], [pkL, 1.05], [pkL - 0.1, 1.3], [pkL - 1.6, 1.38], [pkL - 2.2, 1.95], [pkL - 3.3, 1.95], [pkL - 3.4, 1.3], [0, 1.3]], pkW, pk, x0, 0);
    var pws = box(g2, 0.04, 0.5, pkW * 0.85, GLASS, x0 + pkL - 1.9, 1.4, 0); pws.rotation.z = 0.8;
    [-1, 1].forEach(function (sd) { box(g2, 0.9, 0.45, 0.03, GLASS, x0 + pkL - 2.75, 1.42, sd * (pkW / 2 + 0.01)); box(g2, 0.05, 0.15, 0.35, B('#fff6d8'), x0 + pkL + 0.01, 0.95, sd * (pkW / 2 - 0.3)); });
    box(g2, 0.06, 0.35, pkW * 0.55, M('#9aa0a6', { metalness: 0.7 }), x0 + pkL + 0.01, 0.75, 0);
    wheels(g2, x0 + pkL - 0.95, pkW, 0.42); wheels(g2, x0 + 1.2, pkW, 0.42, true);
    }
    var trF = x0 + 2.2, trL2 = trF + L / 2, noseL = 2.2, mainL = trL2 - noseL, cp = M(v.c, { roughness: 0.45 });
    box(g2, mainL, h - 1, W, cp, -L / 2 + mainL / 2, 1, 0);
    profile(g2, [[0, 1.9], [noseL - 0.3, 1.9], [noseL, 2.3], [noseL, h - 0.2], [noseL - 0.3, h], [0, h]], W, cp, -L / 2 + mainL, 0);
    if (v.noTruck) [-1, 1].forEach(function (sd) { box(g2, 0.12, 1.9, 0.12, M('#666', { metalness: 0.5 }), trF - 0.5, 0, sd * (W / 2 - 0.3)); box(g2, 0.35, 0.05, 0.35, M('#444'), trF - 0.5, 0, sd * (W / 2 - 0.3)); }); else     box(g2, 0.4, 0.6, 0.3, M('#333'), trF - 0.2, 1.3, 0);
    [-1, 1].forEach(function (sd) { box(g2, mainL * 0.8, 0.3, 0.02, M(v.stripe), -L / 2 + mainL * 0.5, 1.5, sd * (W / 2 + 0.015)); box(g2, noseL * 0.8, 0.25, 0.02, M(v.stripe), -L / 2 + mainL + noseL * 0.45, 2.6, sd * (W / 2 + 0.015)); });
    sideWins(g2, -L / 2 + 0.8, -L / 2 + mainL - 0.5, 1.9, 2.6, W, 3); box(g2, 0.04, 0.5, W * 0.6, GLASS, -L / 2 + mainL + noseL + 0.01, 2.8, 0);
    box(g2, mainL * 0.35, 0.03, 0.03, M('#888'), -L / 2 + mainL * 0.4, 2.6, W / 2 + 0.6);
    wheels(g2, -L / 2 + mainL * 0.45, W, 0.38); wheels(g2, -L / 2 + mainL * 0.45 + 0.95, W, 0.38);
    if (SL) slideOuts(g2, -L / 2 + mainL * 0.15, -L / 2 + mainL * 0.4, -L / 2 + mainL * 0.62, -L / 2 + mainL * 0.88, 1.1, h - 0.4, W, SL, cp, v.stripe);
  } else if (s === 'car') {
    var cp2 = M(v.c, { roughness: 0.35, metalness: 0.4 }), cw = Math.min(1.85, W * 0.95);
    profile(g2, [[0, 0.3], [L, 0.3], [L, 0.75], [L - 0.9, 0.9], [L - 1.6, 1.45], [1.1, 1.48], [0.3, 1.0], [0, 0.85]], cw, cp2, -L / 2, 0);
    [-1, 1].forEach(function (sd) { box(g2, L * 0.4, 0.38, 0.02, GLASS, -0.05, 1.0, sd * (cw / 2 + 0.01)); });
    wheels(g2, L / 2 - 0.9, cw, 0.33); wheels(g2, -L / 2 + 0.9, cw, 0.33);
  } else {
    // towed trailer
    var tb = L - 1.2;
    if (v.tank) { var tk = new T.Mesh(GEO.cyl, body); tk.scale.set(W * 0.42, tb, W * 0.42); tk.rotation.z = Math.PI / 2; tk.position.set(-L / 2 + tb / 2, 1.1 + W * 0.05, 0); g2.add(tk); box(g2, tb, 0.15, W * 0.7, M('#333'), -L / 2 + tb / 2, 0.45, 0); }
    else box(g2, tb, h - 0.45, W, body, -L / 2 + tb / 2, 0.45, 0);
    if (v.stripe) stripe(g2, -L / 2 + 0.2, -L / 2 + tb - 0.2, 0.9, W, v.stripe);
    if (v.win) sideWins(g2, -L / 2 + 0.5, -L / 2 + tb - 0.5, 1.5, 2.2, W, Math.max(2, Math.round(tb / 2.2)));
    if (v.hatch) hatch(g2, -L / 2 + tb * 0.12, -L / 2 + tb * 0.88, W, 1.1, v.awn);
    if (v.atm) box(g2, 0.6, 0.8, 0.05, M('#111'), -L / 2 + tb / 2, 1.1, W / 2 + 0.01);
    var dr1 = box(g2, 1.35, 0.1, 0.1, M('#555'), L / 2 - 0.7, 0.55, 0.3); dr1.rotation.y = 0.35; var dr2 = box(g2, 1.35, 0.1, 0.1, M('#555'), L / 2 - 0.7, 0.55, -0.3); dr2.rotation.y = -0.35;
    cyl(g2, 0.1, 0.5, M('#333'), L / 2 - 0.25, 0, 0);
    wheels(g2, -L / 2 + tb / 2, W, 0.33); if (tb > 5) wheels(g2, -L / 2 + tb / 2 + 0.9, W, 0.33);
  }
  return g2;
}

function build(SP, it, rp) {
  var type = it.type, w = Number(it.w) || 1, d = Number(it.d) || 1, ty = SP.TYPES[type] || SP.TYPES.other, g = new T.Group(), mn = Math.min(w, d), L = Math.max(w, d), alongX = w >= d;
  var m = SP.meta(type);
  if (m.flat) return null;
  if (type === 'stage') {
    shadow(g, w, d);
    box(g, w, 1.2, d, M('#2b2b30'));
    texBox(g, SP, 'stage', w, 0.04, d, '#1d1d20', 1.2, 0, 0, rp);
    var H = Math.min(9, 4.5 + w * 0.25), tr = M('#c8ccd0', { metalness: 0.8, roughness: 0.35 });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { box(g, 0.3, H, 0.3, tr, s[0] * (w / 2 - 0.15), 0, s[1] * (d / 2 - 0.15)); });
    [-1, 0, 1].forEach(function (s) { box(g, w, 0.3, 0.3, tr, 0, H - 0.3, s * (d / 2 - 0.15)); });
    [-1, 1].forEach(function (s) { box(g, 0.3, 0.3, d, tr, s * (w / 2 - 0.15), H - 0.3, 0); });
    var roof = box(g, w + 1.2, 0.15, d + 0.8, M('#1a1a1d', { roughness: 0.6 }), 0, H + 0.4, -0.2); roof.rotation.x = -0.06;
    box(g, w - 0.6, H - 1.6, 0.08, M('#141416'), 0, 1.2, -d / 2 + 0.2);
    box(g, Math.min(3, w * 0.3), 0.5, Math.min(2.4, d * 0.3), M('#3d3d44'), 0, 1.2, -d * 0.18);
    var n = Math.max(3, Math.round(w / 1.6));
    [d / 2 - 0.15, 0].forEach(function (lz, row) {
      for (var i = 0; i < n; i++) {
        var lx = -w / 2 + 0.8 + i * (w - 1.6) / (n - 1), c = LIGHTS[(i + row) % 4];
        var lamp = cyl(g, 0.24, 0.5, M('#111', { metalness: 0.6 }), lx, H - 0.85, lz, 0.18); lamp.rotation.x = 0.5;
        var beam = new T.Mesh(new T.ConeGeometry(0.9, H - 2.2, 20, 1, true), B(c, { transparent: true, opacity: 0.12, depthWrite: false, side: T.DoubleSide }));
        beam.position.set(lx, (H - 1.1 + 1.3) / 2, lz - 0.6); beam.rotation.x = 0.22; g.add(beam);
        var pool = new T.Mesh(new T.CircleGeometry(1, 24), B(c, { transparent: true, opacity: 0.35, depthWrite: false })); pool.rotation.x = -Math.PI / 2; pool.position.set(lx, 1.26, lz - 1.1); g.add(pool);
      }
    });
    [-1, 1].forEach(function (s) { var sx = s * (w / 2 - 0.7); box(g, 1.1, 1.3, 1.1, M('#141414'), sx, 1.2, d / 2 - 0.8); box(g, 1.1, 1.3, 1.1, M('#191919'), sx, 2.5, d / 2 - 0.8); });
    for (var mo = 0; mo < 4; mo++) { var mb = box(g, 0.7, 0.35, 0.5, M('#2a2a2e'), -w * 0.3 + mo * w * 0.2, 1.2, d / 2 - 0.4); mb.rotation.x = -0.4; }
  } else if (type === 'marquee' || type === 'bar' || type === 'stretch') {
    shadow(g, w, d);
    if (type === 'stretch') {
      var fab = M('#e9dcc4', { roughness: 0.95, side: T.DoubleSide });
      var sg = new T.PlaneGeometry(w, d, 24, 16), pos = sg.attributes.position, peaks = [[-0.25, -0.15], [0.25, -0.15], [0, 0.25]];
      for (var v = 0; v < pos.count; v++) { var px = pos.getX(v) / w, py = pos.getY(v) / d, hgt = 2.4; peaks.forEach(function (pk) { var dd = Math.hypot(px - pk[0], py - pk[1]); hgt = Math.max(hgt, 6 - dd * 14); }); var edge = Math.min(0.5 - Math.abs(px), 0.5 - Math.abs(py)); if (edge < 0.04) hgt = 0.3 + edge * 50; pos.setZ(v, hgt); }
      sg.computeVertexNormals(); var sm = new T.Mesh(sg, fab); sm.rotation.x = -Math.PI / 2; g.add(sm);
      peaks.forEach(function (pk) { cyl(g, 0.06, 6, M('#8a6a45'), pk[0] * w, 0, -pk[1] * d); });
    } else {
      var wall = M('#f3f5f6', { roughness: 0.9 });
      box(g, w, 2.4, d, wall);
      var span = alongX ? d : w, rise = Math.min(2.2, span * 0.28);
      gable(g, L + 0.2, span + 0.2, rise, M('#ffffff', { roughness: 0.85 }), 2.4, alongX);
      var bays = Math.max(1, Math.round(L / 3)), win = M('#9fb7c2', { roughness: 0.2 }), leg = M('#c0c6c8', { metalness: 0.6 });
      for (var b2 = 0; b2 <= bays; b2++) { var t = -L / 2 + b2 * L / bays; if (alongX) { box(g, 0.08, 2.4, 0.08, leg, t, 0, d / 2 + 0.02); box(g, 0.08, 2.4, 0.08, leg, t, 0, -d / 2 - 0.02); } else { box(g, 0.08, 2.4, 0.08, leg, w / 2 + 0.02, 0, t); box(g, 0.08, 2.4, 0.08, leg, -w / 2 - 0.02, 0, t); } }
      if (type === 'marquee') for (var b3 = 0; b3 < bays; b3++) { var t2 = -L / 2 + (b3 + 0.5) * L / bays; if (alongX) box(g, 1.8, 0.7, 0.03, win, t2, 1.1, d / 2 + 0.03); else box(g, 0.03, 0.7, 1.8, win, w / 2 + 0.03, 1.1, t2); }
      if (type === 'bar') {
        box(g, w * 0.85, 1.1, 0.6, M('#7a4b2a'), 0, 0, d / 2 + 0.35);
        var n2 = Math.max(4, Math.round(w / 0.7)); for (var a = 0; a < n2; a++) { var aw = box(g, w / n2, 0.05, 1.1, M(a % 2 ? '#1E5A43' : '#ffffff'), -w / 2 + (a + 0.5) * w / n2, 2.3, d / 2 + 0.5); aw.rotation.x = 0.3; }
        for (var bo = 0; bo < 7; bo++) cyl(g, 0.05, 0.3, M(['#2d6b2d', '#7a2d2d', '#c9a227'][bo % 3], { roughness: 0.2 }), -w * 0.35 + bo * w * 0.12, 1.1, d / 2 + 0.35);
      }
    }
  } else if (/^(pagoda|gazebo|trader|firstaid|welfare|info|ticket|security|tent|pa|video)$/.test(type)) {
    shadow(g, w, d);
    var open = /^(gazebo|trader|pa)$/.test(type), wallH = type === 'tent' ? 0.25 : open ? 2.2 : 2.3;
    var col = { info: '#1E5A43', ticket: '#1E5A43', security: '#37474F', tent: '#e2a13b', trader: '#fbfbf8', pa: '#2b2b2e', video: '#1E5A43' }[type] || '#ffffff';
    if (open) { [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { cyl(g, 0.04, wallH, M('#999', { metalness: 0.7 }), s[0] * (w / 2 - 0.05), 0, s[1] * (d / 2 - 0.05)); }); }
    else box(g, w, wallH, d, M(type === 'firstaid' || type === 'welfare' ? '#ffffff' : col, { roughness: 0.9 }));
    pyr(g, w + 0.1, type === 'tent' ? 1.6 : Math.min(2, mn * 0.4), d + 0.1, M(col === '#2b2b2e' ? '#ffffff' : col, { roughness: 0.85 }), wallH);
    if (type === 'firstaid' || type === 'welfare') { var gc = M(type === 'firstaid' ? '#2c9b4a' : '#00796B'); box(g, w + 0.04, 0.22, d + 0.04, gc, 0, wallH - 0.25); if (type === 'firstaid') { box(g, 0.35, 1.1, 0.04, gc, 0, 0.9, d / 2 + 0.02); box(g, 1.1, 0.35, 0.04, gc, 0, 1.28, d / 2 + 0.02); } }
    if (type === 'trader' || type === 'gazebo') { box(g, w - 0.4, 0.8, 0.6, M('#8a6a45'), 0, 0, d / 2 - 0.5); for (var gi = 0; gi < 4; gi++) box(g, 0.28, 0.22, 0.28, M(['#e2a13b', '#c0392b', '#7aa64e', '#3d7fd9'][gi]), -w * 0.3 + gi * w * 0.2, 0.8, d / 2 - 0.5); }
    if (type === 'trader') { var na = 6; for (var tz = 0; tz < na; tz++) { var ta = box(g, w / na, 0.05, 0.8, M(tz % 2 ? '#fbfbf8' : '#d7261e'), -w / 2 + (tz + 0.5) * w / na, 2.05, d / 2 + 0.3); ta.rotation.x = 0.3; } }
    if (type === 'pa') { box(g, w * 0.8, 0.9, d * 0.5, M('#2b2b2e'), 0, 0, 0); box(g, w * 0.7, 0.05, d * 0.4, M('#e0892e'), 0, 0.9, 0); }
  } else if (VEH[type]) {
    shadow(g, w, d); var vg = vehicle(SP, it, type, L, alongX ? d : w, rp); if (!alongX) vg.rotation.y = -Math.PI / 2; g.add(vg);
  } else if (type === 'toilets' || type === 'accessible') {
    var nu = type === 'accessible' ? 1 : (Number(it.units) > 0 ? Math.round(Number(it.units)) : Math.max(1, Math.round(L / 1.25))), uw = L / nu, g3 = new T.Group(); g.add(g3); if (!alongX) g3.rotation.y = -Math.PI / 2;
    shadow(g, w, d); var Dd = alongX ? d : w;
    for (var u = 0; u < nu; u++) { var ux = -L / 2 + (u + 0.5) * uw, c3 = type === 'accessible' ? '#255b8a' : '#3a8bd1'; box(g3, uw - 0.06, 2.3, Dd - 0.1, M(c3, { roughness: 0.6 }), ux, 0, 0); box(g3, uw, 0.12, Dd, M('#e8eef2'), ux, 2.3, 0); box(g3, uw * 0.75, 1.9, 0.04, M('#2f78b8'), ux, 0.1, Dd / 2 - 0.03); cyl(g3, 0.07, 0.35, M('#333'), ux + uw * 0.25, 2.4, -Dd * 0.25); }
  } else if (type === 'generator') {
    shadow(g, w, d); box(g, w, 0.12, d, M('#333')); box(g, w - 0.05, Math.min(1.8, 1 + mn * 0.4), d - 0.05, M('#e3b51c', { roughness: 0.5 }), 0, 0.12);
    var eh = Math.min(1.8, 1 + mn * 0.4) + 0.12; cyl(g, 0.09, 0.5, M('#444', { metalness: 0.7 }), w * 0.35, eh, 0);
    for (var sp = 0; sp < 4; sp++) { var puff = new T.Mesh(GEO.sph, B('#bbbbbb', { transparent: true, opacity: 0.18 - sp * 0.035, depthWrite: false })); puff.scale.setScalar(0.25 + sp * 0.13); puff.position.set(w * 0.35 + sp * 0.15, eh + 0.8 + sp * 0.45, 0); g.add(puff); }
  } else if (type === 'light') {
    shadow(g, w, d); box(g, w * 0.9, 1.2, d * 0.8, M('#f0f0f0', { roughness: 0.5 }), 0, 0.3); [-1, 1].forEach(function (s) { wheel(g, 0, s * d * 0.42, 0.3); });
    cyl(g, 0.08, 8, M('#bbb', { metalness: 0.8 }), w * 0.2, 1.5, 0, 0.06); box(g, 1.4, 0.5, 0.2, M('#222'), w * 0.2, 9.3, 0);
    for (var lt = 0; lt < 4; lt++) box(g, 0.28, 0.22, 0.04, B('#fff7d0'), w * 0.2 - 0.45 + lt * 0.3, 9.44, 0.11);
  } else if (type === 'bigscreen') {
    shadow(g, w, d); box(g, w * 0.3, 1.4, d * 0.9, M('#555'), 0, 0); cyl(g, 0.12, 2.5, M('#888', { metalness: 0.7 }), 0, 1.4, 0);
    box(g, w, w * 0.56, 0.3, M('#111'), 0, 3.6, 0); var scr = box(g, w * 0.94, w * 0.5, 0.02, new T.MeshBasicMaterial({ color: '#4a6fd0' }), 0, 3.6 + w * 0.03, 0.16);
  } else if (/^(ride|kidsride|waltzer)$/.test(type)) {
    shadow(g, w, d, true); var R = mn / 2;
    cyl(g, R, 0.6, M('#5a5f66'), 0, 0, 0); cyl(g, R * 0.95, 0.15, M(ty.c, { roughness: 0.5 }), 0, 0.6, 0);
    var nc = type === 'kidsride' ? 6 : 8; for (var k = 0; k < nc; k++) { var an = k * 2 * Math.PI / nc; box(g, R * 0.25, 0.7, R * 0.25, M(['#f2c230', '#3d7fd9', '#2c9b4a', '#e94b3c'][k % 4], { roughness: 0.4 }), Math.cos(an) * R * 0.65, 0.75, Math.sin(an) * R * 0.65); }
    cyl(g, 0.25, 3.5, M('#c0c6cc', { metalness: 0.6 }), 0, 0.7, 0);
    var ch = Math.min(2.4, R * 0.5), can = new T.Mesh(new T.ConeGeometry(R * 1.02, ch, 24), M(ty.c, { roughness: 0.6 })); can.position.y = 4.2 + ch / 2; g.add(can);
    var cap = new T.Mesh(new T.ConeGeometry(R * 0.3, ch * 0.4, 16), M('#ffffff')); cap.position.y = 4.2 + ch + 0.1; g.add(cap);
    for (var fl = 0; fl < 12; fl++) { var fa = fl * Math.PI / 6; box(g, 0.08, 0.5, R * 0.3, M(fl % 2 ? '#ffffff' : '#f2c230'), Math.cos(fa) * R, 3.75, Math.sin(fa) * R).rotation.y = -fa; }
  } else if (type === 'helter') {
    shadow(g, w, d, true); var R2 = mn / 2;
    cyl(g, R2 * 0.55, 10, M('#f7f4ee'), 0, 0, 0, R2 * 0.3);
    for (var hs = 0; hs < 40; hs++) { var ha = hs * 0.45, hy = 0.5 + hs * 0.23, hr = R2 * (0.95 - hs * 0.009); box(g, 0.9, 0.12, 0.7, M(hs % 2 ? '#e94b3c' : '#f2c230'), Math.cos(ha) * hr, hy, Math.sin(ha) * hr).rotation.y = -ha; }
    var hc = new T.Mesh(new T.ConeGeometry(R2 * 0.45, 2.5, 16), M('#e94b3c')); hc.position.y = 11.2; g.add(hc);
  } else if (type === 'ferris') {
    shadow(g, w, d); var Rw = Math.min(w * 0.45, 14), g4 = new T.Group(); g.add(g4); if (!alongX) g4.rotation.y = -Math.PI / 2;
    var fm = M('#c0c6cc', { metalness: 0.7, roughness: 0.4 });
    [-1, 1].forEach(function (s) { [-1, 1].forEach(function (s2) { var lg = box(g4, 0.3, Rw + 2, 0.3, fm, s2 * Rw * 0.35, 0, s * 1.2); lg.rotation.z = s2 * 0.32; lg.position.y = (Rw + 2) / 2; }); });
    var ring = new T.Mesh(new T.TorusGeometry(Rw, 0.18, 8, 48), fm); ring.position.y = Rw + 1.8; g4.add(ring);
    for (var sp2 = 0; sp2 < 16; sp2++) { var an2 = sp2 * Math.PI / 8; var spk = box(g4, 0.06, Rw, 0.06, fm, 0, 0, 0); spk.position.set(Math.cos(an2) * Rw / 2, Rw + 1.8 + Math.sin(an2) * Rw / 2, 0); spk.rotation.z = an2 - Math.PI / 2; var gd = box(g4, 0.9, 1, 1.1, M(['#e94b3c', '#f2c230', '#3d7fd9'][sp2 % 3]), Math.cos(an2) * Rw, Rw + 1.8 + Math.sin(an2) * Rw - 1.1, 0); }
    box(g4, L * 0.9, 0.4, Math.min(d, w) * 0.8, M('#5a5f66'), 0, 0, 0);
  } else if (type === 'dodgems') {
    shadow(g, w, d); box(g, w, 0.3, d, M('#5a5f66')); box(g, w - 1, 0.02, d - 1, M('#9aa0a6', { metalness: 0.4, roughness: 0.4 }), 0, 0.3);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { box(g, 0.25, 4, 0.25, M('#c0c6cc', { metalness: 0.6 }), s[0] * (w / 2 - 0.2), 0.3, s[1] * (d / 2 - 0.2)); });
    var fas = M('#e94b3c', { roughness: 0.5 }); box(g, w, 0.6, 0.15, fas, 0, 4.3, d / 2 - 0.08); box(g, w, 0.6, 0.15, fas, 0, 4.3, -d / 2 + 0.08); box(g, 0.15, 0.6, d, fas, w / 2 - 0.08, 4.3, 0); box(g, 0.15, 0.6, d, fas, -w / 2 + 0.08, 4.3, 0);
    for (var gr = 1; gr < 5; gr++) box(g, w, 0.04, 0.04, M('#444'), 0, 4.5, -d / 2 + gr * d / 5);
    for (var bl = 0; bl < Math.round(w / 1.2); bl++) box(g, 0.25, 0.25, 0.04, B(['#ffd36b', '#ffffff'][bl % 2]), -w / 2 + 0.6 + bl * 1.2, 4.45, d / 2 + 0.01);
    for (var cr = 0; cr < 10; cr++) box(g, 2, 0.6, 1.2, M(['#e94b3c', '#f2c230', '#3d7fd9', '#2c9b4a', '#d86a9a'][cr % 5], { roughness: 0.4 }), -w * 0.35 + ((cr * 0.37) % 0.75) * w, 0.32, -d * 0.33 + ((cr * 0.53) % 0.65) * d);
  } else if (type === 'bouncy' || type === 'inflatable' || type === 'slide' || type === 'assault') {
    shadow(g, w, d);
    if (type === 'slide') { var sl = new T.Shape(); sl.moveTo(-L / 2, 0); sl.lineTo(-L / 2, 6); sl.lineTo(-L / 2 + L * 0.25, 6); sl.lineTo(L / 2, 0.5); sl.lineTo(L / 2, 0); var sg2 = new T.ExtrudeGeometry(sl, { depth: mn, bevelEnabled: false }); sg2.translate(0, 0, -mn / 2); var smsh = new T.Mesh(sg2, M('#3D7FD9', { roughness: 0.5 })); if (!alongX) smsh.rotation.y = -Math.PI / 2; g.add(smsh); }
    else if (type === 'assault') { box(g, w, 1.2, d, M('#F2A93B', { roughness: 0.5 })); for (var ao = 0; ao < 5; ao++) cyl(g, mn * 0.25, 2.4, M(ao % 2 ? '#e94b3c' : '#3d7fd9', { roughness: 0.5 }), alongX ? -w / 2 + (ao + 0.5) * w / 5 : 0, 0, alongX ? 0 : -d / 2 + (ao + 0.5) * d / 5); }
    else { box(g, w, 0.6, d, M('#e94b3c', { roughness: 0.5 })); box(g, w * 0.7, 2.6, 0.4, M('#3d7fd9', { roughness: 0.5 }), 0, 0.6, -d / 2 + 0.3); [-1, 1].forEach(function (s) { box(g, 0.4, 2.6, d * 0.7, M('#3d7fd9', { roughness: 0.5 }), s * (w / 2 - 0.3), 0.6, -d * 0.05); }); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { var tw = cyl(g, mn * 0.12, 3.6, M('#F2C230', { roughness: 0.5 }), s[0] * (w / 2 - mn * 0.1), 0, s[1] * (d / 2 - mn * 0.1)); var tp = new T.Mesh(new T.ConeGeometry(mn * 0.13, 0.9, 12), M('#e94b3c')); tp.position.set(tw.position.x, 4.05, tw.position.z); g.add(tp); }); }
  } else if (type === 'grandstand') {
    shadow(g, w, d); var g5 = new T.Group(); g.add(g5); if (!alongX) g5.rotation.y = -Math.PI / 2; var Dg = alongX ? d : w, rows = Math.max(3, Math.round(Dg / 0.8)), rd = Dg / rows;
    for (var r = 0; r < rows; r++) { box(g5, L, 0.45 * (r + 1), rd, M(r % 2 ? '#b8bec3' : '#cfd4d8'), 0, 0, Dg / 2 - (r + 0.5) * rd); box(g5, L * 0.98, 0.12, rd * 0.45, M('#1E5A43', { roughness: 0.5 }), 0, 0.45 * (r + 1), Dg / 2 - (r + 0.5) * rd - rd * 0.15); }
    box(g5, L, 1, 0.05, M('#9aa3a8', { metalness: 0.6 }), 0, 0.45 * rows, -Dg / 2);
  } else if (type === 'viewing') {
    shadow(g, w, d); box(g, w, 0.9, d, M('#9c7b55')); var rl = M('#555', { metalness: 0.6 });
    box(g, w, 1, 0.05, rl, 0, 0.9, -d / 2); box(g, 0.05, 1, d, rl, -w / 2, 0.9, 0); box(g, 0.05, 1, d, rl, w / 2, 0.9, 0);
    var rp2 = box(g, w * 0.3, 0.05, 5, M('#8a6a45'), 0, 0.42, d / 2 + 2.4); rp2.rotation.x = 0.18;
  } else if (type === 'jump') {
    var g6 = new T.Group(); g.add(g6); if (!alongX) g6.rotation.y = -Math.PI / 2;
    [-1, 1].forEach(function (s) { box(g6, 0.25, 1.6, 0.25, M('#2f6db5'), s * (L / 2 - 0.15), 0, 0); });
    for (var jp = 0; jp < 3; jp++) { var pole = new T.Mesh(GEO.cyl, M(jp % 2 ? '#ffffff' : '#e94b3c')); pole.scale.set(0.06, L - 0.3, 0.06); pole.rotation.z = Math.PI / 2; pole.position.y = 0.45 + jp * 0.4; g6.add(pole); }
  } else if (type === 'bonfire') {
    shadow(g, w, d, true); var R3 = mn / 2;
    for (var bf = 0; bf < 18; bf++) { var an3 = bf * 0.349, lg2 = cyl(g, 0.12, (Number(it.h) || 3) * 1.15, M(bf % 2 ? '#6b4423' : '#8a5a2e'), Math.cos(an3) * R3 * 0.45, 0, Math.sin(an3) * R3 * 0.45); lg2.rotation.set(Math.sin(an3) * 0.45, 0, -Math.cos(an3) * 0.45); }
  } else if (type === 'picnic') {
    var g7 = new T.Group(); g.add(g7); if (!alongX) g7.rotation.y = -Math.PI / 2; var Dp = alongX ? d : w, wood = M('#9C6B3C');
    box(g7, L, 0.06, Dp * 0.4, wood, 0, 0.72, 0); [-1, 1].forEach(function (s) { box(g7, L, 0.05, Dp * 0.16, M('#7A5230'), 0, 0.42, s * Dp * 0.38); box(g7, 0.08, 0.72, Dp * 0.9, wood, s * (L / 2 - 0.3), 0, 0); });
  } else if (type === 'bins' || type === 'waste') {
    var nb = type === 'bins' ? 1 : 3; for (var bi = 0; bi < nb; bi++) { var br = type === 'bins' ? mn * 0.4 : Math.min(w / 7, d / 2.3); cyl(g, br, 1.1, M(['#2f7d32', '#2E6DA4', '#5E6B66'][bi], { roughness: 0.5 }), nb > 1 ? -w / 3 + bi * w / 3 : 0, 0, 0, br * 0.9); }
  } else if (type === 'skip') {
    shadow(g, w, d); var sk = new T.Shape(); sk.moveTo(-L / 2 + 0.6, 0); sk.lineTo(L / 2 - 0.6, 0); sk.lineTo(L / 2, 1.8); sk.lineTo(-L / 2, 1.8); var skg = new T.ExtrudeGeometry(sk, { depth: mn, bevelEnabled: false }); skg.translate(0, 0, -mn / 2); var skm = new T.Mesh(skg, M('#C77A2A', { roughness: 0.6 })); if (!alongX) skm.rotation.y = -Math.PI / 2; g.add(skm);
  } else if (type === 'handwash' || type === 'water' || type === 'fire' || type === 'charging') {
    var hc2 = { handwash: '#e8eef2', water: '#3A9AD9', fire: '#E03C31', charging: '#2C9B4A' }[type], hh2 = { handwash: 1.1, water: 1, fire: 1.4, charging: 1.5 }[type];
    if (type === 'handwash') box(g, w, hh2, d, M(hc2)); else { box(g, Math.min(0.5, mn * 0.6), hh2, Math.min(0.4, mn * 0.5), M(hc2, { roughness: 0.5 })); if (type === 'charging') box(g, 0.3, 0.2, 0.05, B('#7CFC9A'), 0, 1.1, 0.21); if (type === 'fire') cyl(g, 0.12, 0.5, M('#c0392b', { roughness: 0.3 }), 0.35, 0, 0); }
  } else if (type === 'entrance' || type === 'exit') {
    var g8 = new T.Group(); g.add(g8); if (!alongX) g8.rotation.y = -Math.PI / 2; var cg = M(ty.c);
    [-1, 1].forEach(function (s) { box(g8, 0.3, 3.2, 0.3, M('#c0c6cc', { metalness: 0.6 }), s * (L / 2 - 0.15), 0, 0); }); box(g8, L, 0.6, 0.1, cg, 0, 3.2, 0);
  } else if (type === 'camera' || type === 'crane') {
    for (var tp2 = 0; tp2 < 3; tp2++) { var ta2 = tp2 * 2.094, lgc = box(g, 0.04, 1.6, 0.04, M('#555'), Math.cos(ta2) * 0.25, 0, Math.sin(ta2) * 0.25); lgc.rotation.set(Math.sin(ta2) * 0.2, 0, -Math.cos(ta2) * 0.2); }
    box(g, 0.35, 0.3, 0.5, M('#222'), 0, 1.55, 0);
    if (type === 'crane') { var arm = box(g, 0.15, 0.15, 5, M('#ccc', { metalness: 0.6 }), 0, 2.2, 1.5); arm.rotation.x = -0.3; box(g, 0.3, 0.3, 0.4, M('#c0392b'), 0, 3.4, 3.8); }
  } else if (type === 'dolly') {
    var g9 = new T.Group(); g.add(g9); if (!alongX) g9.rotation.y = -Math.PI / 2; var Dd2 = alongX ? d : w;
    [-1, 1].forEach(function (s) { box(g9, L, 0.06, 0.06, M('#9aa0a6', { metalness: 0.8 }), 0, 0.1, s * Dd2 * 0.3); }); for (var sl2 = 0; sl2 < L / 0.6; sl2++) box(g9, 0.1, 0.08, Dd2 * 0.8, M('#6e5233'), -L / 2 + sl2 * 0.6, 0, 0);
    box(g9, 1, 0.5, Dd2 * 0.7, M('#333'), -L * 0.2, 0.15, 0); box(g9, 0.35, 0.3, 0.5, M('#222'), -L * 0.2, 1.3, 0); cyl(g9, 0.06, 0.65, M('#555'), -L * 0.2, 0.65, 0);
  } else {
    // anything else: the old stacked shapes, with ShowReady's drawing on top
    shadow(g, w, d, !!(SP.ROUND && SP.ROUND[type]));
    var tiers = m.tiers || [[1, 2]];
    tiers.forEach(function (tr2, i) { var b0 = i ? tiers[i - 1][1] : 0, s3 = tr2[0], hh3 = tr2[1] - b0; if (i === 0) texBox(g, SP, type, w * s3, hh3, d * s3, ty.c, 0, 0, 0, rp); else box(g, w * Math.max(0.6, s3 + 0.45), hh3, d * s3, M('#ffffff'), 0, b0); });
  }
  return g;
}

export function create(SP, map, maplibregl) {
  var scene = new T.Scene(), camera = new T.Camera(), renderer = null, items = {}, origin = null, visible = true, mapRef = map;
  scene.add(new T.HemisphereLight('#ffffff', '#6a7a5a', 1.6));
  var sun = new T.DirectionalLight('#fff4e0', 2.2); sun.position.set(-0.5, 1, 0.6); scene.add(sun);
  var root = new T.Group(); scene.add(root);
  function rp() { mapRef.triggerRepaint(); }
  // Build 106: with hills switched on, stand each model on the ground (heights are relative to the map centre)
  function alt(lon, lat) { try { var v = mapRef.getTerrain && mapRef.getTerrain() ? mapRef.queryTerrainElevation([lon, lat]) : null; return v || 0; } catch (e) { return 0; } }
  var last = [];
  var layer = {
    id: 'models3d', type: 'custom', renderingMode: '3d',
    onAdd: function (m, gl) { renderer = new T.WebGLRenderer({ canvas: m.getCanvas(), context: gl, antialias: true }); renderer.autoClear = false; renderer.outputColorSpace = T.SRGBColorSpace; },
    render: function (gl, matrix) {
      if (!visible || !origin || !renderer) return;
      var mtx = matrix && matrix.defaultProjectionData ? matrix.defaultProjectionData.mainMatrix : matrix;
      var mc = maplibregl.MercatorCoordinate.fromLngLat([origin.lon, origin.lat], alt(origin.lon, origin.lat)), s = mc.meterInMercatorCoordinateUnits();
      var l = new T.Matrix4().makeTranslation(mc.x, mc.y, mc.z).scale(new T.Vector3(s, -s, s)).multiply(new T.Matrix4().makeRotationAxis(new T.Vector3(1, 0, 0), Math.PI / 2));
      camera.projectionMatrix = new T.Matrix4().fromArray(mtx).multiply(l);
      renderer.resetState(); renderer.render(scene, camera);
    }
  };
  function key(it) { return [it.type, it.w, it.d, it.units || '', it.h || ''].join('|'); }
  function sync(list) {
    list = (list || []).filter(function (it) { return isFinite(it.lat) && isFinite(it.lon); }); last = list;
    if (!origin && list.length) origin = { lat: list[0].lat, lon: list[0].lon };
    if (!origin) { var c = mapRef.getCenter(); origin = { lat: c.lat, lon: c.lng }; }
    var keep = {}, a0 = alt(origin.lon, origin.lat);
    list.forEach(function (it) {
      keep[it.id] = 1; var e = items[it.id], k = key(it);
      if (!e || e.k !== k) { if (e && e.g) root.remove(e.g); var g = build(SP, it, rp); items[it.id] = e = { k: k, g: g }; if (g) root.add(g); }
      if (!e.g) return;
      e.g.position.set((it.lon - origin.lon) * mLon(origin.lat), alt(it.lon, it.lat) - a0, -(it.lat - origin.lat) * MLAT);
      e.g.rotation.y = (Number(it.rot) || 0) * Math.PI / 180;
    });
    Object.keys(items).forEach(function (id) { if (!keep[id]) { if (items[id].g) root.remove(items[id].g); delete items[id]; } });
    rp();
  }
  return {
    layer: layer, sync: sync, resync: function () { sync(last); }, count: function () { return Object.keys(items).filter(function (k) { return items[k].g; }).length; },
    setVisible: function (v) { visible = v; rp(); }
  };
}
export var _build = build;
