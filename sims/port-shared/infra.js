// Portline's infrastructure: the quay, the water, the ship-to-shore cranes, the container ship, the gate complex, the
// reefer racks, the high-mast lights, the terminal office. Same toy language as vehicles.js and the airport kit.
//
// World frame used by the port: x along the quay, the quay edge at z = QUAY_Z, water toward -z, the land toward +z.
// The quay top is y = 0, the water surface y = WATER.
//
//   buildToyWater({w, d, cx, cz})     -> {group, tick(t)} the layered see-through water with drifting ripples
//   buildToyQuay({x0, x1})            -> {group, tick(t)} quay wall, cope line, fenders, bollards, the crane rails, water;
//                                        tick(t) moves the ripples (a pure function of t)
//   buildToyQuayCrane({number})       -> {group, setTrolley(z), setHoist(y), setBoom(k), head()}
//                                        local: legs at x +-9, landside rail z = +10, waterside rail z = -10, boom over -z
//   buildToyShip({name})              -> {group, deckY, hatchY, bays, rows, bitts}   origin on the waterline, bow +x
//   buildToyGate({lanes})             -> {group, setBarrier(i, k)}   lanes: [{z, dir: +1 | -1, label}] along x, gate line x = 0
//   buildToyReeferRack({bays})        -> {group}       two-level plug-in gantry for reefer stacks
//   buildToyLightMast()               -> {group}
//   buildToyOffice()                  -> {group}       the terminal office with its roof sign
//   buildToyMooringLine(a, b)         -> mesh between two world points with a slight sag
import * as THREE from 'three';
import {TOY, toyMat} from '../airport-shared/style.js';
import {Parts, tpl, part, mats, extrude, cylG, textTex, decalMat, canvasTex, drawMark, LIVERY, sphere} from '../airport-shared/gse.js';
import {spreaderGeo, BOX} from './vehicles.js';
import {logoPlate} from './logos.js';

const PI = Math.PI;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const paint = (c, r = 0.5) => toyMat(c, {paint: true, rough: r});

export const QUAY_Z = -40;
// the water 4.2 m under the quay top (a real container quay stands 3-5 m above the water)
export const WATER = -4.2;
export const PORT_COLORS = {
  water: '#a3bbf3',
  waterDeep: '#7f9ce8',
  waterFloor: '#5f7fd6',
  concrete: '#c6d0ef',
  cope: '#f2b33a',
  rail: '#5d6888',
  hull: '#2c3b6e',
  hullLight: '#3a4c88',
  boot: '#f6f8fd',
  rubber: '#1f2433',
};
const PC = PORT_COLORS;

