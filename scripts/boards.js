let boardsLS = getFormattedLocalStorageItems("boards");
let contactsLS = getFormattedLocalStorageItems("contacs");

let defaultContacts = [];

let contacts = normalizeContacts(contactsLS, defaultContacts);

let categories = ["Technical Task", "User Story"];

let todos = normalizeBoards(boardsLS);

let currentDraggedElement;
let activeTouchDrag = null;
let suppressNextTaskClick = false;
let taskMoveMenuCloseListenerBound = false;

const BOARD_DROP_ZONE_CATEGORY_MAP = {
    "board__list--todo": "toDo",
    "board__list--inprogress": "inProgress",
    "board__list--feedback": "feedback",
    "board__list--done": "done",
};

const BOARD_CATEGORY_FLOW = ['toDo', 'inProgress', 'feedback', 'done'];


// Returns at most two valid subtasks in normalized shape.
function getLimitedSubtasks(input) {
    const source = Array.isArray(input) ? input : [input];

    return source
        .map(item => typeof item === 'string' ? { title: item, done: false } : item)
        .map(item => ({
            title: (item?.title || '').trim(),
            done: Boolean(item?.done),
        }))
        .filter(item => item.title)
        .slice(0, 2);
}

// Re-renders all board columns and re-initializes board interactions.
function updateHTML() {
    saveBoardsToLocalStorage();
    renderCategoryContent({ category: "toDo", cardsId: "board__cards--todo", emptyId: "noneCardTodo" });
    renderCategoryContent({ category: "inProgress", cardsId: "board__cards--inprogress", emptyId: "noneCardInProgress" });
    renderCategoryContent({ category: "feedback", cardsId: "board__cards--feedback", emptyId: "noneCardFeedback" });
    renderCategoryContent({ category: "done", cardsId: "board__cards--done", emptyId: "noneCardDone" });
    initializeTouchBoardDnD();
    initializeTaskMoveMenuCloseBehavior();
}

// Closes open board dialogs and restores page scrolling.
function closeDialog() {
    const addTaskDialog = document.getElementById("addTaskDialog");
    const editTaskDialog = document.getElementById("editTaskDialog");

    if (addTaskDialog?.open) {
        addTaskDialog.close();
    }

    if (editTaskDialog?.open) {
        editTaskDialog.close();
    }

    document.body.style.overflow = '';
}

// Renders all task cards for one board category.
function renderCategoryContent({ category, cardsId, emptyId }) {
    const container = document.getElementById(cardsId);
    const noCardElement = document.getElementById(emptyId);
    if (!container || !noCardElement) return;

    const categoryTasks = todos.filter(todo => todo.category === category);
    container.innerHTML = categoryTasks
        .map(todo => generateTodoHTML(buildTodoCardTemplateData(todo)))
        .join('');
    noCardElement.style.display = categoryTasks.length === 0 ? 'flex' : 'none';
}

// Persists the current board state to local storage.
function saveBoardsToLocalStorage() {
    const boardsObject = todos.reduce((result, todo) => {
        result[todo.id] = todo;
        return result;
    }, {});

    localStorage.setItem("boards", JSON.stringify(boardsObject));
}

// Allows dropping by preventing the default drag-over behavior.
function allowDrop(event) {
    event.preventDefault();
}

// Moves the dragged task into the drop target category.
function drop(event) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain") || currentDraggedElement?.id;
    const dropZoneId = event.currentTarget.id;
    const targetCategory = BOARD_DROP_ZONE_CATEGORY_MAP[dropZoneId];
    moveTaskToCategory(taskId, targetCategory);
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

// Updates a task category and triggers a board refresh.
function moveTaskToCategory(taskId, targetCategory) {
    if (!targetCategory) return;
    const taskIndex = todos.findIndex((todo) => todo.id == taskId);
    if (taskIndex !== -1) {
        todos[taskIndex].category = targetCategory;
        updateHTML();
    }
}

// Builds the progress text for completed subtasks.
function getSubtaskCountText(todo) {
    const subtasks = getLimitedSubtasks(todo?.subtasks);
    const total = subtasks.length;
    const done = subtasks.filter(s => s.done).length;
    return `${done} / ${total}`;
}

// Opens task details unless the move panel is currently open.
function handleTaskClick(event, taskId) {
    const taskCard = event.currentTarget?.closest('.task') || event.target?.closest('.task');
    if (taskCard?.querySelector('.task-move-panel--open')) {
        event.preventDefault();
        event.stopPropagation();
        return;
    }

    if (!suppressNextTaskClick) return toDoCardShow(taskId);
    suppressNextTaskClick = false;
    event.preventDefault();
    event.stopPropagation();
}

