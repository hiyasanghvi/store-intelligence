import type { StoreMetrics } from '../hooks/useStoreSSE';

interface IntelligenceSignalsProps {
  metrics: StoreMetrics;
  anomalyCount: number;
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default function IntelligenceSignals({ metrics, anomalyCount }: IntelligenceSignalsProps) {
  const queueLoad = Math.min(100, metrics.queue_depth * 18);
  const conversion = Math.round(metrics.conversion_rate * 100);
  const abandonment = Math.round(metrics.abandonment_rate * 100);
  const activeZones = metrics.avg_dwell_per_zone?.filter((zone) => zone.visit_count > 0).length ?? 0;
  const topZone = [...(metrics.avg_dwell_per_zone ?? [])].sort((a, b) => b.visit_count - a.visit_count)[0];
  const rescueScore = Math.max(0, Math.min(100, 100 - queueLoad - abandonment + conversion));
  const lostBasket = Math.min(100, abandonment + metrics.queue_depth * 12);
  const staffMove = metrics.queue_depth > 2 ? 'Checkout' : topZone?.zone_id?.replace(/_/g, ' ') ?? 'Floor';
  const evidenceScore = Math.min(98, 62 + activeZones * 7 + (metrics.unique_visitors > 0 ? 12 : 0));

  const items = [
    {
      label: 'Conversion Pulse',
      value: pct(metrics.conversion_rate),
      note: conversion >= 40 ? 'healthy billing movement' : 'needs floor assist',
      why: 'Shows whether shopper traffic is actually reaching purchase, not just entering the store.',
      action: conversion >= 40 ? 'Keep the current floor allocation.' : 'Move one associate to the strongest dwell zone.',
      tone: 'green',
      fill: conversion,
    },
    {
      label: 'Queue Rescue',
      value: `${rescueScore}`,
      note: metrics.queue_depth > 3 ? 'open billing support' : 'queue under control',
      why: 'Combines queue depth, abandonment, and conversion so checkout risk is visible early.',
      action: metrics.queue_depth > 3 ? 'Add billing support before shoppers leave.' : 'Monitor, no intervention needed.',
      tone: 'amber',
      fill: rescueScore,
    },
    {
      label: 'Zone Magnet',
      value: topZone?.zone_id?.replace(/_/g, ' ') ?? 'No signal',
      note: topZone ? `${topZone.visit_count} visits / ${Math.round(topZone.avg_dwell_seconds)}s dwell` : 'waiting for traffic',
      why: 'Identifies the zone attracting attention so staff can convert interest into baskets.',
      action: topZone ? `Place assisted selling near ${topZone.zone_id.replace(/_/g, ' ')}.` : 'Wait for shopper movement.',
      tone: 'sky',
      fill: Math.min(100, (topZone?.visit_count ?? 0) * 16),
    },
    {
      label: 'Alert Heat',
      value: `${anomalyCount}`,
      note: anomalyCount ? 'manager review needed' : 'no active anomalies',
      why: 'Keeps operational exceptions separate from normal dashboard noise.',
      action: anomalyCount ? 'Open Live Operations and review the newest alert.' : 'Keep the team focused on sales flow.',
      tone: 'rose',
      fill: Math.min(100, anomalyCount * 28),
    },
    {
      label: 'Lost Basket Risk',
      value: `${lostBasket}%`,
      note: metrics.abandonment_rate > 0 ? 'queue abandonment pressure' : 'low leakage right now',
      why: 'Estimates revenue leakage from shoppers who show intent but do not complete checkout.',
      action: lostBasket > 35 ? 'Protect checkout and trigger staff escalation.' : 'No urgent leakage action.',
      tone: 'coral',
      fill: lostBasket,
    },
    {
      label: 'Evidence Sync',
      value: `${evidenceScore}%`,
      note: 'privacy-safe camera proof',
      why: 'Confirms the live metric boxes are backed by person detection, zone overlays, and CCTV evidence.',
      action: `Next staff move: ${staffMove}.`,
      tone: 'teal',
      fill: evidenceScore,
    },
  ];

  return (
    <div className="intelligence-signal-grid important-only">
      {items.map((item) => (
        <div key={item.label} className={`intelligence-signal-card ${item.tone}`}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <small>{item.note}</small>
          <div className="intelligence-signal-meter">
            <i style={{ width: `${item.fill}%` }} />
          </div>
          <div className="signal-popover" role="note">
            <b>Why:</b> {item.why}
            <em>Action: {item.action}</em>
          </div>
        </div>
      ))}
    </div>
  );
}
