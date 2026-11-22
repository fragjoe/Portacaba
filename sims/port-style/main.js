// Style preview: the port in a low-poly isometric look (flat shading, no bevels, yellow STS cranes, green RTGs,
// red / orange / white boxes, a brown yard, dark water, a green verge with conifers). Ten object types:
// 1 STS crane, 2 container ship, 3 RTG, 4 reach stacker, 5 straddle carrier, 6 terminal tractor + chassis,
// 7 road truck + trailer, 8 container stacks, 9 warehouse, 10 tugboat. One still, orthographic camera.
import * as THREE from 'three';
import {runSim} from '../kit/runtime.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {HorizontalTiltShiftShader} from 'three/addons/shaders/HorizontalTiltShiftShader.js';
import {VerticalTiltShiftShader} from 'three/addons/shaders/VerticalTiltShiftShader.js';

const C = {
  yard: '#8a5649', yardLine: '#c9a27a', quay: '#cdb08f', base: '#d8b48a', water: '#3e4f5d', waterSide: '#33424e',
  verge: '#8cc152', road: '#6f5b55', tree: '#3f8f3a', tree2: '#7cc35b', trunk: '#7a5236',
  yellow: '#f2c21b', yellowDark: '#c99a10', green: '#3fae49', greenDark: '#2e8a37', red: '#d8392b', redDark: '#a82a20',
  white: '#f3f1ea', grey: '#8d9299', dark: '#2e3338', glass: '#2b3a4a', roof: '#7d7068', wall: '#e9e6df',
  hero: '#ff6a2b',
  box: ['#e8612c', '#c93a2a', '#f3f0e8', '#f08a4a', '#e8612c', '#c93a2a', '#b84a30'],
};
const MATS = new Map();
const mat = (c) => {
  if (!MATS.has(c)) MATS.set(c, new THREE.MeshLambertMaterial({color: c, flatShading: true}));
  return MATS.get(c);
};
const BOXG = new THREE.BoxGeometry(1, 1, 1);
/** a sharp box from its min corner (x0, y0, z0) to its max corner */
function box(parent, color, x0, y0, z0, x1, y1, z1) {
  const m = new THREE.Mesh(BOXG, mat(color));
  m.scale.set(x1 - x0, y1 - y0, z1 - z0);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
/** a bar between two points, square section t */
function bar(parent, color, a, b, t = 0.8) {
  const A = new THREE.Vector3(...a);
  const d = new THREE.Vector3(...b).sub(A);
  const m = new THREE.Mesh(BOXG, mat(color));
  m.scale.set(t, d.length(), t);
  m.position.copy(A).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
const cyl = (parent, color, r, h, x, y, z, seg = 8, axis = 'y') => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat(color));
  m.position.set(x, y, z);
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
};
const wheel = (p, x, y, z, r = 0.55) => cyl(p, C.dark, r, 0.45, x, y, z, 8, 'z');

// ---------------------------------------------------------------- 8 container (one box, 40 ft = 12 x 2.6 x 2.5)
function container(parent, x, y, z, color, len = 12, alongZ = false) {
  const g = new THREE.Group();
  box(g, color, -len / 2, 0, -1.25, len / 2, 2.6, 1.25);
  const dark = new THREE.Color(color).multiplyScalar(0.72).getStyle();
  for (let i = 1; i < len / 1.5; i++) box(g, dark, -len / 2 + i * 1.5 - 0.06, 0.15, -1.27, -len / 2 + i * 1.5 + 0.06, 2.45, 1.27);
  g.position.set(x, y, z);
  if (alongZ) g.rotation.y = Math.PI / 2;
  parent.add(g);
  return g;
}
let seed = 3;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
function stacks(parent, x0, z0, bays, rows, maxT) {
  for (let b = 0; b < bays; b++)
    for (let r = 0; r < rows; r++) {
      const n = 1 + Math.floor(rnd() * maxT);
      for (let k = 0; k < n; k++) container(parent, x0 + b * 12.6, k * 2.6, z0 + r * 2.7, C.box[Math.floor(rnd() * C.box.length)]);
    }
}

