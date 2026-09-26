import { useState } from 'react';
import { MessageSquare, Phone, Bell, Mail, Smartphone, Send, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { usePriceWatch } from '../context/PriceWatchContext';
import { notificationService, type NotificationPreferences } from '../services/notificationService';


export default function NotificationSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { products } = usePriceWatch();
  const [preferences, setPreferences] = useState<NotificationPreferences>(notificationService.defaultPreferences);
  const [phone, setPhone] = useState(preferences.channels.phoneNumber || '+91 98765 43210');
  const [email, setEmail] = useState(preferences.channels.emailAddress || 'user@example.com');
  const [testSent, setTestSent] = useState(false);
  const [simulatedPreview, setSimulatedPreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleTestWhatsApp = async () => {
    setIsSending(true);
    setTestSent(false);
    const demoProduct = products[0] || {
      id: 'demo',
      name: 'Sony WH-1000XM5 Noise Cancelling Headphones',
      url: 'https://amazon.in/dp/B09XS7JWH5',
      imageUrl: '',
      store: 'Amazon India',
      category: 'Audio',
      brand: 'Sony',
      currentPrice: 27999,
      previousPrice: 31999,
      targetPrice: 28000,
      currency: '₹',
      specs: {},
      lastChecked: 'Just now'
    };

    const res = await notificationService.sendWhatsAppNotification({
      product: demoProduct,
      previousPrice: demoProduct.previousPrice,
      currentPrice: demoProduct.currentPrice,
      targetPrice: demoProduct.targetPrice,
      recipientPhone: phone
    });

    setIsSending(false);
    setTestSent(true);
    setSimulatedPreview(res.preview);
  };

  const handleOpenWhatsAppWeb = () => {
    if (!simulatedPreview) return;
    const encoded = encodeURIComponent(simulatedPreview);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <MessageSquare size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Multi-Channel Alert Engine
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                  WhatsApp Disabled
                </span>
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
            {/* WhatsApp */}
            <div className={`p-4 rounded-2xl border transition cursor-pointer ${preferences.channels.whatsapp ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs' : 'bg-gray-50 border-gray-200'}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.channels.whatsapp}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    channels: { ...preferences.channels, whatsapp: e.target.checked }
                  })}
                  className="mt-1 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-gray-900">
                    <MessageSquare size={16} className="text-emerald-600" />
                    <span>WhatsApp Alerts</span>
                    <span className="text-[10px] bg-emerald-500 text-white font-extrabold px-1.5 rounded">NEW</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Instant rich messages directly on WhatsApp with product direct links.
                  </p>
                </div>
              </label>

              {preferences.channels.whatsapp && (
                <div className="mt-3 pt-3 border-t border-emerald-200/60">
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    WhatsApp Mobile Number (with country code)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleTestWhatsApp}
                      disabled={isSending}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isSending ? (
                        <span>Simulating...</span>
                      ) : (
                        <>
                          <Send size={12} />
                          <span>Test</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

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

        {/* Simulated WhatsApp Preview Box */}
        {testSent && simulatedPreview && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-900 text-white border border-emerald-700 shadow-md">
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span className="text-xs font-bold text-emerald-200">
                  Demo / Simulated WhatsApp Notification
                </span>
              </div>
              <button
                onClick={handleOpenWhatsAppWeb}
                className="text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-md font-bold flex items-center gap-1 cursor-pointer transition"
              >
                <span>Send to my WhatsApp</span>
                <ExternalLink size={12} />
              </button>
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap bg-emerald-950/70 p-3 rounded-xl text-emerald-100 leading-relaxed border border-emerald-800/60">
              {simulatedPreview}
            </pre>
            <p className="text-[11px] text-emerald-300/80 mt-2 flex items-center gap-1">
              <ShieldCheck size={12} />
              Simulated via WhatsApp Service Provider interface. Real production keys remain secure server-side.
            </p>
          </div>
        )}

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
