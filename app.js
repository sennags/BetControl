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

const {
  updateEntriesHistory: applyEntriesHistoryUpdate,
  removeEntryHistoryById: removeEntryHistoryRecord,
  removeLinkedEntryHistory: removeSurebetLinkedEntryHistory,
  removeLinkedFreebetEntryHistory: removeFreebetLinkedEntryHistory
} = window.BetCertezaBankroll;

const {
  settleBet: settleActiveBetRecord,
  deleteBet: deleteBetRecord
} = window.BetCertezaBets;

const {
  calculateFreebetResultsFromEntries,
  getBetOutcomeAmount,
  getFreebetSelectableEntries,
  getSurebetSelectableEntries,
  getFreebetTotalStake,
  getSurebetTotalStake,
  getFreebetSettlementDelta,
  getSurebetSettlementDelta
} = window.BetCertezaCalculations;

const {
  buildFreebetCard,
  buildSurebetCard,
  buildMainHistoryCard
} = window.BetCertezaBetCards;

const { createExpenseHelpers } = window.BetCertezaExpenses;
const { createBootstrapHelpers } = window.BetCertezaBootstrap;

const { createBetFormHelpers } = window.BetCertezaBetForms;

const {
  getSettledBetHistoryItems: selectSettledBetHistoryItems,
  getEntriesHistoryDisplayAmount: selectEntriesHistoryDisplayAmount,
  filterHistoryByType: applyHistoryTypeFilter,
  filterHistoryByOutcome: applyHistoryOutcomeFilter,
  getMainHistoryItems: selectMainHistoryItems,
  groupHistoryByMonthAndDay: groupHistoryItemsByMonthAndDay,
  getMonthOptions: buildMonthOptions,
  syncMonthFilter: applyMonthFilterSync,
  syncHistoryDayFilter: applyHistoryDayFilterSync,
  filterItemsByMonth: applyMonthItemsFilter,
  filterItemsByDay: applyDayItemsFilter,
  getDashboardSummary: buildDashboardSummary,
  getMonthlyAnalysisData: buildMonthlyAnalysisData
} = window.BetCertezaHistory;

let state = loadState();
const currentMonthKey = getMonthKey(new Date());
const currentDayValue = formatDateInputValue(new Date());
let selectedHistoryMonth = currentMonthKey;
let selectedHistoryType = 'all';
let selectedHistoryOutcome = 'all';
let selectedHistoryDay = currentDayValue;
let selectedExpenseMonth = currentMonthKey;
let selectedAnalysisMonth = currentMonthKey;

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
  expenseCount: document.getElementById('expense-count'),
  freebetOverviewCard: document.getElementById('freebet-overview-card'),
  freebetOverviewCount: document.getElementById('freebet-overview-count'),
  freebetOverviewTotal: document.getElementById('freebet-overview-total'),
  freebetOverviewLocations: document.getElementById('freebet-overview-locations'),
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

const {
  collectEntries,
  applySurebetBalancedDefaults,
  rebalanceSurebetStakesFromOdds,
  applyFreebetBalancedDefaults,
  rebalanceFreebetStakesFromOdds,
  updateFreebetResults,
  updateSurebetResults,
  updateSurebetPreview,
  handleFixedSideChange
} = createBetFormHelpers({
  elements,
  defaults: {
    defaultSurebetTotal: DEFAULT_SUREBET_TOTAL,
    defaultFreebetTotal: DEFAULT_FREEBET_TOTAL
  }
});

const {
  setupRecordFilters,
  setupTabShortcuts,
  setupTabs,
  setupBankroll,
  setupEntryButtons,
  setupFreebetCalculator,
  setupSurebetCalculator,
  switchToTab
} = createBootstrapHelpers({
  elements,
  getState: () => state,
  getFilters: () => ({
    selectedHistoryMonth,
    selectedHistoryType,
    selectedHistoryOutcome,
    selectedHistoryDay,
    selectedExpenseMonth,
    selectedAnalysisMonth
  }),
  setFilters: (nextFilters) => {
    if (Object.prototype.hasOwnProperty.call(nextFilters, 'selectedHistoryMonth')) {
      selectedHistoryMonth = nextFilters.selectedHistoryMonth;
    }
    if (Object.prototype.hasOwnProperty.call(nextFilters, 'selectedHistoryType')) {
      selectedHistoryType = nextFilters.selectedHistoryType;
    }
    if (Object.prototype.hasOwnProperty.call(nextFilters, 'selectedHistoryOutcome')) {
      selectedHistoryOutcome = nextFilters.selectedHistoryOutcome;
    }
    if (Object.prototype.hasOwnProperty.call(nextFilters, 'selectedHistoryDay')) {
      selectedHistoryDay = nextFilters.selectedHistoryDay;
    }
    if (Object.prototype.hasOwnProperty.call(nextFilters, 'selectedExpenseMonth')) {
      selectedExpenseMonth = nextFilters.selectedExpenseMonth;
    }
    if (Object.prototype.hasOwnProperty.call(nextFilters, 'selectedAnalysisMonth')) {
      selectedAnalysisMonth = nextFilters.selectedAnalysisMonth;
    }
  },
  actions: {
    addEntryRow,
    applySurebetBalancedDefaults,
    applyFreebetBalancedDefaults,
    rebalanceSurebetStakesFromOdds,
    rebalanceFreebetStakesFromOdds,
    updateSurebetResults,
    updateFreebetResults,
    updateSurebetPreview,
    handleFixedSideChange,
    updateEntriesHistory,
    saveState,
    render
  }
});

