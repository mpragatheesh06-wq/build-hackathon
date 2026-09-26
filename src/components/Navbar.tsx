// src/components/Navbar.tsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle, Sparkles } from 'lucide-react';
import { usePriceWatch } from '../context/PriceWatchContext';
import NotificationDropdown from './NotificationDropdown';
import AddProductModal from './AddProductModal';
import NotificationSettingsModal from './NotificationSettingsModal';

export default function Navbar() {
  const location = useLocation();
  const { cartItems, vaultStats } = usePriceWatch();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Watchlist', path: '/watches' },
    {
      label: 'My Cart',
      path: '/cart',
      badge: cartItems.length > 0 ? cartItems.length.toString() : undefined,
      badgeColor: 'bg-blue-600 text-white',
    },
    {
      label: 'Savings Vault',
      path: '/vault',
      badge: vaultStats.totalRealizedSavings > 0 ? `₹${(vaultStats.totalRealizedSavings / 1000).toFixed(0)}k` : undefined,
      badgeColor: 'bg-emerald-600 text-white',
    },
    { label: 'Price History', path: '/history' },
    { label: 'Alternatives', path: '/alternatives' },
  ];

  return (
    <>
      <header className="bg-white sticky top-0 z-40 border-b border-gray-200/80 shadow-2xs backdrop-blur-md bg-white/95">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:scale-105 transition">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold text-gray-900 tracking-tight">PricePulse</span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium -mt-1 hidden sm:block">
                Personal Price Intelligence
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1 bg-gray-100/80 p-1 rounded-xl border border-gray-200/50">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-gray-900 shadow-xs font-bold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${link.badgeColor}`}>
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Action Items */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle size={15} />
              <span>Track Product</span>
            </button>



            {/* Notification Dropdown with unread badge */}
            <NotificationDropdown />


            {/* Gen-Z AI Status chip */}
            <div className="hidden lg:flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200/60">
              <Sparkles size={12} className="animate-spin" />
              <span>AI Analyst Active</span>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto border-t border-gray-100 px-3 py-2 bg-gray-50/95 text-xs font-medium">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1 flex-shrink-0 ${
                  isActive ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-gray-600'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${link.badgeColor}`}>
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Multi-Channel Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}

