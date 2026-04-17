window.BetControlExpenses = (() => {
  function createExpenseHelpers({
    elements,
    getState,
    saveState,
    render,
    switchToTab,
    updateEntriesHistory,
    removeEntryHistoryById
  }) {
    function getExpenseBankrollDelta(expense) {
      return expense.entryType === 'lucrinho' ? Number(expense.amount || 0) : -Number(expense.amount || 0);
    }

    function updateLinkedExpenseEntryHistory(expense) {
      const state = getState();
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

    function deleteExpense(id) {
      const state = getState();
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
      const state = getState();
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

    function bindExpenseActions() {
      elements.expenseList.querySelectorAll('[data-action="delete-expense"]').forEach((button) => {
        button.addEventListener('click', () => deleteExpense(button.dataset.id));
      });

      elements.expenseList.querySelectorAll('[data-action="edit-expense"]').forEach((button) => {
        button.addEventListener('click', () => editExpense(button.dataset.id));
      });
    }

    function setupExpenseForm() {
      elements.expenseForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const state = getState();
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

        const state = getState();
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

    return {
      bindExpenseActions,
      setupExpenseForm,
      setupExpenseEditForm,
      deleteExpense,
      editExpense,
      getExpenseBankrollDelta,
      updateLinkedExpenseEntryHistory
    };
  }

  return {
    createExpenseHelpers
  };
})();