// ================================================================ the quay and the water
/** the water, w x d centred on (cx, cz): see buildToyQuay. Returns {group, tick(t)} */
export function buildToyWater({w = 2400, d = 900, cx = 0, cz = QUAY_Z - 450} = {}) {
  const group = new THREE.Group();
  // the water, see-through near the top: an opaque deep floor 5 m down, three thin tinted layers between it and the
  // surface so a hull fades bluer the deeper it goes, the surface itself half clear, and a soft swell and glint texture
  // over it that drifts with t
  const plane = (y, mat, shadow = false) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-PI / 2), mat);
    m.position.set(cx, y, cz);
    m.receiveShadow = shadow;
    m.renderOrder = 1;
    group.add(m);
    return m;
  };
  const tint = (color, opacity) => new THREE.MeshStandardMaterial({color, roughness: 0.4, transparent: true, opacity, depthWrite: false});
  plane(WATER - 5, new THREE.MeshStandardMaterial({color: PC.waterFloor, roughness: 0.9}));
  for (const [i, d] of [3.6, 2.2, 1.0].entries()) plane(WATER - d, tint(PC.waterDeep, 0.3 + i * 0.04)).renderOrder = 1 + i;
  plane(WATER, tint(PC.water, 0.5), true).renderOrder = 5;
  // the surface texture, two tiling layers (every mark is drawn wrapped so the tile has no seam):
  // swell = broad soft patches a little lighter and darker than the water, so it never reads as one flat colour;
  // glints = fine soft highlights of many lengths and strengths, the sun catching the wave crests
  const wrap = (w, h, x, y, r, draw) => {
    for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
      if (x + ox + r < 0 || x + ox - r > w || y + oy + r < 0 || y + oy - r > h) continue;
      draw(x + ox, y + oy);
    }
  };
  const swellTex = canvasTex('water-swell', 512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    let s = 31;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 46; i++) {
      const x = rnd() * w, y = rnd() * h, r = 40 + rnd() * 110;
      const light = rnd() > 0.5;
      const a = 0.05 + rnd() * 0.07;
      wrap(w, h, x, y, r, (px, py) => {
        const gr = g.createRadialGradient(px, py, 0, px, py, r);
        gr.addColorStop(0, light ? `rgba(225,235,255,${a})` : `rgba(70,95,190,${a})`);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr;
        g.save();
        g.translate(px, py);
        g.scale(1.8, 1); // stretched along the wind
        g.translate(-px, -py);
        g.beginPath();
        g.arc(px, py, r, 0, PI * 2);
        g.fill();
        g.restore();
      });
    }
  }, {repeat: true});
  const glintTex = (key, seed, n, alpha) => canvasTex(key, 512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    let s = seed;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    g.lineCap = 'round';
    g.filter = 'blur(1.2px)';
    // crests cluster loosely along wave rows; each is a small curved arc that thins out at both ends
    const rows = Array.from({length: 9}, () => rnd() * h);
    for (let i = 0; i < n; i++) {
      const x = rnd() * w;
      const y = rows[Math.floor(rnd() * rows.length)] + (rnd() - 0.5) * 34 + Math.sin(x / 40) * 6;
      const k = rnd();
      const l = 5 + k * k * 22; // mostly short, a few long
      const bend = -l * (0.18 + rnd() * 0.22); // arched like a crest
      const a = alpha * (0.2 + rnd() * 0.8);
      const lw = 0.8 + rnd() * 1.6;
      const col = rnd() > 0.3 ? '255,255,255' : '160,185,245';
      wrap(w, h, x, y, l + 6, (px, py) => {
        // a wide faint stroke and a narrow brighter one shorter in the middle: the arc tapers at its ends
        for (const [f, wd, aa] of [[0, lw, a * 0.55], [0.22, lw * 0.6, a]]) {
          g.lineWidth = wd;
          g.strokeStyle = `rgba(${col},${aa})`;
          g.beginPath();
          g.moveTo(px + l * f, py + bend * f * 1.6);
          g.quadraticCurveTo(px + l / 2, py + bend, px + l * (1 - f), py + bend * f * 1.6);
          g.stroke();
        }
      });
    }
  }, {repeat: true});
  const mats = [];
  const layer = (tex, rw, rd, y, order, opacity) => {
    tex.repeat.set(w / rw, d / rd);
    const mat = new THREE.MeshBasicMaterial({map: tex, transparent: true, depthWrite: false, opacity});
    mats.push(mat);
    plane(WATER + y, mat).renderOrder = order;
    return tex;
  };
  // the speeds follow the ship foam (buildWaterline runs its foam along the hull at ~0.8 m/s and pulses every ~5 s):
  // the near crests drift at that speed, the second wave train a little slower at an angle, the broad swell at half,
  // and the crests brighten and fade on the foam's beat, the two trains out of step, so the water and foam move as one
  const swell = layer(swellTex, 420, 300, 0.015, 6, 1);
  const g1 = layer(glintTex('water-glint-a', 7, 170, 0.6), 70, 52, 0.025, 7, 0.85);
  const g2 = layer(glintTex('water-glint-b', 19, 120, 0.4), 53, 41, 0.03, 8, 0.7);
  g2.rotation = 0.45; // a second wave train at an angle, so the crests don't all line up
  const v = (mps, tile) => mps / tile; // metres per second -> texture repeats per second
  const tick = (t) => {
    swell.offset.set(t * v(0.4, 420), t * v(0.25, 300));
    g1.offset.set(t * v(0.8, 70), t * v(0.5, 52));
    g2.offset.set(0.37 - t * v(0.6, 53), 0.21 + t * v(0.45, 41));
    mats[1].opacity = 0.85 * (0.8 + 0.2 * Math.sin(t * 1.25));
    mats[2].opacity = 0.7 * (0.8 + 0.2 * Math.sin(t * 1.25 + 2.1));
  };
  tick(0);
  return {group, tick};
}

