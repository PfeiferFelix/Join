function restoreDialogPriority(dialogData) {
    document.querySelectorAll('.priority-buttons__btn').forEach(btn => {
        btn.classList.toggle('priority-buttons__btn--active', btn.dataset.priority === dialogData.priority);
    });
}

function restoreDialogSubtasks(dialogData) {
    const subtasksInput = document.getElementById('add-subtasks-data');
    if (subtasksInput) subtasksInput.value = dialogData.subtasks;
    if (typeof renderAddDialogSubtasks === 'function') {
        renderAddDialogSubtasks(document.getElementById('add-subtasks-list'), subtasksInput);
    }
}

function restoreDialogFields(dialogData) {
    if (dialogData.title) document.getElementById('title').value = dialogData.title;
    if (dialogData.description) document.getElementById('description').value = dialogData.description;
    if (dialogData.dueDate) document.getElementById('due-date').value = dialogData.dueDate;
    if (dialogData.category) document.getElementById('category').value = dialogData.category;
    if (dialogData.priority) restoreDialogPriority(dialogData);
    if (dialogData.subtasks) restoreDialogSubtasks(dialogData);
}

function restoreDialogData() {
    try {
        const raw = localStorage.getItem('addTaskDialogData');
        if (!raw) return;
        const dialogData = JSON.parse(raw);
        restoreDialogFields(dialogData);
        localStorage.removeItem('addTaskDialogData');
    } catch (e) { /* ignore */ }
}