// ---------------------------------------------------------------- 1 STS crane (boom over -z)
function stsCrane(parent, x) {
  const g = new THREE.Group();
  const Y = C.yellow;
  const legZ = [-4, 14];
  for (const z of legZ) {
    box(g, C.yellowDark, -9, 0, z - 1, 9, 1.6, z + 1);
    for (const sx of [-8, 8]) bar(g, Y, [sx, 1.5, z], [sx * 0.9, 26, z], 1.4);
    bar(g, Y, [-8, 12, z], [8, 22, z], 0.6);
  }
  for (const sx of [-7.5, 7.5]) {
    bar(g, Y, [sx, 14, legZ[0]], [sx, 14, legZ[1]], 1.0);
    bar(g, Y, [sx, 25.5, legZ[0]], [sx, 25.5, legZ[1]], 1.2);
  }
  // the boom girders from the backreach to the tip, with cross members
  for (const sx of [-2.4, 2.4]) box(g, Y, sx - 0.6, 26, -44, sx + 0.6, 28, 26);
  for (let z = -42; z < 26; z += 5) box(g, Y, -2.4, 27.4, z - 0.25, 2.4, 27.9, z + 0.25);
  // the A-frame and stays
  for (const sx of [-2.2, 2.2]) {
    bar(g, Y, [sx * 1.6, 28, -4], [sx * 0.5, 40, 0], 0.9);
    bar(g, Y, [sx * 1.6, 28, 5], [sx * 0.5, 40, 0], 0.9);
    bar(g, C.yellowDark, [sx * 0.5, 40, 0], [sx, 28, -43], 0.25);
    bar(g, C.yellowDark, [sx * 0.5, 40, 0], [sx, 28, 25], 0.25);
  }
  // machinery house, trolley with cab, spreader on ropes
  box(g, Y, -4, 28, 17, 4, 32, 25);
  box(g, C.yellowDark, -4.1, 31.6, 17, 4.1, 32.3, 25);
  box(g, Y, -2.8, 25, -26, 2.8, 26.8, -21);
  box(g, C.glass, -2.6, 22.6, -26.6, 0, 25, -24);
  box(g, Y, -1.8, 22.6, -26.4, 0.2, 25, -23.6).scale.y = 2.0;
  for (const dx of [-1.2, 1.2]) bar(g, C.dark, [dx, 25, -23.5], [dx, 12.5, -23.5], 0.12);
  box(g, Y, -6, 11.6, -24.5, 6, 12.6, -22.5);
  g.position.x = x;
  parent.add(g);
  return g;
}

// ---------------------------------------------------------------- 2 container ship (bow +x)
function ship(parent, x, z) {
  const g = new THREE.Group();
  const L = 150;
  const B = 24;
  // hull: a box plus a wedge bow
  box(g, C.red, -L / 2, -3, -B / 2, L / 2 - 14, 6, B / 2);
  const bow = new THREE.Shape();
  bow.moveTo(0, -B / 2);
  bow.lineTo(10, -B / 4);
  bow.lineTo(16, 0);
  bow.lineTo(10, B / 4);
  bow.lineTo(0, B / 2);
  bow.closePath();
  const bg = new THREE.ExtrudeGeometry(bow, {depth: 9, bevelEnabled: false});
  bg.rotateX(-Math.PI / 2);
  const bm = new THREE.Mesh(bg, mat(C.red));
  bm.position.set(L / 2 - 14, -3, 0);
  bm.castShadow = bm.receiveShadow = true;
  g.add(bm);
  box(g, C.white, -L / 2, 5.4, -B / 2 - 0.05, L / 2 - 14, 6, B / 2 + 0.05);
  box(g, C.redDark, -L / 2 + 0.1, 6, -B / 2 + 1, L / 2 - 14, 6.4, B / 2 - 1);
  // superstructure aft: white block with dark window bands, bridge wings, funnel
  box(g, C.white, -L / 2 + 4, 6, -8, -L / 2 + 16, 22, 8);
  for (let k = 0; k < 4; k++) box(g, C.glass, -L / 2 + 15.9, 9 + k * 3.2, -6.5, -L / 2 + 16.1, 10.4 + k * 3.2, 6.5);
  box(g, C.white, -L / 2 + 8, 21, -B / 2, -L / 2 + 17, 23.5, B / 2);
  box(g, C.red, -L / 2 + 1, 14, -2.6, -L / 2 + 5, 25, 2.6);
  box(g, C.dark, -L / 2 + 1, 25, -2.6, -L / 2 + 5, 25.6, 2.6);
  // deck cargo: bays of 40 ft across 8 rows, 2-4 high
  for (let bx = -L / 2 + 25; bx < L / 2 - 22; bx += 13)
    for (let r = 0; r < 8; r++) {
      const n = 2 + Math.floor(rnd() * 3);
      for (let k = 0; k < n; k++) container(g, bx, 6.4 + k * 2.6, -B / 2 + 2 + r * 2.7, C.box[Math.floor(rnd() * C.box.length)]);
    }
  box(g, C.white, L / 2 - 18, 6, -0.4, L / 2 - 17.2, 14, 0.4);
  g.position.set(x, 0, z);
  parent.add(g);
  return g;
}

