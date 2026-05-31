import type { StoreMetrics } from '../hooks/useStoreSSE';

interface DetectionConfidenceMonitorProps {
  metrics: StoreMetrics;
}

function band(score: number) {
  if (score >= 82) return 'strong';
  if (score >= 62) return 'watch';
  return 'weak';
}

export default function DetectionConfidenceMonitor({ metrics }: DetectionConfidenceMonitorProps) {
  const zones = metrics.avg_dwell_per_zone ?? [];
  const sampleScore = Math.min(100, Math.max(35, metrics.unique_visitors * 6 + zones.length * 8));
  const queueScore = metrics.queue_depth > 5 ? 58 : metrics.queue_depth > 2 ? 74 : 88;
  const dwellScore = zones.length > 0 ? Math.min(94, 60 + zones.length * 7) : 42;
  const overall = Math.round((sampleScore + queueScore + dwellScore) / 3);

  const rows = [
    { label: 'Visitor sample', value: sampleScore, note: `${metrics.unique_visitors} sessions` },
    { label: 'Queue clarity', value: queueScore, note: `${metrics.queue_depth} in checkout` },
    { label: 'Zone coverage', value: dwellScore, note: `${zones.length} active zones` },
  ];

  return (
    <div className="panel-card confidence-card">
      <div className="panel-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        Detection Confidence
        <span className={`panel-title-badge confidence-${band(overall)}`}>{overall}%</span>
      </div>

      <div className="confidence-meter">
        <div className={`confidence-ring confidence-${band(overall)}`}>{overall}</div>
        <div>
          <strong>{overall >= 82 ? 'High trust' : overall >= 62 ? 'Monitor' : 'Low sample'}</strong>
          <p>Derived from live visitor volume, queue pressure, and zone coverage.</p>
        </div>
      </div>

      <div className="confidence-rows">
        {rows.map((row) => (
          <div key={row.label} className="confidence-row">
            <span>{row.label}</span>
            <div className="confidence-track">
              <div className={`confidence-fill confidence-${band(row.value)}`} style={{ width: `${row.value}%` }} />
            </div>
            <small>{row.note}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
