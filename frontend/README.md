# Apex Retail Command Center

React + Vite frontend for the store-intelligence API.

## Views

- **Live Dashboard**: KPI scan, simulation controls, 5 winning feature cards, conversion funnel, brand attention, queue, confidence, and narrative insights.
- **Journey Analytics**: graph-first analysis with a traffic mix pie chart, dwell momentum bars, conversion gauge, risk matrix, and shopper outcome waterfall.
- **Vision Center**: CCTV feed playback and camera telemetry.
- **Live Operations**: CCTV event feed, animated Live Spatial Floor Map, all-brand attention grid, operations actions, anomalies, and confidence monitoring.
- **Store Comparison**: side-by-side store metrics.

## Five Winning Features

- **Conversion Pulse**: real-time conversion health.
- **Queue Rescue**: billing pressure score.
- **Zone Magnet**: current strongest shopper zone.
- **Alert Heat**: anomaly pressure in one card.
- **Coverage Live**: active shopper zone coverage.

## Analytics Graphs

- **Traffic Mix Pie**: visit distribution by zone.
- **Dwell Momentum Bars**: ranked dwell intensity.
- **Conversion Gauge**: live conversion with session lift.
- **Risk Matrix**: queue pressure vs engagement.
- **Shopper Outcome Waterfall**: entered, engaged, queued, and lost shoppers.

## Spatial Floor Map

The Live Spatial Floor Map is intentionally placed in **Live Operations**, not the dashboard. It sits beside the event feed and turns live dwell, visits, queue pressure, and animated people dots into:

- zone pressure across entry, skincare, haircare, fragrance, impulse, billing, queue, and wellness areas;
- fixture rankings for Brigade Road brand bays;
- a next-best staff move that switches to checkout protection when queue pressure rises;
- a compact all-brand attention grid similar to the original brand map, but cleaner.

The Brigade Road fixture model lives in `src/data/brigadeFloorPlan.ts`, while the rendering/scoring logic lives in `src/components/BrandMerchandisingMap.tsx`.

## Camera Deployment

The full CCTV recordings are too large to bundle with the Render backend by default. For Vercel demos, `public/cameras/` contains short compressed `.webm` clips generated from the actual CCTV files:

- `CAM_1.webm` from `CAM 3.mp4`
- `CAM_2.webm` from `CAM 2.mp4`
- `CAM_3.webm` from `CAM 1.mp4`
- `CAM_4.webm` from `CAM 4.mp4`
- `CAM_5.webm` from `CAM 5.mp4`

Vision Center plays these real bundled recordings directly from Vercel, so all five cameras stay clickable and visually distinct even when Render has no uploaded full MP4 files.

## Local Development

```bash
npm install
npm run dev
```

Build check:

```bash
npm run build
```
