// port-lookv2: the v3 port map (the bay with the headland, three finger piers, the city bay, the water areas) built in
// 3D from the plan drawings, with a free camera. --config {"cam": {...}, "at": t}; captures use the configured camera.
// Live: drag = orbit, right-drag or shift-drag = pan, wheel = zoom; [ and ] (or the list) jump between areas,
// 0 = overview, C = back to the configured camera, L = labels on/off, space = pause.
// The Tweakpane panel: labels, the dashed lines on the water, the zone colours.
import {runSim} from '../kit/runtime.js';
import {createToyStage} from '../airport-shared/style.js';
import {buildPortMap} from '../port-shared/map2.js';
import {Pane} from 'tweakpane';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;

runSim({duration: 60, fps: 60, theme: 'light', hud: {enabled: false, title: 'l2', subtitle: ''}, director: {enabled: false}, watermark: '', cam: {tx: 0, ty: 0, tz: -700, az: 20, el: 42, d: 4400, fov: 28}, at: null}, async ({cfg, canvas, capture}) => {
  const st = createToyStage(canvas, {fov: cfg.cam.fov});
  // a 3.6 km map: see much further than the film does
  st.camera.near = 4;
  st.camera.far = 24000;
  st.camera.updateProjectionMatrix();
  st.scene.fog.near = 6000;
  st.scene.fog.far = 16000;
  const sc = st.sun.shadow.camera;
  sc.far = 2400;
  const MAP = buildPortMap();
  st.scene.add(MAP.root);
  const D2R = Math.PI / 180;

  const home = () => ({x: cfg.cam.tx, z: cfg.cam.tz, az: cfg.cam.az, el: cfg.cam.el, d: cfg.cam.d});
  let cam = home();
  let goal = home();
  if (!capture) {
    const app = document.getElementById('app');
    const font = 'Inter,system-ui,sans-serif';
    const hint = document.createElement('div');
    hint.style.cssText = `position:absolute;left:16px;top:16px;padding:7px 12px;border-radius:10px;background:rgba(15,23,48,.82);color:#fff;font:600 12.5px ${font};pointer-events:none;white-space:nowrap;z-index:5`;
    hint.textContent = 'Drag orbit · right-drag pan · scroll zoom · [ ] next area · 0 overview · C reset · L labels · space pause';
    app.appendChild(hint);
    const list = document.createElement('div');
    list.style.cssText = `position:absolute;right:16px;top:16px;display:flex;flex-direction:column;gap:2px;padding:6px;border-radius:12px;background:rgba(255,255,255,.9);box-shadow:0 4px 18px rgba(30,40,90,.14);font:600 12.5px ${font};z-index:5`;
    app.appendChild(list);
    let sel = -1;
    const items = MAP.spots.map((s, i) => {
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
    const go = (i) => {
      sel = (i + MAP.spots.length) % MAP.spots.length;
      const s = MAP.spots[sel];
      goal = {...goal, x: s.x, z: s.z, d: s.d};
      mark();
    };
    // ---------------------------------------------------------------- the Tweakpane panel
    const host = document.createElement('div');
    host.style.cssText = 'position:absolute;left:16px;top:52px;width:290px;z-index:6';
    app.appendChild(host);
    const pane = new Pane({title: 'Peta', container: host});
    const ui = {labels: true, outlines: true, pads: true, gtao: st.gtao.enabled};
    pane.addBinding(ui, 'labels', {label: 'label'}).on('change', (e) => (MAP.labels.visible = e.value));
    pane.addBinding(ui, 'outlines', {label: 'garis di air'}).on('change', (e) => (MAP.outlines.visible = e.value));
    pane.addBinding(ui, 'pads', {label: 'warna zona'}).on('change', (e) => (MAP.pads.visible = e.value));
    const fr = pane.addFolder({title: 'Render', expanded: false});
    fr.addBinding(ui, 'gtao', {label: 'GTAO'}).on('change', (e) => (st.gtao.enabled = e.value));
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
        goal.el = clamp(goal.el + dy * 0.25, 4, 89);
      }
      cam = {...goal};
    });
    const end = () => (drag = null);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      goal.d = clamp(goal.d * Math.exp(e.deltaY * 0.0012), 25, 9000);
    }, {passive: false});
    addEventListener('keydown', (e) => {
      if (e.target.closest?.('.tp-rotv')) return; // typing in the panel
      if (e.key === ']') go(sel + 1);
      else if (e.key === '[') go(sel < 0 ? -1 : sel - 1);
      else if (e.key === '0') go(0);
      else if (e.key === 'l' || e.key === 'L') {
        ui.labels = MAP.labels.visible = !MAP.labels.visible;
        pane.refresh();
      }
      else if (e.key === 'c' || e.key === 'C') {
        goal = home();
        sel = -1;
        mark();
      }
    });
  }
  window.LOOK2 = {st, MAP, view: (o) => (goal = {...goal, ...o})};
  let shadowE = 0;
  return {
    resize() {
      st.resize(1600, capture ? 900 : Math.round((1600 * innerHeight) / innerWidth) || 900, 1);
    },
    render(t) {
      MAP.tick(cfg.at ?? t);
      if (capture) cam = home();
      else for (const k of ['x', 'z', 'az', 'el', 'd']) cam[k] = lerp(cam[k], goal[k], 0.14);
      // the sun's shadow box grows with the view so far views still carry shadows (softer), close ones stay crisp
      const e = clamp(cam.d * 0.55, 230, 2400);
      if (Math.abs(e - shadowE) > 20) {
        shadowE = e;
        sc.left = sc.bottom = -e;
        sc.right = sc.top = e;
        sc.updateProjectionMatrix();
      }
      // the near plane follows the distance so the flat zone pads keep their depth order from far out
      const near = clamp(cam.d * 0.006, 2, 30);
      if (Math.abs(near - st.camera.near) > 0.5) {
        st.camera.near = near;
        st.camera.updateProjectionMatrix();
      }
      // far out only the big area names, the small ones come in closer
      // labels keep a fixed size on screen, so far out they would cover the map: shrink them as the camera pulls out
      const ls = clamp(Math.pow(1200 / cam.d, 0.6), 0.45, 1);
      for (const sp of MAP.labels.children) {
        sp.visible = sp.userData.major || cam.d < 2600;
        if (sp.userData.base) sp.scale.copy(sp.userData.base).multiplyScalar(ls);
      }
      st.frame({tx: cam.x, ty: 0, tz: cam.z, az: cam.az * D2R, el: cam.el * D2R, d: cam.d, fov: cfg.cam.fov});
      return {};
    },
  };
});
