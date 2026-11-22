// A bench for Portline's models: every machine and building on the lot under the stage, for close-up stills.
// --config {"cam": {...}, "at": t}
import * as THREE from 'three';
import {runSim} from '../kit/runtime.js';
import {TOY, toyMat, createToyStage} from '../airport-shared/style.js';
import {buildToyForklift} from '../airport-shared/gse.js';
import * as V from '../port-shared/vehicles.js';
import * as I from '../port-shared/infra.js';

runSim({duration: 10, fps: 60, theme: 'light', hud: {enabled: false, title: 'b', subtitle: ''}, director: {enabled: false}, watermark: '', cam: {tx: 0, ty: 2, tz: 0, az: 38, el: 30, d: 120, fov: 28}}, async ({cfg, canvas}) => {
  const st = createToyStage(canvas, {fov: cfg.cam.fov});
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
  const hero = V.buildToyContainer({color: TOY.orange, id: 'AURU 482113 9', line: 'CARGOVIVA'});
  add(hero.group, 8 + -1.6 - ch.kingpin + ch.boxX, 0, 0, ch.deckY);
  const pm = V.buildToyPrimeMover();
  add(pm.group, 8, 14);
  const sk = V.buildToySkeletalTrailer();
  add(sk.group, 8 - 2.3 - sk.kingpin, 14);
  const box2 = V.buildToyContainer({color: TOY.teal, id: 'KSTU 305528 5', line: 'KESTREL', reefer: true});
  add(box2.group, 8 - 2.3 - sk.kingpin + sk.boxX, 14, 0, sk.deckY);
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
  const tug = V.buildToyTugboat();
  add(tug.group, 20, 40);
  const pb = V.buildToyPilotBoat();
  add(pb.group, 40, 40);
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
  const ship = I.buildToyShip();
  add(ship.group, 0, -120, 0, -2.6);
  const D2R = Math.PI / 180;
  window.BENCH = {st, rs, sc, qc};
  return {
    resize() { st.resize(1600, 900, 1); },
    render(t) {
      tug.bob(t);
      const c = cfg.cam;
      st.frame({tx: c.tx, ty: c.ty, tz: c.tz, az: c.az * D2R, el: c.el * D2R, d: c.d, fov: c.fov});
      return {};
    },
  };
});
