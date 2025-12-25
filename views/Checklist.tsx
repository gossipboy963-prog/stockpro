import React, { useState, useEffect } from 'react';
import { INITIAL_SOP_STEPS } from '../constants';
import { NO_TRADE_REASONS, SOPStep, JournalEntry, SOPStatus, ScoreLabel } from '../types';
import { Card, Button, Input } from '../components/ui';
import { AlertTriangle, Check, X, ClipboardList, ArrowUpCircle, ArrowDownCircle, ShoppingCart, Tag } from 'lucide-react';

export const Checklist = ({ onSave }: { onSave: (entry: JournalEntry) => void }) => {
  const [symbol, setSymbol] = useState('');
  const [price, setPrice] = useState('');
  const [direction, setDirection] = useState<'Long'|'Short'>('Long');
  const [action, setAction] = useState<'Buy'|'Sell'>('Buy');
  const [bucket, setBucket] = useState<'Trading'|'ETF'>('Trading');
  const [steps, setSteps] = useState(INITIAL_SOP_STEPS.map(s => ({ ...s, status: 'pending', note: '' } as SOPStep)));
  const [noTradeTriggered, setNoTradeTriggered] = useState<string[]>([]);
  const [noTradeReasonNote, setNoTradeReasonNote] = useState('');
  const [userNotes, setUserNotes] = useState('');

  // Calculations
  const [currentScore, setCurrentScore] = useState(0);
  const [scoreLabel, setScoreLabel] = useState<ScoreLabel>('Watch');
  const [finalResult, setFinalResult] = useState<'tradable' | 'watch' | 'banned'>('watch');

  useEffect(() => {
    let score = 0;
    let allSelected = true;

    steps.forEach(s => {
      if (s.status === 'pass') score += 3;
      else if (s.status === 'warn') score += 2;
      else if (s.status === 'fail') score += 1;
      else allSelected = false;
    });

    setCurrentScore(score);

    const step1 = steps.find(s => s.id === 1);
    const isStep1Fail = step1?.status === 'fail';
    const isNoTrade = noTradeTriggered.length > 0;

    if (isNoTrade || isStep1Fail) {
       setScoreLabel('Avoid');
       setFinalResult('banned');
    } else if (score >= 19) {
       setScoreLabel('Go');
       setFinalResult('tradable');
    } else if (score >= 16) {
       setScoreLabel('Consider');
       setFinalResult('tradable');
    } else if (score >= 13) {
       setScoreLabel('Watch');
       setFinalResult('watch');
    } else {
       setScoreLabel('Avoid');
       setFinalResult('banned');
    }
  }, [steps, noTradeTriggered]);

  const setStepStatus = (id: number, status: SOPStatus) => {
    setSteps(steps.map(s => {
      if (s.id !== id) return s;
      return { ...s, status: status };
    }));
  };

  const toggleNoTrade = (reason: string) => {
    if (noTradeTriggered.includes(reason)) {
      setNoTradeTriggered(noTradeTriggered.filter(r => r !== reason));
    } else {
      setNoTradeTriggered([...noTradeTriggered, reason]);
    }
  };

  const handleSave = () => {
    if (!symbol) return alert('請輸入代號');
    if (!price) return alert('請輸入現價');
    if (steps.some(s => s.status === 'pending')) return alert('請完成所有 7 個步驟的評估。');
    if (finalResult === 'banned' && noTradeTriggered.length > 0 && !noTradeReasonNote) return alert('觸發不交易清單時，必須填寫理由。');

    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: Date.now(),
      symbol: symbol.toUpperCase(),
      price: parseFloat(price),
      direction,
      action,
      bucket,
      sopSteps: steps,
      noTradeTriggered,
      noTradeReasonNote,
      result: finalResult,
      score: currentScore,
      scoreLabel: scoreLabel,
      userNotes: userNotes 
    };
    onSave(entry);
    alert('已存入交易日誌');
    
    setSymbol('');
    setPrice('');
    setNoTradeTriggered([]);
    setNoTradeReasonNote('');
    setUserNotes('');
    setSteps(INITIAL_SOP_STEPS.map(s => ({ ...s, status: 'pending', note: '' } as SOPStep)));
  };

  return (
    <div className="pb-32 space-y-6">
      <div className="flex items-center justify-between mb-2">
         <div className="flex items-center gap-2">
            <ClipboardList className="text-stone-400" size={24} />
            <h1 className="text-2xl font-light text-stone-800">Checklist</h1>
         </div>
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <Input label="Symbol" value={symbol} onChange={(e: any) => setSymbol(e.target.value)} placeholder="AAPL" className="uppercase" />
          <Input label="Price" type="number" value={price} onChange={(e: any) => setPrice(e.target.value)} placeholder="0.00" />
        </div>
        
        {/* Action & Direction Selection in English */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Action</label>
               <div className="flex gap-2 mt-1">
                  <button 
                    onClick={() => setAction('Buy')}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors ${action === 'Buy' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-400 border-stone-200 hover:bg-stone-50'}`}
                  >
                     Buy
                  </button>
                  <button 
                    onClick={() => setAction('Sell')}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors ${action === 'Sell' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-400 border-stone-200 hover:bg-stone-50'}`}
                  >
                     Sell
                  </button>
               </div>
            </div>
            <div>
               <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Direction</label>
               <div className="flex gap-2 mt-1">
                  <button 
                    onClick={() => setDirection('Long')}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-1 transition-colors ${direction === 'Long' ? 'bg-[#577c74]/10 text-[#577c74] border-[#577c74]/20' : 'bg-white text-stone-400 border-stone-200 hover:bg-stone-50'}`}
                  >
                     Long
                  </button>
                  <button 
                    onClick={() => setDirection('Short')}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-1 transition-colors ${direction === 'Short' ? 'bg-[#9f5f5f]/10 text-[#9f5f5f] border-[#9f5f5f]/20' : 'bg-white text-stone-400 border-stone-200 hover:bg-stone-50'}`}
                  >
                     Short
                  </button>
               </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Bucket</label>
            <div className="flex gap-2 mt-1">
              <button 
                onClick={() => setBucket('Trading')}
                className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors ${bucket === 'Trading' ? 'bg-stone-100 text-stone-800 border-stone-200' : 'bg-white text-stone-300 border-stone-100'}`}
              >Trade</button>
              <button 
                 onClick={() => setBucket('ETF')}
                 className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors ${bucket === 'ETF' ? 'bg-stone-100 text-stone-800 border-stone-200' : 'bg-white text-stone-300 border-stone-100'}`}
              >ETF</button>
            </div>
          </div>
        </div>
      </Card>

      {/* Other sections remain unchanged */}
      <Card className={`transition-all duration-300 ${noTradeTriggered.length > 0 ? 'border-l-4 border-l-[#9f5f5f]/50 bg-[#9f5f5f]/5' : 'border border-stone-100'}`}>
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <AlertTriangle size={14} /> Stop Trading If...
        </h3>
        <div className="space-y-1">
          {NO_TRADE_REASONS.map(reason => (
            <label key={reason} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
              <input type="checkbox" checked={noTradeTriggered.includes(reason)} onChange={() => toggleNoTrade(reason)} className="w-5 h-5 accent-stone-600 rounded border-stone-300" />
              <span className={`text-sm ${noTradeTriggered.includes(reason) ? 'text-[#9f5f5f] font-medium' : 'text-stone-600'}`}>{reason}</span>
            </label>
          ))}
        </div>
        {noTradeTriggered.length > 0 && (
          <Input 
            className="mt-4" 
            placeholder="請寫下一句自我提醒..." 
            value={noTradeReasonNote} 
            onChange={(e: any) => setNoTradeReasonNote(e.target.value)} 
          />
        )}
      </Card>

      <div className="space-y-4">
        {steps.map(step => (
          <div key={step.id} className={`bg-white rounded-2xl p-4 border shadow-sm transition-all duration-300 ${step.id === 1 && step.status === 'fail' ? 'border-[#9f5f5f]/30 bg-[#9f5f5f]/5' : 'border-stone-100'}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className={`text-xs font-bold tracking-widest block mb-1 ${step.id === 1 && step.status === 'fail' ? 'text-[#9f5f5f]' : 'text-stone-300'}`}>STEP 0{step.id}</span>
                <h4 className="font-medium text-stone-800">{step.label}</h4>
                <p className="text-xs text-stone-400 leading-relaxed mt-1">{step.description}</p>
                {step.id === 1 && step.status === 'fail' && (
                   <span className="text-[10px] font-bold text-[#9f5f5f] mt-2 block">★ Hard Rule: Step 1 Fail = Avoid</span>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
               <button 
                  onClick={() => setStepStatus(step.id, 'pass')}
                  className={`flex-1 py-4 rounded-xl flex items-center justify-center transition-all ${step.status === 'pass' ? 'bg-[#577c74]/10 text-[#577c74] ring-1 ring-[#577c74]/20' : 'bg-stone-50 text-stone-300 hover:bg-stone-100'}`}
                  aria-label="Pass"
               >
                  <Check size={24} strokeWidth={2.5} />
               </button>
               <button 
                  onClick={() => setStepStatus(step.id, 'warn')}
                  className={`flex-1 py-4 rounded-xl flex items-center justify-center transition-all ${step.status === 'warn' ? 'bg-stone-200 text-stone-600 ring-1 ring-stone-300' : 'bg-stone-50 text-stone-300 hover:bg-stone-100'}`}
                  aria-label="Warning"
               >
                  <AlertTriangle size={24} strokeWidth={2.5} />
               </button>
               <button 
                  onClick={() => setStepStatus(step.id, 'fail')}
                  className={`flex-1 py-4 rounded-xl flex items-center justify-center transition-all ${step.status === 'fail' ? 'bg-[#9f5f5f]/10 text-[#9f5f5f] ring-1 ring-[#9f5f5f]/20' : 'bg-stone-50 text-stone-300 hover:bg-stone-100'}`}
                  aria-label="Fail"
               >
                  <X size={24} strokeWidth={2.5} />
               </button>
            </div>
          </div>
        ))}
      </div>

      <Card>
         <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Notes / Strategy</h3>
         <textarea 
            className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder-stone-300 min-h-[100px]"
            placeholder="Write your observation..."
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
         />
      </Card>

      <div className="sticky bottom-20 z-10 pt-4 bg-gradient-to-t from-stone-50 via-stone-50 to-transparent pb-4">
         <Button 
            onClick={handleSave}
            className="w-full shadow-xl shadow-stone-200/50 py-4 text-lg" 
            variant="primary"
         >
            Save to Journal
         </Button>
      </div>
    </div>
  );
};