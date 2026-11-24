# Dry bulk, liquid bulk and gas (LNG/LPG) terminals: berth forms, equipment, storage, safety rules and layout (for a 3D port simulator)

Context for the report writer: the simulator already has an oil tanker (230 m), a Moss LNG carrier (260 m) and a bulk carrier (190 m). None of the terminal equipment, jetties or storage exists yet. Unless a line says "trivially derived", every item below has to be built. Values in **Inferences** that have no citation are typical engineering figures from general practice. They are not verified in this research session, so treat them as modelling defaults, not as cited facts.

## Dry bulk: berths, handling equipment, conveyors, stockyards, silos and vessel sizes

### Takeaway
Dry bulk terminals split into two kinds:
- **Import berths** use rail-mounted grab unloaders (400-2,500 t/h) or continuous or screw unloaders that feed a quay conveyor.
- **Export berths** use travelling or radial shiploaders (up to about 10,000 t/h for ore) fed by long belt conveyors from a stockyard.

In the stockyard, rail-mounted stacker-reclaimers with booms of about 35-65 m build piles roughly 50 m wide and 14-21 m high. A 190 m model ship is in the Handymax/Supramax class. Panamax ships go up to 294 m × 32.3 m × 12 m draft, and Capesize ships are 100-200k+ DWT, up to about 300 m and 50 m beam.

