window.BetCertezaStorage = (() => {
  const STORAGE_KEY = 'betcerteza:data';
  const ONE_TIME_TODAY_ENTRIES_CLEAR_KEY = 'betcerteza:entries-history-cleared-once';
  const ONE_TIME_TODAY_ENTRIES_CLEAR_TARGET = '2026-04-16';
  const DEFAULT_FREEBET_TOTAL = 100;
  const DEFAULT_SUREBET_TOTAL = 100;
  const HISTORY_TTL_MONTHS = 12;

  const defaultState = {
    bankroll: 0,
    entriesHistory: [],
    surebets: [],
    freebets: [],
    freebetHistory: [],
    surebetHistory: [],
    expenses: []
  };

  function isExpiredByMonths(value, months) {
    if (!value) {
      return false;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setMonth(cutoff.getMonth() - months);
    return date < cutoff;
  }

  function removeExpiredItems(items, getDateValue, removedEntryHistoryIds) {
    let changed = false;
    const nextItems = items.filter((item) => {
      const expired = isExpiredByMonths(getDateValue(item), HISTORY_TTL_MONTHS);
      if (!expired) {
        return true;
      }

      changed = true;
      [
        item.entryHistoryId,
        item.stakeEntryHistoryId,
        item.qualificationEntryHistoryId
      ].forEach((id) => {
        if (id) {
          removedEntryHistoryIds.add(id);
        }
      });

      return false;
    });

    return { items: nextItems, changed };
  }

  function clearMissingEntryLinks(items, validEntryIds, fields) {
    let changed = false;

    items.forEach((item) => {
      fields.forEach((field) => {
        if (item[field] && !validEntryIds.has(item[field])) {
          delete item[field];
          changed = true;
        }
      });
    });

    return changed;
  }

  function purgeExpiredState(state) {
    const removedEntryHistoryIds = new Set();
    let changed = false;

    const surebetHistory = removeExpiredItems(state.surebetHistory, (item) => item.settledAt || item.createdAt, removedEntryHistoryIds);
    state.surebetHistory = surebetHistory.items;
    changed = changed || surebetHistory.changed;

    const freebetHistory = removeExpiredItems(state.freebetHistory, (item) => item.settledAt || item.createdAt, removedEntryHistoryIds);
    state.freebetHistory = freebetHistory.items;
    changed = changed || freebetHistory.changed;

    const expenses = removeExpiredItems(state.expenses, (item) => item.createdAt, removedEntryHistoryIds);
    state.expenses = expenses.items;
    changed = changed || expenses.changed;

    const nextEntriesHistory = state.entriesHistory.filter((item) => {
      if (removedEntryHistoryIds.has(item.id)) {
        changed = true;
        return false;
      }

      if (isExpiredByMonths(item.createdAt, HISTORY_TTL_MONTHS)) {
        removedEntryHistoryIds.add(item.id);
        changed = true;
        return false;
      }

      return true;
    });
    state.entriesHistory = nextEntriesHistory;

    const validEntryIds = new Set(state.entriesHistory.map((item) => item.id));
    changed = clearMissingEntryLinks(state.surebets, validEntryIds, ['stakeEntryHistoryId']) || changed;
    changed = clearMissingEntryLinks(state.freebets, validEntryIds, ['stakeEntryHistoryId', 'qualificationEntryHistoryId']) || changed;
    changed = clearMissingEntryLinks(state.surebetHistory, validEntryIds, ['entryHistoryId']) || changed;
    changed = clearMissingEntryLinks(state.freebetHistory, validEntryIds, ['entryHistoryId', 'stakeEntryHistoryId', 'qualificationEntryHistoryId']) || changed;
    changed = clearMissingEntryLinks(state.expenses, validEntryIds, ['entryHistoryId']) || changed;

    return { state, changed };
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return structuredClone(defaultState);
      }

      const parsed = JSON.parse(saved);
      const normalizedState = {
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
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : []
      };

      const { state, changed } = purgeExpiredState(normalizedState);
      if (changed) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }

      return state;
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
    HISTORY_TTL_MONTHS,
    defaultState,
    loadState,
    saveState
  };
})();
