// Portline's machines: the container terminal's equipment, toy-scale in the airport kit's language (chunky bevels,
// matte paint with a soft clearcoat, dark tyres with light hubs, dark glass, crisp prints). Yellow only on the machines
// that lift (reach stacker, straddle carrier, empty handler, RTG, the spreaders); trucks in blue / white / teal.
//
// Toy metres, y up, nose toward +x, right side +z, origin on the ground at the vehicle's centre (or as noted).
// Scale contract (shared with infra.js): a 40 ft box is 16.0 x 3.6 x 3.4 (L x H x W), a 20 ft box 8.0; chassis decks at
// y = 1.5, so a box on a chassis tops out at 5.1. Every mover returns {group, roll(d), ...}.
//
//   buildToyContainer({len, color, id, line, logo, reefer}) -> {group, len, H, W}        origin: bottom centre;
//                                        logo: 'white' prints the Koneksea logo in place of the line's name
//   buildContainerField(list)                              -> {group, count}             instanced stacks
//   buildToyTerminalTractor({number})                      -> {group, roll, setSteer, fifth}   yard truck, 6.4 m
//   buildToyTerminalChassis()                              -> {group, roll, kingpin, deckY, len}  16.8 m, kingpin local x
//   buildToyPrimeMover({livery, number})                   -> {group, roll, setSteer, fifth}   road tractor, 7.6 m
//   buildToySkeletalTrailer()                              -> {group, roll, kingpin, deckY, len}  17.2 m
//   buildToyReachStacker({number})                         -> {group, roll, reach(x, y), tip()} spreader bottom target (local)
//   buildToyStraddleCarrier({number})                      -> {group, roll, setLift(y)}   spreader bottom y
//   buildToyEmptyHandler({number})                         -> {group, roll, setLift(y)}   top-lift frame bottom y
//   buildToyRTG({number})                                  -> {group, roll, setTrolley(z), setHoist(y)}  spans local z +-11
//   buildToyTugboat({name}), buildToyPilotBoat()           -> {group, bob(t)}
import * as THREE from 'three';
import {TOY, toyMat} from '../airport-shared/style.js';
import {Parts, tpl, part, axle, roller, steerer, mats, cab, extrude, profile, rb, cylG, textTex, decalMat, canvasTex, LIVERY, ram} from '../airport-shared/gse.js';
import {logoPlate} from './logos.js';

const PI = Math.PI;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const paint = (c, r = 0.5) => toyMat(c, {paint: true, rough: r});

export const BOX = {L40: 16.0, L20: 8.0, H: 3.6, W: 3.4};
export const CONTAINER_COLORS = {
  aurora: TOY.blue,
  kestrel: TOY.teal,
  white: '#eef1f8',
  sky: '#8fb0f7',
  navy: '#2c3b6e',
  orange: TOY.orange,
  lavender: '#b7c3ee',
  steel: '#9aa6c6',
};
const LINES = {aurora: 'AURORA LINE', kestrel: 'KESTREL', navy: 'NORTHBAY', white: '', sky: 'AURORA LINE', orange: 'CARGOVIVA', lavender: '', steel: ''};

// ================================================================ the container (a detailed one: the hero and the movers)
/** a corrugated ISO box: ribbed sides, top and bottom rails, 8 corner castings, doors with 4 lock rods at -x, the BIC
 *  code on the sides and doors, the line's name on the sides. reefer: a white machinery front with a grille at +x. */
export function buildToyContainer({len = BOX.L40, color = TOY.blue, id = 'AURU 482113 9', line = 'AURORA LINE', logo = null, reefer = false} = {}) {
  const M = mats();
  const group = new THREE.Group();
  const H = BOX.H;
  const W = BOX.W;
  const hl = len / 2;
  const hw = W / 2;
  const body = paint(color, 0.58);
  const deep = paint(new THREE.Color(color).multiplyScalar(0.78).getStyle(), 0.6);
  tpl(`box|${len}|${color}|${id}|${line}|${logo}|${reefer}`, (P) => {
    P.ext(body, -hl + 0.12, hl - 0.12, 0.18, H - 0.14, -hw + 0.06, hw - 0.06, 0.08);
    // corrugation: vertical ribs proud of each side
    const n = Math.floor((len - 0.8) / 0.62);
    for (let i = 0; i < n; i++) {
      const x = -hl + 0.5 + (i + 0.5) * ((len - 1.0) / n);
      for (const s of [-1, 1]) P.ext(deep, x - 0.13, x + 0.13, 0.32, H - 0.3, s * hw - 0.03, s * hw + 0.03, 0.03);
    }
    for (let i = 0; i < Math.floor(len / 1.2); i++) {
      const x = -hl + 0.6 + i * 1.2;
      P.ext(deep, x - 0.2, x + 0.2, H - 0.16, H - 0.08, -hw + 0.2, hw - 0.2, 0.03);
    }
    // rails and corner posts
    // everything stays inside the ISO envelope (len x H x W): the stacks sit 0.1 apart
    const zin = (s, a, b) => (s > 0 ? [hw - a, hw + b] : [-hw - b, -hw + a]);
    const xin = (s, a, b) => (s > 0 ? [hl - a, hl + b] : [-hl - b, -hl + a]);
    for (const s of [-1, 1]) {
      P.ext(deep, -hl, hl, 0.0, 0.26, ...zin(s, 0.12, 0.02), 0.05);
      P.ext(deep, -hl, hl, H - 0.24, H, ...zin(s, 0.12, 0.02), 0.05);
    }
    for (const xs of [-1, 1]) for (const s of [-1, 1]) P.ext(deep, ...xin(xs, 0.34, 0.0), 0, H, ...zin(s, 0.34, 0.0), 0.05);
    for (const xs of [-1, 1]) for (const s of [-1, 1]) for (const y of [0.14, H - 0.14]) P.ext(M.chassis, ...xin(xs, 0.42, 0.02), y - 0.14, y + 0.14, ...zin(s, 0.42, 0.02), 0.04);
    // doors at -x: two leaves, 4 lock rods with handles
    P.ext(deep, -hl - 0.04, -hl + 0.1, 0.26, H - 0.24, -hw + 0.18, hw - 0.18, 0.04);
    for (const z of [-1.2, -0.42, 0.42, 1.2]) {
      P.cyl(M.steel, 0.05, 0.05, H - 0.6, -hl - 0.09, H / 2, z, 'y', 8);
      P.ext(M.steel, -hl - 0.14, -hl - 0.06, 1.25, 1.33, z - 0.02, z + 0.3, 0.02);
    }
    P.ext(M.chassis, -hl - 0.06, -hl + 0.05, 0.3, H - 0.3, -0.03, 0.03, 0.01);
    // the reefer's machinery end at +x
    if (reefer) {
      P.ext(M.white, hl - 0.1, hl + 0.06, 0.26, H - 0.24, -hw + 0.18, hw - 0.18, 0.05);
      P.ext(M.chassis, hl + 0.04, hl + 0.1, 1.9, 3.0, -1.2, 0.2, 0.06);
      P.ext(M.ink, hl + 0.04, hl + 0.1, 0.6, 1.5, -1.2, 1.2, 0.06);
      P.ext(toyMat('#22b35f', {emissive: '#22b35f'}), hl + 0.06, hl + 0.12, 2.3, 2.5, 0.6, 1.0, 0.03);
    }
    // prints: the line on both sides, the BIC code top right on the sides and on the doors
    if (logo) for (const s of [-1, 1]) logoPlate(P, logo, Math.min(0.75, len * 0.05), s > 0 ? -len * 0.08 : len * 0.08, H * 0.52, s * (hw + 0.035), s > 0 ? 0 : PI);
    else if (line) for (const s of [-1, 1]) P.text(line, {fg: '#ffffff', px: 110}, Math.min(0.9, len * 0.06), s > 0 ? -len * 0.08 : len * 0.08, H * 0.52, s * (hw + 0.035), s > 0 ? 0 : PI);
    for (const s of [-1, 1]) P.text(id, {fg: '#ffffff', px: 80}, 0.34, s > 0 ? hl - 2.0 : -hl + 2.0, H - 0.55, s * (hw + 0.035), s > 0 ? 0 : PI);
    P.text(id, {fg: '#ffffff', px: 80}, 0.3, -hl - 0.15, H - 0.6, 0.7, -PI / 2);
    P.text(reefer ? '45R1' : len > 10 ? '45G1' : '22G1', {fg: '#ffffff', px: 80}, 0.26, -hl - 0.15, H - 0.95, 0.7, -PI / 2);
  }, group);
  return {group, len, H, W, roll() {}};
}