// Normalizes contact entries into a consistent structure.
function normalizeContacts(items, fallback) {
    const source = Array.isArray(items) && items.length ? items : fallback;
    return source
        .filter(Boolean)
        .map((contact, index) => ({
            id: Number(contact?.id) || index + 1,
            name: contact?.name || contact?.Name || '',
            abbreviation: contact?.abbreviation || contact?.initials || buildInitials(contact?.name || contact?.Name || ''),
        }))
        .filter(contact => contact.name);
}

// Returns the CSS class name for a category header label.
function getCategoryHeaderClass(label) {
    if (label === 'Technical Task') return 'TechnicalTask';
    if (label === 'User Story') return 'UserStory';
    return '';
}

// Updates the subtask progress preview on a rendered task card.
function updateTaskCardSubtaskPreview(taskId, task, subtasks, removeEmptyState = false) {
    const card = document.getElementById(String(taskId));
    if (!card) return;

    const countEl = card.querySelector('#subtaskCount');
    if (countEl) countEl.textContent = getSubtaskCountText(task);
    const barEl = card.querySelector('.subtask');
    if (!barEl) return;

    const doneCount = subtasks.filter(s => s.done).length;
    barEl.classList.toggle('subtask--active', doneCount > 0);
    barEl.classList.toggle('subtask--done', doneCount === subtasks.length && subtasks.length > 0);
    if (removeEmptyState && subtasks.length === 0) barEl.classList.remove('subtask--active', 'subtask--done');
}

// Opens the task detail dialog for the selected task.
function toDoCardShow(taskId) {
    const task = todos.find((t) => t.id == taskId);
    if (!task) return;

    const dialog = document.getElementById("editTaskDialog");
    dialog.dataset.taskId = taskId;
    dialog.innerHTML = getShowTaskTemplate(buildEditTaskDetailTemplateData(task));
    dialog.showModal();
    document.body.style.overflow = 'hidden';
}

// Safely loads and normalizes an array from local storage.
function getFormattedLocalStorageItems(key) {
    try {
        const items = importandFormatLocalStorageData(key);
        return Array.isArray(items) ? items : [];
    } catch {
        return [];
    }
}

// Builds the assigned-user row template with avatar and name.
function getAssignedUserWithNameTemplate(user, index) {
    const abbreviation = user?.abbreviation || '';
    const userName = user?.name || abbreviation || 'Unknown User';
    const colorIndex = (index % 5) + 1;
    return `<div class="assigned-user-row"><svg class="assigned-user-avatar assigned-user-avatar--${colorIndex}" width="40" height="40" viewBox="0 0 80 80" aria-hidden="true"><circle class="header__circle" cx="40" cy="40" r="38" stroke="#ffffff" stroke-width="4" /><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="28" font-family="Inter, sans-serif" fill="#fff" font-weight="700">${abbreviation}</text></svg><span class="assigned-user-name">${userName}</span></div>`;
}

// Builds template data used to render a task card.
function buildTodoCardTemplateData(todo) {
    const fixedHeaderLabel = todo.selectedCategoryLabel || categoryLabel(todo.category);
    const priorityLabel = todo.priority || 'Medium';
    const iconClass = getPriorityIconClass(priorityLabel);
    const subtasks = getLimitedSubtasks(todo?.subtasks);
    const doneSubtasksCount = subtasks.filter(subtask => Boolean(subtask.done)).length;
    const hasSubtasks = subtasks.length > 0;
    const nextCategory = getNextBoardCategory(todo.category);
    return {
        id: todo.id,
        title: todo.title,
        description: todo.description || '',
        fixedHeaderLabel,
        headerClass: getCategoryHeaderClass(fixedHeaderLabel),
        priorityLabel,
        iconClass,
        priorityIcon: iconClass === 'up' ? '⟪' : iconClass === 'down' ? '⟫' : '‖',
        assignedUsersHTML: Array.isArray(todo.assignedTo) ? todo.assignedTo.map((user, index) => getCircleUserTemplate(user.abbreviation || '', index)).join('') : '',
        subtaskCountText: getSubtaskCountText(todo),
        hasSubtasks,
        hasCheckedSubtasks: doneSubtasksCount > 0,
        allSubtasksDone: hasSubtasks && doneSubtasksCount === subtasks.length,
        nextMoveArrow: getMoveDirectionArrow(todo.category, nextCategory),
        nextMoveLabel: `${getBoardColumnLabel(nextCategory)}`,
        nextMoveDisabled: false,
    };
}

