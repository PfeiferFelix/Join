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
const BOARD_FIREBASE_BASE_URL = (typeof FIREBASE_BASE_URL === 'string' && FIREBASE_BASE_URL)
    ? FIREBASE_BASE_URL
    : "https://join-5bd8d-default-rtdb.europe-west1.firebasedatabase.app/";

const BOARD_DROP_ZONE_CATEGORY_MAP = {
    "board__list--todo": "toDo",
    "board__list--inprogress": "inProgress",
    "board__list--feedback": "feedback",
    "board__list--done": "done",
};

const BOARD_CATEGORY_FLOW = ['toDo', 'inProgress', 'feedback', 'done'];

async function initBoardsPage() {
    await init();
    await syncBoardContactsFromFirebase();
    await syncBoardTasksFromFirebase();
    updateBoardContactsFromLocalStorage();
    updateBoardTodosFromLocalStorage();
    updateHTML();
}

async function syncBoardContactsFromFirebase() {
    if (typeof syncContactsFromFirebaseToLocalStorage !== 'function') return;
    await syncContactsFromFirebaseToLocalStorage();
}

async function postTaskToFirebase(task) {
    try {
        const response = await fetch(`${BOARD_FIREBASE_BASE_URL}boards.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
        console.error('Karte konnte nicht in Firebase gespeichert werden:', error);
    }
}

async function syncBoardTasksFromFirebase() {
    try {
        const response = await fetch(`${BOARD_FIREBASE_BASE_URL}boards.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const remoteBoards = await response.json() || {};
        const normalizedBoards = Object.entries(remoteBoards).reduce((result, [firebaseKey, task], index) => {
            const normalizedTask = normalizeBoardItem({ ...task, id: task?.id || Date.now() + index }, index);
            result[firebaseKey] = normalizedTask;
            return result;
        }, {});
        localStorage.setItem("boards", JSON.stringify(normalizedBoards));
    } catch (error) {
        console.error('Board-Karten konnten nicht aus Firebase geladen werden:', error);
    }
}

function updateBoardContactsFromLocalStorage() {
    contactsLS = getFormattedLocalStorageItems("contacs");
    contacts = normalizeContacts(contactsLS, defaultContacts);
}

function updateBoardTodosFromLocalStorage() {
    boardsLS = getFormattedLocalStorageItems("boards");
    todos = normalizeBoards(boardsLS);
}

function getLimitedSubtasks(input) {
    const source = Array.isArray(input) ? input : [input];
    return source
        .map(item => typeof item === 'string' ? { title: item, done: false } : item)
        .map(item => ({ title: (item?.title || '').trim(), done: Boolean(item?.done), }))
        .filter(item => item.title).slice(0, 2);
}

function updateHTML() {
    document.querySelectorAll('.board__list').forEach(list => { list.style.display = ''; });
    saveBoardsToLocalStorage();
    renderCategoryContent({ category: "toDo", cardsId: "board__cards--todo", emptyId: "noneCardTodo" });
    renderCategoryContent({ category: "inProgress", cardsId: "board__cards--inprogress", emptyId: "noneCardInProgress" });
    renderCategoryContent({ category: "feedback", cardsId: "board__cards--feedback", emptyId: "noneCardFeedback" });
    renderCategoryContent({ category: "done", cardsId: "board__cards--done", emptyId: "noneCardDone" });
    updateTaskDraggableState();
    initializeTouchBoardDnD();
    initializeBoardViewportBehavior();
    initializeTaskMoveMenuCloseBehavior();
}

function isBoardDragInteractionEnabled() {
    return window.innerWidth >= BOARD_TOUCH_DND_MIN_WIDTH;
}

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

function updateTaskDraggableState() {
    const isDragEnabled = isBoardDragInteractionEnabled();
    document.querySelectorAll('.task').forEach(task => {
        task.draggable = isDragEnabled;
        bindTaskDragEvents(task);
    });
}

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

function closeDialog() {
    const addTaskDialog = document.getElementById("addTaskDialog");
    const showTaskDialog = document.getElementById("showTaskDialog");
    const editTaskDialog = document.getElementById("editTaskDialog");
    if (addTaskDialog?.open) addTaskDialog.close();
    if (showTaskDialog?.open) showTaskDialog.close();
    if (editTaskDialog?.open) editTaskDialog.close();
    document.body.style.overflow = '';
}

function renderCategoryContent({ category, cardsId, emptyId }) {
    const container = document.getElementById(cardsId);
    const noCardElement = document.getElementById(emptyId);
    if (!container || !noCardElement) return;
    const categoryTasks = todos.filter(todo => todo.category === category);
    container.innerHTML = categoryTasks.map(todo => generateTodoHTML(buildTodoCardTemplateData(todo))).join('');
    noCardElement.style.display = categoryTasks.length === 0 ? 'flex' : 'none';
}

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

function searchCard(event) {
    event.preventDefault();
    const searchInput = event.currentTarget?.querySelector('input[name="search"]');
    const query = (searchInput?.value || '').trim().toLowerCase();
    if (!query) return searchInput ? (searchInput.setCustomValidity('Bitte gib einen Suchbegriff ein.'), searchInput.reportValidity()) : undefined;
    if (searchInput) searchInput.setCustomValidity('');
    const columns = [
        { category: 'toDo', cardsId: 'board__cards--todo', emptyId: 'noneCardTodo' },
        { category: 'inProgress', cardsId: 'board__cards--inprogress', emptyId: 'noneCardInProgress' },
        { category: 'feedback', cardsId: 'board__cards--feedback', emptyId: 'noneCardFeedback' },
        { category: 'done', cardsId: 'board__cards--done', emptyId: 'noneCardDone' },
    ];
    columns.forEach(col => renderSearchResultColumn(col, query));
    updateTaskDraggableState();
    initializeTouchBoardDnD();
    initializeTaskMoveMenuCloseBehavior();
}

function clearSearch(event) {
    event.currentTarget?.setCustomValidity('');
    if (event.currentTarget?.value.trim()) return;
    updateHTML();
}

function resetSearchOnEscape(event) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.currentTarget.value = '';
    updateHTML();
}

