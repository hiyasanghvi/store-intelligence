# Presentation Deck Outline

Use this as the structure for a concise product and engineering presentation.

Live demo:

- Frontend: https://storeintelligence.vercel.app
- Backend: https://store-intelligence-prr3.onrender.com
- API docs: https://store-intelligence-prr3.onrender.com/docs

## Slide 1: Apex Store Intelligence

**Message**: Turning CCTV into a live operating system for physical retail.

**Visual**: Vision Center or Live Dashboard screenshot.

**Speaker note**: APEX gives physical stores the journey visibility that online stores already have: where shoppers enter, where they dwell, when queues build, and where conversion is lost.

## Slide 2: The Retail Blind Spot

**Problem**

- Online teams track every click.
- Physical stores usually know only footfall and POS.
- The journey between entry and purchase is invisible.
- Staff allocation is reactive instead of data-driven.

**Speaker note**: The missing layer is not more dashboards. It is a system that turns existing camera infrastructure into live operational signals.

## Slide 3: Product Demo Map

**Show**

- Live Dashboard for executive pulse.
- Journey Analytics for drop-off explanation.
- Vision Center for camera proof.
- Live Operations for staff movement.
- Store Comparison for network view.

**Speaker note**: The app is split by manager workflow, not by copied widgets.

## Slide 4: Computer Vision Pipeline

**Flow**

```text
CCTV -> YOLOv8 -> ByteTrack -> zone classifier -> event schema -> API
```

**Important details**

- anonymous track IDs;
- no face recognition;
- staff filtering;
- re-entry protection;
- billing queue and abandonment events.

**Speaker note**: The core product value is not a bounding box. It is converting bounding boxes into clean retail events.

## Slide 5: The Unique Intelligence Layer

**Features to highlight**

- POS-aware conversion using billing-zone correlation.
- Staff-excluded shopper metrics.
- Re-entry aware visitor counting.
- Heatmaps with dwell and visit pressure.
- Journey-style funnel visualization with retention and per-stage loss.
- Focused decision cards with why-it-matters explanations and next actions.
- Anomaly suggestions for queue spikes, dead zones, conversion drops, and stale feeds.

**Speaker note**: These are the decisions that make the product useful to a store manager, not just impressive as a CV demo.

## Slide 6: Vision Center

**Show**

- Localhost: real YOLO MJPEG stream with boxes and zones.
- Previous Recording: review bundled CCTV clips with playback controls and jump buttons.
- Vercel: bundled real CCTV clips with privacy-safe person overlays.

**Why this matters**

- Public demo is reliable.
- Technical reviewer can still run real YOLO locally.
- Reviewers can inspect previous footage without needing backend streaming.
- Full raw MP4 hosting is optional, not a blocker.

**Speaker note**: The deployed camera experience is intentionally robust. It does not depend on cloud inference cold starts to prove the product.

## Slide 7: Live Operations

**Show**

- event ticker;
- spatial floor map;
- brand attention;
- next-best staff move;
- anomaly action center.

**Speaker note**: Live Operations is where the analytics become action. Queue pressure changes the recommendation from selling assistance to checkout protection.

## Slide 8: API and Reliability

**Show**

- `/docs`
- `/health`
- `/stores/STORE_BLR_002/metrics`
- `/stores/STORE_BLR_002/funnel`
- tests passing.

**Points**

- idempotent ingestion;
- graceful health state;
- SSE plus polling fallback;
- 140 backend tests passing;
- frontend production build passing.

## Slide 9: Production Path

**Current**

- FastAPI on Render.
- React on Vercel.
- SQLite for demo-scale event replay.
- Bundled camera clips for public demo.

**Scale path**

- edge inference workers;
- PostgreSQL or TimescaleDB;
- Redis metric cache;
- object storage for recordings;
- workforce integration for recommended actions.

## Slide 10: Closing

**Message**

APEX is a privacy-first retail intelligence layer that converts standard cameras into measurable shopper journeys and actionable store operations.
