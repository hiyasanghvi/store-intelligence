"""
dashboard.py — Live dashboard with Server-Sent Events (SSE) for real-time updates.

Serves a full HTML dashboard at /dashboard that auto-updates as events
are ingested. Uses SSE (no WebSocket dependency needed).
"""

import json
import asyncio
import logging
from datetime import datetime, timezone
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.metrics import get_store_metrics
from app.models import Event
from sqlalchemy import func, distinct

log = logging.getLogger(__name__)
router = APIRouter()

# In-memory SSE broadcast channel
_sse_subscribers: list[asyncio.Queue] = []


async def broadcast_update(data: dict):
    """Push a metric update to all connected SSE clients."""
    for queue in _sse_subscribers:
        try:
            queue.put_nowait(data)
        except asyncio.QueueFull:
            pass


@router.get("/dashboard", response_class=HTMLResponse, tags=["dashboard"])
async def dashboard_page():
    """Serve the live dashboard HTML page."""
    return HTMLResponse(content=DASHBOARD_HTML)


@router.get("/dashboard/stream", tags=["dashboard"])
async def dashboard_stream(request: Request, db: Session = Depends(get_db)):
    """SSE endpoint — streams live metric updates to the dashboard."""

    queue: asyncio.Queue = asyncio.Queue(maxsize=50)
    _sse_subscribers.append(queue)

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            # Send initial snapshot
            stores = [
                sid
                for (sid,) in db.query(distinct(Event.store_id)).all()
            ]
            for store_id in stores:
                try:
                    metrics = get_store_metrics(store_id, db)
                    payload = {
                        "type": "metrics",
                        "store_id": store_id,
                        "data": metrics.model_dump(),
                    }
                    yield f"data: {json.dumps(payload)}\n\n"
                except Exception as e:
                    log.warning(f"Failed to get initial metrics for {store_id}: {e}")

            # Stream updates
            while True:
                if await request.is_disconnected():
                    break
                try:
                    update = await asyncio.wait_for(queue.get(), timeout=4.0)
                    yield f"data: {json.dumps(update)}\n\n"
                except asyncio.TimeoutError:
                    # Send heartbeat to keep connection alive
                    yield ": heartbeat\n\n"
        finally:
            if queue in _sse_subscribers:
                _sse_subscribers.remove(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


DASHBOARD_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Store Intelligence Dashboard - Apex Retail Intelligence Command Center</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  :root {
  --bg: #faf7ff;

  --surface: #ffffff;
  --surface2: #f7f1ff;

  --border: #e9ddff;

  --accent: #8b5cf6;
  --accent2: #d946ef;

  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;

  --text: #1f2937;
  --text2: #6b7280;

  --shadow: 0 8px 24px rgba(139, 92, 246, 0.08);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
  font-family: 'Inter', sans-serif;
  background:
      radial-gradient(circle at top left, #fdf4ff 0%, transparent 35%),
      radial-gradient(circle at top right, #eef2ff 0%, transparent 35%),
      linear-gradient(180deg, #faf7ff 0%, #f4edff 100%);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
  }

  .header {
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);

  padding: 24px 36px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  position: sticky;
  top: 0;
  z-index: 100;

  box-shadow: var(--shadow);
  }

  .header h1 {
  font-size: 1.8rem;
  font-weight: 800;

  background: linear-gradient(
      90deg,
      #7c3aed,
      #d946ef
  );

  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  }

  .status-badge {
  background: white;

  border: 1px solid var(--border);

  padding: 10px 16px;

  border-radius: 999px;

  display: flex;
  align-items: center;
  gap: 8px;

  box-shadow: var(--shadow);
  }

  .status-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--success);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .container {
  padding: 40px;
  max-width: 1500px;
  margin: 0 auto;
  }

  .stores-grid {
  display: grid;
  grid-template-columns:repeat(auto-fit, minmax(720px, 1fr));
  gap: 28px;
  }

  .store-card {
  background: rgba(255,255,255,0.95);

  border: 1px solid var(--border);

  border-radius: 24px;

  overflow: hidden;

  box-shadow: var(--shadow);

  transition: all .3s ease;
  }

  .store-card:hover {
  transform: translateY(-4px);

  box-shadow:
      0 16px 40px rgba(139,92,246,0.15);
      }

  .store-card.updated {
    border-color: var(--accent);
    animation: flash 0.5s ease;
  }

  @keyframes flash {
    0% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); }
    100% { box-shadow: 0 0 0 12px rgba(124, 58, 237, 0); }
  }

  .store-header {
  background:
      linear-gradient(
          135deg,
          #fdf4ff,
          #eef2ff
      );

  padding: 24px;

  border-bottom: 1px solid var(--border);

  display: flex;
  justify-content: space-between;
  align-items: center;
  }

  .store-id {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--accent2);
    text-transform: uppercase;
  }

  .store-name {
    font-size: 1.1rem;
    font-weight: 600;
    margin-top: 4px;
  }

  .last-update {
    font-size: 0.75rem;
    color: var(--text2);
  }

  .metrics-grid {
  display: grid;

  grid-template-columns:
      repeat(2, 1fr);

  gap: 16px;

  padding: 24px;

  background: transparent;
  }

  .metric-box {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 20px;
  transition: all .25s ease;
  }

  .metric-box:hover {
  transform: scale(1.02);
  }

  .metric-label {
    font-size: 0.72rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text2);
    margin-bottom: 8px;
  }

  .metric-value {
  font-size: 2.3rem;
  font-weight: 800;
  line-height: 1;
  }

  .metric-value.visitors { color: var(--accent2); }
  .metric-value.conversion { color: var(--success); }
  .metric-value.queue { color: var(--warning); }
  .metric-value.abandon { color: var(--danger); }

  .metric-sub {
    font-size: 0.72rem;
    color: var(--text2);
    margin-top: 4px;
  }

  .zones-section {
  padding: 24px;

  background: #fcfaff;

  border-top: 1px solid var(--border);
  }

  .zones-title {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text2);
    margin-bottom: 14px;
  }

  .zone-bar-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }

  .zone-label {
    width: 130px;
    font-size: 0.78rem;
    color: var(--text2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .zone-bar-track {
  flex: 1;

  height: 10px;

  background: #ede9fe;

  border-radius: 999px;

  overflow: hidden;
  }

  .zone-bar-fill {
  height: 100%;

  border-radius: 999px;

  background:
      linear-gradient(
          90deg,
          #8b5cf6,
          #d946ef
      );

  transition: width .6s ease;
  }

  .zone-dwell {
    width: 60px;
    font-size: 0.75rem;
    color: var(--text2);
    text-align: right;
  }

  .no-data {
    text-align: center;
    padding: 60px;
    color: var(--text2);
  }

  .no-data-icon { font-size: 3rem; margin-bottom: 12px; }

  .ticker {
    background: var(--surface2);
    border-top: 1px solid var(--border);
    padding: 10px 24px;
    font-size: 0.8rem;
    color: var(--text2);
    overflow: hidden;
  }

  #ticker-text {
    display: inline-block;
    animation: marquee 20s linear infinite;
    white-space: nowrap;
  }

  @keyframes marquee {
    0% { transform: translateX(100vw); }
    100% { transform: translateX(-100%); }
  }
  .feature-grid{
  display:flex;
  gap:18px;
}

.feature-card{
  flex:1;
}
  .feature-card{
  background:white;
  border:1px solid var(--border);
  border-radius:18px;
  padding:18px;
  box-shadow:var(--shadow);
  transition:.25s ease;
  }
  .feature-card:hover{
  transform:translateY(-3px);
  }
  .feature-title{
  font-size:.75rem;
  text-transform:uppercase;
  letter-spacing:.08em;
  color:var(--accent);
  font-weight:700;
  margin-bottom:12px;
  }
  .feature-main{
  font-size:1.2rem;
  font-weight:700;
  margin-bottom:10px;
  }
  .feature-meta{
  color:var(--text2);
  font-size:.85rem;
  margin-top:6px;
  }
  @media(max-width:1100px){
  .feature-grid{
    grid-template-columns:1fr;
  }
}
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>🟣 Apex Retail Intelligence Command Center</h1>
    <div style="font-size:0.78rem; color:var(--text2); margin-top:4px;">AI-Powered Shopper Journey Intelligence Platform</div>
  </div>
  <div class="status-badge">
    <div class="status-dot" id="conn-dot"></div>
    <span id="conn-label">Connecting...</span>
  </div>
</div>

<div class="container">
  <div class="stores-grid" id="stores-grid">
    <div class="no-data">
      <div class="no-data-icon">📡</div>
      <div>Waiting for event stream...</div>
      <div style="margin-top:8px; font-size:0.78rem;">Run the detection pipeline to see live metrics</div>
    </div>
  </div>
</div>

<div class="ticker">
  <span id="ticker-text">Live store intelligence feed — Apex Retail Analytics Platform</span>
</div>

<script>
const storeData = {};
let eventSource;
let reconnectDelay = 1000;

function connect() {
  eventSource = new EventSource('/dashboard/stream');

  eventSource.onopen = () => {
    document.getElementById('conn-dot').style.background = 'var(--success)';
    document.getElementById('conn-label').textContent = 'Live';
    reconnectDelay = 1000;
  };

  eventSource.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'metrics') {
        storeData[msg.store_id] = msg.data;
        renderStores();
        flashCard(msg.store_id);
        updateTicker(msg.store_id, msg.data);
      }
    } catch(err) { console.warn('Parse error', err); }
  };

  eventSource.onerror = () => {
    document.getElementById('conn-dot').style.background = 'var(--danger)';
    document.getElementById('conn-label').textContent = 'Reconnecting...';
    eventSource.close();
    setTimeout(connect, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
  };
}