// ---------------------------------------------------------------- 3 RTG (spans local z, travels along x)
function rtg(parent, x, z) {
  const g = new THREE.Group();
  const G = C.green;
  const span = 10;
  for (const sz of [-span, span]) {
    box(g, C.greenDark, -6, 0.6, sz - 0.9, 6, 1.8, sz + 0.9);
    for (const sx of [-5, 5]) {
      bar(g, G, [sx, 1.6, sz], [sx, 17, sz], 1.2);
      wheel(g, sx - 0.8, 0.6, sz);
      wheel(g, sx + 0.8, 0.6, sz);
    }
    box(g, G, -6, 16.4, sz - 0.8, 6, 18, sz + 0.8);
  }
  for (const sx of [-5, 5]) box(g, G, sx - 0.7, 16.6, -span, sx + 0.7, 17.8, span);
  box(g, C.white, -2.5, 18, -3, 2.5, 19.4, 1.5);
  box(g, G, -1.5, 15, 1.5, 1.5, 17.6, 3.5);
  box(g, C.glass, -1.3, 15.4, 3.45, 1.3, 17.2, 3.6);
  box(g, C.white, 2, 1.8, span + 0.9, 5.5, 4.5, span + 3);
  for (const dx of [-1, 1]) bar(g, C.dark, [dx, 18, -1], [dx, 9.6, -1], 0.1);
  box(g, G, -6, 8.8, -1.9, 6, 9.6, -0.1);
  container(g, 0, 6.2, -1, C.box[0]);
  g.position.set(x, 0, z);
  parent.add(g);
  return g;
}

// ---------------------------------------------------------------- 4 reach stacker (faces +x)
function reachStacker(parent, x, z, ry) {
  const g = new THREE.Group();
  box(g, C.green, -4, 0.6, -1.6, 3.6, 2.2, 1.6);
  box(g, C.greenDark, -4.6, 1.2, -1.7, -2.8, 3.6, 1.7);
  box(g, C.white, -1.4, 2.2, -1.1, 0.8, 4.6, 1.1);
  box(g, C.glass, -0.5, 2.8, -1.15, 0.9, 4.2, 1.15);
  for (const wx of [2.4, -3]) for (const s of [-1, 1]) wheel(g, wx, 0.85, s * 1.8, 0.85);
  bar(g, C.green, [-3.4, 4.0, 0], [7.5, 6.6, 0], 1.0);
  bar(g, C.dark, [1.2, 1.8, 0], [2.6, 4.9, 0], 0.4);
  box(g, C.green, 7.0, 4.9, -6, 8.0, 5.5, 6);
  container(g, 7.5, 2.3, 0, C.box[3], 12, true);
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  parent.add(g);
  return g;
}

