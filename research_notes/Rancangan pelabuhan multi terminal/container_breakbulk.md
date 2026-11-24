# Container (LoLo) and Break Bulk / General / Project / Multipurpose Terminals: berths, equipment, buildings, layout (for 3D port-simulator modelling)

Scope note: research done Nov 2026 with ~16 tool calls. Manufacturer PDFs (Liebherr, Konecranes) were text-extracted locally. The Liebherr STS datasheet uses a remapped digit font; the numbers below were decoded by cross-checking against known values (e.g. "up to 13 rows" Panamax, "15-19 m" wheel gauge quoted by the search snippet, "40-59 m" lift height). The decoding is internally consistent, but treat it as "decoded, high confidence" rather than verbatim.

Simulator already has: STS crane, RTG, straddle carrier, reach stacker, empty handler, terminal tractor + chassis, prime mover + skeletal trailer, forklift, quay, gate, reefer rack, office, light mast, CFS. Items **NOT in that list are marked [NEW]**.

---

## 1. Container terminal: quay, berth, water depth, apron

### Takeaway
A container berth is a continuous straight quay wall (no piers or fingers in modern practice). It is sized at roughly ship LOA plus a margin: about 325 m for 8,000 TEU, 370 m for 12,500 TEU, about 450 m for 400 m ULCVs. Depth runs from about 13 m (post-Panamax) to 15-16 m+ (ULCV, draught about 16-17 m). The apron is the strip under the STS cranes between the quay edge and the stack.

