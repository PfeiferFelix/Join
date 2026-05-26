const BOARD_ADD_TASK_PAGE_MAX_WIDTH = 768;

/**
 * Returns true when the viewport is small enough that the add-task page
 * should be used instead of the in-board dialog.
 * @returns {boolean}
 */
function shouldUseAddTaskPage() {
    return window.innerWidth <= BOARD_ADD_TASK_PAGE_MAX_WIDTH;
}

/**
 * Navigates the user to the dedicated add-task page, preserving the target category.
 * @param {string} category - Board category that should be preselected.
 */
function openAddTaskPage(category) {
    const params = new URLSearchParams();
    if (category) params.set('boardCategory', category);
    params.set('returnTo', 'boards.html');
    window.location.href = `add-task.html?${params.toString()}`;
}

/**
 * Opens the add-task UI for the given category. Uses the in-board dialog on
 * larger screens and switches to the add-task page on smaller viewports.
 * @param {string} category - Board category for the new task.
 */
function addTask(category) {
    if (shouldUseAddTaskPage()) return openAddTaskPage(category || '');
    const dialog = document.getElementById("addTaskDialog");
    dialog.dataset.category = category || "";
    renderDialogContent();
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    window.addEventListener('resize', () => handleResponsiveDialogSwitch(dialog));
    dialog.addEventListener('close', () => {
        window.removeEventListener('resize', () => handleResponsiveDialogSwitch(dialog));
    }, { once: true });
}

/**
 * Handles switching to the add-task page if viewport is too small while dialog is open.
 * Saves current dialog data to localStorage before switching.
 * @param {HTMLElement} dialog - The add-task dialog element.
 */
function handleResponsiveDialogSwitch(dialog) {
    if (!dialog.open) return;
    if (shouldUseAddTaskPage()) {
        const title = dialog.querySelector('#title')?.value || '';
        const description = dialog.querySelector('#description')?.value || '';
        const dueDate = dialog.querySelector('#due-date')?.value || '';
        const categoryVal = dialog.querySelector('#category')?.value || '';
        const priorityBtn = dialog.querySelector('.priority-buttons__btn--active');
        const priority = priorityBtn ? priorityBtn.dataset.priority : '';
        const subtasks = dialog.querySelector('#add-subtasks-data')?.value || '';
        const assignedTo = Array.from(dialog.querySelectorAll('.assigned-contact.selected')).map(el => el.dataset.name);
        localStorage.setItem('addTaskDialogData', JSON.stringify({ title, description, dueDate, category: categoryVal, priority, subtasks, assignedTo }));
        openAddTaskPage(categoryVal);
        dialog.close();
    }
}

/**
 * Convenience wrapper that opens the add-task UI for a specific category.
 * @param {string} category - Board category for the new task.
 */
function addTaskByCategory(category) {
    addTask(category);
}

/**
 * Renders the add-task dialog content and wires up all dialog handlers.
 */
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

/**
 * Determines whether the add-task dialog has all required fields filled in.
 * @param {HTMLElement} dialog - The add-task dialog element.
 * @returns {boolean}
 */
function canSubmitAddTaskDialog(dialog) {
    const title = dialog.querySelector('#title')?.value.trim();
    const dueDate = dialog.querySelector('#due-date')?.value.trim();
    const category = dialog.querySelector('#category')?.value.trim();
    return Boolean(title && dueDate && category);
}

/**
 * Enables or disables the Create-Task button based on form completeness.
 * @param {HTMLElement} dialog - The add-task dialog element.
 */
function updateCreateTaskButtonState(dialog) {
    const createBtn = dialog.querySelector('#create-task-btn');
    if (!createBtn) return;
    createBtn.disabled = !canSubmitAddTaskDialog(dialog);
}

/**
 * Initializes the Create-Task button state and binds field listeners that update it.
 * @param {HTMLElement} dialog - The add-task dialog element.
 */
