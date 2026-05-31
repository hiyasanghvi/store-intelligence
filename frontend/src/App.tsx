import React, { useState, useEffect } from 'react';
import './App.css';
import { useStoreSSE, getApiUrl } from './hooks/useStoreSSE';
import TopBar from './components/Header';
import MetricCard from './components/MetricCard';
import FunnelChart from './components/FunnelChart';
import type { FunnelStage } from './components/FunnelChart';
import HeatmapChart from './components/HeatmapChart';
import AnomaliesLog from './components/AnomaliesLog';
import type { Anomaly } from './components/AnomaliesLog';
import QueueTelemetry from './components/QueueTelemetry';
import VisitorTimeline from './components/VisitorTimeline';
import LiveEventTicker from './components/LiveEventTicker';
import StoreComparison from './components/StoreComparison';
import InsightCards from './components/InsightCards';
import CameraFeed from './components/CameraFeed';
import OpportunityRadar from './components/OpportunityRadar';
import BeautyBlackHole from './components/BeautyBlackHole';
import CustomerArchetypes from './components/CustomerArchetypes';

const API_BASE = getApiUrl();
const DEFAULT_STORE = 'STORE_BLR_002';
const STORE_IDS = ['STORE_BLR_002', 'ST1008'];

type ViewId = 'dashboard' | 'analytics' | 'events' | 'comparison' | 'cameras';

const NavIcons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  events: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  comparison: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  cameras: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
};

