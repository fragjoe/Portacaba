// One object on the lot: the red cab-over road tractor on a skeletal trailer with a 40 ft box, for a close look.
// --config {"cam": {"az": 58, "el": 12, "d": 46}}
import * as THREE from 'three';
import {runSim} from '../kit/runtime.js';
import {TOY, toyMat, createToyStage} from '../airport-shared/style.js';
import {buildToyRedCabTractor, buildToySkeletalTrailer, buildToyContainer} from '../port-shared/vehicles.js';

runSim({duration: 1, fps: 60, theme: 'light', hud: {enabled: false, title: 'truck', subtitle: ''}, director: {enabled: false}, watermark: '', cam: {tx: -3, ty: 2.6, tz: 0, az: 58, el: 12, d: 46, fov: 28}}, async ({cfg, canvas}) => {
  const st = createToyStage(canvas, {fov: cfg.cam.fov});
  const g = new THREE.Mesh(new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2), toyMat(TOY.ground, {rough: 0.95}));
  g.receiveShadow = true;
  st.scene.add(g);
  const tr = buildToyRedCabTractor();
  const sk = buildToySkeletalTrailer();
  const bx = buildToyContainer({color: TOY.orange, id: 'AURU 482113 9', line: 'CARGOVIVA'});
  sk.group.position.x = tr.fifth.x - sk.kingpin;
  bx.group.position.set(sk.group.position.x + sk.boxX, sk.deckY, 0);
  st.scene.add(tr.group, sk.group, bx.group);
  const D2R = Math.PI / 180;
  return {
    resize() { st.resize(1600, 1000, 1); },
    render() {
      const c = cfg.cam;
      st.frame({tx: c.tx, ty: c.ty, tz: c.tz, az: c.az * D2R, el: c.el * D2R, d: c.d, fov: c.fov});
      return {};
    },
  };
});
