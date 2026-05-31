import type { MetricHistory, StoreMetrics } from '../hooks/useStoreSSE';
import type { CSSProperties } from 'react';

interface AnalyticsCommandViewProps {
  metrics: StoreMetrics;
  history?: MetricHistory;
}

const COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b', '#ec4899', '#6366f1', '#22c55e'];

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polarToCartesian(cx, cy, r, end);
  const e = polarToCartesian(cx, cy, r, start);
  const large = end - start <= 180 ? 0 : 1;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
}

export default function AnalyticsCommandView({ metrics, history }: AnalyticsCommandViewProps) {
  const zones = [...(metrics.avg_dwell_per_zone ?? [])].sort((a, b) => b.visit_count - a.visit_count);
  const totalVisits = zones.reduce((sum, zone) => sum + zone.visit_count, 0) || 1;
  const maxDwell = Math.max(1, ...zones.map((zone) => zone.avg_dwell_seconds));
  const conversionSeries = history?.conversion_rate ?? [];
  const latestConversion = conversionSeries.at(-1) ?? metrics.conversion_rate;
  const firstConversion = conversionSeries[0] ?? latestConversion;
  const lift = Math.round((latestConversion - firstConversion) * 100);
  const queueRisk = Math.min(100, metrics.queue_depth * 20 + metrics.abandonment_rate * 100);
  const engagementScore = Math.min(100, Math.round((totalVisits * 9) + (latestConversion * 40)));

  let angle = 0;
  const arcs = zones.slice(0, 6).map((zone, index) => {
    const size = (zone.visit_count / totalVisits) * 360;
    const start = angle;
    angle += size;
    return { zone, start, end: angle, color: COLORS[index % COLORS.length] };
  });

  return (
    <div className="analytics-command-grid">
      <div className="panel-card analytics-pie-card">
        <div className="panel-title compact-title">Traffic Mix Pie</div>
        <div className="pie-layout">
          <svg viewBox="0 0 160 160" className="traffic-pie">
            <circle cx="80" cy="80" r="54" fill="none" stroke="#eef2f7" strokeWidth="28" />
            {arcs.map(({ zone, start, end, color }) => (
              <path key={zone.zone_id} d={arcPath(80, 80, 54, start, end)} fill="none" stroke={color} strokeWidth="28" />
            ))}
            <text x="80" y="76" textAnchor="middle" className="pie-value">{totalVisits}</text>
            <text x="80" y="94" textAnchor="middle" className="pie-label">visits</text>
          </svg>
          <div className="pie-legend">
            {arcs.map(({ zone, color }) => (
              <div key={zone.zone_id}>
                <span style={{ background: color }} />
                <strong>{zone.zone_id.replace(/_/g, ' ')}</strong>
                <small>{Math.round((zone.visit_count / totalVisits) * 100)}%</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel-card analytics-bars-card">
        <div className="panel-title compact-title">Dwell Momentum</div>
        <div className="dwell-bars">
          {zones.slice(0, 7).map((zone, index) => (
            <div key={zone.zone_id} className="dwell-bar-row">
              <span>{zone.zone_id.replace(/_/g, ' ')}</span>
              <div><i style={{ width: `${(zone.avg_dwell_seconds / maxDwell) * 100}%`, background: COLORS[index % COLORS.length] }} /></div>
              <b>{Math.round(zone.avg_dwell_seconds)}s</b>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-card analytics-gauge-card">
        <div className="panel-title compact-title">Conversion Gauge</div>
        <div className="gauge-wrap">
          <div className="gauge-ring" style={{ '--gauge': `${Math.round(metrics.conversion_rate * 100)}%` } as CSSProperties}>
            <strong>{Math.round(metrics.conversion_rate * 100)}%</strong>
          </div>
          <div className="gauge-copy">
            <span>{lift >= 0 ? '+' : ''}{lift} pts live lift</span>
            <small>relative to first point in current session</small>
          </div>
        </div>
      </div>

      <div className="panel-card analytics-risk-card">
        <div className="panel-title compact-title">Risk Matrix</div>
        <div className="risk-matrix">
          <div style={{ left: `${Math.min(88, queueRisk)}%`, top: `${Math.max(8, 88 - engagementScore)}%` }} />
          <span className="risk-axis x">Queue pressure</span>
          <span className="risk-axis y">Engagement</span>
        </div>
      </div>

      <div className="panel-card analytics-waterfall-card">
        <div className="panel-title compact-title">Shopper Outcome Waterfall</div>
        <div className="waterfall">
          <OutcomeBar label="Entered" value={metrics.unique_visitors} color="#0ea5e9" />
          <OutcomeBar label="Engaged" value={totalVisits} color="#14b8a6" />
          <OutcomeBar label="Queued" value={metrics.queue_depth} color="#f59e0b" />
          <OutcomeBar label="Lost" value={Math.round(metrics.abandonment_rate * metrics.unique_visitors)} color="#f43f5e" />
        </div>
      </div>
    </div>
  );
}

function OutcomeBar({ label, value, color }: { label: string; value: number; color: string }) {
  const height = Math.max(16, Math.min(100, value * 9));
  return (
    <div className="outcome-bar">
      <strong>{value}</strong>
      <i style={{ height: `${height}px`, background: color }} />
      <span>{label}</span>
    </div>
  );
}