### Cited Findings
- Berth length and draft by ship: 8,000 TEU post-Panamax needs about 325 m of dock and about 13 m (45 ft) draft. 12,500 TEU Neo-Panamax needs 370 m and 15.2 m (50 ft). A 400 m pier is "expected to be sufficient" for most containerships. The largest ships (LOA about 400 m) need a berth of about 450 m. — [Port Economics, Management & Policy, Ch. 6.5](https://porteconomicsmanagement.org/pemp/contents/part6/container-terminal-design-equipment/)
- The apron is the area directly next to the quay and under the gantry cranes. Straddle carriers or tractors move boxes between the cranes and storage here. — [PEMP Ch. 6.5](https://porteconomicsmanagement.org/pemp/contents/part6/container-terminal-design-equipment/)
- The TU Delft terminal design glossary defines the apron as the "area of the terminal between the quay and the container stacking area". A berth is a quay slot for mooring and servicing one vessel. — [TU Delft repository](https://repository.tudelft.nl/file/File_b786be9e-9839-4f23-a474-792f81219559)
- Rule of thumb for berth occupancy: about 40% acceptable for a single berth, about 80% for four berths. In other words, multi-berth continuous quays are more efficient. — [TU Delft port document](https://repository.tudelft.nl/file/File_0854266b-c089-4776-acf2-ce4b615f858d?preview=1)
- Adjacent STS cranes can work buffer-to-buffer, but booms must be spaced to avoid collision. — [TU Delft/PIANC-based report](https://repository.tudelft.nl/file/File_c8ffb2c9-4ffd-4968-a02e-02c9b97eb0b2)
- Example values from an MHC-vs-STS scenario comparison at equal throughput: apron areas of about 24,618 m² and 45,696 m², quay lengths of 373 m and 714 m (illustrative, not a standard). — [TU Delft course text via search](https://repository.tudelft.nl/file/File_c8ffb2c9-4ffd-4968-a02e-02c9b97eb0b2)
- ULCV design ship: MSC Irina (2023) is 399.99 m LOA, 61.3 m beam, 24,346 TEU. MSC Tessa has a 61.5 m beam. Reported draught conflicts (16.3 m vs "about 17 m"). — [gCaptain](https://gcaptain.com/chinese-shipyard-delivers-worlds-largest-containership-at-24346-teus); [Maritime Executive](https://maritime-executive.com/article/msc-receives-second-ultra-large-and-this-one-is-the-world-s-largest)
- Feeder example: about 1,000 TEU, 140 m long, 23 m wide (C. Steinweg Hamburg multipurpose terminal). — [Sellhorn/Fraunhofer CML "Optimized Modern Multi-Purpose Terminals", HPA 2017](https://www.iaphworldports.org/n-iaph/wp-content/uploads/2020/11/Multi-PurposeTerminals_Final_May-2017.pdf)
- A Wikipedia container port design article gives no berth/apron figures. It only notes that channels in NY/NJ were dredged to about 50 ft. — [Wikipedia: Container port design process](https://en.wikipedia.org/wiki/Container_port_design_process)

### Inferences
- For a 200-400 m ship berth, model the quay as ship LOA + about 10-15% (e.g. 300 m ship → about 340 m; 400 m → about 450 m), which matches the PEMP figures. Multi-berth terminals are one long continuous wall that is subdivided virtually.
- Apron width (not found in cited sources): it must at least hold the STS rail gauge (about 30-35 m, see section 2), a waterside strip from the quay edge to the seaside rail, and landside lanes/backreach (hatch-cover lay-down plus tractor lanes). A modelling value of about 50-70 m quay-edge-to-stack is a reasonable working assumption. It is NOT sourced; verify against PIANC/Thoresen.
- Vessel classes for the model, ordered small to large: feeder (about 140 m / 1,000 TEU) → Panamax (13 rows across, per crane classes) → post-Panamax 8,000 TEU (about 300-325 m) → Neo-Panamax 12,500 TEU (about 366-370 m) → ULCV 24,000 TEU (400 m × 61.3 m).

### Gaps
- No sourced numeric apron width, quay-edge-to-seaside-rail distance, or deck/cope level found. The PIANC WG 158 / TU Delft "Ports and Terminals" PDF (books.open.tudelft.nl) was too large to fetch (>10 MB).
- No primary source for ULCV draught (Lloyd's/DNV register) checked.
- Quay wall structural forms (caisson, sheet pile combi-wall, deck on piles) were not researched with sources. Visually they all present as a vertical cope edge with fenders and bollards. Fenders, bollards and cope edge would be **[NEW]** detail props.

---

## 2. STS (ship-to-shore) crane dimensions by class

### Takeaway
Rail gauge is typically about 30 m (100 ft / 30.48 m is the classic gauge; Konecranes Monobox 30 m, Doublebox 35.5 m). Outreach grows from about 38 m (Panamax, 13 rows) to 65-75 m (Megamax, 23-25 rows). Lift height above rail grows from about 30 m to 52-59 m.

### Cited Findings
- Liebherr STS datasheet (2026 v2, decoded), by class Panamax / Post-Panamax / Super Post-Panamax / Megamax / Dual-trolley:
  - Gantry span 15-35 m for all classes (dual trolley 30-45 m).
  - Outreach: up to 38 m / up to 45 m / up to 55 m / above 53 m [sic] / 60-75 m.
  - Containers across deck: up to 13 / up to 16 / up to 19 / 20+ / 20-25.
  - Backreach 0-25 m (dual trolley 20-35 m).
  - Lift height 30 m / 35 m / 40 m / 45 m+ / 40-59 m.
  - Clearance under sill beam 12-18 m. Travel wheel gauge 15-19 m. Buffer-to-buffer 27-36 m.
  - SWL 40-50 t single, 65 t twin. Tandem 65-80 t (super post-Panamax) and 80-85 t (Megamax).
  - Hoist speed 50/125 to 80/180 m/min. Trolley speed 150-240 m/min. Gantry travel 45 m/min.
  - Wheel loads 30-45 t/m (Panamax) up to 65-120 t/m (Megamax). 6-16 wheels per corner. Max trolley/boom width 7.6 m.
  - [Liebherr STS datasheet 2026](https://www-assets.liebherr.com/media/bu-media/lhbu-mcc/downloads-und-brosch%C3%BCren-neu/brosch%C3%BCren/container-cranes-(lcc)/mcc_ship_to_shore_cranes_sts/liebherr-port-equipment-sts-datasheet-2026-v2.pdf)
- Konecranes STS Monobox: rail span 30.0 m (Doublebox 35.5 m). Lift height above waterside rail to the bottom of the spreader is 52.5 m (Doublebox 57.5 m). Outreach from the waterside rail is 65.0 m. — [Konecranes STS Monobox tech doc](https://www.konecranes.com/system/files/2024-04/7593_sts_monobox_technical_doc_v2.pdf)
- Konecranes brochure: span 19.5-30.5 m, lift height above rail 40.0-52.5 m. — [Konecranes STS brochure 2019](https://lamong.konecranes.com/sites/default/files/2021-02/Konecranes_brochure_STS_EN_2019_FINAL.pdf)
- Wikipedia figures:
  - Panamax cranes are up to 13 stacks wide (5 high on deck). Most use a 100 ft (about 30.5 m) gauge.
  - Post-Panamax cranes are up to 16 wide (6 high on deck) and weigh about 800-900 t.
  - Super-post-Panamax cranes reach up to 26 wide (8-9 high on deck) and weigh 1,600-2,000 t, rated typically 65 t and some 120 t.
  - Early cranes had 12-16 m gauge.
  - [Wikipedia: Container crane](https://en.wikipedia.org/wiki/Container_crane)
- PEMP lists rows by class as Panamax 13, Post-Panamax 16, Ultra-Post-Panamax 24. An STS does about one move every two minutes (conventional). — [PEMP Ch. 6.5](https://porteconomicsmanagement.org/pemp/contents/part6/container-terminal-design-equipment/)
- Sany STS range: outreach 25-70 m, hoist height 10-45 m above rail. — [Sany](https://www.sany.in/?p=4157)

### Inferences
- Default modelling set for a 200-400 m ship berth:
  - Rail gauge 30.48 m.
  - Outreach 50-55 m (19-21 rows) for post-Panamax ships of about 300 m; 65-70 m (23-25 rows) for ULCV.
  - Lift height 40-52 m.
  - Backreach 15-25 m.
  - Buffer-to-buffer width (along quay) about 27 m. This sets the minimum crane spacing, so about 4-6 cranes for a 300 m ship and 6-8 for a 400 m ship.
- The boom is raised (luffed up, roughly 80°) when parked or when the ship berths. The trolley runs along the boom. The gantry travels along the quay rails at about 45 m/min.

### Gaps
- Dual-trolley (with lashing platform) cranes are a distinct visual variant used at automated terminals. Detail dimensions were not verified beyond the Liebherr row.

---

## 3. Yard systems compared (RTG, RMG/ASC, straddle carrier, reach stacker, AGV, terminal tractor)

### Takeaway
Density rises in this order: reach stacker (about 500 TEU/ha, 3 high) → straddle carrier (500-700 TEU/ha, 1-over-2 / 1-over-3) → RTG (about 900-1,100 TEU/ha, 1-over-5, 6 rows + truck lane) → RMG/ASC (>1,000-1,200+ TEU/ha, 8-10 wide). RTG blocks run parallel to the quay. Straddle, wide-span gantry and automated ASC blocks run perpendicular to it.

### Cited Findings
- **RTG (Konecranes):**
  - Typical spans: 20.8 m (5 rows + lane), 23.6 m (6 + lane), 26.4 m (7 + lane), 29.2 m (8 + lane).
  - Lifting heights: 12.34 m (1-over-3), 15.24 m (1-over-4), 18.1 m (1-over-5), 21.0 m (1-over-6).
  - Total weights 64.8-82.3 t. 16-wheel or 8-wheel bogie versions; max wheel load about 18 t (16W) / 31.5 t (8W).
  - Power options: diesel, hybrid, busbar, cable reel, battery.
  - [Konecranes RTG technical document v7 (2024)](https://konecranes.com/sites/default/files/2024-11/7681_rtg_technical_document_v7.pdf)
- RTG (Konecranes Noell): spans 23.47 m and 26.50 m for 6 and 7 rows + truck lane. Hoist heights 18.1 m / 21 m for 1-over-5 / 1-over-6 high-cube stacking. — [Konecranes RTG page](https://d7.konecranes.com/node/276451)
- RTG (Liebherr): typical spans 20.8 m (5 + lane), 23.6 m (6 + lane), 26.5 m (7 + lane). Lift heights 18.2 m (1-over-5), 21 m (1-over-6). — [Liebherr RTG technical description](https://www-assets.liebherr.com/media/bu-media/lhbu-mcc/downloads-and-brochures/brochures/lcc/liebherr-rtg-cranes-technical-description.pdf)
- RTG stacks 5 full (1-over-4) or 6 empty, up to about 1,000 TEU/ha, and spans up to 6 containers. RMG (stacking only) stacks 4 full / 5 empty at >1,000 TEU/ha and spans 6-10 tracks / 8-12 containers. Reach stacker: 3 full (4-5 empty), 3 rows deep, about 500 TEU/ha. Straddle carrier: 3-high or 4-high, 500-700 TEU/ha. Front-end loader / empty handler: up to 8 empties high. — [PEMP Ch. 6.5](https://porteconomicsmanagement.org/pemp/contents/part6/container-terminal-design-equipment/); [PEMP stacking density](https://porteconomicsmanagement.org/pemp/contents/part6/container-terminal-design-equipment/stacking-density-container-yard-equipment/)
- Simulation-study densities: straddle about 500-600 TEU/ha, RTG 900-1,100 TEU/ha, RMG >1,200 TEU/ha. — [TBA whitepaper](https://tba.group/insights/whitepapers/comparison-three-automated-stacking-alternatives-means-simulation)
- Vendor claim: 1-over-7, 8-wide automated RMG blocks exceed 1,400-1,600 TEU/ha (extreme case). — [Weihua blog](https://www.henanweihua.com/es/blog/sts-crane-vs-rtg-vs-rmg/)
- **Block orientation:** conventional RTG blocks run parallel to the quay. Wide-span gantry or straddle carrier blocks run perpendicular. Automated ASC blocks run perpendicular, which separates gate-side trucks from quay-side AGVs/straddles. — [PEMP Ch. 6.5](https://porteconomicsmanagement.org/pemp/contents/part6/container-terminal-design-equipment/)
- **ASC (automated RMG) [NEW]:** APMT Maasvlakte II blocks are 9 wide or 10 wide, 1-over-5 (Kuenz datasheet). The phase 2 cranes are 1-over-6. Phase 1 had 54 ASCs plus 2 intermodal cranes; phase 2 adds 62 ASCs plus 1 intermodal yard crane. There are 1-3 ASCs per block, with an AGV transfer zone at the seaside end. — [Kuenz at APMT MVII](https://www.porttechnology.org/wp-content/uploads/2020/08/Kuenz_at_APMT_Maasvlakte_II.pdf); [ABB news](https://new.abb.com/news/detail/113647/abb-and-kuenz-land-automatic-stacking-cranes-contract-for-apm-terminals-maasvlakte-ii-expansion); [academia.edu stack layout paper](https://www.academia.edu/170081186/Optimal_Stack_Layout_Configurations_at_Automated_Container_Terminals_Using_Queuing_Network_Models)
- **Straddle carrier:**
  - Konecranes Noell 3-high (1-over-2): lift height under twistlocks 9.1 m (4-high 12.0 m); overall height unloaded 12.5 m (4-high 15.7 m); overall width with front cab 4.87 m; inside clearance 3.47 m.
  - Kalmar electric: max lift 9,200 mm (SC340-360E), 12,000 mm (4-high SC440-460E); inside clear width 3,500 mm. 2-high shuttle carriers lift 6,300 mm.
  - [Konecranes SC tech doc](https://konecranes.com/system/files/2024-06/7583_konecranes_noell_straddle_carrier_technical_document_new_brand_v6.pdf); [Kalmar end-to-end SC datasheet](https://www.kalmarglobal.com/49d2cb/globalassets/media/317759/317759_Straddle-Carrier-for-end-to-end-operations-datasheet_web.pdf.pdf); [Kalmar shuttle SC datasheet](https://kalmarglobal.com/49d281/globalassets/media/317761/317761_Straddle-Carrier-for-shuttle-operations_web.pdf.pdf)
- **Reach stacker** (Kalmar DRG450, used-equipment listings): about 12.5-13.5 m long, 4.15-4.25 m wide, about 4.7 m high (mast down), 82-92 t. The Kalmar Essential DRU450 has a 6,250 mm wheelbase and stacks up to 6 high (empty) / 4 deep. — [Exapro listing](https://www.exapro.com/kalmar-drg450-75c5xs-p260323365/); [Kalmar Essential reachstacker](https://kalmarglobal.com/equipment/reachstackers/essential-reachstacker)
- **Terminal tractor** (Kalmar Ottawa T2):
  - 4x2 off-road wheelbase 116 in (about 2.95 m).
  - T2 EV wheelbase 126-136 in. A dealer listing for the CT150-60 gives overall length 201 in (about 5.1 m) and width 100 in (about 2.54 m).
  - Fifth-wheel lift is about 17 in.
  - [Kalmar Ottawa T2](https://www.kalmarottawa.com/terminal-tractors/ottawa-t2-4x2-offroad/); [T2 EV brochure](https://www.kalmarottawa.com/4994d3/globalassets/media/571466/571466_Kalmar-Ottawa-Electric-Terminal-Tractor-brochure.pdf.pdf); [RWC listing](https://www.rwcgroup.com/inventory/v1/Current/Kalmar-Ottawa/T2-EV-Electric-Terminal-Tractor/CT150-60--Phoenix-Arizona---24423631)
- Container reference size used in the RTG drawings: 2,438 mm wide, 2,896 mm (9'6") high cube. — [Konecranes RTG doc](https://konecranes.com/sites/default/files/2024-11/7681_rtg_technical_document_v7.pdf)

### Inferences
- **RTG block for modelling:** 6 rows (6 × 2.44 m plus gaps, about 16 m) plus a truck lane (about 4-5 m) inside a 23.5 m span, 1-over-5 stacking (5 high). Block length is typically 30-40 TEU slots (about 200-260 m). Lanes run between blocks for RTG travel and for turning tractors and trucks. The block length is NOT sourced; it is common practice and should be verified.
- **ASC block [NEW]:** 9-10 wide, 1-over-5/6, perpendicular to the quay. Waterside transfer (AGV/shuttle straddle) sits at the quay end and landside transfer (external trucks) at the gate end. External trucks never enter the quayside area.
- **Straddle yard:** single-file rows of boxes with straddle lanes between them, about 1.5-2 m clearance per leg side. The straddle runs over the row. Rows are perpendicular to the quay.
- **AGV [NEW]:** not sized from sources in this pass. Typical knowledge is about 15 m long × 3 m wide, carrying 1 FEU or 2 TEU, unmanned, on a transponder grid. It needs a source before use.

### Gaps
- AGV dimensions (Konecranes/ZPMC/VDL) were not retrieved.
- RMG for rail [NEW]: intermodal crane spans were not retrieved beyond "RMG spans 6-10 tracks / 8-12 containers" (PEMP).
- No sourced RTG block length or inter-block lane widths.

---

## 4. Terminal buildings, reefer, empty depot, CFS, gate, rail, workshop

### Takeaway
A full container terminal has an apron, then the stack, then a truck interchange at the landside block ends or a truck lane in the RTG blocks. Beyond that sit the gate complex (pre-gate parking, OCR portals, kiosks, scales, inspection/scanner lanes), the reefer area (about 5% of stack), the empty depot (8-high empties), the CFS, the M&R workshop, admin/amenity buildings and on-dock rail.

### Cited Findings
- Reefer areas average about 5% of the stacking area. Dwell time is typically 3-5 days. Yard divisions are inbound, outbound, transshipment and empty. Empties are stacked up to 7-8 high. — [PEMP Ch. 6.5](https://porteconomicsmanagement.org/pemp/contents/part6/container-terminal-design-equipment/); [Wikipedia: Container port design process](https://en.wikipedia.org/wiki/Container_port_design_process)
- A large terminal gate handles "up to 25 trucks at once". There are truck drop/pick-up slots. On-dock rail avoids gate clearance. — [PEMP Ch. 6.5](https://porteconomicsmanagement.org/pemp/contents/part6/container-terminal-design-equipment/)
- **Gate complex [OCR portal, kiosks, scales, inspection lanes NEW]:**
  - An RFP example calls for 4 inbound lanes, 2 outbound and 2 reversible, plus pre-gate queuing that does not spill onto public roads.
  - Primary processing is OCR portals, kiosks and scales. Then come secondary inspection and controlled release.
  - [Seaboard Marine RFP](https://www.seaboardmarine.com/notices/request-for-proposals-truck-gate-complex/)
- OCR portals read the container number, truck plate and chassis. At DCT Gdańsk they also do damage inspection, with >95% accuracy in drive-through. The complex has self-service and security gate-in/out lanes. — [MDPI, DCT Gdańsk gate automation](https://www.mdpi.com/2071-1050/13/11/6291)
- NC Ports' gate complex combines OCR, RFID, weigh-in-motion scales and radiation portal monitor lanes. — [NC Ports Container Gate Complex](https://ncports.com/port-improvements/container-gate-complex/)
- Gates have a checker cabin where data, seal and cargo condition are recorded. Modern gates are automated or semi-automated if pre-advice data is available. — [Sellhorn/CML MPT study 2017](https://www.iaphworldports.org/n-iaph/wp-content/uploads/2020/11/Multi-PurposeTerminals_Final_May-2017.pdf)
- Maintenance workshop is sized for about 10% of mobile equipment and spreaders at one time. — [Wikipedia: Container port design process](https://en.wikipedia.org/wiki/Container_port_design_process)
- Automation "removes vehicles from the stacking areas". In conventional terminals, external trucks drive to loading areas beside the RTGs while tractors/straddles do the quay moves. — [PEMP Ch. 6.5](https://porteconomicsmanagement.org/pemp/contents/part6/container-terminal-design-equipment/)

### Inferences
Building and property list for the model, with **[NEW]** marking items not in the simulator list:
- Gate:
  - Pre-gate truck parking/queue **[NEW]**.
  - Gate canopy with in/out lanes (existing "gate"), plus OCR portal frames **[NEW]**, weighbridge/WIM pads **[NEW]**, a driver kiosk/checker booth **[NEW]**, a radiation portal monitor **[NEW]** and an X-ray/gamma container scanner building (drive-through portal, customs) **[NEW]**.
  - Customs/inspection shed and bays **[NEW]**.
- Admin building (existing "office" can serve) plus a control tower or operations centre **[NEW]**.
- Canteen/amenity block and security post **[NEW]**.
- M&R workshop (tall high-bay shed for straddles/RTG spreaders) **[NEW]** and a container repair/wash area at the empty depot **[NEW]**.
- Fuel/charging station for tractors and straddles **[NEW]**.
- Electrical substation **[NEW]**.
- Reefer racks (existing), with a gantry walkway to reach upper-tier plugs.
- CFS (existing).
- Empty depot with empty handlers (existing).
- On-dock rail: tracks plus a rail RMG or reach stacker **[NEW: rail-mounted gantry over 4-8 tracks]**.
- Light masts (existing).
- Traffic separation: in RTG terminals, external trucks use the truck lane inside the RTG blocks and a road system kept separate from the quay apron where internal tractors run. In ASC terminals, trucks stop at landside block ends (truck interchange zone **[NEW]**).

### Gaps
- No sourced numbers on gate lanes per TEU, scanner building dimensions, workshop size in m², reefer plugs per rack, or rail track lengths for container terminals. (Multipurpose terminals have 400-750 m loading tracks; see section 5.)
- No sourced typical terminal depth (quay-to-gate) or hectares per berth. Commonly quoted values (e.g. 500-600 m depth, 15-25 ha per 300-350 m berth) were NOT confirmed in this pass.

---

## 5. Break bulk / general cargo / project cargo / multipurpose terminals

### Takeaway
Multipurpose terminals favour one continuous uniform quay wall and uniform heavy-duty pavement for flexibility. Mobile harbour cranes (e.g. Liebherr LHM 550: 154 t, 54 m outreach) are their main ship-to-shore tool, alongside ship's gear and occasionally Panamax STS. Behind the quay are transit sheds/warehouses, open storage for steel, timber and project cargo, RoRo ramps and rail loading tracks. They are served by forklifts (3-45 t), reach stackers, tractors with heavy/light trailers, and mobile cranes.

### Cited Findings
- The study recommends a continuous, uniform quay wall design throughout the terminal for flexibility. It also recommends the same heavy-duty pavement everywhere, rather than dedicated RTG runways, which make layouts rigid. Buildings (sheds, warehouses, workshops) should be modular, on single-point foundations with prefabricated walls/roofs. — [Sellhorn/Fraunhofer CML for HPA, 2017](https://www.iaphworldports.org/n-iaph/wp-content/uploads/2020/11/Multi-PurposeTerminals_Final_May-2017.pdf)
- Functional areas (after UNCTAD):
  - Berths for the various vessel types (plus a RoRo berth if needed).
  - Covered storage, open or closed, for break bulk and consolidation.
  - Open storage for containers incl. reefers, roll-on cargo and cargo not needing shelter.
  - A work area for temporary storage and sorting.
  - A reception/delivery area.
  - Plus areas for "high and heavy" goods and admin/office buildings.
  - [same study](https://www.iaphworldports.org/n-iaph/wp-content/uploads/2020/11/Multi-PurposeTerminals_Final_May-2017.pdf)
- Mobile harbour cranes are used in major ports for peaks or heavy cargo. They are the main equipment at many small terminals and suit break bulk, containers (with spreader) and bulk (with grab). Steel coils and long wood products are handled partly in open storage and partly in warehouses, depending on weather. — [same study](https://www.iaphworldports.org/n-iaph/wp-content/uploads/2020/11/Multi-PurposeTerminals_Final_May-2017.pdf); [TU Delft](https://repository.tudelft.nl/file/File_c8ffb2c9-4ffd-4968-a02e-02c9b97eb0b2)
- Real multipurpose terminal benchmarks, all from the [Sellhorn/CML study](https://www.iaphworldports.org/n-iaph/wp-content/uploads/2020/11/Multi-PurposeTerminals_Final_May-2017.pdf):
  - **C. Steinweg, Hamburg:** quay 1,200 m (1,100 m after expansion), 6 berths, max draft 11.5 m, max LOA about 250 m. 6 rail-mounted and mobile cranes, max lift 300 t. Forklifts up to 45 t, reach stackers, tractors/trailers. 3 gate lanes. Loading tracks up to 750 m. 65,000 m² covered storage. 24,000 TEU + 280,000 t break bulk. 2.61 t/m².
  - **Rhenus Cuxport, Cuxhaven:** total 263,000 m², berth length 1,090 m (another field gives 1,700 m total quay), 5 berths, max draft 15.6 m. 4 RoRo ramps up to 350 t. Mobile crane plus a Panamax STS, max 100 t. 10,000 m² warehouse plus 5,500 m² covered car/truck area. Loading tracks up to 400 m and 4 car ramps. 3 central gate lanes. Handles heavy and project cargo (offshore wind components).
  - **Chittagong General Cargo Terminal:** quay 2,100 m, 13 berths, max draft 9.5 m, max LOA 190 m, 4 RoRo ramps. 2 MHCs (max 84 t). 45 mobile cranes (10-50 t), 6 forklifts (10-20 t), 91 forklifts (3-5 t), 11 tractors, 5 heavy trailers (25 t), 30 light trailers (6 t). 12 gate lanes (6 gates × 2).
  - **Port Louis, Mauritius:** quay 1,900 m, 8 berths, max draft 11.0 m, max LOA 198 m. Break bulk at 30 t/gang/h.
  - **A greenfield MPT (phased):** draft 12.5 m → 14.5 m, LOA 300-350 m. 2 → 4 STS and 2 → 4 MHC. RTGs, reach stackers, tractors/trailers. 1 gate with 3 in / 2 out lanes, rising to 4 + 4. 45 ha.
- **Liebherr LHM 550 [NEW: mobile harbour crane]:**
  - Max capacity 154 t (heavy-lift ≤154 t A3; standard ≤77 t A6). Max outreach 54 m. Rated for New Panamax and Capesize.
  - Total weight 439 t. Hoist up to 120 m/min. 154 t available to 18 m radius, about 144.9 t at 20 m.
  - Third-party summary: supporting base 13.5 × 13.5 m (outriggers); tower top about 40.7 m.
  - [Liebherr LHM 550 page](https://liebherr.com/en/aus/products/maritime-cranes/port-equipment/mobile-harbour-crane/details/lhm550.html); [manuals.plus summary](https://manuals.plus/m/cae234d6bd1c6e8474d973b22b474d6c6cf27cb9cba1df9119a0bf734b87c422)
- Forklifts in MPTs can handle containers up to 9 tiers (empties, with attachments) and general cargo of many sizes. Reach stackers double as short-distance transport. — [Sellhorn/CML study](https://www.iaphworldports.org/n-iaph/wp-content/uploads/2020/11/Multi-PurposeTerminals_Final_May-2017.pdf)
- **SPMT [NEW]:**
  - Scheuerle 4-axle-line module is 4.2 × 2.43 × 1.5 m, up to 60 t per axle line. A used PEKZ 4-line module is 5.6 × 2.43 × 1.2 m.
  - Across makes, 4-line modules are 5.6-6.0 m long and 2.43-3.0 m wide; 6-line modules are 8.4-9.0 m long.
  - The 3 m wide PowerHoss variant is rated 363 short tons (6 axles).
  - FHWA spec: 2.4 m wide with 4 wheels/axle or 3 m wide with 8 wheels/axle, 25-30 t per axle line minimum.
  - Modules couple side-by-side and end-to-end, steer each axle independently and can crab or carousel-turn.
  - [TII Scheuerle SPMT](https://www.tii-group.com/tii-scheuerle/our-solutions/spmt/scheuerle-spmt); [Mammoet used SPMT](https://usedequipment.mammoet.com/usedequipment/transport/spmts/3x-scheuerle-pekz-140.8.4-m78-x20-tt20); [KHL](https://www.khl.com/news/SPMT-update-Upping-capacity/1126159.article); [FHWA](https://www.fhwa.dot.gov/bridge/pubs/07022/chap13.cfm)

### Inferences
- General cargo vessels of 100-180 m have drafts of about 7.5-11 m. The benchmark terminals' max LOA of 190-250 m and drafts of 9.5-11.5 m match this. Model the berth as about 150-200 m per ship with 10-12 m depth.
- Typical MPT quay-to-gate stack:
  - Quay edge with bollards/fenders and MHC working strip (MHC base about 13.5 m square, so about 20-30 m apron).
  - Transit shed row parallel to the quay **[NEW: transit shed / warehouse; long low steel sheds with roller doors on both long sides]**.
  - Open storage yards: steel coil/plate/pipe with dunnage, timber/log yard, project cargo laydown on heavy-duty pavement **[NEW]**.
  - Container stack with reach stackers.
  - RoRo ramp **[NEW]**.
  - Rail loading tracks along the sheds **[NEW]**.
  - Gate with 3-4 lanes.
- **[NEW]** vehicles for break bulk/project cargo:
  - Mobile harbour crane (rubber-tyred, 4 outriggers, slewing tower and luffing boom; moves along the quay on tyres between hatches).
  - SPMT.
  - Low-loader/heavy trailer (25 t+) and light Roll-trailers/MAFI (6 t).
  - Heavy forklifts (10-45 t), alongside the existing forklift (3-5 t).
  - Truck-mounted/crawler mobile cranes (10-50 t).
  - Ship's gear (deck cranes on the vessel model).
  - Floating crane (optional, extreme).

### Gaps
- No sourced transit-shed standard dimensions (width, length, height). Typical-practice values (e.g. 40-60 m wide × 100-200 m long × 8-12 m eaves) are not verified.
- No sourced low-loader dimensions, heavy forklift dimensions, or LHM boom pivot/tower geometry from the official datasheet. The Liebherr PDF data sheet with load diagrams was not parsed.
- Project-cargo laydown pavement loading (kN/m²) was not found.

---

## 6. Overall terminal layout, quay to gate (synthesis)

### Takeaway
Container terminals are laid out in strips parallel to the quay: quay edge/fenders → STS rails and apron (tractor/AGV lanes, hatch-cover area under backreach) → stack (RTG blocks parallel to the quay, or ASC/straddle rows perpendicular) → landside truck interchange → empty depot/reefer/CFS/workshop/admin around the edges → rail terminal at one side or behind → gate complex and pre-gate parking at the landside boundary.

### Cited Findings
- Zones from quay to gate: STS at the ship/dock interface → apron under the cranes → container yard (stacking, circulation lanes, chassis storage) → truck drop/pick-up area → gate. On-dock or near-dock rail connects to the terminal. — [PEMP Ch. 6.5](https://porteconomicsmanagement.org/pemp/contents/part6/container-terminal-design-equipment/)
- Automated terminals separate gate-side trucks from pier-side straddles/AGVs. Antwerp and Rotterdam have separate barge facilities. — [PEMP Ch. 6.5](https://porteconomicsmanagement.org/pemp/contents/part6/container-terminal-design-equipment/)
- MPT built-up area is about 2-3% of the total. Quay-length-to-area ratio C/A is about 0.0015-0.0055 m/m², i.e. about 180-670 m² of land per metre of quay. — [Sellhorn/CML study](https://www.iaphworldports.org/n-iaph/wp-content/uploads/2020/11/Multi-PurposeTerminals_Final_May-2017.pdf)

### Inferences
- C/A of 0.002 means about 500 m² per metre of quay, i.e. an average terminal depth of about 500 m behind the quay. This is a useful sourced proxy for MPT depth. Container terminals are probably similar to deeper (400-700 m), but this was not directly sourced.
- Internal vs external traffic:
  - Internal tractors, straddles and AGVs stay on the apron and in the yard lanes.
  - External trucks enter via the gate and are routed on a perimeter/landside road to the RTG truck lanes or ASC landside ends. They never use the apron.
  - In a toy sim, use one-way loops and colour-coded lane markings.

### Gaps
- No sourced hectares per berth for container terminals or a sourced quay-to-gate depth. Recommend checking PIANC WG 135/158, UNCTAD port development handbook and Thoresen's Port Designer's Handbook (not accessible in this pass).
