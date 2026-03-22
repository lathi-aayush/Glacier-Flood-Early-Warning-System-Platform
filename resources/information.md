# Glacial Lakes & GLOF — Background for GlacierGuard

Reference notes for presentations, judging Q&A, and product framing. This document is **educational context**, not operational hazard guidance.

---

## 1. Types of glacial lake

Glacial lakes are water bodies **fed by glacier melt or ice** and often **impounded** by ice, moraine (glacial debris), or bedrock. Taxonomies differ by agency; the **Hindu Kush Himalaya (HKH)** literature often follows **ICIMOD-style** schemes:

| Type | What it is | Notes for hazard screening |
|------|------------|----------------------------|
| **Bedrock-dammed** | Water in glacially eroded depressions (e.g. cirque / tarn settings). | Dam is often **more stable** than loose moraine; failure modes differ. |
| **Moraine-dammed** | Ponding behind ridges of till/debris (terminal/end, lateral, or complex moraine arrangements). | **Dominant GLOF concern** in many Himalayan valleys — dams may be **weak**, **ice-cored**, or subject to **piping** and overtopping. |
| **Ice-dammed / ice-contact** | Impoundment by glacier ice or margin processes; includes **supraglacial** ponds on ice and **subglacial** storage. | Can fail by **ice collapse**, flotation, or **sudden drainage** through tunnels. |
| **Other / hybrid** | Valleys blocked by **landslides**, **debris flows**, or mixed processes. | Still part of **mountain flood cascades**; dam may not be “classic” moraine. |

Informal terms you will hear: **proglacial** (in front of the glacier), **periglacial**, **supraglacial** ponds (may coalesce and grow). For **inventory and software**, the important questions are: **what holds the water**, **how large the volume is**, and **how steep and narrow the outlet valley is**.

