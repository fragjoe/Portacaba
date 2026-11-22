// Portline's world: Northbay Container Terminal (NCT). The quay runs along x with the water toward -z; three
// ship-to-shore cranes over the AURORA MERIDIAN at Berth 2; the yard behind (Block B3 worked by a reach stacker, Block B2
// under an RTG, the reefer rack, the empty depot); the in/out gate at the east end; the city beyond the fence.
//
// The hero is one 40 ft box, AURU 482113 9. Everything is a pure function of the film clock T:
//   -0.5-7.9   QC-02 discharges it from bay 14 row 7 onto TT-07's chassis on lane 2
//    8.2-16.2  TT-07 hauls it to Block B3 (along the apron, down the west aisle, east along lane B)
//   17.4-23.8  RS-04 lifts it off the chassis and stacks it on B3 row 1, tier 2; TT-07 leaves at 21.2
//   21.0-30.0  the road truck TRK-8812 comes in through the gate, round the perimeter road, into lane B
//   30.4-35.6  RS-04 takes the box off the stack and lowers it onto TRK-8812's skeletal trailer
//   35.4-39.0  TRK-8812 drives to Gate 2, out lane 1; 39.0-40.2 OCR and the weighbridge, the barrier lifts
//   40.2-44.0  out onto the city road
// Around it: QC-01 dual-cycles two boxes between the ship and TT-03; QC-03 stands with its boom up; the RTG works
// Block B2; SC-11 runs the apron; EH-02 stacks empties; tugs and the pilot boat on the water.
import * as THREE from 'three';
import {TOY, toyMat} from '../airport-shared/style.js';
import {buildToyCityBlock, buildToyFence, buildToyTrees, buildToyCargoTerminal} from '../airport-shared/airside.js';
import {buildToyForklift, buildToyFollowMe} from '../airport-shared/gse.js';
import {
  BOX, CONTAINER_COLORS as CC, buildContainerField, buildToyContainer, buildToyTerminalTractor, buildToyTerminalChassis,
  buildToyPrimeMover, buildToyRedCabTractor, buildToySkeletalTrailer, buildToyReachStacker, buildToyStraddleCarrier, buildToyEmptyHandler, buildToyRTG,
  buildToyTugboat, buildToyPilotBoat,
} from './vehicles.js';
import {QUAY_Z, WATER, SHIP, buildToyQuay, buildToyQuayCrane, buildToyShip, buildToyGate, buildToyReeferRack, buildToyLightMast, buildToyOffice, buildToyMooringLine} from './infra.js';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (x) => {
  const u = clamp(x);
  return u * u * (3 - 2 * u);
};
const ss = (a, b, t) => sm((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const yawOf = (t) => Math.atan2(-t.z, t.x);

export const DUR = 47.3;
export const T = {
  crane: [-0.5, 7.9],
  haul: [8.2, 16.2],
  stack: [17.4, 23.8],
  ttOut: [21.2, 26.4],
  truckIn: [21.0, 30.0],
  load: [30.4, 35.6],
  truckOut: [35.4, 39.0],
  ocr: [39.0, 40.2],
  exit: [40.2, 44.0],
};
export const HERO_ID = 'AURU 482113 9';

// ---------------------------------------------------------------- layout
const CRANE_Z = -26; // the cranes' local origin: rails at -36 and -16
const QC_X = [-39.5, 14.5, 68.5];
const SHIP_Z = -58.5;
const SHIP_ROWS = Array.from({length: 8}, (_, i) => SHIP_Z + (i - 3.5) * 3.5); // row 7 (index 7) is the quay side
const HATCH_Y = WATER + SHIP.hatch;
const LANE_B = 31.6; // the truck lane along Block B3's south face
const SLOT_X = 39; // the hero's bay in B3
const ROWS_B = [27.0, 23.4, 19.8]; // row 1 is next to lane B
const BAYS_B3 = [21, 39, 57, 75];
const BAYS_B2 = [-80, -62, -44];
const ROWS_B2 = [36.6, 40.2, 43.8, 47.4];
const RS_Z = 41; // RS-04's working position, south of lane B (it faces -z, toward the block)
const GATE_X = 140;
const OUT_Z = 48;
const PERIM_Z = 58;

function makePath(pts) {
  const c = new THREE.CatmullRomCurve3(pts.map(([x, z]) => V(x, 0, z)), false, 'centripetal');
  const L = c.getLength();
  const at = (s) => {
    if (s <= 0) return {p: c.getPointAt(0).addScaledVector(c.getTangentAt(0), s), t: c.getTangentAt(0)};
    if (s >= L) return {p: c.getPointAt(1).addScaledVector(c.getTangentAt(1), s - L), t: c.getTangentAt(1)};
    return {p: c.getPointAt(s / L), t: c.getTangentAt(s / L)};
  };
  // arc length of the point nearest (x, z), by sampling
  const find = (x, z) => {
    let best = 0;
    let bd = 1e9;
    for (let i = 0; i <= 4000; i++) {
      const s = (L * i) / 4000;
      const p = at(s).p;
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < bd) [bd, best] = [d, s];
    }
    return best;
  };
  return {L, at, find, points: (s0, s1, n = 48) => Array.from({length: n + 1}, (_, i) => at(lerp(s0, s1, i / n)).p)};
}

/** a tractor on a path at s with its trailer following: the kingpin on the fifth wheel, the trailer's axle on the path */
function towPose(path, s, lead, trailer, axleD) {
  const {p, t} = path.at(s);
  const yaw = yawOf(t);
  lead.group.position.set(p.x, 0, p.z);
  lead.group.rotation.y = yaw;
  lead.roll(s);
  const f = lead.fifth.x;
  const K = V(p.x + t.x * f, 0, p.z + t.z * f);
  const A = path.at(s + f - axleD).p;
  const d = K.clone().sub(A).normalize();
  const o = K.clone().addScaledVector(d, -trailer.kingpin);
  trailer.group.position.set(o.x, 0, o.z);
  trailer.group.rotation.y = yawOf(d);
  trailer.roll(s);
  return {o, d, yaw: yawOf(d)};
}

/** one crane move: travel to A at the hover height, lower, latch, hoist, travel to B, lower, release, hoist.
 *  A, B = {z, y} with y the box top (the spreader's underside when latched). Returns the spreader pose and the phase. */
const MOVE = [2.0, 1.3, 0.35, 1.5, 2.4, 1.5, 0.35, 1.0];
const MOVE_LEN = MOVE.reduce((a, b) => a + b, 0);
function craneMove(u, prevZ, A, B, hover) {
  const e = [0];
  for (const d of MOVE) e.push(e[e.length - 1] + d);
  const k = (i) => ss(e[i], e[i + 1], u);
  let z = prevZ;
  let y = hover;
  if (u < e[1]) z = lerp(prevZ, A.z, k(0));
  else if (u < e[2]) [z, y] = [A.z, lerp(hover, A.y, k(1))];
  else if (u < e[3]) [z, y] = [A.z, A.y];
  else if (u < e[4]) [z, y] = [A.z, lerp(A.y, hover, k(3))];
  else if (u < e[5]) [z, y] = [lerp(A.z, B.z, k(4)), hover];
  else if (u < e[6]) [z, y] = [B.z, lerp(hover, B.y, k(5))];
  else if (u < e[7]) [z, y] = [B.z, B.y];
  else [z, y] = [B.z, lerp(B.y, hover, k(7))];
  return {z, y, carry: u >= e[2] + 0.2 && u < e[7] - 0.1, done: u >= e[7] - 0.1, picked: u >= e[2] + 0.2};
}

/** reach stacker keyframes: [t, x, y] of the spreader's underside in the machine's frame, eased between */
function keyed(keys, t) {
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const k = ss(a[0], b[0], t);
  return a.slice(1).map((v, j) => lerp(v, b[j + 1], k));
}

export function buildWorld() {
  const root = new THREE.Group();
  const add = (o, x = 0, z = 0, ry = 0, y = 0) => {
    o.position.set(x, y, z);
    o.rotation.y = ry;
    root.add(o);
    return o;
  };
  const flat = (w, d, color, x, z, y = 0.01) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), toyMat(color, {rough: 0.95}));
    m.position.set(x, y, z);
    m.receiveShadow = true;
    root.add(m);
    return m;
  };

  // ---------------------------------------------------------------- ground, apron, roads, block pads
  flat(2400, 1500, TOY.ground, 0, QUAY_Z + 750, 0);
  flat(340, 40, TOY.road, 0, -20, 0.012); // the apron under and behind the cranes
  const road = '#ccd6f4';
  flat(300, 10, road, 10, -6, 0.016); // apron road
  flat(130, 7, road, 46, LANE_B, 0.016); // lane B
  flat(64, 7, road, -62, LANE_B, 0.016); // the RTG lane in B2
  flat(380, 10, road, 0, PERIM_Z, 0.016); // perimeter road
  flat(10, 70, road, -22, 23, 0.017); // west aisle
  flat(10, 64, road, -13, 6, 0.017);
  flat(10, 90, road, 114, 13, 0.017); // east aisle
  flat(80, 24, road, 128, 55, 0.017); // gate approach
  flat(260, 24, road, 290, 55, 0.017); // the city road east of the gate
  flat(12, 500, road, 178, 40, 0.018); // the public road along the fence
  for (let x = -180; x < 180; x += 9) {
    flat(4, 0.4, TOY.lane, x, -6, 0.03);
    flat(4, 0.4, TOY.lane, x, PERIM_Z, 0.03);
  }
  flat(72, 12, TOY.groundDeep, 48, 23.4, 0.014); // B3 pad
  flat(56, 18, TOY.groundDeep, -62, 42, 0.014); // B2 pad
  flat(92, 16, TOY.groundDeep, 52.5, 74, 0.014); // reefer pad
  flat(60, 10, TOY.groundDeep, -64, 68.3, 0.014); // empty depot pad
  // yellow bay marks on lane B and the RS aisle box
  for (const x of BAYS_B3) {
    flat(0.3, 7, TOY.bay, x - 8.6, LANE_B, 0.035);
    flat(0.3, 7, TOY.bay, x + 8.6, LANE_B, 0.035);
  }
  flat(20, 0.3, TOY.bay, SLOT_X, 35.2, 0.035);
  flat(20, 0.3, TOY.bay, SLOT_X, 50.0, 0.035);
  flat(0.3, 14.8, TOY.bay, SLOT_X - 10, 42.6, 0.035);
  flat(0.3, 14.8, TOY.bay, SLOT_X + 10, 42.6, 0.035);
  flat(30, 16, road, SLOT_X, 43, 0.016); // RS-04's working apron

  // ---------------------------------------------------------------- the quay, the cranes, the ship
  const quay = buildToyQuay({x0: -170, x1: 170});
  root.add(quay.group);
  const qcs = QC_X.map((x, i) => {
    const q = buildToyQuayCrane({number: `0${i + 1}`});
    add(q.group, x, CRANE_Z);
    return q;
  });
  qcs[2].setBoom(1);
  qcs[2].setTrolley(8);
  qcs[2].setHoist(15);
  const ship = buildToyShip();
  add(ship.group, 0, SHIP_Z, 0, WATER);
  for (const [i, b] of ship.bitts.entries()) {
    const a = b.clone().add(V(0, WATER, SHIP_Z));
    const q = V(a.x + (i % 2 ? -9 : 9) * (i < 2 ? 1 : -1), 0.7, QUAY_Z + 0.25);
    root.add(buildToyMooringLine(a, q));
  }

  // ---------------------------------------------------------------- containers: the ship's deck cargo and the yard
  const palette = [CC.aurora, CC.aurora, CC.aurora, CC.white, CC.white, CC.kestrel, CC.kestrel, CC.sky, CC.navy, CC.lavender, CC.orange, CC.steel];
  let seed = 11;
  const pick = () => palette[(seed = (seed * 48271) % 2147483647) % palette.length];
  const field = [];
  const heroBay = ship.bays.indexOf(14.5);
  const qc1Bay = ship.bays.indexOf(-39.5);
  ship.bays.forEach((bx, i) => {
    SHIP_ROWS.forEach((z, j) => {
      let tiers = 1 + ((i * 3 + j * 5) % 3);
      if (j === 0 || j === 7) tiers = Math.min(tiers, 2);
      if (i === heroBay && j === 7) tiers = 1; // the hero sits on top as tier 2
      if (i === heroBay && j === 6) tiers = 3;
      if (i === qc1Bay && (j === 7 || j === 6)) tiers = 1; // QC-01's two slots on tier 2
      for (let k = 0; k < tiers; k++) field.push({x: bx, y: HATCH_Y + k * BOX.H, z, len: BOX.L40, color: pick()});
    });
  });
  // Block B3: 4 bays x 3 rows, 1-3 high; the hero's slot (bay 39, row 1) one high
  BAYS_B3.forEach((x, i) => ROWS_B.forEach((z, j) => {
    let tiers = 1 + ((i * 2 + j * 3 + 1) % 3);
    if (x === SLOT_X && j === 0) tiers = 1;
    if (x === SLOT_X && j > 0) tiers = 2;
    for (let k = 0; k < tiers; k++) field.push({x, y: k * BOX.H, z, len: BOX.L40, color: pick()});
  }));
  // Block B2 under the RTG: 3 bays x 4 rows, 2-4 high
  BAYS_B2.forEach((x, i) => ROWS_B2.forEach((z, j) => {
    const tiers = 1 + ((i + j * 2) % 3);
    for (let k = 0; k < tiers; k++) field.push({x, y: k * BOX.H, z, len: BOX.L40, color: pick()});
  }));
  // the reefer stacks either side of the rack (white boxes, 2 high)
  for (let b = 0; b < 5; b++) for (const z of [70.4, 77.6]) for (let k = 0; k < 2; k++) {
    const x = 52.5 - 42.5 + 8.5 + b * 17;
    if (b === 4 && z === 70.4 && k === 1) continue;
    field.push({x, y: k * BOX.H, z, len: BOX.L40, color: k === 1 && b % 2 ? CC.kestrel : CC.white});
  }
  // the empty depot: 20 ft empties, 3-5 high
  for (let i = 0; i < 6; i++) for (const z of [66.5, 70.1]) {
    const tiers = 2 + ((i + (z > 68 ? 1 : 0)) % 3);
    for (let k = 0; k < tiers; k++) field.push({x: -86 + i * 8.6, y: k * BOX.H, z, len: BOX.L20, color: [CC.orange, CC.sky, CC.steel, CC.white][(i + k) % 4]});
  }
  root.add(buildContainerField(field).group);

  // ---------------------------------------------------------------- the hero box, TT-07 and its chassis, RS-04
  const hero = buildToyContainer({color: CC.orange, id: HERO_ID, line: 'CARGOVIVA'});
  root.add(hero.group);
  const tt7 = buildToyTerminalTractor({number: '07'});
  const ch7 = buildToyTerminalChassis();
  root.add(tt7.group, ch7.group);
  const CH_AXLE = ch7.kingpin + ch7.len / 2 - 2.85;
  // TT-07's path: lane 2 under QC-02 westbound, up the apron, down the west aisle, east along lane B, out up the east aisle
  const ttPath = makePath([
    [44, -26], [4.7, -26], [-5, -26], [-11, -21], [-13, -12], [-13, 14], [-10.5, 26], [-2, 31.4], [6, LANE_B], [60, LANE_B], [98, LANE_B],
    [110, 28], [114, 16], [114, -4], [113, -20],
  ]);
  const ttS0 = ttPath.find(4.7, -26);
  // stop with the box's centre on SLOT_X: the tractor is box + 9.8 along +x on the straight
  const ttStop = ttPath.find(SLOT_X + 9.8 + 0.0, LANE_B);
  const ttEnd = ttPath.L + 30;
  const rs = buildToyReachStacker({number: '04'});
  add(rs.group, SLOT_X, RS_Z, Math.PI / 2);

  // ---------------------------------------------------------------- the road truck TRK-8812
  const pm = buildToyRedCabTractor({number: '8812'}); // the hero road truck: the red cab-over
  const sk = buildToySkeletalTrailer();
  root.add(pm.group, sk.group);
  const SK_AXLE = sk.kingpin + sk.len / 2 - 2.9;
  const inPath = makePath([[160, PERIM_Z], [118, PERIM_Z], [40, PERIM_Z], [-10, PERIM_Z], [-20, 52], [-22, 44], [-18, 36], [-8, LANE_B], [4, LANE_B], [70, LANE_B]]);
  const inStop = inPath.find(SLOT_X + 9.9, LANE_B);
  const inS0 = inPath.find(118, PERIM_Z);
  const outPath = makePath([[20, LANE_B], [SLOT_X + 9.9, LANE_B], [72, LANE_B], [90, LANE_B], [100, LANE_B + 1.2], [109, 38], [116, OUT_Z - 1], [124, OUT_Z], [GATE_X + 1, OUT_Z], [200, OUT_Z], [420, OUT_Z]]);
  const outS0 = outPath.find(SLOT_X + 9.9, LANE_B);
  const ocrS = outPath.find(GATE_X + 1, OUT_Z);
  const outEnd = outPath.find(330, OUT_Z);

  // ---------------------------------------------------------------- QC-01's dual cycle with TT-03
  const tt3 = buildToyTerminalTractor({number: '03'});
  const ch3 = buildToyTerminalChassis();
  add(tt3.group, -29.7, -22);
  add(ch3.group, -38.5, -22);
  const qcBoxes = [buildToyContainer({color: CC.white, id: 'NBYU 210774 6', line: ''}), buildToyContainer({color: CC.white, id: 'AURU 903318 7', line: ''})];
  for (const b of qcBoxes) root.add(b.group);
  const QC1 = {ch: {z: 4, y: 5.1, wy: 1.5, wz: -22}, S1: {z: SHIP_ROWS[7] - CRANE_Z, y: HATCH_Y + 2 * BOX.H, wy: HATCH_Y + BOX.H, wz: SHIP_ROWS[7]}, S2: {z: SHIP_ROWS[6] - CRANE_Z, y: HATCH_Y + 2 * BOX.H, wy: HATCH_Y + BOX.H, wz: SHIP_ROWS[6]}};
  const QC1_MOVES = [[0, 'ch', 'S1'], [1, 'S2', 'ch'], [1, 'ch', 'S2'], [0, 'S1', 'ch']];
  const QC1_T0 = -6.0;

  // ---------------------------------------------------------------- the RTG over B2, SC-11 on the apron, EH-02 in the empty depot
  const rtg = buildToyRTG({number: '05'});
  root.add(rtg.group);
  const sc = buildToyStraddleCarrier({number: '11'});
  const scBox = buildToyContainer({color: CC.kestrel, id: 'KSTU 305528 5', line: 'KESTREL'});
  root.add(sc.group, scBox.group);
  sc.setLift(5.2);
  const eh = buildToyEmptyHandler({number: '02'});
  const ehBox = buildToyContainer({len: BOX.L20, color: CC.sky, id: 'AURU 556190 4', line: ''});
  root.add(eh.group, ehBox.group);

  // ---------------------------------------------------------------- the gate, the reefer rack, the office, lights, the CFS
  const gate = buildToyGate({lanes: [{z: OUT_Z, dir: 1}, {z: OUT_Z + 4, dir: 1}, {z: PERIM_Z, dir: -1}, {z: PERIM_Z + 4, dir: -1}]});
  add(gate.group, GATE_X, 0);
  // a truck waiting at the in-gate, another booked behind it
  const waitPM = buildToyPrimeMover({livery: 'kestrel', number: '8640'}); // the white cab-over (the original road tractor)
  const waitSK = buildToySkeletalTrailer();
  const waitBox = buildToyContainer({color: CC.aurora, id: 'AURU 771046 3'});
  add(waitPM.group, GATE_X - 1.5, PERIM_Z + 4, Math.PI);
  add(waitSK.group, GATE_X - 1.5 + 2.3 + sk.kingpin, PERIM_Z + 4, Math.PI);
  add(waitBox.group, GATE_X - 1.5 + 2.3 + sk.kingpin - sk.boxX, PERIM_Z + 4, Math.PI, sk.deckY);
  const rack = buildToyReeferRack({bays: 5});
  add(rack.group, 52.5, 74);
  add(buildToyOffice().group, 138, 10, 0);
  add(buildToyFollowMe().group, 121, 24, 0.2);
  for (const [x, z] of [[-70, 8], [-30, 51.5], [100, 8], [62, 65], [100, 80], [-100, 64.5]]) add(buildToyLightMast().group, x, z);
  const cfs = buildToyCargoTerminal({docks: 4, stock: true, name: 'CFS', sign: ['PORTLINE', 'CFS  ·  Container Freight Station']});
  add(cfs.group, -150, 52);
  for (let i = 0; i < 4; i++) cfs.setDoor(i, i === 1 ? 1 : 0);
  const cfsFl = buildToyForklift();
  add(cfsFl.group, -160, 54.5, Math.PI / 2);

  // ---------------------------------------------------------------- water craft
  const tug1 = buildToyTugboat({name: 'NB TUG 3'});
  add(tug1.group, -124, -60, 0, WATER);
  const tug2 = buildToyTugboat({name: 'NB TUG 5'});
  add(tug2.group, 140, -96, Math.PI, WATER);
  const pilot = buildToyPilotBoat();
  add(pilot.group, 0, -120, Math.PI, WATER);

  // ---------------------------------------------------------------- fence, trees, the city
  for (let x = -200; x < 152; x += 30) add(buildToyFence({length: 30}), x + 15, 88);
  for (let z = -10; z < 44; z += 27) add(buildToyFence({length: 27}), 154, z + 13.5, Math.PI / 2);
  add(buildToyFence({length: 22}), 154, 77, Math.PI / 2);
  const trees = [];
  for (let x = -200; x < 160; x += 14) trees.push({x: x + 3 * Math.sin(x), z: 94, size: 0.95 + 0.15 * Math.sin(x)});
  for (let z = -30; z < 100; z += 14) if (z < 40 || z > 72) trees.push({x: 162, z, size: 1.0});
  for (const [x, z] of [[135, 25], [-112, 20], [-110, 84], [10, 84], [80, 90]]) trees.push({x, z, size: 1.15});
  root.add(buildToyTrees(trees));
  let cs = 5;
  for (let x = -190; x < 160; x += 38) {
    add(buildToyCityBlock({w: 26, d: 20, floors: 3 + (cs % 3), seed: cs}), x, 120);
    cs += 5;
  }
  for (const [x, z] of [[215, -30], [215, 10], [250, -10], [215, 100], [255, 110], [215, 140]]) add(buildToyCityBlock({w: 24, d: 22, floors: 3 + (cs++ % 4), seed: cs}), x, z);

  // ---------------------------------------------------------------- the clock
  const QC2 = {ship: {z: SHIP_ROWS[7] - CRANE_Z, y: HATCH_Y + 2 * BOX.H}, ch: {z: 0, y: ch7.deckY + BOX.H}};
  const placeBox = (b, x, y, z, ry = 0) => {
    b.group.position.set(x, y, z);
    b.group.rotation.y = ry;
  };
  // RS-04's spreader keys over the film (machine frame: x forward toward lane B, y up); and its own z
  const RS_REST = [5.6, 5.8];
  const CHX = RS_Z - LANE_B; // over the chassis / trailer
  const ROWX = RS_Z - ROWS_B[0];
  const BOX_TOP_T2 = 2 * BOX.H;
  const RS_KEYS = [
    [0, ...RS_REST], [17.4, ...RS_REST], [18.4, CHX, 6.6], [19.2, CHX, 6.6], [19.8, CHX, 5.1], [20.1, CHX, 5.1], [21.0, CHX + 0.4, 9.2],
    [22.0, ROWX, 8.4], [22.6, ROWX, BOX_TOP_T2], [22.9, ROWX, BOX_TOP_T2], [23.8, ...RS_REST],
    [30.4, ...RS_REST], [31.2, ROWX, 8.2], [31.7, ROWX, BOX_TOP_T2], [32.0, ROWX, BOX_TOP_T2], [32.7, ROWX, 9.2], [33.7, CHX, 6.8],
    [34.3, CHX, 5.1], [34.6, CHX, 5.1], [35.6, ...RS_REST], [DUR, ...RS_REST],
  ];
  const RS_DRIVE = [[0, RS_Z + 2], [17.4, RS_Z + 2], [18.4, RS_Z], [23.4, RS_Z], [24.4, RS_Z + 2], [30.0, RS_Z + 2], [30.8, RS_Z], [35.2, RS_Z], [36.2, RS_Z + 2], [DUR, RS_Z + 2]];
  const rsHold = (t) => (t >= 20.0 && t < 22.75) || (t >= 31.9 && t < 34.45);

  const pose = (t) => {
    const st = {phase: '', heroAt: 'ship'};
    // ---- QC-02 and the hero's first leg
    const qc2 = qcs[1];
    let m2;
    {
      const u = t - T.crane[0] + MOVE[0];
      const m = craneMove(u, QC2.ship.z, QC2.ship, QC2.ch, 17.5);
      if (t > T.crane[1] + 1.2) {
        // back out over the ship for the next box, hovering
        const k = ss(T.crane[1] + 1.2, T.crane[1] + 3.6, t);
        qc2.setTrolley(lerp(0, QC2.ship.z - 3.5, k));
        qc2.setHoist(17.5 - 3 * ss(T.crane[1] + 3.6, T.crane[1] + 5.0, t));
      } else {
        qc2.setTrolley(m.z);
        qc2.setHoist(m.y);
      }
      m2 = m;
    }
    // ---- TT-07 with the chassis
    let ttS;
    if (t < T.haul[0]) ttS = ttS0;
    else if (t < T.ttOut[0]) ttS = lerp(ttS0, ttStop, ss(...T.haul, t));
    else ttS = lerp(ttStop, ttEnd, ss(...T.ttOut, t));
    const chP = towPose(ttPath, ttS, tt7, ch7, CH_AXLE);
    tt7.group.visible = ch7.group.visible = ttS < ttPath.L + 20;
    // ---- RS-04
    const [rx, ry] = keyed(RS_KEYS, t);
    const [rz] = keyed(RS_DRIVE, t);
    rs.group.position.z = rz;
    rs.reach(rx, ry);
    rs.roll(rz * 1.0);
    const head = rs.head.getWorldPosition(V());
    // ---- the road truck
    let trk;
    if (t < T.truckIn[0]) {
      pm.group.visible = sk.group.visible = false;
    } else {
      pm.group.visible = sk.group.visible = true;
      if (t < T.truckOut[0]) trk = towPose(inPath, lerp(inS0, inStop, ss(...T.truckIn, t)), pm, sk, SK_AXLE);
      else if (t < T.ocr[0]) trk = towPose(outPath, lerp(outS0, ocrS, ss(...T.truckOut, t)), pm, sk, SK_AXLE);
      else if (t < T.exit[0]) trk = towPose(outPath, ocrS, pm, sk, SK_AXLE);
      else trk = towPose(outPath, lerp(ocrS, outEnd, ss(...T.exit, t)), pm, sk, SK_AXLE);
      if (t > T.exit[0] + 2.4) pm.group.visible = sk.group.visible = false;
    }
    gate.setBarrier(0, ss(T.ocr[0] + 0.5, T.ocr[1], t) * (1 - ss(T.exit[0] + 1.6, T.exit[0] + 2.4, t)));
    // ---- where the hero is: ship, crane, chassis, RS-04, the stack, RS-04, the truck
    hero.group.visible = true;
    if (!m2.picked && t < T.crane[1]) {
      placeBox(hero, QC_X[1], HATCH_Y + BOX.H, SHIP_ROWS[7]);
      st.heroAt = 'ship';
    } else if (m2.carry && t < T.crane[1]) {
      const h = qc2.head.position;
      placeBox(hero, QC_X[1], h.y - BOX.H, CRANE_Z + h.z);
      st.heroAt = 'crane';
    } else if (t < 20.0) {
      const o = chP.o.clone().addScaledVector(chP.d, ch7.boxX);
      placeBox(hero, o.x, ch7.deckY, o.z, chP.yaw);
      st.heroAt = 'chassis';
    } else if (t < 22.75 || (t >= 31.9 && t < 34.45)) {
      placeBox(hero, head.x, head.y - BOX.H, head.z);
      st.heroAt = 'rs';
    } else if (t < 31.9) {
      placeBox(hero, SLOT_X, BOX.H, ROWS_B[0]);
      st.heroAt = 'stack';
    } else {
      const o = trk.o.clone().addScaledVector(trk.d, sk.boxX);
      placeBox(hero, o.x, sk.deckY, o.z, trk.yaw);
      st.heroAt = 'truck';
      hero.group.visible = pm.group.visible;
    }
    // ---- QC-01 dual cycle
    {
      const qc1 = qcs[0];
      const u0 = t - QC1_T0;
      const n = Math.floor(u0 / MOVE_LEN);
      const u = u0 - n * MOVE_LEN;
      const where = [null, null];
      // replay the state up to move n
      let state = {0: 'ch', 1: 'S2'};
      for (let i = 0; i < n; i++) {
        const [b, , to] = QC1_MOVES[i % 4];
        state[b] = to;
      }
      const [b, from, to] = QC1_MOVES[n % 4];
      const prevTo = n > 0 ? QC1_MOVES[(n - 1) % 4][2] : 'S1';
      const m = craneMove(u, QC1[prevTo].z, QC1[from], QC1[to], 17.5);
      qc1.setTrolley(m.z);
      qc1.setHoist(m.y);
      if (m.done) state[b] = to;
      for (const i of [0, 1]) {
        if (i === b && m.carry) {
          const h = qc1.head.position;
          placeBox(qcBoxes[i], QC_X[0], h.y - BOX.H, CRANE_Z + h.z);
        } else {
          const s = QC1[state[i]];
          placeBox(qcBoxes[i], QC_X[0], s.wy, s.wz);
        }
      }
    }
    // ---- RTG-05 working B2: travels, trolleys across, hoists
    {
      const x = -62 + 14 * Math.sin(t * 0.11 + 0.6);
      rtg.group.position.set(x, 0, 40);
      rtg.roll(x);
      rtg.setTrolley(-7 + 6 * (0.5 + 0.5 * Math.sin(t * 0.45)));
      rtg.setHoist(10 + 3.5 * Math.sin(t * 0.7 + 1));
    }
    // ---- SC-11 along the apron road, eastbound, carrying a box between its legs
    {
      const x = -150 + ((t * 9 + 120) % 310);
      sc.group.position.set(x, 0, -8.5);
      sc.group.rotation.y = 0;
      sc.roll(t * 9);
      placeBox(scBox, x, 5.2 - BOX.H + 0.0, -8.5);
      sc.group.visible = scBox.group.visible = x > -145 && x < 150;
    }
    // ---- EH-02 between its stack face and the staging spot, the box going up and down
    {
      const c = (t % 9.0) / 9.0;
      const fwd = ss(0.0, 0.3, c) * (1 - ss(0.55, 0.85, c));
      const z = lerp(83.0, 79.0, fwd);
      const lift = lerp(3.8, 15.0, ss(0.15, 0.45, c) * (1 - ss(0.6, 0.9, c)));
      eh.group.position.set(-60.2, 0, z);
      eh.group.rotation.y = Math.PI / 2;
      eh.roll(z);
      eh.setLift(lift);
      placeBox(ehBox, -60.2, lift - BOX.H, z - 5.1, 0);
    }
    // ---- the water
    tug1.bob(t);
    tug2.bob(t + 2);
    pilot.bob(t);
    tug2.group.position.x = 150 - t * 2.6;
    pilot.group.position.x = 90 - t * 4.2;
    st.ttS = ttS;
    st.trk = !!trk;
    return st;
  };
  pose(0);

  const at = (o, dy) => o.getWorldPosition(V()).add(V(0, dy, 0));
  const anchors = {
    qc2: () => V(QC_X[1], 24, CRANE_Z - 6),
    hero: () => at(hero.group, 5.0),
    tt7: () => at(hero.group, 5.0),
    rs4: () => at(rs.group, 6.2),
    trk: () => at(pm.group, 5.4),
    gate: () => V(GATE_X, 10, OUT_Z),
    rtg: () => at(rtg.group, 19),
    reefer: () => V(40, 9, 74),
    stack: () => V(75, 9.6, ROWS_B[1]),
    b2: () => V(-62, 16, 44),
  };
  const routes = {
    tt7: (t) => {
      const s = t < T.haul[0] ? ttS0 : t < T.ttOut[0] ? lerp(ttS0, ttStop, ss(...T.haul, t)) : null;
      if (s == null || s >= ttStop - 0.5) return null;
      return ttPath.points(s, ttStop, 48);
    },
    trk: (t) => {
      if (t < T.truckIn[0]) return null;
      if (t < T.truckOut[0]) {
        const s = lerp(inS0, inStop, ss(...T.truckIn, t));
        return s < inStop - 0.5 ? inPath.points(s, inStop, 40) : outPath.points(outS0, ocrS, 40);
      }
      if (t < T.ocr[0]) return outPath.points(lerp(outS0, ocrS, ss(...T.truckOut, t)), ocrS, 40);
      return null;
    },
  };
  const bodies = [
    {name: 'tt7', g: tt7.group}, {name: 'ch7', g: ch7.group}, {name: 'hero', g: hero.group}, {name: 'rs4', g: rs.group},
    {name: 'pm', g: pm.group}, {name: 'sk', g: sk.group}, {name: 'tt3', g: tt3.group}, {name: 'ch3', g: ch3.group},
    {name: 'qcA', g: qcBoxes[0].group}, {name: 'qcB', g: qcBoxes[1].group}, {name: 'sc', g: sc.group, kind: 'frame'}, {name: 'scBox', g: scBox.group},
    {name: 'eh', g: eh.group}, {name: 'ehBox', g: ehBox.group}, {name: 'waitPM', g: waitPM.group}, {name: 'waitSK', g: waitSK.group},
    {name: 'rsHead', g: rs.head},
  ];
  return {
    root, pose, anchors, routes, bodies, objects: {hero, tt7, ch7, rs, pm, sk, qcs, ship, gate, rtg, sc, eh, rack}, field,
    trees, SLOT_X, LANE_B, ROWS_B, GATE_X, OUT_Z, QC_X, CRANE_Z,
  };
}