// ---------------------------------------------------------------- 5 straddle carrier (along x)
function straddle(parent, x, z, ry = 0) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    box(g, C.redDark, -4.5, 0.6, s * 2.3 - 0.5, 4.5, 1.6, s * 2.3 + 0.5);
    for (const sx of [-3.8, 3.8]) {
      bar(g, C.red, [sx, 1.5, s * 2.3], [sx, 10, s * 2.2], 0.8);
      wheel(g, sx - 0.7, 0.55, s * 2.3);
      wheel(g, sx + 0.7, 0.55, s * 2.3);
    }
    box(g, C.red, -4.4, 9.6, s * 2.2 - 0.5, 4.4, 10.6, s * 2.2 + 0.5);
  }
  box(g, C.white, -3, 10.6, -2.4, 1, 12, 2.4);
  box(g, C.red, 2.6, 8, 1.4, 4.6, 11, 3.2);
  box(g, C.glass, 4.55, 8.6, 1.6, 4.7, 10.4, 3);
  container(g, 0, 1.8, 0, C.box[2]);
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  parent.add(g);
  return g;
}

// ---------------------------------------------------------------- 6 terminal tractor + chassis, 7 road truck + trailer
function tractorRig(parent, x, z, ry, {road = false, color = C.box[0]} = {}) {
  const g = new THREE.Group();
  const cab = road ? C.white : C.yellow;
  box(g, C.dark, -15, 0.8, -0.8, 3.5, 1.3, 0.8);
  if (road) {
    box(g, cab, 1.2, 0.9, -1.25, 4.2, 3.9, 1.25);
    box(g, C.glass, 4.15, 2.5, -1.1, 4.25, 3.6, 1.1);
    box(g, C.red, 1.2, 1.2, -1.27, 4.2, 1.6, 1.27);
  } else {
    box(g, C.yellow, 0.4, 0.8, -1.2, 3.8, 1.8, 1.2);
    box(g, cab, 0.6, 1.8, -1.2, 2.4, 3.6, 0.1);
    box(g, C.glass, 2.35, 2.4, -1.1, 2.45, 3.3, 0);
  }
  for (const wx of [3, 0.4, -10.5, -12]) for (const s of [-1, 1]) wheel(g, wx, 0.5, s * 1.05, 0.5);
  box(g, road ? C.grey : C.dark, -15, 1.1, -1.2, 0, 1.4, 1.2);
  container(g, -7.4, 1.4, 0, color);
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  parent.add(g);
  return g;
}

// ---------------------------------------------------------------- 9 warehouse
function warehouse(parent, x, z) {
  const g = new THREE.Group();
  const W = 44;
  const D = 26;
  box(g, C.wall, -W / 2, 0, -D / 2, W / 2, 7, D / 2);
  const roof = new THREE.Shape();
  roof.moveTo(-D / 2 - 0.6, 0);
  roof.lineTo(0, 2.6);
  roof.lineTo(D / 2 + 0.6, 0);
  roof.closePath();
  const rg = new THREE.ExtrudeGeometry(roof, {depth: W + 1.2, bevelEnabled: false});
  rg.rotateY(Math.PI / 2);
  const rm = new THREE.Mesh(rg, mat(C.roof));
  rm.position.set(-W / 2 - 0.6, 7, 0);
  rm.castShadow = rm.receiveShadow = true;
  g.add(rm);
  for (let i = 0; i < 4; i++) box(g, C.dark, -W / 2 + 6 + i * 10, 0, D / 2 - 0.1, -W / 2 + 10 + i * 10, 4.5, D / 2 + 0.1);
  for (let i = 0; i < 6; i++) box(g, C.glass, -W / 2 + 3 + i * 7, 5.2, -D / 2 - 0.1, -W / 2 + 6 + i * 7, 6.2, -D / 2 + 0.1);
  for (const [vx, vz] of [[-12, -4], [0, 3], [12, -4], [-6, 6], [8, 6]]) cyl(g, C.grey, 0.7, 1.0, vx, 8.6 + 0, vz, 8);
  g.position.set(x, 0, z);
  parent.add(g);
  return g;
}

