# Apex Store Intelligence

APEX turns ordinary retail CCTV into an operating system for store teams: visitor journeys, zone dwell, queue pressure, conversion leakage, staff-ready alerts, and camera evidence in one live command center.

This is not a footfall counter. It is a CCTV-to-decision pipeline that connects computer vision events with POS transactions and renders the result as an actionable retail intelligence product.

## Live Product

| Surface | URL |
|---------|-----|
| React Command Center | https://storeintelligence.vercel.app |
| Backend API | https://store-intelligence-prr3.onrender.com |
| Swagger Docs | https://store-intelligence-prr3.onrender.com/docs |
| Built-in SSE Dashboard | https://store-intelligence-prr3.onrender.com/dashboard |

## What Makes It Different

- **Journey intelligence, not just counting**: tracks Entry -> Zone Visit -> Billing Queue -> Purchase so managers can see where shoppers drop off.
- **POS-aware conversion**: correlates billing-zone presence with POS timestamps, which is more defensible than a naive transactions divided by visitors ratio.
- **Staff exclusion**: detects likely staff using long-duration tracks and torso HSV color signatures, keeping customer metrics clean.
- **Re-entry protection**: torso-color Re-ID reduces double counting when a visitor exits and returns or appears across nearby cameras.
- **Privacy-first tracking**: no facial recognition, no identity storage, no PII. The system uses anonymous track IDs, bounding boxes, zones, and timestamps.
- **Actionable anomaly layer**: queue spikes, dead zones, conversion drops, and stale camera feeds return severity plus a suggested action.
- **Vision Center with deployment-safe camera proof**: localhost can show real YOLO MJPEG streams; Previous Recording mode lets reviewers scrub bundled CCTV clips with privacy-safe person overlays; Vercel still shows boxes, zones, camera switching, and detection context without requiring raw MP4 hosting.
- **Manager workflow UI**: separate views for executive dashboard, journey analytics, vision review, live operations, and store comparison instead of repeating the same cards everywhere.
- **Focused decision deck**: the dashboard keeps only high-value signals, with explanations and next actions instead of a noisy feature list.
- **Original funnel visual**: the funnel API remains Entry -> Zone Visit -> Billing Queue -> Purchase, while the React chart shows retention, per-stage loss, and overall conversion in a journey format.

## Product Modules

### 1. Detection Pipeline

The offline/edge pipeline processes CCTV clips and emits structured events:

- YOLOv8 person detection.
- ByteTrack multi-object tracking.
- Polygon zone classification from `data/store_layout.json`.
- Entry/exit line crossing.
- Billing queue joins and abandons.
- Staff filtering.
- Re-entry and cross-camera deduplication.
- JSONL output and optional live POST to the API.

### 2. Intelligence API

FastAPI receives events, stores them in SQLite, and exposes live analytics:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/events/ingest` | POST | Idempotent event ingestion, up to 500 events per batch |
| `/stores/{id}/metrics` | GET | visitors, conversion, dwell, queue depth, abandonment |
| `/stores/{id}/funnel` | GET | Entry -> Zone Visit -> Billing Queue -> Purchase |
| `/stores/{id}/heatmap` | GET | zone traffic and dwell intensity |
| `/stores/{id}/anomalies` | GET | operational alerts with suggested actions |
| `/cameras` | GET | camera metadata and stream paths |
| `/cameras/stream/{cam_id}` | GET | MJPEG YOLO stream for local/full-recording setups |
| `/simulation/start` | POST | replay demo events in real time |
| `/dashboard/stream` | GET | Server-Sent Events feed for live UI updates |
| `/health` | GET | database and feed freshness status |

### 3. React Command Center

The frontend is a Vite + React app organized around real store jobs:

- **Live Dashboard**: executive scan, KPI cards, six decision signals, narrative recommendation.
- **Journey Analytics**: traffic mix, dwell momentum, conversion gauge, risk matrix, outcome waterfall.
- **Vision Center**: camera playback, privacy-safe person overlays, thumbnails, local YOLO stream support, and previous-recording review.
- **Live Operations**: event feed, spatial floor map, brand attention, anomaly actions.
- **Store Comparison**: multi-store performance and network-level insights.

## Local Quick Start

Use the repo-level virtual environment if it already exists, or create your own.

```powershell
cd C:\Users\hiyas\Downloads\Purplle-tech-challenge-master\store-intelligence