export function buildToyQuay({x0 = -170, x1 = 170, railZ = [-36, -16]} = {}) {
  const M = mats();
  const group = new THREE.Group();
  const L = x1 - x0;
  const cx = (x0 + x1) / 2;
  const water = buildToyWater();
  group.add(water.group);
  const tick = water.tick;
  tpl(`quay|${x0}|${x1}`, (P) => {
    const conc = toyMat(PC.concrete, {rough: 0.9});
    // the wall face down into the water, the cope beam, the yellow edge line
    P.ext(conc, x0, x1, WATER - 4, 0.02, QUAY_Z - 0.8, QUAY_Z + 0.6, 0.1);
    P.ext(toyMat(PC.cope, {rough: 0.7}), x0, x1, 0.02, 0.07, QUAY_Z + 0.7, QUAY_Z + 1.1, 0.02);
    // bollards every 12 m and the fender panels on the face between them
    for (let x = x0 + 6; x < x1; x += 12) {
      P.cyl(toyMat('#2b3248', {rough: 0.6}), 0.32, 0.38, 0.75, x, 0.38, QUAY_Z + 0.25, 'y', 16);
      P.add(toyMat('#2b3248', {rough: 0.6}), sphere(0.42), x, 0.78, QUAY_Z + 0.25, 0, 0, 0, 1, 0.45, 1);
      P.ext(toyMat(PC.rubber, {rough: 0.85}), x + 4.2, x + 7.8, WATER - 0.4, -0.5, QUAY_Z - 1.4, QUAY_Z - 0.7, 0.25);
      P.ext(toyMat('#e5484d', {rough: 0.6}), x + 4.4, x + 7.6, -0.62, -0.5, QUAY_Z - 1.42, QUAY_Z - 0.9, 0.04);
    }
    // the crane rails: a concrete beam, a dark rail on it, clamps
    for (const z of railZ) {
      P.ext(toyMat('#bcc7ea', {rough: 0.9}), x0, x1, 0.01, 0.05, z - 0.9, z + 0.9, 0.02);
      P.ext(toyMat(PC.rail, {rough: 0.4, metal: 0.3}), x0, x1, 0.05, 0.2, z - 0.14, z + 0.14, 0.03);
      for (let x = x0 + 2; x < x1; x += 4) P.ext(toyMat(PC.rail, {rough: 0.5}), x - 0.2, x + 0.2, 0.05, 0.14, z - 0.4, z + 0.4, 0.02);
    }
    // the lane markings under the cranes and the hatch-cover strip markings
    for (const z of [-30, -26, -22]) for (let x = x0; x < x1; x += 9) P.ext(toyMat(TOY.lane, {rough: 0.9}), x, x + 4, 0.02, 0.05, z + 1.95, z + 2.15, 0.01);
    P.ext(toyMat(PC.cope, {rough: 0.7}), x0, x1, 0.02, 0.06, railZ[1] + 1.3, railZ[1] + 1.55, 0.01);
    P.ext(toyMat(PC.cope, {rough: 0.7}), x0, x1, 0.02, 0.06, railZ[0] - 1.55, railZ[0] - 1.3, 0.01);
  }, group);
  return {group, length: L, cx, tick};
}

