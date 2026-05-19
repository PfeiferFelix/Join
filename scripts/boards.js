// Helper utilities are provided globally by boards-utils.js.
let boardsLS = getFormattedLocalStorageItems("boards");
let contactsLS = getFormattedLocalStorageItems("contacts");
let defaultContacts = [];
let contacts = normalizeContacts(contactsLS, defaultContacts);
let categories = ["Technical Task", "User Story"];
let todos = normalizeBoards(boardsLS);

let currentDraggedElement;
let activeTouchDrag = null;
let suppressNextTaskClick = false;
let taskMoveMenuCloseListenerBound = false;
let boardViewportListenerBound = false;
let addTaskDialogOutsideCloseBound = false;

const BOARD_TOUCH_DND_MIN_WIDTH = 640;

const BOARD_DROP_ZONE_CATEGORY_MAP = {
    "board__list--todo": "toDo",
    "board__list--inprogress": "inProgress",
    "board__list--feedback": "feedback",
    "board__list--done": "done",
};

const BOARD_CATEGORY_FLOW = ['toDo', 'inProgress', 'feedback', 'done'];

/**
 * Initializes the board page, loads data, and renders the board.
 * @returns {Promise<void>}
 */
async function initBoardsPage() {
    await init();
    await syncBoardContactsFromFirebase();
    await syncBoardTasksFromFirebase();
    updateBoardContactsFromLocalStorage();
    updateBoardTodosFromLocalStorage();
    updateHTML();
}

/**
 * Updates the contacts list from local storage in memory.
 */
function updateBoardContactsFromLocalStorage() {
    contactsLS = getFormattedLocalStorageItems("contacts");
    contacts = normalizeContacts(contactsLS, defaultContacts);
}

/**
 * Updates the tasks list from local storage in memory.
 */
function updateBoardTodosFromLocalStorage() {
    boardsLS = getFormattedLocalStorageItems("boards");
    todos = normalizeBoards(boardsLS);
}

/**
 * Returns all board columns with their rendering targets.
 * @returns {Array<{category: string, cardsId: string, emptyId: string}>}
 */
function getBoardColumnsForRendering() {
    return [
        { category: "toDo", cardsId: "board__cards--todo", emptyId: "noneCardTodo" },
        { category: "inProgress", cardsId: "board__cards--inprogress", emptyId: "noneCardInProgress" },
        { category: "feedback", cardsId: "board__cards--feedback", emptyId: "noneCardFeedback" },
        { category: "done", cardsId: "board__cards--done", emptyId: "noneCardDone" }
    ].filter(Boolean);
}

/**
 * Initializes all board interaction handlers and UI state.
 */
function initializeBoardInteractions() {
    updateTaskDraggableState();
    initializeTouchBoardDnD();
    initializeBoardViewportBehavior();
    initializeTaskMoveMenuCloseBehavior();
    initializeAddTaskDialogOutsideClose();
}

/**
 * Checks if a click happened outside the visible dialog box.
 * @param {MouseEvent} event
 * @param {HTMLElement} dialog
 * @returns {boolean}
 */
function isOutsideDialogBounds(event, dialog) {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
}

/**
 * Binds closing of the add-task dialog when clicking on the backdrop.
 */
function initializeAddTaskDialogOutsideClose() {
    if (addTaskDialogOutsideCloseBound) return;
    const dialog = document.getElementById('addTaskDialog');
    if (!dialog) return;
    dialog.addEventListener('click', (event) => {
        if (!dialog.open) return;
        if (event.target !== dialog) return;
        if (!isOutsideDialogBounds(event, dialog)) return;
        closeDialog();
    });
    addTaskDialogOutsideCloseBound = true;
}

/**
 * Re-renders all board columns and reinitializes board interactions.
 */
function updateHTML() {
    const boardLists = Array.from(document.querySelectorAll('.board__list')).filter(Boolean);
    for (const list of boardLists) list.style.display = '';
    saveBoardsToLocalStorage();
    getBoardColumnsForRendering().forEach(col => renderCategoryContent(col));
    initializeBoardInteractions();
}

/**
 * Returns whether drag interactions are enabled for the current viewport.
 * @returns {boolean}
 */