/** many boxes, one InstancedMesh per length (the stacks on the ship and in the yard).
 *  list: [{x, y, z, len, ry, color}] with (x, y, z) the bottom centre */
export function buildContainerField(list) {
  const group = new THREE.Group();
  const ribTex = canvasTex('ribs', 512, 64, (g, w, h) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      const x = (i + 0.5) * (w / 26);
      g.fillStyle = 'rgba(30,40,80,0.16)';
      g.fillRect(x - 4, 0, 8, h);
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.fillRect(x + 4, 0, 3, h);
    }
    g.fillStyle = 'rgba(30,40,80,0.22)';
    g.fillRect(0, 0, w, 5);
    g.fillRect(0, h - 5, w, 5);
  });
  const byLen = new Map();
  for (const b of list) {
    const k = b.len > 10 ? 40 : 20;
    if (!byLen.has(k)) byLen.set(k, []);
    byLen.get(k).push(b);
  }
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const col = new THREE.Color();
  for (const [k, items] of byLen) {
    const L = k === 40 ? BOX.L40 : BOX.L20;
    const geo = rb(L - 0.06, BOX.H - 0.04, BOX.W - 0.06, 0.1).clone();
    const mat = new THREE.MeshStandardMaterial({map: ribTex, roughness: 0.6});
    const im = new THREE.InstancedMesh(geo, mat, items.length);
    im.castShadow = im.receiveShadow = true;
    items.forEach((b, i) => {
      e.set(0, b.ry ?? 0, 0);
      q.setFromEuler(e);
      m4.compose(V3(b.x, (b.y ?? 0) + BOX.H / 2, b.z), q, V3(1, 1, 1));
      im.setMatrixAt(i, m4);
      im.setColorAt(i, col.set(b.color ?? TOY.blue));
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    group.add(im);
    // the dark top and bottom side rails, so the stacks read as separate boxes
    const rail = new THREE.InstancedMesh(rb(L, 0.24, 0.2, 0.05), toyMat('#2b3248', {rough: 0.7}), items.length * 4);
    rail.castShadow = false;
    rail.receiveShadow = true;
    const off = new THREE.Vector3();
    items.forEach((b, i) => {
      e.set(0, b.ry ?? 0, 0);
      q.setFromEuler(e);
      let k = 0;
      for (const y of [0.12, BOX.H - 0.12]) for (const s of [-1, 1]) {
        off.set(0, 0, s * (BOX.W / 2 - 0.06)).applyQuaternion(q);
        m4.compose(V3(b.x + off.x, (b.y ?? 0) + y, b.z + off.z), q, V3(1, 1, 1));
        rail.setMatrixAt(i * 4 + k++, m4);
      }
    });
    rail.instanceMatrix.needsUpdate = true;
    group.add(rail);
  }
  return {group, count: list.length};
}
export const lineOf = (key) => LINES[key] ?? '';

// ================================================================ terminal tractor (yard truck)
/** the single-seat yard tractor: a short chassis, an offset cab on the left, a lifting fifth wheel, a beacon, an
 *  exhaust stack behind the cab. Fleet blue with a white cab. */
export function buildToyTerminalTractor({number = '07'} = {}) {
  const M = mats();
  const group = new THREE.Group();
  const R = 0.62;
  tpl(`tt|${number}`, (P) => {
    // chassis and front hood
    P.ext(M.chassis, -3.0, 2.6, 0.55, 1.15, -1.0, 1.0, 0.1);
    P.add(paint(TOY.blue, 0.46), extrude('tt-body', () => profile(-0.4, 3.2, 0.6, 1.9, {arches: [[2.1, R, R + 0.14]], rc: [0.1, 0.3, 0.4, 0.1]}, 0.14), 2.8, 0.14));
    // the offset cab on the left (-z side seen from behind? no: the driver's side, -z)
    P.ext(M.white, -0.5, 1.9, 1.85, 4.05, -1.4, 0.2, 0.22);
    P.ext(M.glass, 1.82, 1.95, 2.55, 3.8, -1.25, 0.05, 0.05);
    P.ext(M.glass, -0.42, 1.6, 2.55, 3.8, -1.45, -1.37, 0.04);
    P.ext(M.glass, -0.42, 1.6, 2.55, 3.8, 0.17, 0.25, 0.04);
    P.ext(M.glass, -0.58, -0.48, 2.55, 3.7, -1.2, 0.0, 0.04);
    P.ext(paint(TOY.blue, 0.46), -0.55, 1.95, 4.0, 4.2, -1.45, 0.25, 0.08);
    P.beacon(0.7, 4.2, -0.6, 0.15);
    // exhaust stack, grab handles
    P.cyl(M.ink, 0.12, 0.12, 2.4, -0.7, 3.0, 0.75, 'y', 12);
    P.cyl(M.steel, 0.14, 0.14, 0.3, -0.7, 4.25, 0.75, 'y', 12);
    // the fifth wheel deck and its plate
    P.ext(M.ink, -3.0, -0.6, 1.1, 1.3, -1.2, 1.2, 0.06);
    P.add(M.steel, cylG(0.95, 0.95, 0.16, 28), -1.6, 1.4, 0);
    P.ext(M.ink, -2.5, -1.6, 1.43, 1.5, -0.12, 0.12, 0.02);
    // lamps, bumper, number
    for (const s of [-1, 1]) P.ext(M.lamp, 3.15, 3.24, 1.15, 1.4, s * 0.95 - 0.2, s * 0.95 + 0.2, 0.04);
    P.ext(M.rubber, 3.1, 3.45, 0.55, 0.95, -1.35, 1.35, 0.14);
    for (const s of [-1, 1]) P.ext(M.tail, -3.06, -2.98, 0.8, 1.0, s * 0.85 - 0.15, s * 0.85 + 0.15, 0.03);
    P.text(`TT-${number}`, {fg: TOY.blue, px: 110}, 0.42, 0.7, 3.25, -1.43, PI);
    P.text(`TT-${number}`, {fg: TOY.blue, px: 110}, 0.36, 2.2, 1.45, 1.42);
  }, group);
  const wheels = [];
  const steer = [];
  axle(group, wheels, R, 0.5, 2.1, 1.2, steer);
  axle(group, wheels, R, 0.6, -1.6, 1.15);
  return {group, roll: roller(wheels), setSteer: steerer(steer), fifth: V3(-1.6, 1.5, 0), length: 6.4};
}

/** the terminal chassis: a flat steel frame with 4 corner guides (cones) that seat a 40 ft box, a gooseneck front on
 *  the tractor's fifth wheel, one rear bogie. Origin at the deck centre on the ground; the kingpin at +x. */
export function buildToyTerminalChassis() {
  const M = mats();
  const group = new THREE.Group();
  const L = 16.8;
  const deckY = 1.5;
  tpl('tchassis', (P) => {
    for (const s of [-1, 1]) P.ext(M.chassis, -L / 2, L / 2 - 2.2, 0.9, 1.3, s * 0.65 - 0.2, s * 0.65 + 0.2, 0.06);
    // the gooseneck up over the fifth wheel
    P.ext(M.chassis, L / 2 - 2.6, L / 2, 1.3, 1.55, -0.9, 0.9, 0.08);
    for (let k = 0; k < 6; k++) P.ext(M.chassis, -L / 2 + 0.6 + k * 2.9, -L / 2 + 0.9 + k * 2.9, 1.0, 1.32, -1.65, 1.65, 0.05);
    // side rails and the deck guides
    for (const s of [-1, 1]) P.ext(paint(TOY.blue, 0.5), -L / 2, L / 2 - 2.5, 1.22, 1.48, s * 1.6 - 0.12, s * 1.6 + 0.12, 0.05);
    for (const xs of [-1, 1]) for (const s of [-1, 1]) {
      const x = xs > 0 ? L / 2 - 2.55 : -L / 2 + 0.25;
      P.ext(M.yellow, x - 0.25, x + 0.25, 1.3, 2.05, s * 1.7 - 0.12, s * 1.7 + 0.12, 0.05);
    }
    P.ext(M.ink, -L / 2 - 0.1, -L / 2 + 0.15, 0.6, 1.2, -1.6, 1.6, 0.05);
    for (const s of [-1, 1]) P.ext(M.tail, -L / 2 - 0.14, -L / 2 - 0.08, 0.8, 1.0, s * 1.3 - 0.15, s * 1.3 + 0.15, 0.03);
  }, group);
  const wheels = [];
  axle(group, wheels, 0.55, 0.5, -L / 2 + 2.2, 1.35);
  axle(group, wheels, 0.55, 0.5, -L / 2 + 3.5, 1.35);
  return {group, roll: roller(wheels), kingpin: L / 2 - 1.2, deckY, len: L, boxX: -1.0};
}

// ================================================================ road truck: prime mover + skeletal trailer
/** a cab-over road tractor in the box truck's cab, a long chassis with a fifth wheel, 3 axles (6x4) */
export function buildToyPrimeMover({livery = 'kestrel', number = '8812'} = {}) {
  const L = LIVERY[livery] ?? LIVERY.kestrel;
  const M = mats();
  const group = new THREE.Group();
  const R = 0.75;
  tpl(`pm|${livery}|${number}`, (P) => {
    cab(P, {x0: 1.0, x1: 3.95, top: 4.2, W: 3.5, color: L.cab, wheelX: 2.3, wheelR: R, stripe: L.stripe, seam: L.cab === TOY.white ? TOY.shade : TOY.blueDeep});
    P.ext(M.chassis, -3.8, 1.5, 0.95, 1.55, -1.05, 1.05, 0.08);
    // fuel tank, air tanks, the fifth wheel, mudguards
    for (const s of [-1, 1]) P.ext(M.steel, -0.3, 0.9, 0.7, 1.45, s * 1.35 - 0.3, s * 1.35 + 0.3, 0.25);
    P.add(M.ink, cylG(1.0, 1.0, 0.18, 28), -2.3, 1.62, 0);
    P.ext(M.ink, -3.0, -2.3, 1.65, 1.72, -0.14, 0.14, 0.02);
    for (const x of [-1.6, -3.0]) for (const s of [-1, 1]) P.ext(M.ink, x - 0.85, x + 0.85, 1.6, 1.72, s * 1.55 - 0.3, s * 1.55 + 0.3, 0.05);
    // exhaust behind the cab
    P.cyl(M.steel, 0.13, 0.13, 3.0, 0.75, 3.0, 1.35, 'y', 12);
    P.text(number, {fg: L.accent, px: 110}, 0.42, 2.4, 2.1, 1.77);
    P.text(number, {fg: L.accent, px: 110}, 0.42, 2.4, 2.1, -1.77, PI);
  }, group);
  const wheels = [];
  const steer = [];
  axle(group, wheels, R, 0.64, 2.3, 1.4, steer);
  axle(group, wheels, R, 0.64, -1.6, 1.5);
  axle(group, wheels, R, 0.64, -3.0, 1.5);
  return {group, roll: roller(wheels), setSteer: steerer(steer), fifth: V3(-2.3, 1.7, 0), length: 7.9};
}

/** a tall red cab-over road tractor: a high cab with a roof air deflector, a lighter sun visor over a big dark
 *  windshield, a chrome grille with horizontal slats, a grey lower body with the front wheel arch, a deep grey bumper
 *  with square lamps, a grey chassis with a side tank, 3 axles (6x4). Same fifth wheel as buildToyPrimeMover, so it
 *  drops onto the skeletal trailer unchanged. */
export function buildToyRedCabTractor({color = '#d8392f', number = '8812'} = {}) {
  const M = mats();
  const group = new THREE.Group();
  const R = 0.8;
  const red = paint(color, 0.45);
  const redDeep = paint(new THREE.Color(color).multiplyScalar(0.72).getStyle(), 0.5);
  const visor = paint(new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.22).getStyle(), 0.45);
  const grey = paint('#9da1ab', 0.5);
  const greyDeep = paint('#80848f', 0.55);
  const chrome = toyMat('#d9dde6', {rough: 0.25, metal: 0.55});
  const fx = 4.25; // the front face
  const hw = 1.78; // half the cab width
  tpl(`redcab|${color}|${number}`, (P) => {
    // the grey lower body round the front wheel, and the step box behind it
    P.add(grey, extrude('rc-lower', () => profile(0.85, fx + 0.05, 0.62, 2.05, {arches: [[2.7, R, R + 0.18]], rc: [0.12, 0.22, 0.1, 0.1]}, 0.14), 2 * hw + 0.06, 0.14));
    // the red cab: tall, front corners well rounded
    P.add(red, extrude('rc-cab', () => profile(0.9, fx, 1.95, 4.75, {rc: [0.08, 0.1, 0.55, 0.3]}, 0.2), 2 * hw, 0.2));
    // the roof air deflector: a hump rising toward the rear of the roof
    P.add(red, extrude('rc-deflector', () => profile(0.95, 3.1, 4.6, 5.75, {rc: [0.05, 0.05, 1.05, 0.25]}, 0.18), 2 * hw - 0.3, 0.18));
    // the darker band where the cab meets the lower body, the door seam and handle
    P.ext(redDeep, 0.9, fx - 0.05, 1.95, 2.12, -hw - 0.01, hw + 0.01, 0.04);
    for (const s of [-1, 1]) {
      const z0 = s > 0 ? hw - 0.02 : -hw - 0.015;
      const z1 = s > 0 ? hw + 0.015 : -hw + 0.02;
      P.ext(redDeep, 1.55, 1.6, 2.2, 4.45, z0, z1, 0.008);
      P.ext(M.ink, 2.05, 2.4, 2.75, 2.85, s > 0 ? hw - 0.02 : -hw - 0.05, s > 0 ? hw + 0.05 : -hw + 0.02, 0.02);
      // the side window and a small vent below it
      P.ext(M.glass, 2.75, 3.85, 3.2, 4.3, s > 0 ? hw - 0.04 : -hw - 0.03, s > 0 ? hw + 0.03 : -hw + 0.04, 0.08);
      P.ext(M.ink, 3.2, 3.42, 2.45, 2.7, s > 0 ? hw - 0.02 : -hw - 0.03, s > 0 ? hw + 0.03 : -hw + 0.02, 0.02);
      // the big mirror on its arm ahead of the door
      P.bar(M.ink, [fx - 0.35, 4.0, s * (hw - 0.1)], [fx - 0.2, 4.0, s * (hw + 0.42)], 0.08);
      P.ext(M.ink, fx - 0.32, fx - 0.08, 2.9, 4.15, s * (hw + 0.42) - 0.12, s * (hw + 0.42) + 0.12, 0.06);
      P.ext(M.glass, fx - 0.07, fx - 0.04, 3.0, 4.05, s * (hw + 0.42) - 0.09, s * (hw + 0.42) + 0.09, 0.02);
      // the fuel tank and the steps behind the front wheel
      P.cyl(chrome, 0.42, 0.42, 1.5, 0.25, 1.1, s * 1.55, 'x', 20);
      P.ext(greyDeep, 1.05, 1.75, 0.75, 0.86, s > 0 ? hw - 0.3 : -hw - 0.05, s > 0 ? hw + 0.05 : -hw + 0.3, 0.03);
    }
    // the windshield, slightly inset, and the sun visor over it
    P.ext(M.glass, fx - 0.08, fx + 0.035, 3.12, 4.32, -hw + 0.16, hw - 0.16, 0.1);
    P.add(visor, rb(0.95, 0.24, 2 * hw + 0.08, 0.1), fx + 0.12, 4.5, 0, 0, 0, -0.12);
    // the chrome grille: a frame wider at the top, dark inside, 6 horizontal slats
    P.ext(chrome, fx - 0.04, fx + 0.07, 1.65, 3.02, -1.02, 1.02, 0.12);
    P.ext(chrome, fx - 0.04, fx + 0.07, 2.62, 3.02, -1.12, 1.12, 0.12);
    P.ext(M.ink, fx + 0.03, fx + 0.09, 1.78, 2.9, -0.86, 0.86, 0.04);
    for (let k = 0; k < 6; k++) {
      const y = 1.86 + k * 0.18;
      P.ext(chrome, fx + 0.06, fx + 0.12, y, y + 0.08, -0.82, 0.82, 0.03);
    }
    // the deep grey bumper with square lamps at the corners, a lower air dam
    P.ext(grey, fx - 0.35, fx + 0.32, 0.6, 1.62, -hw - 0.08, hw + 0.08, 0.26);
    P.ext(greyDeep, fx + 0.2, fx + 0.34, 0.6, 0.78, -hw + 0.3, hw - 0.3, 0.06);
    for (const s of [-1, 1]) P.ext(toyMat('#f4f1e6', {rough: 0.3, emissive: '#fff4d0'}), fx + 0.28, fx + 0.36, 1.05, 1.38, s > 0 ? hw - 0.75 : -hw + 0.12, s > 0 ? hw - 0.12 : -hw + 0.75, 0.06);
    // the grey chassis behind the cab, the fifth wheel, mudguards over the tandem
    P.ext(greyDeep, -3.8, 1.0, 0.95, 1.5, -1.05, 1.05, 0.08);
    P.add(M.ink, cylG(1.0, 1.0, 0.18, 28), -2.3, 1.62, 0);
    P.ext(M.ink, -3.0, -2.3, 1.65, 1.72, -0.14, 0.14, 0.02);
    for (const x of [-1.6, -3.0]) for (const s of [-1, 1]) P.ext(grey, x - 0.85, x + 0.85, 1.55, 1.72, s * 1.55 - 0.32, s * 1.55 + 0.32, 0.06);
    // the exhaust stack behind the cab, the fleet number under the side window
    P.cyl(chrome, 0.13, 0.13, 3.6, 0.7, 3.4, 1.4, 'y', 12);
    P.text(number, {fg: '#ffffff', px: 110}, 0.38, 3.3, 2.45, hw + 0.03);
    P.text(number, {fg: '#ffffff', px: 110}, 0.38, 3.3, 2.45, -hw - 0.03, PI);
  }, group);
  const wheels = [];
  const steer = [];
  axle(group, wheels, R, 0.66, 2.7, 1.45, steer);
  axle(group, wheels, R, 0.66, -1.6, 1.5);
  axle(group, wheels, R, 0.66, -3.0, 1.5);
  return {group, roll: roller(wheels), setSteer: steerer(steer), fifth: V3(-2.3, 1.7, 0), length: 8.3};
}

