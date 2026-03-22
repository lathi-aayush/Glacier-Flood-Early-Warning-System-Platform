# GlacierGuard

Software pipeline for **glacial-lake screening**: ingest open EO and weather data, engineer time-window features, run **Isolation Forest** then **XGBoost + SHAP**, sketch **D8** downstream paths on **SRTM**, expose results via **FastAPI** and a **React + Leaflet** dashboard. Orchestration uses a **scheduler + job queue** (no Kafka in MVP).

---

## Architecture

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

## Tech stack

| Area | Choice |
|------|--------|
| API | Python 3.11, FastAPI |
| Jobs | Cron/cloud scheduler + Celery or RQ + Redis, or DB-backed jobs |
| DB | PostgreSQL + PostGIS |
| ML | scikit-learn (Isolation Forest), XGBoost, SHAP |
| Geo | GDAL, rasterio, pyproj; D8 routing on SRTM |
| Frontend | React 18, Leaflet, Recharts |
| Alerts | Twilio (optional) |

**UI parity with Stitch:** static prototypes and design system live under [`stitch/`](stitch/); phase-wise plan to implement the same look in React is in [`docs/phased-development.md`](docs/phased-development.md).

**Cursor Agent skills** (project): [`.cursor/skills/`](.cursor/skills/) — `glacierguard-backend`, `glacierguard-frontend-stitch`, `glacierguard-docs-and-pitch`.

---

## Repository layout (target)

```
.
├── backend/
│   ├── api/              # FastAPI routes
│   ├── ingestion/      # Fetchers → enqueue jobs
│   ├── workers/        # Queue consumers: features, models, path cache
│   ├── features/       # Rolling windows, joins to lake polygons
│   ├── models/
│   │   ├── isolation_forest/
│   │   └── xgboost/
│   ├── simulation/     # D8 flood path / downstream linestrings
│   └── alerts/         # SMS / stubs for push
├── frontend/
│   └── src/              # components, map/, dashboard/
├── data/
│   ├── dem/              # SRTM tiles (gitignored; download via script)
│   ├── lakes/            # Lake polygons (e.g. GeoJSON)
│   └── training/         # GLOF labels export (e.g. from Zenodo .ods → CSV)
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

**Feature table (Stage 2)** — implement these columns in `features/` (sources as available):

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

## Local run (once scaffold exists)

```bash
docker compose up -d   # Postgres, Redis if used

cd backend && pip install -r requirements.txt && cd ..
# Populate data/dem, data/lakes, data/training when download scripts exist

python notebooks/train_isolation_forest.py
python notebooks/train_xgboost.py
cd backend && uvicorn api.main:app --reload
```

```bash
cd frontend && npm install && npm start
```

`npm start` binds to **all interfaces** (`vite` `server.host: true`). Your terminal prints **Network:** with a URL like `http://<your-LAN-IP>:5173/` — use that on phones or other PCs on the same Wi‑Fi. If nothing loads, allow **port 5173** in Windows Firewall (Inbound rule, TCP).

**Put `localhost:5173` on the Internet (one command):**

```bash
cd frontend && npm run online
```

This starts Vite **and** a [localtunnel](https://github.com/localtunnel/localtunnel) to port **5173**. In the terminal, find the **`tunnel`** line with `your url is: https://….loca.lt` — that link is your app online. Stop with **Ctrl+C** (both processes exit). Dev-only; no secrets. First visit may show a localtunnel click-through page.

Alternatively: `npm start` in one terminal and `npm run tunnel` in another.

Alternative (often smoother): install [Cloudflare Tunnel (`cloudflared`)](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/), then:

```bash
cd frontend && npm run tunnel:cf
```

That prints a `https://….trycloudflare.com` URL. Same caveats: dev-only, no sensitive data.

If the UI calls a local API (`VITE_API_BASE_URL`), you may need to allow the tunnel origin in FastAPI **CORS** or use a tunneled API URL too.

**Frontend environment:** copy [`frontend/.env.example`](frontend/.env.example) to `frontend/.env` and set `VITE_API_BASE_URL` to your FastAPI origin (no trailing slash), e.g. `http://localhost:8000`. If unset, the UI uses offline demo data and still calls no network for lakes/alerts. When the URL is set, the dashboard and inventory load `GET /lakes`, and the alert log loads `GET /alerts`; failed requests fall back to demo data with an in-app toast.

**Production build & preview:**

```bash
cd frontend && npm run build && npm run preview
```

Adjust `cd` paths if your layout differs (e.g. notebooks at repo root).

---

## References (implementation)

- Lützow, N. & Veh, G. — GLOF Database v3.0. [DOI 10.5281/zenodo.7330345](https://doi.org/10.5281/zenodo.7330345)  
- Lundberg & Lee (2017) — SHAP / TreeSHAP  
- Background context: [resources/information.md](resources/information.md)
