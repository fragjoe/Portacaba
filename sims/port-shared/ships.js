// Portline's ships and harbour craft, shaped after real vessels and finished in the kit's toy language (matte paint,
// soft edges, few colours). Every hull is lofted from real proportions: a raked stem with flare and a bulbous bow, a
// parallel midbody with a bilge radius, a stern that narrows below the water and cuts up to the transom, antifouling
// red below the waterline, a rudder and a propeller. Origin on the waterline, bow toward +x, starboard toward +z.
//
//   buildToyShip({name})            -> container ship (the film's AURORA MERIDIAN); SHIP holds its measures
//   buildToyCargoShip()             -> general cargo ship with three deck cranes
//   buildToyBulkCarrier()           -> gearless bulk carrier, seven raised hatch covers
//   buildToyOilTanker()             -> crude tanker: green deck, pipe runs, manifold cranes, catwalk
//   buildToyLNGCarrier()            -> Moss-type LNG carrier, four spherical tanks under covers
//   buildToyPassengerShip()         -> cruise / passenger ship, a tall white superstructure with lifeboats
//   buildToyRoRo()                  -> pure car and truck carrier: a box hull, stern quarter ramp
//   buildToyFerry()                 -> Ro-Pax ferry: car deck, bow visor and stern ramp down, passenger decks
//   buildToyTugboat({name})         -> ASD harbour tug: bow fender, high wheelhouse, two azimuth thrusters
//   buildToyPilotBoat()             -> pilot launch: deep-V hull, fender collar, PILOT on the cabin
//   buildWaterline(ship, {y, wake}) -> {mesh, tick(t)} foam round the hull where the water meets it (local y), a wake
// Each returns {group, draft, length, beam, hull, ...}; the harbour craft add bob(t). Every builder takes
// hull: {bow, stern, rake, bulb, bulbB, bulbZ, flare, entry, sheer, sheerLen, bilge, transom, rise} to override its hull form (the
// bench's panel uses it); hull.params holds the factors in effect.
import * as THREE from 'three';
import {TOY, toyMat} from '../airport-shared/style.js';
import {tpl, mats, rb, cylG, canvasTex, decalMat, drawMark, LIVERY, sphere} from '../airport-shared/gse.js';
import {BOX} from './vehicles.js';
import {logoPlate} from './logos.js';

const PI = Math.PI;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (k) => k * k * (3 - 2 * k);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const paint = (c, r = 0.5) => toyMat(c, {paint: true, rough: r});

/** the ship colours: real liveries kept soft so they sit with the kit's pastels */
export const SHIP_COLORS = {
  antifoul: '#c4483f', // the red below the waterline
  black: '#262c40', // "black" topsides, a charcoal navy
  navy: '#2c3b6e',
  white: TOY.white,
  deckGrey: '#cfd6ea',
  deckGreen: '#5f9b6e', // tanker decks
  hatch: '#5d6c9c',
  hatchRed: '#9b4a40', // bulk hatch covers
  bronze: '#d2a35a', // propellers
  rubber: '#1f2433',
  ferryGreen: '#3f9b6a',
  lifeboat: TOY.orange,
};
const SC = SHIP_COLORS;

// ================================================================ the hull form
/** a hull form from its main measures. L, B, T (draft), F (freeboard at the main deck). Shape factors, all 0..1 of L
 *  or B: bow (entry length), stern (run length), rake (stem rake at the keel), bilge (bilge radius), transom (width of
 *  the transom at the deck), rise (how far the stern bottom cuts up toward the transom, of T). flare widens the bow at
 *  deck level; entry sets how fine the waterlines are (2 = fine, 1.3 = full). sheer lifts the deck over the last
 *  sheerLen of the length.
 *  The bulbous bow is a body of its own, sized with Kracht's coefficients and joined to the hull with a soft fillet:
 *  bulb = protruding length past the forward perpendicular (the stem at the waterline) as a part of L (C_LPR, real
 *  ships 0.018-0.031; true: 0.025, false: none), bulbB = its breadth as a part of B (C_BB, 0.17-0.20), bulbZ = the
 *  height of its foremost point above the keel as a part of T (C_ZB, 0.35-0.55). Its section is an upright oval,
 *  round on top and narrowing to a soft V below; its nose is round in plan and in profile, and in profile it sweeps
 *  back up into the stem and down into the forefoot. The top stays well under the waterline. */
function hullForm({L, B, T, F, xa = -L / 2, bow = 0.2, stern = 0.15, rake = 0.05, bilge = 0.1, transom = 0.8, rise = 0.6, flare = 1, entry = 2, sheer = 0, sheerLen = 0.14, sternSheer = 0, bulb = true, bulbB = 0.18, bulbZ = 0.45}) {
  const xf = xa + L;
  const D = T + F;
  const hb = B / 2;
  const xb = xf - bow * L;
  const xsb = xa + stern * L;
  // the stem without the bulb, and the forward perpendicular where it cuts the waterline
  const stem0 = (y) => xf - rake * L * Math.pow(1 - clamp((y + T) / D, 0, 1), 1.5);
  const FP = stem0(0);
  // the bulb: tip at (xT, yc), half-breadth ba, cU above the tip and cD below it (its bottom just over the keel)
  const C_LPR = bulb === false ? 0 : bulb === true ? 0.025 : bulb;
  const LPR = C_LPR * L;
  const yc = -T + bulbZ * T;
  const cU = 0.32 * T;
  const cD = Math.max(0.1 * T, (bulbZ - 0.05) * T);
  const ba = (bulbB * B) / 2;
  const xT = FP + LPR;
  const yTop = yc + cU;
  const nU = Math.max(0.5, xT - stem0(yTop));
  const nD = Math.max(0.5, xT - stem0(yc - cD));
  const rN = 1.5 * ba; // how far back the nose rounds out to the full breadth, in plan
  /** the bulb's profile: the foremost x at height y (-Infinity off the bulb) */
  const bulbFront = (y) => {
    if (LPR <= 0) return -Infinity;
    const up = y >= yc;
    const u = (y - yc) / (up ? cU : cD);
    if (Math.abs(u) >= 1) return -Infinity;
    return xT - (up ? nU : nD) * (1 - Math.sqrt(1 - u * u));
  };
  /** a half-breadth W that starts at x = front and rounds out over its first r metres, in plan */
  const nose = (W, front, x, r) => {
    const d = front - x;
    if (!(d > 0) || W <= 0) return 0;
    const k = 1 - Math.min(d / r, 1);
    return W * Math.sqrt(1 - k * k);
  };
  /** the bulb's half-breadth at (x, y): an oval section with a round nose, and the neck, a fillet that thickens the
   *  stem just over and under the bulb (it never reaches past the stem) and fades off away from it */
  const bulbW = (x, y) => {
    if (LPR <= 0 || x < xb) return 0;
    const up = y >= yc;
    const u = (y - yc) / (up ? cU : cD);
    const au = Math.abs(u);
    const oval = au >= 1 ? 0 : up ? ba * Math.sqrt(1 - u * u) : ba * Math.pow(1 - Math.pow(au, 1.8), 0.7);
    const wn = ba * 0.45 * Math.exp(-Math.max(0, au - 1) * (up ? 2.2 : 3));
    return Math.max(nose(oval, bulbFront(y), x, rN), nose(wn, stem0(y), x, 1.5 * wn));
  };
  const stemX = (y) => Math.max(stem0(y), bulbFront(y));
  const sternT = (x) => clamp((xsb - x) / (xsb - xa), 0, 1);
  const bottom = (x) => -T + rise * T * Math.pow(sternT(x), 2.2);
  const deckY = (x) => F + sheer * Math.pow(clamp((x - (xf - sheerLen * L)) / (sheerLen * L), 0, 1), 2) + sternSheer * Math.pow(sternT(x), 2);
  const w = (x, y) => {
    const yb = bottom(x);
    if (y < yb - 1e-6) return 0;
    const h = clamp((y + T) / D, 0, 1);
    const r = bilge * B;
    const zh = y - yb;
    let ww = zh < r ? hb - r + Math.sqrt(Math.max(0, r * r - (r - zh) * (r - zh))) : hb;
    if (x > xb) {
      const t = clamp((x - xb) / Math.max(0.01, stem0(y) - xb), 0, 1);
      const q = 0.82 - 0.22 * Math.pow(h, 3);
      ww *= Math.pow(Math.max(0, 1 - Math.pow(t, lerp(entry, entry + flare * 2.4, Math.pow(h, 1.2)))), q);
    }
    if (x < xsb) {
      const t = sternT(x);
      const hT = clamp((T * 0.55) / D, 0, 1);
      const wt = transom * smooth(clamp((h - hT) / (1 - hT), 0, 1));
      ww *= 1 - Math.pow(t, 1.8) * (1 - wt);
    }
    ww = Math.max(0, ww);
    // the bulb joins the hull through a soft union (a fillet where the two meet, never thinner than either)
    const wb = bulbW(x, y);
    return wb > 0 ? Math.pow(Math.pow(ww, 6) + Math.pow(wb, 6), 1 / 6) : ww;
  };
  // stations: xa..xf, clustered at both ends. In the bow (past xb) a station stretches, height by height, so it ends on
  // the stem line at every height: mx(x, y). The last station is the stem itself, the bulb's nose included, and the
  // skin never splits where the bulb and the bow above it part company.
  const N = 120;
  const xs = Array.from({length: N + 1}, (_, i) => xa + L * (0.5 - 0.5 * Math.cos((PI * i) / N)));
  // with a bulb, the last stretch of the bow gets extra stations: the bulb's shoulder needs them to stay smooth
  if (LPR > 0) {
    const fine = [];
    for (let i = 0; i < N; i++) {
      fine.push(xs[i]);
      if (xs[i] > xb) for (let k = 1; k < 3; k++) fine.push(lerp(xs[i], xs[i + 1], k / 3));
    }
    fine.push(xs[N]);
    xs.splice(0, xs.length, ...fine);
  }
  const mx = (x, y) => (x <= xb ? x : xb + ((x - xb) * (stemX(y) - xb)) / (xf - xb));
  // rows: the heights of the skin's rings, denser where the stem line runs flat (round the bulb's top and bottom) and
  // over the bilge, so the loft follows the bulb's outline instead of cutting across it
  const YN = 800;
  const gy0 = -T - 0.01;
  const gy1 = F + Math.max(0, sheer) + 1;
  const G = new Float64Array(YN + 1);
  for (let i = 1; i <= YN; i++) {
    const ya = gy0 + ((gy1 - gy0) * (i - 1)) / YN;
    const yb2 = gy0 + ((gy1 - gy0) * i) / YN;
    const slope = Math.abs(stemX(yb2) - stemX(ya)) / (yb2 - ya);
    G[i] = G[i - 1] + (1 + Math.min(12, 0.8 * slope) + (yb2 < -T + bilge * B * 1.3 ? 1.5 : 0)) * (yb2 - ya);
  }
  const gAt = (y) => {
    const f = clamp((y - gy0) / (gy1 - gy0), 0, 1) * YN;
    const i = Math.min(YN - 1, Math.floor(f));
    return lerp(G[i], G[i + 1], f - i);
  };
  const yAt = (g) => {
    let a = 0;
    let b = YN;
    while (b - a > 1) {
      const m = (a + b) >> 1;
      if (G[m] < g) a = m;
      else b = m;
    }
    const k = G[b] > G[a] ? (g - G[a]) / (G[b] - G[a]) : 0;
    return gy0 + ((gy1 - gy0) * (a + clamp(k, 0, 1))) / YN;
  };
  /** n + 1 ring heights from hi down to lo */
  const rows = (lo, hi, n) => {
    const g0 = gAt(lo);
    const g1 = gAt(hi);
    return Array.from({length: n + 1}, (_, j) => (j === 0 ? hi : j === n ? lo : yAt(g1 - ((g1 - g0) * j) / n)));
  };
  const params = {bow, stern, rake, bulb: C_LPR, bulbB, bulbZ, flare, entry, sheer, sheerLen, bilge, transom, rise};
  return {L, B, T, F, D, xa, xf, xb, xsb, hb, w, bottom, deckY, stemX, xs, mx, rows, bulb: LPR > 0, bulbTop: yTop, FP, sheerLen, params};
}

