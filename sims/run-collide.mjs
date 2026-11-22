// Runs a *-collide page headless and prints its COLLIDE line: node sims/run-collide.mjs port-collide
import path from 'node:path';
import {CHROMIUM, CHROMIUM_ARGS, DIST, playwright} from '../paths.mjs';
const name = process.argv[2] ?? 'port-collide';
const {chromium} = playwright();
const browser = await chromium.launch({executablePath: CHROMIUM, args: CHROMIUM_ARGS});
const page = await browser.newPage({viewport: {width: 800, height: 450}});
const done = new Promise((res) => page.on('console', (m) => {
  const t = m.text();
  if (t.startsWith('COLLIDE')) res(t);
  else if (m.type() === 'error') console.error('[page]', t);
}));
page.on('pageerror', (e) => console.error('[page error]', e.message));
await page.addInitScript(() => (window.__CAPTURE = true));
await page.goto('file://' + path.join(DIST, `${name}.html`));
const line = await Promise.race([done, new Promise((r) => setTimeout(() => r('TIMEOUT'), 180000))]);
const list = line.startsWith('COLLIDE') ? JSON.parse(line.slice(8)) : line;
console.log(Array.isArray(list) ? (list.length ? list.join('\n') : 'no collisions') : list);
await browser.close();