const {
  setupExpenseForm,
  setupExpenseEditForm,
  bindExpenseActions
} = createExpenseHelpers({
  elements,
  getState: () => state,
  saveState,
  render,
  switchToTab,
  updateEntriesHistory,
  removeEntryHistoryById
});

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

function saveState() {
  persistState(state);
}

function updateEntriesHistory(delta, details = {}) {
  return applyEntriesHistoryUpdate(state, delta, details);
}

function removeEntryHistoryById(entryHistoryId) {
  return removeEntryHistoryRecord(state, entryHistoryId);
}

function removeLinkedEntryHistory(surebet) {
  return removeSurebetLinkedEntryHistory(state, surebet);
}

function removeLinkedFreebetEntryHistory(freebet) {
  return removeFreebetLinkedEntryHistory(state, freebet);
}

function getSettledBetHistoryItems() {
  return selectSettledBetHistoryItems(state);
}

function getEntriesHistoryDisplayAmount(entry) {
  return selectEntriesHistoryDisplayAmount(state, entry, getBetOutcomeAmount);
}

function filterHistoryByType(items, type) {
  return applyHistoryTypeFilter(items, type);
}

function filterHistoryByOutcome(items, outcome) {
  return applyHistoryOutcomeFilter(items, outcome, getBetOutcomeAmount);
}

function getMainHistoryItems() {
  return selectMainHistoryItems(state);
}

function groupHistoryByMonthAndDay(items, dateField = 'settledAt') {
  return groupHistoryItemsByMonthAndDay(items, dateField);
}

function getMonthOptions(items, dateField) {
  return buildMonthOptions(items, dateField);
}

function syncMonthFilter(selectElement, options, selectedValue) {
  return applyMonthFilterSync(selectElement, options, selectedValue);
}

function syncHistoryDayFilter(inputElement, monthKey, selectedValue) {
  return applyHistoryDayFilterSync(elements.historyDayFilterField, inputElement, monthKey, selectedValue);
}

function filterItemsByMonth(items, monthKey, dateField) {
  return applyMonthItemsFilter(items, monthKey, dateField);
}

