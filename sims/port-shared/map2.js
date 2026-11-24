// Portline v3 map: the bay with the natural headland, the three finger piers, the city bay, the breakwater and the
// water areas, laid out from the plan drawings in reports/img (denah_v3.svg, denah_darat_rel.svg; 1 plan px = 6 m).
// A blockout for checking the layout in 3D: land and quays, zone pads with labels, roads and the rail depot, the
// navigation marks and the existing props (ships at their berths, STS cranes, stacks, tugs).
//
// World frame: x east, z south, north = -z (the water). The south quay line of the finger piers is z = 0 and the middle
// of pier B is x = 0. P(px, py) turns plan pixels into world (x, z).
//
//   buildPortMap() -> {root, tick(t), spots, labels, outlines, pads, roads, landMat, ships}
import * as THREE from 'three';
import {TOY, toyMat} from '../airport-shared/style.js';
import {tpl, rb, canvasTex, buildToyForklift} from '../airport-shared/gse.js';
import {buildToyCityBlock, buildToyCargoTerminal, buildToyFence, buildToyTrees} from '../airport-shared/airside.js';
import {WATER, PORT_COLORS, buildToyWater, buildToyQuayCrane, buildToyGate, buildToyOffice, buildToyLightMast, buildToyReeferRack, buildToyMooringLine} from './infra.js';
import {BOX, CONTAINER_COLORS as CC, buildContainerField, buildToyStraddleCarrier, buildToyRTG, buildToyTerminalTractor, buildToyTerminalChassis, buildToyEmptyHandler, buildToyReachStacker, buildToyPrimeMover, buildToyRedCabTractor, buildToySkeletalTrailer} from './vehicles.js';
import {LOGOS} from './logos.js';
import * as S from './ships.js';

const PI = Math.PI;
export const PX = 6;
/** plan pixels (reports/img drawings) -> world x, z */
export const P = (px, py) => [(px - 332) * PX, (py - 385) * PX];
const paint = (c, r = 0.55) => toyMat(c, {paint: true, rough: r});
// asphalt: the port roads and the toll road
const ROAD = '#959fc2';
const HIGHWAY = '#7f8ab0';

// ---------------------------------------------------------------- pier B's layout, shared by its roads and its yard
// Six RTG blocks every 34 m (centres x), 5 rows of 40 ft boxes each (offsets from the centre), the RTGs spanning +-12.5
// so the truck lane at +9.35 is 5.1 m wide (the chassis is 3.6), one-way north in blocks 0, 2, 4 and south in 1, 3, 5.
// Three yard sections along the pier between the root aisle (z -45) and the head lane of the apron loop (z -540), with
// 32 m between them (an RTG is 27 m wide over its sills: it can turn in the gap to change blocks) for the two-way cross
// aisles. Sections 0 and 1 take the outside trucks; section 2, by the berths, is the vessel stack: yard tractors only.
// The berths: ships at x -+167 centred z -414 and -150; three cranes over each,
// on hatches (ship-local bay x) clear of the deckhouse.
export const PB = {
  blocks: [-85, -51, -17, 17, 51, 85],
  rows: [-8.5, -5.1, -1.7, 1.7, 5.1],
  rtgSpan: 12.5,
  lane: 9.35,
  laneW: 4.6,
  north: (bi) => bi % 2 === 0,
  sections: [[-62, -181], [-213, -366], [-398, -517]],
  outside: [0, 1], // the sections the outside trucks may use
  reefer: (bi, si) => si === 0 && (bi === 2 || bi === 3),
  empty: (bi, si) => si === 0 && bi === 5,
  root: -45,
  aisles: [-197, -382],
  // the empty depot (block 5's place in section 0): two pairs of rows of 20 ft empties either side of a 21.6 m working
  // aisle centred on x 84, the outside trucks' lane down its middle
  emptyX: 84,
  emptyRows: [-15.9, -12.5, 12.5, 15.9],
  // the straddle carriers' three blocks: section 2 of blocks 0-2 (the west half by the berth; blocks 3-5 there stay RTG
  // blocks for the tractors). Each: 4 single rows of 40 ft boxes every 6.5 m about the block's centre (the carrier's
  // legs run in the gaps), 2 high (a carrier lifts 1 over 2), worked from both ends: the aisle at z -382 and the apron
  // loop's head lane; 8 m between the blocks. The carriers shuttle between them and the cranes of the north berth
  // (z -414); the south berth keeps the tractors.
  sc: {section: 2, blocks: [0, 1, 2], offsets: [-9.75, -3.25, 3.25, 9.75], berth: -414},
  // gate B's forecourt, between the ring's north side and the pier, all inside the fence. Gate B is two gates facing
  // east on a lane at z 132 alongside the ring: in at x -100 (2 lanes, the queue ±180 m back to where it leaves the ring
  // at x -330, room for ±14 trucks), out at x 110 (±3 trucks of queue before it, then onto the ring at x 210). Behind the
  // in gate the in road turns north at x -30 and runs straight to pier B's root aisle; the out road comes back south at
  // x 30 and turns east to the out gate. A one-way turn-back at z 10 links them just short of the pier. The truck buffer
  // lot is paved against the in road's west side (in at z 102, out at z 34), the CFS yard against the out road's east
  // side (in at z 42, out at z 72), so a truck turning in or out has the whole width to swing through.
  laneZ: 136, // (the gate lanes run flush against the ring's north side: 129..143)
  gateIn: -100,
  gateOut: 110,
  inX: -30,
  outX: 30,
  backZ: 10,
  lot: {x0: -165, x1: -37, z0: 25, z1: 110},
  cfsYard: {x0: 37, x1: 258, z0: 30, z1: 120},
  head: -540,
  apronX: 112,
  qcX: 136,
  qcLane: 132,
  shipX: 167,
  berths: [-414, -150],
  craneBays: [68.5, 32.5, -3.5],
};
PB.isSC = (bi, si) => si === PB.sc.section && PB.sc.blocks.includes(bi);
PB.sc.rows = PB.sc.blocks.flatMap((bi) => PB.sc.offsets.map((u) => PB.blocks[bi] + u));
/** the bay centres (z) of a yard section */
export const pbBays = ([z0, z1]) => {
  const out = [];
  for (let z = z0 - 8.5; z - 8.5 >= z1; z -= 17) out.push(z);
  return out;
};

// ---------------------------------------------------------------- the coastline, as plan pixels
// the headland and the city bay are splines; the finger piers and the south quay are straight
const COAST = [
  ['line', [[-400, 900], [-400, 445], [40, 440]]],
  ['spline', [[110, 420], [140, 360], [150, 290], [170, 220], [200, 165], [235, 135], [258, 145], [240, 190], [225, 250], [215, 320], [210, 375], [215, 385]]],
  ['line', [[245, 385], [245, 290], [275, 290], [275, 385], [307, 385], [307, 290], [357, 290], [357, 385], [389, 385], [389, 290], [427, 290], [427, 385], [500, 385], [500, 305]]],
  ['spline', [[535, 290], [580, 300], [605, 278], [640, 272], [700, 268]]],
  ['line', [[1000, 268], [1000, 900]]],
];

function landShape() {
  const s = new THREE.Shape();
  const v = (p) => {
    const [x, z] = P(...p);
    return new THREE.Vector2(x, -z);
  };
  let first = true;
  for (const [kind, pts] of COAST) {
    if (kind === 'line') {
      for (const p of pts) {
        const q = v(p);
        if (first) s.moveTo(q.x, q.y), (first = false);
        else s.lineTo(q.x, q.y);
      }
    } else s.splineThru(pts.map(v));
  }
  s.closePath();
  return s;
}

/** a label floating over the map: a white pill with dark text, facing the camera at a constant size on screen */
function labelSprite(text, {size = 1, color = '#1f2433', bg = 'rgba(255,255,255,0.94)'} = {}) {
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = '700 60px Inter, system-ui, sans-serif';
  const W = Math.ceil(probe.measureText(text).width + 76);
  const H = 104;
  const tex = canvasTex(`map-label|${text}|${color}|${bg}`, W, H, (g, w, h) => {
    g.font = '700 60px Inter, system-ui, sans-serif';
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect(4, 4, w - 8, h - 8, (h - 8) / 2);
    g.fill();
    g.fillStyle = color;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 3);
  });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: tex, depthTest: false, transparent: true, sizeAttenuation: false, toneMapped: false, fog: false}));
  const k = 0.022 * size;
  sp.scale.set((k * W) / H, k, 1);
  sp.userData.base = sp.scale.clone(); // the page scales labels down from this as the camera pulls out
  sp.renderOrder = 20;
  // GTAO would draw the sprite's box as a solid surface and darken it (it leaves points and lines out)
  sp.isLine2 = true;
  return sp;
}

/** a dashed outline on the water: a closed loop of plan points, or a circle */
function dashed(points, color = '#3c4a7a', y = WATER + 0.4) {
  const g = new THREE.BufferGeometry().setFromPoints(points.map(([x, z]) => new THREE.Vector3(x, y, z)));
  const line = new THREE.LineLoop(g, new THREE.LineDashedMaterial({color, dashSize: 24, gapSize: 16, transparent: true, opacity: 0.85}));
  line.computeLineDistances();
  return line;
}
const rectPts = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const circlePts = (cx, cz, r, n = 72) => Array.from({length: n}, (_, i) => [cx + r * Math.cos((i / n) * PI * 2), cz + r * Math.sin((i / n) * PI * 2)]);

