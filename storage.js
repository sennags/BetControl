window.BetCertezaStorage = (() => {
  const STORAGE_KEY = 'betcerteza:data';
  const ONE_TIME_TODAY_ENTRIES_CLEAR_KEY = 'betcerteza:entries-history-cleared-once';
  const ONE_TIME_TODAY_ENTRIES_CLEAR_TARGET = '2026-04-16';
  const DEFAULT_FREEBET_TOTAL = 100;
  const DEFAULT_SUREBET_TOTAL = 100;

  const defaultState = {
    bankroll: 0,
    entriesHistory: [],
    surebets: [],
    freebets: [],
    freebetHistory: [],
    surebetHistory: [],
    expenses: [],
    trash: []
  };

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return structuredClone(defaultState);
      }

      const parsed = JSON.parse(saved);
      return {
        bankroll: Number(parsed.bankroll) || 0,
        entriesHistory: Array.isArray(parsed.entriesHistory)
          ? parsed.entriesHistory
          : Array.isArray(parsed.bankrollHistory)
            ? parsed.bankrollHistory
            : [],
        surebets: Array.isArray(parsed.surebets) ? parsed.surebets : [],
        freebets: Array.isArray(parsed.freebets) ? parsed.freebets : [],
        freebetHistory: Array.isArray(parsed.freebetHistory) ? parsed.freebetHistory : [],
        surebetHistory: Array.isArray(parsed.surebetHistory) ? parsed.surebetHistory : [],
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        trash: Array.isArray(parsed.trash) ? parsed.trash : []
      };
    } catch {
      return structuredClone(defaultState);
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  return {
    STORAGE_KEY,
    ONE_TIME_TODAY_ENTRIES_CLEAR_KEY,
    ONE_TIME_TODAY_ENTRIES_CLEAR_TARGET,
    DEFAULT_FREEBET_TOTAL,
    DEFAULT_SUREBET_TOTAL,
    defaultState,
    loadState,
    saveState
  };
})();
