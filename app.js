const {
  ONE_TIME_TODAY_ENTRIES_CLEAR_KEY,
  ONE_TIME_TODAY_ENTRIES_CLEAR_TARGET,
  DEFAULT_FREEBET_TOTAL,
  DEFAULT_SUREBET_TOTAL,
  loadState,
  saveState: persistState
} = window.BetCertezaStorage;

const {
  formatCurrency,
  normalizeCurrencyValue,
  formatPercent,
  formatSignedCurrency,
  formatDate,
  capitalize,
  buildBankrollTransitionLabel,
  buildBankrollTransitionInline,
  formatDateInputValue,
  isSameMonth,
  isSameDay,
  escapeHtml,
  getMonthKey,
  getMonthBounds,
  getSelectedMonthLabel
} = window.BetCertezaUtils;

let state = loadState();
let selectedHistoryMonth = 'all';
let selectedHistoryType = 'all';
let selectedHistoryOutcome = 'all';
let selectedHistoryDay = '';
let selectedExpenseMonth = 'all';
let selectedAnalysisMonth = 'all';

const elements = {
  bankrollInput: document.getElementById('bankroll-input'),
  bankrollValue: document.getElementById('bankroll-value'),
  entriesHistoryList: document.getElementById('entries-history-list'),
  entriesHistoryCount: document.getElementById('entries-history-count'),
  gainValue: document.getElementById('gain-value'),
  lossValue: document.getElementById('loss-value'),
  saveBankrollButton: document.getElementById('save-bankroll-button'),
  surebetForm: document.getElementById('surebet-form'),
  freebetForm: document.getElementById('freebet-form'),
  expenseForm: document.getElementById('expense-form'),
  expenseEditDialog: document.getElementById('expense-edit-dialog'),
  expenseEditForm: document.getElementById('expense-edit-form'),
  closeExpenseEditDialog: document.getElementById('close-expense-edit-dialog'),
  editExpenseId: document.getElementById('edit-expense-id'),
  editExpenseType: document.getElementById('edit-expense-type'),
  editExpenseAmount: document.getElementById('edit-expense-amount'),
  editExpenseDescription: document.getElementById('edit-expense-description'),
  surebetList: document.getElementById('surebet-list'),
  freebetList: document.getElementById('freebet-list'),
  freebetHistoryList: document.getElementById('freebet-history-list'),
  historyList: document.getElementById('history-list'),
  trashList: document.getElementById('trash-list'),
  expenseList: document.getElementById('expense-list'),
  historyMonthFilter: document.getElementById('history-month-filter'),
  historyTypeFilter: document.getElementById('history-type-filter'),
  historyOutcomeFilter: document.getElementById('history-outcome-filter'),
  historyDayFilterField: document.getElementById('history-day-filter-field'),
  historyDayFilter: document.getElementById('history-day-filter'),
  expenseMonthFilter: document.getElementById('expense-month-filter'),
  analysisMonthFilter: document.getElementById('analysis-month-filter'),
  historyMonthSummary: document.getElementById('history-month-summary'),
  expenseMonthSummary: document.getElementById('expense-month-summary'),
  analysisMonthSummary: document.getElementById('analysis-month-summary'),
  analysisMonthBadge: document.getElementById('analysis-month-badge'),
  analysisProfitValue: document.getElementById('analysis-profit-value'),
  analysisExpenseValue: document.getElementById('analysis-expense-value'),
  analysisSidegainValue: document.getElementById('analysis-sidegain-value'),
  analysisNetValue: document.getElementById('analysis-net-value'),
  analysisSettledCount: document.getElementById('analysis-settled-count'),
  analysisHistoryDetails: document.getElementById('analysis-history-details'),
  analysisExpenseDetails: document.getElementById('analysis-expense-details'),
  surebetCount: document.getElementById('surebet-count'),
  freebetCount: document.getElementById('freebet-count'),
  freebetHistoryCount: document.getElementById('freebet-history-count'),
  historyCount: document.getElementById('history-count'),
  trashCount: document.getElementById('trash-count'),
  expenseCount: document.getElementById('expense-count'),
  freebetOverviewCard: document.getElementById('freebet-overview-card'),
  freebetOverviewCount: document.getElementById('freebet-overview-count'),
  freebetOverviewTotal: document.getElementById('freebet-overview-total'),
  freebetOverviewLocations: document.getElementById('freebet-overview-locations'),
  trashSummary: document.getElementById('trash-summary'),
  mainEntries: document.getElementById('main-entries'),
  counterEntries: document.getElementById('counter-entries'),
  freebetMainEntries: document.getElementById('freebet-main-entries'),
  freebetHedgeEntries: document.getElementById('freebet-hedge-entries'),
  surebetTotalInput: document.getElementById('surebet-total-input'),
  fixedTotalInput: document.getElementById('fixed-total-input'),
  profitInput: document.getElementById('profit-input'),
  mainOddInput: document.getElementById('main-odd-input'),
  counterOddInput: document.getElementById('counter-odd-input'),
  mainFixedCheck: document.getElementById('main-fixed-check'),
  counterFixedCheck: document.getElementById('counter-fixed-check'),
  mainResultValue: document.getElementById('main-result-value'),
  counterResultValue: document.getElementById('counter-result-value'),
  calculatedProfitPercent: document.getElementById('calculated-profit-percent'),
  surebetStatus: document.getElementById('surebet-status'),
  addSurebetCounterEntryButton: document.getElementById('add-surebet-counter-entry-button'),
  addFreebetHedgeEntryButton: document.getElementById('add-freebet-hedge-entry-button'),
  freebetAmountInput: document.getElementById('freebet-amount-input'),
  entryTemplate: document.getElementById('entry-template'),
  freebetEntryTemplate: document.getElementById('freebet-entry-template'),
  tabButtons: document.querySelectorAll('.tab-button'),
  tabPanels: document.querySelectorAll('.tab-panel'),
  addEntryButtons: document.querySelectorAll('[data-add-entry]'),
  openTabButtons: document.querySelectorAll('[data-open-tab]')
};

bootstrap();

function bootstrap() {
  setupTabs();
  setupBankroll();
  setupSurebetForm();
  setupFreebetForm();
  setupExpenseForm();
  setupExpenseEditForm();
  setupEntryButtons();
  setupSurebetCalculator();
  setupRecordFilters();
  setupTabShortcuts();

  if (elements.mainEntries.children.length === 0) {
    addEntryRow('main');
  }

  if (elements.counterEntries.children.length === 0) {
    addEntryRow('counter');
  }

  if (elements.freebetMainEntries.children.length === 0) {
    addEntryRow('freebetMain');
  }

  if (elements.freebetHedgeEntries.children.length === 0) {
    addEntryRow('freebetHedge');
  }

  setupFreebetCalculator();

  runOneTimeTodayEntriesCleanup();

  render();
}

function setupRecordFilters() {
  elements.historyMonthFilter.addEventListener('change', () => {
    selectedHistoryMonth = elements.historyMonthFilter.value;
    selectedHistoryDay = '';
    renderHistory();
  });

  elements.historyTypeFilter.addEventListener('change', () => {
    selectedHistoryType = elements.historyTypeFilter.value;
    renderHistory();
  });

  elements.historyOutcomeFilter.addEventListener('change', () => {
    selectedHistoryOutcome = elements.historyOutcomeFilter.value;
    renderHistory();
  });

  elements.historyDayFilter.addEventListener('change', () => {
    selectedHistoryDay = elements.historyDayFilter.value;
    renderHistory();
  });

  elements.expenseMonthFilter.addEventListener('change', () => {
    selectedExpenseMonth = elements.expenseMonthFilter.value;
    renderExpenses();
  });

  elements.analysisMonthFilter.addEventListener('change', () => {
    selectedAnalysisMonth = elements.analysisMonthFilter.value;
    renderMonthlyAnalysis();
  });
}

function setupTabShortcuts() {
  elements.openTabButtons.forEach((button) => {
    button.addEventListener('click', () => switchToTab(button.dataset.openTab));
  });
}

function saveState() {
  persistState(state);
}

function setupTabs() {
  elements.tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.tab;

      elements.tabButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-selected', String(active));
      });

      elements.tabPanels.forEach((panel) => {
        const active = panel.id === target;
        panel.classList.toggle('active', active);
        panel.hidden = !active;
      });
    });
  });
}

function setupBankroll() {
  elements.saveBankrollButton.addEventListener('click', () => {
    const nextValue = Number(elements.bankrollInput.value);

    if (Number.isNaN(nextValue) || nextValue < 0) {
      alert('Informe uma banca válida.');
      return;
    }

    updateEntriesHistory(nextValue - state.bankroll, {
      reason: 'Ajuste manual de banca',
      description: 'Valor editado manualmente'
    });
    elements.bankrollInput.value = '';
    saveState();
    render();
  });
}

function setupEntryButtons() {
  elements.addEntryButtons.forEach((button) => {
    button.addEventListener('click', () => addEntryRow(button.dataset.addEntry));
  });

  if (elements.addSurebetCounterEntryButton) {
    elements.addSurebetCounterEntryButton.addEventListener('click', () => {
      addEntryRow('counter');
      updateSurebetResults();
    });
  }

  if (elements.addFreebetHedgeEntryButton) {
    elements.addFreebetHedgeEntryButton.addEventListener('click', () => {
      addEntryRow('freebetHedge');
      updateFreebetResults();
    });
  }
}

