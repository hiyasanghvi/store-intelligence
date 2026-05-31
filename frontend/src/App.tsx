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
import StoreNarrative from './components/StoreNarrative';
import DetectionConfidenceMonitor from './components/DetectionConfidenceMonitor';
import OpsCommandCenter from './components/OpsCommandCenter';
import BrandMerchandisingMap, { BrandAttentionSummary } from './components/BrandMerchandisingMap';
import WinningFeatureDeck from './components/WinningFeatureDeck';
import AnalyticsCommandView from './components/AnalyticsCommandView';

const API_BASE = getApiUrl();
const DEFAULT_STORE = 'STORE_BLR_002';
const STORE_IDS = ['STORE_BLR_002', 'ST1008'];

type ViewId = 'dashboard' | 'analytics' | 'events' | 'comparison' | 'cameras';
type NavItem = { id: ViewId; label: string; description: string };

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

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',  label: 'Live Dashboard',    description: 'Executive pulse and winning features' },
  { id: 'analytics',  label: 'Journey Analytics', description: 'Pie charts, dwell, risk, outcome graphs' },
  { id: 'cameras',    label: 'Vision Center',     description: 'Camera feeds and overlays' },
  { id: 'events',     label: 'Live Operations',   description: 'Event feed, floor map, alerts' },
  { id: 'comparison', label: 'Store Comparison',  description: 'Compare stores side by side' },
];

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

  const renderKpiGrid = () => (
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
        subtext="Visits to purchases"
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
  );

  const renderPanelTitle = (
    icon: React.ReactNode,
    title: string,
    badge?: React.ReactNode,
  ) => (
    <div className="panel-title">
      {icon}
      {title}
      {badge}
    </div>
  );

  const renderFunnelPanel = (title = 'Conversion Funnel') => (
    <div className="panel-card">
      {renderPanelTitle(
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>,
        title,
      )}
      <FunnelChart stages={funnelData} />
      <BrandAttentionSummary metrics={activeMetrics} />
    </div>
  );

  const renderQueuePanel = (title = 'Checkout Queue') => (
    <div className="panel-card">
      {renderPanelTitle(
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>,
        title,
      )}
      <QueueTelemetry queueDepth={activeMetrics.queue_depth} />
    </div>
  );

  const renderHeatmapPanel = (title = 'Zone Dwell Heatmap') => (
    <div className="panel-card">
      {renderPanelTitle(
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>,
        title,
      )}
      <HeatmapChart zones={activeMetrics.avg_dwell_per_zone} />
    </div>
  );

  const renderTimelinePanel = (title = 'Visitor Timeline', wide = true) => (
    <div className={`panel-card ${wide ? 'span-2' : ''}`}>
      {renderPanelTitle(
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>,
        title,
        <span className="panel-title-badge">
          LAST {activeHistory?.unique_visitors?.length ?? 0} pts
        </span>,
      )}
      <VisitorTimeline history={activeHistory} />
    </div>
  );

  const renderAnomaliesPanel = (title = 'Active Anomalies', compact = false) => (
    <div className="panel-card">
      {renderPanelTitle(
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>,
        title,
        anomalies.length > 0 && (
          <span className="panel-title-badge alert-badge">
            {anomalies.length}{compact ? '' : ' alerts'}
          </span>
        ),
      )}
      <AnomaliesLog anomalies={anomalies} />
    </div>
  );

  const renderSimulationControls = () => (
    <div className="simulation-bar">
      <div className="simulation-status">
        <span className="simulation-dot" />
        <span>Live synchronized simulation</span>
      </div>

      <div className="simulation-actions">
        <button className="control-btn" onClick={handleRestartSimulation}>
          Sync & Restart
        </button>
        <span className="speed-label">Speed:</span>
        {[0.5, 1.0, 2.0, 5.0, 10.0].map((s) => (
          <button
            key={s}
            className={`speed-btn ${speed === s ? 'active' : ''}`}
            onClick={() => handleSpeedChange(s)}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );

  const renderDashboardShortcuts = () => (
    <div className="view-shortcut-grid">
      {NAV_ITEMS.filter((item) => item.id !== 'dashboard').map((item) => (
        <button
          key={item.id}
          className="view-shortcut"
          onClick={() => setActiveView(item.id)}
        >
          <span className="view-shortcut-icon">{NavIcons[item.id]}</span>
          <span>
            <strong>{item.label}</strong>
            <small>{item.description}</small>
          </span>
        </button>
      ))}
    </div>
  );

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

          {NAV_ITEMS.map((item) => (
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
                  CAMS
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
              {renderSimulationControls()}
              {renderDashboardShortcuts()}
              {renderKpiGrid()}
              <WinningFeatureDeck metrics={activeMetrics} anomalyCount={anomalies.length} />

              <StoreNarrative metrics={activeMetrics} anomalies={anomalies} />

              <div className="primary-grid">
                {renderFunnelPanel()}
                <div className="stacked-panels">
                  {renderQueuePanel()}
                  <DetectionConfidenceMonitor metrics={activeMetrics} />
                </div>
              </div>
            </>
          )}

          {/* ANALYTICS VIEW */}
          {activeView === 'analytics' && (
            <>
              <AnalyticsCommandView metrics={activeMetrics} history={activeHistory} />
              <div className="feature-grid">
                <OpportunityRadar radar={activeMetrics.opportunity_radar} />
                <BeautyBlackHole data={activeMetrics.beauty_black_hole} />
                <CustomerArchetypes items={activeMetrics.customer_archetypes} />
              </div>
              <div className="analytics-detail-grid">
                {renderTimelinePanel('Visitor Volume Over Time', false)}
                {renderHeatmapPanel('Zone Traffic Heatmap')}
                {renderFunnelPanel('Conversion Funnel Detail')}
              </div>
            </>
          )}

          {/* ═══════════════════ EVENTS VIEW ═══════════════════ */}
          {activeView === 'events' && (
            <>
              <div className="operations-live-grid">
                <div className="panel-card">
                  {renderPanelTitle(
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
                    </svg>,
                    'Live CCTV Event Feed',
                    <span className="panel-title-badge">STREAMING</span>,
                  )}
                  <LiveEventTicker apiBase={API_BASE} storeId={selectedStore} />
                </div>

                <BrandMerchandisingMap metrics={activeMetrics} />

                <OpsCommandCenter
                  metrics={activeMetrics}
                  anomalies={anomalies}
                  connectionStatus={connectionStatus}
                />
              </div>

              <div className="secondary-grid">
                {renderAnomaliesPanel('Operations Alerts')}
                <DetectionConfidenceMonitor metrics={activeMetrics} />
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
              {renderKpiGrid()}

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
