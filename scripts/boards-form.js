// Opens the add-task dialog for the given category.
function addTask(category) {
    const dialog = document.getElementById("addTaskDialog");
    dialog.dataset.category = category || "";
    renderDialogContent();
    dialog.showModal();
    document.body.style.overflow = 'hidden';
}

// Opens the add-task dialog preset for To Do.
function addTaskToDo() {
    addTask("toDo");
}

// Opens the add-task dialog preset for In Progress.
function addTaskInProgress() {
    addTask("inProgress");
}

// Opens the add-task dialog preset for Awaiting Feedback.
function addTaskFeedback() {
    addTask("feedback");
}

// Renders and wires the add-task dialog content.
function renderDialogContent() {
    const dialog = document.getElementById("addTaskDialog");
    dialog.innerHTML = getaddTaskTemplateDialog();
    attachAddTaskFormHandlers(dialog);
    setupAssignedToMultiselect(dialog);
    populateCategoryOptions(dialog);
    bindAddTaskPriorityButtons();
}

// Attaches submit and cancel handlers to the add-task form.
function attachAddTaskFormHandlers(dialog) {
    const form = dialog.querySelector(".task-form");
    if (form) form.addEventListener("submit", handleCreateTask);
    const cancelBtn = dialog.querySelector("#cancel-btn");
    if (cancelBtn && form) cancelBtn.addEventListener("click", () => form.reset());
}

