// Lays the ten style stills out as one labelled comparison sheet: node sims/style-sheet.mjs
// Reads simulator-out/styles/<key>.png, writes simulator-out/styles/portline-10-styles.jpg (and .png).
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {CHROMIUM, CHROMIUM_ARGS, OUT, playwright} from '../paths.mjs';

const DIR = path.join(OUT, 'styles');
const STYLES = [
  ['toy', '1. Toy / clay', 'Bevels, matte paint, soft pastel light (the current Portline)'],
  ['lowpoly', '2. Low-poly isometric', 'Sharp boxes, flat shading, orthographic diorama board'],
  ['diorama', '3. Diorama / tilt-shift', 'Miniature model: perspective, saturated, blurred edges'],
  ['blueprint', '4. Blueprint / technical', 'White line work on deep blue, grid'],
  ['twin', '5. Digital twin (dark)', 'Dark control-room look, glowing edges, the hero box lit'],
  ['semireal', '6. Semi-real', 'PBR materials, sky, ACES, a lower camera'],
  ['cel', '7. Cartoon / cel-shaded', 'Ink outlines, three-tone toon shading'],
  ['mono', '8. Mono + one accent', 'All grey-white, only the hero box and its route in colour'],
  ['voxel', '9. Voxel', 'Everything rebuilt from 1.2 m cubes'],
  ['map2d', '10. Flat 2D map', 'Straight top-down, flat colours, outlines'],
];
const cards = STYLES.map(([k, t, d]) => `<figure><img src="${pathToFileURL(path.join(DIR, k + '.png')).href}"><figcaption><b>${t}</b><span>${d}</span></figcaption></figure>`).join('');
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:#f4f5f8;font-family:Segoe UI,Inter,system-ui,sans-serif;color:#141a2b}
.g{display:grid;grid-template-columns:repeat(2,1fr);gap:22px;padding:28px}
figure{margin:0;background:#fff;border:1px solid #e1e5ee;border-radius:14px;overflow:hidden}
img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover}
figcaption{padding:12px 16px 14px;display:flex;flex-direction:column;gap:3px}
b{font-size:20px}span{font-size:14px;color:#5b6478}
</style><div class="g">${cards}</div>`;
const tmp = path.join(DIR, 'sheet.html');
fs.writeFileSync(tmp, html);
const {chromium} = playwright();
const b = await chromium.launch({executablePath: CHROMIUM, args: CHROMIUM_ARGS});
const p = await b.newPage({viewport: {width: 1700, height: 1000}});
await p.goto(pathToFileURL(tmp).href);
await p.waitForTimeout(500);
await p.screenshot({path: path.join(DIR, 'portline-10-styles.jpg'), fullPage: true, type: 'jpeg', quality: 88});
await b.close();
console.log(path.join(DIR, 'portline-10-styles.jpg'));
