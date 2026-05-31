export type FloorZoneId =
  | 'ENTRY_THRESHOLD'
  | 'SKINCARE'
  | 'HAIRCARE'
  | 'FRAGRANCES'
  | 'IMPULSE_BUYS'
  | 'BILLING_COUNTER'
  | 'BILLING_QUEUE'
  | 'WELLNESS';

export type FixtureType = 'wall' | 'island' | 'service';

export interface FloorFixture {
  id: string;
  label: string;
  zone: FloorZoneId;
  category: string;
  type: FixtureType;
  placement: 'top' | 'bottom' | 'center-left' | 'center' | 'right';
}

export interface SpatialZone {
  id: FloorZoneId;
  label: string;
  category: string;
  gridArea: string;
  color: string;
  signal: string;
}

export const SPATIAL_ZONES: SpatialZone[] = [
  {
    id: 'ENTRY_THRESHOLD',
    label: 'Front Entry',
    category: 'Entry glass',
    gridArea: 'entry',
    color: '#14b8a6',
    signal: 'Arrival pulse',
  },
  {
    id: 'SKINCARE',
    label: 'Skin Lab',
    category: 'Moisturisers, serums, suncare',
    gridArea: 'skincare',
    color: '#0ea5e9',
    signal: 'Wall dwell',
  },
  {
    id: 'HAIRCARE',
    label: 'Hair Bar',
    category: 'Shampoo and treatments',
    gridArea: 'haircare',
    color: '#f97316',
    signal: 'Assisted discovery',
  },
  {
    id: 'FRAGRANCES',
    label: 'Fragrance Table',
    category: 'Perfumes and attars',
    gridArea: 'fragrances',
    color: '#ec4899',
    signal: 'Try-and-browse',
  },
  {
    id: 'IMPULSE_BUYS',
    label: 'Makeup Islands',
    category: 'Makeup, nails, accessories',
    gridArea: 'impulse',
    color: '#f59e0b',
    signal: 'Basket add-on',
  },
  {
    id: 'BILLING_COUNTER',
    label: 'Cash Counter',
    category: 'Payment desk',
    gridArea: 'counter',
    color: '#6366f1',
    signal: 'Checkout handoff',
  },
  {
    id: 'BILLING_QUEUE',
    label: 'Queue Lane',
    category: 'Waiting area',
    gridArea: 'queue',
    color: '#22c55e',
    signal: 'Wait pressure',
  },
  {
    id: 'WELLNESS',
    label: 'Wellness Wall',
    category: 'Supplements and care',
    gridArea: 'wellness',
    color: '#10b981',
    signal: 'Low-touch assist',
  },
];

export const FLOOR_FIXTURES: FloorFixture[] = [
  { id: 'eb-korean', label: 'EB Korean', zone: 'SKINCARE', category: 'K-beauty', type: 'wall', placement: 'top' },
  { id: 'face-shop', label: 'The Face Shop', zone: 'SKINCARE', category: 'K-beauty', type: 'wall', placement: 'top' },
  { id: 'good-vibes', label: 'Good Vibes', zone: 'SKINCARE', category: 'Skincare', type: 'wall', placement: 'top' },
  { id: 'dermdoc', label: 'DermDoc', zone: 'SKINCARE', category: 'Derm skincare', type: 'wall', placement: 'top' },
  { id: 'minimalist', label: 'Minimalist', zone: 'SKINCARE', category: 'Actives', type: 'wall', placement: 'top' },
  { id: 'aqualogica', label: 'Aqualogica', zone: 'SKINCARE', category: 'Suncare', type: 'wall', placement: 'top' },
  { id: 'lakme-skin', label: 'Lakme Skin', zone: 'SKINCARE', category: 'Skincare', type: 'wall', placement: 'top' },
  { id: 'accessories', label: 'Accessories', zone: 'IMPULSE_BUYS', category: 'Add-on', type: 'wall', placement: 'top' },
  { id: 'nail-unit', label: 'Nail Unit', zone: 'IMPULSE_BUYS', category: 'Nails', type: 'island', placement: 'center-left' },
  { id: 'makeup-unit', label: 'Makeup Unit', zone: 'IMPULSE_BUYS', category: 'Makeup', type: 'island', placement: 'center' },
  { id: 'cash-counter', label: 'Cash Counter', zone: 'BILLING_COUNTER', category: 'Billing', type: 'service', placement: 'right' },
  { id: 'pmu', label: 'PMU', zone: 'BILLING_QUEUE', category: 'Checkout service', type: 'service', placement: 'right' },
  { id: 'maybelline', label: 'Maybelline', zone: 'IMPULSE_BUYS', category: 'Makeup', type: 'wall', placement: 'bottom' },
  { id: 'faces-canada', label: 'Faces Canada', zone: 'IMPULSE_BUYS', category: 'Makeup', type: 'wall', placement: 'bottom' },
  { id: 'lakme', label: 'Lakme', zone: 'IMPULSE_BUYS', category: 'Makeup', type: 'wall', placement: 'bottom' },
  { id: 'colorbar-sugar', label: 'Colorbar + Sugar', zone: 'IMPULSE_BUYS', category: 'Makeup', type: 'wall', placement: 'bottom' },
  { id: 'swiss-beauty', label: 'Swiss Beauty', zone: 'IMPULSE_BUYS', category: 'Makeup', type: 'wall', placement: 'bottom' },
  { id: 'renee-ny-bae', label: 'Renee / NY Bae', zone: 'IMPULSE_BUYS', category: 'Makeup', type: 'wall', placement: 'bottom' },
  { id: 'alps-goodness', label: 'Alps Goodness', zone: 'WELLNESS', category: 'Wellness', type: 'wall', placement: 'bottom' },
  { id: 'streax', label: 'Streax', zone: 'HAIRCARE', category: 'Haircare', type: 'wall', placement: 'bottom' },
];
