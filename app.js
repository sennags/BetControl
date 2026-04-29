const {
  ONE_TIME_TODAY_ENTRIES_CLEAR_KEY,
  LEGACY_ONE_TIME_TODAY_ENTRIES_CLEAR_KEY,
  ONE_TIME_TODAY_ENTRIES_CLEAR_TARGET,
  DEFAULT_FREEBET_TOTAL,
  DEFAULT_SUREBET_TOTAL,
  buildExportPayload,
  importState,
  loadState,
  loadAutoBackups,
  saveState: persistState
} = window.BetControlStorage;

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
} = window.BetControlUtils;

const {
  updateEntriesHistory: applyEntriesHistoryUpdate,
  removeEntryHistoryById: removeEntryHistoryRecord,
  removeLinkedEntryHistory: removeSurebetLinkedEntryHistory,
  removeLinkedFreebetEntryHistory: removeFreebetLinkedEntryHistory
} = window.BetControlBankroll;

const {
  settleBet: settleActiveBetRecord,
  deleteBet: deleteBetRecord
} = window.BetControlBets;

const {
  calculateFreebetResultsFromEntries,
  getBetOutcomeAmount,
  getFreebetSelectableEntries,
  getSurebetSelectableEntries,
  getFreebetTotalStake,
  getSurebetTotalStake
} = window.BetControlCalculations;

const {
  getFreebetBankrollStake,
  getSurebetBankrollStake,
  getFreebetSettlementDelta,
  getSurebetSettlementDelta,
  getOpenExposure
} = window.BetControlFinance;

const {
  buildFreebetCard,
  buildSurebetCard,
  buildMainHistoryCard
} = window.BetControlBetCards;

const { createExpenseHelpers } = window.BetControlExpenses;
const { createBootstrapHelpers } = window.BetControlBootstrap;

const { createBetFormHelpers } = window.BetControlBetForms;

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
} = window.BetControlHistory;

let state = loadState();
const currentMonthKey = getMonthKey(new Date());
const currentDayValue = formatDateInputValue(new Date());
let selectedHistoryMonth = currentMonthKey;
let selectedHistoryType = 'all';
let selectedHistoryOutcome = 'all';
let selectedHistoryDay = currentDayValue;
let selectedExpenseMonth = currentMonthKey;
let selectedAnalysisMonth = currentMonthKey;
const MAX_PRINTS_PER_ENTRY = 5;
const MAX_PRINT_SIZE_BYTES = 750 * 1024;
const BACKUP_FILE_DB_NAME = 'betcontrol-file-backup';
const BACKUP_FILE_STORE_NAME = 'handles';
const BACKUP_FILE_HANDLE_KEY = 'auto-backup';
const AUTO_BACKUP_FILE_NAME = 'betcontrol-auto-backup.json';
let betPrintDrafts = {};
let autoBackupFileHandle = null;
let autoBackupFileStatus = 'inactive';

const elements = {
  bankrollInput: document.getElementById('bankroll-input'),
  bankrollValue: document.getElementById('bankroll-value'),
  entriesHistoryList: document.getElementById('entries-history-list'),
  entriesHistoryCount: document.getElementById('entries-history-count'),
  gainValue: document.getElementById('gain-value'),
  lossValue: document.getElementById('loss-value'),
  dashboardNetValue: document.getElementById('dashboard-net-value'),
  dashboardNetBadge: document.getElementById('dashboard-net-badge'),
  dashboardOpenExposure: document.getElementById('dashboard-open-exposure'),
  dashboardActiveSurebets: document.getElementById('dashboard-active-surebets'),
  dashboardActiveFreebets: document.getElementById('dashboard-active-freebets'),
  dashboardInsightText: document.getElementById('dashboard-insight-text'),
  bankrollValueGhost: document.getElementById('bankroll-value-ghost'),
  saveBankrollButton: document.getElementById('save-bankroll-button'),
  currentSceneTitle: document.getElementById('current-scene-title'),
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
  enableFileBackupButton: document.getElementById('enable-file-backup-button'),
  exportBackupButton: document.getElementById('export-backup-button'),
  importBackupButton: document.getElementById('import-backup-button'),
  importBackupInput: document.getElementById('import-backup-input'),
  backupStatus: document.getElementById('backup-status'),
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
  calculatedProfitPercent: document.getElementById('calculated-profit-percent'),
  addSurebetCounterEntryButton: document.getElementById('add-surebet-counter-entry-button'),
  addFreebetHedgeEntryButton: document.getElementById('add-freebet-hedge-entry-button'),
  freebetTotalInput: document.getElementById('freebet-total-input'),
  freebetAmountInput: document.getElementById('freebet-amount-input'),
  entryTemplate: document.getElementById('entry-template'),
  surebetEntryTemplate: document.getElementById('surebet-entry-template'),
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
  handleFixedSideChange,
  syncFocusedFreebetRow,
  syncFreebetTargetInputState,
  syncFocusedSurebetRow,
  syncSurebetTargetInputState
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
    syncFocusedFreebetRow,
    syncFreebetTargetInputState,
    syncFocusedSurebetRow,
    syncSurebetTargetInputState,
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
  setupBackupActions();
  restoreAutoBackupFileHandle();
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

  if (elements.freebetMainEntries && elements.freebetMainEntries.children.length === 0) {
    addEntryRow('freebetMain');
  }

  if (elements.freebetHedgeEntries && elements.freebetHedgeEntries.children.length === 0) {
    addEntryRow('freebetHedge');
  }

  setupFreebetCalculator();

  runOneTimeTodayEntriesCleanup();

  render();
}

