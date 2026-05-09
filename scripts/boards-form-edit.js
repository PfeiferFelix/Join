// Maps a display category label to its internal key.
function mapCategoryLabelToKey(label) {
    if (label === "Technical Task") return "toDo";
    if (label === "User Story") return "inProgress";
    if (label === "Awaiting Feedback") return "feedback";
    if (label === "Done") return "done";
    return "toDo";
}

// Returns the selected priority from edit-task buttons.
function getSelectedEditPriority(dialog) {
    const urgent = dialog.querySelector("#edit-priority-urgent");
    const medium = dialog.querySelector("#edit-priority-medium");
    const low = dialog.querySelector("#edit-priority-low");
    if (!urgent || !medium || !low) return "Medium";
    if (urgent.classList.contains("priority-buttons__btn--urgent")) return "Urgent";
    if (medium.classList.contains("priority-buttons__btn--medium")) return "Medium";
    if (low.classList.contains("priority-buttons__btn--low")) return "Low";
    return "Medium";
}

// Sets the active edit-task priority button style.
function setEditPriority(priority) {
    const dialog = document.getElementById("editTaskDialog");
    if (!dialog) return;
    const urgent = dialog.querySelector("#edit-priority-urgent");
    const medium = dialog.querySelector("#edit-priority-medium");
    const low = dialog.querySelector("#edit-priority-low");
    if (!urgent || !medium || !low) return;
    urgent.classList.remove("priority-buttons__btn--urgent");
    medium.classList.remove("priority-buttons__btn--medium");
    low.classList.remove("priority-buttons__btn--low");
    if (priority === "Urgent") urgent.classList.add("priority-buttons__btn--urgent");
    else if (priority === "Medium") medium.classList.add("priority-buttons__btn--medium");
    else if (priority === "Low") low.classList.add("priority-buttons__btn--low");
}

// Applies values from the edit dialog to a task object.
function applyEditTaskValues(task, dialog) {
    const updatedCategoryLabel = dialog.querySelector('#edit-category')?.value?.trim();
    const updatedAssignedIds = Array.from(dialog.querySelectorAll('#edit-assigned-to-checkboxes input[type="checkbox"]:checked'))
        .map(cb => Number(cb.value)).filter(id => Number.isFinite(id));
    const updatedSubtasks = getLimitedSubtasks(JSON.parse(dialog.querySelector('#edit-subtasks-data')?.value || '[]'));
    task.title = dialog.querySelector("#edit-title")?.value.trim() || "";
    task.description = dialog.querySelector("#edit-description")?.value.trim() || "";
    task.dueDate = dialog.querySelector("#edit-due-date")?.value || "";
    task.priority = getSelectedEditPriority(dialog);
    task.priorityClass = getPriorityIconClass(task.priority);
    if (updatedCategoryLabel) {
        task.selectedCategoryLabel = updatedCategoryLabel;
        task.category = mapCategoryLabelToKey(updatedCategoryLabel);
    } else {
        task.selectedCategoryLabel = task.selectedCategoryLabel || categoryLabel(task.category || 'toDo');
        task.category = task.category || 'toDo';
    }
    task.assignedTo = contacts.filter(c => updatedAssignedIds.includes(c.id));
    task.subtasks = updatedSubtasks;
    task.subtask = updatedSubtasks[0]?.title || "";
}

// Saves edited task values and refreshes the board.
async function handleEditTaskSave(event) {
    event.preventDefault();
    const dialog = document.getElementById("editTaskDialog");
    const task = todos.find((t) => t.id == Number(dialog.dataset.taskId));
    if (!task) return;
    applyEditTaskValues(task, dialog);
    if (typeof persistTaskUpdateToFirebase === 'function') {
        await persistTaskUpdateToFirebase(task);
    }
    updateHTML();
    closeDialog();
}

// Sets up the edit dialog content and event handlers.
function setupEditTaskDialog(dialog, task) {
    dialog.innerHTML = getEditTaskFormTemplate(buildEditTaskFormTemplateData(task));
    const subtaskList = dialog.querySelector('.subtask-list');
    if (subtaskList) updateNewSubtaskInputVisibility(subtaskList, task.subtasks || []);
    setupAssignedToMultiselect(dialog, {
        triggerId: 'edit-assigned-to-trigger',
        checkboxContainerId: 'edit-assigned-to-checkboxes',
        summaryId: 'edit-assigned-to-summary',
        wrapperId: 'edit-assigned-to-multiselect',
        optionIdPrefix: 'edit-assigned-to',
        selectedAvatarsId: 'edit-assigned-to-selected-avatars',
        preselectedIds: Array.isArray(task.assignedTo) ? task.assignedTo.map(u => u.id) : [],
    });
    const editForm = dialog.querySelector('.edit-task-form');
    if (editForm) editForm.addEventListener("submit", handleEditTaskSave);
}

// Opens the edit dialog for an existing task.
function editTask(taskId) {
    const task = todos.find((t) => t.id == taskId);
    if (!task) return;
    const showDialog = document.getElementById("showTaskDialog");
    if (showDialog?.open) showDialog.close();
    const dialog = document.getElementById("editTaskDialog");
    dialog.dataset.taskId = taskId;
    setupEditTaskDialog(dialog, task);
    if (!dialog.open) dialog.showModal();
}

