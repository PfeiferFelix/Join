// Helper utilities are provided globally by boards-utils.js.
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
let boardViewportListenerBound = false;

const BOARD_TOUCH_DND_MIN_WIDTH = 640;

const BOARD_DROP_ZONE_CATEGORY_MAP = {
    "board__list--todo": "toDo",
    "board__list--inprogress": "inProgress",
    "board__list--feedback": "feedback",
    "board__list--done": "done",
};

const BOARD_CATEGORY_FLOW = ['toDo', 'inProgress', 'feedback', 'done'];

// Initializes the board page data and renders the board.
async function initBoardsPage() {
    await init();
    await syncBoardContactsFromFirebase();
    await syncBoardTasksFromFirebase();
    updateBoardContactsFromLocalStorage();
    updateBoardTodosFromLocalStorage();
    updateHTML();
}

// Refreshes the in-memory contacts list from local storage.
function updateBoardContactsFromLocalStorage() {
    contactsLS = getFormattedLocalStorageItems("contacs");
    contacts = normalizeContacts(contactsLS, defaultContacts);
}

// Refreshes the in-memory task list from local storage.
function updateBoardTodosFromLocalStorage() {
    boardsLS = getFormattedLocalStorageItems("boards");
    todos = normalizeBoards(boardsLS);
}

// Returns all board columns with their rendering targets.
function getBoardColumnsForRendering() {
    return [
        { category: "toDo", cardsId: "board__cards--todo", emptyId: "noneCardTodo" },
        { category: "inProgress", cardsId: "board__cards--inprogress", emptyId: "noneCardInProgress" },
        { category: "feedback", cardsId: "board__cards--feedback", emptyId: "noneCardFeedback" },
        { category: "done", cardsId: "board__cards--done", emptyId: "noneCardDone" }
    ].filter(Boolean);
}

// Initializes all board interaction handlers and UI state.
function initializeBoardInteractions() {
    updateTaskDraggableState();
    initializeTouchBoardDnD();
    initializeBoardViewportBehavior();
    initializeTaskMoveMenuCloseBehavior();
}

// Re-renders all board columns and reinitializes board interactions.
function updateHTML() {
    const boardLists = Array.from(document.querySelectorAll('.board__list')).filter(Boolean);
    for (const list of boardLists) list.style.display = '';
    saveBoardsToLocalStorage();
    getBoardColumnsForRendering().forEach(col => renderCategoryContent(col));
    initializeBoardInteractions();
}

// Returns whether drag interactions are enabled for the current viewport.
function isBoardDragInteractionEnabled() {
    return window.innerWidth >= BOARD_TOUCH_DND_MIN_WIDTH;
}

// Binds drag start and end event handlers to a task card once.
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

// Updates draggable state and drag bindings for all visible task cards.
function updateTaskDraggableState() {
    const isDragEnabled = isBoardDragInteractionEnabled();
    document.querySelectorAll('.task').forEach(task => {
        task.draggable = isDragEnabled;
        bindTaskDragEvents(task);
    });
}

// Initializes viewport resize behavior for board interactions.
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

// Closes all board-related dialogs and restores page scrolling.
function closeDialog() {
    const addTaskDialog = document.getElementById("addTaskDialog");
    const showTaskDialog = document.getElementById("showTaskDialog");
    const editTaskDialog = document.getElementById("editTaskDialog");
    if (addTaskDialog?.open) addTaskDialog.close();
    if (showTaskDialog?.open) showTaskDialog.close();
    if (editTaskDialog?.open) editTaskDialog.close();
    document.body.style.overflow = '';
}

// Renders all task cards for a single board category.
function renderCategoryContent({ category, cardsId, emptyId }) {
    const container = document.getElementById(cardsId);
    const noCardElement = document.getElementById(emptyId);
    if (!container || !noCardElement) return;
    const categoryTasks = todos.filter(todo => todo.category === category);
    container.innerHTML = categoryTasks.map(todo => generateTodoHTML(buildTodoCardTemplateData(todo))).join('');
    noCardElement.style.display = categoryTasks.length === 0 ? 'flex' : 'none';
}

// Renders one board column with cards matching the current search query.
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

// Returns the search input element from the submitted search form.
function getSearchInputFromForm(form) {
    return form?.querySelector('input[name="search"]') || null;
}

// Normalizes the raw search input to a lowercase query string.
function getNormalizedSearchQuery(searchInput) {
    return (searchInput?.value || '').trim().toLowerCase();
}