function filterItemsByDay(items, dayValue, dateField) {
  return applyDayItemsFilter(items, dayValue, dateField);
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

function render() {
  renderSummary();
  renderFreebetOverview();
  renderEntriesHistory();
  renderSurebets();
  renderFreebets();
  renderMonthlyAnalysis();
  renderHistory();
  renderExpenses();
}

function renderSummary() {
  const summary = buildDashboardSummary(state, new Date(), getBetOutcomeAmount, isSameMonth);

  elements.bankrollValue.textContent = formatCurrency(summary.bankroll);
  elements.gainValue.textContent = formatCurrency(summary.gains);
  elements.lossValue.textContent = formatCurrency(summary.losses);
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
  const hiddenReasons = new Set(['Surebet registrada', 'Freebet registrada']);
  const todayEntries = state.entriesHistory.filter((item) => {
    if (!isSameDay(item.createdAt, new Date())) {
      return false;
    }

    return !hiddenReasons.has(item.reason);
  });
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
  elements.surebetList.innerHTML = state.surebets.map((item) => buildSurebetCard(item)).join('');

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
  const card = elements.freebetList.querySelector(`[data-freebet-id="${id}"]`);
  const result = settleActiveBetRecord(state, {
    id,
    activeKey: 'freebets',
    historyKey: 'freebetHistory',
    card,
    winnerSelector: '[data-freebet-winner]:checked',
    emptySelectionMessage: 'Marque ao menos uma casa ganhadora.',
    getSelectableEntries: getFreebetSelectableEntries,
    applySettlement: (freebet, outcome) => {
      const settledResult = normalizeCurrencyValue(outcome.settledPayout - getFreebetTotalStake(freebet));
      freebet.selectedWinnerKeys = outcome.selectedWinnerKeys;
      freebet.qualificationOutcome = 'selected';
      freebet.qualificationOutcomeLabel = outcome.settledLabel;
      freebet.qualificationResult = settledResult;
      freebet.qualificationRecordedAt = new Date().toISOString();
      const settlementMovement = updateEntriesHistory(getFreebetSettlementDelta(freebet), {
        reason: 'Freebet concluída',
        description: outcome.settledLabel || freebet.title
      });
      if (settlementMovement) {
        freebet.qualificationEntryHistoryId = settlementMovement.id;
        freebet.qualificationBankrollBefore = settlementMovement.before;
        freebet.qualificationBankrollAfter = settlementMovement.after;
      }
    },
    buildHistoryEntry: (freebet, selectedWinnerKeys) => ({
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
    })
  });

  if (!result.ok) {
    if (result.error) {
      alert(result.error);
    }
    return;
  }

  result.bet.qualificationHistoryId = state.freebetHistory[0]?.id;
  saveState();
  render();
}

function deleteFreebet(id, fromHistory = false) {
  deleteBetRecord(state, {
    id,
    fromHistory,
    activeKey: 'freebets',
    historyKey: 'freebetHistory',
    historyBankrollChange: (freebet) => -getBetOutcomeAmount(freebet),
    activeBankrollChange: (freebet) => (!freebet.qualificationOutcomeLabel ? getFreebetTotalStake(freebet) : 0),
    onDeleteHistory: removeLinkedFreebetEntryHistory,
    onDeleteActive: (freebet) => {
      if (!freebet.qualificationOutcomeLabel) {
        removeEntryHistoryById(freebet.stakeEntryHistoryId);
      }
    }
  });

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
  const card = elements.surebetList.querySelector(`[data-surebet-id="${id}"]`);
  const result = settleActiveBetRecord(state, {
    id,
    activeKey: 'surebets',
    historyKey: 'surebetHistory',
    card,
    winnerSelector: '[data-surebet-winner]:checked',
    emptySelectionMessage: 'Marque ao menos uma casa ganhadora.',
    getSelectableEntries: getSurebetSelectableEntries,
    applySettlement: (surebet, outcome) => {
      const settledResult = normalizeCurrencyValue(outcome.settledPayout - getSurebetTotalStake(surebet));
      surebet.selectedWinnerKeys = outcome.selectedWinnerKeys;
      surebet.settledOutcomeLabel = outcome.settledLabel;
      surebet.settledResult = settledResult;
      surebet.status = 'settled';
      surebet.settledAt = new Date().toISOString();
      const entryMovement = updateEntriesHistory(getSurebetSettlementDelta(surebet), {
        reason: 'Surebet concluída',
        description: outcome.settledLabel || surebet.title
      });
      if (entryMovement) {
        surebet.entryHistoryId = entryMovement.id;
        surebet.bankrollBefore = entryMovement.before;
        surebet.bankrollAfter = entryMovement.after;
      }
    },
    buildHistoryEntry: (surebet) => surebet
  });

  if (!result.ok) {
    if (result.error) {
      alert(result.error);
    }
    return;
  }

  saveState();
  render();
}

function deleteSurebet(id, fromHistory) {
  deleteBetRecord(state, {
    id,
    fromHistory,
    activeKey: 'surebets',
    historyKey: 'surebetHistory',
    historyBankrollChange: (surebet) => -getBetOutcomeAmount(surebet),
    activeBankrollChange: (surebet) => getSurebetTotalStake(surebet),
    onDeleteHistory: removeLinkedEntryHistory,
    onDeleteActive: (surebet) => removeEntryHistoryById(surebet.stakeEntryHistoryId)
  });

  saveState();
  render();
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

function renderMonthlyAnalysis() {
  const analysis = buildMonthlyAnalysisData(state, selectedAnalysisMonth, getBetOutcomeAmount);
  selectedAnalysisMonth = syncMonthFilter(elements.analysisMonthFilter, analysis.monthOptions, analysis.selectedMonth);

  elements.analysisProfitValue.textContent = formatCurrency(analysis.profit);
  elements.analysisExpenseValue.textContent = formatCurrency(analysis.expenses);
  elements.analysisSidegainValue.textContent = formatCurrency(analysis.sideGains);
  elements.analysisNetValue.textContent = formatSignedCurrency(analysis.net);
  elements.analysisSettledCount.textContent = String(analysis.filteredHistory.length);
  elements.analysisMonthBadge.textContent = getSelectedMonthLabel(elements.analysisMonthFilter);

  if (analysis.filteredHistory.length === 0 && analysis.filteredExpenses.length === 0) {
    elements.analysisMonthSummary.textContent = 'Sem dados no período selecionado.';
  } else {
    elements.analysisMonthSummary.textContent = `${analysis.filteredHistory.length} aposta(s) batida(s) • ${analysis.filteredExpenses.length} lançamento(s) • Saldo: ${formatSignedCurrency(analysis.net)}`;
  }

  renderAnalysisHistoryDetails(analysis.filteredHistory);
  renderAnalysisExpenseDetails(analysis.filteredExpenses);
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

function deleteEntryHistory(entryHistoryId) {
  removeEntryHistoryById(entryHistoryId);
  saveState();
  render();
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
