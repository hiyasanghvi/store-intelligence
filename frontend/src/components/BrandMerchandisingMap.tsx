import type { StoreMetrics, ZoneDwellMetric } from '../hooks/useStoreSSE';
import type { CSSProperties } from 'react';
import { FLOOR_FIXTURES, SPATIAL_ZONES, type FloorFixture, type FloorZoneId } from '../data/brigadeFloorPlan';

interface BrandMerchandisingMapProps {
  metrics: StoreMetrics;
}

function metricByZone(metrics: StoreMetrics, zone: FloorZoneId): ZoneDwellMetric | undefined {
  if (zone === 'BILLING_COUNTER') {
    return metrics.avg_dwell_per_zone?.find((item) => item.zone_id === 'BILLING_COUNTER' || item.zone_id === 'BILLING_QUEUE');
  }
  return metrics.avg_dwell_per_zone?.find((item) => item.zone_id === zone);
}

function attentionScore(metrics: StoreMetrics, zone: FloorZoneId) {
  const zoneMetric = metricByZone(metrics, zone);
  const visits = zoneMetric?.visit_count ?? 0;
  const dwell = zoneMetric?.avg_dwell_seconds ?? 0;
  const queueBoost = zone === 'BILLING_QUEUE' ? metrics.queue_depth * 18 : 0;
  return Math.min(100, Math.round(visits * 12 + dwell * 1.15 + queueBoost));
}

function fixtureScore(metrics: StoreMetrics, fixture: FloorFixture) {
  const base = attentionScore(metrics, fixture.zone);
  const placementBoost = fixture.type === 'island' ? 8 : fixture.type === 'service' ? 5 : 0;
  return Math.min(100, base + placementBoost);
}

function scoreBand(score: number) {
  if (score >= 72) return 'critical';
  if (score >= 48) return 'active';
  if (score > 0) return 'watch';
  return 'quiet';
}

function zoneCount(metrics: StoreMetrics, zone: FloorZoneId) {
  if (zone === 'BILLING_QUEUE') return metrics.queue_depth;
  return metricByZone(metrics, zone)?.visit_count ?? 0;
}

function dwellLabel(metrics: StoreMetrics, zone: FloorZoneId) {
  const seconds = metricByZone(metrics, zone)?.avg_dwell_seconds ?? 0;
  if (!seconds) return 'No dwell';
  if (seconds >= 60) return `${Math.round(seconds / 60)}m dwell`;
  return `${Math.round(seconds)}s dwell`;
}

function getFixtureRank(metrics: StoreMetrics) {
  return [...FLOOR_FIXTURES]
    .map((fixture) => ({ fixture, score: fixtureScore(metrics, fixture) }))
    .sort((a, b) => b.score - a.score);
}

function useTopSignals(metrics: StoreMetrics) {
  const zoneRank = [...SPATIAL_ZONES]
    .filter((zone) => zone.id !== 'ENTRY_THRESHOLD')
    .map((zone) => ({ zone, score: attentionScore(metrics, zone.id) }))
    .sort((a, b) => b.score - a.score);

  const fixtureRank = getFixtureRank(metrics);
  const topZone = zoneRank[0];
  const topFixture = fixtureRank[0];
  const queueRisk = metrics.queue_depth >= 4 || attentionScore(metrics, 'BILLING_QUEUE') >= 68;

  const nextAction = queueRisk
    ? 'Open a second billing handoff before sending associates to browse zones.'
    : topFixture && topFixture.score > 0
      ? `Place one associate near ${topFixture.fixture.label} and pitch ${topFixture.fixture.category.toLowerCase()} bundles.`
      : 'Keep the event replay running to populate fixture-level attention.';

  const conversionCue = metrics.conversion_rate >= 0.45
    ? 'Conversion healthy'
    : metrics.queue_depth > 2
      ? 'Queue may be suppressing conversion'
      : 'Nudge assisted discovery';

  return { zoneRank, fixtureRank, topZone, topFixture, queueRisk, nextAction, conversionCue };
}

