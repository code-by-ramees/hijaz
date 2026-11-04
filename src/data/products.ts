// ─── Types ───────────────────────────────────────────────────────────────────

export type Category = 'pillows' | 'bedding' | 'bath';
export type BeddingType = 'king' | 'queen' | 'single';

export interface ProductReview {
  id?: number;
  product_id?: number;
  customer_name: string;
  customer_email?: string;
  rating: number;
  comment: string;
  sentiment?: string;
  created_at?: string;
}

export interface Product {
  id: number;
  category?: Category;
  /** Bedding sub-section — only relevant when category === 'bedding' */
  bedding_type?: BeddingType | null;
  name: string;
  subtitle: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  embed_urls?: string[];
  customer_reviews?: ProductReview[];
  customerReviews?: ProductReview[];
  badge?: string;
  rating: number;
  reviews: number;
}

export interface CategoryConfig {
  id: Category;
  label: string;
  tagline: string;
  bg: string;
  panel: string;
  heroImage: string;
  bgImage?: string;
}

// ─── Bedding sub-section config ───────────────────────────────────────────────

export interface BeddingSubConfig {
  id: BeddingType;
  label: string;
  tagline: string;
  icon: string;
}

export const BEDDING_SUB_CONFIG: Record<BeddingType, BeddingSubConfig> = {
  king: {
    id: 'king',
    label: 'King',
    tagline: 'Regal dimensions for the grandest of chambers.',
    icon: '👑',
  },
  queen: {
    id: 'queen',
    label: 'Queen',
    tagline: 'The perfect balance of luxury and comfort.',
    icon: '✨',
  },
  single: {
    id: 'single',
    label: 'Single',
    tagline: 'Intimate elegance crafted for personal sanctuary.',
    icon: '🌙',
  },
};

// ─── Category config ──────────────────────────────────────────────────────────

export const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
  pillows: {
    id: 'pillows',
    label: 'Luxury Pillows',
    tagline: 'Sink into cloud-like comfort and restorative sleep.',
    bg: '#8C7A6B',
    panel: '#B8A89A',
    heroImage: '/bed1.png',
    bgImage: '/hero.jpg?v=2',
  },
  bedding: {
    id: 'bedding',
    label: 'Bedding & Sleep',
    tagline: 'Drift into five-star serenity and timeless elegance.',
    bg: '#8A6A52',
    panel: '#A07D63',
    heroImage: '/bed.png',
    bgImage: '/bed.jpg?v=2',
  },
  bath: {
    id: 'bath',
    label: 'Bath & Towels Collection',
    tagline: 'Impossibly soft. Five-star spa indulgence.',
    bg: '#4A6572',
    panel: '#5B7C8D',
    heroImage: '/bath1.png',
    bgImage: '/towels.jpg?v=2',
  },
};
