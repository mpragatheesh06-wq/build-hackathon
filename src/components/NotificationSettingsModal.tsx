import { useState } from 'react';
import { Bell, Mail, Smartphone } from 'lucide-react';
import { notificationService, type NotificationPreferences } from '../services/notificationService';


export default function NotificationSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(notificationService.defaultPreferences);
  const [email, setEmail] = useState(preferences.channels.emailAddress || 'user@example.com');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Bell size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Alert Notification Settings
              </h3>
              <p className="text-xs text-gray-500">
                Configure channels and triggers for real-time price drops
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Channels Configuration */}
        <div className="my-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
            1. Active Notification Channels
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* In-App */}
            <div className={`p-4 rounded-2xl border transition ${preferences.channels.inApp ? 'bg-blue-50/60 border-blue-300' : 'bg-gray-50 border-gray-200'}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.channels.inApp}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    channels: { ...preferences.channels, inApp: e.target.checked }
                  })}
                  className="mt-1 h-4 w-4 rounded text-primary focus:ring-primary"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-sm text-gray-900">
                    <Bell size={16} className="text-primary" />
                    <span>In-App Notifications</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Live notification bell dropdown & animated screen toasts.
                  </p>
                </div>
              </label>
            </div>

            {/* Email */}
            <div className={`p-4 rounded-2xl border transition ${preferences.channels.email ? 'bg-purple-50/60 border-purple-300' : 'bg-gray-50 border-gray-200'}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.channels.email}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    channels: { ...preferences.channels, email: e.target.checked }
                  })}
                  className="mt-1 h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-gray-900">
                    <Mail size={16} className="text-purple-600" />
                    <span>Email Digest</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Daily summary & immediate drop alerts to your inbox.
                  </p>
                  {preferences.channels.email && (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="mt-2 w-full px-2.5 py-1 text-xs bg-white border border-purple-200 rounded-lg focus:outline-none"
                    />
                  )}
                </div>
              </label>
            </div>

            {/* SMS */}
            <div className={`p-4 rounded-2xl border transition ${preferences.channels.sms ? 'bg-orange-50/60 border-orange-300' : 'bg-gray-50 border-gray-200'}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.channels.sms}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    channels: { ...preferences.channels, sms: e.target.checked }
                  })}
                  className="mt-1 h-4 w-4 rounded text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-sm text-gray-900">
                    <Smartphone size={16} className="text-orange-600" />
                    <span>SMS Flash Alerts</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Critical target breaches via text message.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Triggers Section */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
            2. Trigger Conditions
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label className="p-3 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.triggers.targetReached}
                onChange={(e) => setPreferences({
                  ...preferences,
                  triggers: { ...preferences.triggers, targetReached: e.target.checked }
                })}
                className="rounded text-primary"
              />
              <span className="font-semibold text-gray-900">Target price is reached</span>
            </label>

            <label className="p-3 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.triggers.significantDrop}
                onChange={(e) => setPreferences({
                  ...preferences,
                  triggers: { ...preferences.triggers, significantDrop: e.target.checked }
                })}
                className="rounded text-primary"
              />
              <span className="font-semibold text-gray-900">Significant price drop occurs (≥ 5%)</span>
            </label>

            <label className="p-3 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.triggers.alternativeFound}
                onChange={(e) => setPreferences({
                  ...preferences,
                  triggers: { ...preferences.triggers, alternativeFound: e.target.checked }
                })}
                className="rounded text-primary"
              />
              <span className="font-semibold text-gray-900">Cheaper store / alternative found</span>
            </label>

            <label className="p-3 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.triggers.anyPriceChange}
                onChange={(e) => setPreferences({
                  ...preferences,
                  triggers: { ...preferences.triggers, anyPriceChange: e.target.checked }
                })}
                className="rounded text-primary"
              />
              <span className="font-semibold text-gray-900">Any minor price change</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