// ---------------------------------------------------------------- 10 tugboat
function tugboat(parent, x, z, ry) {
  const g = new THREE.Group();
  box(g, C.red, -4, -0.8, -1.8, 3, 1.4, 1.8);
  box(g, C.red, 3, -0.8, -1.2, 5, 1.4, 1.2);
  box(g, C.dark, -4.1, 1.2, -1.9, 5.1, 1.6, 1.9);
  box(g, C.white, -1.6, 1.6, -1.3, 1.8, 3.6, 1.3);
  box(g, C.white, -0.8, 3.6, -1.0, 1.4, 5.0, 1.0);
  box(g, C.glass, 1.35, 3.9, -0.9, 1.45, 4.7, 0.9);
  cyl(g, C.dark, 0.25, 1.4, -1.2, 4.3, 0);
  g.position.set(x, -1.4, z);
  g.rotation.y = ry;
  parent.add(g);
  return g;
}

// ---------------------------------------------------------------- environment
function conifer(parent, x, z, s = 1) {
  cyl(parent, C.trunk, 0.25 * s, 1.2 * s, x, 0.6 * s, z, 6);
  const m = new THREE.Mesh(new THREE.ConeGeometry(1.4 * s, 5 * s, 7), mat(C.tree));
  m.position.set(x, 3.6 * s, z);
  m.castShadow = true;
  parent.add(m);
}
function roundTree(parent, x, z, s = 1) {
  cyl(parent, C.trunk, 0.3 * s, 2 * s, x, 1 * s, z, 6);
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2 * s, 0), mat(C.tree2));
  m.position.set(x, 3.6 * s, z);
  m.castShadow = true;
  parent.add(m);
}

// ================================================================ styles
// cfg.style: lowpoly (default) | diorama | blueprint | twin | semireal | cel | mono | voxel | map2d
const lum = (c) => {
  const k = new THREE.Color(c);
  return 0.3 * k.r + 0.59 * k.g + 0.11 * k.b;
};
const meshesOf = (g) => {
  const out = [];
  g.traverse((o) => o.isMesh && out.push(o));
  return out;
};
const YELLOWS = [new THREE.Color(C.yellow).getHexString(), new THREE.Color(C.yellowDark).getHexString()];
const isYellow = (hex) => YELLOWS.includes(hex);
function addEdges(m, color, opacity = 1) {
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 25), new THREE.LineBasicMaterial({color, transparent: opacity < 1, opacity}));
  m.add(e);
  return e;
}