/** the skeletal container trailer: two main beams, cross members, a gooseneck, 8 twistlocks, landing legs, 3 axles */
export function buildToySkeletalTrailer() {
  const M = mats();
  const group = new THREE.Group();
  const L = 17.2;
  const deckY = 1.5;
  tpl('skel', (P) => {
    for (const s of [-1, 1]) P.ext(M.chassis, -L / 2, L / 2 - 0.2, 1.05, 1.45, s * 0.55 - 0.16, s * 0.55 + 0.16, 0.05);
    P.ext(M.chassis, L / 2 - 3.2, L / 2, 1.42, 1.7, -0.9, 0.9, 0.08);
    for (const x of [-L / 2 + 0.3, -L / 2 + 6.4, 0.5, L / 2 - 3.2]) P.ext(paint(TOY.white, 0.5), x - 0.18, x + 0.18, 1.2, 1.5, -1.7, 1.7, 0.05);
    for (const x of [-L / 2 + 0.3, L / 2 - 3.2]) for (const s of [-1, 1]) P.ext(M.steel, x - 0.14, x + 0.14, 1.5, 1.62, s * 1.55 - 0.14, s * 1.55 + 0.14, 0.03);
    // landing legs
    for (const s of [-1, 1]) {
      P.ext(M.ink, 3.9, 4.2, 0.2, 1.1, s * 0.85 - 0.12, s * 0.85 + 0.12, 0.04);
      P.ext(M.ink, 3.7, 4.4, 0.0, 0.18, s * 0.85 - 0.3, s * 0.85 + 0.3, 0.04);
    }
    // rear bumper and lamps
    P.ext(M.ink, -L / 2 - 0.12, -L / 2 + 0.12, 0.55, 0.85, -1.6, 1.6, 0.05);
    for (const s of [-1, 1]) P.ext(M.tail, -L / 2 - 0.16, -L / 2 - 0.1, 0.9, 1.1, s * 1.35 - 0.16, s * 1.35 + 0.16, 0.03);
    for (const x of [-L / 2 + 1.6, -L / 2 + 2.9, -L / 2 + 4.2]) for (const s of [-1, 1]) P.ext(M.ink, x - 0.7, x + 0.7, 1.32, 1.46, s * 1.5 - 0.35, s * 1.5 + 0.35, 0.04);
  }, group);
  const wheels = [];
  for (const x of [-L / 2 + 1.6, -L / 2 + 2.9, -L / 2 + 4.2]) axle(group, wheels, 0.55, 0.55, x, 1.42);
  return {group, roll: roller(wheels), kingpin: L / 2 - 1.3, deckY, len: L, boxX: -0.3};
}

