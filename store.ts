import React, { useState, useEffect, useCallback } from 'react';
import { AppState, JournalEntry, Position } from './types';

const STORAGE_KEY_DATA = 'zentrade_data_v1';
const STORAGE_KEY_JOURNAL = 'zentrade_journal_v1';

const INITIAL_STATE: AppState = {
  holdings: [],
  cashUSD: 0,
  lastUpdate: null,
  lastMonthlyAdjustment: null,
};

export const useStore = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY_DATA);
      const storedJournal = localStorage.getItem(STORAGE_KEY_JOURNAL);

      if (storedData) {
        setState(JSON.parse(storedData));
      }
      if (storedJournal) {
        setJournal(JSON.parse(storedJournal));
      }
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to LocalStorage
  const saveState = useCallback((newState: AppState) => {
    setState(newState);
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(newState));
  }, []);

  const saveJournal = useCallback((newJournal: JournalEntry[]) => {
    setJournal(newJournal);
    localStorage.setItem(STORAGE_KEY_JOURNAL, JSON.stringify(newJournal));
  }, []);

  const addPosition = (position: Position) => {
    const newHoldings = [...state.holdings, position];
    saveState({ ...state, holdings: newHoldings });
  };

  const updatePosition = (updated: Position) => {
    const newHoldings = state.holdings.map(h => h.id === updated.id ? updated : h);
    saveState({ ...state, holdings: newHoldings });
  };

  const removePosition = (id: string) => {
    const newHoldings = state.holdings.filter(h => h.id !== id);
    saveState({ ...state, holdings: newHoldings });
  };

  const updateCash = (amount: number) => {
    saveState({ ...state, cashUSD: amount });
  };

  const updateEOD = (prices: Record<string, number>) => {
    const now = Date.now();
    const newHoldings = state.holdings.map(h => {
      if (prices[h.symbol] !== undefined) {
        return {
          ...h,
          prevClose: h.currentPrice, // Move current to prev
          currentPrice: prices[h.symbol] // Set new current
        };
      }
      return h;
    });
    saveState({ ...state, holdings: newHoldings, lastUpdate: now });
  };

  const markMonthlyAdjustment = () => {
    saveState({ ...state, lastMonthlyAdjustment: Date.now() });
  };

  const addJournalEntry = (entry: JournalEntry) => {
    const newJournal = [entry, ...journal];
    saveJournal(newJournal);
  };

  // Import Data Function
  const importData = (backupData: { state: AppState, journal: JournalEntry[] }) => {
    try {
      if (backupData.state) {
        saveState(backupData.state);
      }
      if (backupData.journal) {
        saveJournal(backupData.journal);
      }
      return true;
    } catch (e) {
      console.error("Failed to import data", e);
      return false;
    }
  };

  return {
    state,
    journal,
    isLoaded,
    addPosition,
    updatePosition,
    removePosition,
    updateCash,
    updateEOD,
    markMonthlyAdjustment,
    addJournalEntry,
    importData
  };
};