runSim({duration: 1, fps: 60, theme: 'light', hud: {enabled: false, title: 'style', subtitle: ''}, director: {enabled: false}, watermark: '', style: 'lowpoly'}, async ({cfg, canvas}) => {
  const S = cfg.style;
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, preserveDrawingBuffer: true});
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#ffffff');
  const hemi = new THREE.HemisphereLight('#ffffff', '#b8a99a', 1.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff6e8', 2.4);
  sun.position.set(-60, 120, -40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, {left: -170, right: 170, top: 170, bottom: -170, near: 1, far: 400});
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const G = new THREE.Group(); // ground and water
  const W = new THREE.Group(); // everything standing on it
  scene.add(G, W);
  box(G, C.base, -110, -6, -8, 110, -0.02, 128);
  box(G, C.yard, -110, -0.05, -8, 110, 0, 104);
  box(G, C.quay, -110, -0.04, -8, 110, 0.01, -4);
  box(G, C.road, -110, -0.05, 104, 110, 0.02, 116);
  box(G, C.verge, -110, -0.05, 116, 110, 0.03, 128);
  box(G, C.verge, 100, -0.05, -8, 110, 0.03, 104);
  for (let x = -106; x < 106; x += 8) box(G, C.yardLine, x, 0.02, 109.8, x + 4, 0.06, 110.2);
  for (const z of [26, 60, 94]) box(G, C.yardLine, -108, 0.01, z - 0.15, 98, 0.04, z + 0.15);
  box(G, C.waterSide, -130, -6, -70, 110, -1.6, -8);
  const water = box(G, C.water, -130, -1.6, -70, 110, -1.5, -8);

  for (const x of [-50, 0, 48]) stsCrane(W, x);
  ship(W, -8, -24);
  stacks(W, -96, 32, 5, 7, 3);
  stacks(W, 6, 32, 6, 7, 3);
  stacks(W, 14, 66, 6, 7, 3);
  rtg(W, -60, 40);
  rtg(W, 60, 74);
  reachStacker(W, -18, 50, -Math.PI / 2);
  straddle(W, 30, 14, 0);
  tractorRig(W, 8, 4, 0, {color: C.hero});
  tractorRig(W, -42, 8, 0, {color: C.box[2]});
  tractorRig(W, 60, 110, 0, {road: true, color: C.box[0]});
  tractorRig(W, -30, 112.5, Math.PI, {road: true, color: C.box[3]});
  tractorRig(W, 90, 52, -Math.PI / 2, {road: true, color: C.box[2]});
  warehouse(W, -62, 80);
  tugboat(W, -100, -55, 0.3);
  for (let x = -104; x < 104; x += 7) conifer(W, x, 121 + (Math.round(x) % 2) * 2, 0.9 + rnd() * 0.3);
  for (let z = 2; z < 102; z += 8) conifer(W, 105, z, 0.9);
  for (const [x, z] of [[-96, 98], [-90, 100], [-30, 98], [-24, 96], [-100, 64]]) roundTree(W, x, z, 1.1);
  scene.updateMatrixWorld(true);

  const heroHex = [new THREE.Color(C.hero).getHexString(), new THREE.Color(C.hero).multiplyScalar(0.72).getHexString()];
  const isHero = (m) => heroHex.includes(m.material.color.getHexString());
  const isGround = (m) => G.children.includes(m);
  const all = [...meshesOf(G), ...meshesOf(W)];

  // the cameras: isometric orthographic by default
  let cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 2000);
  let half = 175;
  let camPos = new THREE.Vector3(-260, 300, -320);
  let target = new THREE.Vector3(-4, 0, 30);
  let up = new THREE.Vector3(0, 1, 0);
  let tilt = false;

  if (S === 'diorama') {
    // a miniature: closer perspective, saturated colours, tilt-shift blur top and bottom
    scene.background = new THREE.Color('#f3eee6');
    for (const m of all) m.material = new THREE.MeshLambertMaterial({color: m.material.color.clone().offsetHSL(0, 0.12, 0.04), flatShading: true});
    cam = new THREE.PerspectiveCamera(26, 1.6, 1, 2000);
    camPos = new THREE.Vector3(-125, 105, -150);
    target = new THREE.Vector3(-6, 4, 26);
    hemi.intensity = 1.8;
    tilt = true;
  } else if (S === 'blueprint') {
    scene.background = new THREE.Color('#0e2d58');
    renderer.shadowMap.enabled = false;
    for (const m of all) {
      const ground = isGround(m);
      m.material = new THREE.MeshBasicMaterial({color: m === water ? '#0a2448' : ground ? '#103564' : '#14407a'});
      if (!ground || m === water) addEdges(m, '#d6e8ff', ground ? 0.5 : 0.9);
    }
    const grid = new THREE.GridHelper(220, 44, '#3f73b5', '#25528f');
    grid.position.set(0, 0.2, 60);
    grid.scale.z = 136 / 220;
    scene.add(grid);
  } else if (S === 'twin') {
    scene.background = new THREE.Color('#0a0e15');
    hemi.color.set('#9fb3d1');
    hemi.groundColor.set('#0a0e15');
    hemi.intensity = 1.4;
    sun.intensity = 0.8;
    for (const m of all) {
      const hex = m.material.color.getHexString();
      if (isHero(m)) {
        m.material = new THREE.MeshLambertMaterial({color: '#ff7a2f', emissive: '#ff5a1f', emissiveIntensity: 0.8});
        addEdges(m, '#ffd2b0', 0.9);
      } else if (isGround(m)) {
        m.material = new THREE.MeshLambertMaterial({color: m === water ? '#0d1a28' : '#18212f'});
      } else {
        m.material = new THREE.MeshLambertMaterial({color: '#2a3446'});
        addEdges(m, isYellow(hex) ? '#ffb020' : '#2fd4ff', isYellow(hex) ? 1 : 0.7);
      }
    }
    const grid = new THREE.GridHelper(220, 44, '#2a6f99', '#1d3b55');
    grid.position.set(0, 0.1, 60);
    grid.scale.z = 136 / 220;
    scene.add(grid);
  } else if (S === 'semireal') {
    // physically based materials, an environment, a sky, ACES, a lower perspective view
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.6;
    scene.background = new THREE.Color('#c9dbe9');
    scene.fog = new THREE.Fog('#c9dbe9', 260, 620);
    sun.intensity = 3.2;
    sun.color.set('#fff1dc');
    hemi.intensity = 0.6;
    const remap = {[C.yard]: '#7f7d77', [C.quay]: '#b3ada2', [C.road]: '#55565a', [C.verge]: '#6d8a45', [C.base]: '#8f8a80', [C.yardLine]: '#e8e4da', [C.water]: '#2b4757', [C.waterSide]: '#24394a', [C.tree]: '#2f5f2c', [C.tree2]: '#4f7f39'};
    for (const m of all) {
      const hexS = m.material.color.getHexString();
      const key = Object.keys(remap).find((k) => new THREE.Color(k).getHexString() === hexS);
      const base = new THREE.Color(key ? remap[key] : '#' + hexS);
      if (!key) base.lerp(new THREE.Color('#8a8a8a'), 0.22);
      const metal = isYellow(hexS) ? 0.45 : 0.15;
      m.material = new THREE.MeshStandardMaterial({color: base, roughness: m === water ? 0.12 : 0.7, metalness: m === water ? 0.3 : metal});
    }
    cam = new THREE.PerspectiveCamera(32, 1.6, 1, 2000);
    camPos = new THREE.Vector3(-150, 78, -175);
    target = new THREE.Vector3(-2, 8, 30);
  } else if (S === 'cel') {
    scene.background = new THREE.Color('#fbf3e2');
    const grad = new THREE.DataTexture(new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]), 3, 1);
    grad.minFilter = grad.magFilter = THREE.NearestFilter;
    grad.needsUpdate = true;
    sun.intensity = 2.8;
    const ink = new THREE.MeshBasicMaterial({color: '#1d1a24', side: THREE.BackSide});
    for (const m of all) {
      m.material = new THREE.MeshToonMaterial({color: m.material.color.clone().offsetHSL(0, 0.1, 0.03), gradientMap: grad});
      if (isGround(m) && m !== water) continue;
      const o = new THREE.Mesh(m.geometry, ink);
      const boxy = m.geometry === BOXG;
      const t = 0.16;
      if (boxy) o.scale.set(1 + (2 * t) / m.scale.x, 1 + (2 * t) / m.scale.y, 1 + (2 * t) / m.scale.z);
      else o.scale.setScalar(1.08);
      m.add(o);
    }
  } else if (S === 'mono') {
    for (const m of all) {
      if (isHero(m)) continue;
      const l = isGround(m) ? (m === water ? 0.84 : 0.95) : 0.78 + 0.2 * lum(m.material.color);
      m.material = new THREE.MeshLambertMaterial({color: new THREE.Color(l, l, Math.min(1, l + 0.01)), flatShading: true});
    }
    // the hero's route drawn on the ground, the only other colour
    const pts = [[8, 4], [8, 20], [-30, 20], [-30, 29], [-60, 29]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [a, b] = [pts[i], pts[i + 1]];
      box(scene, C.hero, Math.min(a[0], b[0]) - 0.5, 0.06, Math.min(a[1], b[1]) - 0.5, Math.max(a[0], b[0]) + 0.5, 0.12, Math.max(a[1], b[1]) + 0.5);
    }
  } else if (S === 'voxel') {
    // every standing object resampled onto a 1.2 m grid of cubes; the ground stays as slabs
    const VX = 1.2;
    const cells = new Map();
    const p = new THREE.Vector3();
    const ws = new THREE.Vector3();
    for (const m of meshesOf(W)) {
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      const bb = m.geometry.boundingBox;
      m.getWorldScale(ws);
      const sx = VX / 2 / Math.max(ws.x, 1e-3);
      const sy = VX / 2 / Math.max(ws.y, 1e-3);
      const sz = VX / 2 / Math.max(ws.z, 1e-3);
      const hex = m.material.color.getHexString();
      for (let x = bb.min.x; x <= bb.max.x + 1e-6; x += sx)
        for (let y = bb.min.y; y <= bb.max.y + 1e-6; y += sy)
          for (let z = bb.min.z; z <= bb.max.z + 1e-6; z += sz) {
            p.set(x, y, z).applyMatrix4(m.matrixWorld);
            const k = `${Math.round(p.x / VX)}|${Math.round(p.y / VX)}|${Math.round(p.z / VX)}`;
            if (!cells.has(k)) cells.set(k, hex);
          }
    }
    scene.remove(W);
    const keys = [...cells.keys()];
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(VX * 0.96, VX * 0.96, VX * 0.96), new THREE.MeshLambertMaterial({flatShading: true}), keys.length);
    const m4 = new THREE.Matrix4();
    const col = new THREE.Color();
    keys.forEach((k, i) => {
      const [x, y, z] = k.split('|').map(Number);
      m4.makeTranslation(x * VX, Math.max(y * VX, VX / 2), z * VX);
      im.setMatrixAt(i, m4);
      im.setColorAt(i, col.set('#' + cells.get(k)));
    });
    im.castShadow = im.receiveShadow = true;
    scene.add(im);
  } else if (S === 'map2d') {
    renderer.shadowMap.enabled = false;
    scene.background = new THREE.Color('#f4f5f7');
    for (const m of all) {
      const c = m.material.color.clone();
      m.material = new THREE.MeshBasicMaterial({color: c});
      if (!isGround(m)) addEdges(m, '#' + c.clone().multiplyScalar(0.55).getHexString(), 0.9);
    }
    camPos = new THREE.Vector3(0, 500, 0);
    target = new THREE.Vector3(-8, 0, 30);
    up = new THREE.Vector3(0, 0, -1);
    half = 132;
  }

  // the post pass for the diorama: tilt-shift blur
  let comp = null;
  let tiltPasses = null;
  if (tilt) {
    comp = new EffectComposer(renderer);
    comp.addPass(new RenderPass(scene, cam));
    const h1 = new ShaderPass(HorizontalTiltShiftShader);
    const v1 = new ShaderPass(VerticalTiltShiftShader);
    const h2 = new ShaderPass(HorizontalTiltShiftShader);
    const v2 = new ShaderPass(VerticalTiltShiftShader);
    for (const p of [h1, v1, h2, v2]) {
      p.uniforms.r.value = 0.52;
      comp.addPass(p);
    }
    comp.addPass(new OutputPass());
    tiltPasses = {h: [h1, h2], v: [v1, v2]};
  }

  const frame = (w, h) => {
    if (cam.isOrthographicCamera) {
      cam.left = -half;
      cam.right = half;
      cam.top = (half * h) / w;
      cam.bottom = (-half * h) / w;
    } else cam.aspect = w / h;
    cam.up.copy(up);
    cam.position.copy(camPos).add(target);
    cam.lookAt(target);
    cam.updateProjectionMatrix();
  };
  return {
    resize() {
      const pr = window.devicePixelRatio || 1;
      renderer.setPixelRatio(pr);
      renderer.setSize(1600, 1000, false);
      if (comp) {
        comp.setPixelRatio(pr);
        comp.setSize(1600, 1000);
        for (const p of tiltPasses.h) p.uniforms.h.value = 2.4 / (1600 * pr);
        for (const p of tiltPasses.v) p.uniforms.v.value = 2.4 / (1000 * pr);
      }
      frame(1600, 1000);
    },
    render() {
      if (comp) comp.render();
      else renderer.render(scene, cam);
      return {};
    },
  };
});