### Cited Findings
**Vessel classes (bulk carriers)**
- Handysize: 10,000-35,000 DWT. Handymax: 35,000-59,000 DWT, typically 150-200 m long, usually 5 holds and 4 cranes. Panamax: 60,000-80,000 DWT, up to 294.13 m LOA, 32.31 m beam and 12.04 m draft (Panama lock limits). Kamsarmax: max 229 m. Capesize: 80,000+ DWT. Newcastlemax: about 185,000 DWT, max 300 m LOA, max 50 m beam. VLOC/VLBC: over 200,000 DWT — [Wikipedia: Bulk carrier](https://en.wikipedia.org/wiki/Bulk_carrier)
- Clarksons gives Handymax as 150-200 m long, 30-32 m wide, 10-12 m draft and 35-50k DWT. It gives Panamax as about 294 m, 32.3 m and 12 m, at 65-80k DWT. Its largest class (Chinamax/Valemax type) is 360 m long, 65 m wide and up to 400k DWT — [Clarksons guide to bulk vessel sizes](https://www.clarksons.com/home/glossary/v/a-guide-to-bulk-vessel-sizes/)
- A UNCTAD-based table gives Handysize as 10-40k DWT and under 160 m, and Capesize as 100-200k DWT and under 310 m — [Port Economics Management: Bulk ship classes](https://porteconomicsmanagement.org/bulk-ship-classes/)
- Geared bulk carriers (mostly Handysize to Handymax) carry their own cranes. Gearless ships, VLOCs included, depend on shore equipment — [Wikipedia: Bulk carrier](https://en.wikipedia.org/wiki/Bulk_carrier)

**Grab ship unloaders (import, rail-mounted)**
- TAKRAF grab unloaders cover 400-2,500 t/h for ships of 10,000-350,000 DWT:
  - Rope-trolley type (GSU): rail gauge 7-28 m.
  - Trolley-mounted winch type (GVB): rail gauge 30-90 m, seaside reach up to 50 m.
  - [TAKRAF ship unloaders](https://www.takraf.com/product/ship-unloaders/); [DirectIndustry TAKRAF listing](https://directindustry.com/prod/takraf/product-58547-505747.html)
- Konecranes AGD grab unloader models have outreaches of 30-33 m, 37-42 m and 40-50 m, with rail spans of 11-20 m and 16-30 m — [Konecranes AGD brochure](https://lamong.konecranes.com/sites/default/files/2018-11/agdgrabunloader_0.pdf)
- Weihua's bridge-type grab unloader handles 400-2,500 t/h for ships of 3,000-250,000 t — [Weihua](https://weihuacraneglobal.com/product/Bridge-type-Grab-Ship-Unloader.html)
- Grab buckets hold 6-40 t, and a gantry crane's grab cycle takes about 50 s. Double-articulation cranes reach about 1,000 t/h and shore gantries about 2,000 t/h — [Wikipedia: Bulk carrier](https://en.wikipedia.org/wiki/Bulk_carrier)

**Continuous / screw unloaders**
- A Bruks Siwertell 3,000 t/h screw unloader is designed for ships up to 230,000 DWT or 50 m beam, and generally serves 100-200k DWT ships — [Bruks Siwertell stationary & rail-mounted unloaders](https://bruks-siwertell.com/ship-unloading/stationary-and-rail-mounted-unloaders)

**Shiploaders (export)**
- A thyssenkrupp 10,000 t/h iron ore shiploader in Liberia, for ships up to 90,000 DWT, is a coordinate type with a luffing and shuttling boom. Its land-to-water rail gauge is about 30 m, and it uses a curved chute. thyssenkrupp's 8,000 t/h long-travelling shiploaders at Qinhuangdao have a 21 m rail gauge, 19 m corner base and a luffing boom with a shuttle head, so they can load ships on both sides of the jetty — [thyssenkrupp Qinhuangdao shiploader PDF](https://ucpcdn.thyssenkrupp.com/_legacy/UCPthyssenkruppBAIS/assets.files/products___services/mining_systems/materials_handling/shiploaders/shiploader-qinhuangdao_koordinaten.pdf); [Dry Cargo: shiploader design](https://www.drycargomag.com/lightening-the-load-–-ever-improving-technologies-simplify-the-shiploading-process)
- Shuttling the whole boom on a bridge clears the berth but needs a large rail gauge. A narrower gauge suits about 6,000-8,000 t/h. For ore at dual-sided wharves, long-travelling slewing shiploaders without a telescopic chute are common — [Dry Cargo: shiploader design](https://www.drycargomag.com/lightening-the-load-–-ever-improving-technologies-simplify-the-shiploading-process)

**Stacker-reclaimers and stockyard**
- A TAKRAF boom stacker-reclaimer of 3,500 t/h has a 47.5 m boom, a total height of 28.5 m above the rail and a 10 m rail gauge — [DirectIndustry TAKRAF Ks-S 3500](https://directindustry.com/prod/takraf/product-58547-1519895.html)
- A TAKRAF stacker with a 50 m boom serves a 56 m wide stockpile on an 820 m track — [TAKRAF stacker catalog](https://pdf.directindustry.com/pdf/takraf/stacker-as-g-525050/58547-220815.html)
- A German power plant stacker has a 38.5 m boom and a 21 m hard-coal pile. One slewing unit stacks to 14 m. Tenova lists booms of 25-60 m — [BSH 1993 bulk-online](https://www.bulk-online.com/sites/default/files/public/2024-01/BSH_1993_03_004.pdf); [Tenova technical data](https://tenova.com/node/536)
- At one Kawasaki low-lying yard, the yard ground sat 5 m below the top of the travelling rail — [Kawasaki technical review](https://global.kawasaki.com/en/corp/rd/magazine/176/pdf/n176en13.pdf)

### Inferences
- **Berth layout (unsourced typical values):**
  - **Import berth:** a solid quay or open piled deck, 250-350 m long for Capesize, with 2-3 grab unloaders on the same rails and a quay conveyor running in the unloader portal or behind it. Water depth alongside is about 1.1-1.15 × draft: roughly 12-13 m for Handymax, about 14 m for Panamax and 18-20 m+ for Capesize. Capesize design draft is about 17-18 m, but that figure was not found in a cited source.
  - **Export berth:** often a trestle with a conveyor gallery out to an open jetty (deck plus breasting/mooring dolphins). One travelling shiploader runs on rails on the jetty, or a radial or linear quadrant loader pivots on a fixed point.
- **Model kit to build:**
  - Grab unloader (portal 15-30 m gauge, boom 40-50 m outreach, machinery house, hopper inside the portal).
  - Continuous unloader (vertical screw or bucket elevator arm on a slewing portal).
  - Mobile harbour crane with grab, travelling shiploader, and radial/quadrant shiploader.
  - Belt conveyor gallery (closed truss about 3-4 m wide on trestles) and transfer towers (boxy steel towers at changes of direction, about 15-30 m high).
  - Stacker-reclaimer on rails between two windrow stockpiles.
  - Stockpiles: triangular prisms about 50 m wide, 14-21 m high and hundreds of metres long.
  - Truck loadout hopper, rail loadout silo spanning a track, wagon tippler (rotary drum around a single wagon) with an underground hopper.
  - Silos (grain or cement, cylindrical batteries) and domes (geodesic, for clinker or coal).
- **Trivially derived:** pile geometry follows from the angle of repose (about 35-38° for coal or ore), so height is about 0.37 × width for a triangular windrow. The 56 m width / 21 m height pairing found above fits this.
- **Scale:** the 190 m model ship corresponds to Handymax/Supramax. A Capesize would be about 1.5× longer.

### Gaps
- No cited source gave water depth alongside for each bulk class (PIANC or OCIMF style tables), Capesize beam/draft (only Newcastlemax 50 m beam), or Supramax, Ultramax or Kamsarmax beam/draft.
- No cited dimensions were found for wagon tipplers, transfer towers, conveyor gallery widths, grain silo or dome diameters, or cement and clinker domes.
- No source covered radial shiploader dimensions or mobile harbour crane specs (for example Liebherr LHM outreach and grab tonnage).
- No source gave import vs export berth lengths for each class.

## Liquid bulk (crude, products, chemicals): jetty layout, loading equipment, mooring, fire protection and tank farm

### Takeaway
Oil and chemical berths are usually open jetties:
- A **trestle** carries a road and pipe rack out to a **loading platform** (the jetty head). The platform holds the loading arms, a gangway tower, fire monitors and a control room.
- **Breasting dolphins** take berthing loads near the parallel body of the ship.
- **Mooring dolphins**, linked by catwalks, hold the head, stern and breast lines on quick release hooks.

Spacing scales with the ship's LOA. VLCCs often use offshore SPMs or sea islands instead of a jetty. Tank farm insurer best practice:
- Each tank in its own bund sized for 110% of the tank's capacity.
- Spacing between tanks of at least 1 diameter of the largest tank, and at least 15 m, for non-crude.
- 5 diameters for crude oil tanks, because of boilover risk.

NFPA 30 allows closer spacing: 1/6 of the sum of the adjacent tank diameters for floating-roof tanks up to 150 ft (45 m) diameter.

### Cited Findings
**Vessel classes (tankers)**
- AFRA scale by DWT:

  | Class | DWT |
  |---|---|
  | General Purpose | 10,000-24,999 |
  | MR | 25,000-44,999 |
  | LR1 | 45,000-79,999 |
  | LR2 | 80,000-159,999 |
  | VLCC | 160,000-319,999 |
  | ULCC | 320,000-549,999 |

  Market scale: Aframax 80-120k DWT, Suezmax 120-200k DWT, VLCC 200-320k DWT. Supertankers can load at offshore platforms and single-point moorings (SPMs), or at buoys with underwater hoses. Large tankers often lighter offshore. One VLCC cargo pump moves about 5,000 m³/h — [Wikipedia: Oil tanker](https://en.wikipedia.org/wiki/Oil_tanker)
- VLCC: about 330 m LOA, 55 m beam, about 28 m draft, with most ships 300-330 m — [Port Economics Management: tanker size](https://porteconomicsmanagement.org/tanker-size/). Conflict: the 28 m draft looks high. Laden VLCCs are commonly quoted at about 20-23 m, and a Kuwaiti source gives a 20 m draft for a Malaccamax design — [KOTC knowledge centre](https://www.kotc.com.kw/FleetDev/Pages/KnowledgeCentre.aspx). Treat VLCC draft as uncertain.
- Suezmax: about 275 m long, 120-200k DWT, typical beam 50 m — [Wikipedia Tanker (ship)](https://en.Wikipedia.com/wiki/Tankship); [EIA](https://www.eia.gov/todayinenergy/detail.php?id=17991)

**Jetty and dolphin layout rules**
- Distance between breasting dolphins: 0.25-0.4 × LOA of the smallest ship for the inner pair, and 0.25-0.4 × LOA of the largest ship for the outer pair. Distance from mooring dolphin to breasting dolphin = 0.5 × (LOA − breasting dolphin spacing). This comes from a 13,470 DWT liquid berth design on the Caspian Sea — [E3S Conf. ISSAT 2024, 03006](https://www.e3s-conferences.org/articles/e3sconf/pdf/2024/09/e3sconf_issat2024_03006.pdf)
- The wider the range of ship sizes, the more mooring dolphins are needed and the costlier the jetty. The ship's manifold position can govern mooring dolphin spacing — [Indian Infrastructure: LNG terminals design factors](https://indianinfrastructure.com/2016/02/14/lng-terminals/)
- Local safety zone example: Port of Vaasa keeps a 30 m safety area around a tanker moored at the quay during loading and unloading — [Kvarken Ports safety instructions 2024](https://kvarkenports.com/download/18.746961ab192b2b4051a5d97/1729851951668/Safety%20instructions%202024.pdf)
- When passing ships come closer, the hydrodynamic forces on moored ships rise. This supports placing tanker berths away from fairways — [West of England P&I safety alert](https://www.westpandi.com/globalassets/loss-prevention/loss-prevention-safety-alerts/west-of-england---loss-prevention-safety-alert----interaction-damage-to-vessels-moored-alongside.pdf)

**Tank farm: spacing, bunds and fire protection (Marsh 2015 Risk Engineering Position Paper 01, "very good" criteria — insurer best practice, not a code)**
- All tanks bunded separately and sized for 110% of capacity. Bund walls designed to prevent overtopping, with possible tertiary containment.
- Spacing between non-crude tanks of at least 1 diameter of the largest tank, and at least 15 m. Crude oil tanks separated by 5 tank diameters to prevent boilover risk.
- Buried common inlet/outlet pipework, and no equipment inside the bund.
- Bund walls built as concrete-faced earth walls with no penetrations. The bund floor is impermeable and graded to a pump pit sump.
- **Floating roof:** multi-head foam pourers with a foam dam, shell cooling water spray (or multiple monitors), and foam for the bund area, supplied from two separate locations.
- **Cone (fixed) roof:** subsurface foam injection, roof and shell cooling.
- **Cone roof with internal floater:** foam pourers.
- Bunds fitted with flammable gas detectors for low flash point products. Linear heat detection for rim seals.
- Source: [Marsh Risk Engineering Position Paper 01: Atmospheric Storage Tanks (2015)](https://www.marsh.com/content/dam/marsh/Documents/PDF/UK-en/Risk%20Engineering%20Position%20Paper%2001%20Atmospheric%20Storage%20Tanks%202015.pdf)
- The same Marsh paper notes that modern foam can flow more than 30 m on a roof, and advises against applying foam from remote monitors outside the bund on floating roofs — [Marsh 2015](https://www.marsh.com/content/dam/marsh/Documents/PDF/UK-en/Risk%20Engineering%20Position%20Paper%2001%20Atmospheric%20Storage%20Tanks%202015.pdf)
- The Marsh paper's incident list includes Antwerp 2005: a crude tank failed catastrophically, 26,000 t was released and the wave overtopped the bund wall. That is the reason for overtopping-resistant bund design — [Marsh 2015](https://www.marsh.com/content/dam/marsh/Documents/PDF/UK-en/Risk%20Engineering%20Position%20Paper%2001%20Atmospheric%20Storage%20Tanks%202015.pdf)
- NFPA 30 Table 22.4.2.1: shell-to-shell spacing for floating-roof tanks of 150 ft (about 45 m) diameter or less is 1/6 of the sum of the adjacent diameters. The rule for larger tanks was cut off in the source — [NFPA 30 tank storage workbook (slides)](https://www.slideshare.net/tamersafety/2011-0222nfpa30tankstorageworkbook)
- Another insurer benchmark sets a minimum of 10 m between floating-roof tanks up to 45 m diameter, and 15 m for tanks over 45 m, governed by the larger tank — [search summary of Marsh 2015](https://www.marsh.com/content/dam/marsh/Documents/PDF/UK-en/Risk%20Engineering%20Position%20Paper%2001%20Atmospheric%20Storage%20Tanks%202015.pdf). This was not confirmed in the extracted PDF text, which instead gives the "1 D / 15 m" criterion, so it may come from a different table.

### Inferences
- **Typical product jetty for an MR/LR tanker, about 180-250 m LOA (unsourced):**
  - Loading platform about 30-40 m × 20-30 m, with 2-4 loading arms of 8-12 in.
  - 2 breasting dolphins about 60-80 m apart (fits 0.25-0.4 × LOA).
  - 2-4 mooring dolphins set back 10-35 m behind the berthing line.
  - Steel catwalks linking the dolphins.
  - Depth about 12-15 m.
- **VLCC jetty (unsourced):** 16 in arms, 20-25 m+ depth, and breasting dolphins about 100-130 m apart.
- **Using the cited rule on the existing 230 m tanker model:**
  - Breasting dolphin spacing 0.25-0.4 × 230 m = 58-92 m.
  - Mooring dolphin offset 0.5 × (230 − 75) ≈ 78 m beyond each breasting dolphin.
  - So, for example, 4 mooring dolphins at about ±115 m and 2 breasting dolphins at about ±37 m from the manifold centre.
- **Pieces to build:**
  - Approach trestle (piled deck carrying a roadway and 2-4 tiers of pipe rack).
  - Loading platform with arms, a drip tray, a gangway tower (lattice tower with a slewing, luffing gangway) and a small control or operator house.
  - Elevated fire monitor towers (about 15-25 m, 2 on the platform).
  - Breasting dolphins (concrete cap on piles, with large cone or cell fenders on panels).
  - Mooring dolphins with 2-4-hook quick release hook units and capstans.
  - Steel truss catwalks between dolphins, and a jetty lighting mast.
  - Shore manifold and pump house.
  - Tank farm: floating-roof tanks for crude and gasoline, cone-roof tanks for diesel and fuel oil, small stainless or coated tanks for chemicals. Each sits inside an earth or concrete bund wall about 1-2 m high (unsourced), with foam pourer rings, spiral stairs and wind girders.
  - Flare only where vapour recovery is used, mainly at gas terminals.
- **Tank sizes (unsourced typical values):** crude floating-roof tanks of 60-100 m diameter and about 20-22 m shell height (about 50,000-160,000 m³). Product tanks of 20-50 m diameter and 15-20 m high.
- **SPM / sea island (VLCC):** a CALM buoy about 10-15 m in diameter with floating hoses and a subsea pipeline to shore, placed several km offshore in 25-30 m+ of water. Unsourced, apart from the Wikipedia statement that SPMs are used.

### Gaps
- No primary OCIMF MEG4 values were found (for example mooring layout angles: breast lines near 90°, springs within 10° of the ship's axis, hook SWL).
- No OCIMF loading-arm count by tanker size, no quick release hook specs for oil berths, and no PIANC WG 33/153 fender values.
- No cited numbers for typical tank diameters and heights for crude or products, bund wall height, or the number of tanks allowed per bund (NFPA 30 / EI Model Code 19).
- No cited water depth for MR, LR or VLCC berths. The VLCC draft figures conflict (20 m vs 28 m).
- ISGOTT 6 is paywalled, so no separation distances were extracted from it.

## LNG and LPG terminals: jetty design, loading arms, tanks, regasification, FSRU, boil-off, flare, spheres and bullets

### Takeaway
An LNG jetty follows the oil jetty pattern (trestle, loading platform, 4 breasting and 5 mooring dolphins), with these differences:
- Typically 3-5 cryogenic 16 in loading arms (liquid plus a vapour-return arm), spaced about 4 m apart.
- High-capacity quick release hooks of about 125 t.
- Water depth of about 14 m+ for carriers up to Q-Max (266k m³, 345 m × 53.8 m × 12 m draft).

Onshore, full containment tanks (9% Ni inner tank, prestressed concrete outer tank) hold 160,000-200,000 m³. Gate Rotterdam's 180,000 m³ net tanks are about 86 m in diameter and 40 m high at the wall, or 55 m at the dome crown. Regasification uses open rack vaporisers (seawater) or alternatives. An FSRU replaces the tanks and regas plant with a ship moored at a jetty, which sends gas ashore through high-pressure gas arms.

### Cited Findings
**LNG jetty**
- Hazira LNG jetty (Shell, India):
  - 3 unloading arms (2 liquid, 1 vapour), 16 in, ANSI 150, spaced 4 m apart.
  - 4 breasting dolphins and 5 mooring dolphins.
  - Mooring hooks rated 125 t.
  - [Shell Hazira LNG jetty description (via search snippet)](https://shell.in/shellenergy/hazira-port-pvt-ltd/information-for-ships/lng-jetty-description.html). The page body could not be fetched directly, so these figures come from the search index snippet.
- A Port Technology LNG jetty case uses 4 breasting and 5 mooring dolphins, a working envelope for 16 in × 75 ft unloading arms, and mooring dolphins offset 45 m to suit a breakwater — [Port Technology PT46-02](https://porttechnology.org/wp-content/uploads/2019/05/PT46-02.pdf)
- CSA SPE-276.1 covers the civil and structural design of LNG marine structures: access trestle, loading platform, berthing and mooring dolphins, and catwalks — [CSA Group](https://www.csagroup.org/store/product/2705048)

**Gate terminal, Rotterdam (reference import terminal)**
- 3 full containment tanks of 180,000 m³ net (200,000 m³ gross) each. Diameter about 86 m; height 40 m at the sides and 55 m at the centre (dome) — [Gate terminal facts & figures](https://www.gateterminal.com/en/gate-terminal/profiel/facts-figures/). Conflict: offshore-technology.com gives about 46 m — [Offshore Technology](https://www.offshore-technology.com/projects/gate-lng-terminal/)
- A fourth 180,000 m³ tank has been reported ready — [Hydrocarbon Engineering, 2026](https://www.hydrocarbonengineering.com/tanks-terminals/02102026/fourth-lng-tank-at-gate-terminal-ready/)
- 2 jetties for LNG carriers of 65,000-267,000 m³, with 14 m water depth alongside. 8 open rack vaporisers heated by warm cooling water from a neighbouring E.ON power plant. Send-out 12 bcm/yr, quoted as about 1.67 million Nm³/h — [Gate terminal facilities main characteristics](https://www.gateterminal.com/en/commercial/facilities-main-characteristics/)
- A third, small-scale berth (2016) handles ships of 1,000-20,000 m³. A fourth jetty for bunkering is due by the end of 2028 — [Gate terminal / Hydrocarbon Engineering 2016](https://www.hydrocarbonengineering.com/tanks-terminals/31082016/Gate-Terminal-expands-to-include-a-third-berth-3991); [Gate terminal](https://www.gateterminal.com/en/gate-terminal/)

**LNG storage tank construction**
- Full containment tank: 9% nickel steel inner tank, prestressed concrete outer tank, suspended ceiling deck, secondary bottom and corner protection, and bottom heating. One KOGAS design has an 84 m inner diameter and a design boil-off of 0.05 %vol/day. The largest onshore full containment tanks are 260,000 m³, in South Korea and Singapore. Large tank dimensions are partly driven by keeping boil-off below 0.05 %/day — [Wikipedia: LNG storage tank](https://en.wikipedia.com/wiki/LNG_storage_tank); [AIChE 2010 paper 120d](https://aiche.org/conferences/aiche-spring-meeting-and-global-congress-on-process-safety/2010/proceeding/paper/120d-design-feature-large-full-containment-lng-storage-tank-0)
- CNOOC Ningbo has 3 × 160,000 m³ full containment tanks — [Scribd reference sheet](https://www.scribd.com/document/422261277/Referencesheet-5059-pdf)

**LNG carriers**
- Q-Max: 266,000 m³ membrane type, 345 m LOA, 53.8 m beam, 34.7 m depth, about 12 m draft — [Wikipedia: Q-Max](https://en.wikipedia.org/wiki/Q-Max). Some sources give 354-355 m and 53-55 m beam — [Marine Insight](https://www.marineinsight.com/biggest-lng-carrier-operating-today/)
- A 174,000 m³ carrier example: 295 m LOA, 46 m beam, 11.4 m draft — [Marine Insight: biggest LNG ships](https://www.marineinsight.com/biggest-lng-ships/)

**FSRU / ship-to-ship**
- TechnipEnergies (ten.com) side-by-side loading arms for FSRU/FLNG operate in waves up to Hs 2.5 m. Its high-pressure natural gas (HPNG) arm is 12 in, rated ANSI 600 or ANSI 900 (vendor claim) — [TEN loading systems brochure](https://ten.com/sites/energies/files/2024-09/Loading-systems-brochure.pdf)
- FSRU discharge gas is typically at 40 barg or more, and up to about 100 barg — [US patent 11434732](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11434732)
- A side-by-side FSRU/LNGC concept uses a transverse mooring arm on the FSRU, with the carrier made fast by bow hawser, then stern line, then transfer connection — [US7793605B2](https://patents.google.com/patent/US7793605)

**LPG storage**
- A 3,000 m³ sphere is about 19 m in diameter; supplier listings give 1,500 t payload and 1.77 MPa design pressure — [CR4 forum](https://cr4.globalspec.com/thread/97667/LPG-Sphere-Thickness); [bestsuppliers listing](https://bestsuppliers.com/products/89rzgntynr3f/asme-code-3000-cubic-meters-1500-tons-liquefied-petroleum-gas-lpg-propane-sphere-spherical-storage-t). Trivially derived check: V = πD³/6 gives D ≈ 17.9 m for 3,000 m³.
- The largest LPG bullets reach about 7 m in diameter and 70 m+ in length. A 3,300 m³ bullet weighs 612 t empty and is designed for 19 barg. Spheres use less steel than bullets for the same volume but are harder to fabricate — [Chemical Engineering: primer on LPG storage](https://www.chemengonline.com/a-primer-on-lpg-storage-systems/); [epcland](https://epcland.com/?p=51331)

### Inferences
- **Model kit to build:**
  - LNG trestle and jetty head (about 40 × 30 m) with 4-5 tall cryogenic arms (about 20-25 m high when parked, counterweighted pantograph type, 16 in). Use Hazira's 4 m arm spacing.
  - Gangway tower, 2 fire monitor towers, water curtain, ESD/control house and a spill trough.
  - 4 breasting dolphins with large fenders and 5-6 mooring dolphins, using the same LOA rule as oil berths.
  - Onshore: 2-4 full containment tanks (about 80-90 m diameter, 40 m wall plus dome to about 55 m, concrete grey, with a roof platform and pump columns), plus BOG compressor building, recondenser column, high-pressure send-out pumps, an ORV rack (long low seawater-cascade units) or SCV units, a metering station, and an elevated flare stack (about 80-120 m, unsourced) or a ground flare.
  - LPG: a cluster of spheres on legs (about 15-20 m diameter) and/or horizontal bullets (3-7 m diameter, 30-70 m long) in small groups. Refrigerated LPG uses flat-bottom double-wall tanks that look like small LNG tanks.
- **Moss carrier:** the 260 m Moss carrier in the simulator is in the 125-180k m³ range. A berth for it needs breasting dolphins about 65-105 m apart (0.25-0.4 × 260 m) and about 12-14 m depth.
- **Trivially derived:** tank volume ≈ π/4 × D² × H_liquid. At 86 m diameter, about 31 m of liquid height gives 180,000 m³, which matches the Gate figures.
- **FSRU option:** a moored ship of about 280-295 m (170k m³ class) at a jetty with HP gas arms, so no onshore tanks are needed. The existing LNG carrier mesh could be reused with a regas module added on deck.

### Gaps
- No cited source gave LNG loading arm dimensions (height and reach envelope) beyond "16 in × 75 ft", BOG compressor or flare stack heights, ORV dimensions, or refrigerated LPG tank sizes.
- No cited typical FSRU regas rates. Emco Wheaton, KANON and FMC loading arm datasheets were not retrieved.

## Safety distances and zoning: why oil, LNG and LPG berths sit at the port edge

### Takeaway
None of the current codes give one universal distance. SIGTTO's 2024 GP266 (which replaces IP14 from 1997), ISGOTT 6, PIANC and NFPA 59A all require risk-based separation and hazard-zone analysis. Distances found in practice:
- 30 m safety areas around moored tankers (local rule, Vaasa).
- Insurer tank spacing of 1-5 diameters.
- Older LNG hazard-zone figures of up to 3.5 km.

All of these push hazardous liquid and gas berths to remote, often outer-harbour or outside-the-breakwater, sites away from fairways and populated areas.

### Cited Findings
- SIGTTO's *Liquefied Gas Terminals: Site Selection, Design and Operation of Marine Facilities* (2024, first edition) replaces *Site Selection and Design for LNG Ports and Jetties* (Information Paper No. 14, 1997). The text is paywalled, so no figures were retrieved — [SIGTTO publications](https://sigtto.org/publications/liquefied-gas-terminals-site-selection-design-and-operation-of-marine-facilities); [SIGTTO IP14](https://sigtto.org/publications/site-selection-design-ip-no-14-for-lng-ports-jetties)
- Marine terminals should stay well separated from other operations, with safety distances set by risk analysis — [OGJ: Terminal siting 1](https://ogj.com/pipelines-transportation/lng/article/17217868/terminal-siting1-setting-parameters-early-helps-focus-development)
- A 3,500 m (2.2 mile) largest hazard zone around an LNG vessel, presented as a minimum distance from civilians. This comes from an advocacy site citing an older (Sandia-type) standard, so it is low reliability — [Save Passamaquoddy Bay: LNG siting standards](https://savepassamaquoddybay.org/standards.html)
- HR Wallingford / PIANC (2008) covers safety distances between moored gas carriers and passing ships, but no figures were extracted (PDF not readable) — [HR Wallingford HRPP402](https://eprints.hrwallingford.com/644/1/HRPP402_Site_selection_and_planning_issues_for_new_LNG_marine_terminals.pdf)
- Local tanker rule: a 30 m safety area on land and water around a tanker moored at the quay during cargo operations — [Kvarken Ports 2024](https://kvarkenports.com/download/18.746961ab192b2b4051a5d97/1729851951668/Safety%20instructions%202024.pdf)
- US 33 CFR 150.340: a tanker may not enter a safety zone where another tanker is present unless cleared by the port's person in charge — [33 CFR 150.340](https://www.law.cornell.edu/cfr/text/33/150.340)
- When passing ships come closer, the hydrodynamic forces on moored ships rise — [West of England P&I](https://www.westpandi.com/globalassets/loss-prevention/loss-prevention-safety-alerts/west-of-england---loss-prevention-safety-alert----interaction-damage-to-vessels-moored-alongside.pdf)
- ISGOTT 6 is the standard reference for tanker and terminal safety. Section 24.3 covers LNG-fuelled ships and LNG bunkering — [Wikipedia: ISGOTT](https://wikipedia.com/wiki/International_Safety_Guide_for_Oil_Tankers_and_Terminals); [OCIMF ISGOTT 6](https://www.ocimf.org/isgott-6)
- Mooring dolphins at one LNG jetty were offset 45 m to suit a breakwater, which shows LNG jetties placed at breakwaters or the outer edge of a port — [Port Technology PT46-02](https://porttechnology.org/wp-content/uploads/2019/05/PT46-02.pdf)
- Tank farm separation inside the site: 1 D (at least 15 m) for non-crude tanks and 5 D for crude tanks (insurer best practice) — [Marsh 2015](https://www.marsh.com/content/dam/marsh/Documents/PDF/UK-en/Risk%20Engineering%20Position%20Paper%2001%20Atmospheric%20Storage%20Tanks%202015.pdf). NFPA 30 allows 1/6 of the sum of adjacent diameters for floating-roof tanks up to 45 m — [NFPA 30 workbook](https://www.slideshare.net/tamersafety/2011-0222nfpa30tankstorageworkbook)

### Inferences
- **Simulator zoning (port-planning rules of thumb, not cited):**
  - Place the LNG berth furthest out, at the end of a breakwater or on its own jetty in deep water. Keep a moving safety zone around transiting LNG carriers, and a large clear distance (hundreds of metres to over 1 km) from container and passenger berths and from towns.
  - Place crude/VLCC berths next, or offshore on an SPM.
  - Put product and chemical jetties in a separate basin from general cargo.
  - Keep dry bulk, coal especially, downwind of the city because of dust, but it needs no hazardous-area separation.
  - Run long trestles (hundreds of metres to 1-2 km) so hazardous berths sit in deep water away from the fairway. Space oil and LNG berths more widely along the shoreline than container berths.
- **Visual cues:** red or yellow exclusion buoys around gas jetties, a fence and security gate at the root of each trestle, and fire tug berths nearby.

### Gaps
- No numbers were obtained from NFPA 59A (LNG exclusion zones for thermal radiation and vapour dispersion), SIGTTO GP266/IP14, ISGOTT chapter 26 (terminal layout), PIANC WG 116/121/153 (passing distances), or OCIMF MEG4. The primary texts are paywalled, and the openly available PDFs (HR Wallingford) could not be text-extracted.
- No authoritative separation distance in metres was found between an LNG berth and other berths or passing ships. The 3.5 km figure is from an advocacy site and should not be used as a standard.