/** a cache-key suffix for hull overrides (empty for the ship as designed) */
const hullKey = (h) => (h && Object.keys(h).length ? '|' + JSON.stringify(h) : '');

/** one horizontal band of the hull's skin, from y0 to y1 (bottom: from the keel; top: up to the deck line) */
function hullBand(H, y0, y1, {n = 6, bottom = false, top = false} = {}) {
  const pos = [];
  const idx = [];
  const R = (n + 1) * 2 + (bottom ? 1 : 0);
  const ring0 = [];
  for (const [si, x] of H.xs.entries()) {
    const hi = top ? H.deckY(H.mx(x, H.deckY(x))) : y1;
    const lo = Math.min(bottom ? H.bottom(x) : y0, hi);
    const ys = H.rows(lo, hi, n);
    const ring = [];
    for (const y of ys) {
      const xx = H.mx(x, y);
      ring.push([xx, y, H.w(xx, y)]);
    }
    if (bottom) ring.push([H.mx(x, lo), lo, 0]);
    for (let j = n; j >= 0; j--) ring.push([ring[j][0], ys[j], -ring[j][2]]);
    for (const p of ring) pos.push(...p);
    if (si === 0) ring0.push(...ring);
  }
  for (let i = 0; i < H.xs.length - 1; i++) {
    for (let k = 0; k < R - 1; k++) {
      const a = i * R + k;
      idx.push(a, a + 1, a + 1 + R, a, a + 1 + R, a + R);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // the transom: its own vertices so its edge stays crisp
  const cy = ring0.reduce((s, p) => s + p[1], 0) / ring0.length;
  const tp = [];
  for (let k = 0; k < ring0.length; k++) {
    const p = ring0[k];
    const q = ring0[(k + 1) % ring0.length];
    tp.push(H.xa, cy, 0, ...q, ...p);
  }
  const tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3));
  tg.computeVertexNormals();
  return [g, tg];
}

/** the main deck as a strip over the stations, slightly inset */
function hullDeck(H, inset = 0.15) {
  const pos = [];
  const idx = [];
  for (const x0 of H.xs) {
    const x = H.mx(x0, H.deckY(x0));
    const y = H.deckY(x);
    const w = Math.max(0, H.w(x, y) - inset);
    pos.push(x, y + 0.02, w, x, y + 0.02, -w);
  }
  for (let i = 0; i < H.xs.length - 1; i++) {
    const r = 2 * i;
    const l = r + 1;
    idx.push(r, r + 2, l, l, r + 2, l + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** the hull's surface: skin in bands (antifouling, boot-top, topsides with an optional colour band), the deck, the
 *  bulbous bow, rudder and propeller. bands: [{to: y, color}] from the keel up, the last one runs to the deck. */
function addHull(P, H, {bands, deck = SC.deckGrey, prop = 1, twin = false}) {
  let y0 = -H.T;
  bands.forEach((b, i) => {
    const last = i === bands.length - 1;
    const first = i === 0;
    const y1 = last ? H.F : b.to;
    const n = first ? 44 : last ? 12 : 2;
    const [g, tg] = hullBand(H, y0, y1, {n, bottom: first, top: last});
    P.add(paint(b.color, 0.55), g);
    P.add(paint(b.color, 0.55), tg);
    y0 = y1;
  });
  P.add(toyMat(deck, {rough: 0.85}), hullDeck(H));
  // a rounded rubbing rim along the deck edge
  const rim = [];
  for (const x0 of H.xs) {
    const x = H.mx(x0, H.deckY(x0));
    rim.push(V3(x, H.deckY(x) - 0.05, H.w(x, H.deckY(x))));
  }
  const rimP = new THREE.CatmullRomCurve3([...rim, ...rim.slice(0, -1).reverse().map((p) => V3(p.x, p.y, -p.z))]);
  P.add(paint(bands[bands.length - 1].color, 0.5), new THREE.TubeGeometry(rimP, 300, Math.min(0.35, H.B * 0.012), 6, false));
  const red = paint(bands[0].color, 0.55);
  if (H.bulb) bowFittings(P, H, {top: bands[bands.length - 1].color});
  // rudder and propeller(s) under the stern
  const rx = H.xa + H.L * 0.012;
  const yb = H.bottom(rx + H.L * 0.02);
  const rh = Math.max(1, -yb - 0.4) * 0.95;
  const brz = toyMat(SC.bronze, {rough: 0.35, metal: 0.4});
  const props = twin ? [-H.B * 0.22, H.B * 0.22] : [0];
  for (const z of props) {
    const px = rx + H.L * 0.03;
    const py = -H.T + rh * 0.45 + (twin ? H.T * 0.15 : 0);
    const pr = Math.min(rh * 0.45, H.T * 0.4) * prop;
    P.cyl(brz, pr * 0.22, pr * 0.22, pr * 0.5, px, py, z, 'x', 16);
    for (let k = 0; k < 4; k++) P.add(brz, rb(pr * 0.12, pr * 1.0, pr * 0.42, pr * 0.05), px, py + Math.cos((k * PI) / 2) * pr * 0.5, z + Math.sin((k * PI) / 2) * pr * 0.5, (k * PI) / 2, 0, 0.35);
    P.add(red, rb(H.L * 0.018, rh, Math.max(0.25, H.B * 0.025), 0.15), rx, -H.T + rh / 2 + 0.2, z);
  }
}

/** a point on the hull's starboard skin at (x, y) and the yaw that faces a flat part along its surface */
function onHull(H, x, y) {
  const s = (H.w(x + 0.5, y) - H.w(x - 0.5, y)) / 1;
  return {z: H.w(x, y), yaw: -Math.atan(s)};
}

/** what makes a ship's bow read finished: a hawse pocket each side with the anchor stowed in it, fairleads (white
 *  rimmed openings) under the deck edge, a rail round the forecastle, the draft marks down the stem */
function bowFittings(P, H, {top}) {
  const M = mats();
  const k = clamp(H.B / 32, 0.45, 1.4); // fittings scale with the ship
  const rust = paint('#b9713c', 0.6);
  const rim = paint(SC.white, 0.5);
  // --- the hawse pockets and the anchors
  const ax = H.xf - Math.max(5, H.L * 0.055);
  const ay = H.deckY(ax) - Math.max(1.8, H.F * 0.3);
  const {z: az, yaw} = onHull(H, ax, ay);
  for (const sd of [-1, 1]) {
    const ry = sd > 0 ? yaw : PI - yaw;
    const n = V3(Math.sin(ry), 0, Math.cos(ry)); // outward
    const tg = V3(Math.cos(ry), 0, -Math.sin(ry)); // along the hull, toward the bow on starboard
    const at = (lx, ly, ln) => V3(ax, ay, sd * az).addScaledVector(tg, sd * lx).addScaledVector(n, ln).add(V3(0, ly, 0));
    const disc = cylG(1, 1, 1, 28).clone().rotateX(PI / 2);
    const c0 = at(0, 0, 0.05);
    P.add(paint(top, 0.5), disc, c0.x, c0.y, c0.z, 0, ry, 0, 2.3 * k, 2.1 * k, 0.5);
    const c1 = at(0, 0, 0.18);
    P.add(M.ink, disc, c1.x, c1.y, c1.z, 0, ry, 0, 1.85 * k, 1.7 * k, 0.4);
    // the anchor: the shank up into the hawse pipe, the crown and two flukes folded against the hull
    const sh = at(0, 0.2 * k, 0.45);
    P.add(rust, rb(0.42 * k, 2.2 * k, 0.4 * k, 0.12 * k), sh.x, sh.y, sh.z, 0, ry, 0);
    const cr = at(0, -0.85 * k, 0.5);
    P.add(rust, rb(1.9 * k, 0.5 * k, 0.5 * k, 0.15 * k), cr.x, cr.y, cr.z, 0, ry, 0);
    for (const f of [-1, 1]) {
      const fl = at(f * 0.75 * k, -0.25 * k, 0.5);
      P.add(rust, rb(0.5 * k, 1.5 * k, 0.45 * k, 0.15 * k), fl.x, fl.y, fl.z, 0, ry, f * sd * 0.55);
    }
  }
  // --- fairleads under the deck edge over the forecastle
  const fx0 = H.xf - H.sheerLen * H.L;
  for (let i = 0; i < 3; i++) {
    const x = lerp(fx0 + 2, H.xf - Math.max(3, H.L * 0.02), i / 2);
    const y = H.deckY(x) - 0.75 * k;
    const {z, yaw: fy} = onHull(H, x, y);
    if (z < 1) continue;
    for (const sd of [-1, 1]) {
      const ry = sd > 0 ? fy : PI - fy;
      const n = V3(Math.sin(ry), 0, Math.cos(ry));
      const p0 = V3(x, y, sd * z).addScaledVector(n, 0.05);
      const p1 = V3(x, y, sd * z).addScaledVector(n, 0.12);
      P.add(rim, rb(2.2 * k, 0.95 * k, 0.2, 0.4 * k), p0.x, p0.y, p0.z, 0, ry, 0);
      P.add(M.ink, rb(1.6 * k, 0.5 * k, 0.2, 0.22 * k), p1.x, p1.y, p1.z, 0, ry, 0);
    }
  }
  // --- the forecastle rail: posts along the deck edge and a top rail round the stem
  const pts = [];
  for (let x = fx0 - H.L * 0.02; x < H.xf - 0.4; x += 2.2) pts.push(x);
  const rh = 1.1;
  const edge = (x) => {
    const y = H.deckY(x);
    return [y, Math.max(0.2, H.w(x, y) - 0.25)];
  };
  const top1 = [];
  for (const x of pts) {
    const [y, z] = edge(x);
    for (const sd of [-1, 1]) P.rod(M.white, [x, y, sd * z], [x, y + rh, sd * z], 0.05);
    top1.push(V3(x, y + rh, z));
  }
  const tip = edge(H.xf - 0.6);
  const loop = [...top1.slice().reverse().map((p) => V3(p.x, p.y, -p.z)), V3(H.xf - 0.6, tip[0] + rh, 0), ...top1];
  P.add(M.white, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(loop.reverse()), 80, 0.07, 6, false));
  const mid = loop.map((p) => V3(p.x, p.y - rh * 0.5, p.z));
  P.add(M.white, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mid), 80, 0.05, 6, false));
  // --- the draft marks down the stem: a dotted white line and the metres every 2
  // they follow the stem from just over the bulb up past the waterline
  for (let y = Math.max(-H.T * 0.3, H.bulbTop + 0.6); y < Math.min(H.F - 1.5, 1.5); y += 0.5) {
    const x = H.stemX(y) - Math.max(1.2, H.L * 0.008);
    const {z, yaw: my} = onHull(H, x, y);
    if (z < 0.3) continue;
    const big = Math.abs(((y + H.T) % 2) - 0) < 0.26;
    for (const sd of [-1, 1]) {
      const ry = sd > 0 ? my : PI - my;
      const p = V3(x, y, sd * z).addScaledVector(V3(Math.sin(ry), 0, Math.cos(ry)), 0.06);
      P.add(rim, rb(big ? 0.55 : 0.28, 0.16, 0.08, 0.04), p.x, p.y, p.z, 0, ry, 0);
    }
  }
}