function isBoardDragInteractionEnabled() {
    return window.innerWidth >= BOARD_TOUCH_DND_MIN_WIDTH;
}

/**
 * Binds drag start and end event handlers to a task card.
 * @param {HTMLElement} task
 */
function bindTaskDragEvents(task) {
    if (task.dataset.dragBound) return;
    task.addEventListener('dragstart', (event) => {
        task.classList.add('task--dragging');
        if (typeof event.dataTransfer.setDragImage === 'function') {
            event.dataTransfer.setDragImage(task, 20, 20);
        }
    });
    task.addEventListener('dragend', () => task.classList.remove('task--dragging'));
    task.dataset.dragBound = 'true';
}

/**
 * Updates draggable state and drag bindings for all visible task cards.
 */
function updateTaskDraggableState() {
    const isDragEnabled = isBoardDragInteractionEnabled();
    document.querySelectorAll('.task').forEach(task => {
        task.draggable = isDragEnabled;
        bindTaskDragEvents(task);
    });
}

/**
 * Initializes viewport resize behavior for board interactions.
 */
function initializeBoardViewportBehavior() {
    if (boardViewportListenerBound) return;
    window.addEventListener('resize', () => {
        updateTaskDraggableState();
        if (window.innerWidth > 1010 && typeof closeAllTaskMovePanels === 'function') {
            closeAllTaskMovePanels();
        }
    });
    boardViewportListenerBound = true;
}

/**
 * Animates and closes a dialog with a given closing class.
 * @param {HTMLElement} dialog
 * @param {string} closingClass
 */
function animateAndCloseDialog(dialog, closingClass) {
    dialog.classList.add(closingClass);
    dialog.addEventListener('animationend', () => {
        dialog.classList.remove(closingClass);
        dialog.close();
        document.body.style.overflow = '';
    }, { once: true });
}

/**
 * Closes all board-related dialogs and restores page scrolling.
 */
function closeDialog() {
    let closed = false;
    const dialogs = [
        { el: document.getElementById("addTaskDialog"), cls: 'addTaskDialog--closing' },
        { el: document.getElementById("showTaskDialog"), cls: 'showTaskDialog--closing' },
        { el: document.getElementById("editTaskDialog"), cls: 'editTaskDialog--closing' }
    ];
    dialogs.forEach(({ el, cls }) => {
        if (el?.open) { animateAndCloseDialog(el, cls); closed = true; }
    });
    if (!closed) document.body.style.overflow = '';
}

/**
 * Renders all task cards for a single board category.
 * @param {{category: string, cardsId: string, emptyId: string}} param0
 */
function renderCategoryContent({ category, cardsId, emptyId }) {
    const container = document.getElementById(cardsId);
    const noCardElement = document.getElementById(emptyId);
    if (!container || !noCardElement) return;
    const categoryTasks = todos.filter(todo => todo.category === category);
    container.innerHTML = categoryTasks.map(todo => generateTodoHTML(buildTodoCardTemplateData(todo))).join('');
    noCardElement.style.display = categoryTasks.length === 0 ? 'flex' : 'none';
}

/**
 * Renders one board column with cards matching the current search query.
 * @param {{category: string, cardsId: string, emptyId: string}} param0
 * @param {string} query
 */
function renderSearchResultColumn({ category, cardsId, emptyId }, query) {
    const container = document.getElementById(cardsId);
    const noCardElement = document.getElementById(emptyId);
    if (!container || !noCardElement) return;
    const boardList = container.closest('.board__list');
    const taskText = t => `${t.title || ''} ${t.description || ''} ${(t.subtasks || []).map(s => s?.title || '').join(' ')}`;
    const categoryTasks = todos.filter(t => t.category === category && taskText(t).toLowerCase().includes(query));
    container.innerHTML = categoryTasks.map(todo => generateTodoHTML(buildTodoCardTemplateData(todo))).join('');
    noCardElement.style.display = 'none';
    if (boardList) boardList.style.display = categoryTasks.length > 0 ? '' : 'none';
}

/**
 * Returns the search input element from the submitted search form.
 * @param {HTMLFormElement} form
 * @returns {HTMLInputElement|null}
 */
