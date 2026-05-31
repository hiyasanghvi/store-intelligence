# Apex Retail Store Intelligence

Offline retail stores generate massive customer behavior signals, but most of that information remains invisible. This project transforms CCTV-derived events into actionable retail intelligence through real-time analytics, anomaly detection, conversion tracking, and operational dashboards.

## North Star Metric

**Offline Store Conversion Rate**

Conversion Rate = Visitors who completed a purchase ÷ Total unique visitors

Every component of the system is designed either to improve the accuracy of this metric or make it more actionable.

---

## Architecture

```text
CCTV Events
     |
     v
Detection Pipeline
     |
     v
FastAPI Intelligence API
     |
     +---- Metrics
     +---- Funnel Analytics
     +---- Heatmaps
     +---- Anomalies
     |
     v
React Command Center
```

---

## Features

### Core Analytics

* Visitor Tracking
* Conversion Rate Monitoring
* Funnel Analysis
* Zone Heatmaps
* Queue Monitoring
* Anomaly Detection

### Advanced Intelligence

* Opportunity Radar
* Beauty Black Hole Detection
* Customer Archetype Analysis
* Multi-Store Comparison

---

## API Endpoints

### Metrics

```http
GET /stores/{store_id}/metrics
```

### Funnel

```http
GET /stores/{store_id}/funnel
```

### Heatmap

```http
GET /stores/{store_id}/heatmap
```

### Anomalies

```http
GET /stores/{store_id}/anomalies
```

### Health

```http
GET /health
```

---

## Running Locally

### Backend

```bash
python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend URL:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

---

### Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## Docker

```bash
docker compose up --build
```

---

## Dashboard

The project includes:

* FastAPI Live Dashboard
* React + TypeScript Command Center
* Real-time SSE Updates
* Interactive Funnel Analytics
* Interactive Heatmaps
* Store Comparison Views

---

## Technology Stack

Backend:

* FastAPI
* SQLAlchemy
* SQLite

Frontend:

* React
* TypeScript
* Vite

Infrastructure:

* Docker
* Docker Compose

---

## Repository Structure

```text
store-intelligence/
├── app/
├── frontend/
├── tests/
├── data/
├── README.md
├── DESIGN.md
├── CHOICES.md
└── docker-compose.yml
```

---

## Documentation

* DESIGN.md
* CHOICES.md

---

## Submission Notes

This implementation follows the challenge specification and focuses on delivering actionable insights around the North Star metric: Offline Store Conversion Rate.