function updateBackupStatus() {
  if (!elements.backupStatus) {
    return;
  }

  const latestBackup = loadAutoBackups()[0];
  const localStatus = latestBackup
    ? `Local: ${formatDate(latestBackup.createdAt)}`
    : 'Local diario ativo';

  if (autoBackupFileStatus === 'active') {
    elements.backupStatus.textContent = `${localStatus} | Arquivo .json ativo`;
    return;
  }

  if (autoBackupFileStatus === 'unsupported') {
    elements.backupStatus.textContent = `${localStatus} | Arquivo .json indisponivel`;
    return;
  }

  if (autoBackupFileStatus === 'error') {
    elements.backupStatus.textContent = `${localStatus} | Arquivo .json com erro`;
    return;
  }

  elements.backupStatus.textContent = `${localStatus} | Arquivo .json inativo`;
}

function supportsAutoBackupFile() {
  return typeof window.showSaveFilePicker === 'function' && typeof window.indexedDB !== 'undefined';
}

function openBackupHandleDb() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(BACKUP_FILE_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(BACKUP_FILE_STORE_NAME)) {
        database.createObjectStore(BACKUP_FILE_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Nao foi possivel abrir o banco do backup.'));
  });
}

async function loadStoredBackupFileHandle() {
  if (!supportsAutoBackupFile()) {
    return null;
  }

  const database = await openBackupHandleDb();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(BACKUP_FILE_STORE_NAME, 'readonly');
    const store = transaction.objectStore(BACKUP_FILE_STORE_NAME);
    const request = store.get(BACKUP_FILE_HANDLE_KEY);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error('Nao foi possivel ler o arquivo de backup.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => database.close();
  });
}

async function saveStoredBackupFileHandle(handle) {
  if (!supportsAutoBackupFile()) {
    return;
  }

  const database = await openBackupHandleDb();

  await new Promise((resolve, reject) => {
    const transaction = database.transaction(BACKUP_FILE_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(BACKUP_FILE_STORE_NAME);
    const request = store.put(handle, BACKUP_FILE_HANDLE_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Nao foi possivel salvar o arquivo de backup.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => database.close();
  });
}

async function getBackupFilePermission(handle, mode = 'readwrite') {
  if (!handle) {
    return false;
  }

  if (await handle.queryPermission({ mode }) === 'granted') {
    return true;
  }

  return (await handle.requestPermission({ mode })) === 'granted';
}

async function hasBackupFilePermission(handle, mode = 'readwrite') {
  if (!handle) {
    return false;
  }

  return (await handle.queryPermission({ mode })) === 'granted';
}

async function writeAutoBackupFile() {
  if (!autoBackupFileHandle) {
    return;
  }

  if (!(await getBackupFilePermission(autoBackupFileHandle))) {
    autoBackupFileStatus = 'error';
    updateBackupStatus();
    return;
  }

  const writable = await autoBackupFileHandle.createWritable();
  await writable.write(JSON.stringify(buildExportPayload(state), null, 2));
  await writable.close();
  autoBackupFileStatus = 'active';
  updateBackupStatus();
}

async function enableAutoBackupFile() {
  if (!supportsAutoBackupFile()) {
    autoBackupFileStatus = 'unsupported';
    updateBackupStatus();
    alert('Seu navegador nao permite salvar automaticamente em arquivo.');
    return;
  }

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: AUTO_BACKUP_FILE_NAME,
      types: [{
        description: 'Arquivo JSON',
        accept: {
          'application/json': ['.json']
        }
      }],
      excludeAcceptAllOption: false
    });

    if (!(await getBackupFilePermission(handle))) {
      throw new Error('Permissao negada para salvar o backup.');
    }

    autoBackupFileHandle = handle;
    autoBackupFileStatus = 'active';
    await saveStoredBackupFileHandle(handle);
    await writeAutoBackupFile();
    alert('Backup automatico em arquivo ativado com sucesso.');
  } catch (error) {
    if (error?.name === 'AbortError') {
      return;
    }

    autoBackupFileStatus = 'error';
    updateBackupStatus();
    alert('Nao foi possivel ativar o backup automatico em arquivo.');
  }
}

