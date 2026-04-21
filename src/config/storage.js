window.BetControlStorage = (() => {
  const STORAGE_KEY = 'betcontrol:data';
  const LEGACY_STORAGE_KEY = 'betcerteza:data';
  const AUTO_BACKUP_KEY = 'betcontrol:auto-backups';
  const ONE_TIME_TODAY_ENTRIES_CLEAR_KEY = 'betcontrol:entries-history-cleared-once';
  const LEGACY_ONE_TIME_TODAY_ENTRIES_CLEAR_KEY = 'betcerteza:entries-history-cleared-once';
  const ONE_TIME_TODAY_ENTRIES_CLEAR_TARGET = '2026-04-16';
  const DEFAULT_FREEBET_TOTAL = 100;
  const DEFAULT_SUREBET_TOTAL = 100;
  const HISTORY_TTL_MONTHS = 12;
  const MAX_AUTO_BACKUPS = 30;

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

  function normalizeState(parsed) {
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
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : []
    };
  }

  function getCurrentDateKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function loadAutoBackups() {
    try {
      const raw = localStorage.getItem(AUTO_BACKUP_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveAutoBackups(backups) {
    localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(backups));
  }

  function ensureDailyBackup(state) {
    const dateKey = getCurrentDateKey();
    const backups = loadAutoBackups();
    if (backups.some((item) => item.dateKey === dateKey)) {
      return backups;
    }

    const nextBackups = [
      {
        dateKey,
        createdAt: new Date().toISOString(),
        state: structuredClone(state)
      },
      ...backups
    ].slice(0, MAX_AUTO_BACKUPS);

    saveAutoBackups(nextBackups);
    return nextBackups;
  }

  function buildExportPayload(state) {
    return {
      app: 'BetControl',
      version: 1,
      exportedAt: new Date().toISOString(),
      state: structuredClone(state)
    };
  }

  function importState(payload) {
    const source = payload?.state ?? payload;
    const normalizedState = normalizeState(source || {});
    const { state, changed } = purgeExpiredState(normalizedState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (changed || !localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    ensureDailyBackup(state);
    return state;
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!saved) {
        const freshState = structuredClone(defaultState);
        ensureDailyBackup(freshState);
        return freshState;
      }

      const parsed = JSON.parse(saved);
      const normalizedState = normalizeState(parsed);

      const { state, changed } = purgeExpiredState(normalizedState);
      if (changed || !localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }

      ensureDailyBackup(state);

      return state;
    } catch {
      return structuredClone(defaultState);
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    ensureDailyBackup(state);
  }

  return {
    STORAGE_KEY,
    LEGACY_STORAGE_KEY,
    AUTO_BACKUP_KEY,
    ONE_TIME_TODAY_ENTRIES_CLEAR_KEY,
    LEGACY_ONE_TIME_TODAY_ENTRIES_CLEAR_KEY,
    ONE_TIME_TODAY_ENTRIES_CLEAR_TARGET,
    DEFAULT_FREEBET_TOTAL,
    DEFAULT_SUREBET_TOTAL,
    HISTORY_TTL_MONTHS,
    MAX_AUTO_BACKUPS,
    defaultState,
    buildExportPayload,
    importState,
    loadAutoBackups,
    ensureDailyBackup,
    loadState,
    saveState
  };
})();