/** a name in white on the hull's side, following the hull's taper; both sides */
function hullText(P, H, text, x, y, h, fg = '#ffffff') {
  const s = (H.w(x + 1, y) - H.w(x - 1, y)) / 2;
  const z = H.w(x, y) + 0.06;
  P.text(text, {fg, px: 120}, h, x, y, z, -Math.atan(s));
  P.text(text, {fg, px: 120}, h, x, y, -z, PI + Math.atan(s));
}

/** a logo on both sides of the hull, its artwork h high, following the hull's taper */
function hullLogo(P, H, key, x, y, h) {
  const s = (H.w(x + 1, y) - H.w(x - 1, y)) / 2;
  const z = H.w(x, y) + 0.06;
  logoPlate(P, key, h, x, y, z, -Math.atan(s));
  logoPlate(P, key, h, x, y, -z, PI + Math.atan(s));
}

/** the name and port of registry across the transom */
function sternText(P, H, name, port, fg = '#ffffff') {
  const y = H.F - Math.max(1.2, H.F * 0.22);
  P.text(name, {fg, px: 110}, Math.max(0.5, H.B * 0.04), H.xa - 0.08, y, 0, -PI / 2);
  P.text(port, {fg, px: 110}, Math.max(0.35, H.B * 0.028), H.xa - 0.08, y - Math.max(0.8, H.B * 0.05), 0, -PI / 2);
}

// ================================================================ superstructure parts
/** an accommodation block of tiers stacked from y0, the bridge on top with wings to the hull's width and a glass band
 *  wrapping the front. Front face at x1. Returns the roof height. */
function house(P, {x0, x1, y0, tiers = 5, th = 2.8, hw, wing = hw, step = 0, color = SC.white, roof = TOY.blue, bridgeH = 3.4}) {
  const M = mats();
  const wall = paint(color, 0.5);
  let y = y0;
  for (let k = 0; k < tiers; k++) {
    const a = x0 + k * step;
    P.ext(wall, a, x1, y, y + th + 0.05, -hw, hw, 0.35);
    P.ext(M.glass, x1 - 0.06, x1 + 0.05, y + th * 0.42, y + th * 0.78, -hw * 0.82, hw * 0.82, 0.08);
    for (const s of [-1, 1]) P.ext(M.glass, a + 1, x1 - 1, y + th * 0.42, y + th * 0.78, s * hw - 0.06, s * hw + 0.06, 0.08);
    y += th;
  }
  // the bridge deck: wider, all-round glass at the front, a dark roof edge
  const b0 = x0 + tiers * step + (x1 - x0 - tiers * step) * 0.25;
  P.ext(wall, b0, x1 + 0.6, y, y + bridgeH, -wing, wing, 0.3);
  P.ext(M.glass, x1 + 0.5, x1 + 0.66, y + bridgeH * 0.35, y + bridgeH * 0.85, -wing * 0.95, wing * 0.95, 0.08);
  for (const s of [-1, 1]) P.ext(M.glass, b0 + 0.6, x1, y + bridgeH * 0.35, y + bridgeH * 0.85, s * wing - 0.08, s * wing + 0.08, 0.08);
  P.ext(paint(roof, 0.46), b0 - 0.1, x1 + 0.7, y + bridgeH - 0.05, y + bridgeH + 0.45, -wing - 0.1, wing + 0.1, 0.15);
  return y + bridgeH + 0.45;
}

/** a radar mast on a roof: a pole, a yard with the radar bar and lights */
function radarMast(P, x, y, h, w = 2.5) {
  const M = mats();
  P.cyl(M.white, 0.22, 0.28, h, x, y + h / 2, 0, 'y', 10);
  P.ext(M.white, x - 0.2, x + 0.2, y + h * 0.7, y + h * 0.7 + 0.3, -w, w, 0.06);
  P.ext(M.ink, x - 0.25, x + 0.25, y + h * 0.45, y + h * 0.45 + 0.25, -w * 0.7, w * 0.7, 0.08);
  P.add(M.white, sphere(0.45), x, y + h + 0.3, 0);
}

/** a funnel: a rounded stack with a coloured band and a dark top, the line's mark on the band */
function funnel(P, {x, y, z = 0, h, l, w, color = TOY.blue, band = null, mark = null}) {
  const M = mats();
  P.ext(paint(color, 0.46), x - l / 2, x + l / 2, y, y + h, z - w / 2, z + w / 2, Math.min(l, w) * 0.3);
  if (band) P.ext(paint(band, 0.46), x - l / 2 - 0.03, x + l / 2 + 0.03, y + h * 0.55, y + h * 0.8, z - w / 2 - 0.03, z + w / 2 + 0.03, Math.min(l, w) * 0.28);
  P.ext(M.ink, x - l / 2 + 0.15, x + l / 2 - 0.15, y + h - 0.1, y + h + 0.35, z - w / 2 + 0.15, z + w / 2 - 0.15, 0.15);
  if (mark) {
    const tex = canvasTex(`funnel-mark-${mark}`, 256, 256, (g, ww) => drawMark(g, mark, 20, 20, ww - 40, {...LIVERY[mark], accent: '#ffffff', light: '#ffffff', deep: '#ffffff'}));
    const s = Math.min(l * 0.7, h * 0.4);
    for (const sd of [-1, 1]) P.print(decalMat(tex), s, s, x, y + h * 0.62, z + sd * (w / 2 + 0.05), sd > 0 ? 0 : PI);
  }
}

/** an orange lifeboat: freefall (on a ramp, nose down, off the stern) or on davits along the side */
function lifeboat(P, x, y, z, {len = 7, freefall = false, ry = 0} = {}) {
  const M = mats();
  const o = paint(SC.lifeboat, 0.48);
  const wdt = len * 0.34;
  if (freefall) {
    // nose aft and down, the way it drops off the stern
    P.add(o, rb(len, wdt * 0.95, wdt, wdt * 0.45), x, y, z, 0, 0, 0.5);
    P.add(M.white, rb(len * 0.35, wdt * 0.3, wdt * 0.6, wdt * 0.12), x + len * 0.08, y + wdt * 0.48, z, 0, 0, 0.5);
    P.add(M.steel, rb(len * 1.1, 0.25, wdt * 1.2, 0.08), x + 0.3, y - wdt * 0.6, z, 0, 0, 0.5);
  } else {
    P.add(o, rb(len, wdt * 0.8, wdt, wdt * 0.4), x, y, z, 0, ry, 0);
    P.add(M.white, rb(len * 0.92, wdt * 0.12, wdt * 1.02, 0.05), x, y + wdt * 0.32, z, 0, ry, 0);
  }
}

