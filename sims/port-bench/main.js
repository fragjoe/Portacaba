// A bench for Portline's models: every machine and building on the lot under the stage, for close-up stills.
// --config {"cam": {...}, "at": t}. Captures always use the configured camera.
// Live in a browser: drag = orbit, right-drag or shift-drag = pan, wheel = zoom; [ and ] (or the list) jump from model
// to model, 0 = overview, C = back to the configured camera, W = ships on the waterline instead of lifted out.
// The Tweakpane panel (live only): jump to a model, lift or float the ships, reshape a ship's hull with sliders (it is
// rebuilt when a slider is let go) and copy the numbers for ships.js, copy the camera as a capture config, GTAO and
// exposure.
import * as THREE from 'three';
import {runSim} from '../kit/runtime.js';
import {TOY, toyMat, createToyStage} from '../airport-shared/style.js';
import {buildToyForklift} from '../airport-shared/gse.js';
import * as V from '../port-shared/vehicles.js';
import * as I from '../port-shared/infra.js';
import * as S from '../port-shared/ships.js';
import {Pane} from 'tweakpane';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;

// where each model sits on the bench and how far to frame it: {x, y, z} is the camera target, d the distance
const SPOTS = [
  {name: 'Overview', x: 0, y: 2, z: 0, d: 420},
  {name: 'Terminal tractor + chassis', x: 2, y: 2, z: 0, d: 42},
  {name: 'Prime mover + skeletal', x: 2, y: 2, z: 14, d: 42},
  {name: 'Red cab truck + skeletal', x: 2, y: 2, z: 28, d: 42},
  {name: 'Reach stacker', x: 30, y: 4, z: 6, d: 55},
  {name: 'Straddle carrier', x: 48, y: 5, z: 10, d: 50},
  {name: 'Empty handler', x: 60, y: 4, z: -12, d: 42},
  {name: 'Forklift', x: 40, y: 1.5, z: 24, d: 24},
  {name: 'RTG + stacks', x: -30, y: 7, z: 8, d: 80},
  {name: 'Tugboat', x: 20, y: 4, z: 52, d: 55},
  {name: 'Pilot boat', x: 44, y: 2.5, z: 52, d: 38},
  {name: 'Light mast', x: -10, y: 12, z: -10, d: 60},
  {name: 'Quay crane', x: -10, y: 25, z: -50, d: 210},
  {name: 'Gate', x: 80, y: 4, z: 20, d: 85},
  {name: 'Reefer rack', x: 80, y: 3, z: -20, d: 45},
  {name: 'Office', x: 120, y: 5, z: -20, d: 70},
  {name: 'Container ship', x: 0, y: 14, z: -120, d: 280},
];