async function restoreAutoBackupFileHandle() {
  if (!supportsAutoBackupFile()) {
    autoBackupFileStatus = 'unsupported';
    updateBackupStatus();
    return;
  }

  try {
    const handle = await loadStoredBackupFileHandle();
    if (!handle) {
      autoBackupFileStatus = 'inactive';
      updateBackupStatus();
      return;
    }

    autoBackupFileHandle = handle;
    autoBackupFileStatus = (await hasBackupFilePermission(handle, 'readwrite')) ? 'active' : 'inactive';
    updateBackupStatus();
  } catch {
    autoBackupFileStatus = 'error';
    updateBackupStatus();
  }
}

function scheduleAutoBackupFileWrite() {
  if (!autoBackupFileHandle) {
    return;
  }

  writeAutoBackupFile().catch(() => {
    autoBackupFileStatus = 'error';
    updateBackupStatus();
  });
}

function downloadJsonFile(fileName, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function setupBackupActions() {
  updateBackupStatus();

  elements.enableFileBackupButton?.addEventListener('click', () => {
    enableAutoBackupFile();
  });

  elements.exportBackupButton?.addEventListener('click', () => {
    const timestamp = new Date().toISOString().replace(/[:]/g, '-');
    downloadJsonFile(`betcontrol-backup-${timestamp}.json`, buildExportPayload(state));
    updateBackupStatus();
  });

  elements.importBackupButton?.addEventListener('click', () => {
    elements.importBackupInput?.click();
  });

  elements.importBackupInput?.addEventListener('change', async () => {
    const file = elements.importBackupInput.files?.[0];
    if (!file) {
      return;
    }

    try {
      const rawText = await file.text();
      const payload = JSON.parse(rawText);
      state = importState(payload);
      render();
      updateBackupStatus();
      scheduleAutoBackupFileWrite();
      alert('Backup importado com sucesso.');
    } catch {
      alert('Nao foi possivel importar este backup.');
    } finally {
      elements.importBackupInput.value = '';
    }
  });
}

function saveState() {
  persistState(state);
  updateBackupStatus();
  scheduleAutoBackupFileWrite();
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
  const template = isSurebetSide
    ? elements.surebetEntryTemplate
    : isComputedBetSide
      ? elements.freebetEntryTemplate
      : elements.entryTemplate;
  const fragment = template.content.cloneNode(true);
  const row = fragment.querySelector('.entry-row');
  const removeButton = fragment.querySelector('.remove-entry-button');
  const focusField = fragment.querySelector('.freebet-entry-focus-field');
  const container = side === 'main'
    ? elements.mainEntries
    : side === 'counter'
      ? elements.counterEntries
      : side === 'freebetMain'
        ? elements.freebetMainEntries
        : elements.freebetHedgeEntries;

  if (!container) {
    return;
  }

  if (focusField) {
    focusField.hidden = !(isFreebetSide || isSurebetSide);
  }

  if (isSurebetSide) {
    row.classList.add('surebet-entry-row');
    setupSurebetModeControls(row, side);
  }

  const syncRemoveButtons = () => {
    [...container.querySelectorAll('.entry-row')].forEach((entryRow, index) => {
      const button = entryRow.querySelector('.remove-entry-button');
      if (!button) {
        return;
      }

      const isFirst = index === 0;
      button.hidden = isFirst;
      button.disabled = isFirst;
    });
  };

  setupEntryPrintDraft(row);

  removeButton.addEventListener('click', () => {
    if (container.children.length === 1) {
      alert('Cada lado precisa ter ao menos uma casa.');
      return;
    }

    clearEntryPrintDraft(row);
    row.remove();
    syncRemoveButtons();
    if (isSurebetSide) {
      applySurebetBalancedDefaults();
      syncSurebetTargetInputState?.();
      updateSurebetResults();
      updateSurebetPreview?.({ source: 'entries', changedSide: side });
    } else if (isFreebetSide) {
      applyFreebetBalancedDefaults();
      updateFreebetResults();
    }
  });

  container.appendChild(fragment);
  syncRemoveButtons();

  if (isSurebetSide) {
    applySurebetBalancedDefaults();
    syncSurebetTargetInputState?.();
    updateSurebetResults();
    updateSurebetPreview?.({ source: 'entries', changedSide: side });
  } else if (isFreebetSide) {
    applyFreebetBalancedDefaults();
    updateFreebetResults();
  }
}

function syncSurebetRowMode(row) {
  if (!row) {
    return;
  }

  const isLay = row.dataset.betMode === 'lay';
  const modeButton = row.querySelector('[data-action="toggle-bet-mode"]');
  const commissionInput = row.querySelector('[name="commission"]');
  const stakeLabel = row.querySelector('.surebet-stake-field span');
  const backerField = row.querySelector('.surebet-backer-field');
  const backerStakeInput = row.querySelector('[name="backerStake"]');
  const odd = Number(row.querySelector('[name="odd"]')?.value || 0);
  const amount = Number(row.querySelector('[name="amount"]')?.value || 0);

  row.classList.toggle('is-lay-entry', isLay);
  if (modeButton) {
    modeButton.textContent = isLay ? 'Lay' : 'Back';
  }
  if (commissionInput) {
    commissionInput.disabled = !isLay;
    if (!isLay) {
      commissionInput.value = '0';
    }
  }
  if (stakeLabel) {
    stakeLabel.textContent = isLay ? 'Liability' : 'Stake';
  }
  if (backerField) {
    backerField.hidden = !isLay;
  }
  if (backerStakeInput) {
    backerStakeInput.value = isLay && odd > 1 && amount > 0
      ? Number(amount / (odd - 1)).toFixed(2)
      : '';
  }
}

function setupSurebetModeControls(row, side) {
  syncSurebetRowMode(row);

  const modeButton = row.querySelector('[data-action="toggle-bet-mode"]');
  const oddInput = row.querySelector('[name="odd"]');
  const amountInput = row.querySelector('[name="amount"]');

  modeButton?.addEventListener('click', () => {
    row.dataset.betMode = row.dataset.betMode === 'lay' ? 'back' : 'lay';
    syncSurebetRowMode(row);
    rebalanceSurebetStakesFromOdds();
    updateSurebetResults();
    updateSurebetPreview?.({ source: 'entries', changedSide: side });
  });

  oddInput?.addEventListener('input', () => {
    syncSurebetRowMode(row);
  });

  amountInput?.addEventListener('input', () => {
    syncSurebetRowMode(row);
  });
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
      const description = String(formData.get('description') || '').trim();
      const totalStakeInput = Number(formData.get('surebetTotal'));
      const savedMainEntries = calculation.freebetEntries;
      const savedCounterEntries = calculation.hedgeEntries;
      const mainHouse = savedMainEntries.map((entry) => entry.house).join(' + ');

      surebet = {
        id: crypto.randomUUID(),
        title: description,
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
      alert('Preencha a descricao e as duas casas da surebet.');
      return;
    }

    state.surebets.unshift(surebet);
    const stakeMovement = updateEntriesHistory(-getSurebetBankrollStake(surebet), {
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

    const formData = new FormData(elements.freebetForm);
    const description = String(formData.get('description') || '').trim();
    const freebetHouse = String(formData.get('freebetHouse') || '').trim();
    const freebetAmount = Number(formData.get('freebetAmount'));

    const freebet = {
      id: crypto.randomUUID(),
      title: description,
      freebetHouse,
      freebetAmount,
      trackingOnly: true,
      createdAt: new Date().toISOString()
    };

    if (!freebet.title || !freebet.freebetHouse) {
      alert('Preencha a descricao e o local da freebet.');
      return;
    }

    if (Number.isNaN(freebetAmount) || freebetAmount <= 0) {
      alert('Informe um valor válido para a freebet.');
      return;
    }

    state.freebets.unshift(freebet);
    saveState();
    elements.freebetForm.reset();
    elements.freebetAmountInput.value = String(DEFAULT_FREEBET_TOTAL);
    render();
    switchToTab('freebets');
  });
}

function resetEntries() {
  clearContainerPrintDrafts(elements.mainEntries);
  clearContainerPrintDrafts(elements.counterEntries);
  elements.mainEntries.innerHTML = '';
  elements.counterEntries.innerHTML = '';
  addEntryRow('main');
  addEntryRow('counter');
}

function resetFreebetEntries() {
  if (!elements.freebetMainEntries || !elements.freebetHedgeEntries) {
    return;
  }

  clearContainerPrintDrafts(elements.freebetMainEntries);
  clearContainerPrintDrafts(elements.freebetHedgeEntries);
  elements.freebetMainEntries.innerHTML = '';
  elements.freebetHedgeEntries.innerHTML = '';
  addEntryRow('freebetMain');
  addEntryRow('freebetHedge');
}

function setEntryRowValues(row, entry) {
  row.querySelector('[name="house"]').value = entry.house || '';
  row.querySelector('[name="odd"]').value = Number(entry.odd || 0) > 0 ? Number(entry.odd).toFixed(2) : '';
  row.querySelector('[name="amount"]').value = Number(entry.amount || 0) > 0 ? Number(entry.amount).toFixed(2) : '';
  const commissionInput = row.querySelector('[name="commission"]');
  if (commissionInput) {
    commissionInput.value = Number(entry.commission || 0).toFixed(2);
    row.dataset.betMode = entry.isLay ? 'lay' : 'back';
    syncSurebetRowMode(row);
  }
  const focusInput = row.querySelector('[name="focus"]');
  if (focusInput) {
    focusInput.checked = Boolean(entry.focus);
  }

  const key = row.dataset.printDraftKey;
  if (key) {
    betPrintDrafts[key] = Array.isArray(entry.prints) ? entry.prints.map((item) => ({
      id: item.id || crypto.randomUUID(),
      name: item.name || 'print.png',
      dataUrl: item.dataUrl || ''
    })) : [];
    syncEntryPrintState(row);
  }
}

function loadSurebetForEditing(id) {
  const index = state.surebets.findIndex((item) => item.id === id);
  if (index === -1) {
    return;
  }

  const [surebet] = state.surebets.splice(index, 1);
  state.bankroll = normalizeCurrencyValue(state.bankroll + getSurebetBankrollStake(surebet));
  removeEntryHistoryById(surebet.stakeEntryHistoryId);

  elements.surebetForm.reset();
  clearContainerPrintDrafts(elements.mainEntries);
  clearContainerPrintDrafts(elements.counterEntries);
  elements.mainEntries.innerHTML = '';
  elements.counterEntries.innerHTML = '';

  (surebet.main?.entries || []).forEach(() => addEntryRow('main'));
  (surebet.counter?.entries || []).forEach(() => addEntryRow('counter'));

  [...elements.mainEntries.querySelectorAll('.entry-row')].forEach((row, indexRow) => {
    setEntryRowValues(row, surebet.main.entries[indexRow] || {});
  });
  [...elements.counterEntries.querySelectorAll('.entry-row')].forEach((row, indexRow) => {
    setEntryRowValues(row, surebet.counter.entries[indexRow] || {});
  });

  elements.surebetForm.querySelector('[name="description"]').value = surebet.title || '';
  elements.surebetTotalInput.value = String(surebet.surebetTotal || surebet.totalStake || getSurebetTotalStake(surebet));
  if (elements.fixedTotalInput) {
    elements.fixedTotalInput.value = String(surebet.surebetTotal || surebet.totalStake || getSurebetTotalStake(surebet));
  }

  updateSurebetResults();
  updateSurebetPreview?.({ source: 'controls' });
  saveState();
  render();
  switchToTab('surebet');
}

function loadFreebetForEditing(id) {
  const index = state.freebets.findIndex((item) => item.id === id);
  if (index === -1) {
    return;
  }

  const [freebet] = state.freebets.splice(index, 1);
  state.bankroll = normalizeCurrencyValue(state.bankroll + getFreebetBankrollStake(freebet));
  removeEntryHistoryById(freebet.stakeEntryHistoryId);

  elements.freebetForm.reset();
  elements.freebetForm.querySelector('[name="description"]').value = freebet.title || '';
  const freebetHouseInput = elements.freebetForm.querySelector('[name="freebetHouse"]');
  if (freebetHouseInput) {
    freebetHouseInput.value = freebet.freebetHouse || '';
  }
  elements.freebetAmountInput.value = String(freebet.freebetAmount || '');

  saveState();
  render();
  switchToTab('freebet');
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

function setupEntryPrintDraft(row) {
  const key = crypto.randomUUID();
  row.dataset.printDraftKey = key;
  betPrintDrafts[key] = [];

  const button = row.querySelector('.entry-print-button');
  const input = row.querySelector('.entry-print-input');
  const preview = row.querySelector('.entry-print-preview');
  const houseInput = row.querySelector('[name="house"]');
  const payloadInput = row.querySelector('[name="printsPayload"]');

  if (!button || !input || !preview || !houseInput || !payloadInput) {
    return;
  }

  button.addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const files = [...(input.files || [])];
    if (files.length === 0) {
      return;
    }

    try {
      const nextPrints = await readPrintFiles(files);
      const availableSlots = MAX_PRINTS_PER_ENTRY - betPrintDrafts[key].length;
      if (availableSlots <= 0) {
        alert(`Máximo de ${MAX_PRINTS_PER_ENTRY} prints por casa.`);
      } else {
        betPrintDrafts[key] = [...betPrintDrafts[key], ...nextPrints.slice(0, availableSlots)];
        if (nextPrints.length > availableSlots) {
          alert(`Só os primeiros ${availableSlots} print(s) foram adicionados.`);
        }
      }
      syncEntryPrintState(row);
    } catch (error) {
      alert(error.message || 'Não foi possível carregar os prints.');
    } finally {
      input.value = '';
    }
  });

  row.addEventListener('paste', async (event) => {
    const files = getClipboardImageFiles(event.clipboardData?.items);
    if (files.length === 0) {
      return;
    }

    event.preventDefault();

    try {
      const nextPrints = await readPrintFiles(files);
      const availableSlots = MAX_PRINTS_PER_ENTRY - betPrintDrafts[key].length;
      if (availableSlots <= 0) {
        alert(`Máximo de ${MAX_PRINTS_PER_ENTRY} prints por casa.`);
        return;
      }

      betPrintDrafts[key] = [...betPrintDrafts[key], ...nextPrints.slice(0, availableSlots)];
      if (nextPrints.length > availableSlots) {
        alert(`Só os primeiros ${availableSlots} print(s) colados foram adicionados.`);
      }
      syncEntryPrintState(row);
    } catch (error) {
      alert(error.message || 'Não foi possível colar o print.');
    }
  });

  houseInput.addEventListener('input', () => updateEntryPrintButtonLabel(row));

  preview.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) {
      return;
    }

    if (actionButton.dataset.action === 'remove-print-draft') {
      betPrintDrafts[key] = betPrintDrafts[key].filter((item) => item.id !== actionButton.dataset.id);
      syncEntryPrintState(row);
      return;
    }

    if (actionButton.dataset.action === 'open-print-draft') {
      const printItem = betPrintDrafts[key].find((item) => item.id === actionButton.dataset.id);
      if (printItem?.dataUrl) {
        window.open(printItem.dataUrl, '_blank', 'noopener,noreferrer');
      }
    }
  });

  syncEntryPrintState(row);
}

