import React from 'react';
import { JournalEntry, SOPStatus } from '../types';
import { Card, Badge } from '../components/ui';
import { ArrowUpCircle, ArrowDownCircle, BookOpen } from 'lucide-react';

const getSegmentColor = (status: SOPStatus) => {
   switch(status) {
      case 'pass': return 'bg-[#577c74]'; // Zen Green
      case 'warn': return 'bg-stone-400';
      case 'fail': return 'bg-[#9f5f5f]'; // Zen Red
      default: return 'bg-stone-200';
   }
};

export const Journal = ({ entries }: { entries: JournalEntry[] }) => {
  return (
    <div className="pb-32 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="text-stone-400" size={24} />
        <h1 className="text-2xl font-light text-stone-800">Journal</h1>
      </div>
      
      <div className="space-y-4">
        {entries.map(entry => (
          <Card key={entry.id}>
            {/* Header Area */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                   <span className="font-bold text-xl text-stone-800 tracking-tight">{entry.symbol}</span>
                   {/* Score Label Badge */}
                   {entry.scoreLabel ? (
                      <span className={`text-xs px-2 py-1 rounded-md font-bold border ${
                         entry.scoreLabel === 'Go' ? 'bg-[#577c74]/10 text-[#577c74] border-[#577c74]/20' :
                         entry.scoreLabel === 'Consider' ? 'bg-[#577c74]/5 text-[#577c74]/80 border-[#577c74]/10' :
                         entry.scoreLabel === 'Watch' ? 'bg-stone-100 text-stone-600 border-stone-200' :
                         'bg-[#9f5f5f]/10 text-[#9f5f5f] border-[#9f5f5f]/20'
                      }`}>
                         {entry.scoreLabel.toUpperCase()}
                      </span>
                   ) : (
                      <Badge color={entry.result === 'tradable' ? 'green' : entry.result === 'banned' ? 'red' : 'yellow'}>
                        {entry.result.toUpperCase()}
                      </Badge>
                   )}
                </div>
                
                {/* Meta Row: Direction + Price + Date */}
                <div className="flex items-center gap-2 text-sm mt-1">
                   {entry.direction && (
                     <span className={`font-bold flex items-center gap-1 ${entry.direction === 'Long' ? 'text-[#577c74]' : 'text-[#9f5f5f]'}`}>
                        {entry.direction === 'Long' ? <ArrowUpCircle size={14}/> : <ArrowDownCircle size={14}/>}
                        {entry.direction.toUpperCase()}
                     </span>
                   )}
                   {entry.price && (
                      <span className="font-mono text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded text-xs">
                         ${entry.price.toLocaleString()}
                      </span>
                   )}
                   <span className="text-stone-300 text-xs">•</span>
                   <span className="text-stone-400 text-xs">{new Date(entry.date).toLocaleDateString()}</span>
                   <span className="text-stone-300 text-xs">•</span>
                   <span className="text-stone-400 text-xs">{entry.bucket}</span>
                </div>
              </div>

              {/* Numeric Score */}
              {entry.score !== undefined && (
                 <div className="flex flex-col items-end">
                    <span className="text-2xl font-light text-stone-300">
                       <span className="text-stone-700 font-medium">{entry.score}</span>
                       <span className="text-lg">/21</span>
                    </span>
                 </div>
              )}
            </div>

            {/* SOP Visualization: 7-segment line */}
            <div className="mb-5">
               <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">SOP Analysis</span>
               </div>
               <div className="flex h-1.5 w-full rounded-full overflow-hidden gap-1 bg-stone-100">
                  {entry.sopSteps.map((step, index) => (
                     <div 
                        key={step.id} 
                        className={`flex-1 transition-colors ${getSegmentColor(step.status)}`}
                        title={`${index+1}. ${step.label}: ${step.status}`} 
                     />
                  ))}
               </div>
            </div>
            
            {/* No Trade Reasons */}
            {entry.noTradeTriggered.length > 0 && (
               <div className="bg-[#9f5f5f]/5 p-3 rounded-xl mb-3 border border-[#9f5f5f]/10">
                  <p className="text-xs font-bold text-[#9f5f5f] mb-1">Triggered Rules:</p>
                  <div className="flex flex-wrap gap-1">
                     {entry.noTradeTriggered.map(r => (
                        <span key={r} className="text-[10px] px-2 py-1 bg-white rounded-md text-[#9f5f5f] border border-[#9f5f5f]/20">
                           {r}
                        </span>
                     ))}
                  </div>
                  {entry.noTradeReasonNote && <p className="text-xs text-[#9f5f5f]/80 mt-2 italic">"{entry.noTradeReasonNote}"</p>}
               </div>
            )}

            {/* User Notes */}
            {entry.userNotes && (
               <div className="text-sm text-stone-600 bg-stone-50 rounded-xl p-3 border border-stone-100 whitespace-pre-wrap leading-relaxed">
                  {entry.userNotes}
               </div>
            )}
            
            {/* Backward compatibility */}
            {!entry.userNotes && (entry as any).coachComment && (
               <div className="text-sm text-stone-400 italic border-l-2 border-stone-200 pl-3 py-1">
                  "{(entry as any).coachComment}"
               </div>
            )}
            
            {/* Risk Data (if present) */}
            {entry.riskCalc && (
               <div className="mt-4 pt-3 border-t border-stone-100 flex gap-4 text-xs text-stone-400 font-mono">
                  <span>Entry: {entry.riskCalc.entry}</span>
                  <span>Stop: {entry.riskCalc.stop}</span>
                  <span>Shares: {entry.riskCalc.shares}</span>
               </div>
            )}
          </Card>
        ))}
        {entries.length === 0 && (
           <div className="flex flex-col items-center justify-center py-12 text-stone-300">
              <BookOpen size={48} strokeWidth={1} className="mb-2"/>
              <p className="text-sm font-medium">Journal is empty.</p>
           </div>
        )}
      </div>
    </div>
  );
};