/** a deck crane: a pedestal, a cab on the slewing ring, the jib raised toward +x (local), a hook on a rope */
function deckCrane(P, x, y, z, {jib = 22, lift = 0.95, slew = 0, color = TOY.yellow} = {}) {
  const M = mats();
  const c = paint(color, 0.5);
  P.cyl(c, 1.3, 1.5, 7, x, y + 3.5, z, 'y', 18);
  P.cyl(M.ink, 1.65, 1.65, 0.4, x, y + 7.1, z, 'y', 18);
  P.add(c, rb(4.6, 3.4, 3.6, 0.5), x, y + 9, z, 0, slew, 0);
  P.add(M.glass, rb(1.6, 1.4, 3.7, 0.2), x + Math.cos(slew) * 1.6, y + 9.5, z - Math.sin(slew) * 1.6, 0, slew, 0);
  const a = V3(x + Math.cos(slew) * 1.2, y + 8.4, z - Math.sin(slew) * 1.2);
  const tip = V3(x + Math.cos(slew) * Math.cos(lift) * jib, y + 8.4 + Math.sin(lift) * jib, z - Math.sin(slew) * Math.cos(lift) * jib);
  P.bar(c, a.toArray(), tip.toArray(), 0.9);
  P.bar(c, [x, y + 11, z], tip.toArray(), 0.25);
  P.rod(M.ink, tip.toArray(), [tip.x, y + 4, tip.z], 0.08);
  P.add(M.yellow, rb(0.8, 0.9, 0.8, 0.2), tip.x, y + 3.6, tip.z);
}

/** the forecastle's fittings: the hull's sheer already lifts the deck at the bow; this adds the V breakwater where the
 *  rise starts and the foremast on the raised deck */
function forecastle(P, H, {len = 0.09, h = 2.6, color = SC.black, breakwater = SC.white, mast = true} = {}) {
  const M = mats();
  const x1 = H.xf - 0.5;
  const x0 = H.xf - len * H.L - H.L * 0.01;
  const y = H.deckY(x0);
  const w = H.w(x0, y) - 0.5;
  P.add(paint(breakwater, 0.5), rb(0.5, h * 1.2, w * 1.1, 0.15), x0 - 1.0, y + h * 0.6, w * 0.5, 0, -0.5, 0);
  P.add(paint(breakwater, 0.5), rb(0.5, h * 1.2, w * 1.1, 0.15), x0 - 1.0, y + h * 0.6, -w * 0.5, 0, 0.5, 0);
  if (mast) {
    const mx = lerp(x0, x1, 0.45);
    P.cyl(M.white, 0.3, 0.38, 9, mx, H.deckY(mx) + 4.5, 0, 'y', 12);
    P.ext(M.white, mx - 0.2, mx + 0.2, H.deckY(mx) + 7, H.deckY(mx) + 7.3, -2, 2, 0.05);
  }
  return H.deckY(x1);
}

/** mooring bitts on the deck at given x positions, both sides; returns the quay-side (+z) points */
function bitts(P, H, list) {
  const M = mats();
  return list.map((x) => {
    const y = H.deckY(x);
    const z = H.w(x, y) - 1.2;
    for (const s of [-1, 1]) for (const dx of [-0.5, 0.5]) P.cyl(M.ink, 0.32, 0.32, 0.9, x + dx, y + 0.45, s * z, 'y', 12);
    return V3(x, y + 0.8, z);
  });
}

// ================================================================ 2 · container ship
/** the film's container ship: a fine, flared hull with a bulbous bow, hatch covers per bay with lashing bridges, a
 *  forecastle with a breakwater, the deckhouse aft with full-width bridge wings, the funnel behind it, a freefall
 *  lifeboat off the stern. The deck cargo is placed by the world (it is instanced with the yard); shipLoad() gives a
 *  full load for the bench. */
export const SHIP = {L: 214, B: 32, deck: 7.6, hatch: 8.3, x0: -100, x1: 114, bayL: 17, draft: 9};
export function buildToyShip({name = 'AURORA MERIDIAN', port = 'NORTHBAY', hull = {}} = {}) {
  const M = mats();
  const group = new THREE.Group();
  const {B, L, deck, hatch, x0, x1, bayL, draft} = SHIP;
  const H = hullForm({L, B, T: draft, F: deck, xa: x0, bow: 0.17, stern: 0.16, rake: 0.05, bilge: 0.07, transom: 0.86, rise: 0.62, flare: 1.4, entry: 1.9, sheer: 4.6, sheerLen: 0.1, bulb: 0.03, bulbB: 0.17, ...hull});
  const hb = B / 2;
  const bays = [];
  for (let x = x0 + 34; x + bayL / 2 < x1 - 22; x += bayL + 1) bays.push(x + bayL / 2);
  const rows = Array.from({length: 9}, (_, i) => (i - 4) * 3.5);
  let quay = [];
  tpl(`ship2|${name}${hullKey(hull)}`, (P) => {
    addHull(P, H, {bands: [{to: 0.7, color: SC.antifoul}, {color: SC.black}]});
    // hatch covers per bay, lashing bridges between the bays, cell guides at the ends
    for (const bx of bays) {
      const w = Math.min(hb - 1.6, H.w(bx + bayL / 2, deck) - 1.4);
      P.ext(toyMat(SC.hatch, {rough: 0.6}), bx - bayL / 2 + 0.3, bx + bayL / 2 - 0.3, deck, hatch, -w, w, 0.2);
      for (const z of [-w / 3, w / 3]) P.ext(toyMat('#4f5e8e', {rough: 0.6}), bx - bayL / 2 + 0.3, bx + bayL / 2 - 0.3, hatch - 0.02, hatch + 0.03, z - 0.08, z + 0.08, 0.01);
      const lx = bx + bayL / 2 + 0.5;
      for (const z of [-w, -w / 2, 0, w / 2, w]) P.bar(M.white, [lx, deck, z], [lx, deck + 3.8, z], 0.28);
      P.ext(M.white, lx - 0.25, lx + 0.25, deck + 3.6, deck + 3.9, -w, w, 0.06);
      P.ext(toyMat(SC.deckGrey, {rough: 0.8}), lx - 0.6, lx + 0.6, deck, deck + 0.5, -w, w, 0.1);
    }
    const fy = forecastle(P, H, {len: 0.1, h: 2.6});
    void fy;
    // the deckhouse aft: 7 tiers, the bridge with wings to the ship's side, the funnel behind, the freefall boat
    const ax0 = x0 + 8;
    const ax1 = x0 + 24;
    const top = house(P, {x0: ax0, x1: ax1, y0: deck, tiers: 6, th: 2.85, hw: hb * 0.5, wing: hb + 0.4, step: 0});
    radarMast(P, ax0 + 6, top, 5.5, 3);
    funnel(P, {x: ax0 - 3.2, y: deck + 6, h: 17, l: 6, w: 6.4, color: TOY.blue, band: TOY.white, mark: 'aurora'});
    lifeboat(P, x0 + 2.5, deck + 4.5, 0, {len: 8, freefall: true, ry: PI});
    // the line's name along the side, the ship's name at the bow, name and port on the transom, draught marks
    hullLogo(P, H, 'white', -10, deck - 3.6, 3.6);
    hullText(P, H, name, x1 - 24, deck - 2.3, 1.5);
    sternText(P, H, name, port);
    for (const x of [0, x0 + 4]) for (let k = 0; k < 4; k++) hullText(P, H, `${2 * k + 4}`, x, -draft + 4 + 2 * k, 0.5);
    quay = bitts(P, H, [x1 - 20, x1 - 40, x0 + 26, x0 + 6]);
  }, group);
  if (!quay.length) quay = [x1 - 20, x1 - 40, x0 + 26, x0 + 6].map((x) => V3(x, H.deckY(x) + 0.8, H.w(x, H.deckY(x)) - 1.2));
  return {group, deckY: deck, hatchY: hatch, bays, rows, bitts: quay, draft, length: L, beam: B, hull: H};
}

/** a full deck load for the container ship on the bench: stacks per bay, lower toward the bow, a mix of lines.
 *  Returns the list for buildContainerField, in ship-local coordinates. */
export function shipLoad(ship, {seed = 3} = {}) {
  const cols = ['#3166ea', '#21b3a3', '#eef1f8', '#2c3b6e', '#ff8a3d', '#8fb0f7', '#b7c3ee', '#c4483f', '#3166ea', '#2c3b6e'];
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const list = [];
  ship.bays.forEach((bx, i) => {
    const n = ship.bays.length;
    const tiers = i === n - 1 ? 3 : i === n - 2 ? 4 : i === 0 ? 5 : 6;
    for (const z of ship.rows) {
      const tz = Math.abs(z) > 12 ? tiers - 1 : tiers;
      const t = Math.max(1, tz - (rnd() < 0.15 ? 1 : 0));
      for (let k = 0; k < t; k++) list.push({x: bx, y: ship.hatchY + k * BOX.H, z, len: BOX.L40, color: cols[Math.floor(rnd() * cols.length)]});
    }
  });
  return list;
}

// ================================================================ 3 · general cargo ship
/** a multipurpose general cargo ship: four holds under folding hatch covers, three yellow deck cranes on the centre
 *  line between them, the deckhouse aft, a forecastle. 140 m. */
