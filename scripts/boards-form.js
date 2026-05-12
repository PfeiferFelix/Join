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
    if (form) form.addEventListener('reset', () => {
        clearAddDialogSubtasks(dialog);
        updateCreateTaskButtonState(dialog);
    });
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
    const searchInput = dialog.querySelector(`#${cfg.searchInputId}`);
    const selectedAvatarsContainer = dialog.querySelector(`#${cfg.selectedAvatarsId}`);
    if (!trigger || !checkboxContainer || !summary) return;
    renderAssignedToOptions(checkboxContainer, cfg.optionIdPrefix, cfg.preselectedIds);
    checkboxContainer.removeAttribute('hidden');
    bindAssignedToDropdownEvents(dialog, cfg, trigger, checkboxContainer, summary, selectedAvatarsContainer, searchInput);
    closeAssignedToDropdown(trigger, checkboxContainer);
    setAssignedToSummary(summary, checkboxContainer, selectedAvatarsContainer, cfg, searchInput);
}

// Builds assigned-to control configuration with defaults.
function getAssignedToConfig(config = {}) {
    return {
        triggerId: 'assigned-to-trigger',
        searchInputId: 'assigned-to-search',
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
function setAssignedToSummary(summary, container, selectedAvatarsContainer, cfg = {}, searchInput = null) {
    const selectedCheckboxes = Array.from(container.querySelectorAll('input[type="checkbox"]:checked'));
    const summaryText = selectedCheckboxes.length > 0 ? `${selectedCheckboxes.length} selected` : 'Select users';
    summary.textContent = summaryText;
    if (searchInput) searchInput.placeholder = summaryText;
    if (!selectedAvatarsContainer) return;
    selectedAvatarsContainer.innerHTML = selectedCheckboxes.map((checkbox, index) => {
        const label = checkbox.closest('label');
        const avatar = label?.querySelector('svg');
        const name = label?.querySelector('.multiselect__option-name')?.textContent?.trim() || '';
        const avatarHTML = avatar ? avatar.outerHTML.replace('width="50"', 'width="32"').replace('height="50"', 'height="32"') : '';
        if (!avatarHTML) return '';
        const rowContentHTML = cfg.avatarsOnly ? avatarHTML : `${avatarHTML}<span class="assigned-user-name">${name}</span>`;
        return getAssignedUserRowTemplate(rowContentHTML);
    }).join('');
}

// Filters assigned-to options by typed contact name.
function filterAssignedToOptions(container, query = '') {
    const normalizedQuery = (query || '').trim().toLowerCase();
    container.querySelectorAll('label').forEach(label => {
        const name = label.querySelector('.multiselect__option-name')?.textContent?.trim().toLowerCase() || '';
        label.style.display = !normalizedQuery || name.includes(normalizedQuery) ? 'flex' : 'none';
    });
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

function resetAssignedToSearch(searchInput, container) {
    if (!searchInput) return;
    searchInput.value = '';
    filterAssignedToOptions(container, '');
}

function toggleAssignedToDropdown(event, trigger, container, searchInput) {
    if (event) preventAndStopEvent(event);
    const isOpen = container.classList.contains('is-open');
    if (isOpen) return closeAssignedToDropdown(trigger, container);
    openAssignedToDropdown(trigger, container);
    focusElement(searchInput);
}

function bindAssignedToTriggerEvents(trigger, container, searchInput) {
    trigger.addEventListener('click', (event) => {
        toggleAssignedToDropdown(event, trigger, container, searchInput);
    });
    trigger.addEventListener('keydown', (event) => {
        if (!isEnterOrSpace(event)) return;
        toggleAssignedToDropdown(event, trigger, container, searchInput);
    });
}

function bindAssignedToSearchEvents(searchInput, trigger, container) {
    if (!searchInput) return;
    searchInput.addEventListener('click', stopEventPropagation);
    searchInput.addEventListener('keydown', stopEventPropagation);
    searchInput.addEventListener('focus', (event) => {
        stopEventPropagation(event);
        if (!container.classList.contains('is-open')) openAssignedToDropdown(trigger, container);
    });
    searchInput.addEventListener('input', () => {
        if (!container.classList.contains('is-open')) openAssignedToDropdown(trigger, container);
        filterAssignedToOptions(container, searchInput.value);
    });
}

function bindAssignedToCheckboxEvents(container, summary, selectedAvatarsContainer, cfg, searchInput) {
    container.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
            setAssignedToSummary(summary, container, selectedAvatarsContainer, cfg, searchInput);
        });
    });
}

function bindAssignedToOutsideClick(dialog, cfg, trigger, container, searchInput) {
    dialog.addEventListener('click', (event) => {
        const wrapper = dialog.querySelector(`#${cfg.wrapperId}`);
        if (!wrapper || wrapper.contains(event.target)) return;
        closeAssignedToDropdown(trigger, container);
        resetAssignedToSearch(searchInput, container);
    });
}

// Binds interaction events for the assigned-to dropdown.
function bindAssignedToDropdownEvents(dialog, cfg, trigger, container, summary, selectedAvatarsContainer, searchInput) {
    bindAssignedToTriggerEvents(trigger, container, searchInput);
    bindAssignedToSearchEvents(searchInput, trigger, container);
    container.addEventListener('click', stopEventPropagation);
    bindAssignedToCheckboxEvents(container, summary, selectedAvatarsContainer, cfg, searchInput);
    bindAssignedToOutsideClick(dialog, cfg, trigger, container, searchInput);
}

