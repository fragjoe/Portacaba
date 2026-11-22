// Portline, the container terminal film: one 40 ft box, AURU 482113 9, from the ship's deck to the city road. One
// camera at one angle (azimuth 38, elevation 36) that pans and zooms; the story moves through clicks and the site
// switcher's dropdown.
//   0-7.9     Berth 2: QC-02 discharges the box onto TT-07          (clicks: QC-02, TT-07)
//   8.2-16.2  the camera rides TT-07 to Block B3
//   17.4-23.8 RS-04 stacks it on B3-07-01-2                          (click: RS-04)
//   24-30     the box waits, customs releases it, TRK-8812 arrives   (clicks: the box, TRK-8812)
//   30.4-35.6 RS-04 loads it onto TRK-8812
//   35.9-44   the dropdown jumps to Gate 2: OCR, the weighbridge, the barrier, out
//   44.6-47.3 home over the whole terminal
import * as THREE from 'three';
import {runSim} from '../kit/runtime.js';
import {TOY, createToyStage} from '../airport-shared/style.js';
import {createToyUI} from '../airport-shared/ui.js';
import {createSelection} from '../airport-shared/select.js';
import {thumb} from '../airport-shared/thumbs.js';
import {OPERATOR_AVATAR} from '../airport-shared/avatar.js';
import {BOX, buildToyContainer, buildToyTerminalTractor, buildToyTerminalChassis, buildToyReachStacker, buildToyRedCabTractor, buildToySkeletalTrailer} from './vehicles.js';
import {buildToyQuayCrane, buildToyGate} from './infra.js';
import {DUR, T, HERO_ID, buildWorld} from './world.js';