// Builds template data for the task detail dialog view.
function buildEditTaskDetailTemplateData(task) {
    const fixedHeaderLabel = task.selectedCategoryLabel || categoryLabel(task.category);
    const priorityLabel = task.priority || '';
    const iconClass = getPriorityIconClass(priorityLabel);
    const subtasks = getLimitedSubtasks(task.subtasks);
    const subtasksHTML = subtasks.map((subtask, index) => `<li class="subtask-item" data-subtask-index="${index}">${subtask.title}</li>`).join('');
    const priorityText = priorityLabel === '⟪' ? 'Urgent' : priorityLabel === '‖' ? 'Medium' : priorityLabel === '⟫' ? 'Low' : (priorityLabel || 'Medium');
    return {
        id: task.id,
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate || '',
        fixedHeaderLabel,
        headerClass: getCategoryHeaderClass(fixedHeaderLabel),
        assignedUsersHTML: Array.isArray(task.assignedTo) ? task.assignedTo.map((user, index) => getAssignedUserWithNameTemplate(user, index)).join('') : '',
        subtaskCountText: getSubtaskCountText(task),
        firstSubtaskDone: Boolean(subtasks[0]?.done),
        firstSubtaskTitle: subtasks[0]?.title || '',
        subtasksListHTML: subtasksHTML,
        subtasksHTML,
        subtasks,
        allSubtasksDone: subtasks.length > 0 && subtasks.every(s => Boolean(s.done)),
        priorityLabel: priorityText,
        iconClass,
        priorityIcon: iconClass === 'up' ? '⟪' : iconClass === 'down' ? '⟫' : '‖',
    };
}

// Builds template data for the editable task form view.
function buildEditTaskFormTemplateData(task) {
    const fixedHeaderLabel = task.selectedCategoryLabel || categoryLabel(task.category);
    const subtasks = getLimitedSubtasks(task.subtasks);
    const subtasksHTML = subtasks.map((subtask, index) => `<li class="subtask-item" data-subtask-index="${index}">${subtask.title}</li>`).join('');
    const categoryOptionsHTML = ['Technical Task', 'User Story'].map(option => `<option value="${option}" ${option === fixedHeaderLabel ? 'selected' : ''}>${option}</option>`).join('');
    return {
        id: task.id,
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate || '',
        priority: task.priority,
        assignedUsersHTML: Array.isArray(task.assignedTo) ? task.assignedTo.map((user, index) => getCircleUserTemplate(user.abbreviation || '', index)).join('') : '',
        editSubtasksHTML: subtasksHTML,
        subtasksHTML,
        subtasks,
        categoryOptionsHTML,
    };
}

// Normalizes board items loaded from storage.
function normalizeBoards(items) {
    if (!Array.isArray(items)) return [];
    return items.filter(Boolean).map((board, index) => {
        const subtasks = getLimitedSubtasks(board?.subtasks || board?.subtask || []);
        return {
            ...board,
            id: board?.id || Date.now() + index,
            title: board?.title || '',
            description: board?.description || '',
            dueDate: board?.dueDate || '',
            priority: board?.priority || 'Medium',
            category: board?.category || 'toDo',
            selectedCategoryLabel: board?.selectedCategoryLabel || categoryLabel(board?.category || 'toDo'),
            assignedTo: normalizeContacts(board?.assignedTo || [], []),
            subtasks,
            subtask: subtasks[0]?.title || '',
        };
    }).filter(board => board.title);
}

// Inserts a new task or merges assignees into an existing one.
function mergeOrInsertTodo(newTodo) {
    const existingTodo = todos.find(todo => todo.title === newTodo.title && todo.description === newTodo.description && todo.dueDate === newTodo.dueDate && todo.priority === newTodo.priority && todo.category === newTodo.category);
    if (!existingTodo) return todos.push(newTodo);
    if (!Array.isArray(existingTodo.assignedTo)) existingTodo.assignedTo = [];
    newTodo.assignedTo.forEach(contact => { if (!existingTodo.assignedTo.some(user => user.id === contact.id)) existingTodo.assignedTo.push(contact); });
}

// Creates initials from a full name.
function buildInitials(name) {
    return (name || '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join('');
}

// Starts drag-and-drop by storing the current task id.
function drag(event) {
    const taskElement = event.target.closest(".task");
    if (!taskElement) return;
    currentDraggedElement = taskElement;
    event.dataTransfer.setData("text/plain", String(taskElement.id));
}

// Deletes a task and refreshes the board.
function deleteTask(taskId) {
    const taskIndex = todos.findIndex((t) => t.id == taskId);
    if (taskIndex !== -1) {
        todos.splice(taskIndex, 1);
        updateHTML();
        closeDialog();
    }
}
