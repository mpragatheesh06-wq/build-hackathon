// src/context/PriceWatchContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Product,
  NotificationItem,
  PriceHistoryPoint,
  CartItem,
  CartSummary,
  PurchaseRecord,
  SavingsVaultStats,
} from '../types';
import {
  initialMockProducts,
  initialMockNotifications,
  mockPriceHistories,
  initialMockCartItems,
  initialMockPurchases,
} from '../data/mockData';

interface PriceWatchContextType {
  // Watchlist
  products: Product[];
  notifications: NotificationItem[];
  unreadNotifCount: number;
  activeProductId: string;
  setActiveProductId: (id: string) => void;
  addProduct: (product: Product) => void;
  removeProduct: (productId: string) => void;
  updateTargetPrice: (productId: string, newTarget: number) => void;
  togglePauseTracking: (productId: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  simulatePriceDrop: (productId: string, newPrice: number, storeLabel?: string) => void;
  resetDemoData: () => void;
  pausedProductIds: string[];
  stats: {
    totalWatching: number;
    priceDropsDetected: number;
    potentialSavings: number;
    targetsReached: number;
  };

  // 🛒 Cart Tracking
  cartItems: CartItem[];
  cartSummary: CartSummary;
  addToCart: (product: Product | Partial<Product>, targetPrice?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  toggleCartTracking: (cartItemId: string) => void;
  updateCartItemTarget: (cartItemId: string, newTarget: number) => void;
  simulateCartPriceChange: (cartItemId: string, newPrice: number) => void;
  checkCartPricesNow: () => Promise<void>;

  // 💰 Savings Vault
  purchases: PurchaseRecord[];
  vaultStats: SavingsVaultStats;
  recordPurchase: (data: {
    productId: string;
    productName: string;
    category?: string;
    store?: string;
    imageUrl?: string;
    referencePrice: number;
    referenceType: 'initial_tracked' | 'historical_average' | 'launch_peak' | 'user_custom';
    referenceTypeLabel: string;
    purchasePrice: number;
    purchaseDate?: string;
    orderRef?: string;
    notes?: string;
    isDemo?: boolean;
  }) => PurchaseRecord;
  deletePurchase: (purchaseId: string) => void;
}

const PriceWatchContext = createContext<PriceWatchContextType | undefined>(undefined);

const STORAGE_PRODUCTS_KEY = 'pricepulse_watchlist_products';
const STORAGE_NOTIFS_KEY = 'pricepulse_notifications_list';
const STORAGE_CART_KEY = 'pricepulse_tracked_cart';
const STORAGE_PURCHASES_KEY = 'pricepulse_savings_purchases';

export const PriceWatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Watchlist Products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PRODUCTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not parse saved products:', e);
    }
    return initialMockProducts;
  });

  // 2. Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_NOTIFS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not parse saved notifications:', e);
    }
    return initialMockNotifications;
  });

  // 3. Tracked Cart Items
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CART_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not parse saved cart:', e);
    }
    return initialMockCartItems;
  });

  // 4. Realized Purchases (Savings Vault)
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PURCHASES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not parse saved purchases:', e);
    }
    return initialMockPurchases;
  });

  const [activeProductId, setActiveProductId] = useState<string>(
    () => products[0]?.id || 'prod-s25'
  );

  const [pausedProductIds, setPausedProductIds] = useState<string[]>([]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
    } catch (e) {
      console.warn('Failed saving products to localStorage:', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_NOTIFS_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Failed saving notifications to localStorage:', e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Failed saving cart to localStorage:', e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PURCHASES_KEY, JSON.stringify(purchases));
    } catch (e) {
      console.warn('Failed saving purchases to localStorage:', e);
    }
  }, [purchases]);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  // Add new tracked product to Watchlist
  const addProduct = (product: Product) => {
    setProducts((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.map((p) => (p.id === product.id ? { ...p, ...product } : p));
      }
      return [product, ...prev];
    });
    setActiveProductId(product.id);

    // Record initial snapshot in price history
    if (!mockPriceHistories[product.id]) {
      mockPriceHistories[product.id] = [];
    }
    mockPriceHistories[product.id].push({
      id: `snap-${Date.now()}`,
      productId: product.id,
      price: product.currentPrice,
      recordedAt: new Date().toISOString().split('T')[0],
      source: product.store || 'Amazon India',
      note: 'Started Watching',
    });

    // In-app notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      type: 'price_drop',
      productId: product.id,
      title: '👀 Watch Added',
      message: `Now actively monitoring ${product.name}. Target set to ₹${product.targetPrice.toLocaleString()}.`,
      timestamp: 'Just now',
      read: false,
      badge: '👀 On the radar',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Native Browser notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('⚡ PricePulse: New Product Tracked', {
          body: `Now monitoring ${product.name.slice(0, 40)}... Target: ₹${product.targetPrice.toLocaleString()}`,
          icon: product.imageUrl,
        });
      } catch (e) {
        console.warn('Browser notification error:', e);
      }
    }
  };

  const removeProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    if (activeProductId === productId && products.length > 1) {
      const remaining = products.filter((p) => p.id !== productId);
      setActiveProductId(remaining[0]?.id || '');
    }
  };

  const updateTargetPrice = (productId: string, newTarget: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return { ...p, targetPrice: newTarget };
        }
        return p;
      })
    );
  };

  const togglePauseTracking = (productId: string) => {
    setPausedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // ==========================================
  // 🛒 CART PRICE TRACKING OPERATIONS
  // ==========================================

  const addToCart = (product: Product | Partial<Product>, targetPrice?: number) => {
    if (!product.name || !product.currentPrice) return;

    const existingIndex = cartItems.findIndex(
      (c) => c.productId === product.id || c.name.toLowerCase() === product.name?.toLowerCase()
    );

    const price = product.currentPrice;
    const target = targetPrice || product.targetPrice || Math.round(price * 0.9);

    if (existingIndex >= 0) {
      // Update existing cart item
      setCartItems((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex
            ? {
                ...item,
                targetPrice: target,
                trackingStatus: 'active',
                lastChecked: 'Just now',
              }
            : item
        )
      );
    } else {
      // Create new cart item
      const newCartItem: CartItem = {
        id: `cart-${Date.now()}`,
        productId: product.id || `prod-custom-${Date.now()}`,
        name: product.name,
        imageUrl:
          product.imageUrl ||
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&auto=format&fit=crop&q=80',
        store: product.store || 'Amazon India',
        url: product.url || 'https://amazon.in',
        category: product.category || 'Electronics',
        currentPrice: price,
        previousPrice: product.previousPrice || price,
        lowestTrackedPrice: price,
        highestTrackedPrice: product.originalPrice || price,
        targetPrice: target,
        priceChange: (product.previousPrice ? price - product.previousPrice : 0),
        percentageChange: product.previousPrice
          ? Number((((price - product.previousPrice) / product.previousPrice) * 100).toFixed(1))
          : 0,
        trackingStatus: 'active',
        lastChecked: 'Just now',
        addedAt: new Date().toISOString().split('T')[0],
      };

      setCartItems((prev) => [newCartItem, ...prev]);

      // In-app notification
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        type: 'price_drop',
        productId: newCartItem.productId,
        title: '🛒 Added to Tracked Cart',
        message: `Now tracking cart price for ${product.name}. Target set to ₹${target.toLocaleString()}.`,
        timestamp: 'Just now',
        read: false,
        badge: '🛒 Cart Active',
      };
      setNotifications((prev) => [notif, ...prev]);
    }
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const toggleCartTracking = (cartItemId: string) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === cartItemId
          ? {
              ...item,
              trackingStatus: item.trackingStatus === 'active' ? 'paused' : 'active',
            }
          : item
      )
    );
  };

  const updateCartItemTarget = (cartItemId: string, newTarget: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === cartItemId ? { ...item, targetPrice: newTarget } : item
      )
    );
  };

  const simulateCartPriceChange = (cartItemId: string, newPrice: number) => {
    const item = cartItems.find((c) => c.id === cartItemId);
    if (!item) return;

    const oldPrice = item.currentPrice;
    const priceChange = newPrice - oldPrice;
    const percentageChange = Number((((newPrice - oldPrice) / oldPrice) * 100).toFixed(1));
    const isDrop = priceChange < 0;
    const isTargetHit = newPrice <= item.targetPrice;
    const isNewLow = newPrice < item.lowestTrackedPrice;

    // 1. Update Cart Item State
    setCartItems((prev) =>
      prev.map((c) =>
        c.id === cartItemId
          ? {
              ...c,
              previousPrice: oldPrice,
              currentPrice: newPrice,
              priceChange,
              percentageChange,
              lowestTrackedPrice: isNewLow ? newPrice : c.lowestTrackedPrice,
              highestTrackedPrice: Math.max(c.highestTrackedPrice, newPrice),
              lastChecked: 'Just now (Simulated)',
            }
          : c
      )
    );

    // 2. Also keep watchlist & history in sync
    setProducts((prev) =>
      prev.map((p) =>
        p.id === item.productId
          ? {
              ...p,
              previousPrice: oldPrice,
              currentPrice: newPrice,
              lastChecked: 'Just now (Cart Check)',
            }
          : p
      )
    );

    // Record price snapshot
    if (!mockPriceHistories[item.productId]) {
      mockPriceHistories[item.productId] = [];
    }
    mockPriceHistories[item.productId].push({
      id: `snap-cart-${Date.now()}`,
      productId: item.productId,
      price: newPrice,
      recordedAt: new Date().toISOString().split('T')[0],
      source: `${item.store} (Cart Check)`,
      note: isTargetHit
        ? 'Cart Target Hit!'
        : isDrop
        ? `Cart Drop ₹${Math.abs(priceChange).toLocaleString()}`
        : 'Cart Price Change',
    });

    // 3. Dispatch Notification
    const notifTitle = isTargetHit
      ? '🎯 Cart Item Target Hit!'
      : isDrop
      ? `🔥 Cart Price Drop: ₹${Math.abs(priceChange).toLocaleString()}`
      : `⚠️ Cart Price Increased: +₹${priceChange.toLocaleString()}`;

    const notifMsg = isDrop
      ? `Your cart item "${item.name}" dropped by ₹${Math.abs(priceChange).toLocaleString()} to ₹${newPrice.toLocaleString()}!`
      : `Your cart item "${item.name}" increased by ₹${priceChange.toLocaleString()} (now ₹${newPrice.toLocaleString()}).`;

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      type: isTargetHit ? 'cart_target_reached' : isDrop ? 'cart_price_drop' : 'price_increased',
      productId: item.productId,
      title: notifTitle,
      message: notifMsg,
      timestamp: 'Just now',
      read: false,
      badge: isTargetHit ? '🎯 Target Reached' : isDrop ? '🔥 Cart Cheaper' : '⚠️ Price Up',
      priceChange,
    };
    setNotifications((prev) => [notif, ...prev]);

    // Dispatch external notification (email etc.)
    import('../services/notificationService').then(({ notificationService }) => {
      notificationService.dispatchEvent(isTargetHit ? 'target_reached' : 'price_drop', {
        product: {
          id: item.productId,
          name: item.name,
          currentPrice: newPrice,
          previousPrice: oldPrice,
          targetPrice: item.targetPrice,
          store: item.store,
          url: item.url,
          imageUrl: item.imageUrl,
        } as any,
        previousPrice: oldPrice,
        currentPrice: newPrice,
        targetPrice: item.targetPrice,
      });
    });
  };

  const checkCartPricesNow = async () => {
    // Simulate real-time retailer check for all active cart items
    await new Promise((r) => setTimeout(r, 600));
    setCartItems((prev) =>
      prev.map((item) => ({
        ...item,
        lastChecked: 'Just now (Verified)',
      }))
    );
  };

  // ==========================================
  // 💰 SAVINGS VAULT OPERATIONS (REALIZED SAVINGS)
  // ==========================================

  const recordPurchase = (data: {
    productId: string;
    productName: string;
    category?: string;
    store?: string;
    imageUrl?: string;
    referencePrice: number;
    referenceType: 'initial_tracked' | 'historical_average' | 'launch_peak' | 'user_custom';
    referenceTypeLabel: string;
    purchasePrice: number;
    purchaseDate?: string;
    orderRef?: string;
    notes?: string;
    isDemo?: boolean;
  }): PurchaseRecord => {
    const rawSavings = data.referencePrice - data.purchasePrice;
    const realizedSavings = Math.max(0, rawSavings); // Deterministic: Never negative savings
    const savingsPercentage =
      data.referencePrice > 0
        ? Number(((realizedSavings / data.referencePrice) * 100).toFixed(1))
        : 0;

    const newRecord: PurchaseRecord = {
      id: `purch-${Date.now()}`,
      productId: data.productId,
      productName: data.productName,
      category: data.category || 'Electronics',
      store: data.store || 'Amazon India',
      imageUrl:
        data.imageUrl ||
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
      referencePrice: data.referencePrice,
      referenceType: data.referenceType,
      referenceTypeLabel: data.referenceTypeLabel,
      purchasePrice: data.purchasePrice,
      savings: realizedSavings,
      savingsPercentage,
      purchaseDate: data.purchaseDate || new Date().toISOString().split('T')[0],
      orderRef: data.orderRef || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: data.notes || '',
      isDemo: data.isDemo || false,
      createdAt: new Date().toISOString(),
    };

    setPurchases((prev) => [newRecord, ...prev]);

    // Create celebratory notification if savings > 0
    const notif: NotificationItem = {
      id: `notif-purch-${Date.now()}`,
      type: 'purchase_recorded',
      productId: data.productId,
      title: realizedSavings > 0 ? '🎉 Purchase Recorded — Money Saved!' : '📝 Purchase Logged',
      message:
        realizedSavings > 0
          ? `You saved ₹${realizedSavings.toLocaleString()} (${savingsPercentage}%) on ${data.productName}. Added to your Savings Vault!`
          : `Logged purchase for ${data.productName} at ₹${data.purchasePrice.toLocaleString()}.`,
      timestamp: 'Just now',
      read: false,
      badge: realizedSavings > 0 ? `💰 Saved ₹${realizedSavings.toLocaleString()}` : '📝 Purchased',
      priceChange: -realizedSavings,
    };
    setNotifications((prev) => [notif, ...prev]);

    return newRecord;
  };

  const deletePurchase = (purchaseId: string) => {
    setPurchases((prev) => prev.filter((p) => p.id !== purchaseId));
  };

  /**
   * DEMO / SIMULATED PRICE MODE (Watchlist)
   */
  const simulatePriceDrop = (productId: string, newPrice: number, storeLabel = 'Flash Sale') => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    const oldPrice = targetProduct.currentPrice;
    const diff = oldPrice - newPrice;
    const isTargetHit = newPrice <= targetProduct.targetPrice;

    // 1. Update product state
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            previousPrice: oldPrice,
            currentPrice: newPrice,
            lastChecked: 'Just now (Simulated)',
            discountPercent: p.originalPrice
              ? Number((((p.originalPrice - newPrice) / p.originalPrice) * 100).toFixed(1))
              : p.discountPercent,
          };
        }
        return p;
      })
    );

    // 2. Append to history
    if (!mockPriceHistories[productId]) {
      mockPriceHistories[productId] = [];
    }
    const newPoint: PriceHistoryPoint = {
      id: `sim-${Date.now()}`,
      productId,
      price: newPrice,
      recordedAt: new Date().toISOString().split('T')[0],
      source: `Simulated ${storeLabel}`,
      note: isTargetHit ? 'Target Reached!' : 'Price Drop',
    };
    mockPriceHistories[productId].push(newPoint);

    // 3. In-App Notification
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      type: isTargetHit ? 'target_reached' : 'price_drop',
      productId,
      title: isTargetHit ? '🎯 Target Price Hit!' : '🔥 Price Drop Detected',
      message: `${targetProduct.name} dropped by ₹${Math.abs(diff).toLocaleString()} (now ₹${newPrice.toLocaleString()}).`,
      timestamp: 'Just now',
      read: false,
      badge: isTargetHit ? '🎯 You called it. Target hit.' : '🔥 It finally dropped.',
      priceChange: -diff,
    };
    setNotifications((prev) => [notif, ...prev]);

    // 4. Native Browser Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(isTargetHit ? '🎯 Target Price Reached!' : '🔥 Price Drop Alert', {
          body: `${targetProduct.name.slice(0, 35)} dropped to ₹${newPrice.toLocaleString()}!`,
          icon: targetProduct.imageUrl,
        });
      } catch (e) {
        console.warn('Browser notification error:', e);
      }
    }

    // 5. Multi-channel dispatch
    import('../services/notificationService').then(({ notificationService }) => {
      notificationService.dispatchEvent(isTargetHit ? 'target_reached' : 'price_drop', {
        product: { ...targetProduct, currentPrice: newPrice },
        previousPrice: oldPrice,
        currentPrice: newPrice,
        targetPrice: targetProduct.targetPrice,
      });
    });
  };

  const resetDemoData = () => {
    setProducts(initialMockProducts);
    setNotifications(initialMockNotifications);
    setCartItems(initialMockCartItems);
    setPurchases(initialMockPurchases);
    setActiveProductId(initialMockProducts[0]?.id || 'prod-s25');
    setPausedProductIds([]);
    try {
      localStorage.removeItem(STORAGE_PRODUCTS_KEY);
      localStorage.removeItem(STORAGE_NOTIFS_KEY);
      localStorage.removeItem(STORAGE_CART_KEY);
      localStorage.removeItem(STORAGE_PURCHASES_KEY);
    } catch (e) {
      console.warn(e);
    }
  };

  // ==========================================
  // AGGREGATED STATS & DETERMINISTIC TOTALS
  // ==========================================

  // Watchlist Stats
  const totalWatching = products.length;
  const priceDropsDetected = products.filter((p) => p.previousPrice > p.currentPrice).length;
  const potentialSavings = products.reduce((acc, p) => {
    const savings = Math.max(0, (p.originalPrice || p.previousPrice) - p.currentPrice);
    return acc + savings;
  }, 0);
  const targetsReached = products.filter((p) => p.currentPrice <= p.targetPrice).length;

  // Cart Summary
  const currentCartValue = cartItems.reduce((acc, item) => acc + item.currentPrice, 0);
  const previousCartValue = cartItems.reduce((acc, item) => acc + item.previousPrice, 0);
  const cartPriceChange = currentCartValue - previousCartValue;
  const cartPotentialSavings = cartItems.reduce((acc, item) => {
    const pot = Math.max(0, (item.highestTrackedPrice || item.previousPrice) - item.currentPrice);
    return acc + pot;
  }, 0);
  const itemsWithPriceDrops = cartItems.filter((i) => i.currentPrice < i.previousPrice).length;
  const itemsWithPriceIncreases = cartItems.filter((i) => i.currentPrice > i.previousPrice).length;
  const cartTargetsReached = cartItems.filter((i) => i.currentPrice <= i.targetPrice).length;

  const cartSummary: CartSummary = {
    totalItems: cartItems.length,
    currentCartValue,
    previousCartValue,
    cartPriceChange,
    potentialSavings: cartPotentialSavings,
    itemsWithPriceDrops,
    itemsWithPriceIncreases,
    targetsReached: cartTargetsReached,
  };

  // Savings Vault Stats (Strict Separation of Real vs Demo)
  const realPurchases = purchases.filter((p) => !p.isDemo);
  const demoPurchases = purchases.filter((p) => p.isDemo);

  const totalRealizedSavings = realPurchases.reduce((acc, p) => acc + p.savings, 0);
  const totalDemoSavings = demoPurchases.reduce((acc, p) => acc + p.savings, 0);

  const realPurchasesCount = realPurchases.length;
  const demoPurchasesCount = demoPurchases.length;
  const averageSavingPerPurchase =
    realPurchasesCount > 0 ? Math.round(totalRealizedSavings / realPurchasesCount) : 0;
  const largestSaving = realPurchases.reduce((max, p) => Math.max(max, p.savings), 0);

  // Month & Year calculations
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const savedThisMonth = realPurchases.reduce((acc, p) => {
    const pDate = new Date(p.purchaseDate);
    if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
      return acc + p.savings;
    }
    return acc;
  }, 0);

  const savedThisYear = realPurchases.reduce((acc, p) => {
    const pDate = new Date(p.purchaseDate);
    if (pDate.getFullYear() === currentYear) {
      return acc + p.savings;
    }
    return acc;
  }, 0);

  // Category Breakdown
  const savingsByCategory: Record<string, number> = {};
  realPurchases.forEach((p) => {
    const cat = p.category || 'Other';
    savingsByCategory[cat] = (savingsByCategory[cat] || 0) + p.savings;
  });

  // Store Breakdown
  const savingsByStore: Record<string, number> = {};
  realPurchases.forEach((p) => {
    const store = p.store || 'Amazon India';
    savingsByStore[store] = (savingsByStore[store] || 0) + p.savings;
  });

  const vaultStats: SavingsVaultStats = {
    totalRealizedSavings,
    totalDemoSavings,
    realPurchasesCount,
    demoPurchasesCount,
    averageSavingPerPurchase,
    largestSaving,
    savedThisMonth,
    savedThisYear,
    savingsByCategory,
    savingsByStore,
  };

  return (
    <PriceWatchContext.Provider
      value={{
        products,
        notifications,
        unreadNotifCount,
        activeProductId,
        setActiveProductId,
        addProduct,
        removeProduct,
        updateTargetPrice,
        togglePauseTracking,
        markNotificationRead,
        markAllNotificationsRead,
        simulatePriceDrop,
        resetDemoData,
        pausedProductIds,
        stats: {
          totalWatching,
          priceDropsDetected,
          potentialSavings,
          targetsReached,
        },

        // Cart
        cartItems,
        cartSummary,
        addToCart,
        removeFromCart,
        toggleCartTracking,
        updateCartItemTarget,
        simulateCartPriceChange,
        checkCartPricesNow,

        // Savings Vault
        purchases,
        vaultStats,
        recordPurchase,
        deletePurchase,
      }}
    >
      {children}
    </PriceWatchContext.Provider>
  );
};

export const usePriceWatch = () => {
  const context = useContext(PriceWatchContext);
  if (!context) {
    throw new Error('usePriceWatch must be used within a PriceWatchProvider');
  }
  return context;
};
