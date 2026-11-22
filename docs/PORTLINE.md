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
| `sims/port-shared/vehicles.js` | Machines: 40/20 ft box (+ reefer), instanced stacks, terminal tractor + chassis, two road tractors (`buildToyPrimeMover` white/teal, `buildToyRedCabTractor` red), skeletal trailer, reach stacker, straddle carrier, empty handler, RTG, tugboat, pilot boat |
| `sims/port-shared/infra.js` | Quay + water + bollards + fenders + crane rails, STS quay crane, container ship, gate (canopy, kiosks, barriers, OCR, weighbridge), reefer rack, light mast, office, mooring lines |
| `sims/port-shared/world.js` | Layout and the timetable `T`, every path, `pose(t)`, the bodies for the collision sweep |
| `sims/port-shared/film.js` | Camera keys, clicks, the product UI, the free camera (live mode) |
| `sims/port-shared/capture/*.json` | Saved camera configs for stills (`--config`) |
| `sims/port-film/` | The film's entry |
| `sims/port-look/` | The world without UI, free camera |
| `sims/port-collide/` | Collision sweep (movers vs movers and vs every static box) |
| `sims/port-bench/` | Every model side by side |
| `sims/port-truck-preview/` | One object: the red cab on its trailer |
| `sims/port-style/` | The same port in 9 looks (`{"style": "lowpoly"}` … `blueprint`, `twin`, `semireal`, `cel`, `mono`, `voxel`, `map2d`, `diorama`) |
| `sims/run-collide.mjs` | Runs a `*-collide` page headless and prints the hits |
| `sims/style-sheet.mjs` | Lays the style stills out as one comparison sheet |

Changes to the shared kit: `airport-shared/gse.js` exports its geometry helpers; `airport-shared/select.js` draws the
route ribbon double-sided (it was culled from above).

## Setup on a new machine

```
npm install && npx playwright install chromium
```

Node.js 20+. For video: `ffmpeg` on PATH (Windows: `winget install Gyan.FFmpeg`, then open a new terminal).
Python 3 is only needed for the sound scripts (not used for Portline yet).

## Commands

```
node sims/build.mjs port-film port-look port-collide        # build the pages into simulator-out/dist
node sims/run-collide.mjs port-collide                      # collision sweep: should print "no collisions"
node sims/capture.mjs port-film --size 1600x900 --dpr 1 --still 33 --out simulator-out/s.png
node sims/capture.mjs port-look --size 1600x900 --dpr 1 --still 34.4 --config sims/port-shared/capture/rs-pm.json --out simulator-out/c.png
node sims/capture.mjs port-film --size 1600x900 --dpr 1.2 --out simulator-out/portline-film.mp4   # ~2.5 min
```

Open `simulator-out/dist/port-film.html` or `port-look.html` in a browser for the live animation. Mouse: drag orbit,
right-drag pan, wheel zoom; keys 1 Berth, 2 Yard B3, 3 Gate 2, 4 Reefer, 5 overview, C back; space pause, ←/→ seek.

After changing code: build again and refresh. The MP4 only changes when it is captured again.

## Status and next steps

- The MP4 rendered last predates the red cab swap: capture it again.
- `port-bench` has no free camera yet.
- No sound for Portline yet (needs Python 3 and a `score.py` like the other systems).
- Ideas discussed: a reference-driven pass on proportions (STS crane, reach stacker, RTG spec sheets), a Tanjung Priok
  layout (one terminal in detail, the rest of the port as a simple backdrop), and applying one of the `port-style` looks.
- The collision sweep uses whole-body boxes: a tall cab over a low chassis can report a contact that is not there.
  Check such pairs on a close-up (`port-look` + a capture config) before adding them to the allowed list.
