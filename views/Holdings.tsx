import React, { useState } from 'react';
import { AppState, Position, BucketType } from '../types';
import { Card, Button, Input, Badge } from '../components/ui';
import { Plus, Trash2, Edit2, TrendingUp, Calendar } from 'lucide-react';

export const Holdings = ({ state, addPosition, removePosition, updatePosition, updateCash }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Position>>({ bucket: 'Trading', shares: 0, avgCost: 0, currentPrice: 0 });

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({ bucket: 'Trading', shares: 0, avgCost: 0, currentPrice: 0 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (position: Position) => {
    setEditingId(position.id);
    setForm({ ...position });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, symbol: string) => {
    if (window.confirm(`確定要刪除持倉 ${symbol} 嗎？`)) {
      removePosition(id);
    }
  };

  const handleSave = () => {
    if (!form.symbol || !form.shares) return;

    if (editingId) {
       // Edit Mode
       updatePosition({
          ...form,
          id: editingId,
          // Preserve these if not in form, though form should have them
          currentPrice: Number(form.currentPrice || form.avgCost), 
          prevClose: Number(form.prevClose || form.currentPrice || form.avgCost)
       } as Position);
    } else {
       // Add Mode
       addPosition({
         id: Date.now().toString(),
         symbol: form.symbol.toUpperCase(),
         shares: Number(form.shares),
         avgCost: Number(form.avgCost),
         currentPrice: Number(form.currentPrice || form.avgCost),
         prevClose: Number(form.currentPrice || form.avgCost),
         bucket: form.bucket as BucketType,
         notes: form.notes
       });
    }
    
    setIsModalOpen(false);
    setForm({ bucket: 'Trading', shares: 0, avgCost: 0, currentPrice: 0 });
    setEditingId(null);
  };

  return (
    <div className="pb-32 space-y-8">
      {/* Header Area */}
      <div className="flex justify-between items-end px-1">
         <div>
            <h1 className="text-3xl font-light text-stone-800 tracking-tight">Holdings</h1>
            <p className="text-xs text-stone-400 font-medium tracking-wider uppercase mt-1">Manage your positions</p>
         </div>
         <button onClick={handleOpenAdd} className="bg-stone-800 text-white rounded-full p-3 shadow-xl hover:scale-105 transition-transform"><Plus size={20}/></button>
      </div>

      {/* Prominent Cash Card - Scaled for importance but color-unified */}
      <Card className="!p-6 flex items-center justify-between shadow-sm border border-stone-100">
         <label className="text-sm font-bold text-stone-400 uppercase tracking-widest shrink-0">CASH</label>
         <input 
            type="number" 
            className="text-4xl font-light bg-transparent w-full text-right focus:outline-none text-stone-800 placeholder-stone-200 transition-colors ml-4"
            value={state.cashUSD || ''}
            placeholder="0"
            onChange={(e) => updateCash(Number(e.target.value))}
         />
      </Card>

      <div className="space-y-4">
         {state.holdings.map((h: Position) => {
            const mktValue = h.shares * h.currentPrice;
            const totalCost = h.shares * h.avgCost;
            const totalReturn = mktValue - totalCost;
            const returnPct = totalCost > 0 ? (totalReturn / totalCost) : 0;
            
            // Format Date: YYYY.MM.DD
            const dateObj = new Date(parseInt(h.id));
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const dateString = `${year}.${month}.${day}`;
            
            return (
               <Card key={h.id} className="!p-5 flex flex-col gap-5 relative group border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                  
                  {/* Top Section: Identity & Performance */}
                  <div className="flex justify-between items-start">
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-2xl font-bold text-stone-800 tracking-tight leading-none">{h.symbol}</span>
                           <span className={`text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded ${
                                 h.bucket === 'ETF' ? 'text-blue-600 bg-blue-50' : 
                                 h.bucket === 'Hedge' ? 'text-amber-600 bg-amber-50' : 
                                 'text-stone-500 bg-stone-100'
                              }`}>
                                 {h.bucket.toUpperCase()}
                           </span>
                        </div>
                        <span className="text-[10px] text-stone-300 font-medium ml-0.5 tracking-wide">
                           {dateString}
                        </span>
                     </div>

                     {/* Fully right-aligned block for data precision */}
                     <div className="flex flex-col items-end text-right">
                        <div className="text-xl font-medium text-stone-800 tracking-tight leading-none">
                           {mktValue.toLocaleString()}
                        </div>
                        <div className={`text-sm font-medium mt-1.5 ${totalReturn >= 0 ? 'text-[#577c74]' : 'text-[#9f5f5f]'}`}>
                           {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(0)} ({(returnPct * 100).toFixed(1)}%)
                        </div>
                     </div>
                  </div>
                  
                  {/* Bottom Section: Compact Hierarchy */}
                  <div className="flex items-end justify-between pt-1 border-t border-stone-50">
                      <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-stone-300 uppercase tracking-widest">Shares</span>
                          <span className="text-lg font-light text-stone-700">{h.shares}</span>
                      </div>

                      <div className="flex items-end gap-5">
                          <div className="flex flex-col gap-0.5 items-end">
                              <span className="text-[9px] font-bold text-stone-300 uppercase tracking-widest">Cost</span>
                              <span className="text-sm font-mono text-stone-500">{h.avgCost}</span>
                          </div>
                          <div className="flex flex-col gap-0.5 items-end">
                              <span className="text-[9px] font-bold text-stone-300 uppercase tracking-widest">Curr</span>
                              <span className="text-sm font-mono text-stone-800 font-medium">{h.currentPrice}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 pl-2 border-l border-stone-100 ml-1">
                              <button 
                                  onClick={() => handleOpenEdit(h)} 
                                  className="text-stone-300 hover:text-stone-600 transition-colors p-1"
                              >
                                  <Edit2 size={16} strokeWidth={1.5} />
                              </button>
                              <button 
                                  onClick={() => handleDelete(h.id, h.symbol)} 
                                  className="text-stone-300 hover:text-[#9f5f5f] transition-colors p-1"
                              >
                                  <Trash2 size={16} strokeWidth={1.5} />
                              </button>
                          </div>
                      </div>
                  </div>
               </Card>
            )
         })}
         
         {state.holdings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 opacity-50">
               <TrendingUp size={48} className="text-stone-300 mb-4" strokeWidth={1}/>
               <p className="text-stone-400 text-sm font-light">Your portfolio is empty.</p>
               <p className="text-stone-300 text-xs mt-1">Add a position to start tracking.</p>
            </div>
         )}
      </div>

      {/* Modal remains unchanged */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-stone-900/10 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl space-y-6">
               <h3 className="text-xl font-light text-stone-800 text-center">{editingId ? 'Edit Position' : 'Add Position'}</h3>
               
               <div className="space-y-4">
                  <Input label="Symbol" value={form.symbol || ''} onChange={(e: any) => setForm({...form, symbol: e.target.value})} className="uppercase text-center text-lg"/>
                  <div className="grid grid-cols-2 gap-5">
                     <Input type="number" label="Shares" value={form.shares || ''} onChange={(e: any) => setForm({...form, shares: e.target.value})}/>
                     <Input type="number" label="Avg Cost" value={form.avgCost || ''} onChange={(e: any) => setForm({...form, avgCost: e.target.value})}/>
                  </div>
                  <Input type="number" label="Current Price" value={form.currentPrice || ''} onChange={(e: any) => setForm({...form, currentPrice: e.target.value})}/>

                  <div>
                     <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Category</label>
                     <div className="flex gap-2">
                        {['Trading', 'ETF', 'Hedge'].map((b) => (
                           <button
                              key={b}
                              onClick={() => setForm({...form, bucket: b as BucketType})}
                              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                                 form.bucket === b 
                                 ? 'bg-stone-800 text-white shadow-md' 
                                 : 'bg-stone-50 text-stone-400 hover:bg-stone-100'
                              }`}
                           >
                              {b}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="flex gap-3 pt-2">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm text-stone-400 hover:text-stone-600 transition-colors">Cancel</button>
                  <button onClick={handleSave} className="flex-1 py-3 bg-stone-800 text-white rounded-xl shadow-lg hover:bg-stone-700 hover:scale-[1.02] transition-all">Save</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};