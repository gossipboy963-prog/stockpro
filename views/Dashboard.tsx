import React, { useState, useEffect } from 'react';
import { AppState } from '../types';
import { Card, Button, Input } from '../components/ui';
import { AlertCircle, CheckCircle, TrendingUp, Shield, Wallet, AlertTriangle, CalendarCheck } from 'lucide-react';

const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
const formatPct = (val: number) => `${(val * 100).toFixed(1)}%`;

interface DashboardProps {
  state: AppState;
  updateEOD: (prices: Record<string, number>) => void;
  markMonthlyAdjustment: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, updateEOD, markMonthlyAdjustment }) => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [tempPrices, setTempPrices] = useState<Record<string, string>>({});
  const [animateBar, setAnimateBar] = useState(false);

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
  if (tradingHoldings.length > 0 && tradingHoldings.length < 3) tradeWarnings.push("Count Low (<3)");
  if (tradingHoldings.length > 5) tradeWarnings.push("Count High (>5)");
  
  tradingHoldings.forEach(h => {
    const posPct = (h.shares * h.currentPrice) / totalValue;
    if (posPct > 0.15) tradeWarnings.push(`Concentrated: ${h.symbol} (${(posPct*100).toFixed(0)}%)`);
  });

  // 3. Hedge/Cash Checks (Target 20-35%, Alert range 15-35%)
  const hedgeWarnings: string[] = [];
  // Allocation Alerts (Total Liquidity)
  if (alloc.Hedge < 0.15) hedgeWarnings.push("Liquidity Low (<15%)");
  if (alloc.Hedge > 0.35) hedgeWarnings.push("Excess Cash (>35%)");

  // Specific Instrument Alerts
  if (alloc.HedgeOnly > 0.10) hedgeWarnings.push(`Hedge Assets High (${(alloc.HedgeOnly*100).toFixed(1)}%)`);
  
  state.holdings.filter(h => h.bucket === 'Hedge').forEach(h => {
     const posPct = (h.shares * h.currentPrice) / totalValue;
     if (posPct > 0.08) hedgeWarnings.push(`Hedge Pos High: ${h.symbol}`);
  });


  // --- Data for Chart ---
  const data = [
    { 
      name: 'ETF Core', 
      value: buckets.ETF, 
      pct: alloc.ETF,
      color: 'bg-stone-400', 
      textColor: 'text-stone-600',
      bucketType: 'ETF',
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
      bucketType: 'Trading',
      icon: <TrendingUp size={16} />,
      warnings: tradeWarnings
    },
    { 
      name: 'Cash / Hedge', 
      value: buckets.Hedge, 
      pct: alloc.Hedge,
      color: 'bg-stone-200', 
      textColor: 'text-stone-500',
      bucketType: 'Hedge',
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
        
        {/* EOD Status */}
        <div className="pt-2 pl-1">
          {isUpdatedToday ? (
            <div className="flex items-center gap-2 text-xs text-stone-400 animate-in fade-in duration-500">
              <CheckCircle size={14} className="text-stone-300"/>
              <span>Market data updated ({new Date(state.lastUpdate!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</span>
            </div>
          ) : (
            <button 
              onClick={() => {
                const p: Record<string, string> = {};
                state.holdings.forEach(h => p[h.symbol] = h.currentPrice.toString());
                setTempPrices(p);
                setShowUpdateModal(true);
              }} 
              className="flex items-center gap-2 text-xs text-stone-600 bg-stone-100 px-4 py-2 rounded-full border border-stone-200 hover:bg-stone-200 transition-colors"
            >
              <AlertCircle size={14} />
              <span>Update Closing Prices</span>
            </button>
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
                
                {/* List symbols in this bucket */}
                <div className="flex flex-wrap gap-1.5 pl-9 mb-2">
                  {state.holdings
                    .filter(h => h.bucket === d.bucketType)
                    .map(h => (
                      <span key={h.id} className="text-[10px] font-medium text-stone-500 bg-stone-100/50 border border-stone-100 px-2 py-0.5 rounded-md">
                        {h.symbol}
                      </span>
                  ))}
                  {/* Show Cash label if hedge bucket */}
                  {d.name === 'Cash / Hedge' && state.cashUSD > 0 && (
                     <span className="text-[10px] font-medium text-stone-400 border border-stone-100 bg-stone-50/50 px-2 py-0.5 rounded-md">
                        CASH
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

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto border border-stone-100">
            <h3 className="text-xl font-light text-stone-800 mb-6 text-center">Update Closing Prices</h3>
            <div className="space-y-5">
              {state.holdings.map(h => (
                <div key={h.id} className="flex items-center justify-between group">
                  <span className="font-bold text-stone-700 w-16 text-lg">{h.symbol}</span>
                  <Input 
                    type="number" 
                    value={tempPrices[h.symbol] || ''} 
                    onChange={(e: any) => setTempPrices({...tempPrices, [h.symbol]: e.target.value})}
                    placeholder="Price"
                    className="flex-1 text-right font-mono"
                  />
                </div>
              ))}
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