export function buildToyCargoShip({name = 'KESTREL TRADER', port = 'NORTHBAY', hull = {}} = {}) {
  const group = new THREE.Group();
  const L = 140;
  const B = 22;
  const T = 7.5;
  const F = 5.2;
  const H = hullForm({L, B, T, F, bow: 0.18, stern: 0.17, rake: 0.05, bilge: 0.09, transom: 0.8, rise: 0.6, flare: 1.2, entry: 1.8, sheer: 3.8, sheerLen: 0.1, bulb: 0.025, bulbB: 0.17, ...hull});
  tpl(`cargo|${name}${hullKey(hull)}`, (P) => {
    addHull(P, H, {bands: [{to: 0.6, color: SC.antifoul}, {color: SC.navy}]});
    const holds = [[-34, -14], [-8, 12], [18, 38], [44, 58]];
    for (const [a, b] of holds) {
      const w = Math.min(H.w(a, F), H.w(b, F)) - 2.4;
      P.ext(toyMat(SC.deckGrey, {rough: 0.8}), a - 0.6, b + 0.6, F, F + 1.4, -w - 0.6, w + 0.6, 0.15);
      P.ext(toyMat(SC.hatch, {rough: 0.6}), a, b, F + 1.3, F + 1.9, -w, w, 0.2);
      for (let x = a + 4; x < b; x += 4) P.ext(toyMat('#4f5e8e', {rough: 0.6}), x - 0.08, x + 0.08, F + 1.88, F + 1.94, -w, w, 0.01);
    }
    deckCrane(P, -11, F, 0, {jib: 24, lift: 0.85, slew: 0.5});
    deckCrane(P, 15, F, 0, {jib: 24, lift: 0.95, slew: -0.3});
    deckCrane(P, 41, F, 0, {jib: 22, lift: 1.0, slew: 0.2});
    forecastle(P, H, {len: 0.09, h: 2.4, color: SC.navy});
    const x0 = H.xa + 6;
    const top = house(P, {x0, x1: x0 + 15, y0: F, tiers: 4, th: 2.8, hw: B * 0.34, wing: B / 2 + 0.3});
    radarMast(P, x0 + 5, top, 5, 2.4);
    funnel(P, {x: x0 + 3, y: top - 1, h: 6, l: 4, w: 4.4, color: SC.white, band: TOY.teal, mark: 'kestrel'});
    lifeboat(P, H.xa + 2, F + 3.6, 0, {len: 6, freefall: true, ry: PI});
    hullText(P, H, name, H.xf - 16, F - 1.8, 1.2);
    hullText(P, H, 'KESTREL', 8, F - 2.8, 2.4);
    sternText(P, H, name, port);
  }, group);
  return {group, draft: T, length: L, beam: B, hull: H};
}

// ================================================================ 4 · bulk carrier
/** a gearless bulk carrier: seven big raised hatch covers in oxide red over the holds, the deckhouse aft, a
 *  forecastle with a foremast. 190 m. */
export function buildToyBulkCarrier({name = 'NORTHBAY PIONEER', port = 'NORTHBAY', hull = {}} = {}) {
  const group = new THREE.Group();
  const L = 190;
  const B = 32;
  const T = 11;
  const F = 6.6;
  const H = hullForm({L, B, T, F, bow: 0.15, stern: 0.15, rake: 0.04, bilge: 0.06, transom: 0.82, rise: 0.55, flare: 0.9, entry: 1.45, sheer: 4.6, sheerLen: 0.1, bulb: 0.022, bulbB: 0.2, ...hull});
  tpl(`bulk|${name}${hullKey(hull)}`, (P) => {
    addHull(P, H, {bands: [{to: 0.8, color: SC.antifoul}, {color: SC.black}]});
    const n = 7;
    const a0 = H.xa + 34;
    const a1 = H.xf - 24;
    const hl = (a1 - a0) / n;
    for (let i = 0; i < n; i++) {
      const a = a0 + i * hl + 1.6;
      const b = a0 + (i + 1) * hl - 1.6;
      const w = Math.min(H.w(a, F), H.w(b, F)) - 3.6;
      P.ext(toyMat(SC.deckGrey, {rough: 0.8}), a - 0.5, b + 0.5, F, F + 1.8, -w - 0.5, w + 0.5, 0.15);
      P.ext(paint(SC.hatchRed, 0.6), a, b, F + 1.7, F + 2.6, -w, w, 0.3);
      P.ext(paint(SC.hatchRed, 0.6), a + 0.6, b - 0.6, F + 2.5, F + 3.1, -w * 0.7, w * 0.7, 0.3);
      P.ext(toyMat('#7f3b33', {rough: 0.7}), (a + b) / 2 - 0.1, (a + b) / 2 + 0.1, F + 2.55, F + 3.15, -w * 0.72, w * 0.72, 0.03);
    }
    forecastle(P, H, {len: 0.08, h: 2.8});
    const x0 = H.xa + 7;
    const top = house(P, {x0, x1: x0 + 18, y0: F, tiers: 5, th: 2.8, hw: B * 0.36, wing: B / 2 + 0.3});
    radarMast(P, x0 + 6, top, 5.5, 3);
    funnel(P, {x: x0 + 3.5, y: top - 1.5, h: 7, l: 5, w: 5.5, color: SC.black, band: TOY.blue});
    lifeboat(P, H.xa + 2.2, F + 4, 0, {len: 7.5, freefall: true, ry: PI});
    hullText(P, H, name, H.xf - 20, F - 2, 1.4);
    sternText(P, H, name, port);
  }, group);
  return {group, draft: T, length: L, beam: B, hull: H};
}

// ================================================================ 5 · oil tanker
/** a crude oil tanker: a green deck with the cargo pipe runs fore and aft, the manifold midships with a hose crane on
 *  each side, a raised catwalk on the centre line, the deckhouse aft, a forecastle. 230 m. */
export function buildToyOilTanker({name = 'AURORA PETREL', port = 'NORTHBAY', hull = {}} = {}) {
  const M = mats();
  const group = new THREE.Group();
  const L = 230;
  const B = 42;
  const T = 13;
  const F = 7;
  const H = hullForm({L, B, T, F, bow: 0.14, stern: 0.14, rake: 0.035, bilge: 0.05, transom: 0.84, rise: 0.5, flare: 0.8, entry: 1.35, sheer: 4.4, sheerLen: 0.08, bulb: 0.02, bulbB: 0.23, ...hull});
  tpl(`tanker|${name}${hullKey(hull)}`, (P) => {
    addHull(P, H, {bands: [{to: 0.8, color: SC.antifoul}, {color: SC.black}], deck: SC.deckGreen});
    const a = H.xa + 36;
    const b = H.xf - 26;
    const pipe = toyMat('#c9cfe0', {rough: 0.45, metal: 0.2});
    for (const z of [-6, -3.6, -1.2, 1.2, 3.6, 6]) P.cyl(pipe, 0.45, 0.45, b - a, (a + b) / 2, F + 0.9, z, 'x', 10);
    for (let x = a + 6; x < b; x += 12) P.ext(toyMat('#8a93ad', {rough: 0.6}), x - 0.3, x + 0.3, F, F + 0.7, -7, 7, 0.08);
    // the catwalk on posts above the pipes
    P.ext(toyMat(SC.deckGrey, {rough: 0.7}), a, b, F + 2.6, F + 2.9, -1, 1, 0.08);
    for (let x = a; x <= b; x += 8) P.bar(M.white, [x, F, 0], [x, F + 2.6, 0], 0.25);
    // the manifold midships, a hose crane each side, small hatches and vents
    const mx = (a + b) / 2;
    for (const s of [-1, 1]) {
      for (let k = 0; k < 4; k++) P.cyl(pipe, 0.4, 0.4, 13, mx - 3 + k * 2, F + 1.2, s * 13, 'z', 10);
      P.cyl(paint(TOY.white), 0.7, 0.8, 5, mx + 6, F + 2.5, s * 12, 'y', 12);
      P.bar(paint(TOY.white), [mx + 6, F + 5, s * 12], [mx - 2, F + 11, s * 14], 0.55);
    }
    for (let x = a + 10; x < b; x += 22) for (const s of [-1, 1]) {
      P.cyl(toyMat('#e9edf8', {rough: 0.6}), 0.9, 0.9, 0.6, x, F + 0.3, s * 12, 'y', 14);
      P.cyl(M.white, 0.25, 0.25, 4, x + 4, F + 2, s * 15, 'y', 8);
    }
    forecastle(P, H, {len: 0.07, h: 2.8});
    const x0 = H.xa + 8;
    const top = house(P, {x0, x1: x0 + 20, y0: F, tiers: 6, th: 2.8, hw: B * 0.32, wing: B / 2 + 0.3});
    radarMast(P, x0 + 7, top, 6, 3);
    funnel(P, {x: x0 + 3.5, y: top - 1, h: 8, l: 5.5, w: 6, color: SC.black, band: TOY.orange});
    lifeboat(P, H.xa + 2.5, F + 4.4, 0, {len: 8, freefall: true, ry: PI});
    hullText(P, H, name, H.xf - 22, F - 2.2, 1.5);
    sternText(P, H, name, port);
  }, group);
  return {group, draft: T, length: L, beam: B, hull: H};
}

// ================================================================ 6 · LNG carrier
/** a Moss-type LNG carrier: four spherical tanks whose upper halves stand above the deck under white covers on a skirt,
 *  a pipe trunk with a walkway along the tops, the deckhouse aft, a forecastle. 260 m. */
