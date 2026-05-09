const BOARD_ADD_TASK_PAGE_MAX_WIDTH = 768;

// Returns true when add-task should be handled on dedicated page.
function shouldUseAddTaskPage() {
    return window.innerWidth <= BOARD_ADD_TASK_PAGE_MAX_WIDTH;
}

// Opens add-task page with optional board category context.
function openAddTaskPage(category) {
    const params = new URLSearchParams();
    if (category) params.set('boardCategory', category);
    params.set('returnTo', 'boards.html');
    window.location.href = `add-task.html?${params.toString()}`;
}

// Opens the add-task dialog for the given category.
function addTask(category) {
    if (shouldUseAddTaskPage()) return openAddTaskPage(category || '');
    const dialog = document.getElementById("addTaskDialog");
    dialog.dataset.category = category || "";
    renderDialogContent();
    dialog.showModal();
    document.body.style.overflow = 'hidden';
}

// Opens the add-task dialog preset for the given category key (toDo | inProgress | feedback).
function addTaskByCategory(category) {
    addTask(category);
}

// Renders and wires the add-task dialog content.
function renderDialogContent() {
    const dialog = document.getElementById("addTaskDialog");
    dialog.innerHTML = getaddTaskTemplateDialog();
    attachAddTaskFormHandlers(dialog);
    setupAssignedToMultiselect(dialog, { avatarsOnly: true });
    populateCategoryOptions(dialog);
    setupAddDialogSubtaskInput(dialog);
    bindAddTaskPriorityButtons();
    initCreateTaskButtonState(dialog);
}

// Returns whether all required add-task dialog fields are filled.
function canSubmitAddTaskDialog(dialog) {
    const title = dialog.querySelector('#title')?.value.trim();
    const dueDate = dialog.querySelector('#due-date')?.value.trim();
    const category = dialog.querySelector('#category')?.value.trim();
    return Boolean(title && dueDate && category);
}

// Updates enabled/disabled state of the create-task button.
function updateCreateTaskButtonState(dialog) {
    const createBtn = dialog.querySelector('#create-task-btn');
    if (!createBtn) return;
    createBtn.disabled = !canSubmitAddTaskDialog(dialog);
}

// Binds required field listeners for create-task button state.
function initCreateTaskButtonState(dialog) {
    ['#title', '#due-date', '#category'].forEach((selector) => {
        dialog.querySelector(selector)?.addEventListener('input', () => updateCreateTaskButtonState(dialog));
        dialog.querySelector(selector)?.addEventListener('change', () => updateCreateTaskButtonState(dialog));
    });
    updateCreateTaskButtonState(dialog);
}

// Attaches submit and cancel handlers to the add-task form.
function attachAddTaskFormHandlers(dialog) {
    const form = dialog.querySelector(".task-form");
    if (form) form.addEventListener("submit", handleCreateTask);
    const cancelBtn = dialog.querySelector("#cancel-btn");
    if (cancelBtn && form) cancelBtn.addEventListener("click", () => form.reset());
}

// Extracts the category dropdown open/close logic.
function bindCategoryDropdownEvents(trigger, optionsList, hiddenInput, label) {
    const open = () => { optionsList.hidden = false; trigger.setAttribute('aria-expanded', 'true'); };
    const close = () => { optionsList.hidden = true; trigger.setAttribute('aria-expanded', 'false'); };
    trigger.addEventListener('click', (e) => { e.stopPropagation(); optionsList.hidden ? open() : close(); });
    trigger.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); optionsList.hidden ? open() : close(); } });
    optionsList.querySelectorAll('.category-custom-select__option').forEach(opt => {
        opt.addEventListener('click', () => {
            hiddenInput.value = opt.dataset.value;
            label.textContent = opt.dataset.value;
            hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
            close();
        });
    });
    document.addEventListener('click', (e) => { if (!trigger.closest('#category-wrapper')?.contains(e.target)) close(); });
}

