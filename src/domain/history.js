window.BetCertezaHistory = ((utils) => {
  const {
    capitalize,
    formatDateInputValue,
    getMonthBounds,
    getMonthKey
  } = utils;

  function getSettledBetHistoryItems(state) {
    return [...state.surebetHistory, ...state.freebetHistory];
  }

  function getEntriesHistoryDisplayAmount(state, entry, getBetOutcomeAmount) {
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

  function filterHistoryByType(items, type) {
    if (type === 'all') {
      return items;
    }

    return items.filter((item) => item.__betType === type);
  }

  function filterHistoryByOutcome(items, outcome, getBetOutcomeAmount) {
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

  function getMainHistoryItems(state) {
    return [
      ...state.surebetHistory.map((item) => ({ ...item, __betType: 'surebet' })),
      ...state.freebetHistory.map((item) => ({ ...item, __betType: 'freebet' }))
    ];
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

  function getMonthOptions(items, dateField) {
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric'
    });
    const options = new Map();
    const currentDate = new Date();
    const currentMonth = getMonthKey(currentDate);

    options.set(currentMonth, capitalize(formatter.format(currentDate)));

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

  function syncHistoryDayFilter(historyDayFilterField, inputElement, monthKey, selectedValue) {
    if (monthKey === 'all') {
      historyDayFilterField.hidden = true;
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

    historyDayFilterField.hidden = false;
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

  function getDashboardSummary(state, currentDate, getBetOutcomeAmount, isSameMonth) {
    const settledBets = getSettledBetHistoryItems(state)
      .filter((item) => isSameMonth(item.settledAt || item.createdAt, currentDate));
    const betResults = settledBets.map((item) => getBetOutcomeAmount(item));
    const gains = betResults
      .filter((amount) => amount > 0)
      .reduce((sum, amount) => sum + amount, 0);
    const betLosses = betResults
      .filter((amount) => amount < 0)
      .reduce((sum, amount) => sum + Math.abs(amount), 0);
    const expenseLosses = state.expenses
      .filter((item) => item.entryType !== 'lucrinho' && isSameMonth(item.createdAt, currentDate))
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      bankroll: Number(state.bankroll) || 0,
      gains,
      losses: expenseLosses + betLosses
    };
  }

  function getMonthlyAnalysisData(state, selectedMonth, getBetOutcomeAmount) {
    const settledHistory = getSettledBetHistoryItems(state);
    const mergedItems = [
      ...settledHistory.map((item) => ({ ...item, __kind: 'history', __date: item.settledAt || item.createdAt })),
      ...state.expenses.map((item) => ({ ...item, __kind: 'expense', __date: item.createdAt }))
    ];
    const monthOptions = getMonthOptions(mergedItems, '__date');
    const nextSelectedMonth = monthOptions.some((option) => option.value === selectedMonth) ? selectedMonth : 'all';
    const filteredHistory = filterItemsByMonth(settledHistory, nextSelectedMonth, 'settledAt');
    const filteredExpenses = filterItemsByMonth(state.expenses, nextSelectedMonth, 'createdAt');
    const betResults = filteredHistory.map((item) => getBetOutcomeAmount(item));
    const profit = betResults.filter((amount) => amount > 0).reduce((sum, amount) => sum + amount, 0);
    const betLosses = betResults.filter((amount) => amount < 0).reduce((sum, amount) => sum + Math.abs(amount), 0);
    const expenses = filteredExpenses
      .filter((item) => item.entryType !== 'lucrinho')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0) + betLosses;
    const sideGains = filteredExpenses
      .filter((item) => item.entryType === 'lucrinho')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const net = profit + sideGains - expenses;

    return {
      monthOptions,
      selectedMonth: nextSelectedMonth,
      filteredHistory,
      filteredExpenses,
      profit,
      expenses,
      sideGains,
      net
    };
  }

  return {
    getSettledBetHistoryItems,
    getEntriesHistoryDisplayAmount,
    filterHistoryByType,
    filterHistoryByOutcome,
    getMainHistoryItems,
    groupHistoryByMonthAndDay,
    getMonthOptions,
    syncMonthFilter,
    syncHistoryDayFilter,
    filterItemsByMonth,
    filterItemsByDay,
    getDashboardSummary,
    getMonthlyAnalysisData
  };
})(window.BetCertezaUtils);
