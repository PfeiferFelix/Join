
/**
 * Adds a new subtask and hides the action buttons in the edit dialog.
 * @param {HTMLElement} btn - The button that triggered the action.
 * @param {number} taskId - The ID of the task to add the subtask to.
 */
function addNewSubtaskAndHideBtns(btn, taskId) {
    addNewSubtask(taskId);
    const dialog = document.getElementById('editTaskDialog');
    const input = btn.closest('.subtask-input').querySelector('input[type="text"]');
    if (input) {
        input.value = '';
        btn.closest('.subtask-input').querySelector('.subtask-item__actions').classList.remove('subtask-item__actions--active');
    }
    if (!dialog) return;
    const hiddenInput = dialog.querySelector('#edit-subtasks-data');
    const countSpan = dialog.querySelector('#edit-subtask-count');
    if (!hiddenInput || !countSpan) return;
    const subtasks = JSON.parse(hiddenInput.value || '[]');
    countSpan.textContent = '+' + subtasks.length;
    countSpan.style.display = subtasks.length === 0 ? 'none' : '';
}
/**
 * Returns the dialog and input element for editing a subtask at a given index.
 * @param {number} index - The subtask index.
 * @returns {{dialog: HTMLElement|null, input: HTMLElement|null}}
 */
function getEditDialogSubtaskInput(index) {
    const dialog = document.getElementById('editTaskDialog');
    if (!dialog) return { dialog: null, input: null };
    const item = dialog.querySelector(`[data-subtask-index="${index}"]`);
    return { dialog, input: item?.querySelector('.subtask-item__input') || null };
}

/**
 * Updates the title of a subtask for a given task.
 * @param {number} taskId - The ID of the task.
 * @param {number} index - The subtask index.
 * @param {string} newTitle - The new title for the subtask.
 * @returns {Array|null} The updated subtasks array or null if not found.
 */
function updateTaskSubtaskTitle(taskId, index, newTitle) {
    const task = todos.find(t => t.id == taskId);
    if (!task) return null;
    const subtasks = getLimitedSubtasks(task.subtasks);
    if (!subtasks[index]) return null;
    subtasks[index].title = newTitle;
    task.subtasks = subtasks;
    return subtasks;
}

/**
 * Synchronizes the edited subtasks with the dialog and updates the UI.
 * @param {HTMLElement} dialog - The edit dialog element.
 * @param {Array} subtasks - The updated subtasks array.
 * @param {number} taskId - The ID of the task.
 */
function syncEditedSubtasksToDialog(dialog, subtasks, taskId) {
    const hiddenInput = dialog.querySelector('#edit-subtasks-data');
    if (hiddenInput) hiddenInput.value = JSON.stringify(subtasks);
    saveBoardsToLocalStorage();
    const list = dialog.querySelector('.subtask-list');
    if (list) renderEditSubtaskItems(list, subtasks, taskId);
}

/**
 * Accepts and saves the edited value of a subtask, then exits edit mode.
 * @param {number} taskId - The ID of the task.
 * @param {number} index - The subtask index.
 */
function acceptSubtaskItem(taskId, index) {
    const { dialog, input } = getEditDialogSubtaskInput(index);
    if (!dialog || !input) return;
    const newTitle = input.value.trim();
    if (!newTitle) return;
    const subtasks = updateTaskSubtaskTitle(taskId, index, newTitle);
    if (!subtasks) return;
    syncEditedSubtasksToDialog(dialog, subtasks, taskId);
}

/**
 * Switches a subtask item into inline edit mode in the dialog.
 * @param {number} taskId - The ID of the task.
 * @param {number} index - The subtask index.
 */
function editSubtaskItem(taskId, index) {
    const dialog = document.getElementById('editTaskDialog');
    if (!dialog) return;
    closeOpenSubtaskInput(dialog, taskId);
    const item = dialog.querySelector(`[data-subtask-index="${index}"]`);
    if (!item) return;
    const titleSpan = item.querySelector('.subtask-item__title');
    const currentTitle = titleSpan?.textContent.trim() || '';
    titleSpan.outerHTML = getSubtaskEditInputTemplate(currentTitle, taskId, index);
    const editBtn = item.querySelector('.edit-subtask-btn');
    editBtn.innerHTML = getSubtaskSaveIconTemplate();
    editBtn.setAttribute('onclick', `saveSubtaskItem(null, ${taskId}, ${index})`);
    const input = item.querySelector('.subtask-item__input');
    if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
    }
}