# Backend
..\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In a second terminal:

```powershell
cd C:\Users\hiyas\Downloads\Purplle-tech-challenge-master\store-intelligence\frontend
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Open:

- Frontend: http://127.0.0.1:5173
- Backend docs: http://127.0.0.1:8000/docs
- Built-in dashboard: http://127.0.0.1:8000/dashboard

## Run the Simulation

The included `data/events.jsonl` can replay a full shopper journey without rerunning video inference.

```powershell
curl.exe -X POST "http://127.0.0.1:8000/simulation/start?speed=3.0&cam_id=CAM_1"
curl.exe -X POST "http://127.0.0.1:8000/simulation/speed?speed=5.0"
curl.exe -X POST "http://127.0.0.1:8000/simulation/stop"
```

## Run the Detection Pipeline

```powershell
cd C:\Users\hiyas\Downloads\Purplle-tech-challenge-master\store-intelligence
..\venv\Scripts\python.exe run_pipeline.py --clips-dir "C:\path\to\CCTV Footage" --output data/events.jsonl
```

Stream events directly to the API:

```powershell
..\venv\Scripts\python.exe run_pipeline.py --clips-dir "C:\path\to\CCTV Footage" --api-url http://127.0.0.1:8000
```

## Camera Behavior

| Environment | Behavior |
|-------------|----------|
| Localhost | Tries backend YOLO MJPEG stream first; falls back to bundled video if the stream is unavailable |
| Vercel | Plays real bundled CCTV `.webm` clips with AI overlay boxes and zones for reliable demos |
| Render backend with MP4s | Can stream full recordings if `VIDEO_DIR` points to uploaded camera files |

This keeps the demo reliable while still preserving the real local YOLO path.

## Test and Build

```powershell
# Backend tests
..\venv\Scripts\python.exe -m pytest

# Frontend build
cd frontend
npm.cmd run build
```

Current verification: **140 backend tests pass** and the frontend production build passes.

## Deployment

### Render Backend

Use `store-intelligence` as the service root.

| Setting | Value |
|---------|-------|
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| `DATABASE_URL` | `sqlite:///./data/store_intelligence.db` |
| `POS_CSV_PATH` | `data/pos_transactions.csv` |
| `FRONTEND_URL` | `https://storeintelligence.vercel.app` |
| `VIDEO_DIR` | optional, only if full MP4s are uploaded |

Live backend: https://store-intelligence-prr3.onrender.com

### Vercel Frontend

Use `frontend` as the root directory.

| Environment Variable | Value |
|----------------------|-------|
| `VITE_API_URL` | `https://store-intelligence-prr3.onrender.com` |

Live frontend: https://storeintelligence.vercel.app

## Project Structure

```text
store-intelligence/
  app/                 FastAPI API, metrics, funnel, heatmap, anomalies, SSE
  pipeline/            YOLO, ByteTrack, Re-ID, staff detection, zone logic
  frontend/            React Command Center and bundled camera clips
  data/                store layout, POS data, replay events
  tests/               API, pipeline, dashboard, metrics, edge-case tests
  docs/                product design, technical choices, deck, demo script
  detection_stream.py  standalone local YOLO MJPEG stream server
  run_pipeline.py      Windows-friendly pipeline runner
```

## Documentation

- [docs/DESIGN.md](docs/DESIGN.md): architecture and product design.
- [docs/CHOICES.md](docs/CHOICES.md): technical decision log.
- [frontend/README.md](frontend/README.md): frontend-specific notes.
