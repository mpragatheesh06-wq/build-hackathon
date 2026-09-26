import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CheckCircle, Loader2, Sparkles, X, Target, Bell, AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';
import { productService, type ProductAnalysisResult } from '../services/productService';
import { extractAmazonProductId } from '../services/amazonService';
import { usePriceWatch } from '../context/PriceWatchContext';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUrl?: string;
}

export default function AddProductModal({ isOpen, onClose, initialUrl = '' }: AddProductModalProps) {
  const { addProduct } = usePriceWatch();
  const [url, setUrl] = useState(initialUrl);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<ProductAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  const asinDetection = extractAmazonProductId(url);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (initialUrl) {
        setUrl(initialUrl);
        handleAnalyze(initialUrl);
      } else {
        setUrl('');
        setAnalysisResult(null);
      }
    } else {
      setAnalysisResult(null);
      setIsAnalyzing(false);
      setErrorMsg(null);
    }
  }, [isOpen, initialUrl]);

  const handleAnalyze = async (targetUrl: string) => {
    if (!targetUrl.trim()) {
      setErrorMsg('Please paste a product URL to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisResult(null);

    try {
      setAnalysisStep('Detecting retailer and product ID...');
      await new Promise(r => setTimeout(r, 200));

      const parsed = extractAmazonProductId(targetUrl);
      if (parsed) {
        setAnalysisStep(`Fetching verified details from ${parsed.domain} (ASIN: ${parsed.asin})...`);
      } else {
        setAnalysisStep('Verifying product URL...');
      }

      const result = await productService.analyzeUrl(targetUrl);
      setAnalysisStep('Computing deal score and pricing metrics...');
      await new Promise(r => setTimeout(r, 200));

      setAnalysisResult(result);
      const suggestedTarget = Math.round(result.product.currentPrice * 0.9);
      setTargetPrice(suggestedTarget.toString());
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMsg(err.message || 'We could not fetch this product right now.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const handleApplyDiscountShortcut = (percent: number) => {
    if (!analysisResult) return;
    const discounted = Math.round(analysisResult.product.currentPrice * (1 - percent / 100));
    setTargetPrice(discounted.toString());
  };

  const handleStartTracking = () => {
    if (!analysisResult || !targetPrice) return;

    const parsedTarget = Number(targetPrice) || analysisResult.product.currentPrice;
    const finalProduct = {
      ...analysisResult.product,
      targetPrice: parsedTarget,
    };

    addProduct(finalProduct);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white p-6 text-left align-middle shadow-2xl transition-all border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <Dialog.Title as="h3" className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <Target size={20} className="text-primary" />
                    Track Amazon Product
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* URL Input Form */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Product Link / ASIN
                    </label>
                    {asinDetection && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                        <ShieldCheck size={12} />
                        Amazon ASIN: {asinDetection.asin}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste Amazon link (e.g. https://amazon.in/dp/B0DGHZWBYB)..."
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => handleAnalyze(url)}
                      disabled={isAnalyzing || !url}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer flex-shrink-0 shadow-sm shadow-blue-500/20"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Fetching...</span>
                        </>
                      ) : (
                        <span>Analyze</span>
                      )}
                    </button>
                  </div>

                  {/* Quick helper test links */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                    <span>Try sample Amazon ASINs:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const sample = 'https://www.amazon.in/dp/B0DGHZWBYB';
                        setUrl(sample);
                        handleAnalyze(sample);
                      }}
                      className="text-primary hover:underline font-medium cursor-pointer"
                    >
                      iPhone 16
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => {
                        const sample = 'https://www.amazon.in/dp/B0H4L5T84X';
                        setUrl(sample);
                        handleAnalyze(sample);
                      }}
                      className="text-primary hover:underline font-medium cursor-pointer"
                    >
                      Galaxy M47
                    </button>
                  </div>
                </div>

                {/* Analysis Loading State */}
                {isAnalyzing && (
                  <div className="my-6 p-6 rounded-2xl bg-blue-50/60 border border-blue-100 text-center flex flex-col items-center justify-center">
                    <Loader2 size={32} className="text-primary animate-spin mb-3" />
                    <h4 className="text-sm font-bold text-gray-900 mb-1">
                      {analysisStep || 'Connecting to SerpApi...'}
                    </h4>
                    <p className="text-xs text-gray-500">
                      Verifying live product identity, retailer pricing, stock availability, and specs.
                    </p>
                  </div>
                )}

                {/* Error Banner with Try Again */}
                {!isAnalyzing && errorMsg && (
                  <div className="my-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 text-xs">
                        <h5 className="font-bold text-rose-900 mb-1">Unable to Fetch Product</h5>
                        <p className="text-rose-700 leading-relaxed mb-3">{errorMsg}</p>
                        <button
                          type="button"
                          onClick={() => handleAnalyze(url)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-2xs transition cursor-pointer"
                        >
                          <RefreshCw size={13} />
                          <span>Try Again</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Verified Detected Product Card */}
                {!isAnalyzing && analysisResult && (
                  <div className="mt-4 space-y-4">
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex gap-4 items-center">
                      <img
                        src={analysisResult.product.imageUrl}
                        alt={analysisResult.product.name}
                        className="w-18 h-18 object-cover rounded-xl border border-gray-200 bg-white p-1 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles size={10} />
                            ✓ Real Amazon Product
                          </span>
                          <span className="text-xs font-semibold text-gray-500">{analysisResult.product.store}</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 leading-snug">
                          {analysisResult.product.name}
                        </h4>
                        <div className="flex items-baseline gap-2 mt-1.5">
                          <span className="text-lg font-extrabold text-gray-900">
                            ₹{analysisResult.product.currentPrice.toLocaleString()}
                          </span>
                          {analysisResult.product.originalPrice && (
                            <span className="text-xs text-gray-400 line-through">
                              ₹{analysisResult.product.originalPrice.toLocaleString()}
                            </span>
                          )}
                          {analysisResult.product.discountPercent ? (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {analysisResult.product.discountPercent}% OFF
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Analog Deal Meter / Deal Score */}
                    {analysisResult.product.dealScore !== undefined && (
                      <div className="p-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 block">
                            Deal Meter Score
                          </span>
                          <span className="text-sm font-extrabold text-gray-900">
                            {analysisResult.product.dealStatus || 'Live Deal'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-xl font-black text-primary">
                              {analysisResult.product.dealScore}
                            </span>
                            <span className="text-xs text-gray-400">/100</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Target Price Section */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Target Alert Price (₹)
                        </label>
                        <span className="text-[11px] text-gray-400">
                          Current: ₹{analysisResult.product.currentPrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="relative mb-2">
                        <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                        <input
                          type="number"
                          placeholder="e.g. 75000"
                          value={targetPrice}
                          onChange={(e) => setTargetPrice(e.target.value)}
                          className="w-full pl-8 pr-4 py-2 text-sm font-bold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>

                      {/* Quick Shortcut Buttons */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-gray-400 text-[11px]">Quick presets:</span>
                        {[5, 10, 15].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleApplyDiscountShortcut(pct)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition cursor-pointer text-[11px]"
                          >
                            -{pct}% (₹{Math.round(analysisResult.product.currentPrice * (1 - pct / 100)).toLocaleString()})
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Alert Notification Channels */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                          Notification Channel
                        </label>
                        <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          💬 WhatsApp + In-App Enabled
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <label
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition ${
                            alertPref === 'target_reached'
                              ? 'bg-blue-50/70 border-primary text-primary font-semibold'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="alertPref"
                            checked={alertPref === 'target_reached'}
                            onChange={() => setAlertPref('target_reached')}
                            className="sr-only"
                          />
                          <Target size={15} />
                          <span>When Target Hit</span>
                        </label>

                        <label
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition ${
                            alertPref === 'any_drop'
                              ? 'bg-blue-50/70 border-primary text-primary font-semibold'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="alertPref"
                            checked={alertPref === 'any_drop'}
                            onChange={() => setAlertPref('any_drop')}
                            className="sr-only"
                          />
                          <Bell size={15} />
                          <span>On Any Price Drop</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="mt-6 pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleStartTracking}
                    disabled={isAnalyzing || !analysisResult || !targetPrice}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle size={15} />
                    <span>Start Watching Price</span>
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
