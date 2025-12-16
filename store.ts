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

// Helper: Get a unique "Trading Day Code" based on Taipei Time (UTC+8)
// A trading day is defined as starting at 7:00 AM Taipei Time.
// If it's before 7:00 AM, it counts as the previous calendar day.
const getTaipeiTradingDayCode = (timestamp: number | null): string => {
  if (!timestamp) return "1970-01-01";
  
  // Get the date string in Taipei Time
  // This converts the timestamp to a string like "2/24/2025, 8:30:00 AM" representing Taipei time
  const dateInTaipeiStr = new Date(timestamp).toLocaleString('en-US', { timeZone: 'Asia/Taipei' });
  
  // Create a new Date object from this string. 
  // NOTE: This creates a date object where the 'face value' matches Taipei time, 
  // but mapped to the browser's local timezone context. 
  // This allows us to use .getHours() to easily check the "Taipei Hour".
  const dateObj = new Date(dateInTaipeiStr);

  // If the hour is before 7:00 AM, belong to the previous trading day
  if (dateObj.getHours() < 7) {
    dateObj.setDate(dateObj.getDate() - 1);
  }

  // Return formatted string YYYY-MM-DD
  return dateObj.toDateString();
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
    
    // Determine if we entered a new trading day (After 7:00 AM Taipei)
    const currentTradingDay = getTaipeiTradingDayCode(now);
    const lastUpdateTradingDay = getTaipeiTradingDayCode(state.lastUpdate);
    const isNewTradingDay = currentTradingDay !== lastUpdateTradingDay;

    const newHoldings = state.holdings.map(h => {
      if (prices[h.symbol] !== undefined) {
        return {
          ...h,
          // If it's a new trading day, move currentPrice to prevClose.
          // If it's the SAME trading day (multiple updates), keep the ORIGINAL prevClose for the day.
          prevClose: isNewTradingDay ? h.currentPrice : h.prevClose, 
          currentPrice: prices[h.symbol] // Always update current price
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