/** a mooring rope from a to b (world points), sagging a little */
export function buildToyMooringLine(a, b) {
  const mid = a.clone().lerp(b, 0.5);
  mid.y -= 0.12 * a.distanceTo(b) * 0.15;
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.11, 6, false), toyMat('#e9d9b8', {rough: 0.8}));
  m.castShadow = true;
  return m;
}

// ================================================================ ship-to-shore quay crane
export const QC = {top: 21, gird: 22.6, apex: 36, outreach: -56, back: 24, legX: 9, rail: 10};
/** the STS crane in the reference's toy finish: white legs and girders on blue sill beams and bogies, an A-frame with
 *  forestays to the boom tip and backstays to the backreach, the machinery house on the backreach, the trolley with the
 *  operator's cab under it, a headblock and a yellow 40 ft spreader on 4 ropes. The outreach boom hinges up at the
 *  waterside leg (setBoom(1) = stowed, nearly vertical). setTrolley(z) in local z, setHoist(y) the spreader's underside. */
export function buildToyQuayCrane({number = '02', lift = 0} = {}) {
  const M = mats();
  const group = new THREE.Group();
  // lift raises the portal, the girders and the A-frame (a taller crane for bigger ships); 0 = the film's crane
  const {outreach, back, legX, rail} = QC;
  const top = QC.top + lift;
  const gird = QC.gird + lift;
  const apex = QC.apex + lift;
  const white = M.white;
  const blue = paint(TOY.blue, 0.46);
  const deep = paint(TOY.blueDeep, 0.5);
  tpl(`qc|${number}${lift ? '|' + lift : ''}`, (P) => {
    // the bogies and the sill beams along the rails
    for (const z of [-rail, rail]) {
      P.ext(blue, -legX - 2.6, legX + 2.6, 0.9, 2.3, z - 0.9, z + 0.9, 0.3);
      for (const xs of [-1, 1]) for (const dx of [-1.6, 0, 1.6]) P.cyl(M.ink, 0.5, 0.5, 0.5, xs * legX + dx, 0.55, z, 'z', 16);
      for (const xs of [-1, 1]) P.ext(toyMat('#e5484d', {rough: 0.5}), xs * (legX + 2.62) - 0.06, xs * (legX + 2.62) + 0.06, 1.0, 2.2, z - 0.7, z + 0.7, 0.02);
    }
    // 4 legs, the portal cross ties high up (lanes stay clear underneath), the portal beams at the top
    for (const xs of [-1, 1]) {
      for (const z of [-rail, rail]) P.bar(white, [xs * legX, 2.2, z], [xs * legX, top, z], 1.5);
      P.bar(white, [xs * legX, 14.0, -rail], [xs * legX, 14.0, rail], 0.9);
      if (lift > 6) P.bar(white, [xs * legX, 14.0 + lift * 0.6, -rail], [xs * legX, 14.0 + lift * 0.6, rail], 0.8);
      P.bar(white, [xs * legX, top - 0.6, -rail], [xs * legX, top - 0.6, rail], 1.3);
    }
    for (const z of [-rail, rail]) P.bar(white, [-legX, top - 0.4, z], [legX, top - 0.4, z], 1.2);
    // the backreach girders (the outreach is a separate hinged group)
    for (const s of [-1, 1]) P.ext(white, -2.6 * s - 0.55, -2.6 * s + 0.55, top + 0.2, gird + 0.6, -rail, back, 0.25);
    for (let z = -rail + 4; z < back; z += 6) P.ext(white, -2.6, 2.6, gird - 0.1, gird + 0.3, z - 0.3, z + 0.3, 0.1);
    // the machinery house on the backreach, blue roof band, the brand
    P.ext(white, -4.2, 4.2, gird + 0.6, gird + 5.2, back - 10, back - 0.6, 0.4);
    P.ext(blue, -4.3, 4.3, gird + 4.8, gird + 5.5, back - 10.1, back - 0.5, 0.2);
    for (const s of [-1, 1]) logoPlate(P, 'blue', 1.0, s * 4.22, gird + 3.0, back - 5.3, s * PI / 2);
    P.text(`QC ${number}`, {fg: '#1d2748', px: 120}, 1.0, 0, gird + 3.0, back - 0.58);
    // the A-frame over the waterside legs, backstays down to the backreach end
    for (const xs of [-1, 1]) {
      P.bar(white, [xs * 2.8, gird + 0.4, -rail], [xs * 1.2, apex, -rail + 1.5], 1.0);
      P.bar(white, [xs * 2.8, gird + 0.4, -rail + 7], [xs * 1.2, apex, -rail + 1.5], 0.8);
      P.bar(deep, [xs * 1.2, apex, -rail + 1.5], [xs * 2.6, gird + 0.6, back - 1], 0.32);
    }
    P.ext(white, -1.8, 1.8, apex - 0.6, apex + 0.6, -rail + 0.8, -rail + 2.2, 0.25);
    P.beacon(0, apex + 0.6, -rail + 1.5, 0.22);
    // stairs tower on one landside leg, the electrical room
    P.ext(deep, legX + 1.0, legX + 2.6, 2.4, top - 1, rail - 0.8, rail + 0.8, 0.2);
    P.ext(white, legX - 3.5, legX + 1.0, 14.6, 18.0, rail - 1.4, rail + 1.4, 0.3);
  }, group);
  // the outreach boom on its hinge at the waterside girder end
  const boom = new THREE.Group();
  boom.position.set(0, gird, -rail);
  group.add(boom);
  const Lout = -outreach - rail;
  tpl(`qc-boom`, (P) => {
    for (const s of [-1, 1]) P.ext(white, -2.6 * s - 0.55, -2.6 * s + 0.55, -2.4, 0.6, -Lout, 0.2, 0.25);
    for (let z = -4; z > -Lout; z -= 6) P.ext(white, -2.6, 2.6, -0.1, 0.3, z - 0.3, z + 0.3, 0.1);
    P.ext(blue, -3.2, 3.2, -2.6, 0.7, -Lout - 0.6, -Lout + 0.4, 0.2);
    // the forestays from the tip back up to the apex are drawn in world frame below (they follow the hinge)
    P.beacon(0, 0.7, -Lout + 0.2, 0.18);
  }, boom);
  const stays = [-1, 1].map(() => part(cylG(0.16, 0.16, 1, 8), deep, group));
  // trolley, cab, headblock, spreader, ropes
  const trolley = new THREE.Group();
  trolley.position.y = gird;
  group.add(trolley);
  tpl('qc-trolley', (P) => {
    P.ext(white, -3.4, 3.4, -0.4, 1.2, -2.2, 2.2, 0.3);
    for (const s of [-1, 1]) P.cyl(M.ink, 0.35, 0.35, 0.4, s * 2.6, -0.1, 0, 'x', 14);
    // the operator's cab under the trolley, on the waterside, glass down and front
    P.ext(blue, -2.8, -0.4, -3.6, -0.4, -2.4, 0.4, 0.3);
    P.ext(M.glass, -2.7, -0.5, -3.5, -1.0, -2.46, -1.0, 0.12);
    P.ext(M.glass, -2.7, -0.5, -3.66, -3.5, -2.2, 0.2, 0.06);
  }, trolley);
  const head = new THREE.Group();
  group.add(head);
  tpl('qc-head', (P) => {
    // the box lies along x (parallel to the quay)
    const sub = new Parts();
    spreaderGeo(sub, BOX.L40, {headY: 1.3});
    for (const [mat, list] of sub.map) for (const g of list) P.put(mat, g, new THREE.Matrix4().makeRotationY(PI / 2));
    P.ext(M.ink, -1.4, 1.4, 1.2, 1.9, -0.8, 0.8, 0.2);
  }, head);
  const ropes = [-2.4, 2.4].flatMap((x) => [-0.9, 0.9].map((z) => {
    const c = part(cylG(0.05, 0.05, 1, 6), M.ink, group);
    c.userData = {x, z};
    return c;
  }));
  let tz = -30;
  let hy = 14;
  let bk = 0;
  const tipW = V3();
  const sync = () => {
    boom.rotation.x = bk * (PI * 0.44);
    // the forestays: apex to the boom tip
    const tip = V3(0, 0.4, -Lout).applyAxisAngle(V3(1, 0, 0), boom.rotation.x).add(boom.position);
    tipW.copy(tip);
    stays.forEach((m, i) => {
      const xs = i ? 1 : -1;
      const a = V3(xs * 1.2, apex, -rail + 1.5);
      const b = V3(xs * 2.4, tip.y, tip.z);
      const d = b.clone().sub(a);
      m.position.copy(a).addScaledVector(d, 0.5);
      m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.clone().normalize());
      m.scale.set(1, d.length(), 1);
    });
    const show = bk < 0.02;
    trolley.visible = head.visible = show || tz > -rail;
    trolley.position.z = tz;
    head.position.set(0, hy, tz);
    for (const c of ropes) {
      c.visible = trolley.visible;
      const len = gird - 0.4 - (hy + 1.9);
      c.position.set(c.userData.x, hy + 1.9 + len / 2, tz + c.userData.z);
      c.scale.y = Math.max(0.05, len);
    }
  };
  const setTrolley = (z) => {
    tz = clamp(z, outreach + 2, back - 12);
    sync();
  };
  const setHoist = (y) => {
    hy = clamp(y, 0, gird - 5);
    sync();
  };
  const setBoom = (k) => {
    bk = clamp(k, 0, 1);
    sync();
  };
  sync();
  return {group, setTrolley, setHoist, setBoom, head, tip: () => tipW.clone()};
}