function readPrintFiles(files) {
  return Promise.all(files.map((file, index) => new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Envie apenas imagens.'));
      return;
    }

    if (file.size > MAX_PRINT_SIZE_BYTES) {
      reject(new Error('Cada print pode ter no máximo 750 KB.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve({
      id: crypto.randomUUID(),
      name: file.name || `print-${index + 1}.png`,
      dataUrl: String(reader.result || '')
    });
    reader.onerror = () => reject(new Error(`Falha ao carregar o print ${file.name}.`));
    reader.readAsDataURL(file);
  })));
}

function clearContainerPrintDrafts(container) {
  [...container.querySelectorAll('.entry-row')].forEach((row) => {
    clearEntryPrintDraft(row);
  });
}

function getClipboardImageFiles(items) {
  if (!items) {
    return [];
  }

  return [...items]
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .filter(Boolean);
}

function syncEntryPrintState(row) {
  const key = row.dataset.printDraftKey;
  const preview = row.querySelector('.entry-print-preview');
  const payloadInput = row.querySelector('[name="printsPayload"]');

  if (!key || !preview || !payloadInput) {
    return;
  }

  payloadInput.value = JSON.stringify((betPrintDrafts[key] || []).map((item) => ({ ...item })));
  updateEntryPrintButtonLabel(row);
  renderEntryPrintPreview(row);
}