runSim({duration: 10, fps: 60, theme: 'light', hud: {enabled: false, title: 'b', subtitle: ''}, director: {enabled: false}, watermark: '', cam: {tx: 0, ty: 2, tz: 0, az: 38, el: 30, d: 120, fov: 28}}, async ({cfg, canvas, capture}) => {
  const st = createToyStage(canvas, {fov: cfg.cam.fov});
  if (st.scene.fog) {
    st.scene.fog.near = 1200;
    st.scene.fog.far = 2600;
  }
  const root = new THREE.Group();
  st.scene.add(root);
  const g = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000).rotateX(-Math.PI / 2), toyMat(TOY.ground, {rough: 0.95}));
  g.receiveShadow = true;
  root.add(g);
  const add = (o, x, z, ry = 0, y = 0) => {
    o.position.set(x, y, z);
    o.rotation.y = ry;
    root.add(o);
    return o;
  };
  // row 1: trucks
  const tt = V.buildToyTerminalTractor();
  add(tt.group, 8, 0);
  const ch = V.buildToyTerminalChassis();
  add(ch.group, 8 + -1.6 - ch.kingpin, 0);
  const hero = V.buildToyContainer({color: TOY.orange, id: 'AURU 482113 9', logo: 'white'});
  add(hero.group, 8 + -1.6 - ch.kingpin + ch.boxX, 0, 0, ch.deckY);
  const pm = V.buildToyPrimeMover();
  add(pm.group, 8, 14);
  const sk = V.buildToySkeletalTrailer();
  add(sk.group, 8 - 2.3 - sk.kingpin, 14);
  const box2 = V.buildToyContainer({color: TOY.teal, id: 'KSTU 305528 5', logo: 'white', reefer: true});
  add(box2.group, 8 - 2.3 - sk.kingpin + sk.boxX, 14, 0, sk.deckY);
  // the red cab-over road tractor (TRK-8812 in the film) on its own skeletal trailer
  const rc = V.buildToyRedCabTractor();
  add(rc.group, 8, 28);
  const sk2 = V.buildToySkeletalTrailer();
  add(sk2.group, 8 + rc.fifth.x - sk2.kingpin, 28);
  const box3 = V.buildToyContainer({color: TOY.orange, id: 'AURU 482113 9', logo: 'white'});
  add(box3.group, 8 + rc.fifth.x - sk2.kingpin + sk2.boxX, 28, 0, sk2.deckY);
  // reach stacker reaching to a box
  const rs = V.buildToyReachStacker();
  add(rs.group, 30, 4, Math.PI / 2);
  rs.reach(11, 5.1);
  const sc = V.buildToyStraddleCarrier();
  add(sc.group, 48, 10);
  sc.setLift(1.4);
  const scBox = V.buildToyContainer({color: TOY.blue});
  add(scBox.group, 48, 10, 0, 1.4 - V.BOX.H);
  sc.setLift(5.0);
  scBox.group.position.y = 5.0 - V.BOX.H;
  const eh = V.buildToyEmptyHandler();
  add(eh.group, 60, -12);
  const fl = buildToyForklift();
  add(fl.group, 40, 24);
  const rtg = V.buildToyRTG();
  add(rtg.group, -30, 10);
  rtg.setTrolley(-4);
  rtg.setHoist(6);
  const field = V.buildContainerField([
    {x: -30, z: 4, len: 16, color: TOY.blue}, {x: -30, z: 0.4, len: 16, color: TOY.white}, {x: -30, z: 4, y: 3.6, len: 16, color: TOY.teal},
    {x: -30, z: 7.6, len: 16, color: TOY.orange}, {x: -30, z: 11.2, len: 16, color: '#8fb0f7'}, {x: -30, z: 14.8, len: 16, color: '#2c3b6e'},
  ]);
  root.add(field.group);
  // floating things: lifted out of the water by default (keel on the lot, like a ship on a stand); W shows the waterline
  const floats = [];
  const float = (o, x, z, ry = 0) => {
    add(o.group, x, z, ry);
    floats.push(o);
    return o;
  };
  // every vessel registered so the panel can rebuild it in place with another hull: {name, make, o, x, z, extra}
  const SHIPS = [];
  const reg = (name, make, o, x, z, extra = null) => SHIPS.push({name, make, o, x, z, extra});
  const tug = float(S.buildToyTugboat(), 20, 52);
  const pb = float(S.buildToyPilotBoat(), 44, 52);
  reg('Tugboat', S.buildToyTugboat, tug, 20, 52);
  reg('Pilot boat', S.buildToyPilotBoat, pb, 44, 52);
  const lm = I.buildToyLightMast();
  add(lm.group, -10, -10);
  const qc = I.buildToyQuayCrane();
  add(qc.group, -10, -50);
  qc.setTrolley(-30);
  qc.setHoist(8);
  const gate = I.buildToyGate({lanes: [{z: -2, dir: 1}, {z: 2, dir: 1}, {z: 8, dir: -1}, {z: 12, dir: -1}]});
  add(gate.group, 80, 20);
  gate.setBarrier(1, 1);
  const rr = I.buildToyReeferRack({bays: 2});
  add(rr.group, 80, -20);
  const off = I.buildToyOffice();
  add(off.group, 120, -20);
  // the fleet, one line behind the other: container, cargo, bulk, tanker, LNG, passenger, Ro-Ro, ferry
  const ship = float(S.buildToyShip(), 0, -120);
  const loadUp = (o) => o.group.add(V.buildContainerField(S.shipLoad(o)).group);
  loadUp(ship);
  reg('Container ship', S.buildToyShip, ship, 0, -120, loadUp);
  const FLEET = [
    ['Cargo ship', S.buildToyCargoShip], ['Bulk carrier', S.buildToyBulkCarrier], ['Oil tanker', S.buildToyOilTanker], ['LNG carrier', S.buildToyLNGCarrier],
    ['Passenger ship', S.buildToyPassengerShip], ['Ro-Ro', S.buildToyRoRo], ['Ferry', S.buildToyFerry],
  ];
  let fz = -120 - ship.beam / 2;
  for (const [name, make] of FLEET) {
    const o = make();
    fz -= 80 + o.beam / 2;
    float(o, 0, fz);
    reg(name, make, o, 0, fz);
    SPOTS.push({name, x: 0, y: o.draft * 0.5 + 8, z: fz, d: Math.max(90, o.length * 1.15)});
    fz -= o.beam / 2;
  }
  SPOTS.push({name: 'Fleet', x: 0, y: 10, z: (fz - 120) / 2, d: 900});
  let lifted = true;
  const lift = () => floats.forEach((o) => (o.group.position.y = lifted ? o.draft : 0));
  lift();
  /** a vessel rebuilt in place with hull overrides ({} = as designed) */
  const rebuild = (e, hull) => {
    root.remove(e.o.group);
    const o = e.make({hull});
    add(o.group, e.x, e.z);
    e.extra?.(o);
    floats[floats.indexOf(e.o)] = o;
    e.o = o;
    lift();
  };
  const D2R = Math.PI / 180;

  // the camera now and where it is easing to: {x, y, z, az, el, d}, angles in degrees
  const home = () => ({x: cfg.cam.tx, y: cfg.cam.ty, z: cfg.cam.tz, az: cfg.cam.az, el: cfg.cam.el, d: cfg.cam.d});
  let cam = home();
  let goal = home();
  let goGlobal = null; // the list's jump, for the panel
  if (!capture) {
    const app = document.getElementById('app');
    const font = 'Inter,system-ui,sans-serif';
    const hint = document.createElement('div');
    hint.style.cssText = `position:absolute;left:16px;top:16px;padding:7px 12px;border-radius:10px;background:rgba(15,23,48,.82);color:#fff;font:600 12.5px ${font};pointer-events:none;white-space:nowrap;z-index:5`;
    hint.textContent = 'Drag orbit · right-drag pan · scroll zoom · [ ] next model · 0 overview · C reset · W waterline · space pause';
    app.appendChild(hint);
    const list = document.createElement('div');
    list.style.cssText = `position:absolute;right:16px;top:16px;display:flex;flex-direction:column;gap:2px;padding:6px;border-radius:12px;background:rgba(255,255,255,.9);box-shadow:0 4px 18px rgba(30,40,90,.14);font:600 12.5px ${font};z-index:5`;
    app.appendChild(list);
    let sel = -1;
    const items = SPOTS.map((s, i) => {
      const b = document.createElement('button');
      b.textContent = s.name;
      b.style.cssText = 'all:unset;cursor:pointer;padding:5px 10px;border-radius:8px;color:#1b2550';
      b.addEventListener('click', () => go(i));
      list.appendChild(b);
      return b;
    });
    const mark = () => items.forEach((b, i) => {
      b.style.background = i === sel ? '#2f5bea' : 'transparent';
      b.style.color = i === sel ? '#fff' : '#1b2550';
    });
    // keeps the angle you are looking from, moves the target and the distance
    const go = (i) => {
      sel = (i + SPOTS.length) % SPOTS.length;
      const s = SPOTS[sel];
      goal = {...goal, x: s.x, y: s.y, z: s.z, d: s.d};
      mark();
    };
    goGlobal = go;
    let drag = null;
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('pointerdown', (e) => {
      drag = {x: e.clientX, y: e.clientY, pan: e.button === 2 || e.shiftKey};
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const s = innerWidth / 1600;
      const dx = (e.clientX - drag.x) / s;
      const dy = (e.clientY - drag.y) / s;
      drag.x = e.clientX;
      drag.y = e.clientY;
      if (drag.pan) {
        const a = goal.az * D2R;
        const k = (0.5 * goal.d) / 900;
        const se = Math.sin(goal.el * D2R);
        goal.x -= (Math.cos(a) * dx + (Math.sin(a) * dy) / se) * k;
        goal.z -= (-Math.sin(a) * dx + (Math.cos(a) * dy) / se) * k;
      } else {
        goal.az -= dx * 0.3;
        goal.el = clamp(goal.el + dy * 0.25, 2, 88);
      }
      cam = {...goal};
    });
    const end = () => (drag = null);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      goal.d = clamp(goal.d * Math.exp(e.deltaY * 0.0012), 4, 1600);
    }, {passive: false});
    addEventListener('keydown', (e) => {
      if (e.target.closest?.('.tp-rotv')) return; // typing in the panel
      if (e.key === ']') go(sel + 1);
      else if (e.key === '[') go(sel < 0 ? -1 : sel - 1);
      else if (e.key === '0') go(0);
      else if (e.key === 'w' || e.key === 'W') {
        lifted = !lifted;
        lift();
      }
      else if (e.key === 'c' || e.key === 'C') {
        goal = home();
        sel = -1;
        mark();
      }
    });
  }
  if (!capture) {
    // ---------------------------------------------------------------- the Tweakpane panel
    const host = document.createElement('div');
    host.style.cssText = 'position:absolute;left:16px;top:52px;width:290px;max-height:calc(100% - 70px);overflow:auto;z-index:6';
    document.getElementById('app').appendChild(host);
    const pane = new Pane({title: 'Props bench', container: host});
    const ui = {model: 0, lifted, ship: 0, fov: cfg.cam.fov, gtao: st.gtao?.enabled ?? false, exposure: st.renderer.toneMappingExposure, status: ''};
    const copy = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        ui.status = 'copied';
      } catch {
        ui.status = 'see console';
      }
      console.log(text);
      pane.refresh();
    };
    // model
    const fm = pane.addFolder({title: 'Model'});
    fm.addBinding(ui, 'model', {label: 'jump to', options: Object.fromEntries(SPOTS.map((q, i) => [q.name, i]))}).on('change', (e) => BENCH.go(e.value));
    fm.addBinding(ui, 'lifted', {label: 'lifted'}).on('change', (e) => {
      lifted = e.value;
      lift();
    });
    // hull
    const fh = pane.addFolder({title: 'Hull'});
    const H = {...SHIPS[0].o.hull.params};
    const RANGES = {
      bow: [0.05, 0.6, 0.005], stern: [0.04, 0.35, 0.005], rake: [0, 0.45, 0.005], bulb: [0, 0.06, 0.001], bulbB: [0.1, 0.3, 0.005], bulbZ: [0.3, 0.6, 0.005], flare: [0, 3.5, 0.05],
      entry: [1, 3, 0.05], sheer: [0, 8, 0.1], sheerLen: [0.04, 0.45, 0.005], bilge: [0, 0.2, 0.005], transom: [0.3, 1, 0.01], rise: [0, 0.9, 0.01],
    };
    const cur = () => SHIPS[ui.ship];
    const apply = () => rebuild(cur(), {...H});
    fh.addBinding(ui, 'ship', {label: 'ship', options: Object.fromEntries(SHIPS.map((e, i) => [e.name, i]))}).on('change', (e) => {
      Object.assign(H, SHIPS[e.value].o.hull.params);
      const q = SPOTS.findIndex((p) => p.name === SHIPS[e.value].name);
      if (q >= 0) BENCH.go(q);
      pane.refresh();
    });
    for (const [k, [min, max, step]] of Object.entries(RANGES)) {
      fh.addBinding(H, k, {min, max, step}).on('change', (e) => {
        if (e.last) apply();
      });
    }
    fh.addButton({title: 'Reset to design'}).on('click', () => {
      rebuild(cur(), {});
      Object.assign(H, cur().o.hull.params);
      pane.refresh();
    });
    fh.addButton({title: 'Copy for ships.js'}).on('click', () => {
      const r = (v) => +(+v).toFixed(3);
      copy(`// ${cur().name}\n` + Object.keys(RANGES).map((k) => `${k}: ${r(H[k])}`).join(', '));
    });
    // camera
    const fc = pane.addFolder({title: 'Camera'});
    fc.addBinding(ui, 'fov', {min: 12, max: 60, step: 1}).on('change', (e) => (cfg.cam.fov = e.value));
    fc.addButton({title: 'Copy capture config'}).on('click', () => {
      const r = (v) => +v.toFixed(2);
      copy(JSON.stringify({cam: {tx: r(cam.x), ty: r(cam.y), tz: r(cam.z), az: r(cam.az), el: r(cam.el), d: r(cam.d), fov: cfg.cam.fov}}));
    });
    // render
    const fr = pane.addFolder({title: 'Render', expanded: false});
    if (st.gtao) fr.addBinding(ui, 'gtao', {label: 'GTAO'}).on('change', (e) => (st.gtao.enabled = e.value));
    fr.addBinding(ui, 'exposure', {min: 0.5, max: 1.5, step: 0.01}).on('change', (e) => (st.renderer.toneMappingExposure = e.value));
    pane.addBinding(ui, 'status', {readonly: true, label: 'clipboard'});
  }
  window.BENCH = {st, rs, sc, qc, SPOTS, floats, SHIPS, rebuild, view: (o) => (goal = {...goal, ...o}), go: (i) => goGlobal?.(i)};
  return {
    resize() {
      st.resize(1600, capture ? 900 : Math.round((1600 * innerHeight) / innerWidth) || 900, 1);
    },
    render(t) {
      for (const o of floats) o.bob?.(t);
      if (capture) cam = home();
      else for (const k of ['x', 'y', 'z', 'az', 'el', 'd']) cam[k] = lerp(cam[k], goal[k], 0.14);
      st.frame({tx: cam.x, ty: cam.y, tz: cam.z, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cfg.cam.fov});
      return {};
    },
  };
});
