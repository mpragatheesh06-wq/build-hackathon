// src/services/notificationService.ts
import type { Product } from '../types';

export interface NotificationChannelsConfig {
  inApp: boolean;
  email: boolean;
  sms: boolean;
  phoneNumber?: string;
  emailAddress?: string;
}

export interface NotificationTriggersConfig {
  targetReached: boolean;
  significantDrop: boolean;
  anyPriceChange: boolean;
  alternativeFound: boolean;
}

export interface NotificationPreferences {
  channels: NotificationChannelsConfig;
  triggers: NotificationTriggersConfig;
}

export interface NotificationPayload {
  product: Product;
  previousPrice: number;
  currentPrice: number;
  targetPrice: number;
  customNote?: string;
}

export interface DeliveryLog {
  id: string;
  channel: 'in_app' | 'email' | 'sms';
  status: 'delivered' | 'simulated' | 'failed';
  title: string;
  message: string;
  timestamp: string;
  formattedPreview?: string;
}

// In-memory simulated logs
const deliveryLogs: DeliveryLog[] = [];

/**
 * Modular Notification Service Architecture
 * Supports In-App, Email, and SMS channels.
 */
export const notificationService = {
  defaultPreferences: {
    channels: {
      inApp: true,
      email: true,
      sms: false,
      phoneNumber: '+91 98765 43210',
      emailAddress: 'user@example.com'
    },
    triggers: {
      targetReached: true,
      significantDrop: true,
      anyPriceChange: false,
      alternativeFound: true
    }
  } as NotificationPreferences,

  /**
   * Unified Dispatch Engine
   */
  async dispatchEvent(
    _event: 'price_drop' | 'target_reached' | 'alternative_found',
    payload: NotificationPayload,
    prefs?: NotificationPreferences
  ): Promise<DeliveryLog[]> {
    const activePrefs = prefs || this.defaultPreferences;
    const newLogs: DeliveryLog[] = [];

    // 1. Email Channel (Simulated)
    if (activePrefs.channels.email) {
      newLogs.push({
        id: `log-em-${Date.now()}`,
        channel: 'email',
        status: 'simulated',
        title: '📧 Email Notification',
        message: `Price drop digest dispatched to ${activePrefs.channels.emailAddress || 'user@example.com'}`,
        timestamp: 'Just now'
      });
    }

    // 2. SMS Channel (Simulated)
    if (activePrefs.channels.sms) {
      newLogs.push({
        id: `log-sms-${Date.now()}`,
        channel: 'sms',
        status: 'simulated',
        title: '📱 SMS Alert',
        message: `SMS flash alert sent to ${activePrefs.channels.phoneNumber || '+91 98765 43210'}`,
        timestamp: 'Just now'
      });
    }

    return newLogs;
  },

  getDeliveryLogs(): DeliveryLog[] {
    return deliveryLogs;
  }
};
