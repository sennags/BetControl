window.BetControlFinance = (() => {
  function getBankrollCountedStake(amount) {
    const normalizedAmount = Number(amount || 0);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return 0;
    }

    return normalizedAmount === 1 ? 0 : normalizedAmount;
  }

  function getEntriesBankrollStake(entries) {
    return (Array.isArray(entries) ? entries : []).reduce((sum, entry) => sum + getBankrollCountedStake(entry.amount), 0);
  }

  function getFreebetBankrollStake(freebet) {
    const freebetEntries = Array.isArray(freebet.freebetEntries) ? freebet.freebetEntries : [];
    const hedgeEntries = Array.isArray(freebet.hedgeEntries) ? freebet.hedgeEntries : [];
    return getEntriesBankrollStake([...freebetEntries, ...hedgeEntries]);
  }

  function getSurebetBankrollStake(surebet) {
    const mainEntries = Array.isArray(surebet.main?.entries) ? surebet.main.entries : [];
    const counterEntries = Array.isArray(surebet.counter?.entries) ? surebet.counter.entries : [];
    return getEntriesBankrollStake([...mainEntries, ...counterEntries]);
  }

  function getFreebetSettlementDelta(freebet) {
    return getFreebetBankrollStake(freebet) + Number(freebet.settledResult != null ? freebet.settledResult : freebet.qualificationResult || 0);
  }

  function getSurebetSettlementDelta(surebet) {
    return getSurebetBankrollStake(surebet) + Number(surebet.settledResult || 0);
  }

  function getOpenExposure(state) {
    return state.surebets.reduce((sum, item) => sum + getSurebetBankrollStake(item), 0)
      + state.freebets.reduce((sum, item) => sum + getFreebetBankrollStake(item), 0);
  }

  return {
    getBankrollCountedStake,
    getEntriesBankrollStake,
    getFreebetBankrollStake,
    getSurebetBankrollStake,
    getFreebetSettlementDelta,
    getSurebetSettlementDelta,
    getOpenExposure
  };
})();