// Validates the search query and shows browser validity feedback when empty.
function validateSearchQuery(searchInput, query) {
    if (query) {
        if (searchInput) searchInput.setCustomValidity('');
        return true;
    }
    if (!searchInput) return false;
    searchInput.setCustomValidity('Bitte gib einen Suchbegriff ein.');
    searchInput.reportValidity();
    return false;
}

// Renders all search result columns and reapplies board interaction bindings.
function renderSearchResults(query) {
    getBoardColumns().forEach(col => renderSearchResultColumn(col, query));
    updateTaskDraggableState();
    initializeTouchBoardDnD();
    initializeTaskMoveMenuCloseBehavior();
}

// Handles board search form submit events.
function searchCard(event) {
    event.preventDefault();
    const searchInput = getSearchInputFromForm(event.currentTarget);
    const query = getNormalizedSearchQuery(searchInput);
    if (!validateSearchQuery(searchInput, query)) return;
    renderSearchResults(query);
}

// Returns the static board column metadata used for rendering and search.
function getBoardColumns() {
    return [
        { category: 'toDo', cardsId: 'board__cards--todo', emptyId: 'noneCardTodo' },
        { category: 'inProgress', cardsId: 'board__cards--inprogress', emptyId: 'noneCardInProgress' },
        { category: 'feedback', cardsId: 'board__cards--feedback', emptyId: 'noneCardFeedback' },
        { category: 'done', cardsId: 'board__cards--done', emptyId: 'noneCardDone' },
    ];
}

// Clears custom validation and restores the full board when search is emptied.
function clearSearch(event) {
    event.currentTarget?.setCustomValidity('');
    if (event.currentTarget?.value.trim()) return;
    updateHTML();
}

// Resets the current search and restores the full board on Escape.
function resetSearchOnEscape(event) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.currentTarget.value = '';
    updateHTML();
}

// Persists the current in-memory tasks to local storage.
function saveBoardsToLocalStorage() {
    const boardsObject = todos.reduce((result, todo) => {
        const key = todo.firebaseKey || todo.id;
        result[key] = todo;
        return result;
    }, {});
    localStorage.setItem("boards", JSON.stringify(boardsObject));
}

// Enables dropping on a board column when drag interactions are active.
function allowDrop(event) {
    if (!isBoardDragInteractionEnabled()) return;
    event.preventDefault();
}

// Handles task drop events and moves tasks to the target category.
function drop(event) {
    if (!isBoardDragInteractionEnabled()) return;
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain") || currentDraggedElement?.id;
    const dropZoneId = event.currentTarget.id;
    const targetCategory = BOARD_DROP_ZONE_CATEGORY_MAP[dropZoneId];
    moveTaskToCategory(taskId, targetCategory);
}

// Moves a task to a category and persists the category change.
function moveTaskToCategory(taskId, targetCategory) {
    if (!targetCategory) return;
    const taskIndex = todos.findIndex((todo) => todo.id == taskId);
    if (taskIndex !== -1) {
        const task = todos[taskIndex];
        task.category = targetCategory;
        updateHTML();
        persistTaskCategoryToFirebase(task);
    }
}

// Handles task card click behavior, including move panel suppression.
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

// Updates the subtask progress preview on a rendered task card.
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

// Opens the task details dialog for the selected task.
function toDoCardShow(taskId) {
    const task = todos.find((t) => t.id == taskId);
    if (!task) return;
    const dialog = document.getElementById('showTaskDialog');
    dialog.dataset.taskId = taskId;
    dialog.innerHTML = getShowTaskTemplate(buildShowTaskViewData(task));
    dialog.showModal();
    document.body.style.overflow = 'hidden';
}

// Safely reads and normalizes local storage data by key.
function getFormattedLocalStorageItems(key) {
    try {
        const items = importandFormatLocalStorageData(key);
        return Array.isArray(items) ? items : [];
    } catch {
        return [];
    }
}

// Merges a new task into an existing match or inserts it as a new task.
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

// Starts drag behavior for a task card.
function drag(event) {
    if (!isBoardDragInteractionEnabled()) return event.preventDefault();
    const taskElement = event.target.closest(".task");
    if (!taskElement) return;
    currentDraggedElement = taskElement;
    event.dataTransfer.setData("text/plain", String(taskElement.id));
}

// Deletes a task locally and remotely, then updates the UI.
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