// ================================================================ the container ship
// lives in ships.js with the other vessels; re-exported here for the world's imports
export {SHIP, buildToyShip} from './ships.js';

// ================================================================ the gate complex
/** the in/out gate: a blue canopy over the lanes on round columns, a white kiosk with glass on each island, a barrier
 *  arm per lane, an OCR portal (camera frame) 18 m before the gate line on each lane, a weighbridge plate under the
 *  canopy, lane arrows and the gate sign. Lanes run along x; dir +1 = eastbound (+x). */
export function buildToyGate({lanes = [{z: -2, dir: 1, label: 'OUT 1'}, {z: 2, dir: 1, label: 'OUT 2'}], name = 'GATE 2'} = {}) {
  const M = mats();
  const group = new THREE.Group();
  const zs = lanes.map((l) => l.z);
  const z0 = Math.min(...zs) - 3.2;
  const z1 = Math.max(...zs) + 3.2;
  const islands = [z0, ...lanes.slice(0, -1).map((l, i) => (l.z + lanes[i + 1].z) / 2), z1];
  tpl(`gate|${lanes.map((l) => l.z + ':' + l.dir).join(',')}`, (P) => {
    const blue = paint(TOY.blue, 0.46);
    // the canopy, its fascia with the sign, the columns
    P.ext(M.white, -6, 6, 7.4, 8.2, z0 - 1, z1 + 1, 0.3);
    P.ext(blue, -6.1, 6.1, 8.1, 9.4, z0 - 1.1, z1 + 1.1, 0.35);
    // the gate's name and the operator's logo (white on the blue fascia), reading left to right from either side
    for (const s of [-1, 1]) {
      const zc = (z0 + z1) / 2;
      P.text(name, {fg: '#ffffff', px: 120}, 0.8, s * 6.12, 8.75, zc + s * 2.2, s * PI / 2);
      logoPlate(P, 'white', 0.62, s * 6.12, 8.72, zc - s * 1.9, s * PI / 2);
    }
    for (const z of islands) {
      // the island kerb, the kiosk, the columns
      P.ext(toyMat('#e9edf8', {rough: 0.9}), -9, 9, 0, 0.3, z - 0.9, z + 0.9, 0.12);
      for (const x of [-4.8, 4.8]) P.cyl(M.white, 0.3, 0.3, 7.4, x, 3.9, z, 'y', 14);
      P.ext(M.white, -1.4, 1.4, 0.3, 3.2, z - 0.75, z + 0.75, 0.25);
      P.ext(M.glass, -1.42, 1.42, 1.5, 2.8, z - 0.6, z + 0.6, 0.12);
      P.ext(blue, -1.5, 1.5, 3.15, 3.4, z - 0.85, z + 0.85, 0.08);
    }
    // the barrier posts: on the island at each lane's -z side, at the lane's entry end
    lanes.forEach((l, i) => P.ext(toyMat('#f6f8fd', {rough: 0.5}), 7 * l.dir - 0.4, 7 * l.dir + 0.4, 0.3, 1.6, islands[i] - 0.2, islands[i] + 0.6, 0.15));
    for (const l of lanes) {
      // the weighbridge plate, the lane arrow, the OCR portal before the gate
      P.ext(toyMat('#aab6dc', {rough: 0.6, metal: 0.2}), -9, 9, 0.02, 0.07, l.z - 1.9, l.z + 1.9, 0.03);
      const ax = -l.dir * 14;
      P.add(decalMat(textTex(l.dir > 0 ? '→' : '←', {fg: '#ffffff', px: 140})), new THREE.PlaneGeometry(3.4, 2.4), ax, 0.06, l.z, -PI / 2, 0, 0);
      const ox = -l.dir * 20;
      for (const s of [-1, 1]) P.bar(M.white, [ox, 0, l.z + s * 2.6], [ox, 6.4, l.z + s * 2.6], 0.35);
      P.ext(M.white, ox - 0.35, ox + 0.35, 6.2, 6.8, l.z - 2.9, l.z + 2.9, 0.12);
      for (const dz of [-1.2, 0, 1.2]) P.ext(M.ink, ox - 0.5, ox + 0.3, 5.7, 6.2, l.z + dz - 0.22, l.z + dz + 0.22, 0.08);
      P.text('OCR', {fg: TOY.blue, px: 110}, 0.38, ox + l.dir * -0.37, 6.5, l.z, l.dir > 0 ? -PI / 2 : PI / 2);
    }
  }, group);
  // barrier arms: pivot at the post, arm across the lane
  const arms = lanes.map((l, i) => {
    const pivot = new THREE.Group();
    // the post on the island on the lane's -z side
    pivot.position.set(7.0 * l.dir, 1.35, islands[i] + 0.2);
    group.add(pivot);
    tpl('gate-arm', (P) => {
      P.ext(toyMat('#f6f8fd', {rough: 0.45}), -0.12, 0.12, -0.1, 0.1, 0, 5.4, 0.05);
      for (let k = 0; k < 4; k++) P.ext(toyMat('#e5484d', {rough: 0.5}), -0.13, 0.13, -0.11, 0.11, 0.6 + k * 1.3, 1.2 + k * 1.3, 0.04);
    }, pivot);
    return pivot;
  });
  const setBarrier = (i, k) => {
    if (arms[i]) arms[i].rotation.x = -clamp(k, 0, 1) * PI * 0.47;
  };
  lanes.forEach((_, i) => setBarrier(i, 0));
  return {group, setBarrier, islands, z0, z1};
}