export default function BrandMerchandisingMap({ metrics }: BrandMerchandisingMapProps) {
  const { fixtureRank, topZone, topFixture, queueRisk, nextAction, conversionCue } = useTopSignals(metrics);
  const activeZones = SPATIAL_ZONES.filter((zone) => attentionScore(metrics, zone.id) > 0).length;
  const storeLoad = metrics.unique_visitors + metrics.queue_depth;
  const peopleDots = buildPeopleDots(metrics);

  return (
    <div className="panel-card brand-map-card">
      <div className="panel-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 21V7l6-4 6 4 6-4v14l-6 4-6-4-6 4z" />
          <path d="M9 3v14M15 7v14" />
        </svg>
        Live Spatial Floor Map
        <span className="panel-title-badge spatial-live-badge">LIVE PLANOGRAM</span>
      </div>

      <div className="spatial-intel-strip">
        <div>
          <span>Hot fixture</span>
          <strong>{topFixture?.fixture.label ?? 'Awaiting traffic'}</strong>
          <small>{topFixture ? `${topFixture.fixture.placement} / ${topFixture.fixture.category}` : 'No fixture signal yet'}</small>
        </div>
        <div>
          <span>Zone pressure</span>
          <strong>{topZone?.zone.label ?? 'No active zone'}</strong>
          <small>{topZone ? `${topZone.score}/100 attention` : 'Replay starting'}</small>
        </div>
        <div>
          <span>Store load</span>
          <strong>{storeLoad}</strong>
          <small>{activeZones} active zones, {metrics.queue_depth} in queue</small>
        </div>
        <div className={queueRisk ? 'spatial-risk high' : 'spatial-risk'}>
          <span>Ops cue</span>
          <strong>{conversionCue}</strong>
          <small>{queueRisk ? 'Protect checkout first' : 'Floor assist available'}</small>
        </div>
      </div>

      <div className="floor-map-shell clean" aria-label="Live Brigade Road floor map">
        <div className="store-wall wall-top">
          {FLOOR_FIXTURES.filter((fixture) => fixture.placement === 'top').map((fixture) => (
            <FixturePill key={fixture.id} fixture={fixture} score={fixtureScore(metrics, fixture)} />
          ))}
        </div>

        <div className="live-planogram">
          {SPATIAL_ZONES.map((zone) => {
            const score = attentionScore(metrics, zone.id);
            return (
              <div
                key={zone.id}
                className={`clean-zone ${scoreBand(score)}`}
                style={{ gridArea: zone.gridArea, '--zone-color': zone.color } as CSSProperties}
              >
                <strong>{zone.label}</strong>
                <small>{zoneCount(metrics, zone.id)} now · {dwellLabel(metrics, zone.id)}</small>
              </div>
            );
          })}

          <div className="foh-label">F.O.H</div>
          <div className="fixture-island clean-island nail">Nail Unit</div>
          <div className="fixture-island clean-island makeup">Makeup Unit</div>
          <div className="fixture-island clean-island cash">Cash Counter</div>
          <div className="fixture-island clean-island pmu">PMU</div>

          {peopleDots.map((dot) => (
            <span
              key={dot.id}
              className={`people-dot ${dot.kind}`}
              style={{
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                animationDelay: `${dot.delay}s`,
                '--dot-color': dot.color,
              } as CSSProperties}
            />
          ))}
        </div>

        <div className="store-wall wall-bottom">
          {FLOOR_FIXTURES.filter((fixture) => fixture.placement === 'bottom').map((fixture) => (
            <FixturePill key={fixture.id} fixture={fixture} score={fixtureScore(metrics, fixture)} />
          ))}
        </div>
      </div>

      <div className="spatial-action compact">
        <span>Next best move</span>
        <p>{nextAction}</p>
      </div>

      <BrandAttentionGrid metrics={metrics} fixtureRank={fixtureRank} />
    </div>
  );
}

export function BrandAttentionSummary({ metrics }: BrandMerchandisingMapProps) {
  const ranked = getFixtureRank(metrics);
  const top = ranked.slice(0, 4);
  const least = [...ranked].reverse().slice(0, 4);

  return (
    <div className="brand-funnel-fill">
      <div className="brand-mini-column">
        <span className="brand-mini-title">Top brand attention</span>
        {top.map(({ fixture, score }) => (
          <BrandMiniRow key={fixture.id} fixture={fixture} score={score} />
        ))}
      </div>
      <div className="brand-mini-column">
        <span className="brand-mini-title">Least brand attention</span>
        {least.map(({ fixture, score }) => (
          <BrandMiniRow key={fixture.id} fixture={fixture} score={score} />
        ))}
      </div>
    </div>
  );
}

function BrandAttentionGrid({ metrics, fixtureRank }: { metrics: StoreMetrics; fixtureRank: ReturnType<typeof getFixtureRank> }) {
  const rankMap = new Map(fixtureRank.map(({ fixture, score }) => [fixture.id, score]));
  return (
    <div className="all-brand-grid">
      {FLOOR_FIXTURES.map((fixture) => (
        <BrandMiniRow key={fixture.id} fixture={fixture} score={rankMap.get(fixture.id) ?? fixtureScore(metrics, fixture)} />
      ))}
    </div>
  );
}

function BrandMiniRow({ fixture, score }: { fixture: FloorFixture; score: number }) {
  return (
    <div className={`brand-mini-row ${scoreBand(score)}`}>
      <div>
        <strong>{fixture.label}</strong>
        <small>{fixture.category}</small>
      </div>
      <span>{score}</span>
    </div>
  );
}

function FixturePill({ fixture, score }: { fixture: FloorFixture; score: number }) {
  return (
    <div className={`fixture-pill ${scoreBand(score)}`}>
      <span>{fixture.category}</span>
      <strong>{fixture.label}</strong>
      <i style={{ width: `${score}%` }} />
    </div>
  );
}

function buildPeopleDots(metrics: StoreMetrics) {
  const zoneAnchors: Record<FloorZoneId, { x: number; y: number; color: string }> = {
    ENTRY_THRESHOLD: { x: 8, y: 48, color: '#14b8a6' },
    SKINCARE: { x: 30, y: 26, color: '#0ea5e9' },
    HAIRCARE: { x: 62, y: 27, color: '#f97316' },
    FRAGRANCES: { x: 30, y: 72, color: '#ec4899' },
    IMPULSE_BUYS: { x: 48, y: 66, color: '#f59e0b' },
    BILLING_COUNTER: { x: 88, y: 35, color: '#6366f1' },
    BILLING_QUEUE: { x: 74, y: 71, color: '#22c55e' },
    WELLNESS: { x: 88, y: 72, color: '#10b981' },
  };

  const dots: Array<{ id: string; x: number; y: number; color: string; delay: number; kind: string }> = [];
  SPATIAL_ZONES.forEach((zone) => {
    const count = Math.min(4, zoneCount(metrics, zone.id));
    const anchor = zoneAnchors[zone.id];
    for (let i = 0; i < count; i += 1) {
      dots.push({
        id: `${zone.id}-${i}`,
        x: anchor.x + ((i % 2) * 5) - 2,
        y: anchor.y + (Math.floor(i / 2) * 7) - 3,
        color: anchor.color,
        delay: i * 0.35,
        kind: zone.id === 'BILLING_QUEUE' ? 'queue' : 'customer',
      });
    }
  });
  return dots.slice(0, 18);
}