// ================================================================ the 40 ft spreader (shared by every lifting machine)
/** a telescopic top-lift spreader: a yellow main frame along local z (the box's length lies across the machine),
 *  two extending end beams with twistlocks and flippers. Origin at its underside centre. */
function spreaderGeo(P, len = BOX.L40, {headY = 0.9} = {}) {
  const M = mats();
  const hz = len / 2;
  P.ext(M.yellow, -0.55, 0.55, 0.15, 0.85, -hz * 0.42, hz * 0.42, 0.12);
  for (const s of [-1, 1]) {
    P.ext(M.yellow, -0.4, 0.4, 0.22, 0.7, s > 0 ? hz * 0.4 : -hz + 0.25, s > 0 ? hz - 0.25 : -hz * 0.4, 0.1);
    P.ext(M.yellow, -1.65, 1.65, 0.05, 0.6, s * (hz - 0.3) - 0.3, s * (hz - 0.3) + 0.3, 0.12);
    for (const xs of [-1, 1]) P.ext(M.ink, xs * 1.45 - 0.12, xs * 1.45 + 0.12, -0.05, 0.08, s * (hz - 0.2) - 0.12, s * (hz - 0.2) + 0.12, 0.02);
  }
  P.ext(M.ink, -0.7, 0.7, 0.8, headY, -1.2, 1.2, 0.12);
}