// Populates category select options in the add-task dialog.
function populateCategoryOptions(dialog) {
    const wrapper = dialog.querySelector('#category-wrapper');
    if (!wrapper) return;
    const trigger = wrapper.querySelector('#category-trigger');
    const optionsList = wrapper.querySelector('#category-options');
    const hiddenInput = wrapper.querySelector('#category');
    const label = wrapper.querySelector('#category-label');
    bindCategoryDropdownEvents(trigger, optionsList, hiddenInput, label);
}

// Handles click events on the add-dialog subtask list.
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

// Handles keydown events on the add-dialog subtask list.
function bindSubtaskListKeydownEvents(list, hiddenInput) {
    list.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        const inputField = event.target.closest('.subtask-item__input');
        if (!inputField) return;
        event.preventDefault();
        saveAddDialogSubtaskEdit(list, hiddenInput, Number(inputField.dataset.subtaskIndex), inputField.value);
    });
}

// Handles input and action button events for the subtask input field.
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

// Initializes add-dialog subtask interactions (Enter, buttons, and list rendering).
function setupAddDialogSubtaskInput(dialog) {
    const wrapper = dialog.querySelector('#add-subtask-input-wrapper');
    const input = dialog.querySelector('#subtask-input');
    const addBtn = dialog.querySelector('#add-subtask-confirm');
    const clearBtn = dialog.querySelector('#add-subtask-clear');
    const list = dialog.querySelector('#add-subtasks-list');
    const hiddenInput = dialog.querySelector('#add-subtasks-data');
    if (!wrapper || !input || !addBtn || !clearBtn || !list || !hiddenInput) return;
    const actionsContainer = dialog.querySelector('#add-subtask-actions');
    const updateActions = bindSubtaskInputFieldEvents(input, addBtn, clearBtn, dialog, actionsContainer);
    bindSubtaskListClickEvents(list, hiddenInput);
    bindSubtaskListKeydownEvents(list, hiddenInput);
    renderAddDialogSubtasks(list, hiddenInput);
    updateActions();
}

// Collects and validates the DOM elements needed for add-dialog subtask input.
function getAddDialogSubtaskElements(dialog) {
    const wrapper = dialog.querySelector('#add-subtask-input-wrapper');
    const input = dialog.querySelector('#subtask-input');
    const hiddenInput = dialog.querySelector('#add-subtasks-data');
    const list = dialog.querySelector('#add-subtasks-list');
    if (!wrapper || !input || !hiddenInput || !list) return null;
    return { wrapper, input, hiddenInput, list };
}

// Appends a subtask entry to the hidden data store and re-renders the list.
function appendSubtaskEntry(title, wrapper, input, hiddenInput, list) {
    const subtasks = getLimitedSubtasks(JSON.parse(hiddenInput.value || '[]'));
    if (subtasks.length >= 2) {
        input.value = '';
        return;}
    subtasks.push({ title, done: false });
    hiddenInput.value = JSON.stringify(getLimitedSubtasks(subtasks));
    input.value = '';
    wrapper.classList.remove('subtask-input--active');
    renderAddDialogSubtasks(list, hiddenInput);
    input.focus();
}

// Adds one accepted subtask entry from the current add-dialog input.
function addDialogSubtask(dialog) {
    const elements = getAddDialogSubtaskElements(dialog);
    if (!elements) return;
    const title = elements.input.value.trim();
    if (!title) return;
    appendSubtaskEntry(title, elements.wrapper, elements.input, elements.hiddenInput, elements.list);
}

