# Portline: the container terminal simulator

A fifth system on the kit, built after the four in the README: **Portline**, Northbay Container Terminal (fictional).
One 40 ft box, `AURU 482113 9`, from the ship's deck to the city road in 47.3 s.

## Story

| Time | What happens |
|---|---|
| 0–7.9 s | QC-02 discharges the box from the AURORA MERIDIAN onto TT-07's chassis |
| 8.2–16.2 s | TT-07 hauls it to Block B3 (the camera rides along) |
| 17.4–23.8 s | Reach stacker RS-04 stacks it on B3-07-01-2 |
| 21–30 s | Customs releases it; the road truck TRK-8812 (red cab) comes in through Gate 2 |
| 30.4–35.6 s | RS-04 loads it onto TRK-8812's skeletal trailer |
| 35.4–44 s | TRK-8812 drives to Gate 2: OCR, weighbridge, the barrier lifts, out |
| 44.6–47.3 s | Home over the whole terminal |

## Files

| Path | What it is |
|---|---|
| `sims/port-shared/vehicles.js` | Machines: 40/20 ft box (+ reefer), instanced stacks, terminal tractor + chassis, two road tractors (`buildToyPrimeMover` white/teal, `buildToyRedCabTractor` red), skeletal trailer, reach stacker, straddle carrier, empty handler, RTG |
| `sims/port-shared/ships.js` | Every vessel on one lofted hull form (flared raked bow, bulbous bow, bilge, transom, antifouling red, rudder, propeller): the container ship (`SHIP`, the film's), general cargo, bulk carrier, oil tanker, LNG carrier (Moss), passenger ship, Ro-Ro, Ro-Pax ferry, ASD tug, pilot boat. `shipLoad()` gives the container ship a full deck load. The container ship carries the white Koneksea logo |
| `sims/port-shared/logos.js` | The Koneksea logos from `docs/` (white and blue, bundled by build.mjs as data URLs, decoded before anything builds) and `logoPlate()`. Blue on white: the office's roof sign, the quay cranes' machinery houses, the CFS sign. White: the gate fascia, the container ship's hull, the boxes with `logo: 'white'` (the hero box, the reefer on the prime mover, the straddle carrier's box) |
| `sims/port-shared/infra.js` | Quay + water + bollards + fenders + crane rails, STS quay crane, gate (canopy, kiosks, barriers, OCR, weighbridge), reefer rack, light mast, office, mooring lines |
| `sims/port-shared/world.js` | Layout and the timetable `T`, every path, `pose(t)`, the bodies for the collision sweep |
| `sims/port-shared/film.js` | Camera keys, clicks, the product UI, the free camera (live mode) |
| `sims/port-shared/capture/*.json` | Saved camera configs for stills (`--config`); `truck-*.json` frame the red cab on `port-bench` |
| `sims/port-film/` | The film's entry |
| `sims/port-look/` | The world without UI, free camera |
| `sims/port-lookv2/` + `sims/port-shared/map2.js` | The new v3 port map in 3D (headland, three finger piers, city bay, breakwater, water areas, zones, central rail depot) laid out from `reports/img/denah_v3.svg` (1 plan px = 6 m, `P(px, py)`), with ships at their berths; free camera, a list of areas, L for labels |
| `sims/port-collide/` | Collision sweep (movers vs movers and vs every static box) |
| `sims/port-bench/` | Every model side by side, with a free camera and a list that jumps from model to model |
| `sims/run-collide.mjs` | Runs a `*-collide` page headless and prints the hits |

The look is the toy style of the kit (bevelled, matte, pastel); it stays the basis of the project.

Changes to the shared kit: `airport-shared/gse.js` exports its geometry helpers; `airport-shared/select.js` draws the
route ribbon double-sided (it was culled from above).

## Setup on a new machine

```
npm install && npx playwright install chromium
```

Node.js 20+. For video: `ffmpeg` on PATH (Windows: `winget install Gyan.FFmpeg`, then open a new terminal).
Python 3 is only needed for the sound scripts (not used for Portline yet).

## The water