**Accessible primer:** [Introduction to glacial lakes — AntarcticGlaciers.org](https://www.antarcticglaciers.org/glacier-processes/glacial-lakes/introduction-to-glacial-lakes/)

---

## 2. What makes them dangerous?

Risk is usually about **stored energy (water + sediment) + weak containment + triggers + people or assets downstream**.

- **Volume and release rate** — A lake can discharge a **short-lived pulse** far exceeding typical river flow, destroying bridges, hydropower intakes, and settlements in **confined gorges**.
- **Dam material** — **Moraine** may contain **ice**, fines, and **internal erosion (“piping”)**. **Overtopping** or an incoming wave can incise the dam and cause **catastrophic breach**.
- **Triggers** — Intense **rain** or **cloudburst**; **ice or rock–ice avalanche** into the lake (displacement wave); **earthquake**; slow **dam creep**; **cascade** (one flood destabilises another lake or infrastructure downstream).
- **Topography** — Steep channels **accelerate** flow and mobilise **boulders and mud** (debris-rich floods), so impact exceeds “water depth” intuition alone.
- **Exposure** — Villages, roads, and **run-of-river hydropower** sit in valleys that may not be designed for **rare, high-magnitude** events; **compound failures** (natural + infrastructure) amplify damage.

**Useful framing:** “Dangerous” is not only “large lake” — it is **likelihood × consequence** (breach probability × downstream exposure).

---

## 3. Scenarios that feel like an “unknown” hazard

These motivate **transparent, screening-first** systems (satellite + weather + DEM) rather than over-claiming prediction.

- **No or sparse gauges** — Behaviour is inferred from **proxies** (lake area, turbidity, temperature) and **weather**, not direct water-level time series at the dam.
- **Sudden vs slow failure** — Some events unfold over **hours** after a slope or ice collapse; others are **progressive**. Both are hard to forecast without process models and field data.
- **Clouds and seasonal snow** — Optical satellites have **gaps**; you do not get a continuous movie of every lake.
- **Diverse failure mechanisms** — The same lake might, in principle, fail for **different physical reasons** in different decades; **sparse historical labels** limit supervised learning.
- **Cascades and multi-hazard** — Rain + slope failure + moraine breach + downstream dam or infrastructure failure **chain** together (e.g. high-profile Teesta valley narratives around 2023).
- **Inventory uncertainty** — Lake outline, **depth/volume**, and **internal dam structure** are often **estimated**, not measured.

---

## 4. Past incidents (examples)

Use **a small number of well-cited cases** on slides; verify numbers from the **primary paper or government report** you cite.

### Hindu Kush Himalaya / India (high relevance)

- **Dig Tsho, Nepal (1985)** — Widely cited **moraine-dammed GLOF** after an ice-avalanche trigger; classic in textbooks and reviews.
- **Kedarnath region, Uttarakhand (2013)** — Major Himalayan disaster in public memory. Scientific narratives often stress **compound drivers** (extreme rainfall, hillslope processes, valley flooding). Use **careful wording** if mentioning “glacial lake” specifically; cite peer-reviewed sources for your exact claims.
- **South Lhonak, Sikkim (October 2023)** — Recent, data-rich; described in reporting and **peer-reviewed / grey literature** as a **GLOF-related flood cascade** along the Teesta with major downstream impacts. Entry point for sources: [2023 Sikkim flash floods (Wikipedia)](https://en.wikipedia.org/wiki/2023_Sikkim_flash_floods) — use only as a **map to citations**, not as a primary academic reference.

### Global context (optional slide)

- **Cordillera Blanca, Peru** — Long history of GLOFs and engineering responses; common in global reviews.
- **Central Asia** — Additional catalogue examples of ice- and moraine-dammed outbursts.

---

## 5. Current technology, and the gap

### What exists today

- **Regional / national lake inventories** — Satellite-based mapping and change detection (e.g. **ISRO SAC** work on Indian glacial lakes; **ICIMOD** HKH-wide assessments).
- **Field instrumentation (sparse)** — Continuous monitoring on **selected** high-priority lakes; national coverage remains limited compared to total inventoried lakes.
- **Remote sensing monitoring** — Optical indices (e.g. water extent / NDWI), sometimes **radar (SAR)** where available through clouds; **DEMs** for geomorphology and **indicative** flow routing.
- **Modelling** — GIS routing to **scenario** planning; hydrodynamic models where data and calibration exist.
- **Institutional early warning** — Variable by state/agency; often combines **meteorology**, **disaster management protocols**, and **site-specific** projects.

### Gaps (strong, honest talking points)

- **Coverage vs inventory** — Thousands of mapped lakes vs **few** instrumented sites.
- **Process knowledge** — Volume, dam composition, subsurface seepage often **unknown**.
- **Lead time** — Without local trigger monitoring, actionable warning can be **short or ambiguous**.
- **Operational standards** — Turning a model score into an **official alert** needs **validation and governance**, not only algorithms.
- **Compound hazards** — Lake-area trends alone miss **landslide–lake** and **infrastructure cascade** mechanisms.

**GlacierGuard alignment:** A **national screening layer** — prioritisation, change detection, downstream context, and **explainable** scores — **complements** hardware EW where it exists; it does not replace validated operational warning without joint trials.

---

## 6. Sources of data (science + product)

### For hazard science and citations

- Glacial lake **inventories and atlases** (ICIMOD HKH reports; ISRO SAC–related publications on India).
- **GLOF event catalogues** and review papers (peer-reviewed; regional meta-databases).
- **DEMs** — SRTM, Copernicus DEM, etc., for slope and routing *indicators* (not full hydrodynamics without further data).
- **Satellite time series** — Sentinel-2, Landsat, MODIS (each has known cadence and cloud limitations).
- **Meteorology** — Gauges where available; **reanalysis** or merged gridded products for spatial rainfall in data-sparse terrain.

### For GlacierGuard implementation (open / named products)

Aligned with the project README:

- **Sentinel-2 MSI L2A** — Copernicus; lake extent / NDWI time series.
- **MODIS MOD11A1** — NASA LP DAAC; daily LST (~1 km) as coarse thermal context.
- **NASA/USGS SRTM GL1** — 30 m DEM; D8-style **indicative** downstream paths.
- **Open-Meteo Historical Weather API** — ERA5-backed archives; sliding-window rainfall and temperature features.
- **Optional IMD** — Where documented API or licensed gridded products exist.
- **Exposure context** — Census of India 2011 + official / open GIS village layers (e.g. Data.gov.in releases), framed as **relative** exposure (2011 is dated).
- **Labels for supervised triage** — Sparse **documented GLOF events** from literature and agency reports — honest about **limited positive sample size**.

---

## 7. References (starter bibliography)

1. **ICIMOD** — *First comprehensive report on glacial lakes in the Hindu Kush Himalaya* (announcement and links to report materials):  
   https://www.icimod.org/first-comprehensive-report-on-glacial-lakes-in-the-hindu-kush-himalaya-released/

2. **Classification for inventory and hazard studies** — Search: *“Definition and classification system of glacial lake for inventory and hazards study”*, *Journal of Geographical Sciences* (Springer) — useful for **methods and typology** citations.

3. **AntarcticGlaciers.org** — *Introduction to glacial lakes* (didactic, not peer-reviewed):  
   https://www.antarcticglaciers.org/glacier-processes/glacial-lakes/introduction-to-glacial-lakes/

4. **IPCC** — *Special Report on the Ocean and Cryosphere in a Changing Climate (SROCC)* — high-mountain and cryosphere framing:  
   https://www.ipcc.ch/srocc/

5. **South Lhonak / Sikkim 2023** — Select **one peer-reviewed article** via [Google Scholar](https://scholar.google.com) (query e.g. “South Lhonak glacial lake outburst flood 2023”); read the abstract and methods before citing figures.

6. **Explainability (if cited in ML slides)** — Lundberg, S. M., & Lee, S.-I. (2017). *A Unified Approach to Interpreting Model Predictions.* NeurIPS.

7. **India programme context (verify titles/URLs against current MoES/ISRO pages)** — ISRO GLOF monitoring / Space Applications Centre materials; NDMA NGRMP; C-DAC GLOF EW deployments (e.g. Sikkim pilot narratives in press and reports).

---

## Related project files

- Product and technical spec: [README.md](../README.md)
- Round 1 PPT / feasibility notes: [ppt_mvp_feasibility_387501ad.plan.md](../ppt_mvp_feasibility_387501ad.plan.md) (repository root)

---

*Last updated for GlacierGuard documentation. Verify incident statistics and policy claims against primary sources before final submission.*
