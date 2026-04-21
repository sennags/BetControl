window.BetControlBootstrap = (() => {
  function createBootstrapHelpers({
    elements,
    getState,
    getFilters,
    setFilters,
    actions
  }) {
    const {
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
    } = actions;

    function setupRecordFilters() {
      elements.historyMonthFilter.addEventListener('change', () => {
        setFilters({
          selectedHistoryMonth: elements.historyMonthFilter.value,
          selectedHistoryDay: ''
        });
        render();
      });

      elements.historyTypeFilter.addEventListener('change', () => {
        setFilters({
          selectedHistoryType: elements.historyTypeFilter.value
        });
        render();
      });

      elements.historyOutcomeFilter.addEventListener('change', () => {
        setFilters({
          selectedHistoryOutcome: elements.historyOutcomeFilter.value
        });
        render();
      });

      elements.historyDayFilter.addEventListener('change', () => {
        setFilters({
          selectedHistoryDay: elements.historyDayFilter.value
        });
        render();
      });

      elements.expenseMonthFilter.addEventListener('change', () => {
        setFilters({
          selectedExpenseMonth: elements.expenseMonthFilter.value
        });
        render();
      });

      elements.analysisMonthFilter.addEventListener('change', () => {
        setFilters({
          selectedAnalysisMonth: elements.analysisMonthFilter.value
        });
        render();
      });
    }

    function switchToTab(tabId) {
      const targetButton = [...elements.tabButtons].find((button) => button.dataset.tab === tabId);
      if (targetButton) {
        targetButton.click();
      }
    }

    function syncSceneCopy(button) {
      const target = button?.dataset.tab || 'dashboard';
      if (document?.body) {
        document.body.dataset.scene = target;
      }

      if (elements.currentSceneTitle && button?.dataset.sceneTitle) {
        elements.currentSceneTitle.textContent = button.dataset.sceneTitle;
      }

    }

    function setupTabShortcuts() {
      elements.openTabButtons.forEach((button) => {
        button.addEventListener('click', () => switchToTab(button.dataset.openTab));
      });
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

          syncSceneCopy(button);
        });
      });

      const initialButton = [...elements.tabButtons].find((button) => button.classList.contains('active'))
        || elements.tabButtons[0];
      if (initialButton) {
        syncSceneCopy(initialButton);
      }
    }

    function setupBankroll() {
      if (!elements.saveBankrollButton || !elements.bankrollInput) {
        return;
      }

      elements.saveBankrollButton.addEventListener('click', () => {
        const state = getState();
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
          updateSurebetPreview?.({ source: 'entries', changedSide: 'counter' });
        });
      }

      if (elements.addFreebetHedgeEntryButton) {
        elements.addFreebetHedgeEntryButton.addEventListener('click', () => {
          addEntryRow('freebetHedge');
          updateFreebetResults();
        });
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

      applyFreebetBalancedDefaults();
      updateFreebetResults();
    }

    function setupSurebetCalculator() {
      const handleSurebetInput = (changedSide) => (event) => {
        if (event.target?.name === 'odd') {
          rebalanceSurebetStakesFromOdds();
        }

        updateSurebetResults();
        updateSurebetPreview?.({ source: 'entries', changedSide });
      };

      elements.mainEntries.addEventListener('input', handleSurebetInput('main'));
      elements.counterEntries.addEventListener('input', handleSurebetInput('counter'));
      elements.surebetTotalInput.addEventListener('input', () => {
        rebalanceSurebetStakesFromOdds();
        updateSurebetResults();
        updateSurebetPreview?.({ source: 'controls' });
      });
      elements.mainOddInput?.addEventListener('input', () => {
        updateSurebetPreview?.({ source: 'controls' });
      });
      elements.counterOddInput?.addEventListener('input', () => {
        updateSurebetPreview?.({ source: 'controls' });
      });
      elements.mainFixedCheck?.addEventListener('change', () => {
        handleFixedSideChange?.('main');
      });
      elements.counterFixedCheck?.addEventListener('change', () => {
        handleFixedSideChange?.('counter');
      });

      applySurebetBalancedDefaults();
      updateSurebetResults();
      updateSurebetPreview?.({ source: 'controls' });
    }

    return {
      setupRecordFilters,
      setupTabShortcuts,
      setupTabs,
      setupBankroll,
      setupEntryButtons,
      setupFreebetCalculator,
      setupSurebetCalculator,
      switchToTab
    };
  }

  return {
    createBootstrapHelpers
  };
})();
