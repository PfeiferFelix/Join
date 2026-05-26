const BOARD_SUBTASK_LIMIT = 10;

/**
 * Stops event propagation if event is provided.
 * @param {Event} event
 */
function stopEventPropagation(event) {
    if (!event) return;
    event.stopPropagation();
}

/**
 * Prevents default and stops propagation if event is provided.
 * @param {Event} event
 */
function preventAndStopEvent(event) {
    if (!event) return;
    event.preventDefault();
    stopEventPropagation(event);
}

/**
 * Checks if the event key is Enter or Space.
 * @param {KeyboardEvent} event
 * @returns {boolean}
 */
function isEnterOrSpace(event) {
    return event?.key === 'Enter' || event?.key === ' ';
}

/**
 * Focuses the given element if it exists.
 * @param {HTMLElement} element
 */
function focusElement(element) {
    if (element) element.focus();
}

/**
 * Returns a normalized array of subtasks, limited to BOARD_SUBTASK_LIMIT.
 * @param {Array|*} input
 * @returns {Array<{title: string, done: boolean}>}
 */
function getLimitedSubtasks(input) {
    const source = Array.isArray(input) ? input : [input];
    return source
        .map(item => typeof item === 'string' ? { title: item, done: false } : item)
        .map(item => ({ title: (item?.title || '').trim(), done: Boolean(item?.done), }))
        .filter(item => item.title).slice(0, BOARD_SUBTASK_LIMIT);
}

/**
 * Normalizes contacts from items or fallback.
 * @param {Array} items
 * @param {Array} fallback
 * @returns {Array<{id: number, name: string, abbreviation: string}>}
 */
function normalizeContacts(items, fallback) {
    const source = Array.isArray(items) && items.length ? items : fallback;
    return source.filter(Boolean).map((contact, index) => ({
        id: Number(contact?.id) || index + 1,
        name: contact?.name || contact?.Name || '',
        abbreviation: contact?.abbreviation || contact?.initials || buildInitials(contact?.name || contact?.Name || ''),
    })).filter(contact => contact.name);
}

/**
 * Normalizes a board item object.
 * @param {object} board
 * @param {number} index
 * @returns {object}
 */
function normalizeBoardItem(board, index) {
    const { priorityClass, ...boardWithoutPriorityClass } = board || {};
    const subtasks = getLimitedSubtasks(board?.subtasks || board?.subtask || board?.sub_task || []);
    const assignedTo = normalizeAssignedTo(board?.assignedTo || board?.assigned_to || []);
    const category = normalizeCategory(board?.category, board?.position);
    return {
        ...boardWithoutPriorityClass, id: board?.id || Date.now() + index,
        title: board?.title || '', description: board?.description || '', dueDate: board?.dueDate || '',
        priority: normalizePriority(board?.priority), category, selectedCategoryLabel: board?.selectedCategoryLabel || categoryLabel(category),
        assignedTo, subtasks, subtask: subtasks[0]?.title || '',
    };
}

// Creates initials from a full name.
/**
 * Builds initials from a full name string.
 * @param {string} name
 * @returns {string}
 */
function buildInitials(name) {
    return (name || '').split(' ').filter(Boolean).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('');
}

// Maps a priority value to the matching icon class.
/**
 * Maps a priority value to the corresponding icon class.
 * @param {string} priority
 * @returns {string}
 */
function getPriorityIconClass(priority) {
    if (priority === "Urgent" || priority === "⟪") return "up";
    if (priority === "Medium" || priority === "‖") return "medium";
    if (priority === "Low" || priority === "⟫") return "down";
    return "medium";
}

// Converts an internal category key to a display label.
/**
 * Converts an internal category key to a display label.
 * @param {string} category
 * @returns {string}
 */
function categoryLabel(category) {
    if (category === "toDo") return "Technical Task";
    else if (category === "inProgress") return "User Story";
    else if (category === "feedback") return "Awaiting Feedback";
    else if (category === "done") return "Done";
    else return "";
}

// Returns the CSS class name for a category header label.
/**
 * Returns the CSS class name for a category header label.
 * @param {string} label
 * @returns {string}
 */
