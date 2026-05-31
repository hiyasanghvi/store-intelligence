import type { StoreMetrics, ZoneDwellMetric } from '../hooks/useStoreSSE';

interface BrandMerchandisingMapProps {
  metrics: StoreMetrics;
}

type BrandBay = {
  brand: string;
  zone: string;
  wall: 'Top wall' | 'Bottom wall' | 'Island' | 'Checkout';
  category: string;
};

const BRAND_BAYS: BrandBay[] = [
  { brand: 'EB Korean', zone: 'SKINCARE', wall: 'Top wall', category: 'K-beauty' },
  { brand: 'The Face Shop', zone: 'SKINCARE', wall: 'Top wall', category: 'K-beauty' },
  { brand: 'Good Vibes', zone: 'SKINCARE', wall: 'Top wall', category: 'Skincare' },
  { brand: 'DermDoc', zone: 'SKINCARE', wall: 'Top wall', category: 'Derm skincare' },
  { brand: 'Minimalist', zone: 'SKINCARE', wall: 'Top wall', category: 'Actives' },
  { brand: 'Aqualogica', zone: 'SKINCARE', wall: 'Top wall', category: 'Suncare' },
  { brand: 'Lakme Skin', zone: 'SKINCARE', wall: 'Top wall', category: 'Skincare' },
  { brand: 'Accessories', zone: 'IMPULSE_BUYS', wall: 'Top wall', category: 'Add-on' },
  { brand: 'Maybelline', zone: 'IMPULSE_BUYS', wall: 'Bottom wall', category: 'Makeup' },
  { brand: 'Faces Canada', zone: 'IMPULSE_BUYS', wall: 'Bottom wall', category: 'Makeup' },
  { brand: 'Lakme', zone: 'IMPULSE_BUYS', wall: 'Bottom wall', category: 'Makeup' },
  { brand: 'Colorbar + Sugar', zone: 'IMPULSE_BUYS', wall: 'Bottom wall', category: 'Makeup' },
  { brand: 'Swiss Beauty', zone: 'IMPULSE_BUYS', wall: 'Bottom wall', category: 'Makeup' },
  { brand: 'Renee + NY Bae', zone: 'IMPULSE_BUYS', wall: 'Bottom wall', category: 'Makeup' },
  { brand: 'Alps Goodness', zone: 'WELLNESS', wall: 'Bottom wall', category: 'Wellness' },
  { brand: 'Streax', zone: 'HAIRCARE', wall: 'Bottom wall', category: 'Haircare' },
  { brand: 'Nail Unit', zone: 'IMPULSE_BUYS', wall: 'Island', category: 'Nails' },
  { brand: 'Fragrance + Cosmetics', zone: 'FRAGRANCES', wall: 'Island', category: 'Fragrance' },
  { brand: 'PMU', zone: 'BILLING_QUEUE', wall: 'Checkout', category: 'Checkout service' },
];

function metricByZone(metrics: StoreMetrics, zone: string): ZoneDwellMetric | undefined {
  return metrics.avg_dwell_per_zone?.find((item) => item.zone_id === zone);
}

function bayScore(metrics: StoreMetrics, bay: BrandBay) {
  const zoneMetric = metricByZone(metrics, bay.zone);
  if (!zoneMetric) return 0;
  return Math.min(100, Math.round((zoneMetric.visit_count * 12) + (zoneMetric.avg_dwell_seconds * 1.2)));
}

function scoreBand(score: number) {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  if (score > 0) return 'cool';
  return 'quiet';
}

export default function BrandMerchandisingMap({ metrics }: BrandMerchandisingMapProps) {
  const ranked = [...BRAND_BAYS].sort((a, b) => bayScore(metrics, b) - bayScore(metrics, a));
  const topBrand = ranked.find((bay) => bayScore(metrics, bay) > 0) ?? ranked[0];
  const topScore = bayScore(metrics, topBrand);
  const checkoutRisk = metrics.queue_depth > 3;

  const recommendation = checkoutRisk
    ? 'Queue is high, so defer brand assistance and protect billing throughput first.'
    : topScore > 0
      ? `Use staff prompts near ${topBrand.brand} to convert ${topBrand.category.toLowerCase()} interest into billing movement.`
      : 'Replay events to populate brand-level attention from zone dwell.';

  return (
    <div className="panel-card brand-map-card">
      <div className="panel-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 21V7l6-4 6 4 6-4v14l-6 4-6-4-6 4z" />
          <path d="M9 3v14M15 7v14" />
        </svg>
        Brand Merchandising Map
        <span className="panel-title-badge">FROM STORE LAYOUT</span>
      </div>

      <div className="brand-summary">
        <div>
          <span className="brand-summary-label">Highest attention bay</span>
          <strong>{topBrand.brand}</strong>
          <small>{topBrand.wall} / {topBrand.category}</small>
        </div>
        <div className="brand-reco">
          <span className="action-label">Brand Action</span>
          <p>{recommendation}</p>
        </div>
      </div>

      <div className="brand-layout-grid">
        {BRAND_BAYS.map((bay) => {
          const score = bayScore(metrics, bay);
          return (
            <div key={`${bay.wall}-${bay.brand}`} className={`brand-bay ${scoreBand(score)}`}>
              <span className="brand-wall">{bay.wall}</span>
              <strong>{bay.brand}</strong>
              <small>{bay.category}</small>
              <div className="brand-score-track">
                <span style={{ width: `${score}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
