window.BetControlBetForms = ((calculations, utils) => {
  const {
    splitAmount,
    splitAmountByWeights,
    calculateFreebetResultsFromEntries
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
        elements.surebetTotalInput
        && elements.profitInput
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
      const currentTotal = sumEntryAmounts(elements.freebetMainEntries) + sumEntryAmounts(elements.freebetHedgeEntries);
      return currentTotal > 0 ? currentTotal : defaultFreebetTotal;
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

    function updateSurebetStatus(value, tone = 'neutral') {
      if (!elements.surebetStatus) {
        return;
      }

      elements.surebetStatus.textContent = value;
      elements.surebetStatus.className = `form-status-badge ${tone}`;
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

      const { source = 'controls' } = options;

      if (source === 'controls') {
        rebalanceSurebetStakesFromOdds();
        updateSurebetResults();
      }

      try {
        const mainEntries = collectPreviewEntries(elements.mainEntries);
        const counterEntries = collectPreviewEntries(elements.counterEntries);
        const calculation = calculateFreebetResultsFromEntries(mainEntries, counterEntries);
        const displayedProfit = calculation.guaranteedProfit;

        elements.profitInput.value = formatSignedCurrency(displayedProfit);
        updateProfitInputState(displayedProfit);
        elements.mainResultValue.textContent = formatSignedCurrency(calculation.resultIfFreebetWins);
        elements.counterResultValue.textContent = formatSignedCurrency(calculation.resultIfHedgeWins);
        elements.calculatedProfitPercent.textContent = formatPercent(calculation.totalStake > 0 ? displayedProfit / calculation.totalStake : 0);

        if (displayedProfit > 0) {
          updateSurebetStatus('Surebet válida', 'positive');
        } else if (calculation.resultIfFreebetWins < 0 || calculation.resultIfHedgeWins < 0) {
          updateSurebetStatus('Há cenário negativo', 'negative');
        } else if (displayedProfit < 0) {
          updateSurebetStatus('Não é surebet', 'negative');
        } else {
          updateSurebetStatus('Empate técnico', 'neutral');
        }
      } catch {
        elements.profitInput.value = formatCurrency(0);
        updateProfitInputState(0);
        elements.mainResultValue.textContent = formatSignedCurrency(0);
        elements.counterResultValue.textContent = formatSignedCurrency(0);
        elements.calculatedProfitPercent.textContent = formatPercent(0);
        updateSurebetStatus('Preencha odds válidas', 'neutral');
      }
    }

    function handleFixedSideChange() {
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
})(window.BetControlCalculations, window.BetControlUtils);
