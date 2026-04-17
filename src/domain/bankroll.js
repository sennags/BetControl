window.BetCertezaBankroll = (() => {

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
    removeLinkedEntryHistory,
    removeLinkedFreebetEntryHistory
  };
})();
