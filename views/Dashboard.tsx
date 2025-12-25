
import React, { useState, useEffect, useRef } from 'react';
import { AppState, JournalEntry } from '../types';
import { Card, Button, Input } from '../components/ui';
import { AlertCircle, CheckCircle, TrendingUp, Shield, Wallet, AlertTriangle, CalendarCheck, Download, Upload, RefreshCw, Loader2 } from 'lucide-react';

const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
const formatPct = (val: number) => `${(val * 100).toFixed(1)}%`;

interface DashboardProps {
  state: AppState;
  journal: JournalEntry[];
  updateEOD: (prices: Record<string, number>) => void;
  markMonthlyAdjustment: () => void;
  importData: (data: { state: AppState, journal: JournalEntry[] }) => boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, journal, updateEOD, markMonthlyAdjustment, importData }) => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [tempPrices, setTempPrices] = useState<Record<string, string>>({});
  const [animateBar, setAnimateBar] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  
  // Hidden file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimateBar(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // --- Calculations ---
  const positionsValue = state.holdings.reduce((sum, h) => sum + (h.shares * h.currentPrice), 0);
  const totalValue = positionsValue + state.cashUSD;
  
  const todayChangeValue = state.holdings.reduce((sum, h) => sum + ((h.currentPrice - h.prevClose) * h.shares), 0);
  const todayChangePct = totalValue > 0 ? todayChangeValue / (totalValue - todayChangeValue) : 0;

  // Buckets
  const getBucketVal = (type: 'ETF' | 'Trading' | 'Hedge') => 
    state.holdings.filter(h => h.bucket === type).reduce((sum, h) => sum + (h.shares * h.currentPrice), 0);

  const buckets = {
    ETF: getBucketVal('ETF'),
    Trading: getBucketVal('Trading'),
    Hedge: getBucketVal('Hedge') + state.cashUSD, // Cash lives in Hedge bucket logically for allocation
    HedgeOnly: getBucketVal('Hedge') // Pure hedge positions without cash
  };

  const alloc = {
    ETF: totalValue > 0 ? buckets.ETF / totalValue : 0,
    Trading: totalValue > 0 ? buckets.Trading / totalValue : 0,
    Hedge: totalValue > 0 ? buckets.Hedge / totalValue : 0,
    HedgeOnly: totalValue > 0 ? buckets.HedgeOnly / totalValue : 0
  };

  // --- Strategic Checks ---

  // 1. ETF Checks (Target 25%, Range 20-30%)
  const etfWarnings: string[] = [];
  if (alloc.ETF < 0.20 && alloc.ETF > 0) etfWarnings.push("Underweight (<20%)");
  if (alloc.ETF > 0.30) etfWarnings.push("Overweight (>30%)");
  
  const daysSinceAdjustment = state.lastMonthlyAdjustment 
    ? Math.floor((Date.now() - state.lastMonthlyAdjustment) / (1000 * 60 * 60 * 24)) 
    : 999;
  const needsAdjustment = daysSinceAdjustment >= 30;

  // 2. Trading Checks (Target 45-50%, Alert range 45-55%)
  const tradeWarnings: string[] = [];
  // Allocation Alerts
  if (alloc.Trading < 0.45 && alloc.Trading > 0) tradeWarnings.push("Underweight (<45%)");
  if (alloc.Trading > 0.55) tradeWarnings.push("Overweight (>55%)");

  // Count & Concentration Alerts
  const tradingHoldings = state.holdings.filter(h => h.bucket === 'Trading');
  const uniqueTradingSymbols = new Set(tradingHoldings.map(h => h.symbol));
  
  if (tradingHoldings.length > 0 && uniqueTradingSymbols.size < 3) tradeWarnings.push("Count Low (<3)");
  if (uniqueTradingSymbols.size > 5) tradeWarnings.push("Count High (>5)");
  
  // Calculate concentration by unique symbol
  uniqueTradingSymbols.forEach(sym => {
    const symbolValue = tradingHoldings.filter(h => h.symbol === sym).reduce((sum, h) => sum + (h.shares * h.currentPrice), 0);
    const posPct = symbolValue / totalValue;
    if (posPct > 0.15) tradeWarnings.push(`Concentrated: ${sym} ${(posPct*100).toFixed(0)}%`);
  });

  // 3. Hedge/Cash Checks (Target 20-35%, Alert range 15-35%)
  const hedgeWarnings: string[] = [];
  // Allocation Alerts (Total Liquidity)
  if (alloc.Hedge < 0.15) hedgeWarnings.push("Liquidity Low (<15%)");
  if (alloc.Hedge > 0.35) hedgeWarnings.push("Excess Cash (>35%)");

  // Specific Instrument Alerts
  if (alloc.HedgeOnly > 0.10) hedgeWarnings.push(`Hedge Assets High (${(alloc.HedgeOnly*100).toFixed(1)}%)`);
  
  const hedgeHoldings = state.holdings.filter(h => h.bucket === 'Hedge');
  const uniqueHedgeSymbols = new Set(hedgeHoldings.map(h => h.symbol));
  
  uniqueHedgeSymbols.forEach(sym => {
     const symbolValue = hedgeHoldings.filter(h => h.symbol === sym).reduce((sum, h) => sum + (h.shares * h.currentPrice), 0);
     const posPct = symbolValue / totalValue;
     if (posPct > 0.08) hedgeWarnings.push(`Hedge Pos High: ${sym}`);
  });


  // --- Data for Chart ---
  const data = [
    { 
      name: 'ETF Core', 
      value: buckets.ETF, 
      pct: alloc.ETF, 
      color: 'bg-stone-400', 
      textColor: 'text-stone-600',
      bucketType: 'ETF' as const,
      icon: <Shield size={16} />,
      warnings: etfWarnings,
      needsReview: needsAdjustment
    },
    { 
      name: 'Active Trade', 
      value: buckets.Trading, 
      pct: alloc.Trading,
      color: 'bg-stone-600', 
      textColor: 'text-stone-800',
      bucketType: 'Trading' as const,
      icon: <TrendingUp size={16} />,
      warnings: tradeWarnings
    },
    { 
      name: 'Cash / Hedge', 
      value: buckets.Hedge, 
      pct: alloc.Hedge,
      color: 'bg-stone-200', 
      textColor: 'text-stone-500',
      bucketType: 'Hedge' as const,
      icon: <Wallet size={16} />,
      warnings: hedgeWarnings
    },
  ];

  // EOD Check
  const today = new Date().setHours(0,0,0,0);
  const lastUpdateDay = state.lastUpdate ? new Date(state.lastUpdate).setHours(0,0,0,0) : 0;
  const isUpdatedToday = lastUpdateDay === today;

  const handleUpdateSubmit = () => {
    const prices: Record<string, number> = {};
    Object.keys(tempPrices).forEach(k => {
      const val = parseFloat(tempPrices[k]);
      if (!isNaN(val)) prices[k] = val;
    });
    updateEOD(prices);
    setShowUpdateModal(false);
  };

  // --- Auto Fetch Logic ---
  const handleAutoFetch = async () => {
    setIsFetching(true);
    const uniqueSymbols = Array.from(new Set(state.holdings.map(h => h.symbol)));
    const newPrices = { ...tempPrices };
    
    // We use corsproxy.io to bypass CORS issues with Yahoo Finance
    const fetchSymbolPrice = async (symbol: string) => {
      try {
        // Add cache buster timestamp to ensure fresh data on every request
        // STRICT NO CACHE: Add both timestamp param and cache: 'no-store' option
        const timestamp = Date.now();
        const yahooUrl: string = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&t=${timestamp}`;
        
        // FIX: Ensure proxyUrl is treated as a string and handled correctly in fetch
        const proxyUrl: string = `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`;
        
        const response = await fetch(proxyUrl, {
          cache: 'no-store', // Directly tell browser not to look at cache
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        const data = await response.json();
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
        
        if (price) {
          return { symbol, price };
        }
        return null;
      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
        return null;
      }
    };

    try {
      const results = await Promise.all(uniqueSymbols.map(sym => fetchSymbolPrice(sym)));
      results.forEach(res => {
        if (res) {
          newPrices[res.symbol] = String(res.price);
        }
      });
      setTempPrices(newPrices);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetching(false);
    }
  };

  // --- Export / Import Handlers ---
  const handleExport = () => {
    const backupData = {
      state,
      journal,
      meta: {
        version: '1.0',
        exportedAt: new Date().toISOString()
      }
    };
    
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `zentrade_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.state && json.journal) {
           if (window.confirm("警告：還原資料將會覆蓋您目前手機上的所有紀錄。確定要繼續嗎？")) {
             const importSuccess = importData(json);
             if (importSuccess) {
               alert("資料還原成功！");
             } else {
               alert("還原失敗，資料格式可能錯誤。");
             }
           }
        } else {
           alert("無效的備份檔案。");
        }
      } catch (err) {
        console.error(err);
        alert("讀取檔案失敗。");
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Header Stat */}
      <section className="space-y-2 mt-4">
        <p className="text-stone-400 text-xs font-bold tracking-widest uppercase pl-1">Total Equity</p>
        <h1 className="text-5xl font-light text-stone-800 tracking-tight">{formatCurrency(totalValue)}</h1>
        <div className={`flex items-center gap-3 text-sm font-medium pl-1 ${todayChangeValue >= 0 ? 'text-stone-600' : 'text-stone-500'}`}>
          <span className={todayChangeValue >= 0 ? 'text-[#577c74]' : 'text-[#9f5f5f]'}>
            {todayChangeValue >= 0 ? '+' : ''}{formatCurrency(todayChangeValue)}
          </span>
          <span className="text-stone-400">
            {todayChangeValue >= 0 ? '+' : ''}{(todayChangePct * 100).toFixed(2)}% Today
          </span>
        </div>
        
        {/* Action Button: Always Visible */}
        <div className="pt-2 pl-1 flex items-center gap-3">
          <button 
            onClick={() => {
              const p: Record<string, string> = {};
              // Pre-fill prices. If multiple positions exist, just take the first one's price
              state.holdings.forEach(h => p[h.symbol] = h.currentPrice.toString());
              setTempPrices(p);
              setShowUpdateModal(true);
            }} 
            className="flex items-center gap-2 text-xs text-stone-600 bg-stone-100 px-4 py-2 rounded-full border border-stone-200 hover:bg-stone-200 transition-colors active:scale-95"
          >
            <RefreshCw size={14} />
            <span>Update Price</span>
          </button>

          {isUpdatedToday && state.lastUpdate && (
             <span className="text-[10px] text-stone-400 flex items-center gap-1 animate-in fade-in">
                <CheckCircle size={10} />
                {new Date(state.lastUpdate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
             </span>
          )}
        </div>
      </section>

      {/* Allocation - The "Zen Bar" */}
      <Card className="border-none shadow-sm bg-white/80 backdrop-blur">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-sm font-bold text-stone-400 uppercase tracking-widest">Asset Allocation</h2>
        </div>
        
        <div className="flex flex-col gap-8">
          {/* Visual Bar - Segmented */}
          <div className="w-full h-8 flex rounded-xl overflow-hidden bg-stone-100/50 gap-1 p-1">
             {data.map((d, i) => (
               <div 
                 key={d.name}
                 className={`h-full first:rounded-l-lg last:rounded-r-lg ${d.color} transition-all duration-1000 ease-out shadow-sm`}
                 style={{ width: animateBar ? `${Math.max(d.pct * 100, 2)}%` : '0%' }}
               />
             ))}
          </div>

          {/* Details Section with Strategy Checks */}
          <div className="space-y-5 px-1">
            {data.map(d => (
              <div key={d.name} className="flex flex-col border-b border-stone-50 pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-center mb-2">
                   <div className="flex items-center gap-3">
                     <div className={`p-1.5 rounded-lg ${d.color} text-white/90`}>
                       {d.icon}
                     </div>
                     <span className={`text-sm font-medium ${d.textColor}`}>{d.name}</span>
                   </div>
                   <div className="text-right">
                     <div className="font-bold text-stone-800">{formatPct(d.pct)}</div>
                     <div className="text-[10px] text-stone-400">{formatCurrency(d.value)}</div>
                   </div>
                </div>
                
                {/* List symbols in this bucket (Unique Only) with % */}
                <div className="flex flex-wrap gap-1.5 pl-9 mb-2">
                  {Array.from(new Set(state.holdings
                    .filter(h => h.bucket === d.bucketType)
                    .map(h => h.symbol)))
                    .sort()
                    .map(sym => {
                      // Calculate weight within the bucket
                      const symValue = state.holdings
                        .filter(h => h.symbol === sym && h.bucket === d.bucketType)
                        .reduce((sum, h) => sum + (h.shares * h.currentPrice), 0);
                      const pctInBucket = d.value > 0 ? (symValue / d.value) : 0;
                      
                      return (
                        <span key={sym} className="text-[10px] font-medium text-stone-500 bg-stone-100/50 border border-stone-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          {sym} 
                          <span className="text-stone-300">|</span>
                          <span className="text-stone-400">{(pctInBucket * 100).toFixed(0)}%</span>
                        </span>
                      );
                  })}
                  
                  {/* Show Cash label if hedge bucket, with % */}
                  {d.name === 'Cash / Hedge' && state.cashUSD > 0 && (
                     <span className="text-[10px] font-medium text-stone-400 border border-stone-100 bg-stone-50/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                        CASH
                        <span className="text-stone-300">|</span>
                        <span className="text-stone-400">{d.value > 0 ? ((state.cashUSD / d.value) * 100).toFixed(0) : 0}%</span>
                     </span>
                  )}
                  {state.holdings.filter(h => h.bucket === d.bucketType).length === 0 && d.name !== 'Cash / Hedge' && (
                    <span className="text-[10px] text-stone-300 italic">Empty</span>
                  )}
                </div>

                {/* Strategy Warnings / Actions */}
                <div className="pl-9 space-y-2">
                   {/* Warnings */}
                   {d.warnings && d.warnings.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                         {d.warnings.map((w, i) => (
                            <span key={i} className="flex items-center gap-1 text-[10px] text-[#9f5f5f] font-medium bg-[#9f5f5f]/5 px-2 py-1 rounded-md border border-[#9f5f5f]/10">
                               <AlertTriangle size={10} /> {w}
                            </span>
                         ))}
                      </div>
                   )}
                   
                   {/* ETF Monthly Review Action */}
                   {d.name === 'ETF Core' && (
                      <div className="flex items-center justify-between text-[10px]">
                         {d.needsReview ? (
                            <button 
                               onClick={markMonthlyAdjustment}
                               className="flex items-center gap-1.5 text-stone-500 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-md transition-colors"
                            >
                               <CalendarCheck size={12} /> Mark Adjusted (Last: {daysSinceAdjustment} days ago)
                            </button>
                         ) : (
                            <span className="text-stone-300 flex items-center gap-1">
                               <CheckCircle size={10} /> Adjusted {daysSinceAdjustment === 0 ? 'today' : `${daysSinceAdjustment} days ago`}
                            </span>
                         )}
                      </div>
                   )}
                </div>

              </div>
            ))}
          </div>
        </div>
      </Card>
      
      {/* Data Management Section (Minimalist) */}
      <div className="mt-8 mb-4 border-t border-dashed border-stone-200 pt-6">
        <div className="flex justify-center gap-8">
           <button onClick={handleExport} className="group flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-stone-50 text-stone-400 border border-stone-100 group-hover:bg-white group-hover:shadow-sm group-hover:text-stone-600 transition-all">
                 <Download size={16} strokeWidth={1.5} />
              </div>
              <span className="text-[10px] font-medium text-stone-300 group-hover:text-stone-500 transition-colors">BACKUP</span>
           </button>
           
           <button onClick={handleImportClick} className="group flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-stone-50 text-stone-400 border border-stone-100 group-hover:bg-white group-hover:shadow-sm group-hover:text-stone-600 transition-all">
                 <Upload size={16} strokeWidth={1.5} />
              </div>
              <span className="text-[10px] font-medium text-stone-300 group-hover:text-stone-500 transition-colors">RESTORE</span>
           </button>
        </div>
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
        />
      </div>

      {/* Update Modal - Aggregated by Unique Symbol */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto border border-stone-100 relative">
            <h3 className="text-xl font-light text-stone-800 mb-6 text-center">Update Closing Prices</h3>
            
            {/* FIX: Corrected comment syntax error for JSX */}
            <button 
              onClick={handleAutoFetch} 
              disabled={isFetching}
              className="absolute top-8 right-8 text-stone-400 hover:text-stone-800 transition-colors disabled:opacity-50"
              title="Auto Fetch Prices"
            >
              {isFetching ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
            </button>

            <div className="space-y-5">
              {/* FIX: Simplified mapping and ensured sym is treated as a string */}
              {Array.from(new Set(state.holdings.map(h => h.symbol))).sort().map((sym) => (
                <div key={sym as string} className="flex items-center justify-between group">
                  <span className="font-bold text-stone-700 w-16 text-lg">{sym as string}</span>
                  <Input 
                    type="number" 
                    value={tempPrices[sym as string] || ''} 
                    onChange={(e: any) => setTempPrices({...tempPrices, [sym as string]: e.target.value})}
                    placeholder="Price"
                    className="flex-1 text-right font-mono"
                  />
                </div>
              ))}
              {state.holdings.length === 0 && (
                <p className="text-center text-stone-400 text-sm">No positions found.</p>
              )}
            </div>
            <div className="flex gap-4 mt-8">
              <Button variant="outline" className="flex-1" onClick={() => setShowUpdateModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-stone-800 hover:bg-stone-700 text-white" onClick={handleUpdateSubmit}>Confirm</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
