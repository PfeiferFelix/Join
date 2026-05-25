/**
 * Clears the subtask hidden input, list and input field inside the add-task dialog.
 * @param {HTMLElement} dialog - The add-task dialog element.
 */
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

/**
 * Binds click handlers on the subtask list to start edit or remove a subtask.
 * @param {HTMLElement} list - The subtask list element.
 * @param {HTMLInputElement} hiddenInput - Hidden input storing the JSON-encoded subtasks.
 */
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

/**
 * Binds keydown handlers on the subtask list to save edits on Enter.
 * @param {HTMLElement} list - The subtask list element.
 * @param {HTMLInputElement} hiddenInput - Hidden input storing the JSON-encoded subtasks.
 */
function bindSubtaskListKeydownEvents(list, hiddenInput) {
    list.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        const inputField = event.target.closest('.subtask-item__input');
        if (!inputField) return;
        event.preventDefault();
        saveAddDialogSubtaskEdit(list, hiddenInput, Number(inputField.dataset.subtaskIndex), inputField.value);
    });
}

/**
 * Binds input, keyboard, add and clear handlers on the subtask input field.
 * @param {HTMLInputElement} input - The subtask text input.
 * @param {HTMLElement} addBtn - The confirm/add subtask button.
 * @param {HTMLElement} clearBtn - The clear subtask input button.
 * @param {HTMLElement} dialog - The surrounding dialog element.
 * @param {HTMLElement} actionsContainer - The container hosting the action buttons.
 * @returns {Function} Function that updates the active state of the action container.
 */
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

/**
 * Resolves the subtask DOM elements inside the add-task dialog.
 * @param {HTMLElement} dialog - The add-task dialog element.
 * @returns {{wrapper: HTMLElement, input: HTMLInputElement, addBtn: HTMLElement, clearBtn: HTMLElement, list: HTMLElement, hiddenInput: HTMLInputElement, actionsContainer: HTMLElement}}
 */
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

/**
 * Wires up all subtask handlers and renders the initial state.
 * @param {object} elements - Result from getAddDialogSubtaskElements.
 * @param {HTMLElement} dialog - The add-task dialog element.
 * @returns {boolean} True if all required elements were present.
 */
function bindAddDialogSubtaskHandlers(elements, dialog) {
    if (!elements.wrapper || !elements.input || !elements.addBtn || !elements.clearBtn || !elements.list || !elements.hiddenInput) return false;
    const updateActions = bindSubtaskInputFieldEvents(elements.input, elements.addBtn, elements.clearBtn, dialog, elements.actionsContainer);
    bindSubtaskListClickEvents(elements.list, elements.hiddenInput);
    bindSubtaskListKeydownEvents(elements.list, elements.hiddenInput);
    renderAddDialogSubtasks(elements.list, elements.hiddenInput);
    updateActions();
    return true;
}

/**
 * Sets up the subtask input within the add-task dialog.
 * @param {HTMLElement} dialog - The add-task dialog element.
 */
function setupAddDialogSubtaskInput(dialog) {
    const elements = getAddDialogSubtaskElements(dialog);
    bindAddDialogSubtaskHandlers(elements, dialog);
}

/**
 * Appends a new subtask entry, enforcing the 10-item limit.
 * @param {string} title - The subtask title.
 * @param {HTMLElement} wrapper - The input wrapper element.
 * @param {HTMLInputElement} input - The subtask text input.
 * @param {HTMLInputElement} hiddenInput - Hidden input storing the JSON-encoded subtasks.
 * @param {HTMLElement} list - The subtask list element.
 */
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

/**
 * Reads the current subtask input and appends it as a new subtask.
 * @param {HTMLElement} dialog - The add-task dialog element.
 */
function addDialogSubtask(dialog) {
    const elements = getAddDialogSubtaskElements(dialog);
    if (!elements) return;
    const title = elements.input.value.trim();
    if (!title) return;
    appendSubtaskEntry(title, elements.wrapper, elements.input, elements.hiddenInput, elements.list);
}

/**
 * Renders all subtask list items from the hidden input value and toggles input visibility.
 * @param {HTMLElement} list - The subtask list element.
 * @param {HTMLInputElement} hiddenInput - Hidden input storing the JSON-encoded subtasks.
 */
function renderAddDialogSubtasks(list, hiddenInput) {
    const subtasks = getLimitedSubtasks(JSON.parse(hiddenInput.value || '[]'));
    list.innerHTML = subtasks.map((subtask, index) =>
        getAddDialogSubtaskItemTemplate(subtask.title, index)
    ).join('');
    const wrapper = hiddenInput.closest('dialog, form, .subtask-container')?.querySelector('#add-subtask-input-wrapper')
        ?? hiddenInput.parentElement?.querySelector('#add-subtask-input-wrapper');
    if (wrapper) wrapper.style.display = subtasks.length >= 10 ? 'none' : '';
}

/**
 * Finds the DOM item and current title for the subtask at a given index.
 * @param {HTMLElement} list - The subtask list element.
 * @param {HTMLInputElement} hiddenInput - Hidden input storing the JSON-encoded subtasks.
 * @param {number} index - Zero-based subtask index.
 * @returns {{item: HTMLElement, title: string}|null}
 */
function findSubtaskItemForEdit(list, hiddenInput, index) {
    const subtasks = getLimitedSubtasks(JSON.parse(hiddenInput.value || '[]'));
    if (!Number.isInteger(index) || index < 0 || index >= subtasks.length) return null;
    const item = list.querySelector(`[data-subtask-index="${index}"]`);
    return item && subtasks.length > index ? { item, title: subtasks[index].title } : null;
}

/**
 * Replaces a subtask title node with an editable input field.
 * @param {HTMLElement} item - The subtask list item.
 * @param {number} index - Zero-based subtask index.
 * @param {string} title - Current subtask title.
 * @returns {HTMLInputElement|null} The created input element or null on failure.
 */
function convertSubtaskTitleToInput(item, index, title) {
    const titleNode = item.querySelector('.subtask-item__title');
    if (!titleNode) return null;
    titleNode.outerHTML = getAddDialogSubtaskEditInputTemplate(title, index);
    return item.querySelector('.subtask-item__input');
}

/**
 * Switches a subtask item into edit mode.
 * @param {HTMLElement} list - The subtask list element.
 * @param {HTMLInputElement} hiddenInput - Hidden input storing the JSON-encoded subtasks.
 * @param {number} index - Zero-based subtask index.
 */
function startAddDialogSubtaskEdit(list, hiddenInput, index) {
    const data = findSubtaskItemForEdit(list, hiddenInput, index);
    if (!data) return;
    const input = convertSubtaskTitleToInput(data.item, index, data.title);
    if (!input) return;
    input.focus();
    input.select();
    input.addEventListener('blur', () => saveAddDialogSubtaskEdit(list, hiddenInput, index, input.value), { once: true });
}

/**
 * Saves an edited subtask title; removes the subtask if the new title is empty.
 * @param {HTMLElement} list - The subtask list element.
 * @param {HTMLInputElement} hiddenInput - Hidden input storing the JSON-encoded subtasks.
 * @param {number} index - Zero-based subtask index.
 * @param {string} nextTitle - The new subtask title.
 */
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

/**
 * Commits any pending text in the subtask input field as a new subtask.
 * @param {HTMLElement} dialog - The add-task dialog element.
 */
function acceptPendingAddDialogSubtask(dialog) {
    const input = dialog.querySelector('#subtask-input');
    if (!input || !input.value.trim()) return;
    addDialogSubtask(dialog);
}