function initCreateTaskButtonState(dialog) {
    ['#title', '#due-date', '#category'].forEach((selector) => {
        dialog.querySelector(selector)?.addEventListener('input', () => updateCreateTaskButtonState(dialog));
        dialog.querySelector(selector)?.addEventListener('change', () => updateCreateTaskButtonState(dialog));
    });
    updateCreateTaskButtonState(dialog);
}

/**
 * Attaches submit and cancel handlers on the add-task form inside the dialog.
 * @param {HTMLElement} dialog - The add-task dialog element.
 */
function attachAddTaskFormHandlers(dialog) {
    const form = dialog.querySelector(".task-form");
    if (form) form.addEventListener("submit", handleCreateTask);
    const cancelBtn = dialog.querySelector("#cancel-btn") || dialog.querySelector(".task-form__btn--clear");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", (event) => {
            event.preventDefault();
            closeDialog();
        });
    }
}

/**
 * Binds open/close and selection handlers for the category dropdown.
 * @param {HTMLElement} trigger - The dropdown trigger element.
 * @param {HTMLElement} optionsList - The dropdown options container.
 * @param {HTMLInputElement} hiddenInput - Hidden input that stores the selected value.
 * @param {HTMLElement} label - Element displaying the current selection label.
 */
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

/**
 * Initializes the category dropdown wiring inside the add-task dialog.
 * @param {HTMLElement} dialog - The add-task dialog element.
 */
function populateCategoryOptions(dialog) {
    const wrapper = dialog.querySelector('#category-wrapper');
    if (!wrapper) return;
    const trigger = wrapper.querySelector('#category-trigger');
    const optionsList = wrapper.querySelector('#category-options');
    const hiddenInput = wrapper.querySelector('#category');
    const label = wrapper.querySelector('#category-label');
    bindCategoryDropdownEvents(trigger, optionsList, hiddenInput, label);
}



/**
 * Binds toggling behavior for the urgent/medium/low priority buttons.
 */
function bindAddTaskPriorityButtons() {
    const urgent = document.getElementById("priority-urgent"), medium = document.getElementById("priority-medium"), low = document.getElementById("priority-low");
    if (!urgent || !medium || !low) return;
    urgent.classList.remove("priority-buttons__btn--urgent"); medium.classList.remove("priority-buttons__btn--medium"); low.classList.remove("priority-buttons__btn--low");
    urgent.addEventListener("click", () => { urgent.classList.toggle("priority-buttons__btn--urgent"); medium.classList.remove("priority-buttons__btn--medium"); low.classList.remove("priority-buttons__btn--low"); });
    medium.addEventListener("click", () => { medium.classList.toggle("priority-buttons__btn--medium"); urgent.classList.remove("priority-buttons__btn--urgent"); low.classList.remove("priority-buttons__btn--low"); });
    low.addEventListener("click", () => { low.classList.toggle("priority-buttons__btn--low"); urgent.classList.remove("priority-buttons__btn--urgent"); medium.classList.remove("priority-buttons__btn--medium"); });
}

/**
 * Submit handler for the add-task dialog form: validates, persists and closes.
 * @param {Event} event - The form submit event.
 */
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

/**
 * Reveals the add-task success message inside the dialog.
 * @param {HTMLElement} dialog - The add-task dialog element.
 * @returns {boolean} True if the success element was found and shown.
 */
function showAddTaskSuccess(dialog) {
    const success = dialog.querySelector('#add-task-success');
    if (!success) return false;
    success.removeAttribute('hidden');
    success.classList.add('add-task-success--visible');
    return true;
}

/**
 * Reads the dialog fields and constructs a new todo object ready for persistence.
 * @param {HTMLElement} dialog - The add-task dialog element.
 * @returns {object|null} The new todo object, or null when required fields are missing.
 */
