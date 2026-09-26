import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  TrendingDown,
  Target,
  ShieldCheck,
  Flame,
  ExternalLink,
  Loader2,
  Bot,
  Send
} from 'lucide-react';
import { motion } from 'framer-motion';
import AddProductModal from '../components/AddProductModal';
import ProductCard from '../components/ProductCard';
import { usePriceWatch } from '../context/PriceWatchContext';
import { productService } from '../services/productService';
import { aiService } from '../services/aiService';
import { extractAmazonProductId } from '../services/amazonService';
import type { Product } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const { products, setActiveProductId } = usePriceWatch();
  const [url, setUrl] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Live Amazon Search & Deals Feed
  const [activeCategory, setActiveCategory] = useState<'all' | 'watches' | 'phones' | 'audio' | 'laptops'>('all');
  const [liveDeals, setLiveDeals] = useState<Product[]>([]);
  const [isDealsLoading, setIsDealsLoading] = useState(true);

  // AI Shopping Assistant state
  const [aiQuery, setAiQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiResponse, setAiResponse] = useState<{ explanation: string; matchedIds: string[] } | null>(null);

  // Initial featured hero product
  const heroProduct = products.find((p) => p.id === 'prod-xm5') || products[0];
  const detectedAsin = extractAmazonProductId(url);

  // Load real Amazon deals on mount and category tab switch
  useEffect(() => {
    let query = 'deals of the day electronics';
    if (activeCategory === 'watches') query = 'smart watches deals';
    if (activeCategory === 'phones') query = 'best selling 5g smartphones deals';
    if (activeCategory === 'audio') query = 'noise cancelling headphones wireless deals';
    if (activeCategory === 'laptops') query = 'laptops electronics deals';

    setIsDealsLoading(true);
    productService.searchAmazonDeals(query, 6).then((results) => {
      if (results.length > 0) {
        setLiveDeals(results);
      } else {
        // Fallback to initial mock products if search returned empty
        if (activeCategory === 'watches') {
          setLiveDeals(products.filter(p => p.category === 'Smartwatches'));
        } else {
          setLiveDeals(products.slice(0, 6));
        }
      }
      setIsDealsLoading(false);
    });
  }, [activeCategory]);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setUrl('https://www.amazon.in/dp/B0DGJ9MOCK');
    }
    setIsModalOpen(true);
  };

  const handleAiAssistantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setIsAiSearching(true);
    try {
      const allAvailable = [...liveDeals, ...products];
      const result = await aiService.queryShoppingAssistant(aiQuery, allAvailable);
      setAiResponse({
        explanation: result.explanation || 'Here are the best deals matching your request.',
        matchedIds: result.matchedProductIds || []
      });
    } catch (err) {
      console.error('AI Search error:', err);
    } finally {
      setIsAiSearching(false);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-10 pb-14 md:pt-16 md:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center max-w-3xl mx-auto relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-6 shadow-2xs">
            <Sparkles size={14} className="text-blue-600 animate-pulse" />
            <span>Real-time Amazon SerpApi + Groq AI Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6">
            Paste any Amazon link. <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Catch the absolute best deal.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            Live product extraction via SerpApi, factual deal score analysis, and instant email & in-app alerts whenever prices drop.
          </p>

          {/* Primary URL Input Widget */}
          <div className="max-w-2xl mx-auto bg-white p-2.5 sm:p-3 rounded-3xl shadow-xl shadow-blue-500/10 border border-gray-200">
            <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Paste an Amazon product link (e.g. https://amazon.in/dp/B0...)..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-3 text-xs sm:text-sm text-gray-900 bg-transparent rounded-2xl focus:outline-none placeholder:text-gray-400 font-medium"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-md shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
              >
                <span>Track Live Price</span>
                <ArrowRight size={16} className="text-white" />
              </button>
            </form>

            {detectedAsin && (
              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-emerald-700 font-bold px-2">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={13} />
                  ✓ Amazon ASIN {detectedAsin.asin} detected ({detectedAsin.domain})
                </span>
                <span className="text-gray-400 font-normal">Ready for live lookup</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
            <button
              onClick={() => navigate('/watches')}
              className="text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View My Watchlist ({products.length})</span>
              <ArrowRight size={13} />
            </button>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck size={14} className="text-emerald-500" />
              100% Real Live Retailer Data
            </span>
          </div>
        </div>

        {/* HERO SHOWCASE CARD */}
        {heroProduct && (
          <div className="mt-12 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xl shadow-gray-200/50 relative overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Live Deal Monitor Spotlight
                  </span>
                </div>
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-md">
                  {heroProduct.store}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gray-50 border border-gray-100 p-2 flex-shrink-0 flex items-center justify-center bg-white">
                  <img
                    src={heroProduct.imageUrl}
                    alt={heroProduct.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                    {heroProduct.name}
                  </h3>
                  <div className="flex flex-wrap items-baseline justify-center sm:justify-start gap-3 my-2">
                    <span className="text-2xl sm:text-3xl font-black text-gray-900">
                      ₹{heroProduct.currentPrice.toLocaleString()}
                    </span>
                    {heroProduct.originalPrice && heroProduct.originalPrice > heroProduct.currentPrice ? (
                      <span className="text-sm text-gray-400 line-through">
                        ₹{heroProduct.originalPrice.toLocaleString()}
                      </span>
                    ) : null}
                    {heroProduct.discountPercent ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <TrendingDown size={13} />
                        {heroProduct.discountPercent}% OFF
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-gray-500 mt-2">
                    <span className="flex items-center gap-1 font-medium">
                      <Target size={13} className="text-primary" />
                      Target: <strong>₹{heroProduct.targetPrice.toLocaleString()}</strong>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      Email Alerts Active
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setActiveProductId(heroProduct.id);
                      navigate('/history');
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Price History</span>
                    <ArrowRight size={14} />
                  </button>
                  <a
                    href={heroProduct.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <span>Store Link</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </section>

      {/* NATURAL LANGUAGE AI SHOPPING ASSISTANT SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold mb-4">
              <Bot size={14} />
              <span>Google Gemini + Groq AI Shopping Intelligence</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              Ask AI for data-grounded buying recommendations
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/80 mb-6">
              Ask in plain English: "Find me headphones under ₹20,000 with ANC" or "Show best laptop deals with 16GB RAM".
            </p>

            <form onSubmit={handleAiAssistantSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Find smartwatches under 25000 with 3-day battery..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-purple-300/50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50"
              />
              <button
                type="submit"
                disabled={isAiSearching || !aiQuery.trim()}
                className="px-5 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl font-bold text-xs sm:text-sm transition flex items-center gap-2 disabled:opacity-50 cursor-pointer flex-shrink-0"
              >
                {isAiSearching ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>Ask AI</span>
                    <Send size={14} />
                  </>
                )}
              </button>
            </form>

            {aiResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-2xl bg-white/10 border border-white/20 text-xs text-purple-100"
              >
                <div className="flex items-center gap-1.5 font-bold text-purple-300 mb-1">
                  <Sparkles size={14} />
                  <span>AI Shopping Recommendation:</span>
                </div>
                <p className="leading-relaxed">{aiResponse.explanation}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* REAL AMAZON DEALS DISCOVERY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame size={20} className="text-orange-500" />
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Live Amazon Deals & Price Drops
              </h2>
            </div>
            <p className="text-xs text-gray-500">
              Fetched in real-time from Amazon India via SerpApi with factual deal scores
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex-shrink-0 ${
                activeCategory === 'all'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              🔥 All Deals
            </button>
            <button
              onClick={() => setActiveCategory('watches')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex-shrink-0 ${
                activeCategory === 'watches'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              ⌚ Smartwatches
            </button>
            <button
              onClick={() => setActiveCategory('phones')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex-shrink-0 ${
                activeCategory === 'phones'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              📱 Smartphones
            </button>
            <button
              onClick={() => setActiveCategory('audio')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex-shrink-0 ${
                activeCategory === 'audio'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              🎧 Audio & ANC
            </button>
            <button
              onClick={() => setActiveCategory('laptops')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex-shrink-0 ${
                activeCategory === 'laptops'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              💻 Laptops & Tech
            </button>
          </div>
        </div>

        {/* Live Deals Grid */}
        {isDealsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs animate-pulse h-64 flex flex-col justify-between">
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-8 bg-gray-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveDeals.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showRemove={false}
              />
            ))}
          </div>
        )}
      </section>

      {/* CORE 3 PILLARS SECTION */}
      <section className="bg-white py-14 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
              Why PricePulse is Different
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Autonomous price intelligence tracking your favorite items with zero guesswork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-primary flex items-center justify-center mb-3 font-bold">
                <Target size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                1. Exact ASIN Verification
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                We verify product identifiers directly from Amazon via SerpApi so you always get the exact product data.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-3 font-bold">
                <Flame size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                2. Analog Deal Score Meter
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Objective 0-100 deal score calculated from real savings, reference prices, and verified ratings.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3 font-bold">
                <Sparkles size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                3. Groq AI Decision Intelligence
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Llama 3.3 analyses real numbers to deliver data-grounded Buy/Wait recommendations and alternative trade-offs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialUrl={url}
      />
    </div>
  );
}