export function buildToyLNGCarrier({name = 'KESTREL FROST', port = 'NORTHBAY', hull = {}} = {}) {
  const M = mats();
  const group = new THREE.Group();
  const L = 260;
  const B = 44;
  const T = 11;
  const F = 13;
  const H = hullForm({L, B, T, F, bow: 0.18, stern: 0.15, rake: 0.05, bilge: 0.07, transom: 0.85, rise: 0.55, flare: 1.0, entry: 1.7, sheer: 4.0, sheerLen: 0.08, bulb: 0.028, bulbB: 0.17, ...hull});
  tpl(`lng|${name}${hullKey(hull)}`, (P) => {
    addHull(P, H, {bands: [{to: 0.8, color: SC.antifoul}, {color: SC.navy}]});
    const R = 19;
    const xs = [-56, -16, 24, 64];
    const cover = paint(SC.white, 0.5);
    for (const x of xs) {
      P.cyl(paint('#e9edf8', 0.5), R * 0.98, R * 0.98, 5, x, F + 2.5, 0, 'y', 40);
      const dome = new THREE.SphereGeometry(R, 40, 16, 0, PI * 2, 0, PI / 2);
      P.add(cover, dome, x, F + 4.8, 0, 0, 0, 0, 1, 0.82, 1);
      P.cyl(toyMat('#c9cfe0', {rough: 0.5}), 2, 2.2, 3, x, F + 4.8 + R * 0.82, 0, 'y', 16);
    }
    // the pipe trunk running over the dome tops with its walkway
    const ty = F + 4.8 + R * 0.82 + 1.4;
    P.ext(toyMat(SC.deckGrey, {rough: 0.7}), xs[0] - 6, xs[3] + 4, ty, ty + 0.5, -1.4, 1.4, 0.1);
    for (const x of xs) P.cyl(M.white, 0.5, 0.5, 4, x + R - 2, ty - 2, 0, 'y', 8);
    P.cyl(toyMat('#c9cfe0', {rough: 0.45}), 0.5, 0.5, xs[3] - xs[0] + 10, (xs[0] + xs[3]) / 2, ty + 0.9, 1.8, 'x', 10);
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) P.cyl(toyMat('#c9cfe0', {rough: 0.45}), 0.4, 0.4, 14, 4 + k * 2, F + 1.2, s * 15, 'z', 10);
    forecastle(P, H, {len: 0.07, h: 2.6, color: SC.navy});
    const x0 = H.xa + 8;
    const top = house(P, {x0, x1: x0 + 20, y0: F, tiers: 5, th: 2.9, hw: B * 0.3, wing: B / 2 + 0.3});
    radarMast(P, x0 + 7, top, 6, 3);
    funnel(P, {x: x0 + 3, y: top - 1, h: 7, l: 5.5, w: 6.5, color: SC.white, band: TOY.teal, mark: 'kestrel'});
    lifeboat(P, H.xa + 2.5, F + 4.5, 0, {len: 8, freefall: true, ry: PI});
    hullText(P, H, 'LNG', 60, F - 4, 4.5);
    hullText(P, H, name, H.xf - 22, F - 2.4, 1.6);
    sternText(P, H, name, port);
  }, group);
  return {group, draft: T, length: L, beam: B, hull: H};
}

// ================================================================ 7 · passenger ship
/** a cruise / passenger ship: a white hull with a blue boot-top, a superstructure of ten decks stepping down at the
 *  bow and the stern, balcony glass on every deck, a row of orange lifeboats in davits each side, a pool deck aft, the
 *  bridge forward with wings, the funnel aft. 230 m. */
export function buildToyPassengerShip({name = 'AURORA STAR', port = 'NORTHBAY', hull = {}} = {}) {
  const M = mats();
  const group = new THREE.Group();
  const L = 230;
  const B = 30;
  const T = 7.5;
  const F = 9;
  const H = hullForm({L, B, T, F, bow: 0.22, stern: 0.16, rake: 0.08, bilge: 0.1, transom: 0.8, rise: 0.5, flare: 1.4, entry: 2.0, sheer: 1.2, sheerLen: 0.1, bulb: 0.03, bulbB: 0.16, bulbZ: 0.5, ...hull});
  tpl(`cruise|${name}${hullKey(hull)}`, (P) => {
    addHull(P, H, {bands: [{to: -0.4, color: SC.navy}, {to: 1.4, color: TOY.blue}, {color: SC.white}], deck: '#e2e7f6'});
    // hull windows
    for (const y of [2.6, 5.2]) for (const s of [-1, 1]) P.ext(M.glass, H.xsb + 4, H.xb - 4, y, y + 0.9, s * H.hb - 0.06, s * H.hb + 0.06, 0.1);
    const wall = paint(SC.white, 0.5);
    const deckH = 3;
    const decks = 10;
    const x0 = H.xa + 18;
    const x1 = H.xf - 46;
    for (let k = 0; k < decks; k++) {
      const y = F + k * deckH;
      const a = x0 + Math.max(0, k - 6) * 6;
      const b = x1 - Math.max(0, k - 3) * 3.5;
      const w = B / 2 - 0.6 - (k > 7 ? 2 : 0);
      P.ext(wall, a, b, y, y + deckH + 0.05, -w, w, 0.5);
      P.ext(M.glass, a + 2, b - 2, y + 1.0, y + 2.3, w - 0.06, w + 0.06, 0.1);
      P.ext(M.glass, a + 2, b - 2, y + 1.0, y + 2.3, -w - 0.06, -w + 0.06, 0.1);
      P.ext(M.glass, b - 0.06, b + 0.06, y + 1.0, y + 2.3, -w * 0.8, w * 0.8, 0.1);
    }
    // the rounded front of the superstructure and the bridge with wings
    const by = F + 6 * deckH;
    P.ext(wall, x1 - 3.5 * 3, x1 - 3.5 * 3 + 6, by, by + 3.6, -B / 2 - 0.4, B / 2 + 0.4, 0.4);
    P.ext(M.glass, x1 - 3.5 * 3 + 5.9, x1 - 3.5 * 3 + 6.06, by + 1.2, by + 3, -B / 2, B / 2, 0.08);
    // lifeboats in davits along deck 2 each side
    for (let x = x0 + 14; x < x1 - 12; x += 10) for (const s of [-1, 1]) lifeboat(P, x, F + 4.5, s * (B / 2 + 0.6), {len: 8.5});
    // the pool deck aft: blue pool, a sun deck
    const py = F + decks * deckH;
    P.ext(toyMat('#e2e7f6', {rough: 0.8}), x0 + 24, x1 - 40, py, py + 0.3, -B / 2 + 3, B / 2 - 3, 0.1);
    P.ext(toyMat('#5fc3f0', {rough: 0.2}), x0 + 36, x0 + 50, py + 0.2, py + 0.4, -4, 4, 0.4);
    // a second pool on the aft terrace of the main deck, behind the superstructure
    P.ext(toyMat('#5fc3f0', {rough: 0.2}), H.xa + 6, H.xa + 14, F + 0.05, F + 0.3, -5, 5, 0.4);
    funnel(P, {x: x0 + 22, y: py, h: 10, l: 12, w: 7, color: SC.white, band: TOY.blue, mark: 'aurora'});
    radarMast(P, x1 - 18, py, 7, 4);
    hullText(P, H, name, H.xf - 30, F - 1.6, 1.8, SC.navy);
    hullText(P, H, 'AURORA CRUISES', -10, 0.5 + F * 0.12, 1.8, SC.white);
    sternText(P, H, name, port, SC.navy);
  }, group);
  return {group, draft: T, length: L, beam: B, hull: H};
}

// ================================================================ 8 · Ro-Ro
/** a pure car and truck carrier: a tall box hull with near-vertical sides and a blunt rounded bow, white above and
 *  blue below, the bridge forward on the top, the funnel aft, a big stern quarter ramp folded down to the quay and a
 *  side door. 200 m. */
export function buildToyRoRo({name = 'KESTREL HIGHWAY', port = 'NORTHBAY', ramp = 1, hull = {}} = {}) {
  const M = mats();
  const group = new THREE.Group();
  const L = 200;
  const B = 32;
  const T = 9;
  const F = 28;
  const H = hullForm({L, B, T, F, bow: 0.13, stern: 0.08, rake: 0.0, bilge: 0.06, transom: 0.96, rise: 0.45, flare: 3, entry: 1.25, sheer: 0, bulb: 0.028, bulbB: 0.17, ...hull});
  tpl(`roro|${name}|${ramp}${hullKey(hull)}`, (P) => {
    addHull(P, H, {bands: [{to: 0.8, color: SC.antifoul}, {to: 8, color: TOY.blue}, {color: SC.white}], deck: '#e2e7f6'});
    // deck lines (the car decks seen as faint bands), the line's name big along the side
    for (let k = 1; k < 7; k++) {
      const y = 8 + k * 3;
      P.ext(toyMat('#e3e8f6', {rough: 0.6}), H.xa + 8, H.xb - 2, y, y + 0.15, B / 2 - 0.05, B / 2 + 0.03, 0.02);
      P.ext(toyMat('#e3e8f6', {rough: 0.6}), H.xa + 8, H.xb - 2, y, y + 0.15, -B / 2 - 0.03, -B / 2 + 0.05, 0.02);
    }
    hullText(P, H, 'RO-RO', 10, 17, 7, TOY.blue);
    hullText(P, H, 'KESTREL', -50, 17, 4, TOY.blue);
    hullText(P, H, name, H.xf - 30, 4.2, 1.6);
    // the roof: bridge forward with wings, funnel aft, a mast
    const by = F;
    P.ext(paint(SC.white), H.xb - 16, H.xb + 2, by, by + 3.6, -B / 2 - 0.4, B / 2 + 0.4, 0.4);
    P.ext(M.glass, H.xb + 1.9, H.xb + 2.06, by + 1.2, by + 3.1, -B / 2, B / 2, 0.08);
    P.ext(paint(TOY.blue), H.xb - 16.1, H.xb + 2.1, by + 3.5, by + 4, -B / 2 - 0.5, B / 2 + 0.5, 0.15);
    radarMast(P, H.xb - 8, by + 4, 5, 3);
    funnel(P, {x: H.xa + 18, y: by, h: 6, l: 6, w: 8, color: SC.white, band: TOY.teal, mark: 'kestrel'});
    // the stern quarter ramp: hinged at the transom on the starboard quarter, angled out and down
    const rw = 12;
    const rl = 34;
    const hx = H.xa;
    const hz = B / 2 - rw / 2 - 1;
    const ang = 0.55;
    const down = 0.16 + (1 - ramp) * 1.2;
    const dir = V3(-Math.cos(ang), 0, Math.sin(ang));
    const c = V3(hx, 1.8, hz).addScaledVector(dir, rl / 2);
    c.y = 1.8 - Math.sin(down) * rl / 2;
    P.add(toyMat('#8a93ad', {rough: 0.6}), rb(rl, 0.6, rw, 0.2), c.x, c.y, c.z, 0, PI + ang, -down);
    P.add(M.ink, rb(0.4, 7, rw + 1, 0.1), hx - 0.2, 5, hz);
    // the side door
    P.ext(M.ink, 30, 40, 2.4, 8, B / 2 - 0.02, B / 2 + 0.05, 0.05);
    sternText(P, H, name, port, TOY.blue);
  }, group);
  return {group, draft: T, length: L, beam: B, hull: H};
}

