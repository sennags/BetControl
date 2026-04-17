window.BetControlBets = ((utils) => {
  const { normalizeCurrencyValue } = utils;

  function getCheckedWinnerKeys(card, selector) {
    if (!card) {
      return [];
    }

    return [...card.querySelectorAll(selector)].map((input) => input.dataset.entryKey);
  }

  function buildSelectedOutcome(selectableEntries, selectedWinnerKeys) {
    const selectedEntries = selectableEntries.filter((entry) => selectedWinnerKeys.includes(entry.key));
    const settledPayout = selectedEntries.reduce((sum, entry) => sum + (Number(entry.amount || 0) * Number(entry.odd || 0)), 0);
    return {
      selectedEntries,
      settledPayout,
      settledLabel: selectedEntries.map((entry) => entry.house || 'Sem casa').join(', ')
    };
  }

  function settleBet(state, config) {
    const collection = state[config.activeKey];
    const index = collection.findIndex((item) => item.id === config.id);
    if (index === -1) {
      return { ok: false };
    }

    const [bet] = collection.splice(index, 1);
    const selectedWinnerKeys = getCheckedWinnerKeys(config.card, config.winnerSelector);

    if (selectedWinnerKeys.length === 0) {
      collection.splice(index, 0, bet);
      return { ok: false, error: config.emptySelectionMessage };
    }

    const { selectedEntries, settledPayout, settledLabel } = buildSelectedOutcome(
      config.getSelectableEntries(bet),
      selectedWinnerKeys
    );

    config.applySettlement(bet, {
      selectedWinnerKeys,
      selectedEntries,
      settledPayout,
      settledLabel
    });

    state[config.historyKey].unshift(config.buildHistoryEntry(bet, selectedWinnerKeys));
    return { ok: true, bet, selectedWinnerKeys };
  }

  function deleteBet(state, config) {
    if (config.fromHistory) {
      const item = state[config.historyKey].find((entry) => entry.id === config.id);
      if (!item) {
        return { ok: false };
      }

      state[config.historyKey] = state[config.historyKey].filter((entry) => entry.id !== config.id);
      if (config.historyBankrollChange) {
        state.bankroll = normalizeCurrencyValue(state.bankroll + Number(config.historyBankrollChange(item) || 0));
      }
      config.onDeleteHistory?.(item);
      return { ok: true, item };
    }

    const item = state[config.activeKey].find((entry) => entry.id === config.id);
    if (!item) {
      return { ok: false };
    }

    state[config.activeKey] = state[config.activeKey].filter((entry) => entry.id !== config.id);
    if (config.activeBankrollChange) {
      state.bankroll = normalizeCurrencyValue(state.bankroll + Number(config.activeBankrollChange(item) || 0));
    }
    config.onDeleteActive?.(item);
    return { ok: true, item };
  }

  return {
    settleBet,
    deleteBet
  };
})(window.BetControlUtils);
