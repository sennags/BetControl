window.BetControlBetCards = ((utils, calculations) => {
  const {
    formatCurrency,
    formatDate,
    formatSignedCurrency,
    escapeHtml
  } = utils;

  const {
    getFreebetSelectableEntries,
    getSurebetSelectableEntries,
    getFreebetEntryProfit,
    getFreebetTotalStake,
    getSurebetTotalStake
  } = calculations;

  function buildPrintActions(prints, houseLabel, prefix) {
    if (!Array.isArray(prints) || prints.length === 0) {
      return '';
    }

    return prints.map((item, index) => {
      const fileName = item.name || `${prefix}-${index + 1}.png`;
      const buttonLabel = prints.length > 1
        ? `${houseLabel} (${index + 1})`
        : houseLabel;

      return `
        <div class="bet-print-item">
          <a class="mini-button bet-print-open-button" href="#" data-url="${item.dataUrl}" data-file-name="${escapeHtml(fileName)}" title="Abrir ${escapeHtml(fileName)}">${escapeHtml(buttonLabel)}</a>
          <a class="secondary-button bet-print-download-button" href="#" data-url="${item.dataUrl}" data-file-name="${escapeHtml(fileName)}" download="${escapeHtml(fileName)}">Baixar</a>
        </div>
      `;
    }).join('');
  }

  function buildEntryPrintGroups(groups) {
    const visibleGroups = groups.map((group) => ({
      ...group,
      entries: Array.isArray(group.entries)
        ? group.entries.filter((entry) => Array.isArray(entry.prints) && entry.prints.length > 0)
        : []
    })).filter((group) => group.entries.length > 0);

    if (visibleGroups.length === 0) {
      return '';
    }

    return `
      <div class="bet-print-groups">
        ${visibleGroups.map((group) => `
          <section class="bet-print-group">
            <strong class="bet-print-group-title">${escapeHtml(group.label)}</strong>
            <div class="bet-print-list">
              ${group.entries.map((entry, index) => {
                const houseLabel = entry.house || `${group.fallbackLabel} ${index + 1}`;
                return buildPrintActions(entry.prints, houseLabel, `${group.downloadPrefix}-${index + 1}`);
              }).join('')}
            </div>
          </section>
        `).join('')}
      </div>
    `;
  }

  function buildLegacyPrintGroups(groups) {
    const visibleGroups = groups.filter((group) => Array.isArray(group.prints) && group.prints.length > 0);
    if (visibleGroups.length === 0) {
      return '';
    }

    return `
      <div class="bet-print-groups">
        ${visibleGroups.map((group) => `
          <section class="bet-print-group">
            <strong class="bet-print-group-title">${escapeHtml(group.label)}</strong>
            <div class="bet-print-list">
              ${buildPrintActions(group.prints, group.buttonLabel, group.downloadPrefix)}
            </div>
          </section>
        `).join('')}
      </div>
    `;
  }

  function buildFreebetWinnerRows(item) {
    const totalStake = getFreebetTotalStake(item);

    return getFreebetSelectableEntries(item).map((entry) => `
      <label class="freebet-winner-row">
        <input type="checkbox" data-freebet-winner data-entry-key="${entry.key}">
        <span class="freebet-winner-house">${escapeHtml(entry.house || 'Sem casa')}</span>
        <span class="winner-metric"><span class="winner-metric-label">Odd</span><strong>${Number(entry.odd || 0).toFixed(2)}</strong></span>
        <span class="winner-metric"><span class="winner-metric-label">Stake</span><strong>${formatCurrency(entry.amount)}</strong></span>
        <span class="winner-metric"><span class="winner-metric-label">Profit</span><strong>${formatSignedCurrency(getFreebetEntryProfit(entry, totalStake))}</strong></span>
      </label>
    `).join('');
  }

  function buildFreebetHistoryRows(item) {
    const totalStake = getFreebetTotalStake(item);

    return getFreebetSelectableEntries(item).map((entry) => {
      const isWinner = Array.isArray(item.selectedWinnerKeys) && item.selectedWinnerKeys.includes(entry.key);

      return `
        <div class="freebet-winner-row history-row ${isWinner ? 'winner-row' : ''}">
          <span class="freebet-winner-house">${escapeHtml(entry.house || 'Sem casa')}</span>
          <span class="winner-metric"><span class="winner-metric-label">Odd</span><strong>${Number(entry.odd || 0).toFixed(2)}</strong></span>
          <span class="winner-metric"><span class="winner-metric-label">Stake</span><strong>${formatCurrency(entry.amount)}</strong></span>
          <span class="winner-metric"><span class="winner-metric-label">Profit</span><strong>${formatSignedCurrency(getFreebetEntryProfit(entry, totalStake))}</strong></span>
        </div>
      `;
    }).join('');
  }

  function buildFreebetCard(item, fromHistory = false) {
    const actionButton = fromHistory
      ? `<button type="button" class="danger-button" data-action="delete-freebet-history" data-id="${item.id}">Excluir</button>`
      : `<button type="button" class="success-button" data-action="finish-freebet" data-id="${item.id}">Feito</button><button type="button" class="danger-button" data-action="delete-freebet" data-id="${item.id}">Excluir</button>`;
    const lifecycleChip = fromHistory
      ? `<span class="chip">Finalizada em: ${formatDate(item.settledAt || item.createdAt)}</span>`
      : `<span class="chip">Criada em: ${formatDate(item.createdAt)}</span>`;
    const outcomeChip = fromHistory
      ? `<span class="chip">Ganhadoras: ${escapeHtml(item.settledOutcomeLabel || 'Não informado')}</span><span class="chip">Profit: ${formatSignedCurrency(item.settledResult ?? 0)}</span>`
      : '';

    return `
      <article class="item-card freebet-card" data-freebet-id="${item.id}">
        <div class="item-header">
          <h3>${escapeHtml(item.title)}</h3>
          <div class="item-actions">
            ${actionButton}
          </div>
        </div>
        ${fromHistory ? buildFreebetHistoryRows(item) : buildFreebetWinnerRows(item)}
        ${buildEntryPrintGroups([
          { label: 'Prints da freebet', entries: item.freebetEntries, fallbackLabel: 'Casa da freebet', downloadPrefix: 'freebet' },
          { label: 'Prints do hedge', entries: item.hedgeEntries, fallbackLabel: 'Casa do hedge', downloadPrefix: 'hedge' }
        ]) || buildLegacyPrintGroups([
          { label: 'Prints da freebet', prints: item.prints?.main, buttonLabel: 'Print da freebet', downloadPrefix: 'freebet' },
          { label: 'Prints do hedge', prints: item.prints?.hedge, buttonLabel: 'Print do hedge', downloadPrefix: 'hedge' }
        ])}
        <div class="item-meta">
          ${fromHistory ? '' : `<span class="chip">Freebet a ganhar: ${formatCurrency(item.freebetAmount || 0)}</span>`}
          ${outcomeChip}
          ${lifecycleChip}
        </div>
      </article>
    `;
  }

  function buildSurebetWinnerRows(item) {
    const totalStake = getSurebetTotalStake(item);

    return getSurebetSelectableEntries(item).map((entry) => `
      <label class="freebet-winner-row">
        <input type="checkbox" data-surebet-winner data-entry-key="${entry.key}">
        <span class="freebet-winner-house">${escapeHtml(entry.house || 'Sem casa')}</span>
        <span class="winner-metric"><span class="winner-metric-label">Odd</span><strong>${Number(entry.odd || 0).toFixed(2)}</strong></span>
        <span class="winner-metric"><span class="winner-metric-label">Stake</span><strong>${formatCurrency(entry.amount)}</strong></span>
        <span class="winner-metric"><span class="winner-metric-label">Profit</span><strong>${formatSignedCurrency(getFreebetEntryProfit(entry, totalStake))}</strong></span>
      </label>
    `).join('');
  }

  function buildSurebetHistoryRows(item) {
    const totalStake = getSurebetTotalStake(item);

    return getSurebetSelectableEntries(item).map((entry) => {
      const isWinner = Array.isArray(item.selectedWinnerKeys) && item.selectedWinnerKeys.includes(entry.key);

      return `
        <div class="freebet-winner-row history-row ${isWinner ? 'winner-row' : ''}">
          <span class="freebet-winner-house">${escapeHtml(entry.house || 'Sem casa')}</span>
          <span class="winner-metric"><span class="winner-metric-label">Odd</span><strong>${Number(entry.odd || 0).toFixed(2)}</strong></span>
          <span class="winner-metric"><span class="winner-metric-label">Stake</span><strong>${formatCurrency(entry.amount)}</strong></span>
          <span class="winner-metric"><span class="winner-metric-label">Profit</span><strong>${formatSignedCurrency(getFreebetEntryProfit(entry, totalStake))}</strong></span>
        </div>
      `;
    }).join('');
  }

  function buildSurebetDetails(item, fromHistory = false) {
    const lifecycleChip = fromHistory
      ? `<span class="chip">Finalizada em: ${formatDate(item.settledAt || item.createdAt)}</span>`
      : `<span class="chip">Criada em: ${formatDate(item.createdAt)}</span>`;
    const outcomeChip = fromHistory
      ? `<span class="chip">Ganhadoras: ${escapeHtml(item.settledOutcomeLabel || 'Não informado')}</span><span class="chip">Profit: ${formatSignedCurrency(item.settledResult ?? 0)}</span>`
      : '';

    return `
      ${fromHistory ? buildSurebetHistoryRows(item) : buildSurebetWinnerRows(item)}
      ${buildEntryPrintGroups([
        { label: 'Prints da surebet', entries: item.main?.entries, fallbackLabel: 'Casa da surebet', downloadPrefix: 'surebet' },
        { label: 'Prints das contrárias', entries: item.counter?.entries, fallbackLabel: 'Casa contrária', downloadPrefix: 'contra' }
      ]) || buildLegacyPrintGroups([
        { label: 'Prints da surebet', prints: item.main?.prints, buttonLabel: 'Print da surebet', downloadPrefix: 'surebet' },
        { label: 'Prints das contrárias', prints: item.counter?.prints, buttonLabel: 'Print da contrária', downloadPrefix: 'contra' }
      ])}
      <div class="item-meta">
        ${fromHistory ? '' : `<span class="chip">Profit: ${formatSignedCurrency(item.profit || 0)}</span>`}
        ${outcomeChip}
        ${lifecycleChip}
      </div>
    `;
  }

  function buildSurebetCard(item) {
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
  }

  function buildMainHistoryCard(item) {
    if (item.__betType === 'freebet') {
      return buildFreebetCard(item, true);
    }

    return `
      <article class="item-card">
        <div class="item-header">
          <h3>${escapeHtml(item.title)}</h3>
          <div class="item-actions">
            <button type="button" class="danger-button" data-action="delete-history-surebet" data-id="${item.id}">Excluir</button>
          </div>
        </div>
        <p><strong>Batida em:</strong> ${formatDate(item.settledAt || item.createdAt)}</p>
        ${buildSurebetDetails(item, true)}
      </article>
    `;
  }

  return {
    buildFreebetCard,
    buildSurebetCard,
    buildMainHistoryCard
  };
})(window.BetControlUtils, window.BetControlCalculations);