// ================================================================ reach stacker
export const RS = {pivot: [-3.0, 5.0], hang: 1.6, minL: 9.5, maxL: 18.4};
/** the reach stacker: a long yellow body, twin front drive tyres, steering rear axle under a big counterweight, a cab
 *  set back under the boom, a telescopic boom pivoted at the rear top with a lift ram, a rotator and a 40 ft spreader
 *  hanging level at the boom head, lying across the machine. reach(x, y) puts the spreader's underside at local (x, y). */
export function buildToyReachStacker({number = '04'} = {}) {
  const M = mats();
  const group = new THREE.Group();
  const RF = 1.05;
  const RR = 0.88;
  const [px, py] = RS.pivot;
  tpl(`rs|${number}`, (P) => {
    // chassis, front axle housing, counterweight
    P.add(M.yellow, extrude('rs-body', () => profile(-5.6, 4.6, 0.55, 2.4, {arches: [[3.0, RF, RF + 0.16], [-3.6, RR, RR + 0.16]], rc: [0.3, 0.4, 0.5, 0.4]}, 0.2), 3.6, 0.2));
    P.ext(M.yellow, -6.0, -3.2, 1.6, 4.4, -1.85, 1.85, 0.4);
    P.ext(M.chassis, 2.5, 3.5, 0.9, 1.6, -2.3, 2.3, 0.1);
    // the cab, set back and raised, dark glass all round
    P.ext(M.ink, -1.4, 1.4, 2.35, 2.55, -1.3, 1.3, 0.06);
    P.ext(M.yellow, -1.3, 1.3, 2.5, 4.35, -1.2, 1.2, 0.2);
    P.ext(M.glass, -1.15, 1.37, 2.9, 4.15, -1.25, 1.25, 0.12);
    P.ext(M.yellow, -1.35, 1.35, 4.25, 4.45, -1.25, 1.25, 0.08);
    P.beacon(-0.4, 4.45, 0, 0.13);
    // the boom's pivot towers and the counterweight's grille, lamps, steps
    for (const s of [-1, 1]) P.ext(M.yellow, px - 0.7, px + 0.7, 3.6, py + 0.3, s * 1.0 - 0.18, s * 1.0 + 0.18, 0.08);
    P.cyl(M.steel, 0.28, 0.28, 2.5, px, py, 0, 'z', 16);
    P.ext(M.ink, -6.05, -5.98, 2.2, 3.8, -1.3, 1.3, 0.03);
    for (const s of [-1, 1]) {
      P.ext(M.tail, -6.08, -6.0, 1.7, 1.95, s * 1.4 - 0.18, s * 1.4 + 0.18, 0.03);
      P.ext(M.lamp, 4.55, 4.65, 1.5, 1.8, s * 1.4 - 0.2, s * 1.4 + 0.2, 0.04);
      P.ext(M.ink, 0.8, 1.6, 0.9, 1.0, s * 1.85 - 0.08, s * 1.85 + 0.08, 0.02);
    }
    P.text(`RS-${number}`, {fg: '#1d2748', px: 110}, 0.5, -4.4, 3.1, 1.87);
    P.text(`RS-${number}`, {fg: '#1d2748', px: 110}, 0.5, -4.4, 3.1, -1.87, PI);
  }, group);
  const wheels = [];
  // twin tyres on the front drive axle
  axle(group, wheels, RF, 0.62, 3.0, 1.55);
  axle(group, wheels, RF, 0.62, 3.0, 2.2);
  const steer = [];
  axle(group, wheels, RR, 0.62, -3.6, 1.5, steer);
  // the boom: an outer section on the pivot, an inner one sliding out of it
  const boom = new THREE.Group();
  boom.position.set(px, py, 0);
  group.add(boom);
  tpl('rs-boom', (P) => {
    P.ext(M.yellow, -0.6, 9.0, -0.6, 0.6, -0.65, 0.65, 0.18);
    P.ext(M.ink, 1.2, 8.4, 0.58, 0.66, -0.3, 0.3, 0.03);
    P.text('RS 45 t', {fg: '#1d2748', px: 90}, 0.42, 3.4, 0.0, 0.67);
    P.text('RS 45 t', {fg: '#1d2748', px: 90}, 0.42, 3.4, 0.0, -0.67, PI);
  }, boom);
  const inner = new THREE.Group();
  boom.add(inner);
  tpl('rs-inner', (P) => {
    P.ext(paint('#e8a72f', 0.5), -9.6, 0.2, -0.46, 0.46, -0.5, 0.5, 0.14);
    P.ext(M.yellow, -0.1, 0.7, -0.62, 0.62, -0.62, 0.62, 0.14);
    P.cyl(M.steel, 0.16, 0.16, 1.5, 0.35, -0.2, 0, 'z', 12);
  }, inner);
  // the head: rotator and spreader, hanging level
  const head = new THREE.Group();
  group.add(head);
  tpl('rs-head', (P) => {
    P.ext(M.ink, -0.35, 0.35, 0.8, RS.hang, -0.35, 0.35, 0.1);
    spreaderGeo(P, BOX.L40);
  }, head);
  const setRam = ram(group, 0.24, 2.6);
  const base = V3(1.6, 1.9, 0);
  const at = V3();
  const tipP = V3();
  const reach = (x, y) => {
    const hx = x;
    const hy = y + RS.hang;
    const dx = hx - px;
    const dy = hy - py;
    const Lb = clamp(Math.hypot(dx, dy), RS.minL, RS.maxL);
    const a = Math.atan2(dy, dx);
    boom.rotation.z = a;
    inner.position.x = Lb;
    head.position.set(px + Math.cos(a) * Lb, py + Math.sin(a) * Lb - RS.hang, 0);
    tipP.copy(head.position);
    at.set(px + Math.cos(a) * 4.6, py + Math.sin(a) * 4.6 - 0.6, 0);
    setRam(base, at);
  };
  reach(6.5, 1.0);
  return {group, roll: roller(wheels), setSteer: steerer(steer), reach, tip: () => tipP.clone(), head, length: 10.6};
}