function addEntryRow(side) {
  const isComputedBetSide = ['main', 'counter', 'freebetMain', 'freebetHedge'].includes(side);
  const isFreebetSide = side === 'freebetMain' || side === 'freebetHedge';
  const isSurebetSide = side === 'main' || side === 'counter';
  const fragment = (isComputedBetSide ? elements.freebetEntryTemplate : elements.entryTemplate).content.cloneNode(true);
  const row = fragment.querySelector('.entry-row');
  const removeButton = fragment.querySelector('.remove-entry-button');

  removeButton.addEventListener('click', () => {
    const container = side === 'main'
      ? elements.mainEntries
      : side === 'counter'
        ? elements.counterEntries
        : side === 'freebetMain'
          ? elements.freebetMainEntries
          : elements.freebetHedgeEntries;
    if (container.children.length === 1) {
      alert('Cada lado precisa ter ao menos uma casa.');
      return;
    }

    row.remove();
    if (isSurebetSide) {
      applySurebetBalancedDefaults();
      updateSurebetResults();
    } else if (isFreebetSide) {
      applyFreebetBalancedDefaults();
      updateFreebetResults();
    }
  });

  const container = side === 'main'
    ? elements.mainEntries
    : side === 'counter'
      ? elements.counterEntries
      : side === 'freebetMain'
        ? elements.freebetMainEntries
        : elements.freebetHedgeEntries;
  container.appendChild(fragment);

  if (isSurebetSide) {
    applySurebetBalancedDefaults();
    updateSurebetResults();
  } else if (isFreebetSide) {
    applyFreebetBalancedDefaults();
    updateFreebetResults();
  }
}

function setupFreebetCalculator() {
  const handleFreebetInput = (event) => {
    if (event.target?.name === 'odd') {
      rebalanceFreebetStakesFromOdds();
    }

    updateFreebetResults();
  };

  elements.freebetMainEntries.addEventListener('input', handleFreebetInput);
  elements.freebetHedgeEntries.addEventListener('input', handleFreebetInput);
  elements.freebetAmountInput.addEventListener('input', () => {
    rebalanceFreebetStakesFromOdds();
    updateFreebetResults();
  });

  applyFreebetBalancedDefaults();
  updateFreebetResults();
}

function setupSurebetForm() {
  elements.surebetForm.addEventListener('submit', (event) => {
    event.preventDefault();

    let surebet;

    try {
      const mainEntries = collectEntries(elements.mainEntries, { requireOdd: true });
      const counterEntries = collectEntries(elements.counterEntries, { requireOdd: true });
      const calculation = calculateFreebetResultsFromEntries(mainEntries, counterEntries);
      const formData = new FormData(elements.surebetForm);
      const totalStakeInput = Number(formData.get('surebetTotal'));
      const savedMainEntries = calculation.freebetEntries;
      const savedCounterEntries = calculation.hedgeEntries;
      const mainHouse = savedMainEntries.map((entry) => entry.house).join(' + ');

      surebet = {
        id: crypto.randomUUID(),
        title: mainHouse,
        profit: calculation.guaranteedProfit,
        mainResult: calculation.resultIfFreebetWins,
        counterResult: calculation.resultIfHedgeWins,
        profitPercent: calculation.totalStake > 0 ? calculation.guaranteedProfit / calculation.totalStake : 0,
        totalStake: calculation.totalStake,
        surebetHouse: mainHouse,
        counterHouse: savedCounterEntries.map((entry) => entry.house).join(' + '),
        surebetTotal: totalStakeInput,
        createdAt: new Date().toISOString(),
        status: 'active',
        main: {
          entries: savedMainEntries
        },
        counter: {
          entries: savedCounterEntries
        }
      };
    } catch (error) {
      alert(error.message || 'Erro ao validar as casas da surebet.');
      return;
    }

    if (!surebet.title || !surebet.counterHouse) {
      alert('Preencha as duas casas da surebet.');
      return;
    }

    state.surebets.unshift(surebet);
    const stakeMovement = updateEntriesHistory(-getSurebetTotalStake(surebet), {
      reason: 'Surebet registrada',
      description: surebet.title
    });
    if (stakeMovement) {
      surebet.stakeEntryHistoryId = stakeMovement.id;
      surebet.stakeBankrollBefore = stakeMovement.before;
      surebet.stakeBankrollAfter = stakeMovement.after;
    }
    saveState();
    elements.surebetForm.reset();
    resetEntries();
    updateSurebetResults();
    render();
    switchToTab('dashboard');
  });
}

function setupFreebetForm() {
  elements.freebetForm.addEventListener('submit', (event) => {
    event.preventDefault();

    let freebetEntries;
    let hedgeEntries;
    let calculation;

    try {
      freebetEntries = collectEntries(elements.freebetMainEntries, { requireOdd: true });
      hedgeEntries = collectEntries(elements.freebetHedgeEntries, { requireOdd: true });
      calculation = calculateFreebetResultsFromEntries(freebetEntries, hedgeEntries);
    } catch (error) {
      alert(error.message || 'Preencha as casas da freebet corretamente.');
      return;
    }

    const formData = new FormData(elements.freebetForm);
    freebetEntries = calculation.freebetEntries;
    hedgeEntries = calculation.hedgeEntries;

    const freebetStake = freebetEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const hedgeStake = hedgeEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const freebetAmount = Number(formData.get('freebetAmount'));
    const resultIfFreebetWins = calculation.resultIfFreebetWins;
    const resultIfHedgeWins = calculation.resultIfHedgeWins;
    const freebetHouse = freebetEntries.map((entry) => entry.house).join(' + ');
    const freebet = {
      id: crypto.randomUUID(),
      title: freebetHouse,
      freebetHouse,
      hedgeHouse: hedgeEntries.map((entry) => entry.house).join(' + '),
      freebetEntries,
      hedgeEntries,
      freebetStake,
      hedgeStake,
      freebetAmount,
      resultIfFreebetWins,
      resultIfHedgeWins,
      guaranteedProfit: calculation.guaranteedProfit,
      createdAt: new Date().toISOString()
    };

    if (!freebet.freebetHouse || !freebet.hedgeHouse) {
      alert('Preencha as duas casas da freebet.');
      return;
    }

    if ([freebetStake, hedgeStake, freebetAmount, resultIfFreebetWins, resultIfHedgeWins].some((value) => Number.isNaN(value))) {
      alert('Preencha todos os valores da freebet corretamente.');
      return;
    }

    if (freebetAmount <= 0 || freebetStake < 0 || hedgeStake < 0) {
      alert('Os valores apostados devem ser válidos e a freebet deve ser maior que zero.');
      return;
    }

    state.freebets.unshift(freebet);
    const stakeMovement = updateEntriesHistory(-getFreebetTotalStake(freebet), {
      reason: 'Freebet registrada',
      description: freebet.title
    });
    if (stakeMovement) {
      freebet.stakeEntryHistoryId = stakeMovement.id;
      freebet.stakeBankrollBefore = stakeMovement.before;
      freebet.stakeBankrollAfter = stakeMovement.after;
    }
    saveState();
    elements.freebetForm.reset();
    resetFreebetEntries();
    updateFreebetResults();
    render();
    switchToTab('freebets');
  });
}

function setupSurebetCalculator() {
  const handleSurebetInput = (event) => {
    if (event.target?.name === 'odd') {
      rebalanceSurebetStakesFromOdds();
    }

    updateSurebetResults();
  };

  elements.mainEntries.addEventListener('input', handleSurebetInput);
  elements.counterEntries.addEventListener('input', handleSurebetInput);
  elements.surebetTotalInput.addEventListener('input', () => {
    rebalanceSurebetStakesFromOdds();
    updateSurebetResults();
  });

  applySurebetBalancedDefaults();
  updateSurebetResults();
}

function setupExpenseForm() {
  elements.expenseForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(elements.expenseForm);
    const expense = {
      id: crypto.randomUUID(),
      entryType: formData.get('entryType'),
      amount: Number(formData.get('amount')),
      description: formData.get('description').trim(),
      createdAt: new Date().toISOString()
    };

    if (!expense.entryType || !expense.description) {
      alert('Preencha o tipo e a descrição do lançamento.');
      return;
    }

    if (Number.isNaN(expense.amount) || expense.amount <= 0) {
      alert('Informe um valor válido.');
      return;
    }

    state.expenses.unshift(expense);
    const entryMovement = updateEntriesHistory(getExpenseBankrollDelta(expense), {
      reason: expense.entryType === 'lucrinho' ? 'Lucrinho adicionado' : 'Gasto adicionado',
      description: expense.description
    });
    if (entryMovement) {
      expense.entryHistoryId = entryMovement.id;
      expense.bankrollBefore = entryMovement.before;
      expense.bankrollAfter = entryMovement.after;
    }
    saveState();
    elements.expenseForm.reset();
    render();
    switchToTab('dashboard');
  });
}

