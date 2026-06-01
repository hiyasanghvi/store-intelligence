# Apex Store Intelligence Design

APEX is a privacy-first store intelligence system that converts ordinary CCTV into live operational decisions. It is built around one product idea: physical retail should have the same journey visibility that e-commerce teams already expect.

Live frontend: https://storeintelligence.vercel.app  
Live backend: https://store-intelligence-prr3.onrender.com

## System Shape

```text
CCTV clips / camera recordings
        |
        v
Detection pipeline
  YOLOv8 person detection
  ByteTrack tracking
  zone polygon classifier
  staff filtering
  re-entry and cross-camera matching
        |
        v
Structured events
  ENTRY, EXIT, ZONE_ENTER, ZONE_DWELL,
  BILLING_QUEUE_JOIN, BILLING_QUEUE_ABANDON
        |
        v
FastAPI intelligence service
  metrics, funnel, heatmap, anomalies,
  health, camera streams, simulation, SSE
        |
        v
React command center
  dashboard, journey analytics,
  vision center, live operations, comparison
```

## Detection Layer

### Person Detection

The pipeline uses YOLOv8 for person detection. The batch pipeline is optimized for accuracy on retail CCTV, while the live camera endpoint uses a lighter model path so local MJPEG streaming remains practical.

The system keeps low-confidence detections instead of silently dropping them. Confidence is stored as a first-class field because low-confidence events are still useful for audit, replay, and edge-case review.

### Tracking

ByteTrack turns frame-level detections into continuous track IDs. This is important because APEX does not care about a single frame; it cares about a shopper journey across time.

Tracking powers:

- unique visitor estimation;
- line crossing for entry and exit;
- zone dwell duration;
- billing queue entry and abandonment;
- session sequence numbers for replay.

### Zone Intelligence

Zones are defined as normalized polygons in `data/store_layout.json`. The classifier uses point-in-polygon logic against each bounding-box centroid, so it is fast, deterministic, and resolution independent.

This is deliberately not a vision-language model call. Zone assignment needs to run on thousands of frames, so geometry is the right hot-path tool.

### Staff Filtering

Retail staff can destroy customer metrics if they are counted as shoppers. APEX uses two signals:

- long-duration tracks that persist across much of a clip;
- torso HSV color signatures that often identify uniform-like movement.

The event schema carries `is_staff`, and metric queries filter staff out.

### Re-Entry and Cross-Camera Matching

The tracker stores a compact torso color signature. If a similar signature appears again within the configured time window, APEX treats that as a continuing or returning shopper instead of blindly creating a new visitor.

This keeps the visitor count more honest when shoppers leave frame, cross camera boundaries, or re-enter.

## API Layer

FastAPI exposes both analytics and live operations primitives:

- event ingestion with idempotent `event_id` handling;
- real-time metric queries;
- funnel computation;
- zone heatmaps;
- anomaly detection;
- feed health;
- simulation controls;
- SSE stream for live dashboard updates;
- camera metadata and MJPEG stream endpoints.

SQLite is used for the challenge/demo version because it is simple, portable, and reliable for replay workloads. SQLAlchemy keeps the migration path to PostgreSQL straightforward.

## Business Logic

### Conversion

The POS data does not contain a customer ID, so conversion is inferred using time-window correlation. If a shopper was present in billing queue or billing counter shortly before a transaction, the system treats that shopper as converted.

This is stronger than `transactions / visitors` because it links conversion to actual store behavior.

### Funnel

The funnel has four stages:

1. Entry
2. Zone Visit
3. Billing Queue
4. Purchase

Drop-off percentages are calculated between adjacent stages.

The React command center keeps those same backend stages and renders them as a journey-retention chart. Each row shows shopper count, retention from entry, loss from the previous stage, and the final overall conversion summary.

### Anomalies

APEX surfaces operational problems instead of forcing managers to inspect raw data:

- billing queue spike;
- conversion drop;
- dead zone;
- stale feed.

Each anomaly includes severity and a suggested action.

## Frontend Design

The frontend avoids a copied dashboard feel by separating workflows:

| View | Job |
|------|-----|
| Live Dashboard | executive scan and current store pulse |
| Journey Analytics | explain shopper movement and drop-off |
| Vision Center | camera evidence and AI overlays |
| Live Operations | next staff move and floor pressure |
| Store Comparison | compare stores side by side |

The Live Dashboard decision deck is intentionally limited to the highest-signal cards: Conversion Pulse, Queue Rescue, Zone Magnet, Alert Heat, Lost Basket Risk, and Evidence Sync. Each card exposes a short explanation and next action on hover/focus, which makes the feature set defensible instead of decorative.

## Vision Center Design

Camera behavior is environment-aware:

- **Localhost**: tries the backend YOLO MJPEG stream first.
- **Previous Recording**: lets reviewers switch from live stream to bundled CCTV playback, use native controls, and jump backward or forward with overlays still visible.
- **Vercel**: plays bundled real CCTV clips and draws privacy-safe person boxes, confidence labels, zone overlays, and detection status boxes in the browser.
- **Render with full MP4s**: can stream backend recordings if `VIDEO_DIR` is configured.

This design keeps the public demo reliable while still showing the local real-YOLO capability.

## Product Differentiators

- Privacy-first journey intelligence without face recognition.
- POS-aware offline conversion analytics.
- Staff exclusion built into the metric layer.
- Re-entry protection to reduce inflated visitor counts.
- Live operations recommendations, not only charts.
- Deployment-safe camera evidence with local YOLO and cloud overlay modes.
- Test-covered backend behavior across ingestion, metrics, funnel, anomalies, pipeline logic, and dashboard streaming.

## Production Path

For a production rollout:

- move SQLite to PostgreSQL or TimescaleDB;
- add Redis caching for hot metric reads;
- run YOLO on edge hardware near the cameras;
- push event batches to the API instead of raw video;
- use persistent object storage for long-term camera evidence;
- connect anomaly actions to workforce or alerting tools.