/**
 * Renders all editable subtask items in the edit dialog.
 * @param {HTMLElement} list - The subtask list container.
 * @param {Array} subtasks - The subtasks array.
 * @param {number} taskId - The ID of the task.
 */
function renderEditSubtaskItems(list, subtasks, taskId) {
    list.querySelectorAll('.subtask-item').forEach(item => item.remove());
    const container = list.querySelector('.subtask-container__list') || list;
    const items = subtasks.map((subtask, index) => getEditableSubtaskItemTemplate(subtask.title, taskId, index)).join('');
    container.insertAdjacentHTML('afterbegin', items);
    updateNewSubtaskInputVisibility(list, subtasks);
}

/**
 * Hides the new-subtask input if the subtask limit is reached.
 * @param {HTMLElement} list - The subtask list container.
 * @param {Array} [subtasks=[]] - The subtasks array.
 */
function updateNewSubtaskInputVisibility(list, subtasks = []) {
    const container = list?.closest('.subtask-container') || list?.parentElement;
    const inputWrapper = container?.querySelector('.subtask-input');
    if (!inputWrapper) return;
    inputWrapper.hidden = getLimitedSubtasks(subtasks).length >= 10;
}

/**
 * Saves an edited subtask title for a task.
 * @param {KeyboardEvent|null} event - The triggering event (Enter key or null).
 * @param {number} taskId - The ID of the task.
 * @param {number} index - The subtask index.
 */
function saveSubtaskItem(event, taskId, index) {
    if (event && event.key !== 'Enter') return;
    if (event) event.preventDefault();
    const task = todos.find(t => t.id == taskId);
    if (!task) return;
    const dialog = document.getElementById('editTaskDialog'), item = (dialog || document).querySelector(`[data-subtask-index="${index}"]`);
    const newTitle = item?.querySelector('.subtask-item__input')?.value.trim();
    if (!newTitle) { deleteSubtaskItem(taskId, index); return; }
    const subtasks = getLimitedSubtasks(task.subtasks);
    subtasks[index].title = newTitle; task.subtasks = subtasks;
    const hiddenInput = (dialog || document).querySelector('#edit-subtasks-data'); if (hiddenInput) hiddenInput.value = JSON.stringify(subtasks);
    saveBoardsToLocalStorage();
    const list = (dialog || document).querySelector('.subtask-list'); if (list) renderEditSubtaskItems(list, subtasks, taskId);
}

/**
 * Adds a new subtask from the dialog input to the task.
 * @param {number} taskId - The ID of the task.
 */
function addNewSubtask(taskId) {
    const dialog = document.getElementById('editTaskDialog');
    if (!dialog) return;
    const input = dialog.querySelector('#new-subtask-input'), hiddenInput = dialog.querySelector('#edit-subtasks-data'), list = dialog.querySelector('.subtask-list');
    if (!input || !hiddenInput || !list) return;
    const title = input.value.trim();
    if (!title) return;
    const currentSubtasks = getLimitedSubtasks(JSON.parse(hiddenInput.value || '[]'));
    if (currentSubtasks.length >= 10) { input.value = ''; return updateNewSubtaskInputVisibility(list, currentSubtasks); }
    const updatedSubtasks = getLimitedSubtasks([...currentSubtasks, { title, done: false }]);
    hiddenInput.value = JSON.stringify(updatedSubtasks); renderEditSubtaskItems(list, updatedSubtasks, taskId); input.value = '';
    const task = todos.find(t => t.id == taskId); if (!task) return;
    task.subtasks = updatedSubtasks; task.subtask = updatedSubtasks[0]?.title || ''; updateHTML();
}

/**
 * Deletes a subtask item from a task and updates previews.
 * @param {number} taskId - The ID of the task.
 * @param {number} index - The subtask index.
 */
