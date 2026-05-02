// Switches a subtask item into inline edit mode.
function editSubtaskItem(taskId, index) {
    const dialog = document.getElementById('editTaskDialog');
    if (!dialog) return;
    closeOpenSubtaskInput(dialog, taskId);
    const item = dialog.querySelector(`[data-subtask-index="${index}"]`);
    if (!item) return;
    const titleSpan = item.querySelector('.subtask-item__title');
    const currentTitle = titleSpan?.textContent.trim() || '';
    titleSpan.outerHTML = `<input type="text" class="task-form__input subtask-item__input" value="${currentTitle}" onkeydown="saveSubtaskItem(event, ${taskId}, ${index})">`;
    const editBtn = item.querySelector('.edit-subtask-btn');
    editBtn.innerHTML = '&#10003;';
    editBtn.setAttribute('onclick', `saveSubtaskItem(null, ${taskId}, ${index})`);
    item.querySelector('.subtask-item__input')?.focus();
}

// Re-renders editable subtask items in the dialog.
function renderEditSubtaskItems(list, subtasks, taskId) {
    list.querySelectorAll('.subtask-item').forEach(item => item.remove());
    const container = list.querySelector('.subtask-container__list');
    if (!container) return;
    const items = subtasks.map((subtask, index) => `<li class="subtask-item" data-subtask-index="${index}"><span class="subtask-item__title">${subtask.title}</span><div class="subtask-item__actions"><button type="button" class="edit-subtask-btn" onclick="editSubtaskItem(${taskId}, ${index})">&#9998;</button><button type="button" class="clear-subtasks-btn" onclick="deleteSubtaskItem(${taskId}, ${index})">&#128465;</button></div></li>`).join('');
    container.insertAdjacentHTML('afterbegin', items);
    updateNewSubtaskInputVisibility(list, subtasks);
}

// Hides the new-subtask input when the limit is reached.
function updateNewSubtaskInputVisibility(list, subtasks = []) {
    const inputWrapper = list?.querySelector('.subtask-input');
    if (!inputWrapper) return;
    inputWrapper.hidden = getLimitedSubtasks(subtasks).length >= 2;
}

// Saves an edited subtask title for a task.
function saveSubtaskItem(event, taskId, index) {
    if (event && event.key !== 'Enter') return;
    if (event) event.preventDefault();
    const task = todos.find(t => t.id == taskId);
    if (!task) return;
    const dialog = document.getElementById('editTaskDialog'), item = (dialog || document).querySelector(`[data-subtask-index="${index}"]`);
    const newTitle = item?.querySelector('.subtask-item__input')?.value.trim();
    if (!newTitle) return;
    const subtasks = getLimitedSubtasks(task.subtasks);
    subtasks[index].title = newTitle; task.subtasks = subtasks;
    const hiddenInput = (dialog || document).querySelector('#edit-subtasks-data'); if (hiddenInput) hiddenInput.value = JSON.stringify(subtasks);
    saveBoardsToLocalStorage();
    const list = (dialog || document).querySelector('.subtask-list'); if (list) renderEditSubtaskItems(list, subtasks, taskId);
}

// Adds a new subtask from the dialog input.
function addNewSubtask(taskId) {
    const dialog = document.getElementById('editTaskDialog');
    if (!dialog) return;
    const input = dialog.querySelector('#new-subtask-input'), hiddenInput = dialog.querySelector('#edit-subtasks-data'), list = dialog.querySelector('.subtask-list');
    if (!input || !hiddenInput || !list) return;
    const title = input.value.trim();
    if (!title) return;
    const currentSubtasks = getLimitedSubtasks(JSON.parse(hiddenInput.value || '[]'));
    if (currentSubtasks.length >= 2) { input.value = ''; return updateNewSubtaskInputVisibility(list, currentSubtasks); }
    const updatedSubtasks = getLimitedSubtasks([...currentSubtasks, { title, done: false }]);
    hiddenInput.value = JSON.stringify(updatedSubtasks); renderEditSubtaskItems(list, updatedSubtasks, taskId); input.value = '';
    const task = todos.find(t => t.id == taskId); if (!task) return;
    task.subtasks = updatedSubtasks; task.subtask = updatedSubtasks[0]?.title || ''; updateHTML();
}

// Deletes a subtask item and updates related previews.
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

// Toggles the completion state of a subtask.
function toggleSubtask(taskId, index) {
    const task = todos.find(t => t.id == taskId);
    if (!task) return;
    const subtasks = getLimitedSubtasks(task.subtasks);
    if (!subtasks[index]) return;
    subtasks[index].done = !subtasks[index].done;
    task.subtasks = subtasks;
    saveBoardsToLocalStorage();
    updateTaskCardSubtaskPreview(taskId, task, subtasks);
    const masterCheckbox = document.getElementById('selectSubtasks');
    if (masterCheckbox) masterCheckbox.checked = subtasks.every(s => s.done);
}

// Clears and focuses the new-subtask input field.
function clearSubtasks(taskId) {
    const dialog = document.getElementById('editTaskDialog');
    const input = dialog?.querySelector('#new-subtask-input');
    if (!input) return;

    input.value = '';
    input.focus();
}

// Handles Enter key to quickly add a new subtask.
function handleNewSubtaskInputKey(event, taskId) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addNewSubtask(taskId);
}

// Closes any open inline subtask input editor.
function closeOpenSubtaskInput(dialog, taskId) {
    const openInput = dialog.querySelector('.subtask-item__input');
    if (!openInput) return;
    const openItem = openInput.closest('.subtask-item');
    if (!openItem) return;
    const openIndex = Number(openItem.dataset.subtaskIndex);
    const task = todos.find(t => t.id == taskId);
    openInput.outerHTML = `<span class="subtask-item__title">${task?.subtasks?.[openIndex]?.title || ''}</span>`;
    const openEditBtn = openItem.querySelector('.edit-subtask-btn');
    if (!openEditBtn) return;
    openEditBtn.innerHTML = '&#9998;';
    openEditBtn.setAttribute('onclick', `editSubtaskItem(${taskId}, ${openIndex})`);
}

