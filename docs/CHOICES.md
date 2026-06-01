# Technical Choices

This document explains the decisions that make APEX feel like a product rather than a collection of challenge endpoints.

## 1. Use Geometry for Zones, Not Another Model

### Choice

APEX uses normalized store-layout polygons and a point-in-polygon classifier to assign each shopper track to a zone.

### Why

Zone membership is deterministic once the camera is calibrated. Calling a vision-language model for every frame would be slow, expensive, and less repeatable. Geometry makes the system fast enough for replay and edge deployments.

### Product Impact

This enables live zone dwell, dead-zone detection, fixture-level pressure, and floor-map overlays without requiring custom model training.

## 2. Track Shoppers as Anonymous Sessions

### Choice

Use YOLO detections plus ByteTrack IDs, then add lightweight torso-color signatures for re-entry and cross-camera continuity.

### Why

The product needs journey continuity, but it should not identify people. Face recognition would be unnecessary and privacy-invasive. Anonymous track IDs and color signatures are enough to calculate operational metrics.

### Product Impact

Visitor counts are less inflated, re-entry can be handled, and the system stays privacy-first.

## 3. Filter Staff Before Calculating Metrics

### Choice

Use long-duration tracks and torso HSV color clustering to mark likely staff.

### Why

Staff repeatedly appear in the same cameras and often wear consistent colors. Counting them as customers corrupts conversion rate, dwell, and queue signals.

### Product Impact

APEX can claim shopper analytics, not just person analytics.

## 4. Correlate POS by Billing Presence

### Choice

When POS transactions have no customer ID, correlate purchases with shoppers recently present in the billing queue or counter zone.

### Why

`transactions / visitors` is easy but weak. Billing-zone correlation creates a behavioral link between camera events and POS outcomes.

### Product Impact

The conversion funnel becomes defensible:

Entry -> Zone Visit -> Billing Queue -> Purchase

## 5. Make the UI Workflow-Based

### Choice

Split the React app into five views:

- Live Dashboard
- Journey Analytics
- Vision Center
- Live Operations
- Store Comparison

### Why

Repeated KPI cards across every page make a product feel copied. Store teams need different views for different jobs: scan, diagnose, verify, act, compare.

### Product Impact

The app feels like a command center instead of a template dashboard.

## 6. Support Live and Previous Recording Camera Modes

### Choice

Localhost attempts the real YOLO MJPEG stream. Previous Recording mode lets reviewers inspect bundled CCTV clips with playback controls and jump buttons. Vercel uses the same clips with browser-rendered privacy-safe person overlays.

### Why

Vercel cannot run Python YOLO inference, and Render should not be forced to serve large raw MP4 files for a demo. But reviewers still need to see camera evidence and detection context.

### Product Impact

The demo is reliable on https://storeintelligence.vercel.app while still preserving the real local YOLO path for technical review and a safer recording-review path for product review.

## 7. Keep the Funnel Stages, Change the Visual

### Choice

The backend funnel remains Entry -> Zone Visit -> Billing Queue -> Purchase. The React UI renders those stages as a journey-retention chart with counts, retention, per-stage loss, and overall conversion.

### Why

The original trapezoid-style funnel looked too generic. Changing only the presentation keeps the analytics defensible while making the product feel more custom.

### Product Impact

Reviewers can understand drop-off quickly without feeling like they are looking at a copied dashboard chart.

## 8. Keep SQLite for Demo, Preserve PostgreSQL Path

### Choice

Use SQLite with SQLAlchemy for the deployed challenge/demo version.

### Why

The workload is event replay plus metric reads. SQLite is portable, easy to ship, and enough for the current data size. SQLAlchemy keeps the production migration clean.

### Production Path

For multi-store production:

- PostgreSQL or TimescaleDB for event history;
- Redis cache for hot metric reads;
- edge inference workers for camera processing;
- object storage for full camera recordings.

## 9. Return Actions, Not Just Alerts

### Choice

Anomaly responses include severity and suggested action.

### Why

Managers should not need to interpret raw queue depth or dwell tables under pressure. The system should say what changed and what to do next.

### Product Impact

APEX becomes an operations tool, not only an analytics viewer.

## Current Deployments

- Frontend: https://storeintelligence.vercel.app
- Backend: https://store-intelligence-prr3.onrender.com
- API docs: https://store-intelligence-prr3.onrender.com/docs