// ================================================================ the reefer rack
/** a two-level steel gantry along x with walkways and ladders, plug panels with cables down to each reefer box */
export function buildToyReeferRack({bays = 5, pitch = 17} = {}) {
  const M = mats();
  const group = new THREE.Group();
  const L = bays * pitch;
  tpl(`reefer|${bays}`, (P) => {
    const steel = paint('#8fb0f7', 0.5);
    for (let i = 0; i <= bays; i++) {
      const x = -L / 2 + i * pitch;
      for (const z of [-1.0, 1.0]) P.bar(steel, [x, 0, z], [x, 8.2, z], 0.4);
    }
    for (const y of [3.7, 7.6]) {
      P.ext(toyMat('#d5ddf5', {rough: 0.8}), -L / 2, L / 2, y - 0.15, y + 0.1, -1.3, 1.3, 0.05);
      for (const z of [-1.3, 1.3]) P.ext(steel, -L / 2, L / 2, y + 1.0, y + 1.1, z - 0.05, z + 0.05, 0.02);
    }
    for (let i = 0; i < bays * 2; i++) {
      const x = -L / 2 + pitch / 4 + (i * pitch) / 2;
      for (const s of [-1, 1]) for (const y of [2.4, 6.2]) {
        P.ext(M.white, x - 0.5, x + 0.5, y - 0.4, y + 0.4, s * 1.45 - 0.1, s * 1.45 + 0.1, 0.06);
        P.ext(toyMat('#22b35f', {emissive: '#22b35f'}), x - 0.15, x + 0.15, y + 0.1, y + 0.25, s * 1.56 - 0.02, s * 1.56 + 0.02, 0.02);
      }
    }
    P.bar(M.ink, [L / 2 + 0.6, 0, 0], [L / 2 + 0.6, 7.7, 0], 0.18);
  }, group);
  return {group, length: L};
}

