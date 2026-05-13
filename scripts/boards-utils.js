// --- Ausgelagerte Hilfsfunktionen aus boards.js ---

const BOARD_SUBTASK_LIMIT = 10;

function stopEventPropagation(event) {
    if (!event) return;
    event.stopPropagation();
}

function preventAndStopEvent(event) {
    if (!event) return;
    event.preventDefault();
    stopEventPropagation(event);
}

function isEnterOrSpace(event) {
    return event?.key === 'Enter' || event?.key === ' ';
}

function focusElement(element) {
    if (element) element.focus();
}

function getLimitedSubtasks(input) {
    const source = Array.isArray(input) ? input : [input];
    return source
        .map(item => typeof item === 'string' ? { title: item, done: false } : item)
        .map(item => ({ title: (item?.title || '').trim(), done: Boolean(item?.done), }))
        .filter(item => item.title).slice(0, BOARD_SUBTASK_LIMIT);
}

function normalizeContacts(items, fallback) {
    const source = Array.isArray(items) && items.length ? items : fallback;
    return source.filter(Boolean).map((contact, index) => ({
        id: Number(contact?.id) || index + 1,
        name: contact?.name || contact?.Name || '',
        abbreviation: contact?.abbreviation || contact?.initials || buildInitials(contact?.name || contact?.Name || ''),
    })).filter(contact => contact.name);
}

function normalizeBoardItem(board, index) {
    const subtasks = getLimitedSubtasks(board?.subtasks || board?.subtask || board?.sub_task || []);
    const assignedTo = normalizeAssignedTo(board?.assignedTo || board?.assigned_to || []);
    const category = normalizeCategory(board?.category, board?.position);
    return {
        ...board, id: board?.id || Date.now() + index,
        title: board?.title || '', description: board?.description || '', dueDate: board?.dueDate || board?.due_date || '',
        priority: normalizePriority(board?.priority), category, selectedCategoryLabel: board?.selectedCategoryLabel || categoryLabel(category),
        assignedTo, subtasks, subtask: subtasks[0]?.title || '',
    };
}

// Creates initials from a full name.
function buildInitials(name) {
    return (name || '').split(' ').filter(Boolean).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('');
}

// Maps a priority value to the matching icon class.
function getPriorityIconClass(priority) {
    if (priority === "Urgent" || priority === "⟪") return "up";
    if (priority === "Medium" || priority === "‖") return "medium";
    if (priority === "Low" || priority === "⟫") return "down";
    return "medium";
}

// Converts an internal category key to a display label.
function categoryLabel(category) {
    if (category === "toDo") return "Technical Task";
    else if (category === "inProgress") return "User Story";
    else if (category === "feedback") return "Awaiting Feedback";
    else if (category === "done") return "Done";
    else return "";
}

// Returns the CSS class name for a category header label.
function getCategoryHeaderClass(label) {
    if (label === 'Technical Task') return 'TechnicalTask';
    if (label === 'User Story') return 'UserStory';
    return '';
}

// Builds the progress text for completed subtasks.
function getSubtaskCountText(todo) {
    const subtasks = getLimitedSubtasks(todo?.subtasks);
    const total = subtasks.length;
    const done = subtasks.filter(s => s.done).length;
    return `${done}/${total} Subtasks`;
}

// Normalizes assignedTo field from various formats.
function normalizeAssignedTo(assignedToRaw) {
    if (!Array.isArray(assignedToRaw) || assignedToRaw.length === 0) return normalizeContacts([], []);
    if (typeof assignedToRaw[0] === 'string') {
        return assignedToRaw.map((name, i) => ({ id: i + 1, name, abbreviation: buildInitials(name || '') }));
    }
    return normalizeContacts(assignedToRaw, []);
}

// Normalizes priority value into standardized format.
function normalizePriority(priorityRaw) {
    const p = String(priorityRaw || 'Medium').toLowerCase();
    if (p === 'urgent' || p === '⟪') return 'Urgent';
    if (p === 'low' || p === '⟫') return 'Low';
    return 'Medium';
}

// Normalizes category into valid board category.
function normalizeCategory(categoryRaw, position) {
    const VALID_BOARD_CATEGORIES = ['toDo', 'inProgress', 'feedback', 'done'];
    return (categoryRaw && VALID_BOARD_CATEGORIES.includes(categoryRaw)) ? categoryRaw : (position || 'toDo');
}

// Normalizes board items loaded from storage.
function normalizeBoards(items) {
    if (!Array.isArray(items)) return [];
    return items.filter(Boolean).map(normalizeBoardItem).filter(b => b.title);
}