// ================================================================ straddle carrier
/** the straddle carrier: two long side beams on 4 wheels each, 4 legs to a top frame, a cab high at the front,
 *  the engine house on top, a spreader inside the legs; it carries the box between its legs */
export function buildToyStraddleCarrier({number = '11'} = {}) {
  const M = mats();
  const group = new THREE.Group();
  const top = 12.6;
  const hw = 2.7;
  tpl(`sc|${number}`, (P) => {
    for (const s of [-1, 1]) {
      // the bottom beams with their wheel spats
      P.ext(M.yellow, -5.2, 5.2, 0.9, 1.9, s * hw - 0.45, s * hw + 0.45, 0.25);
      // legs: two per side, leaning in a touch
      for (const x of [-4.4, 4.4]) P.bar(M.yellow, [x, 1.6, s * hw], [x * 0.92, top - 0.6, s * (hw - 0.15)], 0.7);
      P.bar(M.yellow, [-4.4, 4.5, s * hw], [4.4, 4.5, s * hw], 0.32);
      P.ext(M.yellow, -4.6, 4.6, top - 1.0, top, s * (hw - 0.1) - 0.35, s * (hw - 0.1) + 0.35, 0.18);
    }
    for (const x of [-4.3, 4.3]) P.ext(M.yellow, x - 0.35, x + 0.35, top - 0.95, top - 0.1, -hw, hw, 0.15);
    // the engine house and the cab (front, right side, up high)
    P.ext(M.white, -4.0, 0.4, top, top + 1.6, -hw + 0.1, hw - 0.1, 0.3);
    P.ext(M.ink, -3.9, -3.6, top + 0.3, top + 1.3, -1.5, 1.5, 0.05);
    P.ext(M.yellow, 3.0, 5.2, top - 2.6, top + 0.6, hw - 1.2, hw + 0.6, 0.25);
    P.ext(M.glass, 4.0, 5.28, top - 2.2, top + 0.2, hw - 1.05, hw + 0.45, 0.1);
    P.beacon(-1.8, top + 1.6, 0, 0.16);
    // hoist sheaves
    for (const x of [-3.2, 3.2]) P.cyl(M.steel, 0.32, 0.32, 0.5, x, top - 0.5, 0, 'z', 16);
    P.text(`SC-${number}`, {fg: '#1d2748', px: 110}, 0.6, 0, 1.4, hw + 0.47);
    P.text(`SC-${number}`, {fg: '#1d2748', px: 110}, 0.6, 0, 1.4, -hw - 0.47, PI);
  }, group);
  const wheels = [];
  for (const x of [-4.2, -1.4, 1.4, 4.2]) axle(group, wheels, 0.65, 0.55, x, hw);
  // the spreader along x here (the box lies along the carrier)
  const spr = new THREE.Group();
  group.add(spr);
  tpl('sc-spr', (P) => {
    const sub = new Parts();
    spreaderGeo(sub, BOX.L40);
    for (const [mat, list] of sub.map) for (const g of list) P.put(mat, g, new THREE.Matrix4().makeRotationY(PI / 2));
  }, spr);
  const cables = [-3.2, 3.2].flatMap((x) => [-1.2, 1.2].map((z) => {
    const c = part(cylG(0.04, 0.04, 1, 6), M.ink, group);
    c.userData = {x, z};
    return c;
  }));
  const setLift = (y) => {
    spr.position.y = y;
    for (const c of cables) {
      const len = top - 0.6 - (y + 0.9);
      c.position.set(c.userData.x, y + 0.9 + len / 2, c.userData.z);
      c.scale.y = Math.max(0.05, len);
    }
  };
  setLift(5.6);
  return {group, roll: roller(wheels), setLift, length: 10.4};
}

