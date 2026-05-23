function clearAddDialogSubtasks(dialog) {
    const hiddenInput = dialog.querySelector('#add-subtasks-data');
    const list = dialog.querySelector('#add-subtasks-list');
    const input = dialog.querySelector('#subtask-input');
    const actions = dialog.querySelector('#add-subtask-actions');
    if (hiddenInput) hiddenInput.value = '[]';
    if (list && hiddenInput) renderAddDialogSubtasks(list, hiddenInput);
    if (input) input.value = '';
    actions?.classList.remove('subtask-item__actions--active');
}

function bindSubtaskListClickEvents(list, hiddenInput) {
    list.addEventListener('click', (event) => {
        const editBtn = event.target.closest('[data-edit-subtask-index]');
        if (editBtn) {
            startAddDialogSubtaskEdit(list, hiddenInput, Number(editBtn.dataset.editSubtaskIndex));
            return;}
        const deleteBtn = event.target.closest('[data-remove-subtask-index]');
        if (!deleteBtn) return;
        const index = Number(deleteBtn.dataset.removeSubtaskIndex);
        const subtasks = getLimitedSubtasks(JSON.parse(hiddenInput.value || '[]'));
        if (!Number.isInteger(index) || index < 0 || index >= subtasks.length) return;
        subtasks.splice(index, 1);
        hiddenInput.value = JSON.stringify(subtasks);
        renderAddDialogSubtasks(list, hiddenInput);});
}

function bindSubtaskListKeydownEvents(list, hiddenInput) {
    list.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        const inputField = event.target.closest('.subtask-item__input');
        if (!inputField) return;
        event.preventDefault();
        saveAddDialogSubtaskEdit(list, hiddenInput, Number(inputField.dataset.subtaskIndex), inputField.value);
    });
}

function bindSubtaskInputFieldEvents(input, addBtn, clearBtn, dialog, actionsContainer) {
    const updateActions = () => actionsContainer?.classList.toggle('subtask-item__actions--active', input.value.trim().length > 0);
    input.addEventListener('input', updateActions);
    input.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        addDialogSubtask(dialog);
    });
    addBtn.addEventListener('click', () => addDialogSubtask(dialog));
    clearBtn.addEventListener('click', () => { input.value = ''; updateActions(); input.focus(); });
    return updateActions;
}

function getAddDialogSubtaskElements(dialog) {
    return {
        wrapper: dialog.querySelector('#add-subtask-input-wrapper'),
        input: dialog.querySelector('#subtask-input'),
        addBtn: dialog.querySelector('#add-subtask-confirm'),
        clearBtn: dialog.querySelector('#add-subtask-clear'),
        list: dialog.querySelector('#add-subtasks-list'),
        hiddenInput: dialog.querySelector('#add-subtasks-data'),
        actionsContainer: dialog.querySelector('#add-subtask-actions'),
    };
}

function bindAddDialogSubtaskHandlers(elements, dialog) {
    if (!elements.wrapper || !elements.input || !elements.addBtn || !elements.clearBtn || !elements.list || !elements.hiddenInput) return false;
    const updateActions = bindSubtaskInputFieldEvents(elements.input, elements.addBtn, elements.clearBtn, dialog, elements.actionsContainer);
    bindSubtaskListClickEvents(elements.list, elements.hiddenInput);
    bindSubtaskListKeydownEvents(elements.list, elements.hiddenInput);
    renderAddDialogSubtasks(elements.list, elements.hiddenInput);
    updateActions();
    return true;
}

function setupAddDialogSubtaskInput(dialog) {
    const elements = getAddDialogSubtaskElements(dialog);
    bindAddDialogSubtaskHandlers(elements, dialog);
}

function appendSubtaskEntry(title, wrapper, input, hiddenInput, list) {
    const subtasks = getLimitedSubtasks(JSON.parse(hiddenInput.value || '[]'));
    if (subtasks.length >= 10) {
        input.value = '';
        return;}
    subtasks.push({ title, done: false });
    hiddenInput.value = JSON.stringify(getLimitedSubtasks(subtasks));
    input.value = '';
    wrapper.classList.remove('subtask-input--active');
    renderAddDialogSubtasks(list, hiddenInput);
    input.focus();
}

function addDialogSubtask(dialog) {
    const elements = getAddDialogSubtaskElements(dialog);
    if (!elements) return;
    const title = elements.input.value.trim();
    if (!title) return;
    appendSubtaskEntry(title, elements.wrapper, elements.input, elements.hiddenInput, elements.list);
}

function renderAddDialogSubtasks(list, hiddenInput) {
    const subtasks = getLimitedSubtasks(JSON.parse(hiddenInput.value || '[]'));
    list.innerHTML = subtasks.map((subtask, index) =>
        getAddDialogSubtaskItemTemplate(subtask.title, index)
    ).join('');
    const wrapper = hiddenInput.closest('dialog, form, .subtask-container')?.querySelector('#add-subtask-input-wrapper')
        ?? hiddenInput.parentElement?.querySelector('#add-subtask-input-wrapper');
    if (wrapper) wrapper.style.display = subtasks.length >= 10 ? 'none' : '';
}

function findSubtaskItemForEdit(list, hiddenInput, index) {
    const subtasks = getLimitedSubtasks(JSON.parse(hiddenInput.value || '[]'));
    if (!Number.isInteger(index) || index < 0 || index >= subtasks.length) return null;
    const item = list.querySelector(`[data-subtask-index="${index}"]`);
    return item && subtasks.length > index ? { item, title: subtasks[index].title } : null;
}

function convertSubtaskTitleToInput(item, index, title) {
    const titleNode = item.querySelector('.subtask-item__title');
    if (!titleNode) return null;
    titleNode.outerHTML = getAddDialogSubtaskEditInputTemplate(title, index);
    return item.querySelector('.subtask-item__input');
}

function startAddDialogSubtaskEdit(list, hiddenInput, index) {
    const data = findSubtaskItemForEdit(list, hiddenInput, index);
    if (!data) return;
    const input = convertSubtaskTitleToInput(data.item, index, data.title);
    if (!input) return;
    input.focus();
    input.select();
    input.addEventListener('blur', () => saveAddDialogSubtaskEdit(list, hiddenInput, index, input.value), { once: true });
}

function saveAddDialogSubtaskEdit(list, hiddenInput, index, nextTitle) {
    const subtasks = getLimitedSubtasks(JSON.parse(hiddenInput.value || '[]'));
    if (!Number.isInteger(index) || index < 0 || index >= subtasks.length) return;
    const cleanedTitle = String(nextTitle || '').trim();
    if (!cleanedTitle) {
        subtasks.splice(index, 1);
        hiddenInput.value = JSON.stringify(subtasks);
        return renderAddDialogSubtasks(list, hiddenInput);
    }
    subtasks[index].title = cleanedTitle;
    hiddenInput.value = JSON.stringify(subtasks);
    renderAddDialogSubtasks(list, hiddenInput);
}

function acceptPendingAddDialogSubtask(dialog) {
    const input = dialog.querySelector('#subtask-input');
    if (!input || !input.value.trim()) return;
    addDialogSubtask(dialog);
}