function getCategoryHeaderClass(label) {
    if (label === 'Technical Task') return 'task__category-badge--technical';
    if (label === 'User Story') return 'task__category-badge--user-story';
    return '';
}

// Builds the progress text for completed subtasks.
/**
 * Builds the progress text for completed subtasks.
 * @param {object} todo
 * @returns {string}
 */
function getSubtaskCountText(todo) {
    const subtasks = getLimitedSubtasks(todo?.subtasks);
    const total = subtasks.length;
    const done = subtasks.filter(s => s.done).length;
    return `${done}/${total} Subtasks`;
}

// Normalizes assignedTo field from various formats.
/**
 * Normalizes assignedTo field from various formats.
 * @param {Array|string[]} assignedToRaw
 * @returns {Array<{id: number, name: string, abbreviation: string}>}
 */
function normalizeAssignedTo(assignedToRaw) {
    if (!Array.isArray(assignedToRaw) || assignedToRaw.length === 0) return normalizeContacts([], []);
    if (typeof assignedToRaw[0] === 'string') {
        return assignedToRaw.map((name, i) => ({ id: i + 1, name, abbreviation: buildInitials(name || '') }));
    }
    return normalizeContacts(assignedToRaw, []);
}

// Normalizes priority value into standardized format.
/**
 * Normalizes priority value into standardized format.
 * @param {string} priorityRaw
 * @returns {string}
 */
function normalizePriority(priorityRaw) {
    const p = String(priorityRaw || 'Medium').toLowerCase();
    if (p === 'urgent' || p === '⟪') return 'Urgent';
    if (p === 'low' || p === '⟫') return 'Low';
    return 'Medium';
}

// Maps internal board category keys to summary-compatible position values.
/**
 * Maps internal board category keys to summary-compatible position values.
 * @param {string} categoryRaw
 * @returns {string}
 */
function mapCategoryToSummaryPosition(categoryRaw) {
    if (categoryRaw === 'toDo') return 'todo';
    if (categoryRaw === 'inProgress') return 'in progress';
    if (categoryRaw === 'feedback') return 'awaiting feedback';
    if (categoryRaw === 'done') return 'done';
    const normalized = String(categoryRaw || '').toLowerCase();
    if (normalized === 'todo' || normalized === 'in progress' || normalized === 'awaiting feedback' || normalized === 'done') return normalized;
    return 'todo';
}

// Maps summary-compatible position values back to internal board category keys.
/**
 * Maps summary-compatible position values back to internal board category keys.
 * @param {string} positionRaw
 * @returns {string|null}
 */
function mapSummaryPositionToCategory(positionRaw) {
    const p = String(positionRaw || '').toLowerCase();
    if (p === 'todo' || p === 'to do' || p === 'todo ') return 'toDo';
    if (p === 'in progress') return 'inProgress';
    if (p === 'awaiting feedback') return 'feedback';
    if (p === 'done') return 'done';
    return null;
}

// Maps normalized priority labels to summary-compatible lowercase values.
/**
 * Maps normalized priority labels to summary-compatible lowercase values.
 * @param {string} priorityRaw
 * @returns {string}
 */
function mapPriorityToSummaryValue(priorityRaw) {
    const p = normalizePriority(priorityRaw);
    if (p === 'Urgent') return 'urgent';
    if (p === 'Low') return 'low';
    return 'medium';
}

// Normalizes category into valid board category.
/**
 * Normalizes category into a valid board category.
 * @param {string} categoryRaw
 * @param {string} position
 * @returns {string}
 */
function normalizeCategory(categoryRaw, position) {
    const VALID_BOARD_CATEGORIES = ['toDo', 'inProgress', 'feedback', 'done'];
    if (categoryRaw && VALID_BOARD_CATEGORIES.includes(categoryRaw)) return categoryRaw;
    const mappedCategory = mapSummaryPositionToCategory(position);
    return mappedCategory || 'toDo';
}

// Normalizes board items loaded from storage.
/**
 * Normalizes board items loaded from storage.
 * @param {Array} items
 * @returns {Array}
 */
function normalizeBoards(items) {
    if (!Array.isArray(items)) return [];
    return items.filter(Boolean).map(normalizeBoardItem).filter(b => b.title);
}
