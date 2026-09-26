// src/types/index.ts

export type TrackingStatus = 'watching' | 'target_reached' | 'price_dropped' | 'price_increased' | 'checking';

export interface Product {
  id: string;
  name: string;
  url: string;
  imageUrl: string;
  store: string;
  category: string;
  brand: string;
  currentPrice: number;
  previousPrice: number;
  originalPrice?: number;
  targetPrice: number;
  currency: string;
  specs: Record<string, string>;
  lastChecked: string;
  discountPercent?: number;
  asin?: string;
  rating?: number;
  reviewCount?: number;
  dealScore?: number;
  dealStatus?: string;
  savingsAmount?: number;
  source?: string;
  availability?: string;
  userEmail?: string;
}

export interface PriceHistoryPoint {
  id: string;
  productId: string;
  price: number;
  recordedAt: string;
  source: string;
  note?: string;
}

export interface StoreListing {
  store: string;
  storeLogo?: string;
  price: number;
  originalPrice?: number;
  url: string;
  inStock: boolean;
  deliveryTime?: string;
  lastUpdated: string;
}

export interface AlternativeProduct {
  id: string;
  productId: string; // The parent tracked product it compares against
  name: string;
  price: number;
  originalPrice?: number;
  savings: number;
  store: string;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  specs: Record<string, string>;
  similarityPercent: number;
  similarityExplanation: string;
  aiInsight: string;
  productUrl: string;
  isSameProduct: boolean; // true if same exact model at another store, false if alternative
}

export type BuyVerdict = 'good_time' | 'maybe_wait' | 'wait';

export interface AIDealInsight {
  verdict: BuyVerdict;
  genZBadge: string;
  headline: string;
  explanation: string;
  recentAverage: number;
  lowestRecorded: number;
  highestRecorded: number;
  currentPrice: number;
  targetPrice: number;
  predictionRange: [number, number];
  predictionConfidence: 'high' | 'medium' | 'insufficient_data';
  confidenceNote: string;
  pros?: string[];
  cons?: string[];
  whatToWatch?: string;
}

export interface NotificationItem {
  id: string;
  type: 'price_drop' | 'target_reached' | 'price_increased' | 'alternative_found' | 'tracking_error' | 'purchase_recorded' | 'cart_price_drop' | 'cart_target_reached' | 'potential_saving';
  productId?: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  badge?: string;
  priceChange?: number;
}

// 🛒 CART TRACKING TYPES
export type CartTrackingStatus = 'active' | 'paused';
export type CartPriceEventType = 'PRICE_DROP' | 'PRICE_INCREASE' | 'TARGET_REACHED' | 'NEW_LOW' | 'NO_CHANGE' | 'TRACKING_ERROR';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  imageUrl: string;
  store: string;
  url: string;
  category?: string;
  currentPrice: number;
  previousPrice: number;
  lowestTrackedPrice: number;
  highestTrackedPrice: number;
  targetPrice: number;
  priceChange: number; // currentPrice - previousPrice (< 0 is drop)
  percentageChange: number;
  trackingStatus: CartTrackingStatus;
  lastChecked: string;
  addedAt: string;
  isDemo?: boolean;
}

export interface CartSummary {
  totalItems: number;
  currentCartValue: number;
  previousCartValue: number;
  cartPriceChange: number; // currentCartValue - previousCartValue
  potentialSavings: number;
  itemsWithPriceDrops: number;
  itemsWithPriceIncreases: number;
  targetsReached: number;
}

// 💰 SAVINGS VAULT TYPES
export type ReferencePriceType = 'initial_tracked' | 'historical_average' | 'launch_peak' | 'user_custom';

export interface PurchaseRecord {
  id: string;
  productId: string;
  productName: string;
  category: string;
  store: string;
  imageUrl: string;
  referencePrice: number;
  referenceType: ReferencePriceType;
  referenceTypeLabel: string;
  purchasePrice: number;
  savings: number; // Max(0, referencePrice - purchasePrice)
  savingsPercentage: number;
  purchaseDate: string;
  orderRef?: string;
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface SavingsVaultStats {
  totalRealizedSavings: number;
  totalDemoSavings: number;
  realPurchasesCount: number;
  demoPurchasesCount: number;
  averageSavingPerPurchase: number;
  largestSaving: number;
  savedThisMonth: number;
  savedThisYear: number;
  savingsByCategory: Record<string, number>;
  savingsByStore: Record<string, number>;
}

