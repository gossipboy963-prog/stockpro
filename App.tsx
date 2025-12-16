import React, { useState } from 'react';
import { useStore } from './store';
import { Dashboard } from './views/Dashboard';
import { Holdings } from './views/Holdings';
import { Checklist } from './views/Checklist';
import { Journal } from './views/Journal';
import { RiskCalculator } from './views/RiskCalc';
import { LayoutGrid, PieChart, CheckSquare, BookOpen, Loader2, Calculator } from 'lucide-react';

const App = () => {
  const { state, journal, isLoaded, addPosition, removePosition, updatePosition, updateCash, updateEOD, markMonthlyAdjustment, addJournalEntry, importData } = useStore();
  const [activeTab, setActiveTab] = useState<'dash'|'holdings'|'check'|'risk'|'journal'>('dash');

  if (!isLoaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-stone-50 text-stone-400">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const renderView = () => {
    switch(activeTab) {
      case 'dash': return <Dashboard state={state} journal={journal} updateEOD={updateEOD} markMonthlyAdjustment={markMonthlyAdjustment} importData={importData} />;
      case 'holdings': return <Holdings state={state} addPosition={addPosition} removePosition={removePosition} updatePosition={updatePosition} updateCash={updateCash} />;
      case 'check': return <Checklist onSave={addJournalEntry} />;
      case 'risk': return <RiskCalculator />;
      case 'journal': return <Journal entries={journal} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-stone-50 relative flex flex-col">
      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto no-scrollbar">
        {renderView()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full max-w-lg bg-white/95 backdrop-blur-md border-t border-stone-200 pb-safe px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-40">
        <div className="flex justify-between items-center h-16">
          <NavButton active={activeTab === 'dash'} onClick={() => setActiveTab('dash')} icon={<LayoutGrid size={22} />} label="Dash" />
          <NavButton active={activeTab === 'holdings'} onClick={() => setActiveTab('holdings')} icon={<PieChart size={22} />} label="Assets" />
          <NavButton active={activeTab === 'check'} onClick={() => setActiveTab('check')} icon={<CheckSquare size={22} />} label="Check" />
          <NavButton active={activeTab === 'risk'} onClick={() => setActiveTab('risk')} icon={<Calculator size={22} />} label="Risk" />
          <NavButton active={activeTab === 'journal'} onClick={() => setActiveTab('journal')} icon={<BookOpen size={22} />} label="Journal" />
        </div>
      </nav>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center justify-center gap-1 w-14 h-full transition-colors ${active ? 'text-stone-800' : 'text-stone-300 hover:text-stone-500'}`}
  >
    {icon}
    <span className="text-[10px] font-bold tracking-wide">{label}</span>
  </button>
);

export default App;