function setupExpenseEditForm() {
  elements.closeExpenseEditDialog.addEventListener('click', () => {
    elements.expenseEditDialog.close();
  });

  elements.expenseEditForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const id = elements.editExpenseId.value;
    const expense = state.expenses.find((item) => item.id === id);
    if (!expense) {
      elements.expenseEditDialog.close();
      return;
    }

    const nextType = elements.editExpenseType.value;
    const nextDescription = elements.editExpenseDescription.value.trim();
    const nextAmount = Number(elements.editExpenseAmount.value);

    if (!nextType || !nextDescription) {
      alert('Preencha tipo e descrição.');
      return;
    }

    if (!['expense', 'lucrinho'].includes(nextType)) {
      alert('Tipo inválido.');
      return;
    }

    if (Number.isNaN(nextAmount) || nextAmount <= 0) {
      alert('Valor inválido.');
      return;
    }

    const previousExpense = { ...expense };
    const previousDelta = getExpenseBankrollDelta(previousExpense);
    const nextExpense = {
      ...expense,
      entryType: nextType,
      description: nextDescription,
      amount: nextAmount
    };
    const nextDelta = getExpenseBankrollDelta(nextExpense);

    expense.entryType = nextType;
    expense.description = nextDescription;
    expense.amount = nextAmount;

    state.bankroll += nextDelta - previousDelta;

    if (expense.bankrollBefore != null) {
      expense.bankrollAfter = Number(expense.bankrollBefore) + getExpenseBankrollDelta(expense);
    }

    if (expense.entryHistoryId) {
      updateLinkedExpenseEntryHistory(expense);
    }

    saveState();
    render();
    elements.expenseEditDialog.close();
  });
}

