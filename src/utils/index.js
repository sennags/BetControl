window.BetControlUtils = (() => {
  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value) || 0);
  }

  function normalizeCurrencyValue(value) {
    const rounded = Math.round((Number(value) || 0) * 100) / 100;
    return Math.abs(rounded) <= 0.02 ? 0 : rounded;
  }

  function formatPercent(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value) || 0);
  }

  function formatSignedCurrency(value) {
    const amount = Number(value) || 0;
    const signal = amount > 0 ? '+' : amount < 0 ? '-' : '';
    return `${signal}${formatCurrency(Math.abs(amount))}`;
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  function capitalize(value) {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  }

  function buildBankrollTransitionLabel(item) {
    if (item.bankrollBefore == null || item.bankrollAfter == null) {
      return '';
    }

    return `<p><strong>Antes</strong> ${formatCurrency(item.bankrollBefore)} | <strong>Depois</strong> ${formatCurrency(item.bankrollAfter)}</p>`;
  }

  function buildBankrollTransitionInline(item) {
    if (item.bankrollBefore == null || item.bankrollAfter == null) {
      return '';
    }

    return ` • Antes ${formatCurrency(item.bankrollBefore)} | Depois ${formatCurrency(item.bankrollAfter)}`;
  }

  function formatDateInputValue(value) {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function isSameMonth(value, referenceDate = new Date()) {
    if (!value) {
      return false;
    }

    const date = new Date(value);
    return date.getFullYear() === referenceDate.getFullYear() && date.getMonth() === referenceDate.getMonth();
  }

  function isSameDay(value, referenceDate = new Date()) {
    if (!value) {
      return false;
    }

    const date = new Date(value);
    return date.getFullYear() === referenceDate.getFullYear()
      && date.getMonth() === referenceDate.getMonth()
      && date.getDate() === referenceDate.getDate();
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  function getMonthBounds(monthKey) {
    const [yearText, monthText] = monthKey.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const start = `${yearText}-${monthText}-01`;
    const endDate = new Date(year, month, 0);
    const end = formatDateInputValue(endDate);

    return { start, end };
  }

  function getSelectedMonthLabel(selectElement) {
    const option = selectElement.options[selectElement.selectedIndex];
    return option ? option.text : 'Todos os meses';
  }

  return {
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
  };
})();
