import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../components/ui';
import { Calculator, ArrowRight, Target, AlertTriangle } from 'lucide-react';
import { useStore } from '../store';

export const RiskCalculator = () => {
  const { state } = useStore();
  const [riskPct, setRiskPct] = useState(1.0);
  const [customEquity, setCustomEquity] = useState(state.holdings.reduce((s, h) => s + h.shares * h.currentPrice, 0) + state.cashUSD);
  const [entry, setEntry] = useState('');
  const [stop, setStop] = useState('');
  const [target, setTarget] = useState('');
  
  // Update customEquity if state changes (initial load), but allow user override
  useEffect(() => {
     const currentTotal = state.holdings.reduce((s, h) => s + h.shares * h.currentPrice, 0) + state.cashUSD;
     if (Math.abs(currentTotal - customEquity) > 100 && customEquity === 0) {
        setCustomEquity(currentTotal);
     }
  }, [state.holdings, state.cashUSD]);

  const entryNum = parseFloat(entry);
  const stopNum = parseFloat(stop);
  const targetNum = parseFloat(target);
  const riskAmount = customEquity * (riskPct / 100);
  
  let shares = 0;
  let totalCost = 0;
  let rr = 0;
  let riskPerShare = 0;

  if (entryNum && stopNum && entryNum !== stopNum) {
     riskPerShare = Math.abs(entryNum - stopNum);
     shares = Math.floor(riskAmount / riskPerShare);
     totalCost = shares * entryNum;

     if (targetNum) {
        const rewardPerShare = Math.abs(targetNum - entryNum);
        rr = rewardPerShare / riskPerShare;
     }
  }

  return (
    <div className="pb-32 space-y-6">
       <div className="flex items-center gap-2 mb-2">
          <Calculator className="text-stone-400" size={24} />
          <h1 className="text-2xl font-light text-stone-800">Risk Calculator</h1>
       </div>

       {/* Top: Equity & Risk Setting */}
       <Card className="border-none shadow-sm bg-stone-100">
          <div className="grid grid-cols-2 gap-6">
             <div>
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 block">Account Equity</label>
                <div className="relative">
                   <span className="absolute left-3 top-3 text-stone-400">$</span>
                   <input 
                      type="number" 
                      value={customEquity || ''} 
                      onChange={(e) => setCustomEquity(parseFloat(e.target.value))}
                      className="w-full bg-white rounded-xl py-2 pl-6 pr-3 text-stone-700 font-mono focus:outline-none focus:ring-1 focus:ring-stone-400"
                   />
                </div>
             </div>
             <div>
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 block">Risk %</label>
                <div className="flex items-center gap-2">
                   <input 
                      type="number" 
                      value={riskPct} 
                      onChange={(e) => setRiskPct(parseFloat(e.target.value))}
                      className="w-full bg-white rounded-xl py-2 px-3 text-stone-700 font-mono focus:outline-none focus:ring-1 focus:ring-stone-400"
                   />
                </div>
             </div>
          </div>
          <div className="mt-4 pt-4 border-t border-stone-200 flex justify-between items-center">
             <span className="text-xs text-stone-500 font-medium">Max Loss Allowed (1R)</span>
             <span className="text-lg font-bold text-stone-800">${riskAmount.toFixed(0)}</span>
          </div>
       </Card>

       {/* Inputs */}
       <Card>
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <Input label="Entry Price" type="number" value={entry} onChange={(e: any) => setEntry(e.target.value)} placeholder="0.00" />
                <Input label="Stop Loss" type="number" value={stop} onChange={(e: any) => setStop(e.target.value)} placeholder="0.00" />
             </div>
             <Input label="Target Price (Optional)" type="number" value={target} onChange={(e: any) => setTarget(e.target.value)} placeholder="0.00" />
          </div>
       </Card>

       {/* Results */}
       {shares > 0 ? (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-800 text-stone-50 p-5 rounded-2xl flex flex-col justify-between">
                   <span className="text-stone-400 text-xs uppercase tracking-wider font-bold">Position Size</span>
                   <div>
                      <span className="text-3xl font-light">{shares}</span>
                      <span className="text-sm text-stone-400 ml-1">shares</span>
                   </div>
                   <div className="text-sm text-stone-400 mt-1">
                      ${totalCost.toLocaleString()}
                   </div>
                </div>

                <div className="bg-white border border-stone-100 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                   <span className="text-stone-400 text-xs uppercase tracking-wider font-bold">Reward : Risk</span>
                   {rr > 0 ? (
                      <div>
                         <span className={`text-3xl font-light ${rr >= 2 ? 'text-[#577c74]' : rr >= 1.5 ? 'text-stone-600' : 'text-[#9f5f5f]'}`}>
                            {rr.toFixed(1)}
                         </span>
                         <span className="text-sm text-stone-400 ml-1">R</span>
                      </div>
                   ) : (
                      <span className="text-stone-300 text-sm italic">Enter Target</span>
                   )}
                   <div className="text-xs text-stone-400 mt-1">
                      Risk/Share: ${riskPerShare.toFixed(2)}
                   </div>
                </div>
             </div>

             {/* Warnings / Tips */}
             {(totalCost / customEquity) > 0.2 && (
                <div className="bg-stone-100 text-stone-600 text-xs p-3 rounded-xl flex items-center gap-2 border border-stone-200">
                   <AlertTriangle size={14} />
                   <span>High Concentration: Position is {((totalCost / customEquity)*100).toFixed(1)}% of equity.</span>
                </div>
             )}
          </div>
       ) : (
          <div className="text-center py-12 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
             <div className="text-stone-300 mb-2"><ArrowRight size={32} className="mx-auto"/></div>
             <p className="text-stone-400 text-sm">Enter price levels to calculate position size.</p>
          </div>
       )}
    </div>
  );
};