export const App: React.FC = () => {
  const [selectedStore, setSelectedStore] = useState<string>(DEFAULT_STORE);
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [speed, setSpeed] = useState(1.0);

  const handleSpeedChange = async (newSpeed: number) => {
    setSpeed(newSpeed);
    try {
      await fetch(`${API_BASE}/simulation/speed?speed=${newSpeed}`, { method: 'POST' });
    } catch (err) {
      console.warn('Failed to change simulation speed:', err);
    }
  };

  const handleRestartSimulation = async () => {
    try {
      await fetch(`${API_BASE}/simulation/start?speed=${speed}&cam_id=CAM_1`, { method: 'POST' });
    } catch (err) {
      console.warn('Failed to restart simulation:', err);
    }
  };

  useEffect(() => {
    async function autoStart() {
      try {
        await fetch(`${API_BASE}/simulation/start?speed=3.0&cam_id=CAM_1`, { method: 'POST' });
      } catch (err) {
        console.warn('Failed to auto-start simulation:', err);
      }
    }
    autoStart();
  }, [API_BASE]);

  const { storesData, connectionStatus, lastUpdatedStore, metricHistory, metricDeltas } = useStoreSSE(API_BASE);

  useEffect(() => {
    let active = true;

    async function fetchAdditionalTelemetry() {
      try {
        const [funnelResp, anomResp] = await Promise.all([
          fetch(`${API_BASE}/stores/${selectedStore}/funnel`),
          fetch(`${API_BASE}/stores/${selectedStore}/anomalies`),
        ]);
        if (funnelResp.ok && active) {
          const d = await funnelResp.json();
          setFunnelData(d.stages ?? []);
        }
        if (anomResp.ok && active) {
          const d = await anomResp.json();
          setAnomalies(d.anomalies ?? []);
        }
      } catch {
        // API unreachable
      }
    }

    fetchAdditionalTelemetry();
    const interval = setInterval(fetchAdditionalTelemetry, 5000);
    return () => { active = false; clearInterval(interval); };
  }, [selectedStore, lastUpdatedStore]);

  const activeMetrics = storesData[selectedStore] ?? {
    store_id: selectedStore,
    unique_visitors: 0,
    conversion_rate: 0.0,
    avg_dwell_per_zone: [],
    queue_depth: 0,
    abandonment_rate: 0.0,
    computed_at: new Date().toISOString(),
  };

  const activeHistory = metricHistory[selectedStore];
  const activeDeltas = metricDeltas[selectedStore];
  const isFlashed = lastUpdatedStore === selectedStore;

  return (
    <div className="app-shell">

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo-mark">
            <div className="logo-gem">
              <svg viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <div className="sidebar-title">APEX</div>
            </div>
          </div>
          <div className="sidebar-subtitle">Retail Intelligence Hub</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>

          {(
            [
              { id: 'dashboard',  label: 'Live Dashboard' },
              { id: 'analytics',  label: 'Journey Analytics' },
              { id: 'cameras',    label: 'Vision Center' },
              { id: 'events',     label: 'Live Operations' },
              { id: 'comparison', label: 'Store Comparison' },
            ] as const
          ).map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveView(item.id)}
            >
              {NavIcons[item.id]}
              {item.label}

              {item.id === 'cameras' && (
                <span style={{
                  marginLeft: 'auto',
                  background: 'rgba(16,185,129,0.1)',
                  color: '#065f46',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: '999px',
                  fontSize: '0.56rem',
                  fontWeight: 800,
                  padding: '1px 7px',
                  letterSpacing: '0.04em',
                }}>
                  5 CAMS
                </span>
              )}

              {item.id === 'events' && anomalies.length > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: 'rgba(244,63,94,0.08)',
                  color: '#881337',
                  border: '1px solid rgba(244,63,94,0.2)',
                  borderRadius: '999px',
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  padding: '1px 7px',
                }}>
                  {anomalies.length}
                </span>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="store-selector-label">Active Store</div>
          <select
            className="store-select"
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
          >
            {STORE_IDS.map((id) => (
              <option key={id} value={id}>
                {id.replace('STORE_', '').replace(/_/g, ' — ')}
              </option>
            ))}
          </select>

          <div className={`conn-badge ${connectionStatus}`}>
            <div className="conn-dot" />
            {connectionStatus === 'live'         && 'SSE Live'}
            {connectionStatus === 'connecting'   && 'Connecting...'}
            {connectionStatus === 'error'        && 'Reconnecting'}
            {connectionStatus === 'disconnected' && 'Offline'}
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="main-content">
        <TopBar
          activeView={activeView}
          storeId={selectedStore}
          lastUpdated={lastUpdatedStore}
        />

        <div className="page-body">

          {/* ═══════════════════ DASHBOARD VIEW ═══════════════════ */}
          {activeView === 'dashboard' && (
            <>
              {/* Simulation Control Bar */}
              <div className="panel-card" style={{
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                background: 'linear-gradient(135deg, #fdf4ff, #ede9fe)',
                borderColor: 'rgba(139,92,246,0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 8px rgba(16,185,129,0.5)',
                    display: 'inline-block',
                    animation: 'breathe 2s ease-in-out infinite',
                  }} />
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#4c1d95',
                    letterSpacing: '0.06em',
                  }}>
                    ⚡ LIVE SYNCHRONIZED SIMULATION
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleRestartSimulation}
                    style={{
                      border: '1px solid rgba(139,92,246,0.3)',
                      color: '#6d28d9',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      transition: 'all 0.15s',
                    }}
                  >
                    🔄 Sync & Restart
                  </button>
                  <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600 }}>Speed:</span>
                  {[0.5, 1.0, 2.0, 5.0, 10.0].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSpeedChange(s)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: speed === s ? '#8b5cf6' : 'white',
                        color: speed === s ? 'white' : '#6b7280',
                        border: speed === s ? '1px solid #8b5cf6' : '1px solid rgba(139,92,246,0.18)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        boxShadow: speed === s ? '0 2px 8px rgba(139,92,246,0.25)' : 'none',
                      }}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* KPI Cards */}
              <div className="kpi-grid">
                <MetricCard
                  title="Total Visitors"
                  value={activeMetrics.unique_visitors}
                  subtext="Unique customer entries"
                  type="visitors"
                  glow={isFlashed}
                  delta={activeDeltas?.unique_visitors}
                  history={activeHistory?.unique_visitors}
                />
                <MetricCard
                  title="Conversion Rate"
                  value={`${(activeMetrics.conversion_rate * 100).toFixed(1)}%`}
                  subtext="Visits → purchases"
                  type="conversion"
                  glow={isFlashed}
                  delta={activeDeltas?.conversion_rate}
                  history={activeHistory?.conversion_rate}
                />
                <MetricCard
                  title="Checkout Queue"
                  value={activeMetrics.queue_depth}
                  subtext="Customers in line"
                  type="queue"
                  glow={isFlashed}
                  delta={activeDeltas?.queue_depth}
                  history={activeHistory?.queue_depth}
                />
                <MetricCard
                  title="Abandonment Rate"
                  value={`${(activeMetrics.abandonment_rate * 100).toFixed(1)}%`}
                  subtext="Queue desertions"
                  type="abandonment"
                  glow={isFlashed}
                  delta={activeDeltas?.abandonment_rate}
                  history={activeHistory?.abandonment_rate}
                />
              </div>

              {/* Intelligence Feature Cards */}
              <div className="feature-grid">
                <OpportunityRadar radar={activeMetrics.opportunity_radar} />
                <BeautyBlackHole data={activeMetrics.beauty_black_hole} />
                <CustomerArchetypes items={activeMetrics.customer_archetypes} />
              </div>

              {/* AI Insights */}
              <div className="panel-card">
                <div className="panel-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2z" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  AI Insights
                  <span className="panel-title-badge">LIVE</span>
                </div>
                <InsightCards metrics={activeMetrics} anomalyCount={anomalies.length} />
              </div>

              {/* Main chart grid */}
              <div className="primary-grid">
                {/* Funnel */}
                <div className="panel-card">
                  <div className="panel-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 6h16M7 12h10M10 18h4" />
                    </svg>
                    Conversion Funnel
                  </div>
                  <FunnelChart stages={funnelData} />
                </div>

                {/* Queue + Heatmap stacked */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div className="panel-card">
                    <div className="panel-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      Checkout Queue
                    </div>
                    <QueueTelemetry queueDepth={activeMetrics.queue_depth} />
                  </div>

                  <div className="panel-card">
                    <div className="panel-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                      </svg>
                      Zone Dwell Heatmap
                    </div>
                    <HeatmapChart zones={activeMetrics.avg_dwell_per_zone} />
                  </div>
                </div>
              </div>

              {/* Bottom: Timeline + Anomalies */}
              <div className="secondary-grid">
                <div className="panel-card" style={{ gridColumn: 'span 2' }}>
                  <div className="panel-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    Visitor Timeline
                    <span className="panel-title-badge">
                      LAST {activeHistory?.unique_visitors?.length ?? 0} pts
                    </span>
                  </div>
                  <VisitorTimeline history={activeHistory} />
                </div>

                <div className="panel-card">
                  <div className="panel-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Active Anomalies
                    {anomalies.length > 0 && (
                      <span className="panel-title-badge" style={{
                        background: 'rgba(244,63,94,0.08)',
                        color: '#881337',
                        borderColor: 'rgba(244,63,94,0.2)',
                      }}>
                        {anomalies.length} alerts
                      </span>
                    )}
                  </div>
                  <AnomaliesLog anomalies={anomalies} />
                </div>
              </div>
            </>
          )}

          {/* ═══════════════════ ANALYTICS VIEW ═══════════════════ */}
          {activeView === 'analytics' && (
            <>
              <div className="kpi-grid">
                <MetricCard title="Total Visitors" value={activeMetrics.unique_visitors} subtext="Unique entries" type="visitors" history={activeHistory?.unique_visitors} />
                <MetricCard title="Conversion Rate" value={`${(activeMetrics.conversion_rate * 100).toFixed(1)}%`} subtext="Purchase rate" type="conversion" history={activeHistory?.conversion_rate} />
                <MetricCard title="Queue Depth" value={activeMetrics.queue_depth} subtext="Current queue" type="queue" history={activeHistory?.queue_depth} />
                <MetricCard title="Abandonment" value={`${(activeMetrics.abandonment_rate * 100).toFixed(1)}%`} subtext="Checkout exits" type="abandonment" history={activeHistory?.abandonment_rate} />
              </div>

              <div className="primary-grid">
                <div className="panel-card">
                  <div className="panel-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    Visitor Volume Over Time
                  </div>
                  <VisitorTimeline history={activeHistory} />
                </div>

                <div className="panel-card">
                  <div className="panel-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 6h16M7 12h10M10 18h4" />
                    </svg>
                    Conversion Funnel Analysis
                  </div>
                  <FunnelChart stages={funnelData} />
                </div>
              </div>

              <div className="secondary-grid">
                <div className="panel-card" style={{ gridColumn: 'span 2' }}>
                  <div className="panel-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                    Zone Traffic Heatmap
                  </div>
                  <HeatmapChart zones={activeMetrics.avg_dwell_per_zone} />
                </div>

                <div className="panel-card">
                  <div className="panel-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    Checkout Performance
                  </div>
                  <QueueTelemetry queueDepth={activeMetrics.queue_depth} />
                </div>
              </div>
            </>
          )}

          {/* ═══════════════════ EVENTS VIEW ═══════════════════ */}
          {activeView === 'events' && (
            <>
              <div className="primary-grid">
                <div className="panel-card">
                  <div className="panel-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
                    </svg>
                    Live CCTV Event Feed
                    <span className="panel-title-badge">STREAMING</span>
                  </div>
                  <LiveEventTicker apiBase={API_BASE} storeId={selectedStore} />
                </div>

                <div className="panel-card">
                  <div className="panel-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Active Anomalies
                    {anomalies.length > 0 && (
                      <span className="panel-title-badge" style={{
                        background: 'rgba(244,63,94,0.08)',
                        color: '#881337',
                        borderColor: 'rgba(244,63,94,0.2)',
                      }}>
                        {anomalies.length}
                      </span>
                    )}
                  </div>
                  <AnomaliesLog anomalies={anomalies} />
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2z" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  System Insights
                </div>
                <InsightCards metrics={activeMetrics} anomalyCount={anomalies.length} />
              </div>
            </>
          )}

          {/* ═══════════════════ COMPARISON VIEW ═══════════════════ */}
          {activeView === 'comparison' && (
            <>
              <div className="panel-card">
                <div className="panel-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  Multi-Store Performance Comparison
                  <span className="panel-title-badge">{STORE_IDS.length} Stores</span>
                </div>
                <StoreComparison
                  storesData={storesData}
                  selectedStore={selectedStore}
                  storeIds={STORE_IDS}
                />
              </div>

              <div className="secondary-grid">
                {STORE_IDS.map((sid) => {
                  const m = storesData[sid];
                  const h = metricHistory[sid];
                  if (!m) return (
                    <div key={sid} className="panel-card">
                      <div className="panel-title" style={{ marginBottom: 0 }}>
                        {sid.replace('STORE_', '').replace(/_/g, ' — ')}
                      </div>
                      <div className="no-data" style={{ height: '80px' }}>No data yet</div>
                    </div>
                  );
                  return (
                    <div key={sid} className="panel-card">
                      <div className="panel-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        {sid.replace('STORE_', '').replace(/_/g, ' — ')}
                        {sid === selectedStore && <span className="panel-title-badge">ACTIVE</span>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <MetricCard title="Visitors" value={m.unique_visitors} subtext="" type="visitors" history={h?.unique_visitors} />
                        <MetricCard title="Conv. Rate" value={`${(m.conversion_rate * 100).toFixed(1)}%`} subtext="" type="conversion" history={h?.conversion_rate} />
                      </div>
                    </div>
                  );
                })}

                <div className="panel-card">
                  <div className="panel-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2z" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                    Network Insights
                  </div>
                  <InsightCards metrics={activeMetrics} anomalyCount={anomalies.length} />
                </div>
              </div>
            </>
          )}

          {/* ═══════════════════ CAMERA FEEDS VIEW ═══════════════════ */}
          {activeView === 'cameras' && (
            <>
              <div className="kpi-grid">
                <MetricCard
                  title="Total Visitors"
                  value={activeMetrics.unique_visitors}
                  subtext="Unique entries"
                  type="visitors"
                  glow={isFlashed}
                  history={activeHistory?.unique_visitors}
                />
                <MetricCard
                  title="Conversion Rate"
                  value={`${(activeMetrics.conversion_rate * 100).toFixed(1)}%`}
                  subtext="Purchases / entries"
                  type="conversion"
                  glow={isFlashed}
                  history={activeHistory?.conversion_rate}
                />
                <MetricCard
                  title="Checkout Queue"
                  value={activeMetrics.queue_depth}
                  subtext="Active in line"
                  type="queue"
                  glow={isFlashed}
                  history={activeHistory?.queue_depth}
                />
                <MetricCard
                  title="Abandonment"
                  value={`${(activeMetrics.abandonment_rate * 100).toFixed(1)}%`}
                  subtext="Queue desertions"
                  type="abandonment"
                  glow={isFlashed}
                  history={activeHistory?.abandonment_rate}
                />
              </div>

              <div className="panel-card">
                <div className="panel-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                  Live CCTV Camera Feeds
                  <span className="panel-title-badge" style={{
                    background: 'rgba(244,63,94,0.08)',
                    color: '#881337',
                    borderColor: 'rgba(244,63,94,0.2)',
                  }}>
                    ● LIVE
                  </span>
                </div>
                <CameraFeed apiBase={API_BASE} storeId={selectedStore} />
              </div>

              {anomalies.length > 0 && (
                <div className="panel-card">
                  <div className="panel-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Active Anomalies — Review Footage
                    <span className="panel-title-badge" style={{
                      background: 'rgba(244,63,94,0.08)',
                      color: '#881337',
                      borderColor: 'rgba(244,63,94,0.2)',
                    }}>
                      {anomalies.length} alerts
                    </span>
                  </div>
                  <AnomaliesLog anomalies={anomalies} />
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;