function updateEntryPrintButtonLabel(row) {
  const button = row.querySelector('.entry-print-button');
  const houseInput = row.querySelector('[name="house"]');
  const key = row.dataset.printDraftKey;
  if (!button || !houseInput || !key) {
    return;
  }

  const houseName = houseInput.value.trim();
  const printCount = betPrintDrafts[key]?.length || 0;
  if (!houseName) {
    button.textContent = printCount > 0 ? `Prints anexados (${printCount})` : 'Inserir/colar print';
    return;
  }

  button.textContent = printCount > 0 ? `Prints de ${houseName} (${printCount})` : `Inserir print de ${houseName}`;
}

function renderEntryPrintPreview(row) {
  const key = row.dataset.printDraftKey;
  const preview = row.querySelector('.entry-print-preview');
  const houseInput = row.querySelector('[name="house"]');
  const prints = key ? betPrintDrafts[key] || [] : [];
  const houseName = houseInput?.value.trim() || 'Casa sem nome';

  if (!preview) {
    return;
  }

  if (prints.length === 0) {
    preview.className = 'entry-print-preview empty-state compact-stack';
    preview.textContent = 'Nenhum print anexado.';
    return;
  }

  preview.className = 'entry-print-preview';
  preview.innerHTML = prints.map((item, index) => `
    <div class="entry-print-item">
      <button type="button" class="mini-button entry-print-open-button" data-action="open-print-draft" data-id="${item.id}">${escapeHtml(prints.length > 1 ? `${houseName} (${index + 1})` : houseName)}</button>
      <span class="entry-print-file-name">${escapeHtml(item.name)}</span>
      <button type="button" class="danger-button" data-action="remove-print-draft" data-id="${item.id}">Remover</button>
    </div>
  `).join('');
}