function getSearchInputFromForm(form) {
    return form?.querySelector('input[name="search"]') || null;
}

/**
 * Normalizes the raw search input to a lowercase query string.
 * @param {HTMLInputElement} searchInput
 * @returns {string}
 */
function getNormalizedSearchQuery(searchInput) {
    return (searchInput?.value || '').trim().toLowerCase();
}

/**
 * Validates the search query and shows a SweetAlert when empty.
 * @param {HTMLInputElement} searchInput
 * @param {string} query
 * @returns {boolean}
 */
function validateSearchQuery(query) {
    if (query) return true;
    Swal.fire({
        icon: 'warning',
        title: 'Oops...',
        text: 'Bitte gib einen Suchbegriff ein.',
    });
    return false;
}

/**
 * Renders all search result columns and reapplies board interaction bindings.
 * @param {string} query
 */
function renderSearchResults(query) {
    getBoardColumns().forEach(col => renderSearchResultColumn(col, query));
    updateTaskDraggableState();
    initializeTouchBoardDnD();
    initializeTaskMoveMenuCloseBehavior();
}

/**
 * Handles board search form submit events.
 * @param {Event} event
 */
function searchCard(event) {
    event.preventDefault();
    const searchInput = getSearchInputFromForm(event.currentTarget);
    const query = getNormalizedSearchQuery(searchInput);
    if (!validateSearchQuery(query)) return;
    renderSearchResults(query);
}

/**
 * Returns the static board column metadata used for rendering and search.
 * @returns {Array<{category: string, cardsId: string, emptyId: string}>}
 */
function getBoardColumns() {
    return [
        { category: 'toDo', cardsId: 'board__cards--todo', emptyId: 'noneCardTodo' },
        { category: 'inProgress', cardsId: 'board__cards--inprogress', emptyId: 'noneCardInProgress' },
        { category: 'feedback', cardsId: 'board__cards--feedback', emptyId: 'noneCardFeedback' },
        { category: 'done', cardsId: 'board__cards--done', emptyId: 'noneCardDone' },
    ];
}

/**
 * Clears custom validation and restores the full board when search is emptied.
 * @param {Event} event
 */
function clearSearch(event) {
    event.currentTarget?.setCustomValidity('');
    if (event.currentTarget?.value.trim()) return;
    updateHTML();
}

/**
 * Resets the current search and restores the full board on Escape.
 * @param {KeyboardEvent} event
 */
function resetSearchOnEscape(event) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.currentTarget.value = '';
    updateHTML();
}

/**
 * Persists the current in-memory tasks to local storage.
 */
function saveBoardsToLocalStorage() {
    const boardsObject = todos.reduce((result, todo) => {
        const key = todo.firebaseKey || todo.id;
        result[key] = buildStorageTask(todo);
        return result;
    }, {});
    localStorage.setItem("boards", JSON.stringify(boardsObject));
}

/**
 * Removes internal-only fields before persisting tasks.
 * @param {object} todo
 * @returns {object}
 */
function stripInternalTaskFields(todo) {
    const { id, firebaseKey, priorityClass, subtask, sub_task, ...cleanTodo } = todo;
    return cleanTodo;
}

/**
 * Builds a summary-compatible storage object for one task.
 * @param {object} todo
 * @returns {object}
 */
function buildStorageTask(todo) {
    const cleanTodo = stripInternalTaskFields(todo);
    return {
        ...cleanTodo,
        position: mapCategoryToSummaryPosition(todo.category || todo.position),
        dueDate: cleanTodo.dueDate || '',
        priority: mapPriorityToSummaryValue(cleanTodo.priority),
    };
}

/**
 * Enables dropping on a board column when drag interactions are active.
 * @param {DragEvent} event
 */
function allowDrop(event) {
    if (!isBoardDragInteractionEnabled()) return;
    event.preventDefault();
}

/**
 * Handles task drop events and moves tasks to the target category.
 * @param {DragEvent} event
 */
function drop(event) {
    if (!isBoardDragInteractionEnabled()) return;
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain") || currentDraggedElement?.id;
    const dropZoneId = event.currentTarget.id;
    const targetCategory = BOARD_DROP_ZONE_CATEGORY_MAP[dropZoneId];
    moveTaskToCategory(taskId, targetCategory);
}