// ================================================================ empty container handler
/** a big counterbalanced top-lift for empties: a tall duplex mast, a side-shift top-lift frame that grabs the box's
 *  top corners, a raised cab. The box hangs from the frame along local z. */
export function buildToyEmptyHandler({number = '02'} = {}) {
  const M = mats();
  const group = new THREE.Group();
  const RF = 0.95;
  tpl(`eh|${number}`, (P) => {
    P.add(M.yellow, extrude('eh-body', () => profile(-4.0, 2.4, 0.5, 2.2, {arches: [[1.4, RF, RF + 0.14], [-2.6, 0.8, 0.94]], rc: [0.3, 0.3, 0.4, 0.4]}, 0.2), 3.2, 0.2));
    P.ext(M.yellow, -4.4, -2.2, 1.5, 3.8, -1.6, 1.6, 0.35);
    P.ext(M.yellow, -1.4, 1.2, 2.2, 5.2, -1.2, 1.2, 0.2);
    P.ext(M.glass, -1.25, 1.27, 2.8, 4.9, -1.25, 1.25, 0.12);
    P.beacon(-0.2, 5.2, 0, 0.13);
    for (const s of [-1, 1]) {
      P.ext(M.ink, 2.6, 3.0, 0.4, 16.0, s * 1.1 - 0.2, s * 1.1 + 0.2, 0.08);
      P.ext(M.tail, -4.48, -4.4, 2.0, 2.3, s * 1.2 - 0.15, s * 1.2 + 0.15, 0.03);
    }
    for (const y of [3, 8, 12, 15.8]) P.ext(M.ink, 2.6, 3.0, y - 0.15, y + 0.15, -1.3, 1.3, 0.05);
    P.text(`EH-${number}`, {fg: '#1d2748', px: 110}, 0.45, -3.2, 2.9, 1.62);
  }, group);
  const wheels = [];
  axle(group, wheels, RF, 0.6, 1.4, 1.3);
  axle(group, wheels, RF, 0.6, 1.4, 1.95);
  axle(group, wheels, 0.8, 0.55, -2.6, 1.3);
  const frame = new THREE.Group();
  group.add(frame);
  tpl('eh-frame', (P) => {
    P.ext(M.ink, 3.0, 3.5, 0, 1.6, -1.2, 1.2, 0.08);
    P.ext(M.yellow, 3.4, 4.4, 0.0, 0.7, -BOX.L20 / 2, BOX.L20 / 2, 0.14);
    for (const s of [-1, 1]) P.ext(M.yellow, 3.0, 6.6, 0.0, 0.5, s * (BOX.L20 / 2 - 0.3) - 0.3, s * (BOX.L20 / 2 - 0.3) + 0.3, 0.1);
  }, frame);
  const setLift = (y) => (frame.position.y = clamp(y, 0.5, 15.0));
  setLift(4);
  return {group, roll: roller(wheels), setLift, length: 11};
}