function clearEntryPrintDraft(row) {
  const key = row.dataset.printDraftKey;
  if (!key) {
    return;
  }

  delete betPrintDrafts[key];
}

function renderSummary() {
  const summary = buildDashboardSummary(state, new Date(), getBetOutcomeAmount, isSameMonth);
  const openExposure = getOpenExposure(state);
  const net = summary.gains - summary.losses;
  const activeSurebets = state.surebets.length;
  const activeFreebets = state.freebets.length;

  let insight = 'Sem movimentação suficiente para analisar o período.';
  if (net > 0 && openExposure === 0) {
    insight = 'O mês está positivo e sem capital travado em operações abertas.';
  } else if (net > 0) {
    insight = 'O mês está positivo, mas ainda existe exposição aberta em operações pendentes.';
  } else if (net < 0 && openExposure > 0) {
    insight = 'O mês está pressionado e parte da banca segue comprometida em operações abertas.';
  } else if (net < 0) {
    insight = 'O mês está negativo. Vale revisar gastos e eficiência das entradas concluídas.';
  }

  elements.bankrollValue.textContent = formatCurrency(summary.bankroll);
  if (elements.bankrollValueGhost) {
    elements.bankrollValueGhost.textContent = formatCurrency(summary.bankroll);
  }
  elements.gainValue.textContent = formatCurrency(summary.gains);
  elements.lossValue.textContent = formatCurrency(summary.losses);
  elements.dashboardNetValue.textContent = formatSignedCurrency(net);
  elements.dashboardOpenExposure.textContent = formatCurrency(openExposure);
  elements.dashboardActiveSurebets.textContent = String(activeSurebets);
  elements.dashboardActiveFreebets.textContent = String(activeFreebets);
  elements.dashboardInsightText.textContent = insight;
  elements.dashboardNetBadge.textContent = net > 0 ? 'Mês positivo' : net < 0 ? 'Mês pressionado' : 'Mês neutro';
  elements.dashboardNetBadge.className = `dashboard-trend-badge ${net > 0 ? 'positive' : net < 0 ? 'negative' : 'neutral'}`;
}

