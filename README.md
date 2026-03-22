# GlacierGuard

**GlacierGuard** is a software platform for **glacial-lake screening**: it combines open satellite data, weather archives, and terrain models to highlight **which lakes are changing in unusual ways**, **why the model thinks so** (explainable scores), and **which valleys lie downstream** on a map. The goal is **national-scale prioritisation**—not a drop-in replacement for instrumented early-warning systems that agencies run at specific sites.

---

## Who this README is for

- **Visitors and reviewers** — Start with [What this project is](#what-this-project-is), [What it does and does not do](#what-it-does-and-does-not-do), and [Limitations](#limitations-you-should-know).
- **Developers** — Jump to [What's in this repository](#whats-in-this-repository), [Tech stack](#tech-stack), and [Run locally](#run-locally).

---

## What this project is

Mountain regions hold **many mapped glacial lakes**, but only a **small fraction** are continuously monitored in the field. GlacierGuard is designed as a **transparent screening layer**: it ingests repeatable, open inputs (for example Sentinel-2, coarse thermal data, historical weather, and SRTM elevation), builds **time-window features** per lake, and runs **Isolation Forest** (normal behaviour) plus **XGBoost with SHAP** (supervised triage where labels exist). **D8-style routing** on SRTM sketches **indicative downstream flow paths**—useful for context, not a full flood-inundation simulation.

Results are meant to be served through a **FastAPI** backend and a **React + Leaflet** dashboard (orchestrated with a **scheduler + job queue**; Kafka is out of scope for the MVP).

**Deeper background** (lake types, hazard mechanisms, honest gaps): [resources/information.md](resources/information.md).

---

## The problem it addresses

- Large **inventories** of glacial lakes vs **sparse** continuous gauging and site-specific instrumentation.
- Need for **repeatable, explainable** signals that teams can audit—not only a single risk number.
- Need to connect **upstream change** with **downstream geography** for planning and communication, without claiming centimetre-accurate inundation maps from 30 m terrain alone.

---

## What it does and does not do

| It aims to | It does not claim to |
|------------|----------------------|
| Flag lakes whose recent feature patterns look **anomalous** or **model-suspicious** relative to history and sparse event labels | Deliver **validated operational warnings** or replace **field-validated** early-warning deployments |
| Show **drivers** of a score (e.g. SHAP) for **accountability** | Provide **continuous “real-time”** satellite movies of every lake (revisit, clouds, and processing lag apply) |
| Draw **indicative** downstream paths from SRTM for **context** | Replace **hydrodynamic** inundation models or engineering-grade flood maps |
| Support **prioritisation** (“where to look next”) | Guarantee **prediction** of a specific breach time or mechanism |

---

## Limitations you should know

- **Satellite cadence** — Optical sensors like Sentinel-2 revisit on the order of **days**; clouds and snow interrupt time series.
- **Labels** — Documented GLOF events are **sparse**; supervised models must be interpreted with care.
- **Terrain routing** — **30 m SRTM** and **D8** flow paths are **indicators**, not calibrated flood extents.
- **Exposure context** — If census or village layers are used, treat them as **relative / dated** context unless refreshed.

---

## How the system works (conceptual)

1. **Schedule** periodic jobs (or trigger on new data) to fetch and preprocess inputs.
2. **Build features** per lake over rolling windows (weather, area proxies, thermal context, etc.).
3. **Score** with Isolation Forest (unlabelled “normal” periods) and XGBoost where positive/negative examples exist; attach **SHAP** for explanation.
4. **Cache** simplified downstream polylines from the DEM where useful (e.g. by lake tier).
5. **Publish** via API to the dashboard and optional channels (e.g. SMS stubs / Twilio).

### Architecture (target pipeline)

```
cron / scheduler → job queue + workers
                        │
Sentinel-2 L2A, MOD11A1, Open-Meteo, SRTM, (optional IMD / IoT)
                        ▼
              FastAPI + PostgreSQL/PostGIS
                        │
        features → Isolation Forest → XGBoost + SHAP → scores + audit
        SRTM → D8 paths (cached per lake tier)
                        │
              API → dashboard; optional Twilio SMS
```

---

## What's in this repository

| Area | Status |
|------|--------|
| [`frontend/`](frontend/) | **Present** — Vite + React + TypeScript, Leaflet, Tailwind; can run with demo data or point at an API. |
| [`stitch/`](stitch/) | **Present** — Static HTML prototypes and the “Sub-Zero Sentinel” design reference. |
| [`docs/phased-development.md`](docs/phased-development.md) | **Present** — Step-by-step plan to match Stitch in production React. |
| [`resources/information.md`](resources/information.md) | **Present** — Domain context for pitches and documentation. |
| `backend/`, `data/`, `notebooks/`, `docker-compose.yml` | **Planned** — Layout below matches the **intended** Python/PostGIS pipeline as it is added. |

---

## Tech stack

| Area | Choice |
|------|--------|
| API | Python 3.11, FastAPI |
| Jobs | Cron / cloud scheduler + Celery or RQ + Redis, or DB-backed jobs |
| DB | PostgreSQL + PostGIS |
| ML | scikit-learn (Isolation Forest), XGBoost, SHAP |
| Geo | GDAL, rasterio, pyproj; D8 routing on SRTM |
| Frontend | React, Vite, Leaflet |
| Alerts | Twilio (optional) |

**UI parity with Stitch:** prototypes and design tokens live under [`stitch/`](stitch/); implementation phases are in [`docs/phased-development.md`](docs/phased-development.md).

**Cursor Agent skills** (this repo): [`.cursor/skills/`](.cursor/skills/) — `glacierguard-backend`, `glacierguard-frontend-stitch`, `glacierguard-docs-and-pitch`.

---

## Repository layout (target)

The tree below is the **intended** structure as the backend and data tooling land; today you will mainly see `frontend/`, `stitch/`, `docs/`, and `resources/`.

```
.
├── backend/
│   ├── api/              # FastAPI routes
│   ├── ingestion/        # Fetchers → enqueue jobs
│   ├── workers/          # Queue consumers: features, models, path cache
│   ├── features/         # Rolling windows, joins to lake polygons
│   ├── models/
│   │   ├── isolation_forest/
│   │   └── xgboost/
│   ├── simulation/       # D8 flood path / downstream linestrings
│   └── alerts/           # SMS / stubs for push
├── frontend/
│   └── src/              # components, map/, dashboard/
├── data/
│   ├── dem/              # SRTM tiles (gitignored; download via script)
│   ├── lakes/            # Lake polygons (e.g. GeoJSON)
│   └── training/         # GLOF labels export (e.g. Zenodo .ods → CSV)
├── notebooks/            # Training / evaluation
├── resources/            # Reference notes (e.g. information.md)
└── docker-compose.yml
```

---

## Data inputs

| Input | Access | Used for |
|-------|--------|----------|
| Sentinel-2 L2A | [Copernicus Data Space](https://dataspace.copernicus.eu/) or GEE `COPERNICUS/S2_SR_HARMONIZED` | NDWI, lake area time series |
| MOD11A1 | [NASA LP DAAC](https://lpdaac.usgs.gov/) | Daily LST anomaly (coarse) |
| SRTM GL1 30 m | USGS EarthExplorer / OpenTopography | DEM, D8 routing |
| Weather | [Open-Meteo Historical API](https://open-meteo.com/en/docs/historical-api) | 3d/7d precipitation, temperature |
| GLOF events | [Lützow & Veh GLOF DB v3.0](https://doi.org/10.5281/zenodo.7330345) | Positive labels (sparse); [map](http://glofs.geoecology.uni-potsdam.de) |
| Lake polygons | ISRO/ICIMOD inventory / your GeoJSON | AOI per lake |
| Exposure (optional) | Census 2011 + open village GIS | Downstream context |

### Feature table (Stage 2)

Implement these columns in `features/` when the backend exists (sources as available):

| Feature | Source | Window |
|---------|--------|--------|
| Water level / level proxy | IoT or satellite-derived | 24h, 72h |
| Cumulative rainfall | Open-Meteo / IMD | 3d, 7d |
| Temperature anomaly | MOD11A1 | 30d baseline |
| Lake surface area delta | Sentinel-2 NDWI | 5d, 15d |
| Moraine / terrain stress | SRTM + volume proxy | computed |
| Seismic count | USGS or stub | 7d |
| Seasonal index | calendar | fixed |

Train **Isolation Forest** on unlabelled normal-period feature rows per lake; **XGBoost** on positives from the GLOF database (joined in space/time to feature rows) plus negatives from non-event lakes/periods.

---

## Configuration

Set via environment variables or `.env` (document in `backend/` when added):

- `DATABASE_URL` — PostGIS connection string  
- `REDIS_URL` — if using Celery/RQ  
- `TWILIO_*` — optional SMS  
- Copernicus / Earthdata credentials — for scripted downloads (if not using GEE export)

---

## Run locally

### Frontend (works today)

```bash
cd frontend && npm install && npm run dev
```

`npm start` is an alias for the same Vite dev server. The dev server can bind to **all interfaces** (`vite` `server.host: true`). Your terminal prints **Network:** with a URL like `http://<your-LAN-IP>:5173/` — use that on phones or other PCs on the same Wi‑Fi. If nothing loads, allow **port 5173** in Windows Firewall (Inbound rule, TCP).

**Frontend environment:** copy [`frontend/.env.example`](frontend/.env.example) to `frontend/.env` and set `VITE_API_BASE_URL` to your FastAPI origin (no trailing slash), e.g. `http://localhost:8000`. If unset, the UI uses offline demo data and does not call the network for lakes/alerts. When the URL is set, the dashboard and inventory load `GET /lakes`, and the alert log loads `GET /alerts`; failed requests fall back to demo data with an in-app toast.

**Production build & preview:**

```bash
cd frontend && npm run build && npm run preview
```

### Backend pipeline (when the scaffold exists)

```bash
docker compose up -d   # Postgres, Redis if used

cd backend && pip install -r requirements.txt && cd ..
# Populate data/dem, data/lakes, data/training when download scripts exist

python notebooks/train_isolation_forest.py
python notebooks/train_xgboost.py
cd backend && uvicorn api.main:app --reload
```

Adjust paths if your layout differs.

### Put `localhost:5173` on the Internet (dev only)

```bash
cd frontend && npm run online
```

This starts Vite **and** a [localtunnel](https://github.com/localtunnel/localtunnel) to port **5173**. In the terminal, find the **`tunnel`** line with `your url is: https://….loca.lt` — that link is your app online. Stop with **Ctrl+C** (both processes exit). Dev-only; no secrets. First visit may show a localtunnel click-through page.

Alternatively: `npm run dev` in one terminal and `npm run tunnel` in another.

Often smoother: install [Cloudflare Tunnel (`cloudflared`)](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/), then:

```bash
cd frontend && npm run tunnel:cf
```

That prints a `https://….trycloudflare.com` URL. Same caveats: dev-only, no sensitive data.

If the UI calls a local API (`VITE_API_BASE_URL`), you may need to allow the tunnel origin in FastAPI **CORS** or use a tunneled API URL too.

---

## References (implementation)

- Lützow, N. & Veh, G. — GLOF Database v3.0. [DOI 10.5281/zenodo.7330345](https://doi.org/10.5281/zenodo.7330345)  
- Lundberg & Lee (2017) — SHAP / TreeSHAP  
- Domain context: [resources/information.md](resources/information.md)