// ================================================================ rubber-tyred gantry crane (RTG)
/** the RTG: two portal frames on 4 bogies of 2 tyres, spanning 6 rows and a truck lane along local z (+-11), a top
 *  girder each side, a trolley with the cab and hoist, a spreader hanging on 4 ropes. Travels along local x. */
export function buildToyRTG({number = '05'} = {}) {
  const M = mats();
  const group = new THREE.Group();
  const span = 11;
  const top = 17.5;
  const hx = 7.0;
  tpl(`rtg|${number}`, (P) => {
    for (const s of [-1, 1]) {
      // the sill beam along x with the two bogies and the diesel house on one side
      P.ext(M.yellow, -hx - 1.2, hx + 1.2, 1.1, 2.1, s * span - 0.6, s * span + 0.6, 0.25);
      for (const x of [-hx, hx]) {
        P.bar(M.yellow, [x, 2.0, s * span], [x, top - 0.6, s * span], 1.0);
        P.ext(M.ink, x - 1.2, x + 1.2, 0.6, 1.2, s * span - 0.45, s * span + 0.45, 0.1);
      }
      P.bar(M.yellow, [-hx, 2.4, s * span], [hx, top - 1.6, s * span], 0.4);
      P.ext(M.yellow, -hx - 0.8, hx + 0.8, top - 1.3, top, s * (span - 0.5) - 0.5, s * (span - 0.5) + 0.5, 0.2);
    }
    for (const x of [-hx, hx]) P.ext(M.yellow, x - 0.6, x + 0.6, top - 1.1, top - 0.1, -span, span, 0.2);
    P.ext(M.white, -hx + 1.0, -hx + 4.6, 2.2, 5.2, span - 0.8, span + 1.6, 0.3);
    P.ext(M.ink, -hx + 4.55, -hx + 4.65, 2.8, 4.6, span - 0.4, span + 1.2, 0.03);
    P.text(`RTG ${number}`, {fg: '#1d2748', px: 110}, 1.0, 0, top - 0.65, span + 0.02);
    P.text(`RTG ${number}`, {fg: '#1d2748', px: 110}, 1.0, 0, top - 0.65, -span - 0.02, PI);
  }, group);
  const wheels = [];
  for (const x of [-hx - 0.6, -hx + 0.6, hx - 0.6, hx + 0.6]) for (const s of [-1, 1]) {
    const w = new THREE.Group();
    w.position.set(x, 0, s * span);
    group.add(w);
    const list = [];
    axle(w, list, 0.6, 0.5, 0, 0.0001);
    wheels.push(...list);
  }
  const trolley = new THREE.Group();
  trolley.position.y = top;
  group.add(trolley);
  tpl('rtg-trolley', (P) => {
    P.ext(M.white, -3.2, 3.2, 0, 1.5, -1.8, 1.8, 0.25);
    P.ext(M.yellow, 3.0, 4.8, -2.8, 0.2, -1.2, 1.2, 0.2);
    P.ext(M.glass, 3.5, 4.88, -2.5, -0.2, -1.05, 1.05, 0.08);
  }, trolley);
  const spr = new THREE.Group();
  group.add(spr);
  tpl('rtg-spr', (P) => {
    const sub = new Parts();
    spreaderGeo(sub, BOX.L40);
    for (const [mat, list] of sub.map) for (const g of list) P.put(mat, g, new THREE.Matrix4().makeRotationY(PI / 2));
  }, spr);
  const ropes = [-2.6, 2.6].flatMap((x) => [-1.0, 1.0].map((z) => {
    const c = part(cylG(0.045, 0.045, 1, 6), M.ink, group);
    c.userData = {x, z};
    return c;
  }));
  let tz = 0;
  let hy = 10;
  const sync = () => {
    trolley.position.z = tz;
    spr.position.set(0, hy, tz);
    for (const c of ropes) {
      const len = top - (hy + 0.9);
      c.position.set(c.userData.x, hy + 0.9 + len / 2, tz + c.userData.z);
      c.scale.y = Math.max(0.05, len);
    }
  };
  const setTrolley = (z) => {
    tz = clamp(z, -span + 2, span - 2);
    sync();
  };
  const setHoist = (y) => {
    hy = clamp(y, 1, top - 3);
    sync();
  };
  sync();
  return {group, roll: (d) => {for (const w of wheels) w.rotation.z = -d / 0.6;}, setTrolley, setHoist, span, length: 2 * hx + 2.4};
}

export {spreaderGeo, decalMat, textTex};
