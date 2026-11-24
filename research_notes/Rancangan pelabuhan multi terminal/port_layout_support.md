# Port-wide planning, layout, marine and landside support facilities (multi-terminal seaport)

Scope note: The primary standard (PIANC Report 121, 2014) and several design manuals (TU Delft/Ligteringen, CWPRS, HR Wallingford) were found, but their PDFs could not be machine-read in this session. Their numbers are quoted here from secondary sources that repeat them, and each one is flagged as secondary. Items under "Inferences" that have no citation are engineering rules of thumb for the modeller. They are not sourced facts and should be treated as placeholders.

Simulator baseline: the toy simulator already has a **quay, a gate, an office, a light mast, an ASD tug and a pilot boat**. Everything else listed below is tagged **[BUILD]**.

---

## 1. Waterside geometry: breakwaters, entrance, approach channel, turning basin, berth pocket, basins, anchorage

### Takeaway
Size the waterside from the design ship's beam (B), length (LOA) and draught (T):
- **Approach channel, one-way:** roughly 3-5 B. This is built from a basic lane of 1.3-1.8 B plus bank clearances, and two-way traffic adds a second lane plus a passing distance.
- **Turning basin:** 2 x LOA with tugs, 3 x LOA without tugs, and as small as 1.5 x LOA for thruster-equipped ships.
- **Harbour entrance:** as narrow as navigation safely allows, to limit wave penetration. For very large ships it is about 300-600 m.