const D2R = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (x) => {
  const u = clamp(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const ss = (a, b, t) => sm((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;

export const UI_WORDS = {
  brand: 'Portline',
  search: 'Search boxes, vessels, cranes, trucks...',
  user: ['Dewi Anggraini', 'Terminal Operations'],
  avatar: OPERATOR_AVATAR,
  kpis: [
    {ic: 'cube', k: 'Crane moves / hour', key: 'a', v: '31.2', d: '+1.8', s: 'QC-02 · Berth 2'},
    {ic: 'truck', k: 'Trucks in terminal', key: 'b', v: '86', d: '+4', s: '12 at the gate'},
    {ic: 'clock', k: 'Truck turnaround', key: 'c', v: '34m', d: '-3m', s: 'last 24 h · NCT'},
  ],
};

const CLICKS = [
  {t: 1.4, at: 'qc2', card: 'qc2'},
  {t: 6.9, at: 'tt7', card: 'tt7'},
  {t: 18.4, at: 'rs4', card: 'rs4'},
  {t: 24.6, at: 'hero', card: 'hero'},
  {t: 28.3, at: 'trk', card: 'trk'},
  {t: 35.9, ui: [1167, 37], drop: 'open'},
  {t: 37.0, ui: [930, 274], card: 'site'},
  {t: 44.6, ui: [1159, 275], tool: 6, card: 'site'},
];
export const FILM_CLICKS = CLICKS.map((c) => c.t);

const AZ = 38;
const EL = 36;
const KEYS = [
  {t: 0, x: 4, z: -30, d: 172},
  {t: 7.8, x: 6, z: -28, d: 164},
  {t: 16.4, x: 38, z: 30, d: 150},
  {t: 23.8, x: 38, z: 30, d: 150},
  {t: 26.2, x: 26, z: 34, d: 160},
  {t: 30.0, x: 36, z: 32, d: 150},
  {t: 37.0, x: 36, z: 32, d: 150},
  {t: 38.9, x: 132, z: 50, d: 150},
  {t: 43.8, x: 138, z: 51, d: 158},
  {t: 46.4, x: 20, z: 8, d: 420},
  {t: DUR, x: 18, z: 8, d: 410},
];
const SITES = {
  BERTH: ['B2', 'Berth 2', 'Aurora Meridian · 35%'],
  YARD: ['B3', 'Yard Block B3', '71% full · RS-04 on shift'],
  GATE: ['G2', 'Gate 2', '2/4 lanes busy · OCR on'],
  NET: ['NCT', 'Northbay Terminal', '1 vessel · 86 trucks'],
};
const DROP = [
  ['B2', 'Berth 2', 'Aurora Meridian · 35%', 35],
  ['B3', 'Yard Block B3', '71% full · RS-04 on shift', 71],
  ['G2', 'Gate 2', '2/4 lanes busy · OCR on', 50],
  ['RF', 'Reefer Yard', '84 plugs · 61 in use', 73],
];

export function runToyPortFilm() {
  return runSim({duration: DUR, fps: 60, theme: 'light', hud: {enabled: false, title: 'portline', subtitle: ''}, director: {enabled: false}, watermark: ''}, async ({canvas, capture}) => {
    const app = document.getElementById('app');
    const st = createToyStage(canvas, {fov: 28});
    st.scene.fog.near = 900;
    st.scene.fog.far = 1800;
    const W = buildWorld();
    st.scene.add(W.root);
    const ui = createToyUI(app, UI_WORDS);
    const sel = createSelection(st.scene, st);
    const fit = () => (app.style.transform = `scale(${Math.min(innerWidth / 1600, innerHeight / 900)})`);
    const resize = () => {
      fit();
      st.resize(1600, 900, capture ? devicePixelRatio || 1 : Math.min(devicePixelRatio || 1, 2));
    };
    resize();

    // card thumbnails rendered from the models
    const truckThumb = () => {
      const g = new THREE.Group();
      const pm = buildToyRedCabTractor({number: '8812'});
      const sk = buildToySkeletalTrailer();
      const b = buildToyContainer({color: TOY.orange, id: HERO_ID, line: 'CARGOVIVA'});
      sk.group.position.x = -2.3 - sk.kingpin;
      b.group.position.set(-2.3 - sk.kingpin + sk.boxX, sk.deckY, 0);
      g.add(pm.group, sk.group, b.group);
      return g;
    };
    const ttThumb = () => {
      const g = new THREE.Group();
      const tt = buildToyTerminalTractor({number: '07'});
      const ch = buildToyTerminalChassis();
      const b = buildToyContainer({color: TOY.orange, id: HERO_ID, line: 'CARGOVIVA'});
      ch.group.position.x = -1.6 - ch.kingpin;
      b.group.position.set(-1.6 - ch.kingpin + ch.boxX, ch.deckY, 0);
      g.add(tt.group, ch.group, b.group);
      return g;
    };
    const TH = {
      qc: thumb(buildToyQuayCrane({number: '02'}).group, {pad: 0.95}),
      tt: thumb(ttThumb()),
      rs: thumb((() => {const r = buildToyReachStacker(); r.reach(9, 5.1); return r.group;})()),
      box: thumb(buildToyContainer({color: TOY.orange, id: HERO_ID, line: 'CARGOVIVA'}).group),
      truck: thumb(truckThumb()),
      gate: thumb(buildToyGate({lanes: [{z: -2, dir: 1}, {z: 2, dir: 1}, {z: 8, dir: -1}, {z: 12, dir: -1}]}).group, {pad: 0.95}),
      ship: thumb(W.objects.ship.group.clone(), {pad: 0.9}),
    };

    const P = (o) => o.getWorldPosition(new THREE.Vector3());
    const keyCam = (t) => {
      let i = 0;
      while (i < KEYS.length - 2 && KEYS[i + 1].t <= t) i++;
      const a = KEYS[i];
      const b = KEYS[i + 1];
      const k = ss(a.t, b.t, t);
      const far = Math.hypot(b.x - a.x, b.z - a.z);
      const arc = far > 50 ? 0.28 * Math.sin(Math.PI * k) : 0;
      return {x: lerp(a.x, b.x, k), z: lerp(a.z, b.z, k), d: lerp(a.d, b.d, k) * (1 + arc)};
    };
    const camAt = (t) => {
      const c = keyCam(t);
      // ride TT-07 from the berth to the block
      const w = ss(8.2, 9.4, t) * (1 - ss(14.8, 16.4, t));
      if (w > 0) {
        const p = P(W.objects.hero.group);
        c.x = lerp(c.x, p.x + 2, w);
        c.z = lerp(c.z, p.z - 2, w);
        c.d = lerp(c.d, 150, w);
      }
      return c;
    };

    let ST = {heroAt: 'ship'};
    const siteAt = (t) => (t < 16.4 ? 'BERTH' : t < 37.0 ? 'YARD' : t < 44.6 ? 'GATE' : 'NET');
    const released = (t) => t >= 26.8;
    const heroState = (t) => {
      const a = ST.heroAt;
      if (a === 'ship') return ['On board', 'Bay 14 · Row 02 · Tier 84', 'wait'];
      if (a === 'crane') return ['Discharging', 'QC-02 · lane 2', 'go'];
      if (a === 'chassis') return t < T.haul[0] ? ['On chassis', 'TT-07 · lane 2', 'go'] : t < T.haul[1] ? ['To yard', 'TT-07 → Block B3', 'in'] : ['At block', 'B3 · lane B', 'wait'];
      if (a === 'rs') return t < 28 ? ['Stacking', 'RS-04 → B3-07-01-2', 'go'] : ['Loading out', 'RS-04 → TRK-8812', 'go'];
      if (a === 'stack') return released(t) ? ['Released', 'B3-07-01-2 · customs clear', 'go'] : ['In yard', 'B3-07-01-2 · customs hold', 'wait'];
      if (t < T.truckOut[0]) return ['Loaded', 'TRK-8812 · lane B', 'go'];
      if (t < T.ocr[0]) return ['To gate', 'TRK-8812 → Gate 2 · Out 1', 'in'];
      if (t < T.exit[0]) return ['Gate check', 'OCR · weighbridge 30.1 t', 'wait'];
      return ['Gate out', 'Delivered to the road', 'go'];
    };
    const cardAt = (t, kind, t0) => {
      const pop = ss(t0, t0 + 0.35, t);
      const pc = (a, b) => clamp((t - a) / (b - a));
      if (kind === 'qc2') {
        const done = 412 + (t > 6.6 ? 1 : 0);
        return {pop, thumb: TH.qc, org: 'QUAY CRANE · BERTH 2', title: 'QC-02', sub: 'STS crane · 65 t', stat: 'Discharging', statCls: 'go', statText: `AURORA MERIDIAN · Bay 14 · ${done}/1,180`, prog: done / 1180, progText: '35%', rows: [['Box', HERO_ID, 1], ['Spreader', t < 1.4 + 0.2 ? 'Lowering' : t < 6.8 ? 'Locked · 24.6 t' : 'Unlocked'], ['Lane', '2 · TT-07 waiting'], ['Rate', '31.2 moves/h'], ['Operator', 'Shift B · R. Saputra']]};
      }
      if (kind === 'tt7') {
        const [s, txt, cls] = heroState(t);
        const left = Math.max(0, Math.round(T.haul[1] - t));
        return {pop, thumb: TH.tt, org: 'YARD TRUCK · NCT FLEET', title: 'TT-07', sub: 'Terminal tractor', stat: s, statCls: cls, statText: txt, prog: pc(...T.haul), progText: t < T.haul[1] ? `${left} s` : 'arrived', rows: [['Box', HERO_ID, 1], ['From', 'QC-02 · lane 2'], ['To', 'Block B3 · bay 07'], ['Speed', t > T.haul[0] && t < T.haul[1] ? `${Math.round(18 + 12 * Math.sin(Math.PI * pc(...T.haul)))} km/h` : '0 km/h'], ['Battery', `${Math.round(68 - t * 0.2)}%`]]};
      }
      if (kind === 'rs4') {
        const first = t < 26;
        const p = first ? pc(17.4, 23.8) : pc(30.4, 35.6);
        return {pop, thumb: TH.rs, org: 'YARD · BLOCK B3', title: 'RS-04', sub: 'Reach stacker · 45 t', stat: ST.heroAt === 'rs' ? (first ? 'Stacking' : 'Loading out') : 'Ready', statCls: ST.heroAt === 'rs' ? 'go' : 'wait', statText: first ? `${HERO_ID} → B3-07-01-2` : `${HERO_ID} → TRK-8812`, prog: p, progText: `${Math.round(100 * p)}%`, rows: [['Load', ST.heroAt === 'rs' ? '24.6 t' : '0 t'], ['Reach', ST.heroAt === 'rs' ? 'Row 1 · tier 2' : 'Lane B'], ['Moves today', String(57 + (t > 23 ? 1 : 0) + (t > 35 ? 1 : 0))], ['Fuel', '62%']]};
      }
      if (kind === 'hero') {
        const [s, txt, cls] = heroState(t);
        return {pop, thumb: TH.box, org: 'CONTAINER · CARGOVIVA', title: HERO_ID, sub: "40' dry · 45G1 · import", stat: s, statCls: cls, statText: txt, prog: released(t) ? 1 : pc(24.6, 26.8), progText: released(t) ? 'released' : 'checking', rows: [['Gross weight', '24.6 t · VGM ok', 1], ['Consignee', 'Lakeview Retail'], ['Customs', released(t) ? 'Released · SPPB 08812' : 'Document check'], ['Booking', 'TRK-8812 · 14:20'], ['Seal', 'CV 4471028']]};
      }
      if (kind === 'trk') {
        const [s, txt, cls] = heroState(t);
        const arr = t < T.truckIn[1];
        const loading = ST.heroAt === 'rs' && t > 28;
        return {pop, thumb: TH.truck, org: 'KESTREL HAULAGE', title: 'TRK-8812', sub: 'Prime mover + skeletal', stat: arr ? 'Arriving' : ST.heroAt === 'truck' ? s : loading ? 'Loading' : 'Waiting', statCls: arr ? 'in' : ST.heroAt === 'truck' ? cls : loading ? 'go' : 'wait', statText: arr ? 'Gate 2 in → Block B3 lane B' : ST.heroAt === 'truck' ? txt : 'B3 · lane B · RS-04', prog: arr ? pc(...T.truckIn) : clamp((t - T.truckIn[1]) / (T.exit[0] - T.truckIn[1])), progText: arr ? 'arriving' : `${Math.round(100 * clamp((t - T.truckIn[1]) / (T.exit[0] - T.truckIn[1])))}%`, rows: [['Pick-up', HERO_ID, 1], ['Booking', 'TAR 14:20 · on time'], ['Driver', 'B. Hidayat'], ['Plate', 'B 9812 KX'], ['In-gate', '14:07 · Gate 2']]};
      }
      const site = siteAt(t);
      const S = {
        BERTH: {thumb: TH.ship, org: 'BERTH 2 · NCT', title: 'Aurora Meridian', sub: 'Voyage 048E · ETD 21:30', stat: 'Working', text: '3 cranes · 31.2 moves/h · 9 h 40 m left', stats: [['Moves done', '412', '/ 1,180', 0.35], ['Cranes', '3', '/ 3 rigged', 1, 1], ['Discharge', '268', 'boxes'], ['Load', '144', 'boxes']], inv: [['box', "40' dry", '214', 'Discharge', 'go'], ['frozen', "40' reefer", '38', 'Plug-in', 'go'], ['bin', "20' dry", '16', 'Discharge', 'go'], ['helmet', 'IMO class 3', '4', 'Hazmat', 'wait']], fleet: {title: 'Crane split', meta: '3 cranes', rows: [['QC-02', 'Bay 14 · discharging', 0.42]]}},
        YARD: {thumb: TH.rs, org: 'YARD · BLOCK B3', title: 'Block B3', sub: '4 bays · 3 rows · 4 high', stat: 'Operational', text: '34 boxes · RS-04 on shift', stats: [['Occupancy', '34', '/ 48 TEU', 0.71], ['Machines', '1', '/ 1 busy', 1, 1], ['Import', '22', 'boxes'], ['Dwell', '2.4', 'days']], inv: [['box', "40' dry", '28', 'In stock', 'go'], ['frozen', "40' reefer", '0', 'Rack R1', 'wait'], ['bin', "20' dry", '6', 'In stock', 'go'], ['helmet', 'Customs hold', '3', 'Hold', 'wait']], fleet: {title: 'Yard machines', meta: '4/4 working', rows: [['RS-04', ST.heroAt === 'rs' ? 'Moving AURU 482113 9' : 'Block B3 · lane B', 0.62]]}},
        GATE: {thumb: TH.gate, org: 'GATE 2 · NCT', title: 'Gate 2', sub: '2 in · 2 out · OCR + weighbridge', stat: 'Open', text: '2/4 lanes busy · 3 min avg', stats: [['Gate moves', '612', 'today'], ['Lanes', '2', '/ 4 busy', 0.5, 1], ['Avg in-gate', '3.1', 'min'], ['OCR read', '99.2%', '']], inv: [['box', 'Pick-ups', '318', 'Today', 'go'], ['bin', 'Drop-offs', '294', 'Today', 'go'], ['helmet', 'Damage flags', '2', 'Check', 'wait'], ['gloves', 'Seal checks', '612', 'Done', 'go']], fleet: {title: 'Gate lanes', meta: '4 lanes', rows: [['Out 1', t < T.exit[0] ? 'TRK-8812 · OCR check' : 'TRK-8812 · released', t < T.exit[0] ? 0.7 : 1]]}},
        NET: {thumb: TH.qc, org: 'TERMINAL', title: 'Northbay Container Terminal', sub: '1 berth · 6 blocks · 2 gates', stat: 'Operational', text: '1 vessel · 3 cranes · 86 trucks', stats: [['Yard', '6,840', '/ 9,600 TEU', 0.71], ['Cranes', '2', '/ 3 working', 0.67, 1], ['Moves today', '1,946', ''], ['Turnaround', '34', 'min']], inv: [['box', "40' dry", '4,112', 'In yard', 'go'], ['frozen', 'Reefers', '61', 'Plugged', 'go'], ['bin', 'Empties', '1,204', 'Depot', 'go'], ['helmet', 'Customs hold', '38', 'Hold', 'wait']], fleet: {title: 'Equipment', meta: '9/11 working', rows: [['QC-02', 'Berth 2 · bay 14', 0.42]]}},
      }[site];
      return {pop, thumb: S.thumb, org: S.org, title: S.title, sub: S.sub, stat: S.stat, statCls: 'go', statText: S.text, prog: 0, progText: '', stats: S.stats, inv: S.inv, fleet: S.fleet, rows: []};
    };
    const selection = (t) => {
      let cur = {kind: 'site', t0: -1};
      for (const c of CLICKS) if (c.card && t >= c.t) cur = {kind: c.card, t0: c.t};
      return cur;
    };
    const SEL_OBJ = {qc2: W.objects.qcs[1].head, tt7: W.objects.tt7.group, rs4: W.objects.rs.group, hero: W.objects.hero.group, trk: W.objects.pm.group};
    const SEL_TEXT = (kind, t) => ({qc2: ['QC-02', 'Discharging'], tt7: ['TT-07', heroState(t)[0]], rs4: ['RS-04', ST.heroAt === 'rs' ? 'Lifting' : 'Ready'], hero: [HERO_ID, heroState(t)[0]], trk: ['TRK-8812', heroState(t)[0]]})[kind];
    const ROUTE = {tt7: (t) => W.routes.tt7(t), trk: (t) => W.routes.trk(t)};

    const proj = (v) => st.project(v);
    const targetOf = (c) => (c.ui ? c.ui : proj(W.anchors[c.at]()) ?? [800, 450]);
    const GLIDE = 1.0;
    const cursorAt = (t) => {
      let prev = [1050, 620];
      let hand = true;
      for (const c of CLICKS) {
        const target = targetOf(c);
        if (t < c.t - GLIDE) return {p: prev, hand};
        if (t < c.t) {
          const k = sm((t - (c.t - GLIDE)) / GLIDE);
          return {p: [lerp(prev[0], target[0], k), lerp(prev[1], target[1], k) - 16 * Math.sin(Math.PI * k)], hand: !c.ui};
        }
        prev = target;
        hand = !c.ui;
      }
      return {p: prev, hand};
    };
    const clickAt = (t) => {
      let v = 0;
      for (const c of CLICKS) if (t >= c.t && t < c.t + 0.7) v = Math.max(v, 1 - (t - c.t) / 0.7);
      return v;
    };
    const dropOpen = (t) => ss(35.9, 36.2, t) * (1 - ss(37.05, 37.3, t));
    const kpiFor = (site, t) =>
      ({
        BERTH: {a: ['31.2', '+1.8', 'QC-02 · Berth 2'], b: ['86', '+4', '12 at the gate'], c: ['34m', '-3m', 'last 24 h · NCT']},
        YARD: {a: ['28.6', '+0.9', 'yard moves · Block B3'], b: [String(t < T.truckIn[0] ? 86 : 87), '+5', 'TRK-8812 inbound'], c: ['34m', '-3m', 'last 24 h · NCT']},
        GATE: {a: ['31.0', '+1.6', 'QC average · NCT'], b: [String(t < T.exit[0] ? 87 : 86), '+4', '2 lanes busy · Gate 2'], c: ['33m', '-4m', 'TRK-8812 · 31 min']},
        NET: {a: ['30.8', '+1.4', '3 cranes · Berth 2'], b: ['86', '+4', '12 at the gate'], c: ['33m', '-4m', 'last 24 h · NCT']},
      })[site];
    const trackFor = (t) => {
      const a = ST.heroAt;
      const order = ['ship', 'crane', 'chassis', 'rs', 'stack', 'truck'];
      const idx = order.indexOf(a);
      const inYard = idx >= 3 && !(a === 'rs' && t > 28);
      const st2 = (on, done) => (done ? 'done' : on ? 'on' : '');
      const onTruck = a === 'truck' || (a === 'rs' && t > 28);
      const out = t >= T.exit[0];
      const steps = [
        ['Discharged', t > 6.8 ? '14:02' : 'QC-02', 'box', st2(idx <= 1, t > 6.8)],
        ['In Yard B3', t > 22.8 ? '14:06' : 'ETA 14:06', 'load', st2(t > 6.8 && !inYard && !onTruck ? false : inYard && !released(t), released(t) || onTruck)],
        ['Customs OK', released(t) ? '14:09' : 'SPPB', 'doc', st2(a === 'stack' && !released(t), released(t))],
        ['On Truck', onTruck && t > 34.5 ? '14:18' : 'TRK-8812', 'truck', st2(onTruck && !out, out)],
        ['Gate Out', out ? '14:21' : 'Gate 2', 'check', out ? 'on' : ''],
      ];
      const fill = out ? 1 : onTruck ? 0.75 : released(t) ? 0.5 : inYard ? 0.25 : 0;
      const [s, txt, cls] = heroState(t);
      return {title: 'Container Tracking', meta: `${HERO_ID} · import`, fill, steps, ship: {thumb: TH.box, id: HERO_ID, to: 'To: Lakeview Retail · Northbay', stat: s, statCls: cls, meta: txt}};
    };
    const tableFor = (site, t) => {
      if (site === 'BERTH')
        return {tabs: [['Cranes', '3'], ['Lanes', '3'], ['Trucks', '6']], active: 0, site: 'Berth 2', rows: [
          {id: 'QC-02', org: 'Bay 14', dot: TOY.blue, where: ST.heroAt === 'crane' ? `${HERO_ID} · lane 2` : 'Lane 2 · TT-07', stat: 'Discharging', cls: 'go', p: 35, pt: '412/1,180'},
          {id: 'QC-01', org: 'Bay 06', dot: TOY.teal, where: 'Dual cycle · TT-03', stat: 'Working', cls: 'go', p: 41, pt: '188/460'},
          {id: 'QC-03', org: 'Bay 22', dot: '#c9d1ea', where: 'Boom up · hatch work', stat: 'Idle', cls: 'wait', p: null, pt: '12 min'},
          {id: 'TT-07', org: 'NCT fleet', dot: TOY.orange, where: t < T.haul[0] ? 'Lane 2 · under QC-02' : 'To Block B3', stat: t < T.haul[0] ? 'Loading' : 'Hauling', cls: t < T.haul[0] ? 'go' : 'in', p: null, pt: t < T.haul[0] ? 'now' : `${Math.max(0, Math.round(T.haul[1] - t))} s`},
        ]};
      if (site === 'YARD' || site === 'NET')
        return {tabs: [['Blocks', '6'], ['Machines', '4/4'], ['Trucks', String(t < T.truckIn[0] ? 4 : 5)]], active: 1, site: site === 'NET' ? 'Terminal' : 'Block B3', rows: [
          {id: 'RS-04', org: 'Block B3', dot: TOY.yellow, where: ST.heroAt === 'rs' ? `${HERO_ID}` : 'Lane B', stat: ST.heroAt === 'rs' ? 'Lifting' : 'Ready', cls: ST.heroAt === 'rs' ? 'go' : 'wait', p: null, pt: '57 moves'},
          {id: 'RTG-05', org: 'Block B2', dot: TOY.yellow, where: 'Bay 03 · re-shuffle', stat: 'Working', cls: 'go', p: 64, pt: '1-over-4'},
          {id: 'SC-11', org: 'Apron', dot: TOY.yellow, where: 'Berth 2 → Block A1', stat: 'Hauling', cls: 'in', p: null, pt: '2 min'},
          {id: 'TRK-8812', org: 'Kestrel', dot: TOY.teal, where: t < T.truckIn[1] ? 'Gate 2 → lane B' : ST.heroAt === 'truck' ? 'To Gate 2' : t > T.load[0] ? 'Lane B · RS-04 loading' : 'Lane B · waiting', stat: t < T.truckIn[0] ? 'Booked' : t < T.truckIn[1] ? 'Arriving' : ST.heroAt === 'truck' ? 'Loaded' : t > T.load[0] ? 'Loading' : 'Waiting', cls: t < T.truckIn[1] ? 'in' : ST.heroAt === 'truck' || t > T.load[0] ? 'go' : 'wait', p: null, pt: '14:20'},
        ]};
      return {tabs: [['Lanes', '4'], ['In', '2'], ['Out', '2']], active: 0, site: 'Gate 2', rows: [
        {id: 'Out 1', org: 'Gate 2', dot: TOY.blue, where: t < T.ocr[0] ? 'TRK-8812 · approaching' : 'TRK-8812 · ' + HERO_ID, stat: t < T.ocr[0] ? 'Arriving' : t < T.exit[0] ? 'OCR check' : 'Released', cls: t < T.ocr[0] ? 'in' : t < T.exit[0] ? 'wait' : 'go', p: t < T.ocr[0] ? null : t < T.exit[0] ? 70 : 100, pt: t < T.exit[0] ? '30.1 t' : 'out'},
        {id: 'Out 2', org: 'Gate 2', dot: '#c9d1ea', where: 'No truck', stat: 'Open', cls: 'wait', p: null, pt: ''},
        {id: 'In 1', org: 'Gate 2', dot: '#c9d1ea', where: 'No truck', stat: 'Open', cls: 'wait', p: null, pt: ''},
        {id: 'In 2', org: 'Gate 2', dot: TOY.blue, where: 'TRK-8640 · AURU 771046 3', stat: 'Booking check', cls: 'in', p: 40, pt: '2 min'},
      ]};
    };
    const underUI = ([x, y]) => (x > 1130 && y < 560) || (x > 1080 && y > 620) || (x < 1000 && y > 720) || (x < 780 && y < 185);
    const pinsAt = (t) => {
      const out = [];
      const pin = (v, a = 1) => {
        const s = proj(v);
        if (s && s[0] > 20 && s[0] < 1580 && s[1] > 80 && s[1] < 880 && !underUI(s)) out.push({kind: 'pin', x: s[0], y: s[1], a});
      };
      if (t < 8) pin(new THREE.Vector3(-39.5, 14.5, -48));
      if (t > 16 && t < 37) {
        pin(W.anchors.stack());
        pin(W.anchors.reefer());
      }
      if (t > 37 && t < 44.6) pin(new THREE.Vector3(W.GATE_X, 9.6, W.OUT_Z + 14));
      return out;
    };

    // ---- free camera (live mode only; capture always uses the film camera)
    // drag = orbit, right-drag or shift-drag = pan, wheel = zoom; 1 Berth, 2 Yard B3, 3 Gate 2, 4 Reefer, 5 overview;
    // C (or 0) hands the camera back to the film. The animation keeps running either way.
    let free = null; // the camera now: {x, z, az, el, d} (az, el in degrees)
    let goal = null; // where it is easing to
    let lastT = 0;
    const SPOTS = {1: {x: 4, z: -30, d: 172}, 2: {x: 38, z: 30, d: 150}, 3: {x: 132, z: 50, d: 150}, 4: {x: 52, z: 74, d: 130}, 5: {x: 20, z: 8, d: 420}};
    const hint = document.createElement('div');
    hint.style.cssText = 'position:absolute;left:34px;top:184px;padding:7px 12px;border-radius:10px;background:rgba(15,23,48,.86);color:#fff;font:600 12.5px Inter,system-ui,sans-serif;pointer-events:none;opacity:0;transition:opacity .2s;white-space:nowrap';
    hint.textContent = 'Free camera · drag, right-drag, scroll · 1-5 jump · C back to film';
    app.appendChild(hint);
    const takeOver = () => {
      if (free) return;
      const c = camAt(lastT);
      free = {x: c.x, z: c.z, az: AZ, el: EL, d: c.d};
      goal = {...free};
      hint.style.opacity = 1;
    };
    const release = () => {
      free = goal = null;
      hint.style.opacity = 0;
    };
    if (!capture) {
      const pxScale = () => Math.min(innerWidth / 1600, innerHeight / 900);
      let drag = null;
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      canvas.addEventListener('pointerdown', (e) => {
        takeOver();
        drag = {x: e.clientX, y: e.clientY, pan: e.button === 2 || e.shiftKey};
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const dx = (e.clientX - drag.x) / pxScale();
        const dy = (e.clientY - drag.y) / pxScale();
        drag.x = e.clientX;
        drag.y = e.clientY;
        if (drag.pan) {
          const a = goal.az * D2R;
          const k = (0.5 * goal.d) / 900;
          // camera right is (cos az, -sin az) on the ground, forward is (-sin az, -cos az)
          // the ground follows the cursor: right-drag moves the target left, down-drag moves it away from the camera
          goal.x -= (Math.cos(a) * dx + (Math.sin(a) * dy) / Math.sin(goal.el * D2R)) * k;
          goal.z -= (-Math.sin(a) * dx + (Math.cos(a) * dy) / Math.sin(goal.el * D2R)) * k;
        } else {
          goal.az -= dx * 0.3;
          goal.el = clamp(goal.el + dy * 0.25, 12, 85);
        }
        free = {...goal};
      });
      const end = () => (drag = null);
      canvas.addEventListener('pointerup', end);
      canvas.addEventListener('pointercancel', end);
      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        takeOver();
        goal.d = clamp(goal.d * Math.exp(e.deltaY * 0.0012), 25, 900);
      }, {passive: false});
      addEventListener('keydown', (e) => {
        if (SPOTS[e.key]) {
          takeOver();
          goal = {...SPOTS[e.key], az: AZ, el: EL};
        } else if (e.key === 'c' || e.key === 'C' || e.key === '0') release();
      });
    }
    const freeCam = () => {
      for (const k of ['x', 'z', 'az', 'el', 'd']) free[k] = lerp(free[k], goal[k], 0.14);
      return free;
    };

    window.TOYPORT = {st, W, camAt};
    return {
      resize,
      render(t) {
        ST = W.pose(t);
        const s = selection(t);
        const site = siteAt(t);
        const obj = SEL_OBJ[s.kind];
        const fadeIn = ss(s.t0, s.t0 + 0.3, t);
        sel.box(obj ?? null, fadeIn);
        const rf = ROUTE[s.kind];
        sel.route(rf ? rf(t) : null, ss(s.t0, s.t0 + 0.9, t), 1);
        sel.update();
        lastT = t;
        if (free) {
          const f = freeCam();
          st.frame({tx: f.x, ty: 1.5, tz: f.z, az: f.az * D2R, el: f.el * D2R, d: f.d, fov: 28, sx: -110, sy: 26});
        } else {
          const c = camAt(t);
          st.frame({tx: c.x, ty: 1.5, tz: c.z, az: AZ * D2R, el: EL * D2R, d: c.d, fov: 28, sx: -110, sy: 26});
        }
        const tags = pinsAt(t);
        if (obj) {
          const a = proj(W.anchors[s.kind]());
          const [txt, sub] = SEL_TEXT(s.kind, t);
          if (a && !underUI(a)) tags.push({kind: 'sel', x: a[0], y: a[1], text: txt, sub, a: fadeIn});
        }
        const cur = cursorAt(t);
        let tool = -1;
        for (const cl of CLICKS) if (cl.tool != null && t >= cl.t && t < cl.t + 0.6) tool = cl.tool;
        ui.update({
          clock: `14:${String(Math.floor(t / 2.2)).padStart(2, '0')}`,
          site: SITES[site],
          kpi: kpiFor(site, t),
          card: cardAt(t, s.kind, s.t0),
          track: trackFor(t),
          table: tableFor(site, t),
          drop: {open: dropOpen(t), sites: DROP, on: t > 36.6 ? 2 : 1},
          tool,
          tags,
          cursor: cur.p,
          hand: cur.hand,
          click: clickAt(t),
        });
        return {};
      },
    };
  });
}
