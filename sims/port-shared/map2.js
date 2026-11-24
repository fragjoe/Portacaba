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
import {buildToyCityBlock, buildToyCargoTerminal} from '../airport-shared/airside.js';
import {WATER, PORT_COLORS, buildToyWater, buildToyQuayCrane, buildToyGate, buildToyOffice, buildToyLightMast, buildToyReeferRack} from './infra.js';
import {BOX, CONTAINER_COLORS as CC, buildContainerField, buildToyRTG, buildToyTerminalTractor, buildToyTerminalChassis, buildToyEmptyHandler, buildToyReachStacker} from './vehicles.js';
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
  pad(215, 385, 245, 425, '#f1efe8', 0.35);
  pad(433, 385, 500, 465, '#bfe7d8', 0.35);
  pad(218, 462, 310, 498, '#d3d1c7', 0.35);
  pad(500, 305, 540, 375, '#dcdaf6');
  pad(535, 292, 580, 322, '#dcdaf6');
  pad(600, 282, 640, 310, '#f6e2b8');
  // roads: the port backbone, the access road, the toll road. Asphalt a few steps darker than the lavender ground and
  // the grey backland pad, so the roads still read when the zone colours are switched off
  pad(215, 467, 640, 471, ROAD, 0.55, roads);
  pad(330, 471, 334, 505, ROAD, 0.55, roads);
  pad(-400, 503, 1000, 508, HIGHWAY, 0.55, roads);
  // white edge lines along the backbone and the toll road
  for (const [x0, x1, py] of [[215, 640, 467.1], [215, 640, 470.9], [-400, 1000, 503.1], [-400, 1000, 507.9]]) pad(x0, py - 0.07, x1, py + 0.07, TOY.lane, 0.6, roads);
  for (let x = -2000; x < 4000; x += 40) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(18, 1.2).rotateX(-PI / 2), toyMat(TOY.lane, {rough: 0.9}));
    m.position.set(x, 0.7, P(0, 505.5)[1]);
    roads.add(m);
  }

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
  // The yard: six RTG blocks along the pier (centres every 32 m across it), each 5 rows of 40 ft boxes and a truck lane
  // under the RTG's span, cut by two cross aisles into three sections. One bay is one height (2-3 high, the odd row a tier
  // lower at the working face, some bays empty). Landside: the reefer section (racks between the rows, white boxes) in
  // the two middle blocks and the empty depot (20 ft empties 4-5 high, worked by empty handlers) in the east block.
  // The apron each side: the crane lane under the STS cranes (x +-132) and a travel lane (x +-112) with yard tractors.
  {
    const list = [];
    let seed = 5;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const cols = Object.values(CC);
    const pick = () => cols[Math.floor(rnd() * cols.length)];
    const BLOCKS = [-80, -48, -16, 16, 48, 80];
    const ROWS = [-8.5, -5.1, -1.7, 1.7, 5.1];
    const LANE = 8.6; // the truck lane under the RTG, at the block's +x side
    const SECTIONS = [[-62, -190], [-212, -380], [-402, -548]];
    const bays = ([z0, z1]) => {
      const out = [];
      for (let z = z0 - 8.5; z - 8.5 >= z1; z -= 17) out.push(z);
      return out;
    };
    // a yard tractor with its chassis (and a box on it when color is given), heading ry, the tractor's centre at x, z
    const tnums = ['03', '07', '12', '15', '21'];
    let tn = 0;
    const truck = (x, z, ry, color = null) => {
      const tt = buildToyTerminalTractor({number: tnums[tn++ % tnums.length]});
      const ch = buildToyTerminalChassis();
      const hx = Math.cos(ry);
      const hz = -Math.sin(ry);
      const off = tt.fifth.x - ch.kingpin;
      add(tt.group, x, z, ry);
      add(ch.group, x + hx * off, z + hz * off, ry);
      if (color) list.push({x: x + hx * (off + ch.boxX), y: ch.deckY, z: z + hz * (off + ch.boxX), len: BOX.L40, ry, color});
    };
    let rn = 1;
    BLOCKS.forEach((bx, bi) => SECTIONS.forEach((sec, si) => {
      const reefer = si === 0 && (bx === -16 || bx === 16);
      const empty = si === 0 && bx === 80;
      const zs = bays(sec);
      if (empty) {
        // two pairs of rows of 20 ft empties, the handlers' aisle between them
        for (const u of [-11.3, -7.9, 7.9, 11.3]) for (let z = sec[0] - 5; z - 4 >= sec[1]; z -= 8.6) {
          if (rnd() < 0.08) continue;
          const t = 4 + (rnd() < 0.5 ? 1 : 0);
          const c = [CC.orange, CC.sky, CC.steel, CC.white, CC.lavender][Math.floor(rnd() * 5)];
          for (let k = 0; k < t; k++) list.push({x: bx + u, y: k * BOX.H, z, len: BOX.L20, ry: PI / 2, color: rnd() < 0.7 ? c : pick()});
        }
        return;
      }
      if (reefer) {
        // a rack down the block with a row of reefers each side, two more rows toward the truck lane
        const rack = buildToyReeferRack({bays: zs.length});
        add(rack.group, bx - 4.6, (zs[0] + zs[zs.length - 1]) / 2, PI / 2);
        for (const z of zs) for (const u of [-8.2, -1.0, 2.4, 5.8]) {
          const t = u < 0 ? 2 : 1 + (rnd() < 0.5 ? 1 : 0);
          for (let k = 0; k < t; k++) list.push({x: bx + u, y: k * BOX.H, z, len: BOX.L40, ry: PI / 2, color: k === 1 && rnd() < 0.3 ? CC.kestrel : CC.white});
        }
        return;
      }
      for (const z of zs) {
        if (rnd() < 0.08) continue; // an empty bay
        const lvl = rnd() < 0.7 ? 3 : 2;
        ROWS.forEach((u, r) => {
          const t = lvl - (r === ROWS.length - 1 && rnd() < 0.35 ? 1 : 0);
          for (let k = 0; k < t; k++) list.push({x: bx + u, y: k * BOX.H, z, len: BOX.L40, ry: PI / 2, color: pick()});
        });
      }
      // one RTG in most sections, at a bay, its trolley over the truck lane (a truck under it) or over a row
      if ((bi + si) % 3 !== 2) {
        const z = zs[Math.floor(rnd() * zs.length)];
        const rtg = buildToyRTG({number: String(rn++).padStart(2, '0')});
        const overLane = rnd() < 0.5;
        rtg.setTrolley(overLane ? LANE : ROWS[Math.floor(rnd() * 5)]);
        rtg.setHoist(overLane ? 6.4 : 12.5);
        add(rtg.group, bx, z, PI / 2);
        if (overLane) truck(bx + LANE, z - 9.8, PI / 2, rnd() < 0.5 ? pick() : null); // its box right under the spreader
      }
    }));
    // trucks travelling the RTG lanes and the cross aisles
    truck(-48 + LANE, -300, -PI / 2, pick());
    truck(16 + LANE, -470, PI / 2);
    truck(-30, -201, 0, pick());
    truck(40, -391, PI, pick());
    // the empty depot's handlers in their aisle, the reach stacker at its end
    for (const [x, z, ry] of [[79.5, -100, 0], [80.5, -150, PI]]) {
      const eh = buildToyEmptyHandler({number: z < -120 ? '03' : '02'});
      eh.setLift(z < -120 ? 10 : 3);
      add(eh.group, x, z, ry);
    }
    add(buildToyReachStacker({number: '04'}).group, 80, -52, PI / 2);
    // three cranes per ship (berths at z -414 and -150 on both sides), over the hatches and clear of the deckhouse aft;
    // lifted 12 m so the spreaders clear the six-high deck stacks. Trolleys and spreaders at different points of a cycle,
    // a yard tractor waiting in the lane under each crane (under the spreader of the ones landing a box)
    let n = 1;
    for (const [x, ry] of [[-136, PI / 2], [136, -PI / 2]]) for (const zc of [-414, -150]) for (const dz of [-70, -22, 26]) {
      const qc = buildToyQuayCrane({number: String(n).padStart(2, '0'), lift: 12});
      const k = n % 4;
      qc.setTrolley([-30, -40, -18, 4][k]);
      qc.setHoist([28, 24, 26, 8][k]);
      add(qc.group, x, zc + dz, ry);
      const lane = Math.sign(x) * 132;
      // the box on the chassis sits 9.8 m behind the tractor: put it under the spreader on the cranes landing one
      const hz = Math.sign(x) < 0 ? -1 : 1;
      truck(lane, zc + dz + hz * (k === 3 ? 9.8 : 24), Math.sign(x) < 0 ? PI / 2 : -PI / 2, k === 2 || k === 3 ? pick() : null);
      n++;
    }
    // the travel lanes along the aprons
    truck(-112, -280, PI / 2, pick());
    truck(-112, -60, -PI / 2);
    truck(112, -300, -PI / 2, pick());
    truck(112, -520, PI / 2, pick());
    root.add(buildContainerField(list).group);
  }
  // the CFS (stuffing and stripping) on the west side of the gate road, docks to the road, a forklift at the open door
  {
    const cfs = buildToyCargoTerminal({docks: 4, stock: true, name: 'CFS', sign: [LOGOS.blue, 'CFS  ·  Container Freight Station']});
    // turned so its dock face (local +z) looks east onto the gate road
    add(cfs.group, -40, 262, PI / 2);
    for (let i = 0; i < 4; i++) cfs.setDoor(i, i === 1 ? 1 : 0);
    // the forklift just out of the open door, facing it (local (x, z) -> world (z, -x) for the quarter turn)
    const d = cfs.docks[1];
    add(buildToyForklift().group, -40 + d.z + 5, 262 - d.x, PI);
  }
  // the drive-through X-ray scanner on a spur off the inbound lanes, just inside the gate
  tpl('map-scanner', (Pp) => {
    const wall = toyMat('#e9edf8', {rough: 0.8});
    const yel = paint('#f2c230', 0.5);
    const ink = toyMat('#2b3248', {rough: 0.6});
    const lane = toyMat(ROAD, {rough: 0.95});
    Pp.ext(lane, -44, -22, 0.5, 0.56, 10, 60, 0.05);
    for (const x of [-42, -30]) Pp.ext(wall, x - 0.8, x + 0.8, 0, 7, 22, 46, 0.3);
    Pp.ext(wall, -43, -29, 7, 8.4, 21, 47, 0.4);
    for (const z of [22, 46]) Pp.ext(yel, -43.2, -28.8, 7.1, 8.2, z - 0.6, z + 0.6, 0.2);
    for (const x of [-42, -30]) for (let k = 0; k < 4; k++) Pp.ext(ink, x - 0.85, x + 0.85, 0.4 + k * 1.6, 1.2 + k * 1.6, 21.6, 22.4, 0.05);
    Pp.ext(paint(TOY.white, 0.5), -54, -46, 0, 3.4, 30, 38, 0.3);
    Pp.ext(paint(TOY.blue, 0.46), -54.3, -45.7, 3.4, 3.9, 29.7, 38.3, 0.15);
  }, root);
  // the container gate at the root of pier B, the road from the pier through the gate to the port backbone, the terminal
  // office and the workshop on either side of it, light masts between the yard and the crane rails and along the road
  add(buildToyGate({lanes: [{z: -15, dir: 1}, {z: -9, dir: 1}, {z: -3, dir: 1}, {z: 3, dir: -1}, {z: 9, dir: -1}, {z: 15, dir: -1}], name: 'GATE B'}).group, 0, 90, PI / 2);
  {
    const asphalt = toyMat(ROAD, {rough: 0.95});
    const dash = toyMat(TOY.lane, {rough: 0.9});
    // two pieces, so the gate's weighbridges, kerbs and arrows stay on the ground between them
    const yb = P(0, 467)[1]; // the port backbone road
    for (const [z0, z1] of [[-50, 64], [116, yb]]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(44, z1 - z0).rotateX(-PI / 2), asphalt);
      m.position.set(0, 0.55, (z0 + z1) / 2);
      m.receiveShadow = true;
      roads.add(m);
      // white edge lines, the centre line, and the lane lines either side
      for (const x of [-21.4, 21.4]) {
        const e = new THREE.Mesh(new THREE.PlaneGeometry(0.6, z1 - z0).rotateX(-PI / 2), dash);
        e.position.set(x, 0.6, (z0 + z1) / 2);
        roads.add(e);
      }
      for (let z = z0 + 6; z < z1 - 6; z += 16) for (const x of [-12, 0, 12]) {
        const d = new THREE.Mesh(new THREE.PlaneGeometry(x ? 0.5 : 0.8, 8).rotateX(-PI / 2), dash);
        d.position.set(x, 0.6, z);
        roads.add(d);
      }
    }
  }
  add(buildToyOffice().group, -64, 150, PI / 2);
  tpl('map-workshop', (Pp) => {
    // the maintenance workshop for the yard equipment: a white shed, blue roof, two tall doors facing the road
    const wall = paint(TOY.white, 0.5);
    const roof = paint(TOY.blue, 0.46);
    const door = toyMat('#3a4466', {rough: 0.7});
    Pp.ext(wall, 46, 82, 0, 14, 128, 172, 0.6);
    Pp.ext(roof, 45, 83, 14, 15.4, 127, 173, 0.4);
    for (const z of [139, 161]) Pp.ext(door, 45.8, 46.2, 0, 11, z - 6, z + 6, 0.1);
    Pp.ext(toyMat('#e9edf8', {rough: 0.9}), 24, 46, 0.2, 0.5, 128, 172, 0.1);
  }, root);
  add(buildToyOffice({label: 'NORTHBAY RO-RO TERMINAL'}).group, 900, 560);
  // light masts: a row each side between the yard and the crane rails (about every 135 m), in the cross aisles (in the
  // gaps between the RTG blocks), along the gate road
  const masts = [[-30, 230], [30, 360]];
  for (const z of [-20, -155, -290, -425, -560]) masts.push([-104, z], [104, z]);
  for (const z of [-201, -391]) for (const x of [-64, 0, 64]) masts.push([x, z]);
  for (const [x, z] of masts) add(buildToyLightMast().group, x, z);
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
      for (const x of [104, 120]) Pp.ext(white, sx * x - 0.2, sx * x + 0.2, 0.16, 0.22, Z0, Z1, 0.01);
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
    Pp.ext(rail, mx - 1, mx + 1, 0.4, 0.9, z0 + 90, 1600, 0.05);
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
    const [cx0, cz0] = P(548, 336);
    const [cx1, cz1] = P(640, 490);
    for (let x = cx0; x < cx1 + 600; x += 78) for (let z = cz0; z < cz1 + 300; z += 66) {
      if (rnd() < 0.12) continue;
      add(buildToyCityBlock({w: 40, d: 30, floors: 3 + Math.floor(rnd() * 9), seed: Math.floor(rnd() * 100)}), x, z);
    }
    for (let x = -1500; x < 1240; x += 92) add(buildToyCityBlock({w: 44, d: 32, floors: 3 + Math.floor(rnd() * 5), seed: Math.floor(rnd() * 100)}), x, 820 + rnd() * 30);
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
  for (const [x, z] of [[-167, -414], [-167, -150], [167, -414], [167, -150]]) moor(S.buildToyShip(), x, z, PI / 2, 1.6, load);
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
  L('Gate · backland · logistik', 340, 430, 50, 0.9);
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
  return {root, tick, spots, labels, outlines, pads, roads, landMat, ships};
}