### Cited Findings
**Standard**
- PIANC Report 121 (2014), from MarCom WG 49, "Harbour Approach Channels – Design Guidelines", covers vertical and horizontal dimensions of approach channels, manoeuvring areas and anchorage areas inside harbours. It replaces the 1997 WG 30 guide. Its width method is the "sum of ship beams", a modified WG 30 method — [Port Technology summary](https://www.porttechnology.org/technical-papers/harbour_approach_channels_design_guidelines); [IMPA/PIANC WG49 presentation](https://www.impahq.org/sites/default/files/2021-04/pianc-wg49presentation-jan-20143_0.pdf)

**Channel width (PIANC concept method, secondary sources)**
- Basic manoeuvring lane: **1.3 B** for good manoeuvrability, **1.5 B** for moderate, **1.8 B** for poor — [Kubla channel-width manual](https://www.kublasoftware.com/support/documentation/kubla-ports/2018/5.1/technical-manual/channel-widths/overview.html); [MRC vessel/waterway classification](https://www.mrcmekong.org/wp-content/uploads/2024/09/Standardization-of-a-vessel-and-waterway-classification-in-the-MRC.pdf)
- Bank clearance, applied per side:
  - Sloping edges or shoals: **0.7 B** fast, **0.5 B** moderate, **0.3 B** slow.
  - Steep, hard embankments or structures: **1.3 B** fast, **1.0 B** moderate, **0.5 B** slow.
  - Speed bands: fast >12 kn, moderate 8-12 kn, slow <8 kn.
  - Source: [Kubla](https://www.kublasoftware.com/support/documentation/kubla-ports/2018/5.1/technical-manual/channel-widths/overview.html); [Journal of Maritime Logistics 2021 (PIANC method)](https://journal.umt.edu.my/index.php/jml/article/view/399/258)
- Passing distance, two-way traffic:
  - Outer channel: **2.0 B** fast, **1.6 B** moderate, **1.2 B** slow.
  - Inner channel: **1.8 B** fast, **1.4 B** moderate, **1.0 B** slow.
  - Add **+0.5 B** in heavy traffic.
  - Source: [Kubla](https://www.kublasoftware.com/support/documentation/kubla-ports/2018/5.1/technical-manual/channel-widths/overview.html)
- Simpler rule (Transport Canada): channel width = **4 x B** for one-way and **7 x B** for two-way — [Transport Canada TP743 App. 2 (archived)](https://bac-lac.wayback.archive-it.org/web/20061209225310/http://www.tc.gc.ca/marinesafety/tp/tp743/Appendix2.htm), as summarised in search.
- One journal gives one-way channel widths of ≥0.5 L, and 1.5-2.0 L for two-way or long channels. Here L is ship length, not beam — [IJCOE](https://www.ijcoe.org/article_150015_adc2602ec05ab8a40208ecd8585b1d06.pdf) (secondary; not verified in full text).

**Turning basin**
- PIANC 121 recommends **2 x LOA with tug assistance** and **3 x LOA without tugs**. A PIANC guideline for inland channels (WG 141) uses 1.2 x L, and China uses 2 x L — [Wikipedia: Turning basin](https://en.wikipedia.org/wiki/Turning_basin)
- TU Delft course chapter (after Ligteringen, *Ports and Terminals*): the conceptual minimum is **2 x LOA**. It drops to **1.5 x LOA** for ships using main propeller, rudder and bow thrusters. The same source sets the slowing-down phase of the manoeuvring length at about **1.5 x ship length** — TU Delft Part II Ch. 3 Port layout (repository link now 404; quoted via search snippet).
- Transport Canada: **2.5 x LOA**, reducible to **2 x LOA** where local conditions allow — [Transport Canada TP743](https://bac-lac.wayback.archive-it.org/web/20061209225310/http://www.tc.gc.ca/marinesafety/tp/tp743/Appendix2.htm)
- FORCE Technology:
  - Empirical minimum diameter: **LOA + 2 B**.
  - Add room for tugs: **2 x towline length (min 40 m) + tug length**.
  - Source: [FORCE Technology – turning basin](https://forcetechnology.com/en/articles/turning-basin)
- Indian code IS 4651-5: **1-2 x the largest vessel length** when ships are warped round dolphins — [IS 4651-5 (1980)](https://law.resource.org/pub/in/bis/S03/is.4651.5.1980.pdf)

**Harbour entrance**
- There is no single universal entrance-width / ship-length formula. Width is set by harbour type, vessel size and an uncertainty allowance — [ScienceDirect review of optimal harbour design](https://www.sciencedirect.com/science/article/pii/S2092678216304046)
- Keep the entrance as narrow as safe navigation allows, to minimise the wave energy entering the basin — [Alaska DOT Coastal Eng. Manual ch. 15](https://dot.alaska.gov/stwdmno/ports/assets/pdf/coastalengman/ch15.pdf)
- Ships of about 300,000 dwt need entrance channels **300-600 m** wide — [ICCE paper ch. 120](https://icce-ojs-tamu.tdl.org/icce/article/download/3015/2680/12922)
- Example: a fisheries harbour used a **150 m** entrance opening — [Rubble-mound breakwater review (ResearchGate)](https://www.researchgate.net/publication/326286414_Present_Practices_in_Design_of_Rubblemound_Breakwaters_for_Coastal_Harbours-A_Review)
- Yacht harbours: entrance = max yacht length + 2 m, typically 20-30 m. Manoeuvring radius is 1.5-2.0 x L — [Gucma & Drwiega (Annual 25)](https://yadda.icm.edu.pl/baztech/element/bwmeta1.element.baztech-d9127dae-f9b9-4664-988a-9386b9ff642b/c/Annual_25_Gucma_Drwiega.pdf)

**Breakwaters**
- Rubble-mound design concerns:
  - Crest elevation and crest width.
  - Toe scour protection on the seaward side.
  - Spreading the load to avoid foundation failure.
  - Source: [Rubble-mound review](https://www.researchgate.net/publication/326286414_Present_Practices_in_Design_of_Rubblemound_Breakwaters_for_Coastal_Harbours-A_Review)
- Composite type: a vertical slit caisson on a rubble-mound foundation (TU Delft general port-planning thesis) — [TU Delft repository](https://repository.tudelft.nl/file/File_6eca277c-05b7-4a90-be49-08f6bde647b2) (snippet).
- Master-plan design starts from the orientation, width and depth of the approach channel, which ends in a turning basin — TU Delft (same source, snippet).

**Anchorage**
- Swing radius ≈ LOA + chain paid out:
  - Example: an 80 m ship with 5 shackles (about 27.5 m each) needs about **217.5 m** radius.
  - The swing circle is drawn from the let-go position.
  - Source: [Shipowners' Club anchoring guidance](https://www.shipownersclub.com/latest-updates/publications/guidance-anchoring/)
- Naval "safety swing circle" = LOA + usable cable + margin. Example: 155 + 275 + 275 = **705 m** — [UFC 4-150-06](https://ufgscriteria.tpub.com/4_150_06/4_150_060093.htm)
- US UFC tables assume a chain scope of **6 x depth** in shallow water — [UFC 4-150-06](https://ufgscriteria.tpub.com/4_150_06/4_150_060095.htm)

**Indonesian reference values**
- Tanjung Priok, New Priok/Kalibaru:
  - Approach channel and turning basin designed to **-16.5 m LWS** — [ITB Jurnal Teknik Sipil](https://journals.itb.ac.id/index.php/jts/article/view/18831/6181)
  - Berth depth about 16 m — [Marine Link](https://www.marinelink.com/news/container-transform368906)
  - Phase I North Kalibaru: **1,200 m quay**, 12 quay cranes, 8,208 ground slots. Dredging for channel and basin **>20 million m³** — JICA study (snippet; [openjicareport](https://openjicareport.jica.go.jp/pdf/12068599_05.pdf))
  - One JICA option listed a west breakwater of **2,640 m** and a north breakwater of **2,790 m** at 15.5 m depth. This is an older study option, not the as-built design, and the table columns were unclear — [JICA](https://openjicareport.jica.go.jp/pdf/12068607_02.pdf)
- Patimban (West Java): a reclaimed islet forms the breakwater, with the port basin inside it — [Seatrade Maritime](https://www.seatrade-maritime.com/asia/more-details-indonesia-s-patimban-port-project-released)

### Inferences
- Worked example for the simulator. Design container ship: 366 m LOA, 51 m B, 15.2 m T, moderate manoeuvrability, moderate speed.
  - **One-way channel** ≈ 1.5 B + 2 x 0.5 B ≈ 2.5 B ≈ 130 m before the PIANC additional widths (wind, current, waves, aids to navigation). Practical one-way channels are therefore often 3-5 B (150-250 m). The 4 B Canadian rule gives about 205 m.
  - **Two-way channel** ≈ 2 x 1.5 B + 1.6 B + 2 x 0.5 B ≈ 5.6 B ≈ 285 m, plus allowances. The 7 B rule gives about 360 m.
  - **Turning basin** with tugs ≈ 2 x 366 ≈ 730 m diameter.
  - **Depth.** PIANC 121's own UKC values were not readable here. A common planning shorthand is depth ≥ 1.10-1.15 T in sheltered water and more in waves, which gives about -16.5 to -17.5 m. This matches the -16.5 m LWS at Kalibaru. The numbers are not verified against PIANC text.
- **Berth pocket:** none was sourced. A typical modelling placeholder is a strip **1.25-1.5 B wide** along the quay, dredged slightly deeper than the channel.
- **Basin layouts:** no source fetched. Placeholder guidance only:
  - Finger docks or piers suit older, small-ship and break-bulk ports. Basin width between fingers is about 2-3 B per side used plus a manoeuvring lane.
  - Parallel (marginal) quays along a straight waterfront suit container terminals, which need a long quay and a deep backland of about 500-600 m+.
  - Island or offshore reclaimed terminals connected by bridge or causeway are what Kalibaru and Patimban use.
- **Breakwater shapes to model:**
  - Rubble mound: trapezoidal section, armour units (rock, tetrapods or Xbloc) on the seaward face, crest wall on top.
  - Caisson: vertical concrete box with a flat top.
  - Common plan shapes: L-shaped, two converging arms ("double breakwater"), or a detached breakwater parallel to the shore.
  - Indonesian Java Sea ports are relatively low-wave, so they often use only short breakwaters or revetments around reclaimed land.
- **[BUILD]:** breakwaters (rubble and caisson variants), dredged-channel visual (water colour and depth contour), turning basin marker circle, anchorage area polygon on the chart.

### Gaps
- Exact PIANC 121 additional-width tables (wind, current, waves, aids, bottom), its UKC/depth formula, its stopping distance and its berth-pocket rules. The PDF copy (shaghool.ir) failed a TLS check, and the HR Wallingford, CWPRS and TU Delft PDFs could not be text-extracted.
- No authoritative harbour entrance-width / ship-length rule was found. Many textbooks quote "entrance ≈ 1.0-1.5 x LOA (no less than ship length)", but this was not verified.
- PIANC anchorage design numbers were not found.
- Patimban as-built numbers (channel, basin, breakwater): the JICA PDF exceeded the fetch limit.

---

## 2. Navigation aids: IALA buoyage, leading lights, lighthouse, VTS / port control

### Takeaway
Indonesia uses **IALA Region A**: red cans to port and green cones to starboard when entering from seaward. Aids to navigation (SBNP) and VTS are run by the Ministry of Transport's Distrik Navigasi, not by Pelindo.

### Cited Findings
- The current standard is IALA Recommendation **R1001 Ed. 2.0 (2022)**, the IALA Maritime Buoyage System — [IALA R1001](https://iala.int/content/uploads/2022/05/C75-10.3.7-Revised-Recommendation-R1001-Ed2.0-The-IALA-Maritime-Buoyage-System-June-2022.pdf)
- Region A lateral marks:
  - Port mark: red, can, pillar or spar shape, cylinder topmark, red light.
  - Starboard mark: green, conical, pillar or spar shape, cone-point-up topmark, green light.
  - Region B reverses the colours.
  - Lights may use any rhythm except Fl(2+1), which is reserved for preferred-channel marks.
  - Preferred-channel marks keep the main-channel colour and add one horizontal band of the other colour.
  - Source: [Wikipedia: Lateral mark](https://en.wikipedia.org/wiki/Lateral_mark); [Imray IALA A sheet](https://www.imray.com/media/cpubjymg/iala_buoyage_system_a.pdf)
- Region B covers the Americas, Japan, South Korea, the Philippines, Taiwan, Hawaii and Easter Island. Everything else is Region A, so Indonesia is Region A by elimination — [Wikipedia: Lateral mark](https://en.wikipedia.org/wiki/Lateral_mark)
- Cardinal, isolated-danger, safe-water and special marks are the same in both regions — [Marine Insight](https://www.marineinsight.com/marine-navigation/iala-buoyage-system-for-mariners-types-of-marks/)
- Indonesia: **Distrik Navigasi Tipe B Tanjung Priok** (PM 3/2024) reports to the Directorate General of Sea Transportation. It plans, provides, operates, maintains and supervises *Sarana Bantu Navigasi Pelayaran* (SBNP: aids to navigation) — [Permenhub PM 3/2024](https://peraturan.go.id/files/permenhub-no-pm-3-tahun-2024.pdf)
- VTS stations are built at Distrik Navigasi sites and must integrate with radio and electronic navigation aids. Port VTS upgrades have been run by IPC (Pelindo II) with DitjenHubla — [rm.id](https://rm.id/baca-berita/government-action/28982/dukung-keselamatan-navigasi-kemenhub-resmikan-fasilitas-pelayaran); [Bisnis.com](https://ekonomi.bisnis.com/read/20131209/98/191308/ipc-ditjenhubla-tingkatkan-vessel-traffic-service)
- SBNP in Tanjung Priok waters include lighthouses (*mercusuar*), lightships (*kapal suar*) and light beacons (*lampu suar*). They are maintained by Distrik Navigasi with PT Pelindo II — [Poltekpel Banten journal](https://ejournal.poltekpel-banten.ac.id/index.php/ejmi/article/download/88/103)
- Indonesian VTS operator training follows IALA model courses (V-103, now Guideline 1017) and IALA V-128 equipment requirements — [JICA](https://openjicareport.jica.go.jp/pdf/12380986.pdf)

### Inferences
These come from general IALA knowledge and were not fetched or verified this session. The modeller should check them against R1001:
- **Cardinal marks:** black/yellow, with two-cone topmarks.
  - N: both cones up, black over yellow.
  - S: both cones down, yellow over black.
  - E: base-to-base, black/yellow/black.
  - W: point-to-point, yellow/black/yellow.
- **Isolated danger:** black with red bands, two black spheres as topmark, white Fl(2).
- **Safe water** (channel entrance "fairway buoy"): red/white vertical stripes, single red sphere, white light (Iso, Oc, LFl 10s or Morse "A").
- **Special mark:** yellow with an X topmark and a yellow light.
- **Emergency wreck mark:** blue/yellow vertical stripes, yellow cross topmark, alternating blue/yellow light.
- **Layout for modelling:**
  - Fairway buoy at the outer end of the channel.
  - Paired red and green lateral buoys every ~1-2 km along the channel. Pairs are closer at bends.
  - Breakwater heads lit: red light on the port-side head, green on the starboard-side head (Region A, entering).
  - Leading lights on the channel axis: two lights or beacons on shore, the rear one higher, kept in line by approaching ships.
  - One lighthouse on a headland or the breakwater root.
  - VTS / port control tower near the entrance with a clear line of sight over the anchorage, channel and basin, topped with radar.
- **[BUILD]:** lateral buoys (red can, green cone), fairway buoy, cardinal buoys, breakwater-head light towers, leading-light pair, lighthouse, VTS tower with radar.

### Gaps
- Official Indonesian SBNP specs (buoy sizes, light ranges) were not retrieved.
- The location of the Tanjung Priok VTS tower was not confirmed.

---

## 3. Zoning: which terminal goes where; hinterland connections, gates, parking, customs, FTZ

### Takeaway
No numeric separation distances were found in an authoritative source. Ports set them through hazard and risk analysis that uses wind data. Practice follows four principles:
- Keep liquid bulk and gas at the seaward or remote end, behind its own basin or jetty.
- Put dusty dry bulk downwind of the city and of the other terminals.
- Put passenger and ferry terminals nearest the city.
- Give container terminals the deepest water and the largest rectangular backland, with expansion room and rail/road access.

### Cited Findings
- Hazard-oriented master plans:
  - Port of Los Angeles Port Master Plan amendments set out a risk-analysis methodology for siting hazardous liquid cargo facilities — [POLA Amendment 28](https://kentico.portoflosangeles.org/getmedia/2f2b99a8-f0c3-4e01-9bfe-ba34de05293d/amendment-28); [POLA 3.7 Hazards](https://kentico.portoflosangeles.org/getmedia/5b5ea510-e86e-4f83-9e8c-1fb64bae4956/3-7-Hazards)
  - A 1979 California master-plan supplement used a wind rose together with the hazardous-material inventory and risk management plan — [GovInfo CZIC](https://www.govinfo.gov/content/pkg/CZIC-t55-3-h3-f57-1979/html/CZIC-t55-3-h3-f57-1979.htm)
- Australian port master plans regulate both port operations and the land use of areas next to the port (buffers) — [Townsville Port Master Plan](https://www.tmr.qld.gov.au/-/media/busind/Transport-sectors/Ports/drafts/Final-Townsville-Master-Plan-f.pdf?la=en); [Qld priority ports guideline 2016](https://www.tmr.qld.gov.au/-/media/busind/Transport-sectors/Ports/priority-ports-guideline-nov-2016.pdf?la=en)
- Tanker berths carry their own emergency response plans, separate from the general port plan — [Port of Tauranga Tanker Berth ERP](https://www.port-tauranga.co.nz/wp-content/uploads/POTL-Tanker-Berth-Emergency-Response-Plan-August-2026.pdf)
- New Priok/Kalibaru was developed as a reclaimed extension seaward of the existing port. When fully operational it more than triples Tanjung Priok's capacity, with about +1.5 M TEU/yr from Phase 1 — [Wikipedia: Port of Tanjung Priok](https://www.wikipedia.org/wiki/Port_of_Jakarta); [ITB](https://journals.itb.ac.id/index.php/jts/article/view/18831/6181)

### Inferences
Placement principles from general planning practice, not sourced here:
- **Liquid bulk, LNG and LPG:** at the far, seaward end on a jetty or trestle in deep water, often with its own approach. Separated from passenger and city areas by distance or water. Fire-fighting tug stationed nearby. Never upwind of the city.
- **Dry bulk (coal, clinker, grain):** downwind of the city and of the reefer/container stacks under the prevailing wind. Indonesia has monsoon winds, westerly in Dec-Mar and easterly in Jun-Sep, so check the local wind rose. Use conveyors and stockpiles with wind fences.
- **Container:** longest straight quay, deepest berths, about 500-600 m deep rectangular yard, direct link to the toll road and rail, expansion land alongside.
- **Multipurpose, general cargo and Ro-Ro / car terminal:** between container and city. A Ro-Ro terminal needs a large flat parking area and a ramp berth.
- **Passenger and ferry terminal:** inner harbour nearest the city centre, with public transport and parking. Separated from cargo flows.
- **Growth direction:** seaward reclamation or along the coast away from the city, as with Kalibaru seaward and Patimban as a greenfield port.
- **Landside spine:** one or more main port gates with in-gate/out-gate lanes and OCR/portal. A truck holding / buffer park outside the gate. Customs inspection (X-ray / hi-co scan) area near the gate. A rail yard parallel to the container yard. A free-trade / logistics zone (*Kawasan Berikat* / KEK) next to the port behind the gate.
- **[BUILD]:** tank farm and jetty, bulk stockpiles and conveyor, passenger terminal, truck holding park, customs scanner shed, rail sidings, FTZ warehouses. The existing gate can be reused as the terminal gate, but a main port gate is a separate [BUILD].

### Gaps
- No sourced numeric buffer distances between LNG/oil terminals and populated areas. Typical standards are NFPA 307, NFPA 59A and EN 1473 / ISO; not retrieved.
- Rotterdam, Tanjung Priok and Patimban zoning maps were not fetched in detail.
- No sourced truck-parking or gate-lane sizing.

---

## 4. Marine services

### Takeaway
No source in this session gave sizes for the marine service fleet or its bases. Only the existence and role of these services in Indonesia (Distrik Navigasi fleet, Pelindo marine services) is sourced. Use the inferences below as modelling placeholders.

### Cited Findings
- Distrik Navigasi has a *Bidang Layanan Sarana Bantu Navigasi Pelayaran dan Armada*, i.e. it operates its own fleet (buoy tenders and similar) — [Permenhub PM 3/2024](https://peraturan.go.id/files/permenhub-no-pm-3-tahun-2024.pdf)
- FORCE Technology sizes turning basins to include tug working room: 2 x towline (min 40 m) + tug length — [FORCE Technology](https://forcetechnology.com/en/articles/turning-basin)

### Inferences
Unsourced placeholders:
- **Tug base:** sheltered small-craft basin or pontoon berth inside the breakwater near the entrance, so tugs can reach both the pilot boarding area and the berths. Berths for 4-10 tugs, each about 30-35 m LOA. **ASD tug already exists.** The berth, pontoon and fender line are [BUILD].
- **Pilot station:**
  - Pilot boat jetty next to the tug base.
  - Pilot boarding ground just outside the breakwater or at the seaward channel entrance, usually 1-3 nm offshore, marked on the chart.
  - **Pilot boat exists**; boarding-area marker and pilot office are [BUILD].
- **Mooring boats** (about 8-12 m launches): small-craft harbour. [BUILD]
- **Bunkering:** bunker barges (about 60-100 m) and a bunker berth or tank jetty near the liquid-bulk zone. [BUILD]
- **Floating crane:** sheerlegs moored in a service basin. [BUILD]
- **Dredgers:** trailing suction hopper dredger and/or cutter-suction dredger for maintenance dredging. A disposal area is offshore or used for reclamation. [BUILD]
- **Port authority / KSOP patrol boats and Bakamla / KPLP patrol:** small-craft harbour. [BUILD]
- **Fire-fighting tug** (FiFi-1 monitors on the wheelhouse) stationed near the hazardous zone. [BUILD]
- **Oil spill response:** boom store, skimmer boat and response vessel at the service basin. [BUILD]
- **Ship repair:** graving dry dock or floating dock and slipway, placed away from the main channel in a separate basin. Dock length ≈ design ship + margin. [BUILD]
- **Small craft / port service harbour:** one sheltered basin grouping tugs, pilot boats, mooring launches, patrol boats and the spill-response vessel, with a slipway. [BUILD]

### Gaps
- No sourced dimensions for tug bases, pilot boarding distance, dry docks or bunker barges.
- Pelindo marine services fleet data (PT Pelindo Jasa Maritim) was not retrieved.

---

## 5. Landside support facilities

### Takeaway
The only sourced numbers are for security: an ISPS perimeter fence of **at least 2 m** (TT Club). European port projects use **2.4-2.9 m** welded-mesh anti-intruder fencing, with gates built to the same standard as the fence. Other building sizes are unsourced placeholders.

### Cited Findings
- Recommended minimum ISPS fence height is **2 m**, to stop people scaling it or passing items over. Local topography can require more — [TT Club – Port and terminal security](https://ttclub.com/news-and-resources/news/article/tt-talk-port-and-terminal-security)
- Port of Foynes/Shannon (Ireland) planning drawings show a **2.9 m** high anti-intruder welded-mesh ISPS fence and gate, and **2.4 m** fencing panels elsewhere — [Lo-Lo terminal fencing](https://www.pleanala.ie/publicaccess/EIAR-NIS/320250/Lo-Lo%20Container%20Terminal%20(Area%20N)/2.%20Civil%20Engineering/CP1901-3FM-RPS-S45-06-DR-C-0620%20Lo-Lo%20Container%20Terminal%20(Area%20N%20)%20Security%20Fencing%20Details.pdf); [Ro-Ro yard fencing](https://www.pleanala.ie/publicaccess/EIAR-NIS/320250/Ro-Ro%20Terminal%20Yard%20(Area%20O)/2.%20Civil%20Engineering/CP1901-3FM-RPS-S45-07-DR-C-0705%20Ro-Ro%20Terminal%20Yard%20(Area%20O)%20Proposed%20Security%20Fencing%20Details.pdf)
- Gates must match the security standard of the perimeter fence and have access control, or the fence is negated — [ARF Compendium of ISPS best practice](https://aseanregionalforum.asean.org/wp-content/uploads/2026/05/ARF-Compendium-of-ISPS-Code-Implementation-Best-Practices_FINAL.pdf) (via search summary)
- Restricted areas must be clearly marked, with identity and authorisation checks at entry and a patrolled or monitored perimeter — [33 CFR 105.260](https://www.law.cornell.edu/cfr/text/33/105.260)
- Hamburg Port Authority's ISPS standards document has sections on perimeter/fence, gates and access control — [HPA ISPS standards](https://www.hamburg-port-authority.de/fileadmin/user_upload/isps__Standards_recommendations_EN.pdf)

### Inferences
Unsourced placeholders. Modeller footprints are guesses.
- **Port authority HQ / KSOP / Pelindo regional office:** multi-storey office near the main gate, on the public side of the fence. The existing **office** can serve as a terminal office; the HQ is [BUILD].
- **Customs (Bea Cukai):** office plus inspection shed / container scanner near the gate.
- **Immigration and quarantine (Karantina):** at the passenger terminal and the cargo inspection area.
- **Fire station:** central, with quick access to the tank farm and passenger terminal.
- **Workshops:** equipment maintenance workshops per terminal (crane, straddle/RTG), plus a central port workshop.
- **Fuel station:** for trucks and terminal tractors, inside the fence near the workshop.
- **Utilities:**
  - Power: main substation (HV intake from PLN) plus distribution substations per terminal. Shore-power cabinets on the quay.
  - Water: storage tank or water tower, with potable water hydrants on the quay.
  - Waste reception: MARPOL facilities for oily water, sewage and garbage near the service basin or liquid zone. Oily-waste tanks and a garbage compound.
- **Staff areas:** staff parking outside the ISPS fence by the gate. Canteen, mosque (*masjid/musholla*), clinic.
- **Security:** posts at each gate, CCTV poles, patrol road inside the fence, ISPS fence around every terminal and around the hazardous zone.
- **Lighting:** the existing **light mast** covers yard lighting. Additional masts are [BUILD] only if more are needed.
- **[BUILD]:** HQ, customs/scanner, fire station, workshop, fuel station, substation, water tower, waste reception compound, staff parking, mosque, canteen, security posts, ISPS fence segments, CCTV poles.

### Gaps
- No sourced typical floor areas for port buildings.
- Indonesian ISPS implementation specs (Ditjen Hubla) and MARPOL port reception facility rules (PM on *fasilitas penampungan limbah*) were not retrieved.

---

## Source-access log (for the report writer)
These primary PDFs were located but could not be read:
- PIANC 2014 Report 121 (shaghool.ir): TLS certificate error.
- HR Wallingford HRPP447 and SR475: binary not parsed.
- CWPRS port planning memorandum: scanned image.
- TU Delft open book *Ports and Terminals*: >10 MB.
- JICA Patimban layout plan: >10 MB.

The UNCTAD Port Development handbook and the World Bank Port Reform Toolkit were not consulted. Numbers attributed to PIANC above are taken from secondary sources (Kubla manual, MRC report, Wikipedia, journal articles) and should be checked against the original.