// Renders accepted subtasks below the add-dialog input field.
function renderAddDialogSubtasks(list, hiddenInput) {
    const subtasks = getLimitedSubtasks(JSON.parse(hiddenInput.value || '[]'));
    list.innerHTML = subtasks.map((subtask, index) =>
        `<li class="subtask-item" data-subtask-index="${index}"><span class="subtask-item__title">${escapeHtmlText(subtask.title)}</span><div class="subtask-item__actions"><button type="button" class="edit-subtask-btn" data-edit-subtask-index="${index}" aria-label="Edit subtask">&#9998;</button><span class="subtask-item__separator" aria-hidden="true"></span><button type="button" class="clear-subtasks-btn" data-remove-subtask-index="${index}" aria-label="Remove subtask">&#128465;</button></div></li>`
    ).join('');
    const wrapper = hiddenInput.closest('dialog, form, .subtask-container')?.querySelector('#add-subtask-input-wrapper')
        ?? hiddenInput.parentElement?.querySelector('#add-subtask-input-wrapper');
    if (wrapper) wrapper.style.display = subtasks.length >= 2 ? 'none' : '';
}

// Switches one accepted add-dialog subtask into inline edit mode.
function startAddDialogSubtaskEdit(list, hiddenInput, index) {
    const subtasks = getLimitedSubtasks(JSON.parse(hiddenInput.value || '[]'));
    if (!Number.isInteger(index) || index < 0 || index >= subtasks.length) return;
    const item = list.querySelector(`[data-subtask-index="${index}"]`);
    if (!item) return;
    const titleNode = item.querySelector('.subtask-item__title');
    if (!titleNode) return;
    titleNode.outerHTML = `<input type="text" class="task-form__input subtask-item__input" data-subtask-index="${index}" value="${escapeHtmlAttribute(subtasks[index].title)}">`;
    const input = item.querySelector('.subtask-item__input');
    if (!input) return;
    input.focus();
    input.select();
    input.addEventListener('blur', () => saveAddDialogSubtaskEdit(list, hiddenInput, index, input.value), { once: true });
}

// Saves an inline edited subtask title in the add dialog.
function saveAddDialogSubtaskEdit(list, hiddenInput, index, nextTitle) {
    const subtasks = getLimitedSubtasks(JSON.parse(hiddenInput.value || '[]'));
    if (!Number.isInteger(index) || index < 0 || index >= subtasks.length) return;
    const cleanedTitle = String(nextTitle || '').trim();
    if (!cleanedTitle) return renderAddDialogSubtasks(list, hiddenInput);
    subtasks[index].title = cleanedTitle;
    hiddenInput.value = JSON.stringify(subtasks);
    renderAddDialogSubtasks(list, hiddenInput);
}

// Accepts one pending subtask text before creating the task.
function acceptPendingAddDialogSubtask(dialog) {
    const input = dialog.querySelector('#subtask-input');
    if (!input || !input.value.trim()) return;
    addDialogSubtask(dialog);
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
    if (!canSubmitAddTaskDialog(dialog)) return;
    const newTodo = buildNewTodoFromDialog(dialog);
    if (!newTodo) return;
    mergeOrInsertTodo(newTodo);
    postTaskToFirebase(newTodo);
    updateHTML();
    const submitBtn = dialog.querySelector('#create-task-btn');
    if (submitBtn) submitBtn.disabled = true;
    if (!showAddTaskSuccess(dialog)) return closeDialog();
    setTimeout(() => closeDialog(), 1200);
}

// Shows centered add-task success info inside the add dialog.
function showAddTaskSuccess(dialog) {
    const success = dialog.querySelector('#add-task-success');
    if (!success) return false;
    success.removeAttribute('hidden');
    success.classList.add('add-task-success--visible');
    return true;
}