function deleteSubtaskItem(taskId, index) {
    const task = todos.find(t => t.id == taskId);
    if (!task) return;
    const dialog = document.getElementById('editTaskDialog');
    const subtasks = getLimitedSubtasks(task.subtasks);
    subtasks.splice(index, 1);
    task.subtasks = subtasks;
    const hiddenInput = (dialog || document).querySelector('#edit-subtasks-data');
    if (hiddenInput) hiddenInput.value = JSON.stringify(subtasks);
    saveBoardsToLocalStorage();
    const list = (dialog || document).querySelector('.subtask-list');
    if (list) renderEditSubtaskItems(list, subtasks, taskId);
    updateTaskCardSubtaskPreview(taskId, task, subtasks, true);
}

/**
 * Synchronizes the visual state of a subtask in the show dialog.
 * @param {number} index - The subtask index.
 * @param {boolean} isDone - Whether the subtask is done.
 */
function syncShowDialogSubtaskState(index, isDone) {
    const showDialog = document.getElementById('showTaskDialog');
    const subtaskItem = showDialog?.querySelector(`.subtask-item-show[data-subtask-index="${index}"]`);
    if (!subtaskItem) return;
    subtaskItem.classList.toggle('subtask-item-show--done', Boolean(isDone));
}

/**
 * Updates the master checkbox state for all subtasks.
 * @param {Array} subtasks - The subtasks array.
 */
function syncSubtasksMasterCheckbox(subtasks) {
    const masterCheckbox = document.getElementById('selectSubtasks');
    if (!masterCheckbox) return;
    masterCheckbox.checked = subtasks.every(s => s.done);
}

/**
 * Toggles the completion state of a subtask for a task.
 * @param {number} taskId - The ID of the task.
 * @param {number} index - The subtask index.
 */
function toggleSubtask(taskId, index) {
    const task = todos.find(t => t.id == taskId);
    if (!task) return;
    const subtasks = getLimitedSubtasks(task.subtasks);
    if (!subtasks[index]) return;
    subtasks[index].done = !subtasks[index].done;
    task.subtasks = subtasks;
    saveBoardsToLocalStorage();
    syncShowDialogSubtaskState(index, subtasks[index].done);
    updateTaskCardSubtaskPreview(taskId, task, subtasks);
    syncSubtasksMasterCheckbox(subtasks);
}

/**
 * Clears and focuses the new-subtask input field in the dialog.
 * @param {number} taskId - The ID of the task.
 */
function clearSubtasks(taskId) {
    const dialog = document.getElementById('editTaskDialog');
    const input = dialog?.querySelector('#new-subtask-input');
    if (!input) return;

    input.value = '';
    input.closest('.subtask-input')?.querySelector('.subtask-item__actions')?.classList.remove('subtask-item__actions--active');
    input.focus();
}

/**
 * Handles the Enter key to quickly add a new subtask.
 * @param {KeyboardEvent} event - The key event.
 * @param {number} taskId - The ID of the task.
 */
function handleNewSubtaskInputKey(event, taskId) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addNewSubtask(taskId);
}

/**
 * Closes any open inline subtask input editor in the dialog.
 * @param {HTMLElement} dialog - The edit dialog element.
 * @param {number} taskId - The ID of the task.
 */
function closeOpenSubtaskInput(dialog, taskId) {
    const openInput = dialog.querySelector('.subtask-item__input');
    if (!openInput) return;
    const openItem = openInput.closest('.subtask-item');
    if (!openItem) return;
    const openIndex = Number(openItem.dataset.subtaskIndex);
    const task = todos.find(t => t.id == taskId);
    openInput.outerHTML = getSubtaskTitleTemplate(task?.subtasks?.[openIndex]?.title || '');
    const openEditBtn = openItem.querySelector('.edit-subtask-btn');
    if (!openEditBtn) return;
    openEditBtn.innerHTML = '&#9998;';
    openEditBtn.setAttribute('onclick', `editSubtaskItem(${taskId}, ${openIndex})`);
}

/**
 * Escapes text for safe HTML text-node rendering.
 * @param {string} value - The text value to escape.
 * @returns {string} The escaped text.
 */
function escapeHtmlText(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Escapes text for safe HTML attribute rendering.
 * @param {string} value - The attribute value to escape.
 * @returns {string} The escaped attribute value.
 */
function escapeHtmlAttribute(value) {
    return escapeHtmlText(value)
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