function buildNewTodoFromDialog(dialog) {
    const title = dialog.querySelector("#title")?.value.trim();
    if (!title) return null;
    const categoryValue = dialog.querySelector('#category')?.value || '';
    acceptPendingAddDialogSubtask(dialog);
    const subtasks = getLimitedSubtasks(JSON.parse(dialog.querySelector('#add-subtasks-data')?.value || '[]'));
    const priority = getSelectedPriority(dialog);
    const assignedTo = getAssignedContactsFromDialog(dialog);
    return {
        id: Date.now(), title, description: dialog.querySelector("#description")?.value.trim() || '', dueDate: dialog.querySelector("#due-date")?.value || '', priority, assignedTo,
        category: resolveCategoryFromDialog(categoryValue, dialog.dataset.category), selectedCategoryLabel: categoryValue || 'Technical Task', subtasks, subtask: subtasks[0]?.title || ''
    };
}

/**
 * Resolves the internal board category for a new task.
 * @param {string} categoryValue - Category label chosen in the dialog.
 * @param {string} presetCategory - Category preset by the calling context.
 * @returns {string} Internal board category key.
 */
function resolveCategoryFromDialog(categoryValue, presetCategory) {
    if (presetCategory) return presetCategory;
    if (categoryValue === "Technical Task") return "toDo";
    if (categoryValue === "User Story") return "inProgress";
    return "toDo";
}

/**
 * Returns the contacts currently selected in the assigned-to multiselect.
 * @param {HTMLElement} dialog - The add-task dialog element.
 * @returns {object[]} Array of selected contact objects.
 */
function getAssignedContactsFromDialog(dialog) {
    const selectedIds = Array.from(dialog.querySelectorAll('#assigned-to-checkboxes input[type="checkbox"]:checked')).map(checkbox => Number(checkbox.value)).filter(id => Number.isFinite(id));
    return contacts.filter(contact => selectedIds.includes(contact.id));
}

/**
 * Returns the selected priority label from the dialog priority buttons.
 * @param {HTMLElement} dialog - The add-task dialog element.
 * @returns {'Urgent'|'Medium'|'Low'}
 */
function getSelectedPriority(dialog) {
    const priorityUrgent = dialog.querySelector("#priority-urgent");
    const priorityMedium = dialog.querySelector("#priority-medium");
    const priorityLow = dialog.querySelector("#priority-low");
    if (!priorityUrgent || !priorityMedium || !priorityLow) return "Medium";
    if (priorityUrgent.classList.contains("priority-buttons__btn--urgent")) return "Urgent";
    if (priorityMedium.classList.contains("priority-buttons__btn--medium")) return "Medium";
    if (priorityLow.classList.contains("priority-buttons__btn--low")) return "Low";
    return "Medium";
}

/**
 * Initializes the assigned-to multiselect dropdown inside the dialog.
 * @param {HTMLElement} dialog - The dialog hosting the multiselect.
 * @param {object} [config] - Optional config overrides; see getAssignedToConfig.
 */
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

/**
 * Merges user-provided config with default assigned-to multiselect IDs and options.
 * @param {object} [config] - Caller overrides.
 * @returns {object} Resolved assigned-to config.
 */
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

/**
 * Renders the assigned-to checkbox options into the container.
 * @param {HTMLElement} container - Container element for the options.
 * @param {string} optionIdPrefix - ID prefix used for the rendered options.
 * @param {number[]} preselectedIds - Contact IDs that should be checked by default.
 */