export function buildPortMap() {
  const root = new THREE.Group();
  // groups the page can show and hide: labels, the dashed lines on the water, the coloured zone pads, the roads
  const labels = new THREE.Group();
  const outlines = new THREE.Group();
  const pads = new THREE.Group();
  const roads = new THREE.Group();
  root.add(labels, outlines, pads, roads);
  const ticks = [];
  const add = (o, x, z, ry = 0, y = 0) => {
    o.position.set(x, y, z);
    o.rotation.y = ry;
    root.add(o);
    return o;
  };
  const label = (text, x, z, y = 60, size = 1) => {
    const sp = labelSprite(text, {size});
    sp.userData.major = size >= 1;
    sp.position.set(x, y, z);
    labels.add(sp);
    return sp;
  };

  // ---------------------------------------------------------------- water and land
  const water = buildToyWater({w: 10000, d: 8000, cx: 0, cz: -800});
  root.add(water.group);
  ticks.push(water.tick);
  const depth = -WATER + 6;
  const landGeo = new THREE.ExtrudeGeometry(landShape(), {depth, bevelEnabled: false, curveSegments: 24});
  landGeo.rotateX(-PI / 2);
  landGeo.translate(0, -depth, 0);
  // its own top material (not the shared cached one) so the page can recolour the ground
  const landMat = new THREE.MeshStandardMaterial({color: TOY.ground, roughness: 0.95});
  const land = new THREE.Mesh(landGeo, [landMat, toyMat(PORT_COLORS.concrete, {rough: 0.9})]);
  land.receiveShadow = true;
  root.add(land);
  // the Ro-Pax finger piers off the east quay
  for (const py of [318, 348]) {
    const [x0, z0] = P(476, py);
    const [x1, z1] = P(500, py + 5);
    const m = new THREE.Mesh(rb(x1 - x0, depth, z1 - z0, 0.6), toyMat(PORT_COLORS.concrete, {rough: 0.9}));
    m.position.set((x0 + x1) / 2, -depth / 2 + 0.01, (z0 + z1) / 2);
    m.receiveShadow = true;
    root.add(m);
  }

  // ---------------------------------------------------------------- the breakwater and the lights
  const bw = [[660, 268], [640, 245], [420, 205], [310, 170]].map((p) => P(...p));
  tpl('map-breakwater', (Pp) => {
    const rock = toyMat('#9aa0b8', {rough: 0.95});
    const crest = toyMat('#c9cfe2', {rough: 0.9});
    for (let i = 0; i < bw.length - 1; i++) {
      const [ax, az] = bw[i];
      const [bx, bz] = bw[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const ry = -Math.atan2(bz - az, bx - ax);
      Pp.add(rock, rb(len + 20, 9, 26, 4), (ax + bx) / 2, WATER + 1.5, (az + bz) / 2, 0, ry, 0);
      Pp.add(crest, rb(len + 6, 1.2, 8, 0.5), (ax + bx) / 2, WATER + 6.4, (az + bz) / 2, 0, ry, 0);
    }
    const [hx, hz] = bw[bw.length - 1];
    Pp.cyl(rock, 16, 19, 9, hx, WATER + 1.5, hz, 'y', 28);
  }, root);
  const tower = (x, z, h, band) => {
    tpl(`map-tower|${h}|${band}`, (Pp) => {
      Pp.cyl(paint(TOY.white), h * 0.09, h * 0.13, h, 0, h / 2, 0, 'y', 20);
      for (let k = 0; k < 3; k++) Pp.cyl(paint(band), h * 0.115 - k * h * 0.012, h * 0.12 - k * h * 0.012, h * 0.1, 0, h * (0.2 + k * 0.28), 0, 'y', 20);
      Pp.cyl(toyMat('#fff1c8', {emissive: '#ffcf6a', rough: 0.3}), h * 0.08, h * 0.08, h * 0.12, 0, h * 1.06, 0, 'y', 16);
      Pp.cyl(paint(band), h * 0.1, h * 0.06, h * 0.08, 0, h * 1.16, 0, 'y', 16);
    }, add(new THREE.Group(), x, z));
  };
  tower(...P(238, 139), 34, TOY.red);
  {
    const [hx, hz] = bw[bw.length - 1];
    const g = new THREE.Group();
    add(g, hx, hz, 0, WATER + 6);
    tpl('map-headlight', (Pp) => {
      Pp.cyl(paint(TOY.red), 1.4, 1.8, 10, 0, 5, 0, 'y', 16);
      Pp.cyl(toyMat('#ffd0d0', {emissive: '#ff5a5a', rough: 0.3}), 1.2, 1.2, 1.4, 0, 10.7, 0, 'y', 12);
    }, g);
  }

  // ---------------------------------------------------------------- navigation marks and water areas
  const buoy = (x, z, color, cone) => {
    const g = new THREE.Group();
    add(g, x, z, 0, WATER);
    tpl(`map-buoy|${color}|${cone}`, (Pp) => {
      Pp.cyl(paint(color), 2.6, 3.0, 2.4, 0, 0.6, 0, 'y', 18);
      Pp.cyl(paint(color), 0.7, 0.9, 5, 0, 4, 0, 'y', 10);
      if (cone) Pp.cyl(paint(color), 0.01, 1.8, 2.6, 0, 7.6, 0, 'y', 14);
      else Pp.cyl(paint(color), 1.4, 1.4, 2.2, 0, 7.4, 0, 'y', 14);
    }, g);
    ticks.push((t) => (g.position.y = WATER + 0.25 * Math.sin(t * 1.4 + x * 0.01)));
  };
  for (const py of [72, 102, 132]) {
    buoy(...P(309, py), TOY.red, false);
    buoy(...P(261, py), '#4fbf7d', true);
  }
  buoy(...P(285, 48), '#f6f8fd', false);
  outlines.add(dashed(rectPts(...P(265, 40), ...P(305, 158)), '#5a6c9e'));
  outlines.add(dashed(circlePts(...P(316, 242), 44 * PX)));
  outlines.add(dashed(circlePts(...P(463, 292), 34 * PX)));
  outlines.add(dashed(circlePts(...P(335, 95), 15 * PX), '#534ab7'));
  outlines.add(dashed(rectPts(...P(285, 180), ...P(321, 202)), '#854f0b'));
  outlines.add(dashed(rectPts(...P(420, 48), ...P(632, 160))));
  outlines.add(dashed(rectPts(...P(45, 48), ...P(170, 120)), '#993c1d'));
  outlines.add(dashed(rectPts(...P(45, 135), ...P(115, 190)), '#993c1d'));
  outlines.add(dashed(rectPts(...P(48, 352), ...P(110, 410)), '#854f0b'));
  for (const px of [370, 392, 414, 436]) buoy(...P(px, 214 + (px - 370) * 0.18), TOY.yellow, false);
  // the pilot and tug lane: service basin, through the entrance, out to the boarding ground
  {
    const pts = [[262, 196], [286, 160], [333, 103]].map((p) => P(...p));
    const g = new THREE.BufferGeometry().setFromPoints(pts.map(([x, z]) => new THREE.Vector3(x, WATER + 0.5, z)));
    const l = new THREE.Line(g, new THREE.LineDashedMaterial({color: '#534ab7', dashSize: 30, gapSize: 18}));
    l.computeLineDistances();
    outlines.add(l);
  }

  // ---------------------------------------------------------------- zone pads on the land
  const pad = (px0, py0, px1, py1, color, y = 0.15, into = pads) => {
    const [x0, z0] = P(px0, py0);
    const [x1, z1] = P(px1, py1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-PI / 2), toyMat(color, {rough: 0.95}));
    m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    m.receiveShadow = true;
    into.add(m);
    return m;
  };
  pad(148, 225, 206, 320, '#f3d2c4');
  pad(200, 250, 222, 282, '#d3d1c7');
  pad(245, 290, 275, 385, '#d6ece4');
  pad(307, 290, 357, 385, '#d6ece4');
  pad(389, 290, 427, 385, '#d6ece4');
  pad(215, 385, 500, 465, '#e1e3ea');
  pad(215, 385, 240, 425, '#f1efe8', 0.35);
  pad(433, 385, 500, 465, '#bfe7d8', 0.35);
  pad(218, 462, 310, 498, '#d3d1c7', 0.35);
  pad(500, 305, 540, 375, '#dcdaf6');
  pad(535, 292, 580, 322, '#dcdaf6');
  pad(600, 282, 640, 310, '#f6e2b8');
  // ---------------------------------------------------------------- the road network
  // Left-hand traffic. Cargo runs on a one-way ring behind the piers, clockwise seen from above: north side z 150 to the
  // east, east side x 590 to the south, south side z 440 to the west, west side x -545 to the north. Nothing crosses:
  // every link leaves the ring (a diverge) and comes back further on (a merge). Separate in and out gates to the toll
  // road: in at x -100 (ISPS gate), out at x 300 (X-ray, then the gate with the weighbridges). One north link at x -200
  // takes trucks just in straight to the piers. Each pier: in through its gate (west half), round the pier clockwise,
  // out through the gate's east half; the Ro-Ro yard, the rail depot and the quarantine yard hang off the ring the same
  // way. The energy zone has its own road and gate off the toll road; the ferry and cruise terminals a public road on
  // the city side.
  // Roads are paths: polylines whose corners are rounded into arcs, built as ribbons (asphalt, edge lines, lane dashes)
  // in two merged meshes. Where a road meets another, the corners of the mouth are rounded too (fillets) and the main
  // road's edge line is broken across it; a give-way line marks where traffic merges; zebra crossings where people walk.
  const TOLL_N = P(0, 503)[1];
  const TOLL_S = P(0, 508)[1];
  pad(-400, 503, 1000, 508, HIGHWAY, 0.55, roads);
  const marks = []; // straight white strips {x, z, l, w, ry}: length l along x when ry = 0
  const marksY = []; // the same in yellow (tractor-only paint, keep-clear boxes)
  const arrowsW = []; // painted lane arrows {x, z, ry}: pointing along +x when ry = 0
  const roadRects = []; // what the city keeps clear of
  const noEdge = []; // [x0, z0, x1, z1]: no edge lines here (junction mouths)
  const quiet = []; // no paint at all here (the gates paint their own)
  const inR = (x, z, rs) => rs.some(([a, b, c, d]) => x > a && x < c && z > b && z < d);
  const asp = [];
  const pntW = [];
  const pntY = []; // yellow: the roads only the terminal's own tractors use
  const arrowsY = [];
  /** a triangle in the ground plane, wound to face up */
  const tri = (arr, ax, az, bx, bz, cx, cz) => {
    if ((bz - az) * (cx - ax) - (bx - ax) * (cz - az) > 0) arr.push(ax, az, bx, bz, cx, cz);
    else arr.push(ax, az, cx, cz, bx, bz);
  };
  const quad = (arr, a, b, c, d) => {
    tri(arr, a[0], a[1], b[0], b[1], c[0], c[1]);
    tri(arr, a[0], a[1], c[0], c[1], d[0], d[1]);
  };
  // the toll road's centre dashes and edge lines; the north edge opens where roads join it, dashed along the slip lanes
  for (let x = -2000; x < 4000; x += 40) marks.push({x, z: (TOLL_N + TOLL_S) / 2, l: 18, w: 1.2, ry: 0});
  {
    const open = [[-894, -866], [1135, 1165]];
    const slips = [[-330, -94], [294, 510]];
    const cuts = [...open, ...slips].sort((a, b) => a[0] - b[0]);
    let x0 = -4392;
    for (const [a, b] of cuts) {
      marks.push({x: (x0 + a) / 2, z: TOLL_N + 0.8, l: a - x0, w: 0.5, ry: 0});
      x0 = b;
    }
    marks.push({x: (x0 + 4008) / 2, z: TOLL_N + 0.8, l: 4008 - x0, w: 0.5, ry: 0});
    marks.push({x: -192, z: TOLL_S - 0.8, l: 8400, w: 0.5, ry: 0});
    for (const [a, b] of slips) for (let x = a + 4; x < b - 4; x += 12) marks.push({x, z: TOLL_N + 0.8, l: 6, w: 0.45, ry: 0});
  }
  /** a polyline with its corners rounded to radius r (or less where the legs are short), sampled every 2 m:
   *  [{x, z, tx, tz, s}] with the unit tangent and the distance along */
  const smooth = (pts, r, closed) => {
    let Q = pts.map(([x, z]) => ({x, z}));
    if (closed) {
      const m = {x: (Q[0].x + Q[1].x) / 2, z: (Q[0].z + Q[1].z) / 2};
      Q = [m, ...Q.slice(1), Q[0], m];
    }
    const out = [Q[0]];
    for (let i = 1; i < Q.length - 1; i++) {
      const [a, b, c] = [Q[i - 1], Q[i], Q[i + 1]];
      const l0 = Math.hypot(b.x - a.x, b.z - a.z);
      const l1 = Math.hypot(c.x - b.x, c.z - b.z);
      const d0x = (b.x - a.x) / l0;
      const d0z = (b.z - a.z) / l0;
      const d1x = (c.x - b.x) / l1;
      const d1z = (c.z - b.z) / l1;
      const th = Math.acos(Math.min(1, Math.max(-1, d0x * d1x + d0z * d1z)));
      if (th < 1e-3) {
        out.push(b);
        continue;
      }
      const tq = Math.tan(th / 2);
      const rr = Math.min(r, Math.min(l0, l1) / 2 / tq);
      const t = rr * tq;
      const turn = Math.sign(d0x * d1z - d0z * d1x);
      const A = {x: b.x - d0x * t, z: b.z - d0z * t};
      const C = {x: A.x - d0z * turn * rr, z: A.z + d0x * turn * rr};
      const a0 = Math.atan2(A.z - C.z, A.x - C.x);
      const n = Math.max(3, Math.ceil((th * rr) / 2));
      for (let k = 0; k <= n; k++) {
        const g = a0 + (turn * th * k) / n;
        out.push({x: C.x + rr * Math.cos(g), z: C.z + rr * Math.sin(g)});
      }
    }
    out.push(Q[Q.length - 1]);
    const S = [];
    for (let i = 0; i < out.length; i++) {
      if (i === 0) {
        S.push({...out[0]});
        continue;
      }
      const a = out[i - 1];
      const b = out[i];
      const d = Math.hypot(b.x - a.x, b.z - a.z);
      if (d < 0.05) continue;
      const n = Math.ceil(d / 2);
      for (let k = 1; k <= n; k++) S.push({x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n});
    }
    let sAcc = 0;
    S.forEach((p, i) => {
      if (i) sAcc += Math.hypot(p.x - S[i - 1].x, p.z - S[i - 1].z);
      p.s = sAcc;
      const q0 = S[Math.max(0, i - 1)];
      const q1 = S[Math.min(S.length - 1, i + 1)];
      const l = Math.hypot(q1.x - q0.x, q1.z - q0.z) || 1;
      p.tx = (q1.x - q0.x) / l;
      p.tz = (q1.z - q0.z) / l;
    });
    return S;
  };
  /** a route along samples: its length and the pose at a distance s along it (yaw as the toy's ry: +x is 0) */
  const routes = {};
  const route = (S) => {
    const L = S[S.length - 1].s;
    const at = (s) => {
      s = Math.min(L, Math.max(0, s));
      let lo = 0;
      let hi = S.length - 1;
      while (hi - lo > 1) {
        const m = (lo + hi) >> 1;
        if (S[m].s <= s) lo = m;
        else hi = m;
      }
      const a = S[lo];
      const b = S[hi];
      const k = b.s > a.s ? (s - a.s) / (b.s - a.s) : 0;
      const tx = a.tx + (b.tx - a.tx) * k;
      const tz = a.tz + (b.tz - a.tz) * k;
      return {x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, yaw: Math.atan2(-tz, tx)};
    };
    /** the point of the route nearest (x, z): its distance along the route and how far off it is */
    const nearest = (x, z) => {
      let best = {s: 0, d: Infinity};
      for (let i = 0; i < S.length - 1; i++) {
        const a = S[i];
        const b = S[i + 1];
        const vx = b.x - a.x;
        const vz = b.z - a.z;
        const l2 = vx * vx + vz * vz || 1;
        const k = Math.min(1, Math.max(0, ((x - a.x) * vx + (z - a.z) * vz) / l2));
        const d = Math.hypot(a.x + vx * k - x, a.z + vz * k - z);
        if (d < best.d) best = {s: a.s + (b.s - a.s) * k, d};
      }
      return best;
    };
    return {L, at, nearest, points: S.map((p) => [p.x, p.z])};
  };
  /** a strip along the samples between lateral offsets o0..o1 (+ to the left of travel), skipping where skip(p) */
  const ribbon = (arr, S, o0, o1, skip = () => false) => {
    for (let i = 0; i < S.length - 1; i++) {
      const a = S[i];
      const b = S[i + 1];
      if (skip(a) || skip(b)) continue;
      const at = (p, o) => [p.x - p.tz * o, p.z + p.tx * o];
      quad(arr, at(a, o0), at(a, o1), at(b, o1), at(b, o0));
    }
  };
  /** a road along pts, w wide. kind 'one': one-way (arrows from the first point to the last, a dashed lane line when
   *  12 m or wider); 'two': two-way (a solid centre line). r: the corner radius */
  const road = (pts, w, kind = 'one', {r = 30, closed = false, name = null, yellow = false, paved = true, users = 'all'} = {}) => {
    const S = smooth(pts, r, closed);
    if (name) routes[name] = {...route(S), users, w, closed, twoWay: kind === 'two'};
    const pnt = yellow ? pntY : pntW;
    const arrows = yellow ? arrowsY : arrowsW;
    if (paved) ribbon(asp, S, -w / 2, w / 2);
    if (paved) for (let i = 0; i < pts.length - (closed ? 0 : 1); i++) {
      const [x0, z0] = pts[i];
      const [x1, z1] = pts[(i + 1) % pts.length];
      roadRects.push([Math.min(x0, x1) - w / 2, Math.min(z0, z1) - w / 2, Math.max(x0, x1) + w / 2, Math.max(z0, z1) + w / 2]);
    }
    const hush = (p) => inR(p.x, p.z, quiet);
    const edgeOff = (p) => hush(p) || inR(p.x, p.z, noEdge);
    // edge lines (thin ones hugging the sides on a narrow yard lane)
    const eo = w < 5 ? w / 2 - 0.2 : w / 2 - 0.8;
    const ew = w < 5 ? 0.12 : 0.25;
    for (const o of [-eo, eo]) ribbon(pnt, S, o - ew, o + ew, edgeOff);
    if (kind === 'two') {
      ribbon(pnt, S, -0.35, 0.35, edgeOff);
      return;
    }
    if (w >= 12) ribbon(pnt, S, -0.22, 0.22, (p) => hush(p) || p.s % 16 > 8);
    const total = S[S.length - 1].s;
    let j = 0;
    for (let s = Math.min(30, total / 2); s < total - 8; s += 70) {
      while (j < S.length - 1 && S[j].s < s) j++;
      const p = S[j];
      if (hush(p)) continue;
      for (const o of w >= 12 ? [-w / 4, w / 4] : [0]) arrows.push({x: p.x - p.tz * o, z: p.z + p.tx * o, ry: Math.atan2(-p.tz, p.tx)});
    }
  };
  /** a rounded corner where a road meets another: the asphalt between the two edges and a quarter circle of radius r
   *  whose centre sits r into the quadrant (qx, qz) from the corner (x, z) */
  const fillet = (x, z, r, qx, qz) => {
    const cx = x + qx * r;
    const cz = z + qz * r;
    const n = 8;
    for (let k = 0; k < n; k++) {
      const g0 = (k / n) * (PI / 2);
      const g1 = ((k + 1) / n) * (PI / 2);
      // from the point on the main edge (cx, z) round to the point on the side edge (x, cz)
      const p = (g) => [cx - qx * r * Math.sin(g), cz - qz * r * Math.cos(g)];
      const [ax, az] = p(g0);
      const [bx, bz] = p(g1);
      tri(asp, x, z, ax, az, bx, bz);
    }
  };
  /** a road along z (centre xs, ws wide) meeting the edge of a road along x at zEdge, running off to the side sgn;
   *  give: paint a give-way line across it (traffic merging onto the main road) */
  // (sides: which corners get a fillet; an L-shaped corner wants only its inner one)
  const teeZ = (xs, zEdge, ws, sgn, give = false, r = 12, sides = [-1, 1]) => {
    if (sides.includes(-1)) fillet(xs - ws / 2, zEdge, r, -1, sgn);
    if (sides.includes(1)) fillet(xs + ws / 2, zEdge, r, 1, sgn);
    noEdge.push([xs - ws / 2 - r - 0.5, zEdge - 1.8, xs + ws / 2 + r + 0.5, zEdge + 1.8]);
    if (give) for (let x = xs - ws / 2 + 1.5; x < xs + ws / 2 - 1; x += 2) marks.push({x, z: zEdge + sgn * 2.5, l: 1.1, w: 0.5, ry: 0});
  };
  const teeX = (zs, xEdge, ws, sgn, give = false, r = 12) => {
    fillet(xEdge, zs - ws / 2, r, sgn, -1);
    fillet(xEdge, zs + ws / 2, r, sgn, 1);
    noEdge.push([xEdge - 1.8, zs - ws / 2 - r - 0.5, xEdge + 1.8, zs + ws / 2 + r + 0.5]);
    if (give) for (let z = zs - ws / 2 + 1.5; z < zs + ws / 2 - 1; z += 2) marks.push({x: xEdge + sgn * 2.5, z, l: 1.1, w: 0.5, ry: PI / 2});
  };
  /** zebra crossings: bars along the traffic, 0.6 m wide every 1.2 m across the road */
  const zebraZ = (xc, z, w) => {
    for (let x = xc - w / 2 + 1.6; x < xc + w / 2 - 1.2; x += 1.2) marks.push({x, z, l: 4, w: 0.6, ry: PI / 2});
  };
  const zebraX = (x, zc, w) => {
    for (let z = zc - w / 2 + 1.6; z < zc + w / 2 - 1.2; z += 1.2) marks.push({x, z, l: 4, w: 0.6, ry: 0});
  };
  // the gates stand on the asphalt; the road paint keeps out from under them
  const gates = {};
  const gate = (lanes, name, x, z, ry, len = 26, half = 20) => {
    const g = buildToyGate({lanes, name});
    add(g.group, x, z, ry, 0.56);
    quiet.push(ry ? [x - half, z - len, x + half, z + len] : [x - len, z - half, x + len, z + half]);
    gates[name] = {...g, x, z, ry};
    return g;
  };
  const IN2 = [{z: -3, dir: 1}, {z: 3, dir: 1}];
  const OUT2 = [{z: -3, dir: -1}, {z: 3, dir: -1}];
  const RN = 150;
  const RS = 440;
  const RW = -545;
  const RE = 590;
  // the gates (registered first, so the paint knows where they are)
  gate(IN2, 'GERBANG MASUK', -100, 600, PI / 2, 26, 9);
  gate(OUT2, 'GERBANG KELUAR', 300, 600, PI / 2, 26, 9);
  quiet.push([288, 474, 312, 506]); // under the X-ray portal
  gate([{z: -12, dir: 1}, {z: -6, dir: 1}, {z: 6, dir: -1}, {z: 12, dir: -1}], 'GATE A', -460, 90, PI / 2);
  gate(IN2, 'GATE B MASUK', PB.gateIn, PB.laneZ, 0, 22, 7);
  gate(IN2, 'GATE B KELUAR', PB.gateOut, PB.laneZ, 0, 22, 7);
  gate([{z: -12, dir: 1}, {z: -6, dir: 1}, {z: 6, dir: -1}, {z: 12, dir: -1}], 'GATE C', 456, 90, PI / 2);
  gate(IN2, 'GATE RO-RO', 640, 215, 0, 26, 9);
  gate([{z: -3, dir: 1}, {z: 3, dir: -1}], 'GERBANG ENERGI', -880, 250, PI / 2, 26, 9);
  // the junctions: rounded mouths, the main road's edge line broken, give-way lines where traffic merges
  teeZ(PB.inX, PB.root + 7, 14, 1, true);
  teeZ(PB.outX, PB.root + 7, 14, 1);
  // the apron loop leaves and rejoins the root aisle at its ends: inner corners rounded only (no asphalt spurs out
  // over the crane lanes)
  teeZ(-PB.apronX, PB.root - 7, 14, -1, false, 12, [1]);
  teeZ(PB.apronX, PB.root - 7, 14, -1, true, 12, [-1]);
  for (const [xi, xo] of [[-469, -451], [447, 465]]) {
    teeZ(xi, RN - 7, 18, -1);
    teeZ(xo, RN - 7, 18, -1, true);
  }
  teeZ(-360, RN + 7, 14, 1, true); // the north link onto the north side
  {
    // gate B's forecourt: where the in lane leaves the ring and the out lane joins it (tapers: the ring's edge line
    // open), the turn-back between the in and out roads, the mouths of the truck buffer lot and the CFS yard
    // the in lane peels off the ring (a taper x -380..-330, then a dashed line to x -260) and runs flush along it to
    // the in gate; the out lane runs flush along it from the out gate and merges back (dashed x 160..240, taper to 290)
    noEdge.push([-382, RN - 8.5, -258, RN - 5.5], [158, RN - 8.5, 292, RN - 5.5]);
    for (let x = -378; x < -260; x += 8) marks.push({x, z: RN - 7, l: 4, w: 0.45, ry: 0});
    for (let x = 162; x < 290; x += 8) marks.push({x, z: RN - 7, l: 4, w: 0.45, ry: 0});
    tri(asp, -380, RN - 7, -330, RN - 21, -330, RN - 7);
    tri(asp, 240, RN - 21, 290, RN - 7, 240, RN - 7);
    teeX(PB.backZ, PB.inX + 7, 10, 1);
    teeX(PB.backZ, PB.outX - 7, 10, -1, true);
    const wi = PB.inX - 7;
    const eo = PB.outX + 7;
    noEdge.push([wi - 2.5, 94, wi + 2, 110], [wi - 2.5, 26, wi + 2, 42], [eo - 2, 34, eo + 2.5, 50], [eo - 2, 64, eo + 2.5, 80]);
    for (let z = 29.5; z <= 39; z += 2) marks.push({x: wi - 2.5, z, l: 1.1, w: 0.5, ry: PI / 2});
    for (let z = 67.5; z <= 77; z += 2) marks.push({x: eo + 2.5, z, l: 1.1, w: 0.5, ry: PI / 2});
  }
  teeZ(-360, RS - 7, 14, -1); // ... off the south side
  teeZ(-100, RS + 7, 12, 1, true); // the in ramp onto the ring
  teeZ(300, RS + 7, 12, 1); // the out ramp off it
  teeZ(-380, RS + 7, 10, 1);
  teeZ(-490, RS + 7, 10, 1, true); // the rail depot loop
  teeX(300, RW - 7, 10, -1);
  teeX(200, RW - 7, 10, -1, true); // the quarantine loop
  teeX(215, RE + 7, 12, 1);
  teeX(380, RE + 7, 12, 1, true); // the Ro-Ro loop
  teeZ(-880, TOLL_N, 12, -1, false, 12); // the energy road off the toll road
  teeZ(1150, TOLL_N, 14, -1, false, 12); // the public road
  teeX(-300, -874, 10, 1); // the shipyard branch
  teeX(-250, 1157, 12, 1); // the cruise branch
  // tapers where the slip lanes leave and rejoin the toll road
  tri(asp, -330, TOLL_N, -280, TOLL_N - 12, -280, TOLL_N);
  tri(asp, 460, TOLL_N - 12, 510, TOLL_N, 460, TOLL_N);
  // the ring
  road([[RW, RN], [RE, RN], [RE, RS], [RW, RS]], 14, 'one', {r: 40, closed: true, name: 'ring'});
  // in: the slip lane off the eastbound toll lanes, round onto the ramp north, the gate, onto the ring
  road([[-280, TOLL_N - 6], [-100, TOLL_N - 6], [-100, RS + 7]], 12, 'one', {r: 40, name: 'in'});
  // out: off the ring, the X-ray portal, the gate, round onto the slip lane east
  road([[300, RS + 7], [300, TOLL_N - 6], [460, TOLL_N - 6]], 12, 'one', {r: 40, name: 'out'});
  // the north link
  road([[-360, RS - 7], [-360, RN + 7]], 14, 'one', {name: 'northLink'});
  // the piers: in through the gate's west half, round the pier clockwise, out through the east half
  const pier = (xi, xo, xw, xe, zh, name) => road([[xi, RN - 7], [xi, 10], [xw, 10], [xw, zh], [xe, zh], [xe, 10], [xo, 10], [xo, RN - 7]], 18, 'one', {r: 16, name});
  pier(-469, -451, -509, -405, -511, 'pierA');
  pier(447, 465, 362, 552, -545, 'pierC');
  // pier B. White: the roads the outside trucks use — the gate stubs, the two-way root aisle, the two-way cross aisles,
  // the RTG lanes in sections 0 and 1, the empty depot's middle aisle. Yellow: the terminal's own tractors only — the
  // one-way apron loop, the lanes of section 2 (the vessel stack), and per berth a connector off the apron loop into
  // the working lane under the cranes' trolleys (x -+132) and back (painted on the apron, not paved: the crane rails
  // stay in view). Routes also for the pass lanes under the cranes (x -+137).
  {
    const R = PB.root;
    const A = PB.apronX;
    // no paint over the crane rails (landside x -+126, waterside x -+146): the connectors cross the landside one
    for (const s of [-1, 1]) for (const x of [126, 146]) quiet.push([s * x - 1.2, -600, s * x + 1.2, 0]);
    // in: off the ring's north side on a long taper, the queue (2 lanes) to the in gate, east, a wide left turn (r 24)
    // north and straight up to the root aisle. Out: from the root aisle straight south, a wide left turn east, the out
    // gate, a taper onto the ring. The turn-back east at z 10
    const LZ = PB.laneZ;
    road([[-330, LZ], [PB.inX, LZ], [PB.inX, R + 7]], 14, 'one', {r: 24, name: 'pierB.in'});
    road([[PB.outX, R + 7], [PB.outX, LZ], [240, LZ]], 14, 'one', {r: 24, name: 'pierB.out'});
    // the tapers as routes, so the movers' graph links the ring to the lanes
    routes['pierB.inTaper'] = {...route(smooth([[-385, RN], [-330, LZ]], 0, false)), users: 'all', w: 14};
    routes['pierB.outTaper'] = {...route(smooth([[240, LZ], [295, RN]], 0, false)), users: 'all', w: 14};
    road([[PB.inX + 7, PB.backZ], [PB.outX - 7, PB.backZ]], 10, 'one', {name: 'pierB.turnBack'});
    road([[-A - 7, R], [A + 7, R]], 14, 'two', {name: 'pierB.root'});
    // the two-way roads' lanes, for the movers (left-hand traffic: eastbound keeps to the north side, z - 3.5)
    const lanes2 = (name, z, x0, x1) => {
      routes[`${name}.E`] = {...route(smooth([[x0, z - 3.5], [x1, z - 3.5]], 0, false)), users: 'all', w: 7, laneOf: name};
      routes[`${name}.W`] = {...route(smooth([[x1, z + 3.5], [x0, z + 3.5]], 0, false)), users: 'all', w: 7, laneOf: name};
    };
    lanes2('pierB.root', R, -A - 7, A + 7);
    for (const z of PB.aisles) lanes2(`pierB.aisle${z}`, z, -A + 7, A - 7);
    road([[-A, R - 7], [-A, PB.head], [A, PB.head], [A, R - 7]], 14, 'one', {r: 16, name: 'pierB.apron', yellow: true, users: 'tractor'});
    for (const z of PB.aisles) {
      road([[-A + 7, z], [A - 7, z]], 14, 'two', {name: `pierB.aisle${z}`});
      teeX(z, -A + 7, 14, 1);
      teeX(z, A - 7, 14, -1);
    }
    PB.blocks.forEach((bx, bi) => PB.sections.forEach((sec, si) => {
      if (PB.empty(bi, si) || PB.isSC(bi, si)) return;
      const lx = bx + PB.lane;
      const zs = si === 0 ? R - 7 : PB.aisles[si - 1] - 7;
      const zn = si === 2 ? PB.head + 7 : PB.aisles[si] + 7;
      const vessel = !PB.outside.includes(si);
      road(PB.north(bi) ? [[lx, zs], [lx, zn]] : [[lx, zn], [lx, zs]], PB.laneW, 'one', {name: `pierB.lane${bi}.${si}`, yellow: vessel, users: vessel ? 'tractor' : 'all'});
    }));
    // the empty depot's middle aisle, one way north from the root aisle to the first cross aisle
    {
      const ex = PB.emptyX;
      road([[ex, R - 7], [ex, PB.aisles[0] + 7]], PB.laneW, 'one', {name: 'pierB.emptyAisle'});
    }
    // the crane connectors: west side northbound, east side southbound with the apron loop. Each: off the loop, along
    // the working lane past the berth's three cranes, back onto the loop
    for (const zc of PB.berths) {
      // (the 20 m shift over 30 m, curves r 16: a tractor and chassis, ±20 m, takes it without cutting the corner)
      const z0 = zc + PB.craneBays[2] + 62; // south of the cranes
      const z1 = zc - PB.craneBays[0] - 14; // north of them
      road([[-A, z0 + 30], [-PB.qcLane, z0], [-PB.qcLane, z1], [-A, z1 - 30]], 5, 'one', {r: 16, paved: false, yellow: true, name: `pierB.qcW${zc}`, users: 'tractor'});
      road([[A, z1 - 30], [PB.qcLane, z1], [PB.qcLane, z0], [A, z0 + 30]], 5, 'one', {r: 16, paved: false, yellow: true, name: `pierB.qcE${zc}`, users: 'tractor'});
    }
    for (const s of [-1, 1]) {
      const x = s * (PB.qcLane + 5);
      const pts = s < 0 ? [[x, R - 7], [x, PB.head]] : [[x, PB.head], [x, R - 7]];
      routes[`pierB.qcPass${s < 0 ? 'W' : 'E'}`] = {...route(smooth(pts, 0, false)), users: 'tractor', w: 5};
    }
  }
  // the Ro-Ro yard: in through its gate, up to the quay apron (the ramp), round the yard, back onto the ring
  road([[RE + 7, 215], [700, 215], [700, 30], [980, 30], [980, 380], [RE + 7, 380]], 12, 'one', {r: 24, name: 'roro'});
  // the rail depot and the quarantine yard
  road([[-380, RS + 7], [-380, 470], [-490, 470], [-490, RS + 7]], 10, 'one', {r: 8});
  road([[RW - 7, 300], [-620, 300], [-620, 200], [RW - 7, 200]], 10, 'one', {r: 14});
  // the energy zone's road and the shipyard branch; the public road and the cruise branch
  road([[-880, TOLL_N], [-880, -380]], 12, 'two');
  road([[-874, -300], [-720, -300], [-720, -610]], 10, 'two', {r: 24});
  road([[1150, TOLL_N], [1150, -40]], 14, 'two');
  road([[1157, -250], [1350, -250], [1350, -380]], 12, 'two', {r: 24});
  // pier B's junction paint: where a yard lane meets an aisle, a give-way line across the lane end (traffic coming out
  // yields to the aisle) and a yellow keep-clear box on the aisle in front of the mouth (no stopping across it, so the
  // turns over the opposite lane stay clear)
  {
    const box = (cx, cz, w, d) => {
      const e = [[cx, cz - d / 2, w, 0], [cx, cz + d / 2, w, 0], [cx - w / 2, cz, d, PI / 2], [cx + w / 2, cz, d, PI / 2]];
      for (const [x, z, l, ry] of e) marksY.push({x, z, l, w: 0.4, ry});
      const L = Math.hypot(w, d);
      const a = Math.atan2(d, w);
      marksY.push({x: cx, z: cz, l: L, w: 0.4, ry: a}, {x: cx, z: cz, l: L, w: 0.4, ry: -a});
    };
    const give = (x, z) => {
      for (let u = -1.8; u <= 1.9; u += 1.2) marks.push({x: x + u, z, l: 0.8, w: 0.45, ry: 0});
    };
    const aislesZ = [PB.root, ...PB.aisles];
    PB.blocks.forEach((bx, bi) => {
      const lx = bx + PB.lane;
      aislesZ.forEach((az, ai) => {
        box(lx, az, 6, 13);
        // the lanes that end on this aisle: a north lane from the section south of it, a south lane from the one north
        const fromSouth = ai > 0 && PB.north(bi) && !PB.empty(bi, ai - 1);
        const fromNorth = ai < 2 && !PB.north(bi) && !PB.empty(bi, ai);
        if (fromSouth) give(lx, az + 7 + 2.5);
        if (fromNorth) give(lx, az - 7 - 2.5);
      });
    });
    box(PB.emptyX, PB.root, 6, 13);
    box(PB.emptyX, PB.aisles[0], 6, 13);
    give(PB.emptyX, PB.aisles[0] + 7 + 2.5);
  }
  // the CFS road, and the outline of the straddle carriers' block with a carrier lane mark at each row end
  // the CFS yard (paved): one-way lanes painted on it. In off the forecourt loop at z 42, east along the north lane, down
  // the east lane (the first reach stacker's trucks), west along the south lane, up the west lane past the docks and
  // back onto the loop at z 68. The middle lane (x 178, north) short-cuts from the south lane back to the north one,
  // past the second and third reach stackers
  {
    const Y = PB.cfsYard;
    quad(asp, [Y.x0, Y.z0], [Y.x1, Y.z0], [Y.x1, Y.z1], [Y.x0, Y.z1]);
    roadRects.push([Y.x0, Y.z0, Y.x1, Y.z1]);
    road([[PB.outX + 7, 42], [250, 42], [250, 110], [95, 110], [95, 72], [PB.outX + 7, 72]], 10, 'one', {r: 16, paved: false, name: 'cfs'});
    road([[178, 105], [178, 47]], 8, 'one', {paved: false, name: 'cfs.middle'});
  }
  {
    const [z0, z1] = PB.sections[PB.sc.section];
    for (const bi of PB.sc.blocks) {
      const x0 = PB.blocks[bi] + PB.sc.offsets[0] - 3.25;
      const x1 = PB.blocks[bi] + PB.sc.offsets[PB.sc.offsets.length - 1] + 3.25;
      for (const z of [z0 + 4, z1 - 4]) marksY.push({x: (x0 + x1) / 2, z, l: x1 - x0, w: 0.4, ry: 0});
      for (const x of [x0, x1]) marksY.push({x, z: (z0 + z1) / 2, l: z0 - z1 + 8, w: 0.4, ry: PI / 2});
    }
    // the leg tracks: a short yellow line each side of every row at both ends
    for (const x of PB.sc.rows) for (const sx of [-2.7, 2.7]) for (const z of [z0 + 1, z1 - 1]) marksY.push({x: x + sx, z, l: 6, w: 0.3, ry: PI / 2});
    // each row both ways, from the aisle's centre to the head lane's: a carrier from a west crane comes off the head lane
    // south down a row and leaves west along the aisle; one from an east crane comes in off the aisle north up a row and
    // leaves east along the head lane (the head lane, the aisle and the apron loop link them to the crane lanes)
    // a straddle carrier back from the blocks to the west cranes: off the aisle's west end straight into the crane lane
    // (a carrier turns far tighter than a truck), up past the cranes and onto the apron loop by the head
    routes['pierB.sc.toQcW'] = {...route(smooth([[-PB.apronX + 7, PB.aisles[1] + 3.5], [-PB.qcLane, PB.aisles[1] - 12], [-PB.qcLane, -505], [-PB.apronX, -525]], 8, false)), users: 'sc', w: 6};
    PB.sc.rows.forEach((x, r) => {
      routes[`pierB.scRow${r}`] = {...route(smooth([[x, PB.aisles[1]], [x, PB.head]], 0, false)), users: 'sc', w: 6};
      routes[`pierB.scRow${r}.S`] = {...route(smooth([[x, PB.head], [x, PB.aisles[1]]], 0, false)), users: 'sc', w: 6};
    });
  }
  // parking. Pier B's root, either side of the gate stubs, south of the root aisle: the yard tractors' pocket (west,
  // yellow stalls, 5 m wide, 24 m deep: a tractor and its chassis backed in) and the equipment park (east).
  {
    // (the pockets keep clear of the in and out roads at x -+30)
    for (let x = -100; x <= -45; x += 5) marksY.push({x, z: -20, l: 26, w: 0.3, ry: PI / 2});
    marksY.push({x: -72.5, z: -33, l: 55, w: 0.4, ry: 0});
    for (const x of [46, 62, 78, 94]) marksY.push({x, z: -20, l: 26, w: 0.3, ry: PI / 2});
    marksY.push({x: 70, z: -33, l: 48, w: 0.4, ry: 0});
    // the truck buffer lot (inside the fence): in off the forecourt loop's west side at z 72, down the east aisle,
    // across the south, up the west aisle, across the north and out at z 38. Stalls 24 m deep, noses to the west aisle
    const L = PB.lot;
    quad(asp, [L.x0, L.z0], [L.x1, L.z0], [L.x1, L.z1], [L.x0, L.z1]);
    for (let z = 40; z <= 95; z += 5) marks.push({x: -153, z, l: 24, w: 0.3, ry: 0}, {x: -109, z, l: 24, w: 0.3, ry: 0});
    // in off the in road at z 102, west along the south, up the west aisle, east along the north, out at z 34
    arrowsW.push({x: -60, z: 102, ry: PI}, {x: -131, z: 70, ry: PI / 2}, {x: -90, z: 32, ry: 0}, {x: -50, z: 32, ry: 0});
    routes['pierB.buffer'] = {...route(smooth([[PB.inX, 102], [-131, 102], [-131, 32], [PB.inX, 32]], 16, false)), users: 'all', w: 10};
  }
  // zebra crossings: staff from the office over the ring to gate B, drivers over the pier stubs to the gate kiosks,
  // the ramps by the gates and the X-ray cabin, the Ro-Ro yard, the ferry and cruise terminals
  for (const xc of [-460, 456]) zebraZ(xc, 128, 36);
  zebraZ(-100, 645, 12);
  zebraZ(300, 530, 12);
  zebraZ(700, 120, 12);
  zebraZ(1150, -20, 14);
  zebraZ(1350, -360, 12);
  // the meshes: asphalt, ribbon paint, the straight strips (instanced), the arrows (instanced)
  {
    const flat = (arr, y, mat) => {
      const pos = new Float32Array((arr.length / 2) * 3);
      const nor = new Float32Array(pos.length);
      for (let i = 0; i < arr.length / 2; i++) {
        pos[i * 3] = arr[i * 2];
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = arr[i * 2 + 1];
        nor[i * 3 + 1] = 1;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      const m = new THREE.Mesh(g, mat);
      m.receiveShadow = true;
      return m;
    };
    // the paint is worn: half see-through, so the asphalt shows through and the lines guide without shouting
    const worn = (color, opacity) => new THREE.MeshStandardMaterial({color, roughness: 0.95, transparent: true, opacity, depthWrite: false});
    const paintMat = worn('#f4f6fc', 0.5);
    const yellowMat = worn('#e9c55a', 0.55);
    roads.add(flat(asp, 0.55, toyMat(ROAD, {rough: 0.95})), flat(pntW, 0.6, paintMat), flat(pntY, 0.6, yellowMat));
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const Y = new THREE.Vector3(0, 1, 0);
    const strip = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2), paintMat, marks.length);
    marks.forEach((k, i) => strip.setMatrixAt(i, m4.compose(new THREE.Vector3(k.x, 0.61, k.z), q.setFromAxisAngle(Y, k.ry), new THREE.Vector3(k.l, 1, k.w))));
    const sh = new THREE.Shape();
    sh.moveTo(-2.6, -0.35);
    sh.lineTo(0.4, -0.35);
    sh.lineTo(0.4, -1.1);
    sh.lineTo(2.6, 0);
    sh.lineTo(0.4, 1.1);
    sh.lineTo(0.4, 0.35);
    sh.lineTo(-2.6, 0.35);
    sh.closePath();
    const arrowGeo = new THREE.ShapeGeometry(sh).rotateX(-PI / 2);
    for (const [list, mat] of [[arrowsW, paintMat], [arrowsY, yellowMat]]) {
      const arrow = new THREE.InstancedMesh(arrowGeo, mat, list.length);
      list.forEach((k, i) => arrow.setMatrixAt(i, m4.compose(new THREE.Vector3(k.x, 0.62, k.z), q.setFromAxisAngle(Y, k.ry), new THREE.Vector3(1, 1, 1))));
      roads.add(arrow);
    }
    roads.add(strip);
    const stripY = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2), yellowMat, marksY.length);
    marksY.forEach((k, i) => stripY.setMatrixAt(i, m4.compose(new THREE.Vector3(k.x, 0.61, k.z), q.setFromAxisAngle(Y, k.ry), new THREE.Vector3(k.l, 1, k.w))));
    roads.add(stripY);
  }
  // the X-ray portal across the out ramp, its control cabin beside it
  tpl('map-xray', (Pp) => {
    const wall = toyMat('#e9edf8', {rough: 0.8});
    const yel = paint('#f2c230', 0.5);
    const ink = toyMat('#2b3248', {rough: 0.6});
    for (const x of [290.6, 309.4]) Pp.ext(wall, x - 0.8, x + 0.8, 0, 7.5, 478, 502, 0.3);
    Pp.ext(wall, 289, 311, 7.5, 8.9, 477, 503, 0.4);
    for (const z of [478, 502]) Pp.ext(yel, 288.8, 311.2, 7.6, 8.7, z - 0.6, z + 0.6, 0.2);
    for (const x of [290.6, 309.4]) for (let k = 0; k < 4; k++) Pp.ext(ink, x - 0.85, x + 0.85, 0.4 + k * 1.7, 1.2 + k * 1.7, 477.6, 478.4, 0.05);
    Pp.ext(paint(TOY.white, 0.5), 314, 322, 0, 3.4, 486, 494, 0.3);
    Pp.ext(paint(TOY.blue, 0.46), 313.7, 322.3, 3.4, 3.9, 485.7, 494.3, 0.15);
  }, root);

  // ---------------------------------------------------------------- the energy zone: tanks, jetties, dolphins
  tpl('map-energy', (Pp) => {
    const white = paint(TOY.white, 0.5);
    const bund = toyMat('#d9b8a8', {rough: 0.95});
    // LNG full containment tanks and LPG spheres
    for (const [px, py] of [[168, 292], [188, 300]]) {
      const [x, z] = P(px, py);
      Pp.cyl(white, 43, 43, 40, x, 20, z, 'y', 40);
      Pp.add(white, new THREE.SphereGeometry(43, 32, 10, 0, PI * 2, 0, PI / 2), x, 40, z, 0, 0, 0, 1, 0.3, 1);
    }
    for (const [px, py] of [[160, 270], [170, 268]]) {
      const [x, z] = P(px, py);
      Pp.add(white, new THREE.SphereGeometry(9, 18, 12), x, 12, z);
      Pp.cyl(toyMat('#8a93ad', {rough: 0.6}), 0.6, 0.6, 6, x, 3, z, 'y', 8);
    }
    // oil, product and CPO tanks in bunds
    for (const [px, py, r] of [[165, 245, 30], [180, 250, 26], [194, 242, 26], [160, 232, 20], [176, 232, 20], [192, 230, 20]]) {
      const [x, z] = P(px, py);
      Pp.ext(bund, x - r - 6, x + r + 6, 0, 1.6, z - r - 6, z + r + 6, 0.6);
      Pp.cyl(white, r * 0.98, r, 18, x, 9, z, 'y', 32);
      Pp.cyl(toyMat('#c9cfe0', {rough: 0.6}), r * 0.9, r * 0.9, 0.6, x, 18.2, z, 'y', 32);
    }
    // jetties: trestle, platform, breasting and mooring dolphins
    const deck = toyMat(PORT_COLORS.concrete, {rough: 0.9});
    const dolph = toyMat('#7d8399', {rough: 0.8});
    for (const [p0, p1, ship] of [[[150, 302], [106, 302], 'lng'], [[155, 242], [116, 241], 'oil']]) {
      const [x0, z0] = P(...p0);
      const [x1, z1] = P(...p1);
      Pp.ext(deck, Math.min(x0, x1), Math.max(x0, x1), -1.2, 0.2, Math.min(z0, z1) - 4, Math.max(z0, z1) + 4, 0.4);
      Pp.ext(deck, x1 - 6, x1 + 26, -1.4, 0.4, z1 - 18, z1 + 18, 0.6);
      for (let x = Math.min(x0, x1); x < Math.max(x0, x1); x += 24) Pp.cyl(dolph, 0.9, 0.9, 6, x, -3.5, z0, 'y', 8);
      const L = ship === 'lng' ? 260 : 230;
      for (const k of [-0.18, 0.18]) Pp.cyl(dolph, 5, 5, 6, x1 - 4, -1.4, z1 + k * L, 'y', 14);
      for (const k of [-0.42, 0.42]) Pp.cyl(dolph, 4, 4, 5, x1 - 2, -1.6, z1 + k * L, 'y', 14);
    }
  }, root);

  // ---------------------------------------------------------------- the shipyard and the service basin
  tpl('map-yard', (Pp) => {
    const dock = toyMat('#6f7590', {rough: 0.8});
    for (const py of [255, 270]) {
      const [x0, z0] = P(204, py);
      const [x1, z1] = P(222, py + 7);
      Pp.ext(dock, x0, x1, -3, 0.3, z0, z1, 0.6);
    }
    const pont = toyMat('#c8a46a', {rough: 0.8});
    for (const [px, py, w] of [[241, 186, 16], [243, 196, 14]]) {
      const [x0, z0] = P(px, py);
      Pp.ext(pont, x0, x0 + w * PX, WATER - 0.5, WATER + 0.9, z0, z0 + 10, 0.4);
    }
  }, root);

  // ---------------------------------------------------------------- pier A: dry bulk, silos, livestock at the head
  tpl('map-pierA', (Pp) => {
    const coal = toyMat('#4c5266', {rough: 0.95});
    const ore = toyMat('#b8865a', {rough: 0.95});
    for (const [x, m] of [[-480, coal], [-438, ore]]) Pp.add(m, rb(32, 14, 360, 12), x, 6, -320);
    const silo = paint('#e9edf8', 0.5);
    for (const z of [-430, -400, -370, -340]) {
      Pp.cyl(silo, 9, 9, 32, -372, 16, z, 'y', 24);
      Pp.add(silo, new THREE.SphereGeometry(9, 16, 6, 0, PI * 2, 0, PI / 2), -372, 32, z, 0, 0, 0, 1, 0.4, 1);
    }
    const conv = toyMat('#9aa3bf', {rough: 0.6});
    // the covered conveyor from the silos down the pier and across the backland to the rail depot's loadout silo
    Pp.ext(conv, -374, -370, 6, 8, -330, 500, 0.5);
    Pp.ext(conv, -622, -370, 6, 8, 496, 500, 0.5);
    const pen = toyMat('#d9c3a0', {rough: 0.9});
    Pp.ext(pen, -510, -360, 0, 3, -566, -520, 0.6);
  }, root);

  // ---------------------------------------------------------------- pier B: the container terminal
  // The yard (see PB): one bay is one height (2-3 high, the odd outer row a tier lower, some bays empty). Landside: the
  // reefer section (racks between the rows, white boxes) in blocks 2 and 3, the empty depot (20 ft empties 4-5 high,
  // worked by empty handlers) in block 5. Every box sits in a slot of pierB.yard.slots ({id, kind, x, z, ry, len, tiers:
  // [index into the field]}), so a mover can hide the box it lifts (field.setVisible) and find where to put one.
  const pierB = {cranes: [], rtgs: [], ships: [], trucks: [], yard: null, gate: {in: gates['GATE B MASUK'], out: gates['GATE B KELUAR']}};
  {
    const list = [];
    const slots = [];
    let seed = 5;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const cols = Object.values(CC);
    const pick = () => cols[Math.floor(rnd() * cols.length)];
    const slot = (id, kind, x, z, len, n, color) => {
      const sl = {id, kind, x, z, ry: PI / 2, len, tiers: []};
      for (let k = 0; k < n; k++) {
        sl.tiers.push(list.length);
        list.push({x, y: k * BOX.H, z, len, ry: PI / 2, color: color(k)});
      }
      slots.push(sl);
      return sl;
    };
    // a yard tractor with its chassis (and a box on it when color is given), heading ry, the tractor's centre at x, z.
    // The box on the chassis sits 9.8 m behind the tractor's centre.
    const tnums = ['03', '07', '12', '15', '21'];
    let tn = 0;
    // kind 'tractor': the terminal's own (blue yard tractor + terminal chassis); 'road': an outside truck (a road
    // tractor + skeletal trailer, the Kestrel white cab-over or the red cab). Both are placed with the box under x, z
    // shifted the same 9.8 m back from the cab's centre as the tractor's (close enough for a parked pose)
    const pms = ['8640', '8812', '3127', '5504'];
    let pn = 0;
    const truck = (x, z, ry, color = null, kind = 'tractor') => {
      const road = kind === 'road';
      const tt = road ? (pn % 2 ? buildToyRedCabTractor({number: pms[pn++ % pms.length]}) : buildToyPrimeMover({livery: 'kestrel', number: pms[pn++ % pms.length]})) : buildToyTerminalTractor({number: tnums[tn++ % tnums.length]});
      const ch = road ? buildToySkeletalTrailer() : buildToyTerminalChassis();
      const hx = Math.cos(ry);
      const hz = -Math.sin(ry);
      const off = tt.fifth.x - ch.kingpin;
      add(tt.group, x, z, ry);
      add(ch.group, x + hx * off, z + hz * off, ry);
      let box = null;
      if (color) {
        box = list.length;
        list.push({x: x + hx * (off + ch.boxX), y: ch.deckY, z: z + hz * (off + ch.boxX), len: BOX.L40, ry, color});
      }
      pierB.trucks.push({kind, tractor: tt, chassis: ch, x, z, ry, box});
    };
    const LANE = PB.lane;
    let rn = 1;
    PB.blocks.forEach((bx, bi) => PB.sections.forEach((sec, si) => {
      const reefer = PB.reefer(bi, si);
      const empty = PB.empty(bi, si);
      const zs = pbBays(sec);
      if (empty) {
        // two pairs of rows of 20 ft empties, the working aisle between (see PB.emptyRows)
        PB.emptyRows.forEach((u0, r) => {
          const u = PB.emptyX - bx + u0;
          let b = 0;
          for (let z = sec[0] - 5; z - 4 >= sec[1]; z -= 8.6, b++) {
            const t = rnd() < 0.08 ? 0 : 4 + (rnd() < 0.5 ? 1 : 0);
            const c = [CC.orange, CC.sky, CC.steel, CC.white, CC.lavender][Math.floor(rnd() * 5)];
            slot(`B${bi}.${si}.${b}.${r}`, 'empty', bx + u, z, BOX.L20, t, () => (rnd() < 0.7 ? c : pick()));
          }
        });
        return;
      }
      if (reefer) {
        // a rack down the block with a row of reefers each side, two more rows toward the truck lane
        const rack = buildToyReeferRack({bays: zs.length});
        add(rack.group, bx - 5.3, (zs[0] + zs[zs.length - 1]) / 2, PI / 2);
        zs.forEach((z, b) => [-8.9, -1.7, 1.7, 5.1].forEach((u, r) => {
          const t = u < 0 ? 2 : 1 + (rnd() < 0.5 ? 1 : 0);
          slot(`B${bi}.${si}.${b}.${r}`, 'reefer', bx + u, z, BOX.L40, t, (k) => (k === 1 && rnd() < 0.3 ? CC.kestrel : CC.white));
        }));
        // an RTG over the reefer section too (the rack is lower than its girders)
        const rtg = buildToyRTG({number: String(rn++).padStart(2, '0'), span: PB.rtgSpan});
        const z = zs[bi === 2 ? 2 : 4];
        rtg.setTrolley(1.7);
        rtg.setHoist(11);
        add(rtg.group, bx, z, PI / 2);
        pierB.rtgs.push({rtg, block: bi, section: si, x: bx, z});
        return;
      }
      if (PB.isSC(bi, si)) {
        PB.sc.offsets.forEach((u, r) => zs.forEach((z, b) => {
          const t = rnd() < 0.15 ? 0 : rnd() < 0.55 ? 2 : 1;
          slot(`S${bi}.${b}.${r}`, 'sc', bx + u, z, BOX.L40, t, pick);
        }));
        return;
      }
      zs.forEach((z, b) => {
        const lvl = rnd() < 0.08 ? 0 : rnd() < 0.7 ? 3 : 2; // 0: an empty bay
        PB.rows.forEach((u, r) => {
          const t = lvl ? lvl - (r === PB.rows.length - 1 && rnd() < 0.35 ? 1 : 0) : 0;
          slot(`B${bi}.${si}.${b}.${r}`, 'std', bx + u, z, BOX.L40, t, pick);
        });
      });
      // one RTG in most sections, at a bay, its trolley over the truck lane (a truck under it, its box right under the
      // spreader, heading the lane's way: an outside truck in sections 0 and 1, a yard tractor in the vessel stack) or
      // over a row
      if ((bi + si) % 3 !== 2) {
        const z = zs[Math.floor(rnd() * zs.length)];
        const rtg = buildToyRTG({number: String(rn++).padStart(2, '0'), span: PB.rtgSpan});
        const overLane = rnd() < 0.5;
        rtg.setTrolley(overLane ? LANE : PB.rows[Math.floor(rnd() * 5)]);
        rtg.setHoist(overLane ? 6.4 : 12.5);
        add(rtg.group, bx, z, PI / 2);
        pierB.rtgs.push({rtg, block: bi, section: si, x: bx, z});
        const n = PB.north(bi);
        if (overLane) truck(bx + LANE, z + (n ? -9.8 : 9.8), n ? PI / 2 : -PI / 2, rnd() < 0.5 ? pick() : null, PB.outside.includes(si) ? 'road' : 'tractor');
      }
    }));
    // trucks travelling the RTG lanes (with the lane) and the two-way cross aisles (keeping left)
    truck(PB.blocks[1] + LANE, -300, -PI / 2, pick(), 'road');
    truck(-30, PB.aisles[0] - 3.5, 0, pick(), 'road');
    truck(40, PB.aisles[1] + 3.5, PI, pick(), 'road');
    // the empty depot at work. The handler carries a 20 ft box 5.1 m ahead of its centre, the box lengthwise across the
    // machine (along z here, like the rows and a truck in the lane). EH-02 stands west of the lane facing it, its frame
    // down on the box of an outside truck that has stopped beside it (the box's top at 5.3); behind it 1.3 m to the
    // west rows. EH-03 faces the east rows, its frame up at the fourth tier.
    const ex = PB.emptyX;
    const ehs = [];
    {
      const eh = buildToyEmptyHandler({number: '02'});
      eh.setLift(5.3);
      add(eh.group, ex - 5.1, -110, 0);
      ehs.push({eh, x: ex - 5.1, z: -110, ry: 0});
      truck(ex, -110 - 9.9, PI / 2, CC.sky, 'road');
      const eh3 = buildToyEmptyHandler({number: '03'});
      eh3.setLift(12);
      add(eh3.group, ex + PB.emptyRows[2] - 5.1, -150, 0);
      ehs.push({eh: eh3, x: ex + PB.emptyRows[2] - 5.1, z: -150, ry: 0});
    }
    pierB.emptyHandlers = ehs;
    // the equipment park: a spare empty handler (the reach stacker works at the CFS)
    {
      const eh = buildToyEmptyHandler({number: '05'});
      eh.setLift(1);
      add(eh.group, 54, -18, PI / 2);
    }
    // the tractor pocket: tractors and chassis backed in, noses to the root aisle
    for (const x of [-97.5, -92.5, -82.5, -72.5, -67.5, -52.5]) truck(x, -27, PI / 2);
    // the pre-gate lot: outside trucks waiting their slot, noses to the drive aisles
    [[-145, 47.5, 0], [-145, 62.5, 0], [-145, 82.5, 0], [-117, 52.5, PI], [-117, 72.5, PI], [-117, 92.5, PI]].forEach(([x, z, ry], i) => truck(x, z, ry, i % 2 ? pick() : null, 'road'));
    // three cranes per ship, each over a hatch (PB.craneBays, ship-local), lifted 12 m so the spreaders clear the
    // six-high deck stacks. Trolleys and spreaders at different points of a cycle; a yard tractor in the lane under each
    // crane, heading the apron loop's way (north on the west side), its box under the spreader on the cranes landing one
    // a straddle carrier: heading ry, carrying a box when color is given (the box between its legs, its underside at
    // lift - 3.6). It takes boxes off the ground (never from a crane's spreader: its own top frame is in the way)
    pierB.straddles = [];
    let scn = 11;
    const straddle = (x, z, ry, lift, color = null) => {
      const sc = buildToyStraddleCarrier({number: String(scn++)});
      sc.setLift(lift);
      add(sc.group, x, z, ry);
      let box = null;
      if (color) {
        box = list.length;
        list.push({x, y: lift - BOX.H, z, len: BOX.L40, ry, color});
      }
      pierB.straddles.push({sc, x, z, ry, lift, box});
    };
    let n = 1;
    for (const side of [-1, 1]) for (const zc of PB.berths) for (const bay of PB.craneBays) {
      const qc = buildToyQuayCrane({number: String(n).padStart(2, '0'), lift: 12});
      const k = n % 4;
      qc.setTrolley([-30, -40, -18, 4][k]);
      qc.setHoist([28, 24, 26, 8][k]);
      const x = side * PB.qcX;
      const z = zc - bay;
      const ry = side < 0 ? PI / 2 : -PI / 2;
      add(qc.group, x, z, ry);
      pierB.cranes.push({qc, number: n, x, z, ry, side: side < 0 ? 'W' : 'E', berth: zc, bay});
      const hz = side < 0 ? -1 : 1;
      // the landing spot: where this crane sets a box down and the next mover takes it (the working lane under the
      // trolley, at the crane's centre). The north berth's cranes land on the ground for the straddle carriers (crane
      // and carrier never wait for each other); the south berth's land on a tractor's chassis
      const crane = pierB.cranes[pierB.cranes.length - 1];
      const lx = side * PB.qcLane;
      const dir = side < 0 ? PI / 2 : -PI / 2;
      if (zc === PB.sc.berth) {
        crane.landing = {x: lx, z, y: 0, ry: PI / 2, mode: 'ground', box: null};
        crane.stop = {x: lx, z, ry: dir, who: 'sc'}; // a straddle carrier straddling the landing
        if (k === 3) {
          // the box just set down, the spreader still on it; a carrier coming up behind, spreader high, to straddle it
          qc.setHoist(BOX.H);
          crane.landing.box = list.length;
          list.push({x: lx, y: 0, z, len: BOX.L40, ry: PI / 2, color: pick()});
          straddle(lx, z - hz * 16, dir, 11.5);
        } else if (k === 2) straddle(lx, z + hz * 18, dir, 5.6, pick()); // one driving off with the box it picked up
        else straddle(lx, z - hz * 18, dir, 11.5); // one waiting its turn behind the crane
      } else {
        crane.landing = {x: lx, z, y: 1.5, ry: PI / 2, mode: 'chassis', box: null};
        crane.stop = {x: lx, z: z + hz * 9.8, ry: dir, who: 'tractor'}; // a tractor whose chassis puts the box under it
        truck(lx, z + hz * (k === 3 ? 9.8 : 24), dir, k === 2 || k === 3 ? pick() : null);
      }
      n++;
    }
    // straddle carriers in their block: one in a row, lifting a box over the 2-high stacks; one on the head lane with a
    // box, heading for the rows
    straddle(PB.sc.rows[2], -460, PI / 2, 11.5, pick());
    straddle(PB.sc.rows[9], -470, -PI / 2, 5.6);
    straddle(-60, PB.head, 0, 11.5, pick());
    // the CFS yard at work: a tractor and chassis backed to dock 3 (the docks face west at x 130 onto the west lane); two
    // box pads back to back (A: x 222-226, B: x 202-206, 3 bays each, 1-3 high); three reach stackers. RS-04 by the
    // east lane, lifting the box of an outside truck stopped there; RS-05 by the middle lane, lifting the box of a truck
    // stopped there; RS-06 on the same side, stacking on pad B
    {
      truck(129.5 - 17.25, 80, PI, pick());
      const rss = [];
      const stacker = (number, x, z, ry, rx, ryh) => {
        const rs = buildToyReachStacker({number});
        add(rs.group, x, z, ry);
        rs.reach(rx, ryh);
        rss.push({rs, x, z, ry});
      };
      truck(250, 80 + 9.9, -PI / 2, pick(), 'road');
      stacker('04', 237, 80, 0, 13, 5.1);
      truck(178, 63 - 9.9, PI / 2, pick(), 'road');
      stacker('05', 191, 63, PI, 13, 5.1);
      stacker('06', 191, 95, 0, 11.3, 11);
      pierB.reachStackers = rss;
      pierB.reachStacker = rss[0];
      for (const [pad, xs] of [['A', [222.3, 225.7]], ['B', [202.3, 205.7]]]) xs.forEach((x, r) => [55, 72, 89].forEach((z, b) => slot(`CFS.${pad}.${b}.${r}`, 'cfs', x, z, BOX.L40, 1 + Math.floor(rnd() * 3), pick)));
    }
    // the apron loop
    truck(-PB.apronX, -280, PI / 2, pick());
    truck(-PB.apronX, -100, PI / 2);
    truck(PB.apronX, -300, -PI / 2, pick());
    truck(PB.apronX, -500, -PI / 2, pick());
    const field = buildContainerField(list);
    root.add(field.group);
    // stacking limits (the animation's rules): RTG blocks 3 high (the RTG lifts 1 over 3: its hoist tops out at 14.5),
    // reefers 2 (the rack's plug level), empties 5 (the empty handler's frame reaches 15), the straddle carriers' block 2
    // (a carrier lifts 1 over 2), the CFS pad 3 (the reach stacker)
    const LIMIT = {std: 3, reefer: 2, empty: 5, sc: 2, cfs: 3};
    const posOf = (sl, tier) => new THREE.Vector3(sl.x, tier * BOX.H, sl.z);
    pierB.yard = {
      slots,
      field,
      limit: LIMIT,
      byId: Object.fromEntries(slots.map((s) => [s.id, s])),
      /** the top box of a slot: its index in the field and the position of its bottom centre, or null */
      top: (sl) => (sl.tiers.length ? {index: sl.tiers[sl.tiers.length - 1], pos: posOf(sl, sl.tiers.length - 1)} : null),
      /** where the next box goes on a slot (bottom centre), or null when the slot is full */
      next: (sl) => (sl.tiers.length < LIMIT[sl.kind] ? posOf(sl, sl.tiers.length) : null),
      posOf,
    };
  }
  // the CFS (stuffing and stripping) inside its loop, docks facing west onto the loop's west leg, a forklift at the open
  // door. Turned a quarter the other way: local (x, z) -> world (-z, x), its dock face (local z 0) at x 100
  {
    const cfs = buildToyCargoTerminal({docks: 4, stock: true, name: 'CFS', sign: [LOGOS.blue, 'CFS  ·  Container Freight Station']});
    add(cfs.group, 130, 75, -PI / 2);
    for (let i = 0; i < 4; i++) cfs.setDoor(i, i === 1 || i === 2 ? 1 : 0);
    const d = cfs.docks[1];
    add(buildToyForklift().group, 130 - d.z - 5, 75 + d.x, 0);

  }
  // pier B's ISPS fence: from the shore west of the pier along z 128 (between the ring and the forecourt) to gate B and
  // on to the shore between piers B and C, so the whole forecourt (the truck buffer, the CFS, the workshop) is inside
  // and gate B the only way in
  {
    const fence = (pts) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, z0] = pts[i];
        const [x1, z1] = pts[i + 1];
        const len = Math.hypot(x1 - x0, z1 - z0);
        const n = Math.ceil(len / 30);
        for (let k = 0; k < n; k++) {
          const a = k / n;
          const b = (k + 1) / n;
          add(buildToyFence({length: len / n}), x0 + (x1 - x0) * (a + b) / 2, z0 + (z1 - z0) * (a + b) / 2, Math.atan2(-(z1 - z0), x1 - x0));
        }
      }
    };
    // (the gates' islands reach z -+6.2 about the lane: the fence meets them; between the gates it runs along the ring)
    const LZ = PB.laneZ;
    fence([[-175, 1], [-175, 120], [PB.gateIn, 120], [PB.gateIn, LZ - 6.2]]);
    fence([[PB.gateIn, LZ + 6.2], [PB.gateIn, 142.6], [PB.gateOut, 142.6], [PB.gateOut, LZ + 6.2]]);
    fence([[PB.gateOut, LZ - 6.2], [PB.gateOut, 120], [340, 120], [340, 1]]);
  }
  // trees: a row down the west side of the pre-gate lot, a grove in the CFS loop and east of the workshop, rows along
  // the inside of the ring (clear of the north link and the office)
  {
    const trees = [];
    let ts = 11;
    const tr = () => ((ts = (ts * 16807) % 2147483647) / 2147483647);
    const tree = (x, z) => trees.push({x: x + (tr() - 0.5) * 2, z: z + (tr() - 0.5) * 2, size: 0.9 + tr() * 0.5, rot: tr() * PI * 2});
    for (let z = 26; z <= 118; z += 13) tree(-170, z);
    for (const x of [-12, 12]) for (const z of [32, 44]) tree(x, z); // the strip between the in and out roads
    for (const x of [314, 330]) for (let z = 22; z <= 130; z += 15) tree(x, z);
    for (let x = -520; x <= 560; x += 20) {
      if (Math.abs(x + 360) < 16) continue;
      if (x > -84 && x < -40) continue;
      tree(x, RN + 20);
      tree(x, RS - 20);
    }
    root.add(buildToyTrees(trees));
  }
  // the terminal office inside the ring; the workshop on gate B's forecourt
  // the terminal office in the strip between gate B's in and out roads, its staff car park behind it
  add(buildToyOffice().group, 0, 58);
  {
    // (its own plane: the road meshes are built by now) with white car stalls along its north side
    const m = new THREE.Mesh(new THREE.PlaneGeometry(32, 22).rotateX(-PI / 2), toyMat(ROAD, {rough: 0.95}));
    m.position.set(0, 0.55, 87);
    m.receiveShadow = true;
    roads.add(m);
    const stall = toyMat('#f4f6fc', {rough: 0.9});
    for (let x = -14; x <= 14.1; x += 3.5) {
      const l = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 7).rotateX(-PI / 2), stall);
      l.position.set(x, 0.6, 80.5);
      roads.add(l);
    }
  }
  tpl('map-workshop', (Pp) => {
    // the maintenance workshop for the yard equipment: a white shed, blue roof, two tall doors facing the road
    const wall = paint(TOY.white, 0.5);
    const roof = paint(TOY.blue, 0.46);
    const door = toyMat('#3a4466', {rough: 0.7});
    // east of the CFS loop, its doors facing west onto the loop's east leg
    Pp.ext(wall, 262, 298, 0, 14, 40, 84, 0.6);
    Pp.ext(roof, 261, 299, 14, 15.4, 39, 85, 0.4);
    for (const z of [51, 73]) Pp.ext(door, 261.8, 262.2, 0, 11, z - 6, z + 6, 0.1);
    Pp.ext(toyMat('#e9edf8', {rough: 0.9}), 255, 262, 0.2, 0.5, 40, 84, 0.1);
  }, root);
  add(buildToyOffice({label: 'NORTHBAY RO-RO TERMINAL'}).group, 900, 560);
  // light masts: a row each side between the yard and the crane rails (about every 135 m), in the cross aisles (in the
  // gaps between the RTG blocks), along the gate road
  // gate B's forecourt: along the queue lane, the truck lot, by both gates, the CFS yard, the strip between the roads
  const masts = [[-290, 122], [-210, 122], [-168, 45], [-168, 95], [-125, 116], [125, 123], [0, 22], [0, 108], [100, 26], [200, 26], [262, 100]];
  for (const z of [-20, -155, -290, -425, -560]) masts.push([-102, z], ...(z === -155 ? [] : [[102, z]])); // (none by the empty depot's outer row)
  for (const z of [-176, -361]) for (const x of [-68, 0, 68]) masts.push([x, z]); // in the gaps between the blocks, by the aisles
  // piers A and C: masts just inside the loop lanes (pier A: between the east lane and the silos)
  for (const z of [-40, -200, -390]) masts.push([-392, z]);
  for (const z of [-40, -200, -390, -560]) masts.push([373, z], [540, z]);
  for (const [x, z] of masts) add(buildToyLightMast().group, x, z);
  // the quay edges of piers A and C: the yellow cope line, bollards every 15 m, fenders on the face between them, the
  // safety line 6 m in. Each edge: its x and the side the water is on (s = +1: water to the east)
  tpl('map-pierAC-quay', (Pp) => {
    const cope = toyMat(PORT_COLORS.cope, {rough: 0.7});
    const ink = toyMat('#2b3248', {rough: 0.6});
    const rubber = toyMat(PORT_COLORS.rubber, {rough: 0.85});
    const red = toyMat('#e5484d', {rough: 0.6});
    const Z0 = -568;
    const Z1 = -2;
    for (const [xe, s] of [[-522, -1], [-342, 1], [342, -1], [570, 1]]) {
      const at = (d) => xe - s * d; // d metres in from the edge
      Pp.ext(cope, at(1.4) - 0.35, at(1.4) + 0.35, 0.16, 0.24, Z0, Z1, 0.02);
      Pp.ext(cope, at(6) - 0.15, at(6) + 0.15, 0.16, 0.22, Z0, Z1, 0.01);
      for (let z = Z0 + 6; z < Z1; z += 15) {
        Pp.cyl(ink, 0.45, 0.55, 1.0, at(0.8), 0.65, z, 'y', 14);
        Pp.cyl(ink, 0.65, 0.65, 0.2, at(0.8), 1.2, z, 'y', 14);
        Pp.ext(rubber, at(-0.35) - 0.35, at(-0.35) + 0.35, WATER - 0.6, -0.6, z + 5, z + 10, 0.2);
        Pp.ext(red, at(-0.35) - 0.4, at(-0.35) + 0.4, -0.85, -0.6, z + 5.2, z + 9.8, 0.02);
      }
    }
  }, root);
  // the quay edges of pier B: the crane rails (x +-126 and +-146 under the cranes at +-136), the yellow cope line, bollards
  // every 15 m with fenders on the face between them, the lane lines under the cranes and the travel lane's edge lines
  tpl('map-pierB-quay', (Pp) => {
    const beam = toyMat('#b4bfe2', {rough: 0.9});
    const rail = toyMat(PORT_COLORS.rail, {rough: 0.4, metal: 0.3});
    const cope = toyMat(PORT_COLORS.cope, {rough: 0.7});
    const ink = toyMat('#2b3248', {rough: 0.6});
    const rubber = toyMat(PORT_COLORS.rubber, {rough: 0.85});
    const red = toyMat('#e5484d', {rough: 0.6});
    const white = toyMat(TOY.lane, {rough: 0.9});
    const Z0 = -568;
    const Z1 = -2;
    for (const sx of [-1, 1]) {
      for (const x of [126, 146]) {
        Pp.ext(beam, sx * x - 0.9, sx * x + 0.9, 0.16, 0.24, Z0, Z1, 0.02);
        Pp.ext(rail, sx * x - 0.15, sx * x + 0.15, 0.24, 0.42, Z0, Z1, 0.03);
      }
      // the cope line at the edge, the safety lines just inside the rails
      Pp.ext(cope, sx * 148.6 - 0.35, sx * 148.6 + 0.35, 0.16, 0.24, Z0, Z1, 0.02);
      for (const x of [124, 148]) Pp.ext(cope, sx * x - 0.15, sx * x + 0.15, 0.16, 0.22, Z0, Z1, 0.01);
      // three truck lanes under the cranes (dashes), the travel lane's solid edges
      for (const x of [129.5, 134.5, 139.5]) for (let z = Z0 + 2; z < Z1 - 6; z += 12) Pp.ext(white, sx * x - 0.15, sx * x + 0.15, 0.16, 0.22, z, z + 6, 0.01);
      for (let z = Z0 + 6; z < Z1; z += 15) {
        Pp.cyl(ink, 0.45, 0.55, 1.0, sx * 149.2, 0.65, z, 'y', 14);
        Pp.cyl(ink, 0.65, 0.65, 0.2, sx * 149.2, 1.2, z, 'y', 14);
        // the fender panel on the face, halfway to the next bollard
        Pp.ext(rubber, sx * 150.35 - 0.35, sx * 150.35 + 0.35, WATER - 0.6, -0.6, z + 5, z + 10, 0.2);
        Pp.ext(red, sx * 150.35 - 0.4, sx * 150.35 + 0.4, -0.85, -0.6, z + 5.2, z + 9.8, 0.02);
      }
    }
  }, root);

  // ---------------------------------------------------------------- pier C: warehouses and open storage
  tpl('map-pierC', (Pp) => {
    const wall = paint(TOY.white, 0.5);
    const roof = paint(TOY.blue, 0.46);
    for (const [z0, z1] of [[-530, -410], [-370, -250]]) {
      Pp.ext(wall, 380, 530, 0, 12, z0, z1, 0.8);
      Pp.ext(roof, 378, 532, 12, 14, z0 - 2, z1 + 2, 0.6);
    }
    const steel = toyMat('#8a93ad', {rough: 0.5, metal: 0.2});
    for (let z = -200; z < -40; z += 24) Pp.ext(steel, 400, 510, 0, 2, z, z + 12, 0.3);
  }, root);

  // ---------------------------------------------------------------- the rail depot (one central depot, no rails on the piers)
  tpl('map-rail', (Pp) => {
    const rail = toyMat('#4b5168', {rough: 0.5, metal: 0.3});
    const [x0, z0] = P(222, 466);
    const [x1] = P(306, 466);
    for (let k = 0; k < 6; k++) Pp.ext(rail, x0, x1, 0.4, 0.8, z0 + 18 + k * 14, z0 + 20 + k * 14, 0.05);
    const [mx] = P(240, 0);
    // the main line south: at grade, up a ramp onto a bridge over the toll road, down again
    const deck = toyMat(PORT_COLORS.concrete, {rough: 0.9});
    const tz = P(0, 505.5)[1];
    const B0 = tz - 33;
    const B1 = tz + 33;
    const R = 50;
    const H = 7;
    Pp.ext(rail, mx - 1, mx + 1, 0.4, 0.9, z0 + 90, B0 - R, 0.05);
    Pp.ext(rail, mx - 1, mx + 1, 0.4, 0.9, B1 + R, 1600, 0.05);
    Pp.ext(deck, mx - 5, mx + 5, H - 1.2, H, B0, B1, 0.3);
    Pp.ext(rail, mx - 1, mx + 1, H, H + 0.5, B0, B1, 0.05);
    for (const z of [tz - 22, tz + 22]) Pp.ext(deck, mx - 4, mx + 4, 0, H - 1.2, z - 1.5, z + 1.5, 0.3);
    const a = Math.atan2(H, R);
    const Lr = Math.hypot(H, R);
    for (const [zc, rx] of [[B0 - R / 2, -a], [B1 + R / 2, a]]) {
      Pp.add(deck, rb(10, 1.2, Lr, 0.3), mx, H / 2 - 0.6, zc, rx);
      Pp.add(rail, rb(2, 0.5, Lr, 0.05), mx, H / 2 + 0.25, zc, rx);
    }
    const silo = paint('#e9edf8', 0.5);
    Pp.cyl(silo, 10, 10, 28, x0 + 40, 14, z0 + 12, 'y', 20);
    const rmg = paint(TOY.blue, 0.46);
    for (const s of [-1, 1]) Pp.ext(rmg, (x0 + x1) / 2 + s * 4 - 1.5, (x0 + x1) / 2 + s * 4 + 1.5, 0, 22, z0 + 14, z0 + 60, 0.4);
    Pp.ext(rmg, (x0 + x1) / 2 - 6, (x0 + x1) / 2 + 6, 20, 24, z0 + 12, z0 + 62, 0.5);
  }, root);

  // ---------------------------------------------------------------- the city
  {
    let s = 3;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    // a block is left out where it would stand on a road or on the rail line (x -552, south of the depot)
    const blocked = (x, z, w, d) => Math.abs(x - P(240, 0)[0]) < w / 2 + 8 || roadRects.some(([a, b, c, e]) => x + w / 2 + 4 > a && x - w / 2 - 4 < c && z + d / 2 + 4 > b && z - d / 2 - 4 < e) || (z + d / 2 > P(0, 503)[1] - 6 && z - d / 2 < P(0, 508)[1] + 6);
    const [cx0, cz0] = P(548, 336);
    const [cx1, cz1] = P(640, 490);
    for (let x = cx0; x < cx1 + 600; x += 78) for (let z = cz0; z < cz1 + 300; z += 66) {
      if (rnd() < 0.12 || blocked(x, z, 40, 30)) continue;
      add(buildToyCityBlock({w: 40, d: 30, floors: 3 + Math.floor(rnd() * 9), seed: Math.floor(rnd() * 100)}), x, z);
    }
    for (let x = -1500; x < 1240; x += 92) {
      const z = 820 + rnd() * 30;
      const f = 3 + Math.floor(rnd() * 5);
      const sd = Math.floor(rnd() * 100);
      if (!blocked(x, z, 44, 32)) add(buildToyCityBlock({w: 44, d: 32, floors: f, seed: sd}), x, z);
    }
  }

  // ---------------------------------------------------------------- ships at their berths and at anchor
  const ships = [];
  const moor = (o, x, z, ry, ride = 1, extra = null) => {
    add(o.group, x, z, ry, WATER + ride);
    const f = S.buildWaterline(o, {y: -ride});
    o.group.add(f.mesh);
    ticks.push(f.tick);
    if (o.bob) ticks.push(o.bob);
    extra?.(o);
    ships.push(o);
    return o;
  };
  const load = (o) => o.group.add(buildContainerField(S.shipLoad(o)).group);
  // pier B's container ships: their deck loads as slots ({id, bay, row, x, z (ship-local), tiers}), the cranes linked to
  // their ship, four mooring lines each from the bitts on the quay side to the bollards (head and stern lines)
  for (const side of [-1, 1]) for (const zc of PB.berths) {
    const o = moor(S.buildToyShip(), side * PB.shipX, zc, PI / 2, 1.6);
    const loadList = S.shipLoad(o);
    const sl = new Map();
    loadList.forEach((b, i) => {
      const id = `${o.bays.indexOf(b.x)}.${o.rows.indexOf(b.z)}`;
      if (!sl.has(id)) sl.set(id, {id, bay: b.x, row: b.z, x: b.x, z: b.z, tiers: []});
      sl.get(id).tiers.push(i);
    });
    const field = buildContainerField(loadList);
    o.group.add(field.group);
    const entry = {ship: o, side: side < 0 ? 'W' : 'E', x: side * PB.shipX, z: zc, field, slots: [...sl.values()], toWorld: (v) => o.group.localToWorld(v.clone())};
    pierB.ships.push(entry);
    for (const c of pierB.cranes) if (c.side === entry.side && c.berth === zc) c.ship = entry;
    o.group.updateMatrixWorld(true);
    for (const b of o.bitts) {
      // the bitts are on +z (ship-local); the quay is +z for the west ship (local z -> world x), -z for the east one
      const w = o.group.localToWorld(new THREE.Vector3(b.x, b.y, -side * b.z));
      const zt = w.z + (b.x > 0 ? -28 : 28);
      const zb = -562 + 15 * Math.round((zt + 562) / 15);
      root.add(buildToyMooringLine(w, new THREE.Vector3(side * 149.2, 1.2, zb)));
    }
  }
  for (const z of [-480, -300, -120]) moor(S.buildToyCargoShip(), 330, z, PI / 2, 1);
  for (const z of [-420, -220]) moor(S.buildToyCargoShip(), 582, z, -PI / 2, 1);
  moor(S.buildToyBulkCarrier(), -540, -300, PI / 2, 3);
  moor(S.buildToyLNGCarrier(), ...P(99.5, 301.5), PI / 2, 1.5);
  moor(S.buildToyOilTanker(), ...P(109.5, 241), PI / 2, 0.4);
  moor(S.buildToyRoRo(), 747, -18, 0, 1);
  moor(S.buildToyFerry(), 936, -428, PI, 0.5);
  moor(S.buildToyPassengerShip(), 1314, -600, 0, 0.4);
  moor(S.buildToyTugboat({name: 'NB TUG 3'}), ...P(250, 205), 0.4, 0);
  moor(S.buildToyTugboat({name: 'NB TUG 5'}), ...P(300, 192), -0.6, 0);
  moor(S.buildToyPilotBoat(), ...P(330, 100), 0.9, 0);
  moor(S.buildToyShip({name: 'KESTREL CROWN'}), 900, -1700, 0.6, 1.6, load);
  moor(S.buildToyCargoShip({name: 'NORTHBAY SPIRIT'}), 1450, -1900, 0.3, 1);
  moor(S.buildToyBulkCarrier({name: 'AURORA BULKER'}), 1250, -1480, 0.5, 4);
  moor(S.buildToyOilTanker({name: 'KESTREL TIDE'}), -1400, -1850, 0.2, 0.4);

  // ---------------------------------------------------------------- labels
  const L = (t, px, py, y, s) => label(t, ...P(px, py), y, s);
  L('Zona energi · LNG · minyak · CPO', 177, 272, 120, 1.3);
  L('Galangan + dok', 212, 266, 50, 0.8);
  L('Mercusuar · pandu · VTS', 238, 139, 90, 0.9);
  L('Kolam layanan · tug · pilot', 250, 200, 40, 0.8);
  L('Jari A · curah · silo · ternak', 260, 330, 80, 1);
  L('Jari B · peti kemas', 332, 330, 90, 1.1);
  L('Jari C · multipurpose', 408, 330, 80, 1);
  L('Ro-Ro · parkir mobil', 466, 425, 50, 0.9);
  L('Karantina hewan', 230, 405, 40, 0.7);
  L('Backland · logistik', 340, 440, 50, 0.9);
  label('Gerbang masuk', -100, 600, 40, 0.8);
  label('Parkir truk', -120, 68, 30, 0.7);
  label('Gate B masuk', PB.gateIn, PB.laneZ, 30, 0.7);
  label('Gate B keluar', PB.gateOut, PB.laneZ, 30, 0.7);
  label('Parkir traktor', -65, -20, 25, 0.6);
  label('Parkir alat', 62, -20, 25, 0.6);
  label('Blok straddle carrier', PB.blocks[1], -457, 30, 0.7);
  label('Gerbang keluar · X-ray', 300, 560, 40, 0.8);
  label('Gerbang energi', -880, 250, 40, 0.8);
  L('Depo kereta', 264, 480, 50, 0.8);
  L('Terminal feri', 520, 340, 50, 0.8);
  L('Terminal cruise', 557, 307, 60, 0.8);
  L('Pinisi · pelabuhan ikan', 620, 296, 50, 0.8);
  L('Marina', 589, 256, 30, 0.7);
  L('Kota', 600, 400, 90, 1);
  L('Pintu masuk', 285, 160, 40, 0.9);
  L('Alur masuk', 285, 95, 40, 0.9);
  L('Pilot boarding ground', 335, 80, 40, 0.8);
  L('Siaga tug', 303, 191, 30, 0.7);
  L('Tambatan tunggu', 403, 232, 30, 0.7);
  L('Kolam putar 1', 316, 242, 30, 0.8);
  L('Kolam putar 2', 463, 292, 30, 0.8);
  L('Anchorage kargo + karantina', 526, 104, 60, 1.1);
  L('Anchorage tanker / berbahaya', 108, 84, 60, 1);
  L('Area STS transfer', 80, 162, 40, 0.8);
  L('Transshipment tongkang', 79, 381, 40, 0.8);

  const spots = [
    {name: 'Overview', x: 0, z: -700, d: 4400},
    {name: 'Pintu masuk + alur', x: P(285, 130)[0], z: P(285, 130)[1], d: 1000},
    {name: 'Zona energi', x: P(160, 270)[0], z: P(160, 270)[1], d: 1100},
    {name: 'Jari A · curah', x: -430, z: -300, d: 750},
    {name: 'Jari B · peti kemas', x: 0, z: -300, d: 850},
    {name: 'Jari C · multipurpose', x: 460, z: -300, d: 750},
    {name: 'Ro-Ro + feri', x: 860, z: -250, d: 850},
    {name: 'Teluk kota · cruise', x: 1450, z: -480, d: 950},
    {name: 'Backland + depo kereta', x: -100, z: 480, d: 1100},
    {name: 'Anchorage', x: 900, z: -1750, d: 1700},
  ];
  const tick = (t) => {
    for (const f of ticks) f(t);
  };
  tick(0);
  // ---------------------------------------------------------------- the route graph, for the movers
  // A link joins two routes where one ends on (or starts from) the other: {from, sFrom, to, sTo}. Found from the
  // geometry (an end within the other road's half width + 4 m). The two-way roads' centre lines stay out: their
  // per-direction lane routes (.E / .W) carry the links. path(from, to) chains routes into legs [{route, s0, s1}];
  // follow(legs) gives the length and the pose at a distance along them.
  const links = [];
  {
    const key = new Set();
    const link = (from, sFrom, to, sTo) => {
      const k = `${from}>${to}`;
      if (key.has(k)) return;
      key.add(k);
      links.push({from, sFrom, to, sTo});
    };
    const all = Object.keys(routes);
    const oneWay = all.filter((n) => !routes[n].twoWay);
    const twoWay = all.filter((n) => routes[n].twoWay && routes[`${n}.E`]);
    for (const a of oneWay) {
      const A = routes[a];
      if (A.closed) continue;
      const [p0, p1] = [A.points[0], A.points[A.points.length - 1]];
      // onto / off one-way roads (never a lane of a two-way road directly: see below)
      for (const b of oneWay) {
        const B = routes[b];
        if (a === b || B.laneOf) continue;
        const tol = (B.w ?? 6) / 2 + 4;
        const e = B.nearest(p1[0], p1[1]);
        if (e.d <= tol && e.s < B.L - 1) link(a, A.L, b, e.s);
        const st = B.nearest(p0[0], p0[1]);
        if (st.d <= tol && st.s > 1) link(b, st.s, a, 0);
      }
      // onto / off a two-way road: either of its lanes (turning left or right), never the route's own road (no U-turns)
      for (const c of twoWay) {
        if (A.laneOf === c) continue;
        const C = routes[c];
        const tol = C.w / 2 + 4;
        for (const lane of [`${c}.E`, `${c}.W`]) {
          const Ln = routes[lane];
          if (C.nearest(p1[0], p1[1]).d <= tol) {
            const e = Ln.nearest(p1[0], p1[1]);
            if (e.s < Ln.L - 1) link(a, A.L, lane, e.s);
          }
          if (C.nearest(p0[0], p0[1]).d <= tol) {
            const st = Ln.nearest(p0[0], p0[1]);
            if (st.s > 1) link(lane, st.s, a, 0);
          }
        }
      }
    }
  }
  /** chain routes from one to another: who ('truck' | 'tractor' | 'sc') keeps each to the roads it may use */
  const may = {truck: ['all'], tractor: ['all', 'tractor'], sc: ['all', 'tractor', 'sc']};
  const path = (from, to, {who = 'tractor', sFrom = 0} = {}) => {
    // the shortest by distance driven (Dijkstra over link states)
    const ok = (r) => r === from || r === to || may[who].includes(routes[r].users ?? 'all');
    const open = [{r: from, s: sFrom, d: 0, legs: []}];
    const done = new Set();
    while (open.length) {
      open.sort((a, b) => a.d - b.d);
      const {r, s, d, legs} = open.shift();
      const k = `${r}@${Math.round(s / 10)}`;
      if (done.has(k)) continue;
      done.add(k);
      if (r === to) return [...legs, {route: r, s0: s, s1: routes[r].L}];
      for (const l of links) {
        if (l.from !== r || !ok(l.to)) continue;
        const closed = routes[r].closed;
        if (!closed && l.sFrom < s - 0.5) continue;
        const run = l.sFrom >= s ? l.sFrom - s : routes[r].L - s + l.sFrom;
        if (done.has(`${l.to}@${Math.round(l.sTo / 10)}`)) continue;
        open.push({r: l.to, s: l.sTo, d: d + run, legs: [...legs, {route: r, s0: s, s1: l.sFrom}]});
      }
    }
    return null;
  };
  const follow = (legs) => {
    const len = legs.map(({route: r, s0, s1}) => (s1 >= s0 ? s1 - s0 : routes[r].L - s0 + s1));
    const L = len.reduce((a, b) => a + b, 0);
    const at = (d) => {
      d = Math.min(L, Math.max(0, d));
      let i = 0;
      while (i < legs.length - 1 && d > len[i]) d -= len[i++];
      const {route: r, s0} = legs[i];
      return routes[r].at((s0 + d) % (routes[r].L + 1e-9));
    };
    return {L, at};
  };
  // the stops: where a mover waits or parks ({name, x, z, ry}, the tractor's or carrier's centre; route and s where it
  // sits on one): the gates' queue slots, OCR portals and barriers (2 lanes each), the truck lot's stalls, the tractor
  // pocket, the CFS docks and its reach stackers' truck spots, the empty depot's handler spot; and per crane its stop
  // (crane.stop), per RTG block lane and bay pierB.rtgStop(bi, si, z)
  {
    const stops = [];
    const stop = (name, x, z, ry, onRoute = null) => {
      const o = {name, x, z, ry};
      if (onRoute) Object.assign(o, {route: onRoute, s: routes[onRoute].nearest(x, z).s});
      stops.push(o);
    };
    const LZ = PB.laneZ;
    for (const [lane, dz] of [[1, -3], [2, 3]]) {
      for (let k = 0; k < 7; k++) stop(`gateIn.queue${lane}.${k}`, PB.gateIn - 45 - k * 25, LZ + dz, 0, 'pierB.in');
      stop(`gateIn.ocr${lane}`, PB.gateIn - 20, LZ + dz, 0, 'pierB.in');
      stop(`gateIn.barrier${lane}`, PB.gateIn + 3, LZ + dz, 0, 'pierB.in');
      stop(`gateOut.queue${lane}`, PB.gateOut - 45, LZ + dz, 0, 'pierB.out');
      stop(`gateOut.ocr${lane}`, PB.gateOut - 20, LZ + dz, 0, 'pierB.out');
      stop(`gateOut.barrier${lane}`, PB.gateOut + 3, LZ + dz, 0, 'pierB.out');
    }
    for (let i = 0; i < 11; i++) {
      const z = 42.5 + i * 5;
      stop(`lot.W${i}`, -145, z, 0);
      stop(`lot.M${i}`, -117, z, PI);
      stop(`pocket${i}`, -97.5 + i * 5, -27, PI / 2);
    }
    [60, 70, 80, 90].forEach((z, i) => stop(`cfs.dock${i + 1}`, 129.5 - 17.25, z, PI));
    stop('cfs.rs04', 250, 80 + 9.9, -PI / 2, 'cfs');
    stop('cfs.rs05', 178, 63 - 9.9, PI / 2, 'cfs.middle');
    stop('empty.eh02', PB.emptyX, -110 - 9.9, PI / 2, 'pierB.emptyAisle');
    pierB.stops = stops;
    pierB.stopById = Object.fromEntries(stops.map((o) => [o.name, o]));
    /** a truck in a block's RTG lane with its box under the RTG's spreader at bay z (sections 0, 1: outside trucks,
     *  9.9 m box offset; 2: tractors, 9.8) */
    pierB.rtgStop = (bi, si, z) => {
      const n = PB.north(bi);
      const off = PB.outside.includes(si) ? 9.9 : 9.8;
      return {x: PB.blocks[bi] + PB.lane, z: z + (n ? -off : off), ry: n ? PI / 2 : -PI / 2, route: `pierB.lane${bi}.${si}`};
    };
  }
  return {root, tick, spots, labels, outlines, pads, roads, landMat, ships, routes, links, path, follow, gates, pierB};
}
