// A free camera on Portline's world, for checks: --config {"cam": {...}, "at": t}.
// Live in a browser: drag = orbit, right-drag or shift-drag = pan, wheel = zoom; 1 Berth, 2 Yard B3, 3 Gate 2,
// 4 Reefer, 5 overview, 6 Anchorage; C (or 0) goes back to the configured camera. Captures always use the configured
// camera.
// The props are revised on port-bench; this page is where they are checked in place, at the world's scale and on the
// water. The ships the film doesn't use yet ride at an anchorage out in the harbour, on this page only (the film's
// world.js is untouched).
import {runSim} from '../kit/runtime.js';
import {createToyStage} from '../airport-shared/style.js';
import {buildWorld} from '../port-shared/world.js';
import {WATER} from '../port-shared/infra.js';
import * as S from '../port-shared/ships.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;

runSim({duration: 47.3, fps: 60, theme: 'light', hud: {enabled: false, title: 'l', subtitle: ''}, director: {enabled: false}, watermark: '', cam: {tx: 20, ty: 2, tz: 0, az: 38, el: 36, d: 300, fov: 28}, at: null}, async ({cfg, canvas, capture}) => {
  const st = createToyStage(canvas, {fov: cfg.cam.fov});
  st.scene.fog.near = 900;
  st.scene.fog.far = 1800;
  const W = buildWorld();
  st.scene.add(W.root);
  // the anchorage: three rows out in the harbour, each ship in its own load condition. ride = how far its design
  // waterline stands above the water: a laden tanker shows a sliver of red, a bulk carrier in ballast half its bottom
  const ROWS = [
    {z: -200, list: [[S.buildToyCargoShip, 1.0], [S.buildToyBulkCarrier, 4.0], [S.buildToyOilTanker, 0.2]]},
    {z: -300, list: [[S.buildToyLNGCarrier, 1.5], [S.buildToyPassengerShip, 0.4]]},
    {z: -390, list: [[S.buildToyRoRo, 1.0], [S.buildToyFerry, 0.5]]},
  ];
  const fleet = [];
  for (const row of ROWS) {
    const ships = row.list.map(([make, ride]) => Object.assign(make(), {ride}));
    const gap = 50;
    let x = -(ships.reduce((a, o) => a + o.length, 0) + gap * (ships.length - 1)) / 2;
    for (const o of ships) {
      o.group.position.set(x + o.length / 2, WATER + o.ride, row.z);
      o.foam = S.buildWaterline(o, {y: -o.ride});
      o.group.add(o.foam.mesh);
      st.scene.add(o.group);
      fleet.push(o);
      x += o.length + gap;
    }
  }
  const D2R = Math.PI / 180;

  // the camera now and where it is easing to: {x, z, az, el, d}, angles in degrees
  const home = () => ({x: cfg.cam.tx, z: cfg.cam.tz, az: cfg.cam.az, el: cfg.cam.el, d: cfg.cam.d});
  let cam = home();
  let goal = home();
  const SPOTS = {1: {x: 4, z: -30, d: 172}, 2: {x: 38, z: 30, d: 150}, 3: {x: 132, z: 50, d: 150}, 4: {x: 52, z: 74, d: 130}, 5: {x: 20, z: 8, d: 420}, 6: {x: 0, z: -290, d: 620}};
  if (!capture) {
    const hint = document.createElement('div');
    hint.style.cssText = 'position:absolute;left:16px;top:16px;padding:7px 12px;border-radius:10px;background:rgba(15,23,48,.82);color:#fff;font:600 12.5px Inter,system-ui,sans-serif;pointer-events:none;white-space:nowrap;z-index:5';
    hint.textContent = 'Drag orbit · right-drag pan · scroll zoom · 1 Berth · 2 Yard · 3 Gate · 4 Reefer · 5 Overview · 6 Anchorage · C reset';
    document.getElementById('app').appendChild(hint);
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
        goal.el = clamp(goal.el + dy * 0.25, 5, 88);
      }
      cam = {...goal};
    });
    const end = () => (drag = null);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      goal.d = clamp(goal.d * Math.exp(e.deltaY * 0.0012), 15, 1000);
    }, {passive: false});
    addEventListener('keydown', (e) => {
      if (SPOTS[e.key]) goal = {...SPOTS[e.key], az: 38, el: 36};
      else if (e.key === 'c' || e.key === 'C' || e.key === '0') goal = home();
    });
  }
  window.LOOK = {st, W, fleet, view: (o) => (goal = {...goal, ...o})};
  return {
    resize() {
      st.resize(1600, Math.round((1600 * innerHeight) / innerWidth) || 900, 1);
    },
    render(t) {
      W.pose(cfg.at ?? t);
      for (const o of fleet) o.foam.tick(cfg.at ?? t);
      if (capture) cam = home();
      else for (const k of ['x', 'z', 'az', 'el', 'd']) cam[k] = lerp(cam[k], goal[k], 0.14);
      st.frame({tx: cam.x, ty: cfg.cam.ty, tz: cam.z, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cfg.cam.fov});
      return {};
    },
  };
});