// Builds a new task object from the add-task dialog fields.
function buildNewTodoFromDialog(dialog) {
    const title = dialog.querySelector("#title")?.value.trim();
    if (!title) return null;
    const categoryValue = dialog.querySelector('#category')?.value || '';
    acceptPendingAddDialogSubtask(dialog);
    const subtasks = getLimitedSubtasks(JSON.parse(dialog.querySelector('#add-subtasks-data')?.value || '[]'));
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

// Initializes the assigned-to multi-select control.
function setupAssignedToMultiselect(dialog, config = {}) {
    const cfg = getAssignedToConfig(config);
    const trigger = dialog.querySelector(`#${cfg.triggerId}`);
    const checkboxContainer = dialog.querySelector(`#${cfg.checkboxContainerId}`);
    const summary = dialog.querySelector(`#${cfg.summaryId}`);
    const selectedAvatarsContainer = dialog.querySelector(`#${cfg.selectedAvatarsId}`);
    if (!trigger || !checkboxContainer || !summary) return;
    renderAssignedToOptions(checkboxContainer, cfg.optionIdPrefix, cfg.preselectedIds);
    checkboxContainer.removeAttribute('hidden');
    bindAssignedToDropdownEvents(dialog, cfg, trigger, checkboxContainer, summary, selectedAvatarsContainer);
    closeAssignedToDropdown(trigger, checkboxContainer);
    setAssignedToSummary(summary, checkboxContainer, selectedAvatarsContainer, cfg);
}

// Builds assigned-to control configuration with defaults.
function getAssignedToConfig(config = {}) {
    return {
        triggerId: 'assigned-to-trigger',
        checkboxContainerId: 'assigned-to-checkboxes',
        summaryId: 'assigned-to-summary',
        wrapperId: 'assigned-to-multiselect',
        optionIdPrefix: 'assigned-to',
        selectedAvatarsId: 'assigned-to-selected-avatars',
        preselectedIds: [],
        avatarsOnly: false,
        ...config
    };
}

// Renders checkbox options for assignable contacts.
function renderAssignedToOptions(container, optionIdPrefix, preselectedIds) {
    container.innerHTML = contacts.map((contact, index) => {
        const initials = buildInitials(contact.name || '');
        return `<label for="${optionIdPrefix}-${contact.id}">
                    <span class="multiselect__option-main">
                        ${getCircleUserTemplate(initials, getAvatarFillColor(index))}
                        <span class="multiselect__option-name">${contact.name}</span>
                    </span>
                    <input type="checkbox" id="${optionIdPrefix}-${contact.id}" value="${contact.id}" ${preselectedIds.includes(contact.id) ? 'checked' : ''}>
                </label>`;
    }).join('');
}

// Updates the assigned-to summary text from selected users.
function setAssignedToSummary(summary, container, selectedAvatarsContainer, cfg = {}) {
    const selectedCheckboxes = Array.from(container.querySelectorAll('input[type="checkbox"]:checked'));
    summary.textContent = selectedCheckboxes.length > 0 ? 'Selected User' : 'Select contacts to assign';

    if (!selectedAvatarsContainer) return;
    selectedAvatarsContainer.innerHTML = selectedCheckboxes.map((checkbox, index) => {
        const label = checkbox.closest('label');
        const avatar = label?.querySelector('svg');
        const name = label?.querySelector('.multiselect__option-name')?.textContent?.trim() || '';
        const avatarHTML = avatar ? avatar.outerHTML.replace('width="50"', 'width="32"').replace('height="50"', 'height="32"') : '';
        if (!avatarHTML) return '';
        if (cfg.avatarsOnly) return `<div class="assigned-user-row">${avatarHTML}</div>`;
        return `<div class="assigned-user-row">${avatarHTML}<span class="assigned-user-name">${name}</span></div>`;
    }).join('');
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
function bindAssignedToDropdownEvents(dialog, cfg, trigger, container, summary, selectedAvatarsContainer) {
    const toggle = (event) => { if (event) { event.preventDefault(); event.stopPropagation(); } container.classList.contains('is-open') ? closeAssignedToDropdown(trigger, container) : openAssignedToDropdown(trigger, container); };
    trigger.addEventListener('click', toggle);
    trigger.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') toggle(event); });
    container.addEventListener('click', (event) => event.stopPropagation());
    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.addEventListener('change', () => setAssignedToSummary(summary, container, selectedAvatarsContainer, cfg)));
    dialog.addEventListener('click', (event) => { const wrapper = dialog.querySelector(`#${cfg.wrapperId}`); if (wrapper && !wrapper.contains(event.target)) closeAssignedToDropdown(trigger, container); });
}