// ================================================================ 9 · ferry (Ro-Pax)
/** a Ro-Pax ferry: a green and white hull with the car deck inside, the bow doors shut, the stern door down as a ramp, three passenger decks with window bands, the bridge forward with wings, twin funnels
 *  aft, lifeboats in davits. 120 m. */
export function buildToyFerry({name = 'NORTHBAY EXPRESS', port = 'NORTHBAY', open = 1, hull = {}} = {}) {
  const M = mats();
  const group = new THREE.Group();
  const L = 120;
  const B = 21;
  const T = 5;
  const F = 9;
  const H = hullForm({L, B, T, F, bow: 0.2, stern: 0.1, rake: 0.06, bilge: 0.1, transom: 0.95, rise: 0.4, flare: 1.4, entry: 1.8, sheer: 0.8, sheerLen: 0.12, bulb: 0.026, bulbB: 0.17, bulbZ: 0.5, ...hull});
  tpl(`ferry|${name}|${open}${hullKey(hull)}`, (P) => {
    addHull(P, H, {bands: [{to: 0.5, color: SC.antifoul}, {to: 4.5, color: SC.ferryGreen}, {color: SC.white}], deck: '#e2e7f6', twin: true});
    // the car deck opening at the stern and the stern ramp folded down
    P.ext(M.ink, H.xa - 0.05, H.xa + 0.1, 1.6, 7.2, -6, 6, 0.1);
    const sl = 12;
    const sd = 0.15 + (1 - open) * 1.4;
    P.add(toyMat('#8a93ad', {rough: 0.6}), rb(sl, 0.5, 11, 0.15), H.xa - Math.cos(sd) * sl / 2, 1.6 - Math.sin(sd) * sl / 2, 0, 0, 0, sd);
    hullText(P, H, name, 0, 2.6, 1.6, SC.white);
    // passenger decks
    const wall = paint(SC.white, 0.5);
    const x0 = H.xa + 8;
    const x1 = H.xf - 26;
    for (let k = 0; k < 3; k++) {
      const y = F + k * 3;
      const a = x0 + k * 4;
      const b = x1 - k * 3;
      const w = B / 2 - 0.5 - k * 0.5;
      P.ext(wall, a, b, y, y + 3.05, -w, w, 0.45);
      for (const s of [-1, 1]) P.ext(M.glass, a + 2, b - 2, y + 1, y + 2.2, s * w - 0.06, s * w + 0.06, 0.1);
      P.ext(M.glass, b - 0.06, b + 0.06, y + 1, y + 2.2, -w * 0.85, w * 0.85, 0.1);
      P.ext(toyMat(SC.ferryGreen, {rough: 0.6}), a, b, y + 2.95, y + 3.1, -w - 0.05, w + 0.05, 0.05);
    }
    // the bridge forward with wings
    const by = F + 9;
    P.ext(wall, x1 - 12, x1 - 6, by, by + 3.4, -B / 2 - 0.3, B / 2 + 0.3, 0.35);
    P.ext(M.glass, x1 - 6.1, x1 - 5.94, by + 1.1, by + 2.9, -B / 2, B / 2, 0.08);
    P.ext(paint(SC.ferryGreen), x1 - 12.1, x1 - 5.9, by + 3.3, by + 3.7, -B / 2 - 0.4, B / 2 + 0.4, 0.12);
    radarMast(P, x1 - 9, by + 3.7, 4, 2.2);
    for (const s of [-1, 1]) funnel(P, {x: x0 + 8, y: by - 3, z: s * 3.4, h: 8, l: 4.4, w: 2.8, color: SC.white, band: SC.ferryGreen});
    for (let x = x0 + 8; x < x1 - 8; x += 9) for (const s of [-1, 1]) lifeboat(P, x, F + 4.3, s * (B / 2 + 0.4), {len: 6.5});
    sternText(P, H, name, port);
  }, group);
  return {group, draft: T, length: L, beam: B, hull: H};
}

// ================================================================ harbour craft
/** an ASD harbour tug (about 28 m): a beamy hull with a high bow sheer, a heavy black cylinder fender on the bow and a
 *  fender belt round the sheer, the wheelhouse forward of midships with glass all round, twin exhausts behind it, a
 *  towing winch on the foredeck and a staple aft, two azimuth thrusters under the stern. Floats: origin at the
 *  waterline. bob(t) rocks it a touch. */
export function buildToyTugboat({name = 'NB TUG 3', hull = {}} = {}) {
  const M = mats();
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);
  const L = 26;
  const B = 11;
  const T = 2.6;
  const F = 2.4;
  const H = hullForm({L, B, T, F, bow: 0.4, stern: 0.22, rake: 0.25, bilge: 0.18, transom: 0.85, rise: 0.75, flare: 2.2, entry: 1.5, sheer: 1.6, sheerLen: 0.4, bulb: false, ...hull});
  tpl(`tug2|${name}${hullKey(hull)}`, (P) => {
    addHull(P, H, {bands: [{to: 0.4, color: SC.antifoul}, {to: 1.1, color: SC.rubber}, {color: TOY.blue}], deck: '#c9d1ea', prop: 0});
    const rub = toyMat(SC.rubber, {rough: 0.85});
    // the fender belt round the sheer and the bow cylinder fender
    const pts = [];
    for (const x of H.xs) pts.push(V3(x, H.deckY(x) - 0.45, H.w(x, H.deckY(x) - 0.45) + 0.15));
    const belt = new THREE.CatmullRomCurve3([...pts, ...pts.slice(0, -1).reverse().map((p) => V3(p.x, p.y, -p.z))]);
    P.add(rub, new THREE.TubeGeometry(belt, 200, 0.42, 8, false));
    const yt = H.deckY(H.xf) - 0.6;
    P.cyl(rub, 0.9, 0.9, B * 0.42, H.stemX(yt) - 0.5, yt, 0, 'z', 18);
    const yb = 0.2;
    P.bar(rub, [H.stemX(yt - 0.8) + 0.25, yt - 0.8, 0], [H.stemX(yb) + 0.25, yb, 0], 1.3);
    P.bar(rub, [H.stemX(yt - 0.8) - 0.4, yt - 0.8, 0.9], [H.stemX(yb) - 0.6, yb, 0.7], 0.9);
    P.bar(rub, [H.stemX(yt - 0.8) - 0.4, yt - 0.8, -0.9], [H.stemX(yb) - 0.6, yb, -0.7], 0.9);
    // bulwark with white top rail, the main deckhouse and the wheelhouse on it
    const dy = F;
    P.ext(M.white, -6, 5, dy, dy + 2.6, -3.4, 3.4, 0.45);
    P.ext(M.glass, 4.94, 5.06, dy + 1.1, dy + 2, -2.6, 2.6, 0.08);
    for (const s of [-1, 1]) P.ext(M.glass, -4.5, 3.8, dy + 1.1, dy + 2, s * 3.4 - 0.06, s * 3.4 + 0.06, 0.08);
    const wy = dy + 2.6;
    P.ext(M.white, -2.2, 4.2, wy, wy + 3, -3.6, 3.6, 0.4);
    P.ext(M.glass, -2.3, 4.32, wy + 1.0, wy + 2.5, -3.66, 3.66, 0.12);
    P.ext(paint(TOY.blue, 0.46), -2.4, 4.4, wy + 2.9, wy + 3.3, -3.8, 3.8, 0.12);
    // the mast on the wheelhouse roof with radar and lights
    P.cyl(M.white, 0.12, 0.14, 4.2, 1.2, wy + 5.4, 0, 'y', 8);
    P.ext(M.ink, 0.9, 1.5, wy + 4.0, wy + 4.2, -1.6, 1.6, 0.06);
    P.ext(M.white, 1.0, 1.4, wy + 6.4, wy + 6.6, -1.0, 1.0, 0.04);
    // twin exhausts behind the wheelhouse
    for (const s of [-1, 1]) {
      P.ext(paint(TOY.blue, 0.46), -5, -3.4, dy + 2.6, dy + 6.4, s * 2.2 - 0.6, s * 2.2 + 0.6, 0.35);
      P.ext(M.ink, -4.9, -3.5, dy + 6.3, dy + 6.6, s * 2.2 - 0.5, s * 2.2 + 0.5, 0.12);
    }
    // the towing winch on the foredeck, the staple and the towing hook aft
    P.cyl(paint(TOY.yellow), 0.8, 0.8, 3.2, 8.2, H.deckY(8.2) + 0.9, 0, 'z', 16);
    P.ext(M.ink, 7.4, 9, H.deckY(8.2), H.deckY(8.2) + 0.5, -2.2, 2.2, 0.1);
    P.bar(paint(TOY.yellow), [-9, F, -3], [-9, F + 2.6, -1.6], 0.4);
    P.bar(paint(TOY.yellow), [-9, F + 2.6, -1.6], [-9, F + 2.6, 1.6], 0.4);
    P.bar(paint(TOY.yellow), [-9, F + 2.6, 1.6], [-9, F, 3], 0.4);
    P.cyl(M.ink, 0.35, 0.35, 0.9, -11, F + 0.45, 0, 'y', 12);
    // two azimuth thrusters under the stern
    const brz = toyMat(SC.bronze, {rough: 0.35, metal: 0.4});
    for (const s of [-1, 1]) {
      P.cyl(M.ink, 0.3, 0.3, 1.2, -8.5, -T * 0.55 - 0.3, s * 2.4, 'y', 10);
      P.cyl(toyMat('#3a4358', {rough: 0.6}), 0.75, 0.6, 2.4, -8.5, -T * 0.55 - 1.1, s * 2.4, 'x', 18);
      P.cyl(brz, 0.32, 0.12, 0.8, -9.9, -T * 0.55 - 1.1, s * 2.4, 'x', 10);
    }
    hullText(P, H, name, 2, 1.7, 0.7);
    sternText(P, H, name, 'NORTHBAY');
  }, body);
  const bob = (t) => {
    body.position.y = 0.12 * Math.sin(t * 1.7);
    body.rotation.x = 0.015 * Math.sin(t * 1.3);
    body.rotation.z = 0.01 * Math.sin(t * 1.1 + 1);
  };
  bob(0);
  return {group, bob, draft: T + 2.4, length: L, beam: B, hull: H};
}