/**
 * Moves a task to a category and persists the category change.
 * @param {string|number} taskId
 * @param {string} targetCategory
 */
function moveTaskToCategory(taskId, targetCategory) {
    if (!targetCategory) return;
    const taskIndex = todos.findIndex((todo) => todo.id == taskId);
    if (taskIndex !== -1) {
        const task = todos[taskIndex];
        task.category = targetCategory;
        task.position = mapCategoryToSummaryPosition(targetCategory);
        updateHTML();
        persistTaskCategoryToFirebase(task);
    }
}

/**
 * Handles task card click behavior, including move panel suppression.
 * @param {Event} event
 * @param {string|number} taskId
 */
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

/**
 * Updates the subtask progress preview on a rendered task card.
 * @param {string|number} taskId
 * @param {object} task
 * @param {Array} subtasks
 * @param {boolean} [removeEmptyState=false]
 */
function updateTaskCardSubtaskPreview(taskId, task, subtasks, removeEmptyState = false) {
    const card = document.getElementById(String(taskId));
    if (!card) return;
    const countEl = card.querySelector('.task__subtask-text');
    if (countEl) countEl.textContent = getSubtaskCountText(task);
    const barEl = card.querySelector('.task__progress-bar');
    if (!barEl) return;
    const total = subtasks.length, done = subtasks.filter(s => s.done).length;
    barEl.style.width = total > 0 ? `${Math.round((done / total) * 100)}%` : '0%';
    if (removeEmptyState && total === 0) barEl.style.width = '0%';
}

/**
 * Opens the task details dialog for the selected task.
 * @param {string|number} taskId
 */
function toDoCardShow(taskId) {
    const task = todos.find((t) => t.id == taskId);
    if (!task) return;
    const dialog = document.getElementById('showTaskDialog');
    dialog.dataset.taskId = taskId;
    dialog.innerHTML = getShowTaskTemplate(buildShowTaskViewData(task));
    dialog.showModal();
    document.body.style.overflow = 'hidden';
}

/**
 * Safely reads and normalizes local storage data by key.
 * @param {string} key
 * @returns {Array}
 */
function getFormattedLocalStorageItems(key) {
    try {
        const items = importandFormatLocalStorageData(key);
        return Array.isArray(items) ? items : [];
    } catch {
        return [];
    }
}

/**
 * Merges a new task into an existing match or inserts it as a new task.
 * @param {object} newTodo
 */
function mergeOrInsertTodo(newTodo) {
    const existingTodo = todos.find(todo =>
        todo.title === newTodo.title && todo.description === newTodo.description &&
        todo.dueDate === newTodo.dueDate && todo.priority === newTodo.priority &&
        todo.category === newTodo.category);
    if (!existingTodo) return todos.push(newTodo);
    if (!Array.isArray(existingTodo.assignedTo)) existingTodo.assignedTo = [];
    newTodo.assignedTo.forEach(contact => {
        if (!existingTodo.assignedTo.some(user => user.id === contact.id))
            existingTodo.assignedTo.push(contact);
    });
}

/**
 * Starts drag behavior for a task card.
 * @param {DragEvent} event
 */
function drag(event) {
    if (!isBoardDragInteractionEnabled()) return event.preventDefault();
    const taskElement = event.target.closest(".task");
    if (!taskElement) return;
    currentDraggedElement = taskElement;
    event.dataTransfer.setData("text/plain", String(taskElement.id));
}

/**
 * Deletes a task locally and remotely, then updates the UI.
 * @param {string|number} taskId
 * @returns {Promise<void>}
 */
async function deleteTask(taskId) {
    const taskIndex = todos.findIndex((t) => t.id == taskId);
    if (taskIndex === -1) return;
    const task = todos[taskIndex];
    const remoteDelete = await deleteTaskFromFirebase(task);
    if (remoteDelete.attempted && !remoteDelete.ok) {
        if (typeof showFirebaseError === 'function') {
            showFirebaseError(new Error('Karte konnte nicht in Firebase geloescht werden.'));
        }
        return;
    }
    todos.splice(taskIndex, 1);
    updateHTML();
    closeDialog();
}
