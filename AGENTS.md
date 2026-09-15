# AGENTS.md — AI Agent Guidance for GlacierGuard

Welcome to **GlacierGuard** (Himalayan Glacial Lake Outburst Flood Early Warning System Platform).

## Architecture & Codebase Navigation

- **Primary Structure Graph**: When navigating the codebase or tracing dependencies, refer to `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md` (if present) for module relationships, god nodes, and communities.
- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Leaflet geospatial map (`frontend/`).
- **Backend**: FastAPI, SQLAlchemy, SQLite/PostgreSQL with GLOF hazard feature scoring (`backend/`).
- **Data & Standards**:
  - Spatial references: WGS84 (EPSG:4326).
  - Telemetry: 24h precipitation (mm), surface temperature (°C), lake area delta (%), seismicity magnitude.
  - Risk Tiers: `critical`, `high`, `advisory`, `safe`.

## Development Conventions

- Follow the minimal-diff philosophy: pick the simplest solution that works, fix root causes at the source, and preserve existing types and interfaces.
- Ensure all frontend changes pass `npm run build` without TypeScript errors.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
