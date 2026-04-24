window.BetControlBetForms = ((calculations, utils) => {
  const {
    splitAmount,
    splitAmountByWeights,
    calculateFreebetResultsFromEntries,
    rebalanceEntriesWithFixedFocus
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
        && elements.calculatedProfitPercent
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
        const focusInput = row.querySelector('[name="focus"]');
        const focus = Boolean(focusInput?.checked);
        const printsPayload = row.querySelector('[name="printsPayload"]')?.value || '[]';
        let prints = [];

        try {
          const parsedPrints = JSON.parse(printsPayload);
          prints = Array.isArray(parsedPrints) ? parsedPrints : [];
        } catch {
          prints = [];
        }

        return oddInput ? { house, odd, amount, prints, focus } : { house, amount, prints };
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
      if (!container) {
        return [];
      }

      return [...container.querySelectorAll('.entry-row')].map((row) => ({
        house: row.querySelector('[name="house"]').value.trim(),
        odd: Number(row.querySelector('[name="odd"]').value),
        amount: Number(row.querySelector('[name="amount"]').value),
        focus: Boolean(row.querySelector('[name="focus"]')?.checked)
      }));
    }

    function getSurebetRows() {
      return [
        ...elements.mainEntries.querySelectorAll('.entry-row'),
        ...elements.counterEntries.querySelectorAll('.entry-row')
      ];
    }

    function getFreebetRows() {
      if (!elements.freebetMainEntries || !elements.freebetHedgeEntries) {
        return [];
      }

      return [
        ...elements.freebetMainEntries.querySelectorAll('.entry-row'),
        ...elements.freebetHedgeEntries.querySelectorAll('.entry-row')
      ];
    }

    function getFreebetEntryRowsByContainer(container) {
      if (!container) {
        return [];
      }

      return [...container.querySelectorAll('.entry-row')];
    }

    function getSurebetTargetTotal() {
      const controlValue = Number(elements.fixedTotalInput?.value);
      const value = Number.isNaN(controlValue) || controlValue <= 0
        ? Number(elements.surebetTotalInput?.value)
        : controlValue;
      return Number.isNaN(value) || value <= 0 ? defaultSurebetTotal : value;
    }

    function syncSurebetTargetInput() {
      if (!elements.surebetTotalInput) {
        return;
      }

      elements.surebetTotalInput.value = String(getSurebetTargetTotal());
    }

    function syncSurebetTargetInputState() {
      if (!elements.fixedTotalInput) {
        return;
      }

      const rows = getSurebetRows();
      const hasFocusedRow = rows.some((row) => row.querySelector('[name="focus"]')?.checked);
      elements.fixedTotalInput.disabled = hasFocusedRow;

      if (!hasFocusedRow) {
        syncSurebetTargetInput();
        return;
      }

      const derivedTotal = rows.reduce((sum, row) => {
        const amount = Number(row.querySelector('[name="amount"]')?.value);
        return sum + (Number.isNaN(amount) ? 0 : amount);
      }, 0);

      elements.fixedTotalInput.value = (derivedTotal > 0 ? derivedTotal : defaultSurebetTotal).toFixed(2);
      elements.surebetTotalInput.value = elements.fixedTotalInput.value;
    }

    function getFreebetTargetTotal() {
      const controlValue = Number(elements.freebetTotalInput?.value);
      const value = Number.isNaN(controlValue) || controlValue <= 0
        ? getFreebetRows().reduce((sum, row) => {
          const amount = Number(row.querySelector('[name="amount"]').value);
          return sum + (Number.isNaN(amount) ? 0 : amount);
        }, 0)
        : controlValue;
      return Number.isNaN(value) || value <= 0 ? defaultFreebetTotal : value;
    }

    function syncFreebetTargetInputState() {
      if (!elements.freebetTotalInput) {
        return;
      }

      const rows = getFreebetRows();
      const hasFocusedRow = rows.some((row) => row.querySelector('[name="focus"]')?.checked);
      elements.freebetTotalInput.disabled = hasFocusedRow;

      if (!hasFocusedRow) {
        return;
      }

      const derivedTotal = rows.reduce((sum, row) => {
        const amount = Number(row.querySelector('[name="amount"]')?.value);
        return sum + (Number.isNaN(amount) ? 0 : amount);
      }, 0);

      elements.freebetTotalInput.value = (derivedTotal > 0 ? derivedTotal : defaultFreebetTotal).toFixed(2);
    }

    function rebalanceSurebetStakesFromOdds() {
      const rows = getSurebetRows();
      if (rows.length === 0) {
        syncSurebetTargetInputState();
        return;
      }

      const entries = rows.map((row) => {
        const odd = Number(row.querySelector('[name="odd"]').value);
        return {
          row,
          odd: Number.isNaN(odd) || odd <= 1 ? null : odd,
          amount: Number(row.querySelector('[name="amount"]').value),
          focus: Boolean(row.querySelector('[name="focus"]')?.checked)
        };
      });

      if (entries.some((entry) => entry.odd == null)) {
        syncSurebetTargetInputState();
        return;
      }

      const focusedDistribution = rebalanceEntriesWithFixedFocus(
        entries.map((entry) => ({ odd: entry.odd, amount: entry.amount, focus: entry.focus }))
      );

      if (focusedDistribution) {
        entries.forEach((entry, index) => {
          entry.row.querySelector('[name="amount"]').value = Number(focusedDistribution[index].amount || 0).toFixed(2);
        });
        syncSurebetTargetInputState();
        return;
      }

      syncSurebetTargetInput();

      const distributedStakes = splitAmountByWeights(entries.map((entry) => 1 / entry.odd), getSurebetTargetTotal());
      entries.forEach((entry, index) => {
        entry.row.querySelector('[name="amount"]').value = distributedStakes[index].toFixed(2);
      });

      syncSurebetTargetInputState();
    }

    function rebalanceFreebetStakesFromOdds() {
      const mainRows = getFreebetEntryRowsByContainer(elements.freebetMainEntries);
      const hedgeRows = getFreebetEntryRowsByContainer(elements.freebetHedgeEntries);
      const rows = [...mainRows, ...hedgeRows];
      if (rows.length === 0) {
        syncFreebetTargetInputState();
        return;
      }

      const mainEntries = mainRows.map((row) => {
        const odd = Number(row.querySelector('[name="odd"]').value);

        return {
          row,
          odd: Number.isNaN(odd) || odd <= 1 ? null : odd,
          amount: Number(row.querySelector('[name="amount"]').value),
          focus: Boolean(row.querySelector('[name="focus"]')?.checked)
        };
      });

      const hedgeEntries = hedgeRows.map((row) => {
        const odd = Number(row.querySelector('[name="odd"]').value);

        return {
          row,
          odd: Number.isNaN(odd) || odd <= 1 ? null : odd,
          amount: Number(row.querySelector('[name="amount"]').value),
          focus: Boolean(row.querySelector('[name="focus"]')?.checked)
        };
      });

      const entries = [...mainEntries, ...hedgeEntries];
      if (entries.some((entry) => entry.odd == null)) {
        syncFreebetTargetInputState();
        return;
      }

      const focusedDistribution = rebalanceEntriesWithFixedFocus([
        ...mainEntries.map((entry) => ({ odd: entry.odd, amount: entry.amount, focus: entry.focus })),
        ...hedgeEntries.map((entry) => ({ odd: entry.odd, amount: entry.amount, focus: entry.focus }))
      ]);

      if (focusedDistribution) {
        entries.forEach((entry, index) => {
          const amountInput = entry.row.querySelector('[name="amount"]');
          amountInput.value = Number(focusedDistribution[index].amount || 0).toFixed(2);
        });
        syncFreebetTargetInputState();
        return;
      }

      const weights = entries.map((entry) => 1 / entry.odd);
      const distributedStakes = splitAmountByWeights(weights, getFreebetTargetTotal());

      entries.forEach((entry, index) => {
        const amountInput = entry.row.querySelector('[name="amount"]');
        amountInput.value = distributedStakes[index].toFixed(2);
      });

      syncFreebetTargetInputState();
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

    function syncFocusedFreebetRow(changedRow) {
      const focusInput = changedRow?.querySelector('[name="focus"]');
      if (!focusInput?.checked) {
        syncFreebetTargetInputState();
        return;
      }

      getFreebetRows().forEach((row) => {
        if (row === changedRow) {
          return;
        }

        const input = row.querySelector('[name="focus"]');
        if (input) {
          input.checked = false;
        }
      });

      syncFreebetTargetInputState();
    }

    function syncFocusedSurebetRow(changedRow) {
      const focusInput = changedRow?.querySelector('[name="focus"]');
      if (!focusInput?.checked) {
        syncSurebetTargetInputState();
        return;
      }

      getSurebetRows().forEach((row) => {
        if (row === changedRow) {
          return;
        }

        const input = row.querySelector('[name="focus"]');
        if (input) {
          input.checked = false;
        }
      });

      syncSurebetTargetInputState();
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
      if (!elements.freebetMainEntries || !elements.freebetHedgeEntries) {
        return;
      }

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
        syncSurebetTargetInput();
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
        elements.calculatedProfitPercent.textContent = formatPercent(calculation.totalStake > 0 ? displayedProfit / calculation.totalStake : 0);
      } catch {
        elements.profitInput.value = formatCurrency(0);
        updateProfitInputState(0);
        elements.calculatedProfitPercent.textContent = formatPercent(0);
      }
    }

    function handleFixedSideChange() {
      syncSurebetTargetInput();
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
      sumEntryAmounts,
      syncFocusedFreebetRow,
      syncFreebetTargetInputState,
      syncFocusedSurebetRow,
      syncSurebetTargetInputState
    };
  }

  return {
    createBetFormHelpers
  };
})(window.BetControlCalculations, window.BetControlUtils);
