window.BetCertezaBankroll = ((utils) => {
  const { normalizeCurrencyValue } = utils;

  function updateEntriesHistory(state, delta, details = {}) {
    const amount = Number(delta) || 0;
    if (amount === 0) {
      return null;
    }

    const before = Number(state.bankroll) || 0;
    const after = before + amount;
    state.bankroll = after;
    const historyEntry = {
      id: crypto.randomUUID(),
      reason: details.reason || 'Movimentação de banca',
      description: details.description || '',
      before,
      after,
      change: amount,
      createdAt: new Date().toISOString()
    };
    state.entriesHistory.unshift(historyEntry);
    return historyEntry;
  }

  function removeEntryHistoryById(state, entryHistoryId) {
    if (!entryHistoryId) {
      return;
    }

    state.entriesHistory = state.entriesHistory.filter((item) => item.id !== entryHistoryId);
  }

  function captureEntryHistorySnapshots(state, entryHistoryIds = []) {
    return entryHistoryIds
      .filter(Boolean)
      .map((entryHistoryId) => state.entriesHistory.find((item) => item.id === entryHistoryId))
      .filter(Boolean)
      .map((item) => ({ ...item }));
  }

  function insertEntryHistorySnapshots(state, entries = []) {
    entries.forEach((entry) => {
      if (!entry?.id || state.entriesHistory.some((item) => item.id === entry.id)) {
        return;
      }

      state.entriesHistory.push({ ...entry });
    });

    state.entriesHistory.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  function moveBetToTrash(state, payload, options) {
    const trashItem = {
      id: crypto.randomUUID(),
      betType: options.betType,
      source: options.source,
      removedAt: new Date().toISOString(),
      bankrollDelta: Number(options.bankrollDelta || 0),
      historyEntries: captureEntryHistorySnapshots(state, options.historyEntryIds),
      payload: structuredClone(payload)
    };

    state.trash.unshift(trashItem);
    return trashItem;
  }

  function restoreTrashBet(state, trashId) {
    const trashIndex = state.trash.findIndex((item) => item.id === trashId);
    if (trashIndex === -1) {
      return { ok: false };
    }

    const [trashItem] = state.trash.splice(trashIndex, 1);
    const payload = structuredClone(trashItem.payload || {});
    const targetCollection = trashItem.betType === 'freebet'
      ? (trashItem.source === 'history' ? state.freebetHistory : state.freebets)
      : (trashItem.source === 'history' ? state.surebetHistory : state.surebets);

    if (targetCollection.some((item) => item.id === payload.id)) {
      state.trash.splice(trashIndex, 0, trashItem);
      return {
        ok: false,
        error: 'Essa aposta já foi restaurada e ainda existe no destino.'
      };
    }

    targetCollection.unshift(payload);
    state.bankroll = normalizeCurrencyValue(state.bankroll - Number(trashItem.bankrollDelta || 0));
    insertEntryHistorySnapshots(state, trashItem.historyEntries);
    return { ok: true, trashItem, payload };
  }

  function removeLinkedEntryHistory(state, surebet) {
    if (surebet.entryHistoryId) {
      removeEntryHistoryById(state, surebet.entryHistoryId);
      return;
    }

    state.entriesHistory = state.entriesHistory.filter((item) => {
      const isSameSurebetEntry = item.reason === 'Surebet batida'
        && item.description === surebet.title
        && Number(item.before) === Number(surebet.bankrollBefore)
        && Number(item.after) === Number(surebet.bankrollAfter);

      return !isSameSurebetEntry;
    });
  }

  function removeLinkedFreebetEntryHistory(state, freebet) {
    removeEntryHistoryById(state, freebet.stakeEntryHistoryId);
    removeEntryHistoryById(state, freebet.entryHistoryId);
  }

  return {
    updateEntriesHistory,
    removeEntryHistoryById,
    captureEntryHistorySnapshots,
    insertEntryHistorySnapshots,
    moveBetToTrash,
    restoreTrashBet,
    removeLinkedEntryHistory,
    removeLinkedFreebetEntryHistory
  };
})(window.BetCertezaUtils);