function collectEntries(container, options = {}) {
  const { requireOdd = false } = options;
  const rows = [...container.querySelectorAll('.entry-row')];

  const entries = rows.map((row) => {
    const house = row.querySelector('[name="house"]').value.trim();
    const amount = Number(row.querySelector('[name="amount"]').value);
    const oddInput = row.querySelector('[name="odd"]');
    const odd = oddInput ? Number(oddInput.value) : null;

    return oddInput ? { house, odd, amount } : { house, amount };
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

function collectFreebetPreviewEntries(container) {
  return [...container.querySelectorAll('.entry-row')].map((row) => ({
    house: row.querySelector('[name="house"]').value.trim(),
    odd: Number(row.querySelector('[name="odd"]').value),
    amount: Number(row.querySelector('[name="amount"]').value)
  }));
}

function resetEntries() {
  elements.mainEntries.innerHTML = '';
  elements.counterEntries.innerHTML = '';
  addEntryRow('main');
  addEntryRow('counter');
}

function resetFreebetEntries() {
  elements.freebetMainEntries.innerHTML = '';
  elements.freebetHedgeEntries.innerHTML = '';
  addEntryRow('freebetMain');
  addEntryRow('freebetHedge');
}

function getSurebetRows() {
  return [
    ...elements.mainEntries.querySelectorAll('.entry-row'),
    ...elements.counterEntries.querySelectorAll('.entry-row')
  ];
}

function getSurebetTargetTotal() {
  const value = Number(elements.surebetTotalInput?.value);
  return Number.isNaN(value) || value <= 0 ? DEFAULT_SUREBET_TOTAL : value;
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

function getFreebetRows() {
  return [
    ...elements.freebetMainEntries.querySelectorAll('.entry-row'),
    ...elements.freebetHedgeEntries.querySelectorAll('.entry-row')
  ];
}

function getFreebetTargetTotal() {
  const value = Number(elements.freebetAmountInput.value);
  return Number.isNaN(value) || value <= 0 ? DEFAULT_FREEBET_TOTAL : value;
}

function applyFreebetBalancedDefaults() {
  const rows = getFreebetRows();
  if (rows.length === 0) {
    return;
  }

  const defaultOdd = Math.max(rows.length, 2);

  rows.forEach((row) => {
    const oddInput = row.querySelector('[name="odd"]');
    oddInput.value = defaultOdd.toFixed(2);
  });

  rebalanceFreebetStakesFromOdds();
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

function updateFreebetResults() {
  const rows = getFreebetRows();

  try {
    const freebetEntries = collectFreebetPreviewEntries(elements.freebetMainEntries);
    const hedgeEntries = collectFreebetPreviewEntries(elements.freebetHedgeEntries);
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
    rows.forEach((row) => {
      const resultInput = row.querySelector('[name="result"]');
      if (resultInput) {
        resultInput.value = '';
      }
    });
  }
}

function updateSurebetResults() {
  const rows = getSurebetRows();

  try {
    const mainEntries = collectFreebetPreviewEntries(elements.mainEntries);
    const counterEntries = collectFreebetPreviewEntries(elements.counterEntries);
    const calculation = calculateFreebetResultsFromEntries(mainEntries, counterEntries);

    [...calculation.freebetEntries, ...calculation.hedgeEntries].forEach((entry, index) => {
      const resultInput = rows[index]?.querySelector('[name="result"]');
      if (resultInput) {
        resultInput.value = formatSignedCurrency(entry.profit);
      }
    });
  } catch {
    rows.forEach((row) => {
      const resultInput = row.querySelector('[name="result"]');
      if (resultInput) {
        resultInput.value = '';
      }
    });
  }
}

function updateSurebetPreview(options = {}) {
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

function updateProfitInputState(value) {
  elements.profitInput.classList.remove('profit-positive', 'profit-negative');

  if (value > 0) {
    elements.profitInput.classList.add('profit-positive');
  } else if (value < 0) {
    elements.profitInput.classList.add('profit-negative');
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

function getFixedSide() {
  if (elements.mainFixedCheck.checked) {
    return 'main';
  }

  if (elements.counterFixedCheck.checked) {
    return 'counter';
  }

  return null;
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

function autoFillSurebetAmounts(plan) {
  setAutoAmount(elements.mainEntries, plan.idealMainStake);
  setAutoAmount(elements.counterEntries, plan.idealCounterStake);
}

function fillAdaptiveSide(side, amount) {
  const container = side === 'main' ? elements.mainEntries : elements.counterEntries;
  setDistributedAmounts(container, amount);
}

function setAutoAmount(container, amount) {
  setDistributedAmounts(container, amount);
}

function setDistributedAmounts(container, amount) {
  const rows = [...container.querySelectorAll('.entry-row')];
  if (rows.length === 0) {
    return;
  }

  const splitValues = splitAmount(amount, rows.length);
  rows.forEach((row, index) => {
    const amountInput = row.querySelector('[name="amount"]');
    amountInput.value = splitValues[index].toFixed(2);
  });
}

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

function getSideTotals() {
  const mainTotal = sumEntryAmounts(elements.mainEntries);
  const counterTotal = sumEntryAmounts(elements.counterEntries);

  return {
    mainTotal,
    counterTotal,
    totalStake: mainTotal + counterTotal
  };
}

function sumEntryAmounts(container) {
  return [...container.querySelectorAll('.entry-row')].reduce((sum, row) => {
    const value = Number(row.querySelector('[name="amount"]').value);
    return sum + (Number.isNaN(value) ? 0 : value);
  }, 0);
}

function render() {
  renderSummary();
  renderFreebetOverview();
  renderEntriesHistory();
  renderSurebets();
  renderFreebets();
  renderMonthlyAnalysis();
  renderHistory();
  renderExpenses();
  renderTrash();
}

function renderSummary() {
  const currentDate = new Date();
  const settledBets = getSettledBetHistoryItems().filter((item) => isSameMonth(item.settledAt || item.createdAt, currentDate));
  const betGains = settledBets
    .map((item) => getBetOutcomeAmount(item))
    .filter((amount) => amount > 0)
    .reduce((sum, amount) => sum + amount, 0);
  const betLosses = settledBets
    .map((item) => getBetOutcomeAmount(item))
    .filter((amount) => amount < 0)
    .reduce((sum, amount) => sum + Math.abs(amount), 0);
  const expenseLosses = state.expenses
    .filter((item) => item.entryType !== 'lucrinho' && isSameMonth(item.createdAt, currentDate))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  elements.bankrollValue.textContent = formatCurrency(state.bankroll);
  elements.gainValue.textContent = formatCurrency(betGains);
  elements.lossValue.textContent = formatCurrency(expenseLosses + betLosses);
}

function getSettledBetHistoryItems() {
  return [...state.surebetHistory, ...state.freebetHistory];
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

function renderFreebetOverview() {
  const allFreebets = [...state.freebets, ...state.freebetHistory];
  elements.freebetOverviewCount.textContent = String(allFreebets.length);
  const totalAmount = allFreebets.reduce((sum, item) => sum + Number(item.freebetAmount || 0), 0);
  elements.freebetOverviewTotal.textContent = formatCurrency(totalAmount);

  if (allFreebets.length === 0) {
    elements.freebetOverviewLocations.className = 'stack-list empty-state compact-stack';
    elements.freebetOverviewLocations.textContent = 'Nenhuma freebet cadastrada ainda.';
    return;
  }

  const houses = allFreebets.reduce((map, item) => {
    const key = item.freebetHouse || 'Sem casa';
    if (!map.has(key)) {
      map.set(key, { count: 0, total: 0 });
    }

    const current = map.get(key);
    current.count += 1;
    current.total += Number(item.freebetAmount || 0);
    return map;
  }, new Map());

  elements.freebetOverviewLocations.className = 'stack-list compact-stack';
  elements.freebetOverviewLocations.innerHTML = [...houses.entries()].map(([house, info]) => `
    <div class="detail-line compact-detail-line">
      <span>${escapeHtml(house)} • ${info.count} freebet(s)</span>
      <strong>${formatCurrency(info.total)}</strong>
    </div>
  `).join('');
}

function renderEntriesHistory() {
  const todayEntries = state.entriesHistory.filter((item) => isSameDay(item.createdAt, new Date()));
  elements.entriesHistoryCount.textContent = String(todayEntries.length);

  if (todayEntries.length === 0) {
    elements.entriesHistoryList.className = 'stack-list empty-state';
    elements.entriesHistoryList.textContent = 'Nenhuma entrada registrada hoje.';
    return;
  }

  elements.entriesHistoryList.className = 'stack-list';
  elements.entriesHistoryList.innerHTML = todayEntries.map((item) => {
    const reason = escapeHtml(item.reason || 'Movimentação de banca');
    const description = item.description ? `<p>${escapeHtml(item.description)}</p>` : '';
    const displayChange = getEntriesHistoryDisplayAmount(item);
    const changeClass = displayChange >= 0 ? 'positive-text' : 'negative-text';

    return `
      <article class="item-card entries-history-card">
        <div class="item-header">
          <h3>${reason}</h3>
          <div class="item-actions">
            <strong class="${changeClass}">${formatSignedCurrency(displayChange)}</strong>
            <button type="button" class="danger-button" data-action="delete-entry-history" data-id="${item.id}">Remover</button>
          </div>
        </div>
        ${description}
        <div class="item-meta">
          <span class="chip">Data: ${formatDate(item.createdAt)}</span>
        </div>
      </article>
    `;
  }).join('');

  bindEntriesHistoryActions();
}

function getEntriesHistoryDisplayAmount(entry) {
  const relatedSurebet = state.surebetHistory.find((item) => item.entryHistoryId === entry.id);
  if (relatedSurebet) {
    return getBetOutcomeAmount(relatedSurebet);
  }

  const relatedFreebet = state.freebetHistory.find((item) => item.entryHistoryId === entry.id);
  if (relatedFreebet) {
    return getBetOutcomeAmount(relatedFreebet);
  }

  return Number(entry.change || 0);
}

function bindEntriesHistoryActions() {
  elements.entriesHistoryList.querySelectorAll('[data-action="delete-entry-history"]').forEach((button) => {
    button.addEventListener('click', () => deleteEntryHistory(button.dataset.id));
  });
}

function renderSurebets() {
  elements.surebetCount.textContent = String(state.surebets.length);

  if (state.surebets.length === 0) {
    elements.surebetList.className = 'stack-list empty-state';
    elements.surebetList.textContent = 'Nenhuma surebet cadastrada ainda.';
    return;
  }

  elements.surebetList.className = 'stack-list';
  elements.surebetList.innerHTML = state.surebets.map((item) => {
    return `
      <article class="item-card freebet-card" data-surebet-id="${item.id}">
        <div class="item-header">
          <h3>${escapeHtml(item.title)}</h3>
          <div class="item-actions">
            <button type="button" class="success-button" data-action="finish-surebet" data-id="${item.id}">Feito</button>
            <button type="button" class="danger-button" data-action="delete-surebet" data-id="${item.id}">Excluir</button>
          </div>
        </div>
        ${buildSurebetDetails(item, false)}
      </article>
    `;
  }).join('');

  bindSurebetActions();
}

function renderFreebets() {
  elements.freebetCount.textContent = String(state.freebets.length);
  elements.freebetHistoryCount.textContent = String(state.freebetHistory.length);

  if (state.freebets.length === 0) {
    elements.freebetList.className = 'stack-list empty-state';
    elements.freebetList.textContent = 'Nenhuma freebet ativa ainda.';
  } else {
    elements.freebetList.className = 'stack-list';
    elements.freebetList.innerHTML = state.freebets.map((item) => buildFreebetCard(item, false)).join('');
  }

  if (state.freebetHistory.length === 0) {
    elements.freebetHistoryList.className = 'stack-list empty-state';
    elements.freebetHistoryList.textContent = 'Nenhuma freebet registrada ainda.';
  } else {
    const grouped = groupHistoryByMonthAndDay(state.freebetHistory, 'settledAt');
    elements.freebetHistoryList.className = 'stack-list';
    elements.freebetHistoryList.innerHTML = grouped.map((monthGroup) => {
      const days = monthGroup.days.map((dayGroup) => `
        <div class="history-day">
          <div class="history-day-title">${dayGroup.label}</div>
          ${dayGroup.items.map((item) => buildFreebetCard(item, true)).join('')}
        </div>
      `).join('');

      return `
        <section class="history-month">
          <div class="history-month-header">
            <h3 class="history-month-title">${monthGroup.label}</h3>
            <span class="badge">${monthGroup.total}</span>
          </div>
          ${days}
        </section>
      `;
    }).join('');
  }

  bindFreebetActions();
}

function buildFreebetCard(item, fromHistory = false) {
  const hedgeEntries = Array.isArray(item.hedgeEntries) ? item.hedgeEntries : [];
  const freebetEntries = Array.isArray(item.freebetEntries) ? item.freebetEntries : [];
  const totalStake = getFreebetTotalStake(item);
  const actionButton = fromHistory
    ? `<button type="button" class="danger-button" data-action="delete-freebet-history" data-id="${item.id}">Excluir</button>`
    : `<button type="button" class="success-button" data-action="finish-freebet" data-id="${item.id}">Feito</button><button type="button" class="danger-button" data-action="delete-freebet" data-id="${item.id}">Excluir</button>`;
  const lifecycleChip = fromHistory
    ? `<span class="chip">Finalizada em: ${formatDate(item.settledAt || item.createdAt)}</span>`
    : `<span class="chip">Criada em: ${formatDate(item.createdAt)}</span>`;
  const outcomeChip = fromHistory
    ? `<span class="chip">Ganhadoras: ${escapeHtml(item.settledOutcomeLabel || 'Não informado')}</span><span class="chip">Profit: ${formatSignedCurrency(item.settledResult ?? 0)}</span>`
    : '';
  const activeLines = fromHistory ? '' : buildFreebetWinnerRows(item, totalStake);
  const historyLines = fromHistory ? buildFreebetHistoryRows(item, totalStake) : '';

  return `
    <article class="item-card freebet-card" data-freebet-id="${item.id}">
      <div class="item-header">
        <h3>${escapeHtml(item.title)}</h3>
        <div class="item-actions">
          ${actionButton}
        </div>
      </div>
      ${fromHistory ? historyLines : activeLines}
      <div class="item-meta">
        ${fromHistory ? '' : `<span class="chip">Freebet a ganhar: ${formatCurrency(item.freebetAmount || 0)}</span>`}
        ${outcomeChip}
        ${lifecycleChip}
      </div>
    </article>
  `;
}

function buildFreebetWinnerRows(item, totalStake) {
  return getFreebetSelectableEntries(item).map((entry) => `
    <label class="freebet-winner-row">
      <input type="checkbox" data-freebet-winner data-entry-key="${entry.key}">
      <span class="freebet-winner-house">${escapeHtml(entry.house || 'Sem casa')}</span>
      <span>odd ${Number(entry.odd || 0).toFixed(2)}</span>
      <span>Stake ${formatCurrency(entry.amount)}</span>
      <span>Profit ${formatSignedCurrency(getFreebetEntryProfit(entry, totalStake))}</span>
    </label>
  `).join('');
}

function buildFreebetHistoryRows(item, totalStake) {
  return getFreebetSelectableEntries(item).map((entry) => {
    const isWinner = Array.isArray(item.selectedWinnerKeys) && item.selectedWinnerKeys.includes(entry.key);
    return `
      <div class="freebet-winner-row history-row ${isWinner ? 'winner-row' : ''}">
        <span class="freebet-winner-house">${escapeHtml(entry.house || 'Sem casa')}</span>
        <span>odd ${Number(entry.odd || 0).toFixed(2)}</span>
        <span>Stake ${formatCurrency(entry.amount)}</span>
        <span>Profit ${formatSignedCurrency(getFreebetEntryProfit(entry, totalStake))}</span>
      </div>
    `;
  }).join('');
}

function getFreebetSelectableEntries(item) {
  const freebetEntries = Array.isArray(item.freebetEntries) ? item.freebetEntries : [];
  const hedgeEntries = Array.isArray(item.hedgeEntries) ? item.hedgeEntries : [];

  return [
    ...freebetEntries.map((entry, index) => ({ ...entry, key: `freebet-${index}` })),
    ...hedgeEntries.map((entry, index) => ({ ...entry, key: `hedge-${index}` }))
  ];
}

function getFreebetEntryProfit(entry, totalStake) {
  if (entry.profit != null) {
    return Number(entry.profit || 0);
  }

  return normalizeCurrencyValue((Number(entry.amount || 0) * Number(entry.odd || 0)) - totalStake);
}

function bindFreebetActions() {
  elements.freebetList.querySelectorAll('[data-action="delete-freebet"]').forEach((button) => {
    button.addEventListener('click', () => deleteFreebet(button.dataset.id, false));
  });

  elements.freebetList.querySelectorAll('[data-action="finish-freebet"]').forEach((button) => {
    button.addEventListener('click', () => finishFreebet(button.dataset.id));
  });

  elements.freebetHistoryList.querySelectorAll('[data-action="delete-freebet-history"]').forEach((button) => {
    button.addEventListener('click', () => deleteFreebet(button.dataset.id, true));
  });
}

function finishFreebet(id) {
  const freebet = state.freebets.find((item) => item.id === id);
  if (!freebet) {
    return;
  }

  const card = elements.freebetList.querySelector(`[data-freebet-id="${id}"]`);
  const selectedWinnerKeys = card
    ? [...card.querySelectorAll('[data-freebet-winner]:checked')].map((input) => input.dataset.entryKey)
    : [];

  if (selectedWinnerKeys.length === 0) {
    alert('Marque ao menos uma casa ganhadora.');
    return;
  }

  const selectedEntries = getFreebetSelectableEntries(freebet).filter((entry) => selectedWinnerKeys.includes(entry.key));
  const settledPayout = selectedEntries.reduce((sum, entry) => sum + (Number(entry.amount || 0) * Number(entry.odd || 0)), 0);
  const settledResult = normalizeCurrencyValue(settledPayout - getFreebetTotalStake(freebet));
  const settledLabel = selectedEntries.map((entry) => entry.house || 'Sem casa').join(', ');

  freebet.selectedWinnerKeys = selectedWinnerKeys;
  freebet.qualificationOutcome = 'selected';
  freebet.qualificationOutcomeLabel = settledLabel;
  freebet.qualificationResult = settledResult;
  freebet.qualificationRecordedAt = new Date().toISOString();
  const settlementMovement = updateEntriesHistory(getFreebetSettlementDelta(freebet), {
    reason: 'Freebet concluída',
    description: freebet.title
  });
  if (settlementMovement) {
    freebet.qualificationEntryHistoryId = settlementMovement.id;
    freebet.qualificationBankrollBefore = settlementMovement.before;
    freebet.qualificationBankrollAfter = settlementMovement.after;
  }

  const historyEntry = {
    ...freebet,
    id: crypto.randomUUID(),
    sourceFreebetId: freebet.id,
    selectedWinnerKeys,
    settledAt: freebet.qualificationRecordedAt,
    settledOutcome: freebet.qualificationOutcome,
    settledOutcomeLabel: freebet.qualificationOutcomeLabel,
    settledResult: freebet.qualificationResult,
    entryHistoryId: freebet.qualificationEntryHistoryId,
    bankrollBefore: freebet.qualificationBankrollBefore,
    bankrollAfter: freebet.qualificationBankrollAfter
  };

  freebet.qualificationHistoryId = historyEntry.id;
  state.freebets = state.freebets.filter((item) => item.id !== id);
  state.freebetHistory.unshift(historyEntry);
  saveState();
  render();
}

function deleteFreebet(id, fromHistory = false) {
  if (fromHistory) {
    const freebet = state.freebetHistory.find((item) => item.id === id);
    if (!freebet) {
      return;
    }

    moveBetToTrash(freebet, {
      betType: 'freebet',
      source: 'history',
      historyEntryIds: [freebet.stakeEntryHistoryId, freebet.entryHistoryId],
      bankrollDelta: -getBetOutcomeAmount(freebet)
    });
    state.freebetHistory = state.freebetHistory.filter((item) => item.id !== id);
    removeLinkedFreebetEntryHistory(freebet);
    state.bankroll = normalizeCurrencyValue(state.bankroll - getBetOutcomeAmount(freebet));
  } else {
    const freebet = state.freebets.find((item) => item.id === id);
    if (!freebet) {
      return;
    }

    moveBetToTrash(freebet, {
      betType: 'freebet',
      source: 'active',
      historyEntryIds: [freebet.stakeEntryHistoryId],
      bankrollDelta: getFreebetTotalStake(freebet)
    });
    state.freebets = state.freebets.filter((item) => item.id !== id);
    if (!freebet.qualificationOutcomeLabel) {
      state.bankroll = normalizeCurrencyValue(state.bankroll + getFreebetTotalStake(freebet));
      removeEntryHistoryById(freebet.stakeEntryHistoryId);
    }
  }

  saveState();
  render();
}

function renderHistory() {
  const historyItems = getMainHistoryItems();
  elements.historyCount.textContent = String(historyItems.length);
  elements.historyTypeFilter.value = selectedHistoryType;
  elements.historyOutcomeFilter.value = selectedHistoryOutcome;

  const monthOptions = getMonthOptions(historyItems, 'settledAt');
  selectedHistoryMonth = syncMonthFilter(elements.historyMonthFilter, monthOptions, selectedHistoryMonth);
  const monthFilteredHistory = filterItemsByMonth(historyItems, selectedHistoryMonth, 'settledAt');
  const typeFilteredHistory = filterHistoryByType(monthFilteredHistory, selectedHistoryType);
  const outcomeFilteredHistory = filterHistoryByOutcome(typeFilteredHistory, selectedHistoryOutcome);
  selectedHistoryDay = syncHistoryDayFilter(elements.historyDayFilter, selectedHistoryMonth, selectedHistoryDay);
  const filteredHistory = filterItemsByDay(outcomeFilteredHistory, selectedHistoryDay, 'settledAt');

  if (historyItems.length === 0) {
    elements.historyList.className = 'stack-list empty-state';
    elements.historyList.textContent = 'Nenhuma aposta batida ainda.';
    elements.historyMonthSummary.textContent = 'Nenhuma aposta batida ainda.';
    return;
  }

  if (filteredHistory.length === 0) {
    elements.historyList.className = 'stack-list empty-state';
    elements.historyList.textContent = selectedHistoryDay ? 'Nenhuma aposta encontrada neste dia.' : 'Nenhuma aposta encontrada neste mês.';
    elements.historyMonthSummary.textContent = selectedHistoryDay ? '0 apostas batidas no dia selecionado.' : '0 apostas batidas no mês selecionado.';
    return;
  }

  const monthlyProfit = filteredHistory.reduce((sum, item) => sum + getBetOutcomeAmount(item), 0);
  elements.historyMonthSummary.textContent = `${filteredHistory.length} aposta(s) batida(s)${selectedHistoryDay ? ' no dia' : ''} • Profit do período: ${formatCurrency(monthlyProfit)}`;

  const grouped = groupHistoryByMonthAndDay(filteredHistory);
  elements.historyList.className = 'stack-list';
  elements.historyList.innerHTML = grouped.map((monthGroup) => {
    const days = monthGroup.days.map((dayGroup) => {
      const items = dayGroup.items.map((item) => buildMainHistoryCard(item)).join('');

      return `
        <div class="history-day">
          <div class="history-day-title">${dayGroup.label}</div>
          ${items}
        </div>
      `;
    }).join('');

    return `
      <section class="history-month">
        <div class="history-month-header">
          <h3 class="history-month-title">${monthGroup.label}</h3>
          <span class="badge">${monthGroup.total}</span>
        </div>
        ${days}
      </section>
    `;
  }).join('');

  bindHistoryActions();
}

function filterHistoryByType(items, type) {
  if (type === 'all') {
    return items;
  }

  return items.filter((item) => item.__betType === type);
}

function filterHistoryByOutcome(items, outcome) {
  if (outcome === 'all') {
    return items;
  }

  if (outcome === 'gain') {
    return items.filter((item) => getBetOutcomeAmount(item) > 0);
  }

  if (outcome === 'loss') {
    return items.filter((item) => getBetOutcomeAmount(item) < 0);
  }

  return items;
}

function getMainHistoryItems() {
  return [
    ...state.surebetHistory.map((item) => ({ ...item, __betType: 'surebet' })),
    ...state.freebetHistory.map((item) => ({ ...item, __betType: 'freebet' }))
  ];
}

function buildMainHistoryCard(item) {
  if (item.__betType === 'freebet') {
    return buildFreebetCard(item, true);
  }

  const details = buildSurebetDetails(item, true);
  return `
    <article class="item-card">
      <div class="item-header">
        <h3>${escapeHtml(item.title)}</h3>
        <div class="item-actions">
          <button type="button" class="danger-button" data-action="delete-history-surebet" data-id="${item.id}">Excluir</button>
        </div>
      </div>
      <p><strong>Batida em:</strong> ${formatDate(item.settledAt || item.createdAt)}</p>
      ${details}
    </article>
  `;
}

function buildSurebetDetails(item, fromHistory = false) {
  const totalStake = getSurebetTotalStake(item);
  const lifecycleChip = fromHistory
    ? `<span class="chip">Finalizada em: ${formatDate(item.settledAt || item.createdAt)}</span>`
    : `<span class="chip">Criada em: ${formatDate(item.createdAt)}</span>`;
  const outcomeChip = fromHistory
    ? `<span class="chip">Ganhadoras: ${escapeHtml(item.settledOutcomeLabel || 'Não informado')}</span><span class="chip">Profit: ${formatSignedCurrency(item.settledResult ?? 0)}</span>`
    : '';

  return `
    ${fromHistory ? buildSurebetHistoryRows(item, totalStake) : buildSurebetWinnerRows(item, totalStake)}
    <div class="item-meta">
      ${fromHistory ? '' : `<span class="chip">Profit: ${formatSignedCurrency(item.profit || 0)}</span>`}
      ${outcomeChip}
      ${lifecycleChip}
    </div>
  `;
}

function buildSurebetWinnerRows(item, totalStake) {
  return getSurebetSelectableEntries(item).map((entry) => `
    <label class="freebet-winner-row">
      <input type="checkbox" data-surebet-winner data-entry-key="${entry.key}">
      <span class="freebet-winner-house">${escapeHtml(entry.house || 'Sem casa')}</span>
      <span>odd ${Number(entry.odd || 0).toFixed(2)}</span>
      <span>Stake ${formatCurrency(entry.amount)}</span>
      <span>Profit ${formatSignedCurrency(getFreebetEntryProfit(entry, totalStake))}</span>
    </label>
  `).join('');
}

function buildSurebetHistoryRows(item, totalStake) {
  return getSurebetSelectableEntries(item).map((entry) => {
    const isWinner = Array.isArray(item.selectedWinnerKeys) && item.selectedWinnerKeys.includes(entry.key);
    return `
      <div class="freebet-winner-row history-row ${isWinner ? 'winner-row' : ''}">
        <span class="freebet-winner-house">${escapeHtml(entry.house || 'Sem casa')}</span>
        <span>odd ${Number(entry.odd || 0).toFixed(2)}</span>
        <span>Stake ${formatCurrency(entry.amount)}</span>
        <span>Profit ${formatSignedCurrency(getFreebetEntryProfit(entry, totalStake))}</span>
      </div>
    `;
  }).join('');
}

function getSurebetSelectableEntries(item) {
  const mainEntries = Array.isArray(item.main?.entries) ? item.main.entries : [];
  const counterEntries = Array.isArray(item.counter?.entries) ? item.counter.entries : [];

  return [
    ...mainEntries.map((entry, index) => ({ ...entry, key: `main-${index}` })),
    ...counterEntries.map((entry, index) => ({ ...entry, key: `counter-${index}` }))
  ];
}

function getSurebetTotalStake(surebet) {
  return getSurebetSelectableEntries(surebet).reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
}

function getSurebetSettlementDelta(surebet) {
  return getSurebetTotalStake(surebet) + Number(surebet.settledResult || 0);
}

function bindSurebetActions() {
  elements.surebetList.querySelectorAll('[data-action="finish-surebet"]').forEach((button) => {
    button.addEventListener('click', () => settleSurebet(button.dataset.id));
  });

  elements.surebetList.querySelectorAll('[data-action="delete-surebet"]').forEach((button) => {
    button.addEventListener('click', () => deleteSurebet(button.dataset.id, false));
  });
}

function bindHistoryActions() {
  elements.historyList.querySelectorAll('[data-action="delete-history-surebet"]').forEach((button) => {
    button.addEventListener('click', () => deleteSurebet(button.dataset.id, true));
  });

  elements.historyList.querySelectorAll('[data-action="delete-freebet-history"]').forEach((button) => {
    button.addEventListener('click', () => deleteFreebet(button.dataset.id, true));
  });
}

function settleSurebet(id) {
  const index = state.surebets.findIndex((item) => item.id === id);
  if (index === -1) {
    return;
  }

  const [surebet] = state.surebets.splice(index, 1);
  const card = elements.surebetList.querySelector(`[data-surebet-id="${id}"]`);
  const selectedWinnerKeys = card
    ? [...card.querySelectorAll('[data-surebet-winner]:checked')].map((input) => input.dataset.entryKey)
    : [];

  if (selectedWinnerKeys.length === 0) {
    state.surebets.splice(index, 0, surebet);
    alert('Marque ao menos uma casa ganhadora.');
    return;
  }

  const selectedEntries = getSurebetSelectableEntries(surebet).filter((entry) => selectedWinnerKeys.includes(entry.key));
  const settledPayout = selectedEntries.reduce((sum, entry) => sum + (Number(entry.amount || 0) * Number(entry.odd || 0)), 0);
  const settledResult = normalizeCurrencyValue(settledPayout - getSurebetTotalStake(surebet));
  surebet.selectedWinnerKeys = selectedWinnerKeys;
  surebet.settledOutcomeLabel = selectedEntries.map((entry) => entry.house || 'Sem casa').join(', ');
  surebet.settledResult = settledResult;
  surebet.status = 'settled';
  surebet.settledAt = new Date().toISOString();
  state.surebetHistory.unshift(surebet);
  const entryMovement = updateEntriesHistory(getSurebetSettlementDelta(surebet), {
    reason: 'Surebet concluída',
    description: surebet.title
  });
  if (entryMovement) {
    surebet.entryHistoryId = entryMovement.id;
    surebet.bankrollBefore = entryMovement.before;
    surebet.bankrollAfter = entryMovement.after;
  }
  saveState();
  render();
}

function deleteSurebet(id, fromHistory) {
  if (fromHistory) {
    const surebet = state.surebetHistory.find((item) => item.id === id);
    if (!surebet) {
      return;
    }

    moveBetToTrash(surebet, {
      betType: 'surebet',
      source: 'history',
      historyEntryIds: [surebet.stakeEntryHistoryId, surebet.entryHistoryId],
      bankrollDelta: -getBetOutcomeAmount(surebet)
    });
    state.surebetHistory = state.surebetHistory.filter((item) => item.id !== id);
    removeEntryHistoryById(surebet.stakeEntryHistoryId);
    removeEntryHistoryById(surebet.entryHistoryId);
    state.bankroll = normalizeCurrencyValue(state.bankroll - getBetOutcomeAmount(surebet));
  } else {
    const surebet = state.surebets.find((item) => item.id === id);
    if (!surebet) {
      return;
    }

    moveBetToTrash(surebet, {
      betType: 'surebet',
      source: 'active',
      historyEntryIds: [surebet.stakeEntryHistoryId],
      bankrollDelta: getSurebetTotalStake(surebet)
    });
    state.surebets = state.surebets.filter((item) => item.id !== id);
    state.bankroll = normalizeCurrencyValue(state.bankroll + getSurebetTotalStake(surebet));
    removeEntryHistoryById(surebet.stakeEntryHistoryId);
  }

  saveState();
  render();
}

function groupHistoryByMonthAndDay(items, dateField = 'settledAt') {
  const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric'
  });
  const dayFormatter = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full'
  });
  const sorted = [...items].sort((a, b) => new Date((b[dateField] || b.createdAt)) - new Date((a[dateField] || a.createdAt)));
  const monthMap = new Map();

  sorted.forEach((item) => {
    const date = new Date(item[dateField] || item.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const dayKey = date.toISOString().slice(0, 10);

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        label: capitalize(monthFormatter.format(date)),
        total: 0,
        days: new Map()
      });
    }

    const monthGroup = monthMap.get(monthKey);
    monthGroup.total += 1;

    if (!monthGroup.days.has(dayKey)) {
      monthGroup.days.set(dayKey, {
        label: capitalize(dayFormatter.format(date)),
        items: []
      });
    }

    monthGroup.days.get(dayKey).items.push(item);
  });

  return [...monthMap.values()].map((monthGroup) => ({
    label: monthGroup.label,
    total: monthGroup.total,
    days: [...monthGroup.days.values()]
  }));
}

function renderExpenses() {
  elements.expenseCount.textContent = String(state.expenses.length);

  const monthOptions = getMonthOptions(state.expenses, 'createdAt');
  selectedExpenseMonth = syncMonthFilter(elements.expenseMonthFilter, monthOptions, selectedExpenseMonth);
  const filteredExpenses = filterItemsByMonth(state.expenses, selectedExpenseMonth, 'createdAt');

  if (state.expenses.length === 0) {
    elements.expenseList.className = 'stack-list empty-state';
    elements.expenseList.textContent = 'Nenhum lançamento registrado ainda.';
    elements.expenseMonthSummary.textContent = 'Nenhum lançamento registrado ainda.';
    return;
  }

  if (filteredExpenses.length === 0) {
    elements.expenseList.className = 'stack-list empty-state';
    elements.expenseList.textContent = 'Nenhum lançamento encontrado neste mês.';
    elements.expenseMonthSummary.textContent = '0 lançamentos no mês selecionado.';
    return;
  }

  const totalExpenses = filteredExpenses.filter((item) => item.entryType !== 'lucrinho').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalSideGains = filteredExpenses.filter((item) => item.entryType === 'lucrinho').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  elements.expenseMonthSummary.textContent = `${filteredExpenses.length} lançamento(s) • Gastos: ${formatCurrency(totalExpenses)} • Lucrinho: ${formatCurrency(totalSideGains)}`;

  elements.expenseList.className = 'stack-list';
  elements.expenseList.innerHTML = filteredExpenses.map((item) => {
    const typeLabel = item.entryType === 'lucrinho' ? 'Lucrinho' : 'Gasto';
    const cardClass = item.entryType === 'lucrinho' ? 'sidegain-entry' : 'expense-entry';
    const signedAmount = item.entryType === 'lucrinho' ? formatSignedCurrency(item.amount) : formatSignedCurrency(-item.amount);
    return `
      <article class="item-card expense-card ${cardClass}">
        <div class="item-header">
          <h3>${typeLabel}</h3>
          <div class="item-actions">
            <button type="button" class="secondary-button" data-action="edit-expense" data-id="${item.id}">Editar</button>
            <button type="button" class="danger-button" data-action="delete-expense" data-id="${item.id}">Excluir</button>
          </div>
        </div>
        <p>${escapeHtml(item.description)}</p>
        <div class="item-meta">
          <span class="chip">Tipo: ${typeLabel}</span>
          <span class="chip">Valor: ${signedAmount}</span>
          ${item.bankrollBefore != null && item.bankrollAfter != null ? `<span class="chip">Antes ${formatCurrency(item.bankrollBefore)} | Depois ${formatCurrency(item.bankrollAfter)}</span>` : ''}
          <span class="chip">Data: ${formatDate(item.createdAt)}</span>
        </div>
      </article>
    `;
  }).join('');

  bindExpenseActions();
}

function renderTrash() {
  const trashItems = [...state.trash].sort((a, b) => new Date(b.removedAt || b.createdAt || 0) - new Date(a.removedAt || a.createdAt || 0));
  elements.trashCount.textContent = String(trashItems.length);

  if (trashItems.length === 0) {
    elements.trashList.className = 'stack-list empty-state';
    elements.trashList.textContent = 'Nenhuma aposta excluída.';
    elements.trashSummary.textContent = 'Nenhuma aposta excluída.';
    return;
  }

  const restoredProfit = trashItems
    .filter((item) => item.source === 'history')
    .reduce((sum, item) => sum + getBetOutcomeAmount(item.payload || {}), 0);

  elements.trashSummary.textContent = `${trashItems.length} aposta(s) no lixo • Profit fora dos ganhos: ${formatSignedCurrency(-restoredProfit)}`;
  elements.trashList.className = 'stack-list';
  elements.trashList.innerHTML = trashItems.map((item) => buildTrashCard(item)).join('');

  bindTrashActions();
}

function buildTrashCard(item) {
  const payload = item.payload || {};
  const betTypeLabel = item.betType === 'freebet' ? 'Freebet' : 'Surebet';
  const sourceLabel = item.source === 'history' ? 'Histórico' : 'Ativa';
  const amountLabel = item.source === 'history'
    ? `Profit removido: ${formatSignedCurrency(-getBetOutcomeAmount(payload))}`
    : `Stake devolvida: ${formatSignedCurrency(item.bankrollDelta || 0)}`;
  const preview = buildTrashBetPreview(item);

  return `
    <article class="trash-card">
      <div class="item-header">
        <div>
          <h3>${escapeHtml(payload.title || betTypeLabel)}</h3>
          <p>${betTypeLabel} enviada para o lixo</p>
        </div>
        <div class="item-actions">
          <button type="button" class="success-button" data-action="restore-trash-bet" data-id="${item.id}">Restaurar</button>
        </div>
      </div>
      <div class="item-meta">
        <span class="chip">Tipo: ${betTypeLabel}</span>
        <span class="chip">Origem: ${sourceLabel}</span>
        <span class="chip">${amountLabel}</span>
        <span class="chip">Excluída em: ${formatDate(item.removedAt || payload.createdAt)}</span>
      </div>
      <div class="trash-preview">${preview}</div>
    </article>
  `;
}

function buildTrashBetPreview(item) {
  const payload = item.payload || {};
  const isHistory = item.source === 'history';

  if (item.betType === 'freebet') {
    const totalStake = getFreebetTotalStake(payload);
    return `
      <article class="item-card freebet-card">
        ${buildFreebetHistoryRows(isHistory ? payload : { ...payload, selectedWinnerKeys: [] }, totalStake)}
        <div class="item-meta">
          ${isHistory
            ? `<span class="chip">Profit: ${formatSignedCurrency(getBetOutcomeAmount(payload))}</span><span class="chip">Finalizada em: ${formatDate(payload.settledAt || payload.createdAt)}</span>`
            : `<span class="chip">Profit esperado: ${formatSignedCurrency(payload.guaranteedProfit || 0)}</span><span class="chip">Criada em: ${formatDate(payload.createdAt)}</span><span class="chip">Freebet a ganhar: ${formatCurrency(payload.freebetAmount || 0)}</span>`}
        </div>
      </article>
    `;
  }

  const totalStake = getSurebetTotalStake(payload);
  return `
    <article class="item-card freebet-card">
      ${buildSurebetHistoryRows(isHistory ? payload : { ...payload, selectedWinnerKeys: [] }, totalStake)}
      <div class="item-meta">
        ${isHistory
          ? `<span class="chip">Profit: ${formatSignedCurrency(getBetOutcomeAmount(payload))}</span><span class="chip">Finalizada em: ${formatDate(payload.settledAt || payload.createdAt)}</span>`
          : `<span class="chip">Profit esperado: ${formatSignedCurrency(payload.profit || 0)}</span><span class="chip">Criada em: ${formatDate(payload.createdAt)}</span>`}
      </div>
    </article>
  `;
}

function bindTrashActions() {
  elements.trashList.querySelectorAll('[data-action="restore-trash-bet"]').forEach((button) => {
    button.addEventListener('click', () => restoreTrashBet(button.dataset.id));
  });
}

function renderMonthlyAnalysis() {
  const mergedItems = [
    ...getSettledBetHistoryItems().map((item) => ({ ...item, __kind: 'history', __date: item.settledAt || item.createdAt })),
    ...state.expenses.map((item) => ({ ...item, __kind: 'expense', __date: item.createdAt }))
  ];
  const monthOptions = getMonthOptions(mergedItems, '__date');
  selectedAnalysisMonth = syncMonthFilter(elements.analysisMonthFilter, monthOptions, selectedAnalysisMonth);

  const filteredHistory = filterItemsByMonth(getSettledBetHistoryItems(), selectedAnalysisMonth, 'settledAt');
  const filteredExpenses = filterItemsByMonth(state.expenses, selectedAnalysisMonth, 'createdAt');
  const betResults = filteredHistory.map((item) => getBetOutcomeAmount(item));
  const profit = betResults.filter((amount) => amount > 0).reduce((sum, amount) => sum + amount, 0);
  const betLosses = betResults.filter((amount) => amount < 0).reduce((sum, amount) => sum + Math.abs(amount), 0);
  const expenses = filteredExpenses.filter((item) => item.entryType !== 'lucrinho').reduce((sum, item) => sum + Number(item.amount || 0), 0) + betLosses;
  const sideGains = filteredExpenses.filter((item) => item.entryType === 'lucrinho').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const net = profit + sideGains - expenses;

  elements.analysisProfitValue.textContent = formatCurrency(profit);
  elements.analysisExpenseValue.textContent = formatCurrency(expenses);
  elements.analysisSidegainValue.textContent = formatCurrency(sideGains);
  elements.analysisNetValue.textContent = formatSignedCurrency(net);
  elements.analysisSettledCount.textContent = String(filteredHistory.length);
  elements.analysisMonthBadge.textContent = getSelectedMonthLabel(elements.analysisMonthFilter);

  if (filteredHistory.length === 0 && filteredExpenses.length === 0) {
    elements.analysisMonthSummary.textContent = 'Sem dados no período selecionado.';
  } else {
    elements.analysisMonthSummary.textContent = `${filteredHistory.length} aposta(s) batida(s) • ${filteredExpenses.length} lançamento(s) • Saldo: ${formatSignedCurrency(net)}`;
  }

  renderAnalysisHistoryDetails(filteredHistory);
  renderAnalysisExpenseDetails(filteredExpenses);
}

function renderAnalysisHistoryDetails(items) {
  if (items.length === 0) {
    elements.analysisHistoryDetails.className = 'stack-list empty-state';
    elements.analysisHistoryDetails.textContent = 'Nenhuma aposta batida no período.';
    return;
  }

  elements.analysisHistoryDetails.className = 'stack-list';
  elements.analysisHistoryDetails.innerHTML = items.map((item) => `
    <div class="detail-line">
      <span>${escapeHtml(item.title)}${buildBankrollTransitionInline(item)}</span>
      <strong>${formatSignedCurrency(getBetOutcomeAmount(item))}</strong>
    </div>
  `).join('');
}

function renderAnalysisExpenseDetails(items) {
  if (items.length === 0) {
    elements.analysisExpenseDetails.className = 'stack-list empty-state';
    elements.analysisExpenseDetails.textContent = 'Nenhum lançamento no período.';
    return;
  }

  elements.analysisExpenseDetails.className = 'stack-list';
  elements.analysisExpenseDetails.innerHTML = items.map((item) => `
    <div class="detail-line">
      <span>${item.entryType === 'lucrinho' ? 'Lucrinho' : 'Gasto'}${item.description ? ` • ${escapeHtml(item.description)}` : ''}${buildBankrollTransitionInline(item)}</span>
      <strong>${item.entryType === 'lucrinho' ? formatSignedCurrency(item.amount) : formatSignedCurrency(-item.amount)}</strong>
    </div>
  `).join('');
}

function bindExpenseActions() {
  elements.expenseList.querySelectorAll('[data-action="delete-expense"]').forEach((button) => {
    button.addEventListener('click', () => deleteExpense(button.dataset.id));
  });

  elements.expenseList.querySelectorAll('[data-action="edit-expense"]').forEach((button) => {
    button.addEventListener('click', () => editExpense(button.dataset.id));
  });
}

function applyExpenseEffect(expense) {
  state.bankroll += expense.entryType === 'lucrinho' ? Number(expense.amount || 0) : -Number(expense.amount || 0);
}

function revertExpenseEffect(expense) {
  state.bankroll -= expense.entryType === 'lucrinho' ? Number(expense.amount || 0) : -Number(expense.amount || 0);
}

function deleteExpense(id) {
  const index = state.expenses.findIndex((item) => item.id === id);
  if (index === -1) {
    return;
  }

  const [expense] = state.expenses.splice(index, 1);
  state.bankroll -= getExpenseBankrollDelta(expense);
  removeEntryHistoryById(expense.entryHistoryId);
  saveState();
  render();
}

function editExpense(id) {
  const expense = state.expenses.find((item) => item.id === id);
  if (!expense) {
    return;
  }

  elements.editExpenseId.value = expense.id;
  elements.editExpenseType.value = expense.entryType;
  elements.editExpenseAmount.value = String(expense.amount);
  elements.editExpenseDescription.value = expense.description;
  elements.expenseEditDialog.showModal();
}

function getExpenseBankrollDelta(expense) {
  return expense.entryType === 'lucrinho' ? Number(expense.amount || 0) : -Number(expense.amount || 0);
}

function getFreebetTotalStake(freebet) {
  const hedgeEntries = Array.isArray(freebet.hedgeEntries) ? freebet.hedgeEntries : [];
  const fallbackHedgeStake = hedgeEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const freebetStake = Number(freebet.freebetStake || 0);
  const hedgeStake = freebet.hedgeStake != null ? Number(freebet.hedgeStake || 0) : fallbackHedgeStake;
  return freebetStake + hedgeStake;
}

function getFreebetSettlementDelta(freebet) {
  return getFreebetTotalStake(freebet) + Number(freebet.settledResult != null ? freebet.settledResult : freebet.qualificationResult || 0);
}

function getFreebetNetBankrollImpact(freebet) {
  const result = freebet.settledResult != null
    ? Number(freebet.settledResult || 0)
    : Number(freebet.qualificationResult || 0);
  return Number(freebet.freebetAmount || 0) + result;
}

function updateEntriesHistory(delta, details = {}) {
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

function updateLinkedExpenseEntryHistory(expense) {
  const linkedEntry = state.entriesHistory.find((item) => item.id === expense.entryHistoryId);
  if (!linkedEntry) {
    return;
  }

  if (expense.bankrollBefore == null) {
    expense.bankrollBefore = linkedEntry.before;
  }

  if (expense.bankrollAfter == null) {
    expense.bankrollAfter = Number(expense.bankrollBefore) + getExpenseBankrollDelta(expense);
  }

  linkedEntry.reason = expense.entryType === 'lucrinho' ? 'Lucrinho adicionado' : 'Gasto adicionado';
  linkedEntry.description = expense.description;
  linkedEntry.change = getExpenseBankrollDelta(expense);
  linkedEntry.before = expense.bankrollBefore;
  linkedEntry.after = expense.bankrollAfter;
}

function removeEntryHistoryById(entryHistoryId) {
  if (!entryHistoryId) {
    return;
  }

  state.entriesHistory = state.entriesHistory.filter((item) => item.id !== entryHistoryId);
}

function captureEntryHistorySnapshots(entryHistoryIds = []) {
  return entryHistoryIds
    .filter(Boolean)
    .map((entryHistoryId) => state.entriesHistory.find((item) => item.id === entryHistoryId))
    .filter(Boolean)
    .map((item) => ({ ...item }));
}

function insertEntryHistorySnapshots(entries = []) {
  entries.forEach((entry) => {
    if (!entry?.id || state.entriesHistory.some((item) => item.id === entry.id)) {
      return;
    }

    state.entriesHistory.push({ ...entry });
  });

  state.entriesHistory.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function moveBetToTrash(payload, options) {
  const trashItem = {
    id: crypto.randomUUID(),
    betType: options.betType,
    source: options.source,
    removedAt: new Date().toISOString(),
    bankrollDelta: Number(options.bankrollDelta || 0),
    historyEntries: captureEntryHistorySnapshots(options.historyEntryIds),
    payload: structuredClone(payload)
  };

  state.trash.unshift(trashItem);
}

function restoreTrashBet(trashId) {
  const trashIndex = state.trash.findIndex((item) => item.id === trashId);
  if (trashIndex === -1) {
    return;
  }

  const [trashItem] = state.trash.splice(trashIndex, 1);
  const payload = structuredClone(trashItem.payload || {});
  const existsInTarget = trashItem.betType === 'freebet'
    ? (trashItem.source === 'history' ? state.freebetHistory : state.freebets).some((item) => item.id === payload.id)
    : (trashItem.source === 'history' ? state.surebetHistory : state.surebets).some((item) => item.id === payload.id);

  if (existsInTarget) {
    state.trash.splice(trashIndex, 0, trashItem);
    alert('Essa aposta já foi restaurada e ainda existe no destino.');
    return;
  }

  if (trashItem.betType === 'freebet') {
    if (trashItem.source === 'history') {
      state.freebetHistory.unshift(payload);
    } else {
      state.freebets.unshift(payload);
    }
  } else if (trashItem.source === 'history') {
    state.surebetHistory.unshift(payload);
  } else {
    state.surebets.unshift(payload);
  }

  state.bankroll = normalizeCurrencyValue(state.bankroll - Number(trashItem.bankrollDelta || 0));
  insertEntryHistorySnapshots(trashItem.historyEntries);
  saveState();
  render();
}

function deleteEntryHistory(entryHistoryId) {
  removeEntryHistoryById(entryHistoryId);
  saveState();
  render();
}

function removeLinkedEntryHistory(surebet) {
  if (surebet.entryHistoryId) {
    removeEntryHistoryById(surebet.entryHistoryId);
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

function removeLinkedFreebetEntryHistory(freebet) {
  removeEntryHistoryById(freebet.stakeEntryHistoryId);
  removeEntryHistoryById(freebet.entryHistoryId);
}

function getMonthOptions(items, dateField) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric'
  });
  const options = new Map();

  items.forEach((item) => {
    const value = item[dateField] || item.createdAt;
    if (!value) {
      return;
    }

    const date = new Date(value);
    const key = getMonthKey(date);
    if (!options.has(key)) {
      options.set(key, capitalize(formatter.format(date)));
    }
  });

  return [...options.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([value, label]) => ({ value, label }));
}

function syncMonthFilter(selectElement, options, selectedValue) {
  const nextValue = options.some((option) => option.value === selectedValue) ? selectedValue : 'all';
  selectElement.innerHTML = [`<option value="all">Todos os meses</option>`, ...options.map((option) => `<option value="${option.value}">${option.label}</option>`)].join('');
  selectElement.value = nextValue;
  return nextValue;
}

function syncHistoryDayFilter(inputElement, monthKey, selectedValue) {
  if (monthKey === 'all') {
    elements.historyDayFilterField.hidden = true;
    inputElement.value = '';
    inputElement.min = '';
    inputElement.max = '';
    inputElement.disabled = true;
    return '';
  }

  const { start, end } = getMonthBounds(monthKey);
  const todayValue = formatDateInputValue(new Date());
  const defaultValue = todayValue >= start && todayValue <= end ? todayValue : '';
  const nextValue = selectedValue && selectedValue >= start && selectedValue <= end ? selectedValue : defaultValue;

  elements.historyDayFilterField.hidden = false;
  inputElement.disabled = false;
  inputElement.min = start;
  inputElement.max = end;
  inputElement.value = nextValue;
  return nextValue;
}

function filterItemsByMonth(items, monthKey, dateField) {
  if (monthKey === 'all') {
    return [...items];
  }

  return items.filter((item) => {
    const value = item[dateField] || item.createdAt;
    return value && getMonthKey(new Date(value)) === monthKey;
  });
}

function filterItemsByDay(items, dayValue, dateField) {
  if (!dayValue) {
    return [...items];
  }

  return items.filter((item) => {
    const value = item[dateField] || item.createdAt;
    return value && formatDateInputValue(value) === dayValue;
  });
}

function switchToTab(tabId) {
  const targetButton = [...elements.tabButtons].find((button) => button.dataset.tab === tabId);
  if (targetButton) {
    targetButton.click();
  }
}

function clearTodayEntriesHistory() {
  const todayValue = formatDateInputValue(new Date());
  const removedIds = new Set(
    state.entriesHistory
      .filter((item) => formatDateInputValue(item.createdAt) === todayValue)
      .map((item) => item.id)
  );

  if (removedIds.size === 0) {
    return;
  }

  state.entriesHistory = state.entriesHistory.filter((item) => !removedIds.has(item.id));

  state.expenses.forEach((expense) => {
    if (removedIds.has(expense.entryHistoryId)) {
      delete expense.entryHistoryId;
    }
  });

  state.surebetHistory.forEach((surebet) => {
    if (removedIds.has(surebet.entryHistoryId)) {
      delete surebet.entryHistoryId;
    }
  });
}

function runOneTimeTodayEntriesCleanup() {
  if (localStorage.getItem(ONE_TIME_TODAY_ENTRIES_CLEAR_KEY) === ONE_TIME_TODAY_ENTRIES_CLEAR_TARGET) {
    return;
  }

  clearTodayEntriesHistory();
  saveState();
  localStorage.setItem(ONE_TIME_TODAY_ENTRIES_CLEAR_KEY, ONE_TIME_TODAY_ENTRIES_CLEAR_TARGET);
}
