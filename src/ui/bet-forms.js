window.BetCertezaBetForms = ((calculations, utils) => {
  const {
    splitAmount,
    splitAmountByWeights,
    calculateFreebetResultsFromEntries,
    calculateSurebetFromTotal,
    calculateSurebetFromFixedStake,
    calculateSurebetFromActualStakes
  } = calculations;
  const {
    formatCurrency,
    formatPercent,
    formatSignedCurrency
  } = utils;

  function createBetFormHelpers({ elements, defaults }) {
    const { defaultSurebetTotal, defaultFreebetTotal } = defaults;

    function hasSurebetPreviewElements() {
      return Boolean(
        elements.profitInput
        && elements.mainResultValue
        && elements.counterResultValue
        && elements.calculatedProfitPercent
        && elements.surebetStatus
      );
    }

    function collectEntries(container, options = {}) {
      const { requireOdd = false } = options;
      const rows = [...container.querySelectorAll('.entry-row')];

      const entries = rows.map((row) => {
        const house = row.querySelector('[name="house"]').value.trim();
        const amount = Number(row.querySelector('[name="amount"]').value);
        const oddInput = row.querySelector('[name="odd"]');
        const odd = oddInput ? Number(oddInput.value) : null;
        const printsPayload = row.querySelector('[name="printsPayload"]')?.value || '[]';
        let prints = [];

        try {
          const parsedPrints = JSON.parse(printsPayload);
          prints = Array.isArray(parsedPrints) ? parsedPrints : [];
        } catch {
          prints = [];
        }

        return oddInput ? { house, odd, amount, prints } : { house, amount, prints };
      });

      const invalidEntry = entries.some((entry) => {
        const invalidBase = !entry.house || Number.isNaN(entry.amount) || entry.amount <= 0;
        if (invalidBase) {
          return true;
        }

        if (requireOdd) {
          return Number.isNaN(entry.odd) || entry.odd <= 1;
        }

        return false;
      });

      if (invalidEntry) {
        throw new Error(requireOdd
          ? 'Cada casa precisa de nome, odd maior que 1 e valor válido.'
          : 'Cada casa precisa de nome e valor válido.');
      }

      return entries;
    }

    function collectPreviewEntries(container) {
      return [...container.querySelectorAll('.entry-row')].map((row) => ({
        house: row.querySelector('[name="house"]').value.trim(),
        odd: Number(row.querySelector('[name="odd"]').value),
        amount: Number(row.querySelector('[name="amount"]').value)
      }));
    }

    function getSurebetRows() {
      return [
        ...elements.mainEntries.querySelectorAll('.entry-row'),
        ...elements.counterEntries.querySelectorAll('.entry-row')
      ];
    }

    function getFreebetRows() {
      return [
        ...elements.freebetMainEntries.querySelectorAll('.entry-row'),
        ...elements.freebetHedgeEntries.querySelectorAll('.entry-row')
      ];
    }

    function getSurebetTargetTotal() {
      const value = Number(elements.surebetTotalInput?.value);
      return Number.isNaN(value) || value <= 0 ? defaultSurebetTotal : value;
    }

    function getFreebetTargetTotal() {
      const value = Number(elements.freebetAmountInput.value);
      return Number.isNaN(value) || value <= 0 ? defaultFreebetTotal : value;
    }

    function rebalanceSurebetStakesFromOdds() {
      const rows = getSurebetRows();
      if (rows.length === 0) {
        return;
      }

      const entries = rows.map((row) => {
        const odd = Number(row.querySelector('[name="odd"]').value);
        return {
          row,
          odd: Number.isNaN(odd) || odd <= 1 ? null : odd
        };
      });

      if (entries.some((entry) => entry.odd == null)) {
        return;
      }

      const distributedStakes = splitAmountByWeights(entries.map((entry) => 1 / entry.odd), getSurebetTargetTotal());
      entries.forEach((entry, index) => {
        entry.row.querySelector('[name="amount"]').value = distributedStakes[index].toFixed(2);
      });
    }

    function rebalanceFreebetStakesFromOdds() {
      const rows = getFreebetRows();
      if (rows.length === 0) {
        return;
      }

      const entries = rows.map((row) => {
        const odd = Number(row.querySelector('[name="odd"]').value);

        return {
          row,
          odd: Number.isNaN(odd) || odd <= 1 ? null : odd
        };
      });

      if (entries.some((entry) => entry.odd == null)) {
        return;
      }

      const weights = entries.map((entry) => 1 / entry.odd);
      const distributedStakes = splitAmountByWeights(weights, getFreebetTargetTotal());

      entries.forEach((entry, index) => {
        const amountInput = entry.row.querySelector('[name="amount"]');
        amountInput.value = distributedStakes[index].toFixed(2);
      });
    }

    function applySurebetBalancedDefaults() {
      const rows = getSurebetRows();
      if (rows.length === 0) {
        return;
      }

      const defaultOdd = Math.max(rows.length, 2);
      rows.forEach((row) => {
        row.querySelector('[name="odd"]').value = defaultOdd.toFixed(2);
      });

      rebalanceSurebetStakesFromOdds();
    }

    function applyFreebetBalancedDefaults() {
      const rows = getFreebetRows();
      if (rows.length === 0) {
        return;
      }

      const defaultOdd = Math.max(rows.length, 2);
      rows.forEach((row) => {
        row.querySelector('[name="odd"]').value = defaultOdd.toFixed(2);
      });

      rebalanceFreebetStakesFromOdds();
    }

    function clearRowResults(rows) {
      rows.forEach((row) => {
        const resultInput = row.querySelector('[name="result"]');
        if (resultInput) {
          resultInput.value = '';
        }
      });
    }

    function updateFreebetResults() {
      const rows = getFreebetRows();

      try {
        const freebetEntries = collectPreviewEntries(elements.freebetMainEntries);
        const hedgeEntries = collectPreviewEntries(elements.freebetHedgeEntries);
        const calculation = calculateFreebetResultsFromEntries(freebetEntries, hedgeEntries);

        let entryIndex = 0;
        [...calculation.freebetEntries, ...calculation.hedgeEntries].forEach((entry) => {
          const resultInput = rows[entryIndex]?.querySelector('[name="result"]');
          if (resultInput) {
            resultInput.value = formatSignedCurrency(entry.profit);
          }
          entryIndex += 1;
        });
      } catch {
        clearRowResults(rows);
      }
    }

    function updateSurebetResults() {
      const rows = getSurebetRows();

      try {
        const mainEntries = collectPreviewEntries(elements.mainEntries);
        const counterEntries = collectPreviewEntries(elements.counterEntries);
        const calculation = calculateFreebetResultsFromEntries(mainEntries, counterEntries);

        [...calculation.freebetEntries, ...calculation.hedgeEntries].forEach((entry, index) => {
          const resultInput = rows[index]?.querySelector('[name="result"]');
          if (resultInput) {
            resultInput.value = formatSignedCurrency(entry.profit);
          }
        });
      } catch {
        clearRowResults(rows);
      }
    }

    function updateProfitInputState(value) {
      if (!elements.profitInput) {
        return;
      }

      elements.profitInput.classList.remove('profit-positive', 'profit-negative');

      if (value > 0) {
        elements.profitInput.classList.add('profit-positive');
      } else if (value < 0) {
        elements.profitInput.classList.add('profit-negative');
      }
    }

    function getFixedSide() {
      if (elements.mainFixedCheck.checked) {
        return 'main';
      }

      if (elements.counterFixedCheck.checked) {
        return 'counter';
      }

      return null;
    }

    function setDistributedAmounts(container, amount) {
      const rows = [...container.querySelectorAll('.entry-row')];
      if (rows.length === 0) {
        return;
      }

      const splitValues = splitAmount(amount, rows.length);
      rows.forEach((row, index) => {
        row.querySelector('[name="amount"]').value = splitValues[index].toFixed(2);
      });
    }

    function setAutoAmount(container, amount) {
      setDistributedAmounts(container, amount);
    }

    function autoFillSurebetAmounts(plan) {
      setAutoAmount(elements.mainEntries, plan.idealMainStake);
      setAutoAmount(elements.counterEntries, plan.idealCounterStake);
    }

    function fillAdaptiveSide(side, amount) {
      const container = side === 'main' ? elements.mainEntries : elements.counterEntries;
      setDistributedAmounts(container, amount);
    }

    function sumEntryAmounts(container) {
      return [...container.querySelectorAll('.entry-row')].reduce((sum, row) => {
        const value = Number(row.querySelector('[name="amount"]').value);
        return sum + (Number.isNaN(value) ? 0 : value);
      }, 0);
    }

    function getSideTotals() {
      const mainTotal = sumEntryAmounts(elements.mainEntries);
      const counterTotal = sumEntryAmounts(elements.counterEntries);

      return {
        mainTotal,
        counterTotal,
        totalStake: mainTotal + counterTotal
      };
    }

    function updateSurebetPreview(options = {}) {
      if (!hasSurebetPreviewElements()) {
        return;
      }

      const { source = 'controls', changedSide = null } = options;
      const fixedTotal = Number(elements.fixedTotalInput.value);
      const mainOdd = Number(elements.mainOddInput.value);
      const counterOdd = Number(elements.counterOddInput.value);

      try {
        const fixedSide = getFixedSide();
        let plan;

        if (fixedSide === 'main') {
          plan = calculateSurebetFromFixedStake(mainOdd, counterOdd, sumEntryAmounts(elements.mainEntries), 'main');
          fillAdaptiveSide('counter', plan.adaptedCounterStake);
        } else if (fixedSide === 'counter') {
          plan = calculateSurebetFromFixedStake(mainOdd, counterOdd, sumEntryAmounts(elements.counterEntries), 'counter');
          fillAdaptiveSide('main', plan.adaptedMainStake);
        } else {
          plan = calculateSurebetFromTotal(mainOdd, counterOdd, fixedTotal);
          if (source === 'controls') {
            autoFillSurebetAmounts(plan);
          }
        }

        if (fixedSide && source === 'entries' && changedSide && changedSide !== fixedSide) {
          if (fixedSide === 'main') {
            fillAdaptiveSide('counter', plan.adaptedCounterStake);
          } else {
            fillAdaptiveSide('main', plan.adaptedMainStake);
          }
        }

        const totals = getSideTotals();
        const actualCalculation = calculateSurebetFromActualStakes(mainOdd, counterOdd, totals.mainTotal, totals.counterTotal);
        const displayedProfit = Math.min(actualCalculation.mainResult, actualCalculation.counterResult);

        elements.profitInput.value = formatSignedCurrency(displayedProfit);
        updateProfitInputState(displayedProfit);
        elements.mainResultValue.textContent = formatSignedCurrency(actualCalculation.mainResult);
        elements.counterResultValue.textContent = formatSignedCurrency(actualCalculation.counterResult);
        elements.calculatedProfitPercent.textContent = formatPercent(totals.totalStake > 0 ? displayedProfit / totals.totalStake : 0);

        if (displayedProfit > 0) {
          elements.surebetStatus.textContent = 'Surebet válida';
        } else if (displayedProfit < 0) {
          elements.surebetStatus.textContent = 'Não é surebet';
        } else if (actualCalculation.mainResult < 0 || actualCalculation.counterResult < 0) {
          elements.surebetStatus.textContent = 'Há cenário negativo';
        } else {
          elements.surebetStatus.textContent = 'Empate técnico';
        }
      } catch {
        elements.profitInput.value = formatCurrency(0);
        updateProfitInputState(0);
        elements.mainResultValue.textContent = formatSignedCurrency(0);
        elements.counterResultValue.textContent = formatSignedCurrency(0);
        elements.calculatedProfitPercent.textContent = formatPercent(0);
        elements.surebetStatus.textContent = 'Preencha odds válidas';
      }
    }

    function handleFixedSideChange(side) {
      if (side === 'main' && elements.mainFixedCheck.checked) {
        elements.counterFixedCheck.checked = false;
      }

      if (side === 'counter' && elements.counterFixedCheck.checked) {
        elements.mainFixedCheck.checked = false;
      }

      updateSurebetPreview({ source: 'controls' });
    }

    return {
      collectEntries,
      collectPreviewEntries,
      applySurebetBalancedDefaults,
      rebalanceSurebetStakesFromOdds,
      applyFreebetBalancedDefaults,
      rebalanceFreebetStakesFromOdds,
      updateFreebetResults,
      updateSurebetResults,
      updateSurebetPreview,
      handleFixedSideChange,
      getSideTotals,
      sumEntryAmounts
    };
  }

  return {
    createBetFormHelpers
  };
})(window.BetCertezaCalculations, window.BetCertezaUtils);