function renderAssignedToOptions(container, optionIdPrefix, preselectedIds) {
    container.innerHTML = contacts.map((contact, index) => {
        const initials = buildInitials(contact.name || '');
        return getAssignedToOptionTemplate(contact, optionIdPrefix, preselectedIds, initials, getAvatarFillColor(index));
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

/**
 * Resets the assigned-to search field and shows all options.
 * @param {HTMLInputElement|null} searchInput - The search input element, if any.
 * @param {HTMLElement} container - The options container.
 */
function resetAssignedToSearch(searchInput, container) {
    if (!searchInput) return;
    searchInput.value = '';
    filterAssignedToOptions(container, '');
}

/**
 * Toggles the assigned-to dropdown open or closed.
 * @param {Event|null} event - The triggering event.
 * @param {HTMLElement} trigger - The dropdown trigger element.
 * @param {HTMLElement} container - The dropdown options container.
 * @param {HTMLInputElement|null} searchInput - The search input to focus when opening.
 */
function toggleAssignedToDropdown(event, trigger, container, searchInput) {
    if (event) preventAndStopEvent(event);
    const isOpen = container.classList.contains('is-open');
    if (isOpen) return closeAssignedToDropdown(trigger, container);
    openAssignedToDropdown(trigger, container);
    focusElement(searchInput);
}

/**
 * Binds click and keyboard handlers on the assigned-to dropdown trigger.
 * @param {HTMLElement} trigger - The dropdown trigger element.
 * @param {HTMLElement} container - The dropdown options container.
 * @param {HTMLInputElement|null} searchInput - The search input to focus when opening.
 */
function bindAssignedToTriggerEvents(trigger, container, searchInput) {
    trigger.addEventListener('click', (event) => {
        toggleAssignedToDropdown(event, trigger, container, searchInput);
    });
    trigger.addEventListener('keydown', (event) => {
        if (!isEnterOrSpace(event)) return;
        toggleAssignedToDropdown(event, trigger, container, searchInput);
    });
}

/**
 * Binds search/filter and propagation handlers on the assigned-to search input.
 * @param {HTMLInputElement|null} searchInput - The search input element.
 * @param {HTMLElement} trigger - The dropdown trigger element.
 * @param {HTMLElement} container - The dropdown options container.
 */
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

/**
 * Updates the assigned-to summary whenever a checkbox is toggled.
 * @param {HTMLElement} container - The dropdown options container.
 * @param {HTMLElement} summary - The summary element to update.
 * @param {HTMLElement|null} selectedAvatarsContainer - Container rendering selected avatars.
 * @param {object} cfg - Resolved assigned-to config.
 * @param {HTMLInputElement|null} searchInput - The optional search input.
 */
function bindAssignedToCheckboxEvents(container, summary, selectedAvatarsContainer, cfg, searchInput) {
    container.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
            setAssignedToSummary(summary, container, selectedAvatarsContainer, cfg, searchInput);
        });
    });
}

/**
 * Closes the assigned-to dropdown when the user clicks outside of it.
 * @param {HTMLElement} dialog - The dialog hosting the multiselect.
 * @param {object} cfg - Resolved assigned-to config.
 * @param {HTMLElement} trigger - The dropdown trigger element.
 * @param {HTMLElement} container - The dropdown options container.
 * @param {HTMLInputElement|null} searchInput - The optional search input.
 */
function bindAssignedToOutsideClick(dialog, cfg, trigger, container, searchInput) {
    dialog.addEventListener('click', (event) => {
        const wrapper = dialog.querySelector(`#${cfg.wrapperId}`);
        if (!wrapper || wrapper.contains(event.target)) return;
        closeAssignedToDropdown(trigger, container);
        resetAssignedToSearch(searchInput, container);
    });
}

/**
 * 
 * @param {HTMLElement} dialog 
 * @param {object} cfg 
 * @param {HTMLElement} trigger 
 * @param {HTMLElement} container 
 * @param {HTMLElement} summary 
 * @param {HTMLElement|null} selectedAvatarsContainer 
 * @param {*} searchInput 
 */
function bindAssignedToDropdownEvents(dialog, cfg, trigger, container, summary, selectedAvatarsContainer, searchInput) {
    bindAssignedToTriggerEvents(trigger, container, searchInput);
    bindAssignedToSearchEvents(searchInput, trigger, container);
    container.addEventListener('click', stopEventPropagation);
    bindAssignedToCheckboxEvents(container, summary, selectedAvatarsContainer, cfg, searchInput);
    bindAssignedToOutsideClick(dialog, cfg, trigger, container, searchInput);
}