// Populates category select options in the add-task dialog.
function populateCategoryOptions(dialog) {
    const categorySelect = dialog.querySelector("#category");
    if (!categorySelect) return;
    categories.forEach((cat) => {
        categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

// Binds click behavior for add-task priority buttons.
function bindAddTaskPriorityButtons() {
    const urgent = document.getElementById("priority-urgent"), medium = document.getElementById("priority-medium"), low = document.getElementById("priority-low");
    if (!urgent || !medium || !low) return;
    urgent.classList.remove("priority-buttons__btn--urgent"); medium.classList.remove("priority-buttons__btn--medium"); low.classList.remove("priority-buttons__btn--low");
    urgent.addEventListener("click", () => { urgent.classList.toggle("priority-buttons__btn--urgent"); medium.classList.remove("priority-buttons__btn--medium"); low.classList.remove("priority-buttons__btn--low"); });
    medium.addEventListener("click", () => { medium.classList.toggle("priority-buttons__btn--medium"); urgent.classList.remove("priority-buttons__btn--urgent"); low.classList.remove("priority-buttons__btn--low"); });
    low.addEventListener("click", () => { low.classList.toggle("priority-buttons__btn--low"); urgent.classList.remove("priority-buttons__btn--urgent"); medium.classList.remove("priority-buttons__btn--medium"); });
}

// Creates a new task from dialog input and updates the board.
function handleCreateTask(event) {
    event.preventDefault();
    const dialog = document.getElementById("addTaskDialog");
    const newTodo = buildNewTodoFromDialog(dialog);
    if (!newTodo) return;
    mergeOrInsertTodo(newTodo);
    updateHTML();
    closeDialog();
}

// Builds a new task object from the add-task dialog fields.
function buildNewTodoFromDialog(dialog) {
    const title = dialog.querySelector("#title")?.value.trim();
    if (!title) return null;
    const categoryValue = dialog.querySelector('#category')?.value || '';
    const subtasks = getLimitedSubtasks(dialog.querySelector('#subtask-input')?.value || '');
    const priority = getSelectedPriority(dialog);
    const assignedTo = getAssignedContactsFromDialog(dialog);
    return {
        id: Date.now(), title, description: dialog.querySelector("#description")?.value.trim() || '', dueDate: dialog.querySelector("#due-date")?.value || '', priority, priorityClass: getPriorityIconClass(priority), assignedTo,
        category: resolveCategoryFromDialog(categoryValue, dialog.dataset.category), selectedCategoryLabel: categoryValue || 'Technical Task', subtasks, subtask: subtasks[0]?.title || ''
    };
}

// Resolves the internal category key from dialog values.
function resolveCategoryFromDialog(categoryValue, presetCategory) {
    if (presetCategory) return presetCategory;
    if (categoryValue === "Technical Task") return "toDo";
    if (categoryValue === "User Story") return "inProgress";
    return "toDo";
}

// Returns selected contacts from the assigned-to checkboxes.
function getAssignedContactsFromDialog(dialog) {
    const selectedIds = Array.from(dialog.querySelectorAll('#assigned-to-checkboxes input[type="checkbox"]:checked')).map(checkbox => Number(checkbox.value)).filter(id => Number.isFinite(id));
    return contacts.filter(contact => selectedIds.includes(contact.id));
}

// Returns the selected priority from add-task buttons.
function getSelectedPriority(dialog) {
    const priorityUrgent = dialog.querySelector("#priority-urgent");
    const priorityMedium = dialog.querySelector("#priority-medium");
    const priorityLow = dialog.querySelector("#priority-low");
    if (!priorityUrgent || !priorityMedium || !priorityLow) return "None";
    if (priorityUrgent.classList.contains("priority-buttons__btn--urgent")) return "⟪";
    if (priorityMedium.classList.contains("priority-buttons__btn--medium")) return "‖";
    if (priorityLow.classList.contains("priority-buttons__btn--low")) return "⟫";
    return "None";
}

// Returns the selected priority from edit-task buttons.
function getSelectedEditPriority(dialog) {
    const priorityUrgent = dialog.querySelector("#edit-priority-urgent");
    const priorityMedium = dialog.querySelector("#edit-priority-medium");
    const priorityLow = dialog.querySelector("#edit-priority-low");
    if (!priorityUrgent || !priorityMedium || !priorityLow) return "Medium";
    if (priorityUrgent.classList.contains("priority-buttons__btn--urgent")) return "Urgent";
    if (priorityMedium.classList.contains("priority-buttons__btn--medium")) return "Medium";
    if (priorityLow.classList.contains("priority-buttons__btn--low")) return "Low";
    return "Medium";
}

// Sets the active edit-task priority button style.
function setEditPriority(priority) {
    const dialog = document.getElementById("editTaskDialog");
    if (!dialog) return;
    const urgentBtn = dialog.querySelector("#edit-priority-urgent");
    const mediumBtn = dialog.querySelector("#edit-priority-medium");
    const lowBtn = dialog.querySelector("#edit-priority-low");
    if (!urgentBtn || !mediumBtn || !lowBtn) return;
    urgentBtn.classList.remove("priority-buttons__btn--urgent");
    mediumBtn.classList.remove("priority-buttons__btn--medium");
    lowBtn.classList.remove("priority-buttons__btn--low");
    if (priority === "Urgent") urgentBtn.classList.add("priority-buttons__btn--urgent");
    else if (priority === "Medium") mediumBtn.classList.add("priority-buttons__btn--medium");
    else if (priority === "Low") lowBtn.classList.add("priority-buttons__btn--low");
}

// Maps a display category label to its internal key.
function mapCategoryLabelToKey(label) {
    if (label === "Technical Task") return "toDo";
    if (label === "User Story") return "inProgress";
    if (label === "Awaiting Feedback") return "feedback";
    if (label === "Done") return "done";
    return "toDo";
}

// Opens the edit dialog for an existing task.
function editTask(taskId) {
    const task = todos.find((t) => t.id == taskId);
    if (!task) return;
    const dialog = document.getElementById("editTaskDialog");
    dialog.dataset.taskId = taskId;
    dialog.innerHTML = getEditTaskFormTemplate(buildEditTaskFormTemplateData(task));
    const subtaskList = dialog.querySelector('.subtask-list');
    if (subtaskList) updateNewSubtaskInputVisibility(subtaskList, task.subtasks || []);
    setupAssignedToMultiselect(dialog, { triggerId: 'edit-assigned-to-trigger', checkboxContainerId: 'edit-assigned-to-checkboxes', summaryId: 'edit-assigned-to-summary', wrapperId: 'edit-assigned-to-multiselect', optionIdPrefix: 'edit-assigned-to', preselectedIds: Array.isArray(task.assignedTo) ? task.assignedTo.map(user => user.id) : [] });
    const editForm = dialog.querySelector('.edit-task-form');
    if (editForm) editForm.addEventListener("submit", handleEditTaskSave);
    if (!dialog.open) dialog.showModal();
}

// Saves edited task values and refreshes the board.
function handleEditTaskSave(event) {
    event.preventDefault();
    const dialog = document.getElementById("editTaskDialog");
    const task = todos.find((t) => t.id == Number(dialog.dataset.taskId));
    if (!task) return;
    applyEditTaskValues(task, dialog);
    updateHTML();
    closeDialog();
}

// Applies values from the edit dialog to a task object.
function applyEditTaskValues(task, dialog) {
    const updatedCategoryLabel = dialog.querySelector('#edit-category')?.value || 'Technical Task';
    const updatedAssignedIds = Array.from(dialog.querySelectorAll('#edit-assigned-to-checkboxes input[type="checkbox"]:checked')).map(checkbox => Number(checkbox.value)).filter(id => Number.isFinite(id));
    const updatedSubtasks = getLimitedSubtasks(JSON.parse(dialog.querySelector('#edit-subtasks-data')?.value || '[]'));
    task.title = dialog.querySelector("#edit-title")?.value.trim() || "";
    task.description = dialog.querySelector("#edit-description")?.value.trim() || "";
    task.dueDate = dialog.querySelector("#edit-due-date")?.value || "";
    task.priority = getSelectedEditPriority(dialog); task.priorityClass = getPriorityIconClass(task.priority);
    task.selectedCategoryLabel = updatedCategoryLabel; task.category = mapCategoryLabelToKey(updatedCategoryLabel);
    task.assignedTo = contacts.filter(contact => updatedAssignedIds.includes(contact.id));
    task.subtasks = updatedSubtasks; task.subtask = updatedSubtasks[0]?.title || "";
}

// Initializes the assigned-to multi-select control.
function setupAssignedToMultiselect(dialog, config = {}) {
    const cfg = getAssignedToConfig(config);
    const trigger = dialog.querySelector(`#${cfg.triggerId}`);
    const checkboxContainer = dialog.querySelector(`#${cfg.checkboxContainerId}`);
    const summary = dialog.querySelector(`#${cfg.summaryId}`);
    if (!trigger || !checkboxContainer || !summary) return;
    renderAssignedToOptions(checkboxContainer, cfg.optionIdPrefix, cfg.preselectedIds);
    checkboxContainer.removeAttribute('hidden');
    bindAssignedToDropdownEvents(dialog, cfg.wrapperId, trigger, checkboxContainer, summary);
    closeAssignedToDropdown(trigger, checkboxContainer);
    setAssignedToSummary(summary, checkboxContainer);
}

// Builds assigned-to control configuration with defaults.
function getAssignedToConfig(config = {}) {
    return { triggerId: 'assigned-to-trigger', checkboxContainerId: 'assigned-to-checkboxes', summaryId: 'assigned-to-summary', wrapperId: 'assigned-to-multiselect', optionIdPrefix: 'assigned-to', preselectedIds: [], ...config };
}

// Renders checkbox options for assignable contacts.
function renderAssignedToOptions(container, optionIdPrefix, preselectedIds) {
    container.innerHTML = contacts.map(contact => `<label for="${optionIdPrefix}-${contact.id}"><input type="checkbox" id="${optionIdPrefix}-${contact.id}" value="${contact.id}" ${preselectedIds.includes(contact.id) ? 'checked' : ''}> ${contact.name}</label>`).join('');
}

// Updates the assigned-to summary text from selected users.
function setAssignedToSummary(summary, container) {
    const selectedNames = Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.parentElement?.textContent?.trim()).filter(Boolean);
    summary.textContent = selectedNames.length > 0 ? selectedNames.join(', ') : 'Select contacts to assign';
}

// Opens the assigned-to dropdown and updates ARIA state.
function openAssignedToDropdown(trigger, container) {
    container.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
}

// Closes the assigned-to dropdown and updates ARIA state.
function closeAssignedToDropdown(trigger, container) {
    container.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
}

// Binds interaction events for the assigned-to dropdown.
function bindAssignedToDropdownEvents(dialog, wrapperId, trigger, container, summary) {
    const toggle = (event) => { if (event) { event.preventDefault(); event.stopPropagation(); } container.classList.contains('is-open') ? closeAssignedToDropdown(trigger, container) : openAssignedToDropdown(trigger, container); };
    trigger.addEventListener('click', toggle);
    trigger.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') toggle(event); });
    container.addEventListener('click', (event) => event.stopPropagation());
    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.addEventListener('change', () => setAssignedToSummary(summary, container)));
    dialog.addEventListener('click', (event) => { const wrapper = dialog.querySelector(`#${wrapperId}`); if (wrapper && !wrapper.contains(event.target)) closeAssignedToDropdown(trigger, container); });
}