function renderStores() {
  const grid = document.getElementById('stores-grid');
  const stores = Object.keys(storeData);
  if (!stores.length) return;

  grid.innerHTML = stores.map(sid => {
    const m = storeData[sid];
    const opportunity = m.opportunity_radar;
    const blackHole = m.beauty_black_hole;
    const personas = m.customer_archetypes || [];
    const convPct = (m.conversion_rate * 100).toFixed(1);
    const abandonPct = (m.abandonment_rate * 100).toFixed(1);
    const convColor = m.conversion_rate < 0.1 ? 'var(--danger)' : m.conversion_rate < 0.2 ? 'var(--warning)' : 'var(--success)';
    
    const zoneRows = (m.avg_dwell_per_zone || []).map(z => {
      const maxDwell = Math.max(...(m.avg_dwell_per_zone || []).map(x => x.avg_dwell_seconds), 1);
      const barPct = Math.round(z.avg_dwell_seconds / maxDwell * 100);
      const badge =
  z.avg_dwell_seconds >= 25 ? '🔥' :
  z.avg_dwell_seconds >= 21 ? '🌤' :
  '❄️';

return `<div class="zone-bar-row">
  <div class="zone-label">
    ${badge} ${z.zone_id}
  </div>

  <div class="zone-bar-track">
    <div class="zone-bar-fill"
         style="width:${barPct}%">
    </div>
  </div>

  <div class="zone-dwell">
    ${z.avg_dwell_seconds.toFixed(0)}s
  </div>
</div>`;
    }).join('');
    const opportunityCard = opportunity ? `
<div class="feature-card">
  <div class="feature-title">🎯 Opportunity Radar</div>
  <div class="feature-main">${opportunity.zone}</div>
  <div class="feature-meta">
    Priority Score: ${opportunity.priority_score}
  </div>
  <div class="feature-meta">
    Potential Gain: ${opportunity.potential_gain}
  </div>
</div>` : '';

const blackHoleCard = blackHole ? `
<div class="feature-card">
  <div class="feature-title">🕳 Beauty Black Hole</div>
  <div class="feature-main">${blackHole.zone}</div>
  <div class="feature-meta">
    Lost Visitors: ${blackHole.lost_visitors}
  </div>
  <div class="feature-meta">
    Risk: ${blackHole.risk_level}
  </div>
</div>` : '';

const personaCard = personas.length ? `
<div class="feature-card">
  <div class="feature-title">👩 Shopper Personas</div>
  ${personas.map(p => `
    <div class="feature-meta">
      ${p.archetype} — ${p.percentage}%
    </div>
  `).join('')}
</div>` : '';
const insightCard = `
<div class="feature-card">
  <div class="feature-title">🧠 Today's AI Insight</div>

  <div class="feature-main">
    Customers show strongest engagement in
    ${blackHole ? blackHole.zone : 'high-interest zones'}.
  </div>

  <div class="feature-meta">
    Potential conversion leakage detected.
  </div>

  <div class="feature-meta">
    Recommended Action:
    Increase advisor presence near
    ${opportunity ? opportunity.zone : 'priority areas'}.
  </div>
</div>
`;
    

    return `<div class="store-card" id="card-${sid}">
      <div class="store-header">
        <div>
          <div class="store-id">${sid}</div>
          <div class="store-name">📍 ${sid.replace('STORE_', '').replace('_', ' — ')}</div>
        </div>
        <div class="last-update">Updated ${new Date(m.computed_at).toLocaleTimeString()}</div>
      </div>
      <div class="metrics-grid">
        <div class="metric-box">
          <div class="metric-label">👥 Visitors</div>
          <div class="metric-value visitors">${m.unique_visitors}</div>
          <div class="metric-sub">unique today</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">💳 Conversion</div>
          <div class="metric-value conversion" style="color:${convColor}">${convPct}%</div>
          <div class="metric-sub">purchased / visited</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">🧾 Queue Depth</div>
          <div class="metric-value queue">${m.queue_depth}</div>
          <div class="metric-sub">billing queue now</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">🚪 Abandon Rate</div>
          <div class="metric-value abandon">${abandonPct}%</div>
          <div class="metric-sub">queue abandonment</div>
        </div>
      </div>

<div class="feature-grid">
  ${opportunityCard}
  ${blackHoleCard}
  ${personaCard}
  ${insightCard}
</div>

${zoneRows ? `<div class="zones-section">
        <div class="zones-title">Zone Dwell Time</div>
        ${zoneRows}
      </div>` : ''}
    </div>`;
  }).join('');
}

function flashCard(storeId) {
  const card = document.getElementById(`card-${storeId}`);
  if (!card) return;
  card.classList.add('updated');
  setTimeout(() => card.classList.remove('updated'), 600);
}

function updateTicker(storeId, m) {
  const ticker = document.getElementById('ticker-text');
  ticker.textContent = `${storeId} — Visitors: ${m.unique_visitors} | Conversion: ${(m.conversion_rate*100).toFixed(1)}% | Queue: ${m.queue_depth} | Abandon: ${(m.abandonment_rate*100).toFixed(1)}% — Updated ${new Date().toLocaleTimeString()}`;
}

connect();
</script>
</body>
</html>"""
