import React, { useState } from 'react';
import { AppState, Position, BucketType } from '../types';
import { Card, Button, Input, Badge } from '../components/ui';
import { Plus, Trash2, Edit2 } from 'lucide-react';

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
    <div className="pb-32 space-y-6">
      <div className="flex justify-between items-end">
         <h1 className="text-2xl font-light text-stone-800">Holdings</h1>
         <button onClick={handleOpenAdd} className="bg-stone-800 text-white rounded-full p-2 shadow-lg hover:scale-105 transition-transform"><Plus size={24}/></button>
      </div>

      <Card>
         <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Cash (USD)</h3>
         </div>
         <div className="flex items-center gap-4">
            <input 
               type="number" 
               className="text-2xl font-light bg-transparent w-full focus:outline-none text-stone-800"
               value={state.cashUSD}
               onChange={(e) => updateCash(Number(e.target.value))}
            />
         </div>
      </Card>

      <div className="space-y-3">
         {state.holdings.map((h: Position) => {
            const mktValue = h.shares * h.currentPrice;
            const dayChange = (h.currentPrice - h.prevClose) * h.shares;
            const regDate = new Date(parseInt(h.id)).toLocaleDateString();
            
            return (
               <Card key={h.id} className="!p-4 relative group">
                  <div className="flex justify-between items-start mb-2 pr-8">
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           <span className="font-bold text-lg text-stone-800">{h.symbol}</span>
                           <Badge color={h.bucket === 'ETF' ? 'blue' : h.bucket === 'Hedge' ? 'yellow' : 'stone'}>{h.bucket}</Badge>
                        </div>
                        <div className="text-xs text-stone-500 space-y-0.5">
                           <div>{h.shares} shares</div>
                           <div className="flex gap-2">
                              <span>Cost ${h.avgCost}</span>
                              <span className="text-stone-300">•</span>
                              <span className="font-medium text-stone-700">Curr ${h.currentPrice}</span>
                           </div>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="font-medium text-stone-800">${mktValue.toLocaleString()}</div>
                        <div className={`text-xs font-medium ${dayChange >= 0 ? 'text-[#577c74]' : 'text-[#9f5f5f]'}`}>
                           {dayChange >= 0 ? '+' : ''}{dayChange.toFixed(0)} ({((dayChange/mktValue)*100 || 0).toFixed(1)}%)
                        </div>
                        <div className="text-[10px] text-stone-300 mt-2">{regDate}</div>
                     </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => handleOpenEdit(h)} className="text-stone-300 hover:text-stone-600">
                        <Edit2 size={16} />
                     </button>
                     <button onClick={() => removePosition(h.id)} className="text-stone-300 hover:text-[#9f5f5f]">
                        <Trash2 size={16} />
                     </button>
                  </div>
               </Card>
            )
         })}
         {state.holdings.length === 0 && (
            <div className="text-center py-10 text-stone-400 text-sm">目前沒有持倉。保持空手也是一種策略。</div>
         )}
      </div>

      {isModalOpen && (
         <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl space-y-4">
               <h3 className="font-bold text-lg">{editingId ? '編輯持倉' : '新增持倉'}</h3>
               <Input label="Symbol" value={form.symbol || ''} onChange={(e: any) => setForm({...form, symbol: e.target.value})} className="uppercase"/>
               <div className="grid grid-cols-2 gap-4">
                  <Input type="number" label="Shares" value={form.shares || ''} onChange={(e: any) => setForm({...form, shares: e.target.value})}/>
                  <Input type="number" label="Cost" value={form.avgCost || ''} onChange={(e: any) => setForm({...form, avgCost: e.target.value})}/>
               </div>
               {/* Current Price (Allows editing if needed, defaults to Cost if empty on add) */}
               <Input type="number" label="Current Price" value={form.currentPrice || ''} onChange={(e: any) => setForm({...form, currentPrice: e.target.value})}/>

               <div>
                  <label className="text-xs font-bold text-stone-400 uppercase">Bucket</label>
                  <select 
                     className="w-full mt-1 bg-stone-50 border border-stone-200 rounded-xl p-3"
                     value={form.bucket}
                     onChange={(e: any) => setForm({...form, bucket: e.target.value})}
                  >
                     <option value="Trading">Trading</option>
                     <option value="ETF">ETF</option>
                     <option value="Hedge">Hedge</option>
                  </select>
               </div>
               <div className="flex gap-3 pt-2">
                  <Button variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>取消</Button>
                  <Button className="flex-1" onClick={handleSave}>儲存</Button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};