function saveBoardsToLocalStorage() {
    const boardsObject = todos.reduce((result, todo) => { result[todo.id] = todo; return result; }, {});
    localStorage.setItem("boards", JSON.stringify(boardsObject));
}

function allowDrop(event) {
    if (!isBoardDragInteractionEnabled()) return;
    event.preventDefault();
}

function drop(event) {
    if (!isBoardDragInteractionEnabled()) return;
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain") || currentDraggedElement?.id;
    const dropZoneId = event.currentTarget.id;
    const targetCategory = BOARD_DROP_ZONE_CATEGORY_MAP[dropZoneId];
    moveTaskToCategory(taskId, targetCategory);
}

function moveTaskToCategory(taskId, targetCategory) {
    if (!targetCategory) return;
    const taskIndex = todos.findIndex((todo) => todo.id == taskId);
    if (taskIndex !== -1) {
        todos[taskIndex].category = targetCategory;
        updateHTML();
    }
}

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

    const countEl = card.querySelector('#subtaskCount');
    if (countEl) countEl.textContent = getSubtaskCountText(task);
    const barEl = card.querySelector('.subtask');
    if (!barEl) return;

    const doneCount = subtasks.filter(s => s.done).length;
    barEl.classList.toggle('subtask--active', doneCount > 0);
    barEl.classList.toggle('subtask--done', doneCount === subtasks.length && subtasks.length > 0);
    if (removeEmptyState && subtasks.length === 0) barEl.classList.remove('subtask--active', 'subtask--done');
}

function normalizeContacts(items, fallback) {
    const source = Array.isArray(items) && items.length ? items : fallback;
    return source.filter(Boolean).map((contact, index) => ({
        id: Number(contact?.id) || index + 1,
        name: contact?.name || contact?.Name || '',
        abbreviation: contact?.abbreviation || contact?.initials || buildInitials(contact?.name || contact?.Name || ''),
    })).filter(contact => contact.name);
}

function toDoCardShow(taskId) {
    const task = todos.find((t) => t.id == taskId);
    if (!task) return;
    const dialog = document.getElementById('showTaskDialog');
    dialog.dataset.taskId = taskId;
    dialog.innerHTML = getShowTaskTemplate(buildShowTaskViewData(task));
    dialog.showModal();
    document.body.style.overflow = 'hidden';
}

function getFormattedLocalStorageItems(key) {
    try {
        const items = importandFormatLocalStorageData(key);
        return Array.isArray(items) ? items : [];
    } catch {
        return [];
    }
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

function mergeOrInsertTodo(newTodo) {
    const existingTodo = todos.find(todo => todo.title === newTodo.title && todo.description === newTodo.description && todo.dueDate === newTodo.dueDate && todo.priority === newTodo.priority && todo.category === newTodo.category);
    if (!existingTodo) return todos.push(newTodo);
    if (!Array.isArray(existingTodo.assignedTo)) existingTodo.assignedTo = [];
    newTodo.assignedTo.forEach(contact => { if (!existingTodo.assignedTo.some(user => user.id === contact.id)) existingTodo.assignedTo.push(contact); });
}

function drag(event) {
    if (!isBoardDragInteractionEnabled()) {
        event.preventDefault();
        return;
    }
    const taskElement = event.target.closest(".task");
    if (!taskElement) return;
    currentDraggedElement = taskElement;
    event.dataTransfer.setData("text/plain", String(taskElement.id));
}

function deleteTask(taskId) {
    const taskIndex = todos.findIndex((t) => t.id == taskId);
    if (taskIndex !== -1) {
        todos.splice(taskIndex, 1);
        updateHTML();
        closeDialog();
    }
}
