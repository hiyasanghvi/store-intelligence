# Apex React Command Center

React + Vite frontend for APEX Store Intelligence.

Live app: https://storeintelligence.vercel.app  
Backend API: https://store-intelligence-prr3.onrender.com

## Product Goal

The frontend is designed as a manager command center, not a generic analytics dashboard. Each route answers a different store-operation question:

| View | Question It Answers |
|------|---------------------|
| Live Dashboard | What is happening right now? |
| Journey Analytics | Why are shoppers dropping off? |
| Vision Center | What does the camera evidence show? |
| Live Operations | What should staff do next? |
| Store Comparison | Which store needs attention first? |

## Key Experiences

### Live Dashboard

- KPI cards for visitors, conversion, queue, and abandonment.
- Six decision cards: Conversion Pulse, Queue Rescue, Zone Magnet, Alert Heat, Lost Basket Risk, and Evidence Sync.
- Each decision card now explains why the signal matters and the next action on hover/focus, so the deck stays useful instead of becoming a long feature list.
- The funnel keeps the same backend stages but renders as a journey-style retention chart with shopper loss and overall conversion summaries.
- Store Story Mode turns raw metrics into a readable manager summary.
- SSE Live / API Live connection badge with polling fallback.

### Journey Analytics

- Traffic mix pie.
- Dwell momentum bars.
- Conversion gauge.
- Queue vs engagement risk matrix.
- Shopper outcome waterfall.
- Timeline and zone heatmap.

### Vision Center

- Five real CCTV camera clips from `public/cameras`.
- Clickable camera thumbnails.
- Localhost mode: attempts the backend YOLO MJPEG stream first.
- Previous Recording mode: lets reviewers switch from live stream to the bundled CCTV recording, use native playback controls, and jump backward/forward.
- Vercel mode: uses reliable bundled CCTV clips with privacy-safe person boxes, zones, confidence labels, and detection status boxes.
- This keeps the deployed demo visually close to local YOLO without depending on Render to host large MP4 files or run expensive streaming inference.

### Live Operations

- Live CCTV event ticker.
- Spatial floor map based on Brigade Road fixture zones.
- Animated people dots and zone pressure.
- Brand attention grid.
- Operations action center driven by queue pressure, conversion risk, and anomalies.

### Store Comparison

- Side-by-side store metrics.
- Network insights.
- Per-store performance cards.

## Why It Does Not Look Like a Template

- Views are split by store-manager workflow, not by reused widgets.
- The floor map uses domain-specific fixture concepts: entry, billing queue, wall bays, center islands, PMU, impulse zones.
- Camera mode behaves differently by deployment environment so demos stay reliable.
- Vision Center is privacy-safe by design: person boxes and zone evidence are shown without face recognition.
- The UI surfaces business decisions, not only charts: staff movement, checkout protection, zone conversion leakage, and feed health.

## Local Development

```powershell
cd C:\Users\hiyas\Downloads\Purplle-tech-challenge-master\store-intelligence\frontend
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

The app uses `http://localhost:8000` automatically when opened from localhost.

## Production Build

```powershell
npm.cmd run build
```

## Vercel Deployment

Set:

```text
VITE_API_URL=https://store-intelligence-prr3.onrender.com
```

Root directory:

```text
frontend
```

Live deployment:

```text
https://storeintelligence.vercel.app
```

## Camera Assets

The deployed Vision Center uses these bundled clips:

- `public/cameras/CAM_1.webm`
- `public/cameras/CAM_2.webm`
- `public/cameras/CAM_3.webm`
- `public/cameras/CAM_4.webm`
- `public/cameras/CAM_5.webm`

They are compressed from the real CCTV recordings and are intentionally committed so Vercel always has playable camera evidence.