function renderFreebetOverview() {
  const allFreebets = state.freebets.map((item) => ({ ...item, __fromHistory: false }));
  elements.freebetOverviewCount.textContent = String(allFreebets.length);
  const totalAmount = allFreebets.reduce((sum, item) => sum + Number(item.freebetAmount || 0), 0);
  elements.freebetOverviewTotal.textContent = formatCurrency(totalAmount);

  if (allFreebets.length === 0) {
    elements.freebetOverviewLocations.className = 'stack-list empty-state compact-stack';
    elements.freebetOverviewLocations.textContent = 'Nenhuma freebet cadastrada ainda.';
    return;
  }

  elements.freebetOverviewLocations.className = 'stack-list compact-stack';
  elements.freebetOverviewLocations.innerHTML = allFreebets.map((item) => `
    <article class="freebet-overview-entry ${item.__fromHistory ? 'is-history' : 'is-active'}">
      <div class="freebet-overview-copy">
        <div class="freebet-overview-eyebrow-row">
          <span class="freebet-overview-status">${item.__fromHistory ? 'Historico' : 'Ativa'}</span>
          <span class="freebet-overview-date">${formatDate(item.settledAt || item.createdAt)}</span>
        </div>
        <strong class="freebet-overview-house">${escapeHtml(item.freebetHouse || item.title || 'Sem casa')}</strong>
        <span class="freebet-overview-title">${escapeHtml(item.title || 'Freebet sem descricao')}</span>
      </div>
      <div class="item-actions compact-detail-actions freebet-overview-actions">
        <div class="freebet-overview-amount-block">
          <span class="card-label">Freebet</span>
          <strong>${formatCurrency(item.freebetAmount || 0)}</strong>
        </div>
        <button type="button" class="danger-button" data-action="delete-freebet-overview" data-id="${item.id}" data-from-history="${item.__fromHistory ? 'true' : 'false'}">Remover</button>
      </div>
    </article>
  `).join('');

  bindFreebetOverviewActions();
}

function bindFreebetOverviewActions() {
  elements.freebetOverviewLocations.querySelectorAll('[data-action="delete-freebet-overview"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      deleteFreebet(button.dataset.id, button.dataset.fromHistory === 'true');
    });
  });
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
      <article class="item-card ledger-card entries-history-card">
        <div class="ledger-card-head">
          <div class="ledger-card-title-block">
            <span class="eyebrow">Ledger diário</span>
            <h3>${reason}</h3>
            <div class="ledger-hero-amount">
              <span class="card-label">Impacto</span>
              <strong class="${changeClass}">${formatSignedCurrency(displayChange)}</strong>
            </div>
          </div>
          <div class="item-actions ledger-card-actions">
            <button type="button" class="danger-button" data-action="delete-entry-history" data-id="${item.id}">Remover</button>
          </div>
        </div>
        ${description}
        <div class="ledger-metric-strip">
          <div class="ledger-metric-cell">
            <span class="card-label">Data</span>
            <strong>${formatDate(item.createdAt)}</strong>
          </div>
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
    elements.freebetList.textContent = 'Nenhuma freebet na carteira.';
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
  elements.freebetList.querySelectorAll('[data-action="edit-freebet"]').forEach((button) => {
    button.addEventListener('click', () => loadFreebetForEditing(button.dataset.id));
  });

  elements.freebetList.querySelectorAll('[data-action="delete-freebet"]').forEach((button) => {
    button.addEventListener('click', () => deleteFreebet(button.dataset.id, false));
  });

  elements.freebetList.querySelectorAll('[data-action="finish-freebet"]').forEach((button) => {
    button.addEventListener('click', () => finishFreebet(button.dataset.id));
  });

  elements.freebetHistoryList.querySelectorAll('[data-action="delete-freebet-history"]').forEach((button) => {
    button.addEventListener('click', () => deleteFreebet(button.dataset.id, true));
  });

  bindBetPrintActions(elements.freebetList);
  bindBetPrintActions(elements.freebetHistoryList);
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
    activeBankrollChange: (freebet) => (!freebet.qualificationOutcomeLabel ? getFreebetBankrollStake(freebet) : 0),
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
  elements.surebetList.querySelectorAll('[data-action="edit-surebet"]').forEach((button) => {
    button.addEventListener('click', () => loadSurebetForEditing(button.dataset.id));
  });

  elements.surebetList.querySelectorAll('[data-action="finish-surebet"]').forEach((button) => {
    button.addEventListener('click', () => settleSurebet(button.dataset.id));
  });

  elements.surebetList.querySelectorAll('[data-action="delete-surebet"]').forEach((button) => {
    button.addEventListener('click', () => deleteSurebet(button.dataset.id, false));
  });

  bindBetPrintActions(elements.surebetList);
}

