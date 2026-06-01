# Demo Video Script

Target length: 3 to 4 minutes.

Live frontend: https://storeintelligence.vercel.app  
Live backend: https://store-intelligence-prr3.onrender.com

## 0:00 - 0:20 Hook

**Screen**: Open https://storeintelligence.vercel.app

**Voiceover**

"Physical retail has a data gap. Online stores know every click, but offline teams often only know how many people entered and what was sold. APEX Store Intelligence fills that gap by turning normal CCTV into live shopper journey analytics."

## 0:20 - 0:50 Architecture

**Screen**: Show `docs/DESIGN.md`

**Voiceover**

"The system has four layers. The detection pipeline runs YOLO and ByteTrack on CCTV clips. The event layer converts tracks into entries, zone visits, queue joins, abandons, and purchases. The FastAPI backend computes metrics, funnel, heatmap, anomalies, and health. The React command center turns that into decisions for store teams."

## 0:50 - 1:25 Dashboard

**Screen**: Live Dashboard

**Voiceover**

"The dashboard is an executive scan. We show visitors, conversion rate, checkout queue, and abandonment. The decision deck now focuses only on the signals that matter: Conversion Pulse, Queue Rescue, Zone Magnet, Alert Heat, Lost Basket Risk, and Evidence Sync. Each card explains why it matters and what action to take, so it feels like a manager workflow instead of a feature dump."

## 1:25 - 1:55 Journey Analytics

**Screen**: Journey Analytics

**Voiceover**

"Journey Analytics explains why the numbers changed. Traffic mix, dwell momentum, conversion gauge, risk matrix, waterfall, timeline, heatmap, and the journey-style funnel show where shoppers engage, where they drop off, and how much traffic survives each stage."

## 1:55 - 2:25 Vision Center

**Screen**: Vision Center on Vercel, then optionally localhost

**Voiceover**

"Vision Center provides camera evidence. In local mode, the app can show the real backend YOLO MJPEG stream with boxes and zones. Reviewers can also switch to Previous Recording mode, scrub the bundled CCTV clip, and jump backward or forward while seeing privacy-safe person boxes and zones. In the public Vercel demo, this keeps the camera proof reliable without hosting large MP4 recordings or running cloud YOLO inference."

## 2:25 - 2:55 Live Operations

**Screen**: Live Operations

**Voiceover**

"Live Operations turns analytics into floor action. The event feed, spatial floor map, brand attention grid, and action center show where staff should move. If queue pressure rises, the recommendation shifts from assisted selling to checkout protection."

## 2:55 - 3:20 API

**Screen**: Swagger docs or terminal

```powershell
curl.exe https://store-intelligence-prr3.onrender.com/health
curl.exe https://store-intelligence-prr3.onrender.com/stores/STORE_BLR_002/metrics
curl.exe https://store-intelligence-prr3.onrender.com/stores/STORE_BLR_002/funnel
```

**Voiceover**

"The backend exposes clean REST endpoints for health, metrics, funnel, heatmap, anomalies, cameras, and simulation. Event ingestion is idempotent, and updates stream to the UI over Server-Sent Events with polling fallback."

## 3:20 - 3:45 Technical Differentiators

**Screen**: `docs/CHOICES.md`

**Voiceover**

"The important engineering decisions are privacy and usefulness. There is no face recognition. Staff are filtered before calculating customer metrics. Re-entry matching reduces inflated visitor counts. POS transactions are correlated with billing-zone presence, making offline conversion more meaningful than a simple transaction ratio."

## 3:45 - 4:00 Close

**Screen**: Frontend and backend live URLs

**Voiceover**

"APEX is a deployed, test-covered CCTV-to-decision platform for retail stores: live analytics, camera evidence, and actionable operations in one product."

## Recording Checklist

- Use the live frontend: https://storeintelligence.vercel.app
- Show the API docs: https://store-intelligence-prr3.onrender.com/docs
- Mention that localhost supports real YOLO stream.
- Mention that Previous Recording mode supports playback review.
- Mention that Vercel uses real CCTV clips with browser-rendered, privacy-safe person overlays for reliability.
- Show at least one API response.
- Show the Vision Center camera switching.
