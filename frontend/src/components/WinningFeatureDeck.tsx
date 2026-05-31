import type { StoreMetrics } from '../hooks/useStoreSSE';

interface WinningFeatureDeckProps {
  metrics: StoreMetrics;
  anomalyCount: number;
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default function WinningFeatureDeck({ metrics, anomalyCount }: WinningFeatureDeckProps) {
  const queueLoad = Math.min(100, metrics.queue_depth * 18);
  const conversion = Math.round(metrics.conversion_rate * 100);
  const abandonment = Math.round(metrics.abandonment_rate * 100);
  const activeZones = metrics.avg_dwell_per_zone?.filter((zone) => zone.visit_count > 0).length ?? 0;
  const topZone = [...(metrics.avg_dwell_per_zone ?? [])].sort((a, b) => b.visit_count - a.visit_count)[0];
  const rescueScore = Math.max(0, Math.min(100, 100 - queueLoad - abandonment + conversion));

  const items = [
    {
      label: 'Conversion Pulse',
      value: pct(metrics.conversion_rate),
      note: conversion >= 40 ? 'healthy billing movement' : 'needs floor assist',
      tone: 'green',
      fill: conversion,
    },
    {
      label: 'Queue Rescue',
      value: `${rescueScore}`,
      note: metrics.queue_depth > 3 ? 'open billing support' : 'queue under control',
      tone: 'amber',
      fill: rescueScore,
    },
    {
      label: 'Zone Magnet',
      value: topZone?.zone_id?.replace(/_/g, ' ') ?? 'No signal',
      note: topZone ? `${topZone.visit_count} visits / ${Math.round(topZone.avg_dwell_seconds)}s dwell` : 'waiting for traffic',
      tone: 'sky',
      fill: Math.min(100, (topZone?.visit_count ?? 0) * 16),
    },
    {
      label: 'Alert Heat',
      value: `${anomalyCount}`,
      note: anomalyCount ? 'manager review needed' : 'no active anomalies',
      tone: 'rose',
      fill: Math.min(100, anomalyCount * 28),
    },
    {
      label: 'Coverage Live',
      value: `${activeZones}`,
      note: 'active shopper zones',
      tone: 'violet',
      fill: Math.min(100, activeZones * 18),
    },
  ];

  return (
    <div className="winning-feature-grid">
      {items.map((item) => (
        <div key={item.label} className={`winning-feature-card ${item.tone}`}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <small>{item.note}</small>
          <div className="winning-feature-meter">
            <i style={{ width: `${item.fill}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