function bindHistoryActions() {
  elements.historyList.querySelectorAll('[data-action="delete-history-surebet"]').forEach((button) => {
    button.addEventListener('click', () => deleteSurebet(button.dataset.id, true));
  });

  elements.historyList.querySelectorAll('[data-action="delete-freebet-history"]').forEach((button) => {
    button.addEventListener('click', () => deleteFreebet(button.dataset.id, true));
  });

  bindBetPrintActions(elements.historyList);
}

function bindBetPrintActions(container) {
  if (!container) {
    return;
  }

  container.querySelectorAll('.bet-print-open-button').forEach((link) => {
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      const dataUrl = link.dataset.url;
      if (!dataUrl) {
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Não foi possível abrir o print. Verifique se o navegador bloqueou a nova aba.');
        return;
      }

      try {
        const objectUrl = await createObjectUrlFromDataUrl(dataUrl);
        printWindow.location.href = objectUrl;
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      } catch {
        printWindow.close();
        alert('Não foi possível abrir o print.');
      }
    });
  });

  container.querySelectorAll('.bet-print-download-button').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const dataUrl = link.dataset.url;
      if (!dataUrl) {
        return;
      }

      const tempLink = document.createElement('a');
      tempLink.href = dataUrl;
      tempLink.download = link.dataset.fileName || 'print.png';
      document.body.appendChild(tempLink);
      tempLink.click();
      tempLink.remove();
    });
  });
}

async function createObjectUrlFromDataUrl(dataUrl) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
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
    activeBankrollChange: (surebet) => getSurebetBankrollStake(surebet),
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
      <article class="item-card expense-card ledger-card ${cardClass}">
        <div class="ledger-card-head">
          <div class="ledger-card-title-block">
            <span class="eyebrow">Fluxo financeiro</span>
            <h3>${typeLabel}</h3>
            <div class="ledger-hero-amount">
              <span class="card-label">Impacto</span>
              <strong>${signedAmount}</strong>
            </div>
          </div>
          <div class="item-actions ledger-card-actions">
            <button type="button" class="secondary-button" data-action="edit-expense" data-id="${item.id}">Editar</button>
            <button type="button" class="danger-button" data-action="delete-expense" data-id="${item.id}">Excluir</button>
          </div>
        </div>
        <p>${escapeHtml(item.description)}</p>
        <div class="ledger-metric-strip">
          <div class="ledger-metric-cell">
            <span class="card-label">Tipo</span>
            <strong>${typeLabel}</strong>
          </div>
          <div class="ledger-metric-cell">
            <span class="card-label">Data</span>
            <strong>${formatDate(item.createdAt)}</strong>
          </div>
          ${item.bankrollBefore != null && item.bankrollAfter != null ? `
            <div class="ledger-metric-cell ledger-metric-cell-wide">
              <span class="card-label">Transição de banca</span>
              <strong>${formatCurrency(item.bankrollBefore)} -> ${formatCurrency(item.bankrollAfter)}</strong>
            </div>
          ` : ''}
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
  const currentMarker = localStorage.getItem(ONE_TIME_TODAY_ENTRIES_CLEAR_KEY)
    || localStorage.getItem(LEGACY_ONE_TIME_TODAY_ENTRIES_CLEAR_KEY);

  if (currentMarker === ONE_TIME_TODAY_ENTRIES_CLEAR_TARGET) {
    return;
  }

  clearTodayEntriesHistory();
  saveState();
  localStorage.setItem(ONE_TIME_TODAY_ENTRIES_CLEAR_KEY, ONE_TIME_TODAY_ENTRIES_CLEAR_TARGET);
  localStorage.removeItem(LEGACY_ONE_TIME_TODAY_ENTRIES_CLEAR_KEY);
}