// ================================================================ high-mast light
export function buildToyLightMast({h = 26} = {}) {
  const M = mats();
  const group = new THREE.Group();
  tpl(`mast|${h}`, (P) => {
    P.cyl(toyMat('#c9d1ea', {rough: 0.6}), 0.9, 0.9, 0.6, 0, 0.3, 0, 'y', 16);
    P.cyl(M.white, 0.28, 0.5, h, 0, h / 2, 0, 'y', 14);
    P.add(M.white, new THREE.TorusGeometry(1.6, 0.18, 8, 24), 0, h, 0, PI / 2, 0, 0);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * PI * 2;
      P.ext(M.lamp, Math.cos(a) * 1.6 - 0.35, Math.cos(a) * 1.6 + 0.35, h - 0.5, h + 0.1, Math.sin(a) * 1.6 - 0.35, Math.sin(a) * 1.6 + 0.35, 0.1);
    }
  }, group);
  return {group};
}

// ================================================================ the terminal office
export function buildToyOffice({label = 'NORTHBAY CONTAINER TERMINAL'} = {}) {
  const M = mats();
  const group = new THREE.Group();
  tpl(`office|${label}`, (P) => {
    P.ext(M.white, -14, 14, 0, 12.6, -8, 8, 0.6);
    for (let k = 0; k < 3; k++) {
      P.ext(M.glass, -13.2, 13.2, 1.6 + k * 3.8, 3.8 + k * 3.8, 7.96, 8.06, 0.1);
      P.ext(M.glass, 13.96, 14.06, 1.6 + k * 3.8, 3.8 + k * 3.8, -7.2, 7.2, 0.1);
    }
    P.ext(paint(TOY.blue, 0.46), -14.2, 14.2, 12.4, 13.2, -8.2, 8.2, 0.25);
    P.ext(M.white, -6, 6, 13.2, 15.4, -1.8, 1.8, 0.2);
    logoPlate(P, 'blue', 1.3, 0, 14.3, 1.82);
    P.text(label, {fg: '#1d2748', px: 100}, 0.7, 0, 0.9, 8.08);
    // the entrance canopy
    P.ext(paint(TOY.blue, 0.46), -3.2, 3.2, 3.2, 3.5, 8, 10.6, 0.1);
  }, group);
  return {group};
}