`WATER` (infra.js) is the surface, 4.2 m under the quay top. The container ship keeps the height the film was timed at
(`SHIP_Y` in world.js), so it rides 1.6 m light and shows its red; the tugs and the pilot boat sit on the water. The
water is layered: an opaque floor 5 m down, three tinted layers, a half-clear surface, so hulls fade bluer with depth;
two dash layers drift with t (`quay.tick(t)`). `buildWaterline(ship, {y, wake})` in ships.js lays the foam round a hull
at its real waterline (y in the ship's frame, -ride for a ship riding light) and a wake behind craft under way. The
foam carries `isLine2` so GTAO leaves it out (it would darken it). On port-look each anchored ship has its own load
condition (`ride`): a laden tanker shows a sliver of red, a bulk carrier in ballast half its bottom.

The bulbous bow is a body of its own in `hullForm`, sized with Kracht's coefficients (model-basin statistics): `bulb`
= C_LPR, its protrusion past the forward perpendicular over L (real ships 0.018-0.031); `bulbB` = C_BB, its breadth over
B (0.17-0.20); `bulbZ` = C_ZB, the height of its tip above the keel over T (0.35-0.55). Its section is an upright oval,
round on top, a soft V below, with a round nose and a fillet (the neck) into the stem. Each ship sets its own; the
section at the forward perpendicular comes out at 8.5-10% of the midship section (real: cargo 7-10%, bulk 9-12%,
tanker 10-14%). The top sits 0.2 T under the design waterline, so a ship in ballast shows it.

## Revising the props

Revise on `port-bench`, check in place on `port-look`; leave `port-film` alone while the story is on hold.

1. Change a model in `sims/port-shared/` (`ships.js`, `vehicles.js`, `infra.js`).
2. `npm run props` builds `port-bench`, `port-look` and `port-lookv2` together.
3. `port-bench.html`: every model on its own, close up (the list on the right, W for the waterline). The Tweakpane
   panel on the left: jump to a model, lift or float the ships; **Hull** picks a vessel and reshapes its hull form with
   sliders (bow, stern, rake, bulb, bulbB, bulbZ, flare, entry, sheer, sheerLen, bilge, transom, rise; rebuilt when a slider is let go),
   **Copy for ships.js** puts the numbers on the clipboard to paste into that builder's `hullForm({...})`, **Reset to
   design** goes back; **Camera** has the FOV and **Copy capture config** (JSON for `--config`); **Render** toggles
   GTAO and sets the exposure. Every ship builder takes `hull: {...}` overrides for this.
4. `port-look.html`: the same builders in the world at its real scale, with the water, the quay and the cranes. The
   ships the film doesn't use yet ride at an anchorage on this page only (key 6); `world.js` and the film stay as they
   are.
5. `node sims/run-collide.mjs port-collide` after a change to anything that moves or stands on the terminal.

## Commands

```
node sims/build.mjs port-film port-look port-collide        # build the pages into simulator-out/dist
node sims/run-collide.mjs port-collide                      # collision sweep: should print "no collisions"
node sims/capture.mjs port-film --size 1600x900 --dpr 1 --still 33 --out simulator-out/s.png
node sims/capture.mjs port-look --size 1600x900 --dpr 1 --still 34.4 --config sims/port-shared/capture/rs-pm.json --out simulator-out/c.png
node sims/capture.mjs port-film --size 1600x900 --dpr 1.2 --out simulator-out/portline-film.mp4   # ~2.5 min
```

Open `simulator-out/dist/port-film.html` or `port-look.html` in a browser for the live animation. Mouse: drag orbit,
right-drag pan, wheel zoom; keys 1 Berth, 2 Yard B3, 3 Gate 2, 4 Reefer, 5 overview, 6 anchorage (port-look), C back; space pause, ←/→ seek.
`port-bench.html` (build it with `node sims/build.mjs port-bench`): the same mouse, plus the list on the right or `[` `]`
to jump from model to model (the viewing angle stays), 0 overview, C back to the configured camera, W puts the ships
on their waterline (by default they stand lifted out of it, keel on the lot, to show the whole hull). A new model goes on
the bench in `main.js` and gets a line in `SPOTS` there.

After changing code: build again and refresh. The MP4 only changes when it is captured again.

## Status and next steps

- The MP4 rendered last predates the red cab swap: capture it again.
- No sound for Portline yet (needs Python 3 and a `score.py` like the other systems).
- Ideas discussed: a reference-driven pass on proportions (STS crane, reach stacker, RTG spec sheets), a Tanjung Priok
  layout (one terminal in detail, the rest of the port as a simple backdrop).
- The collision sweep uses whole-body boxes: a tall cab over a low chassis can report a contact that is not there.
  Check such pairs on a close-up (`port-look` + a capture config) before adding them to the allowed list.
