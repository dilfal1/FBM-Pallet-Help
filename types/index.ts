export type Intake = {}

export interface Item {
  id: string;
  manifest_id: string;
  rawTitle: string;
  raw_title: string;
  brand?: string;
  model?: string;
  upc?: string;
  costco_item_number?: string;
  qty: number;
  category_tag: 'Quick Flip' | 'Bulky' | 'Bundle Candidate' | 'Unknown';
  retailPrice?: number;
  retail_price?: number;
  fbm_est_low?: number;
  fbm_est_high?: number;
  photo_url?: string;
  user_photo_url?: string;
  draft_title: string;
  draft_description: string;
  draft_price?: number;
  draft_price_per_unit?: number; // Price for individual item
  confidence_score: number;
  risk_score: 'Low' | 'Medium' | 'High';
  condition_discount: number;
  estPriceEach: number; // Price per unit
  include: boolean;
}

export interface Manifest {
  id: string;
  name: string;
  uploadedAt: Date;
  itemCount: number;
}

export interface Bundle {
  id: string;
  name: string;
  items: Item[];
  totalValue: number;
}