/** a pilot launch (about 16 m): a deep-V hull with a fine bow, a black D-fender collar all round, an orange
 *  superstructure with raked windows and PILOT on the sides, a mast with radar, rails round the foredeck so the pilot
 *  can step across. bob(t). */
export function buildToyPilotBoat({hull = {}} = {}) {
  const M = mats();
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);
  const L = 16;
  const B = 5.2;
  const T = 1.3;
  const F = 1.9;
  const H = hullForm({L, B, T, F, bow: 0.5, stern: 0.08, rake: 0.4, bilge: 0.05, transom: 0.92, rise: 0.25, flare: 1.4, entry: 1.6, sheer: 0.9, sheerLen: 0.4, bulb: false, ...hull});
  tpl(`pilot2${hullKey(hull)}`, (P) => {
    addHull(P, H, {bands: [{to: 0.15, color: SC.antifoul}, {to: 0.9, color: SC.black}, {color: SC.white}], deck: '#c9d1ea', prop: 0, twin: true});
    const rub = toyMat(SC.rubber, {rough: 0.85});
    const pts = [];
    for (const x of H.xs) pts.push(V3(x, H.deckY(x) - 0.35, H.w(x, H.deckY(x) - 0.35) + 0.15));
    const collar = new THREE.CatmullRomCurve3([...pts, ...pts.slice(0, -1).reverse().map((p) => V3(p.x, p.y, -p.z))]);
    P.add(rub, new THREE.TubeGeometry(collar, 160, 0.3, 8, false));
    // the superstructure: orange, raked front glass, PILOT on the sides, a white roof with the mast
    const o = paint(TOY.orange, 0.46);
    P.ext(o, -4.2, 2.4, F, F + 2.2, -1.9, 1.9, 0.35);
    P.add(M.glass, rb(0.15, 1.1, 3.4, 0.05), 2.6, F + 1.5, 0, 0, 0, -0.45);
    for (const s of [-1, 1]) P.ext(M.glass, -1.5, 2.0, F + 1.1, F + 1.9, s * 1.9 - 0.06, s * 1.9 + 0.06, 0.06);
    P.ext(M.white, -4.4, 2.6, F + 2.15, F + 2.4, -2.0, 2.0, 0.1);
    for (const s of [-1, 1]) P.text('PILOT', {fg: '#ffffff', px: 120}, 0.55, -2.8, F + 0.75, s * 1.92, s > 0 ? 0 : PI);
    P.cyl(M.white, 0.08, 0.1, 2.4, -1.5, F + 3.6, 0, 'y', 8);
    P.ext(M.ink, -1.8, -1.2, F + 3.0, F + 3.15, -0.9, 0.9, 0.04);
    // rails round the foredeck
    const rail = M.steel;
    for (let x = 3.2; x < 7; x += 1.2) for (const s of [-1, 1]) {
      const y = H.deckY(x);
      const z = H.w(x, y) - 0.25;
      if (z > 0.3) P.rod(rail, [x, y, s * z], [x, y + 0.9, s * z], 0.04);
    }
    hullText(P, H, 'PILOT', 4.2, F * 0.45, 0.6, SC.black);
  }, body);
  const bob = (t) => {
    body.position.y = 0.1 * Math.sin(t * 2.1);
    body.rotation.x = 0.02 * Math.sin(t * 1.6);
  };
  return {group, bob, draft: T + 0.5, length: L, beam: B, hull: H};
}

// ================================================================ where the hull meets the water
/** blotchy foam as an alpha map (white = foam, black = clear water), tiled along the hull; the fade outward comes
 *  from the vertex alpha */
const foamTex = (key, seed, streak) => {
  const tex = canvasTex(key, 512, 128, (g, w, h) => {
    g.fillStyle = '#000000';
    g.fillRect(0, 0, w, h);
    let s = seed;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 260; i++) {
      const x = rnd() * w;
      const y = Math.pow(rnd(), 1.4) * h;
      const r = (2 + rnd() * 9) * (1 - (0.6 * y) / h);
      g.fillStyle = `rgba(255,255,255,${0.55 + rnd() * 0.45})`;
      g.beginPath();
      g.ellipse(x, y, r * (streak ? 3.5 : 1.6), r, 0, 0, PI * 2);
      g.fill();
      // wrap the blotches that cross the seam so the tiling doesn't show
      if (x + r * 4 > w) g.ellipse(x - w, y, r * (streak ? 3.5 : 1.6), r, 0, 0, PI * 2), g.fill();
    }
  }, {repeat: true});
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
};

/** foam round a hull at its waterline: a ribbon from the hull out, widest at the bow, fading outward, drifting and
 *  breathing with t. y: the water in the ship's local frame (0 on the design waterline, -ride for a ship riding light).
 *  wake: the length of a wake trailing from the stern (for craft under way). Add the mesh to ship.group. */
export function buildWaterline(ship, {y = 0, width = null, bow = null, wake = 0} = {}) {
  const H = ship.hull;
  const W0 = width ?? clamp(H.B * 0.05, 0.6, 1.8);
  const BW = bow ?? clamp(H.B * 0.14, 1.2, 5);
  const side = [];
  for (const x of H.xs) {
    const w = H.w(x, y);
    if (w > 0.03) side.push([x, w]);
  }
  const loop = [...side, [H.stemX(y) + 0.05, 0], ...side.slice().reverse().map(([x, w]) => [x, -w])];
  const n = loop.length;
  const pos = [];
  const col = [];
  const uv = [];
  const idx = [];
  let u = 0;
  const bowK = (x) => smooth(clamp((x - (H.xf - 0.18 * H.L)) / (0.18 * H.L), 0, 1));
  for (let i = 0; i <= n; i++) {
    const p = loop[i % n];
    const a = loop[(i - 1 + n) % n];
    const b = loop[(i + 1) % n];
    let dx = b[0] - a[0];
    let dz = b[1] - a[1];
    const dl = Math.hypot(dx, dz) || 1;
    dx /= dl;
    dz /= dl;
    const wd = W0 + BW * bowK(p[0]);
    if (i > 0) u += Math.hypot(p[0] - loop[(i - 1) % n][0], p[1] - loop[(i - 1) % n][1]);
    pos.push(p[0], 0, p[1] + Math.sign(p[1]) * 0.04, p[0] - dz * wd, 0, p[1] + dx * wd);
    col.push(1, 1, 1, 0.95, 1, 1, 1, 0);
    uv.push(u / 18, 0, u / 18, 1);
  }
  for (let i = 0; i < n; i++) {
    const a = 2 * i;
    idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const tex = foamTex('foam-a', 11, false);
  const mat = new THREE.MeshBasicMaterial({color: '#ffffff', alphaMap: tex, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2});
  const mesh = new THREE.Group();
  const ring = new THREE.Mesh(geo, mat);
  ring.renderOrder = 8;
  // GTAO would treat the foam as a solid surface and darken it; its normal pass hides points and lines (isLine2),
  // so the foam passes as one. Nothing else reads the flag.
  ring.isLine2 = true;
  mesh.add(ring);
  mesh.position.y = y + 0.05;
  // the wake: a fan from the stern quarters, streaks running aft and fading with distance
  let wakeMat = null;
  let wakeTex = null;
  if (wake > 0) {
    const w0 = (side[0]?.[1] ?? H.B * 0.3) * 0.9;
    const N = 12;
    const wp = [];
    const wc = [];
    const wu = [];
    const wi = [];
    for (let i = 0; i <= N; i++) {
      const k = i / N;
      const x = H.xa - k * wake;
      const hw = w0 + k * wake * 0.36;
      const a = 0.85 * (1 - k) * (1 - k);
      wp.push(x, 0, -hw, x, 0, 0, x, 0, hw);
      wc.push(1, 1, 1, a * 0.6, 1, 1, 1, a, 1, 1, 1, a * 0.6);
      wu.push((k * wake) / 14, 0, (k * wake) / 14, 0.5, (k * wake) / 14, 1);
    }
    for (let i = 0; i < N; i++) for (const c of [0, 1]) {
      const a = 3 * i + c;
      wi.push(a, a + 3, a + 1, a + 1, a + 3, a + 4);
    }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3));
    wg.setAttribute('color', new THREE.Float32BufferAttribute(wc, 4));
    wg.setAttribute('uv', new THREE.Float32BufferAttribute(wu, 2));
    wg.setIndex(wi);
    wakeTex = foamTex('wake-a', 23, true);
    wakeTex.wrapT = THREE.RepeatWrapping;
    wakeMat = new THREE.MeshBasicMaterial({color: '#ffffff', alphaMap: wakeTex, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2});
    const wm = new THREE.Mesh(wg, wakeMat);
    wm.renderOrder = 8;
    wm.isLine2 = true;
    mesh.add(wm);
  }
  const tick = (t) => {
    tex.offset.x = t * 0.045;
    mat.opacity = 0.78 + 0.16 * Math.sin(t * 1.25 + H.L);
    ring.scale.set(1, 1, 1 + 0.03 * Math.sin(t * 1.25 + H.L));
    if (wakeTex) wakeTex.offset.x = -t * 0.35;
  };
  tick(0);
  return {mesh, tick};
}
