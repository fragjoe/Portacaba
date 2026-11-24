// The brand artwork printed on Portline's props: the Koneksea wordmark in white (on blue, dark hulls, boxes) and in
// blue (on white walls and signs). The files live in docs/; build.mjs bundles .webp as a data URL. They are decoded
// here with a top-level await, so this module only finishes loading once they're ready and the first frame of any page
// or capture already has them.
//
//   LOGOS.white / LOGOS.blue      -> the decoded images (for canvas signs)
//   logoPlate(P, key, h, x, y, z, ry)   a flat print of the logo, h high (the artwork's own height), facing +z turned ry
//   logoAspect(key)               -> width / height of the artwork
import * as THREE from 'three';
import {decalMat} from '../airport-shared/gse.js';
import white from '../../docs/Logo-Koneksea-Putih.webp';
import blue from '../../docs/Logo-Koneksea-Biru.webp';

const load = (src) => new Promise((res) => {
  const img = new Image();
  img.onload = () => res(img);
  img.onerror = () => res(null);
  img.src = src;
});
export const LOGOS = {white: await load(white), blue: await load(blue)};

const TEX = new Map();
/** the logo on a canvas with a clear margin (the artwork is cropped tight; its edge would smear into a line) */
function logoTex(key) {
  if (TEX.has(key)) return TEX.get(key);
  const img = LOGOS[key];
  if (!img) return null;
  const pad = Math.round(img.height * 0.12);
  const c = document.createElement('canvas');
  c.width = img.width + 2 * pad;
  c.height = img.height + 2 * pad;
  c.getContext('2d').drawImage(img, pad, pad);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const out = {tex, aspect: c.width / c.height, k: c.height / img.height};
  TEX.set(key, out);
  return out;
}

export const logoAspect = (key) => (LOGOS[key] ? LOGOS[key].width / LOGOS[key].height : 4.9);

/** a print of the logo whose artwork is h high, centred on (x, y, z), facing +z turned by ry */
export function logoPlate(P, key, h, x, y, z, ry = 0) {
  const L = logoTex(key);
  if (!L) return P;
  const hh = h * L.k;
  return P.print(decalMat(L.tex), hh * L.aspect, hh, x, y, z, ry);
}
