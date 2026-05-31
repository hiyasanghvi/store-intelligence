import type { StoreMetrics } from '../hooks/useStoreSSE';
import type { Anomaly } from './AnomaliesLog';

interface StoreNarrativeProps {
  metrics: StoreMetrics;
  anomalies: Anomaly[];
}

function strongestZone(metrics: StoreMetrics) {
  return [...(metrics.avg_dwell_per_zone ?? [])].sort((a, b) => {
    const aScore = (a.visit_count ?? 0) * (a.avg_dwell_seconds ?? 0);
    const bScore = (b.visit_count ?? 0) * (b.avg_dwell_seconds ?? 0);
    return bScore - aScore;
  })[0];
}

export default function StoreNarrative({ metrics, anomalies }: StoreNarrativeProps) {
  const conversionPct = Math.round((metrics.conversion_rate ?? 0) * 1000) / 10;
  const abandonmentPct = Math.round((metrics.abandonment_rate ?? 0) * 1000) / 10;
  const topZone = strongestZone(metrics);
  const critical = anomalies.filter((a) => a.severity === 'CRITICAL').length;
  const warn = anomalies.filter((a) => a.severity === 'WARN').length;

  const story = [
    `${metrics.unique_visitors} unique visitors are active in the current store window.`,
    `Conversion is at ${conversionPct}%, with checkout abandonment at ${abandonmentPct}%.`,
    topZone
      ? `${topZone.zone_id.replace(/_/g, ' ')} is the strongest attention zone with ${topZone.visit_count} visits.`
      : 'Zone-level dwell is waiting for more visitor movement.',
    metrics.queue_depth > 3
      ? `Queue depth is ${metrics.queue_depth}, so checkout friction is now the main operational risk.`
      : `Queue depth is ${metrics.queue_depth}, so checkout capacity is currently under control.`,
  ];

  const recommendation =
    critical > 0
      ? 'Resolve critical alerts before optimizing merchandising.'
      : metrics.queue_depth > 3
        ? 'Open another billing counter or redirect staff to checkout.'
        : conversionPct < 25 && topZone
          ? `Place assisted selling near ${topZone.zone_id.replace(/_/g, ' ')} to convert interest into billing intent.`
          : 'Keep monitoring dwell-to-billing movement and staff only when queue pressure rises.';

  return (
    <div className="panel-card narrative-card">
      <div className="panel-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        Store Story Mode
        <span className="panel-title-badge">EXPLAINER</span>
      </div>

      <div className="narrative-layout">
        <div>
          <div className="narrative-kicker">What the system is seeing</div>
          <ol className="narrative-list">
            {story.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </div>

        <div className="narrative-action">
          <span className="action-label">Recommended Action</span>
          <strong>{recommendation}</strong>
          <small>
            Alert load: {critical} critical, {warn} warning
          </small>
        </div>
      </div>
    </div>
  );
}
