window.BetControlCalculations = ((utils) => {
  const { normalizeCurrencyValue } = utils;

  function splitAmount(total, parts) {
    const base = Math.floor((total / parts) * 100) / 100;
    const values = Array(parts).fill(base);
    let remainder = Math.round((total - (base * parts)) * 100);

    for (let index = 0; index < parts && remainder > 0; index += 1) {
      values[index] += 0.01;
      remainder -= 1;
    }

    return values;
  }

  function splitAmountByWeights(weights, total) {
    const normalizedWeights = weights.map((weight) => Number(weight) || 0);
    const totalWeight = normalizedWeights.reduce((sum, weight) => sum + weight, 0);

    if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
      return splitAmount(total, normalizedWeights.length || 1);
    }

    const rawValues = normalizedWeights.map((weight) => (total * weight) / totalWeight);
    const flooredValues = rawValues.map((value) => Math.floor(value * 100) / 100);
    let remainder = Math.round((total - flooredValues.reduce((sum, value) => sum + value, 0)) * 100);
    const order = rawValues
      .map((value, index) => ({ index, fraction: value - flooredValues[index] }))
      .sort((left, right) => right.fraction - left.fraction);

    for (let index = 0; index < order.length && remainder > 0; index += 1) {
      flooredValues[order[index].index] += 0.01;
      remainder -= 1;
      if (index === order.length - 1 && remainder > 0) {
        index = -1;
      }
    }

    return flooredValues;
  }

  function calculateFreebetResultsFromEntries(freebetEntries, hedgeEntries) {
    const allEntries = [...freebetEntries, ...hedgeEntries];
    if (allEntries.length === 0) {
      throw new Error('Adicione ao menos uma casa na freebet.');
    }

    const invalidEntry = allEntries.some((entry) => Number.isNaN(Number(entry.amount)) || Number(entry.amount) <= 0 || Number.isNaN(Number(entry.odd)) || Number(entry.odd) <= 1);
    if (invalidEntry) {
      throw new Error('Cada casa precisa de odd maior que 1 e stake válido.');
    }

    const totalStake = allEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const enrichEntries = (entries) => entries.map((entry) => ({
      ...entry,
      profit: normalizeCurrencyValue((Number(entry.amount || 0) * Number(entry.odd || 0)) - totalStake)
    }));
    const computedFreebetEntries = enrichEntries(freebetEntries);
    const computedHedgeEntries = enrichEntries(hedgeEntries);
    const allProfits = [...computedFreebetEntries, ...computedHedgeEntries].map((entry) => Number(entry.profit || 0));
    const getSideProfit = (entries) => entries.length > 0 ? Math.min(...entries.map((entry) => Number(entry.profit || 0))) : 0;

    return {
      totalStake,
      freebetEntries: computedFreebetEntries,
      hedgeEntries: computedHedgeEntries,
      resultIfFreebetWins: getSideProfit(computedFreebetEntries),
      resultIfHedgeWins: getSideProfit(computedHedgeEntries),
      guaranteedProfit: allProfits.length > 0 ? Math.min(...allProfits) : 0
    };
  }

  function rebalanceEntriesWithFixedFocus(entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
      return [];
    }

    const focusIndex = entries.findIndex((entry) => entry.focus);
    if (focusIndex === -1) {
      return null;
    }

    const focusedEntry = entries[focusIndex];
    const focusedOdd = Number(focusedEntry.odd || 0);
    const focusedAmount = Number(focusedEntry.amount || 0);

    if (!Number.isFinite(focusedOdd) || focusedOdd <= 1 || !Number.isFinite(focusedAmount) || focusedAmount <= 0) {
      return null;
    }

    const targetPayout = focusedAmount * focusedOdd;

    return entries.map((entry, index) => {
      const odd = Number(entry.odd || 0);
      if (!Number.isFinite(odd) || odd <= 1) {
        return { ...entry };
      }

      if (index === focusIndex) {
        return { ...entry, amount: normalizeCurrencyValue(focusedAmount) };
      }

      return {
        ...entry,
        amount: normalizeCurrencyValue(targetPayout / odd)
      };
    });
  }

  function calculateSurebetFromTotal(mainOdd, counterOdd, totalStake) {
    if ([mainOdd, counterOdd, totalStake].some((value) => Number.isNaN(value) || value <= 0)) {
      throw new Error('Preencha odds e valor fixo válidos.');
    }

    if (mainOdd <= 1 || counterOdd <= 1) {
      throw new Error('As odds precisam ser maiores que 1.');
    }

    const inverseSum = (1 / mainOdd) + (1 / counterOdd);
    const idealMainStake = totalStake * ((1 / mainOdd) / inverseSum);
    const idealCounterStake = totalStake * ((1 / counterOdd) / inverseSum);
    const payout = totalStake / inverseSum;
    const profit = payout - totalStake;
    const profitPercent = (1 / inverseSum) - 1;

    return {
      totalStake,
      mainOdd,
      counterOdd,
      idealMainStake,
      idealCounterStake,
      payout,
      profit,
      profitPercent,
      arbIndex: inverseSum
    };
  }

  function calculateSurebetFromFixedStake(mainOdd, counterOdd, fixedStake, fixedSide) {
    if ([mainOdd, counterOdd, fixedStake].some((value) => Number.isNaN(value) || value <= 0)) {
      throw new Error('Preencha odds e valor fixo válidos.');
    }

    if (mainOdd <= 1 || counterOdd <= 1) {
      throw new Error('As odds precisam ser maiores que 1.');
    }

    if (fixedSide === 'main') {
      const adaptedCounterStake = (fixedStake * mainOdd) / counterOdd;
      const totalStake = fixedStake + adaptedCounterStake;
      const profit = (fixedStake * mainOdd) - totalStake;
      return {
        totalStake,
        mainOdd,
        counterOdd,
        idealMainStake: fixedStake,
        idealCounterStake: adaptedCounterStake,
        adaptedMainStake: fixedStake,
        adaptedCounterStake,
        payout: fixedStake * mainOdd,
        profit,
        profitPercent: totalStake > 0 ? profit / totalStake : 0
      };
    }

    const adaptedMainStake = (fixedStake * counterOdd) / mainOdd;
    const totalStake = adaptedMainStake + fixedStake;
    const profit = (fixedStake * counterOdd) - totalStake;

    return {
      totalStake,
      mainOdd,
      counterOdd,
      idealMainStake: adaptedMainStake,
      idealCounterStake: fixedStake,
      adaptedMainStake,
      adaptedCounterStake: fixedStake,
      payout: fixedStake * counterOdd,
      profit,
      profitPercent: totalStake > 0 ? profit / totalStake : 0
    };
  }

  function calculateSurebetFromActualStakes(mainOdd, counterOdd, mainStake, counterStake) {
    if ([mainOdd, counterOdd, mainStake, counterStake].some((value) => Number.isNaN(value) || value <= 0)) {
      throw new Error('Preencha odds e valores válidos.');
    }

    if (mainOdd <= 1 || counterOdd <= 1) {
      throw new Error('As odds precisam ser maiores que 1.');
    }

    const totalStake = mainStake + counterStake;
    const plan = calculateSurebetFromTotal(mainOdd, counterOdd, totalStake);
    const mainResult = (mainStake * mainOdd) - totalStake;
    const counterResult = (counterStake * counterOdd) - totalStake;

    return {
      totalStake,
      mainOdd,
      counterOdd,
      mainStake,
      counterStake,
      idealMainStake: plan.idealMainStake,
      idealCounterStake: plan.idealCounterStake,
      payout: plan.payout,
      profit: plan.profit,
      mainResult,
      counterResult,
      profitPercent: plan.profitPercent,
      arbIndex: plan.arbIndex
    };
  }

  function getBetOutcomeAmount(item) {
    if (item.settledResult != null) {
      return Number(item.settledResult || 0);
    }

    if (item.qualificationResult != null) {
      return Number(item.qualificationResult || 0);
    }

    return Number(item.profit || 0);
  }

  function getFreebetSelectableEntries(item) {
    const freebetEntries = Array.isArray(item.freebetEntries) ? item.freebetEntries : [];
    const hedgeEntries = Array.isArray(item.hedgeEntries) ? item.hedgeEntries : [];

    return [
      ...freebetEntries.map((entry, index) => ({ ...entry, key: `freebet-${index}` })),
      ...hedgeEntries.map((entry, index) => ({ ...entry, key: `hedge-${index}` }))
    ];
  }

  function getSurebetSelectableEntries(item) {
    const mainEntries = Array.isArray(item.main?.entries) ? item.main.entries : [];
    const counterEntries = Array.isArray(item.counter?.entries) ? item.counter.entries : [];

    return [
      ...mainEntries.map((entry, index) => ({ ...entry, key: `main-${index}` })),
      ...counterEntries.map((entry, index) => ({ ...entry, key: `counter-${index}` }))
    ];
  }

  function getFreebetEntryProfit(entry, totalStake) {
    if (entry.profit != null) {
      return Number(entry.profit || 0);
    }

    return normalizeCurrencyValue((Number(entry.amount || 0) * Number(entry.odd || 0)) - totalStake);
  }

  function getFreebetTotalStake(freebet) {
    const hedgeEntries = Array.isArray(freebet.hedgeEntries) ? freebet.hedgeEntries : [];
    const fallbackHedgeStake = hedgeEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const freebetStake = Number(freebet.freebetStake || 0);
    const hedgeStake = freebet.hedgeStake != null ? Number(freebet.hedgeStake || 0) : fallbackHedgeStake;
    return freebetStake + hedgeStake;
  }

  function getSurebetTotalStake(surebet) {
    return getSurebetSelectableEntries(surebet).reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  }

  return {
    splitAmount,
    splitAmountByWeights,
    calculateFreebetResultsFromEntries,
    calculateSurebetFromTotal,
    calculateSurebetFromFixedStake,
    calculateSurebetFromActualStakes,
    rebalanceEntriesWithFixedFocus,
    getBetOutcomeAmount,
    getFreebetSelectableEntries,
    getSurebetSelectableEntries,
    getFreebetEntryProfit,
    getFreebetTotalStake,
    getSurebetTotalStake
  };
})(window.BetControlUtils);
