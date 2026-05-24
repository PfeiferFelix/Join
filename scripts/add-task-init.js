/**
 * Restore the priority button state in the add-task dialog.
 * @param {Object} dialogData - Previously saved dialog data.
 * @param {string} dialogData.priority - Priority value to activate (e.g. "low", "medium", "high").
 * @returns {void}
 */
function restoreDialogPriority(dialogData) {
    document.querySelectorAll('.priority-buttons__btn').forEach(btn => {
        btn.classList.toggle('priority-buttons__btn--active', btn.dataset.priority === dialogData.priority);
    });
}

/**
 * Restore subtasks data into the add-task dialog and render them if a renderer exists.
 * @param {Object} dialogData - Previously saved dialog data.
 * @param {string} [dialogData.subtasks] - Serialized subtasks value to restore.
 * @returns {void}
 */
function restoreDialogSubtasks(dialogData) {
    const subtasksInput = document.getElementById('add-subtasks-data');
    if (subtasksInput) subtasksInput.value = dialogData.subtasks;
    if (typeof renderAddDialogSubtasks === 'function') {
        renderAddDialogSubtasks(document.getElementById('add-subtasks-list'), subtasksInput);
    }
}

/**
 * Restore basic dialog fields from saved dialog data.
 * @param {Object} dialogData - Previously saved dialog data.
 * @param {string} [dialogData.title]
 * @param {string} [dialogData.description]
 * @param {string} [dialogData.dueDate]
 * @param {string} [dialogData.category]
 * @param {string} [dialogData.priority]
 * @param {string} [dialogData.subtasks]
 * @returns {void}
 */
function restoreDialogFields(dialogData) {
    if (dialogData.title) document.getElementById('title').value = dialogData.title;
    if (dialogData.description) document.getElementById('description').value = dialogData.description;
    if (dialogData.dueDate) document.getElementById('due-date').value = dialogData.dueDate;
    if (dialogData.category) document.getElementById('category').value = dialogData.category;
    if (dialogData.priority) restoreDialogPriority(dialogData);
    if (dialogData.subtasks) restoreDialogSubtasks(dialogData);
}

/**
 * Load saved add-task dialog data from localStorage and restore the dialog.
 * Clears the stored data after restoring.
 * @returns {void}
 */
function restoreDialogData() {
    try {
        const raw = localStorage.getItem('addTaskDialogData');
        if (!raw) return;
        const dialogData = JSON.parse(raw);
        restoreDialogFields(dialogData);
        localStorage.removeItem('addTaskDialogData');
    } catch (e) { /* ignore */ }
}