// Hilfsfunktionen werden jetzt global aus boards-utils.js bereitgestellt
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
        const payload = await response.json();
        if (payload?.name) {
            task.firebaseKey = payload.name;
            saveBoardsToLocalStorage();
        }
    } catch (error) {
        console.error('Karte konnte nicht in Firebase gespeichert werden:', error);
    }
}

async function resolveFirebaseKeyByTaskId(taskId) {
    try {
        const response = await fetch(`${BOARD_FIREBASE_BASE_URL}boards.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const remoteBoards = await response.json() || {};
        const match = Object.entries(remoteBoards).find(([, item]) => String(item?.id) === String(taskId));
        return match?.[0] || null;
    } catch (error) {
        console.error('Firebase-Key konnte nicht aufgeloest werden:', error);
        return null;
    }
}

async function persistTaskCategoryToFirebase(task) {
    if (!task) return;
    const firebaseKey = task.firebaseKey || await resolveFirebaseKeyByTaskId(task.id);
    if (!firebaseKey) return;
    task.firebaseKey = firebaseKey;
    try {
        const response = await fetch(`${BOARD_FIREBASE_BASE_URL}boards/${firebaseKey}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: buildCategoryPatchBody(task),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        saveBoardsToLocalStorage();
    } catch (error) {
        console.error('Kategorienwechsel konnte nicht in Firebase gespeichert werden:', error);
    }
}

function buildCategoryPatchBody(task) {
    return JSON.stringify({ category: task.category });
}

async function persistTaskUpdateToFirebase(task) {
    if (!task) return { ok: false, attempted: false };
    const firebaseKey = task.firebaseKey || await resolveFirebaseKeyByTaskId(task.id);
    if (!firebaseKey) return { ok: false, attempted: false };
    task.firebaseKey = firebaseKey;
    try {
        const body = buildFirebaseTaskBody(task);
        const response = await fetch(`${BOARD_FIREBASE_BASE_URL}boards/${firebaseKey}.json`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        saveBoardsToLocalStorage();
        return { ok: true, attempted: true };
    } catch (error) {
        console.error('Karten-Aenderungen konnten nicht in Firebase gespeichert werden:', error);
        return { ok: false, attempted: true };
    }
}

function buildFirebaseTaskBody(task) {
    return JSON.stringify({
        id: task.id,
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate || '',
        priority: task.priority || 'Medium',
        category: task.category || 'toDo',
        selectedCategoryLabel: task.selectedCategoryLabel || categoryLabel(task.category || 'toDo'),
        assignedTo: Array.isArray(task.assignedTo) ? task.assignedTo : [],
        subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
        subtask: task.subtask || '',
    });
}

async function deleteTaskFromFirebase(task) {
    if (!task) return { ok: true, attempted: false };
    const firebaseKey = task.firebaseKey || await resolveFirebaseKeyByTaskId(task.id);
    if (!firebaseKey) return { ok: true, attempted: false };
    try {
        const response = await fetch(`${BOARD_FIREBASE_BASE_URL}boards/${firebaseKey}.json`, {
            method: 'DELETE',
        });
        return { ok: response.ok, attempted: true };
    } catch (error) {
        console.error('Karte konnte nicht aus Firebase geloescht werden:', error);
        return { ok: false, attempted: true };
    }
}

async function syncBoardTasksFromFirebase() {
    try {
        const response = await fetch(`${BOARD_FIREBASE_BASE_URL}boards.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const remoteBoards = await response.json() || {};
        const normalizedBoards = Object.entries(remoteBoards).reduce((result, [firebaseKey, task], index) => {
            const normalizedTask = normalizeBoardItem({ ...task, firebaseKey, id: task?.id || Date.now() + index }, index);
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

function updateHTML() {
    document.querySelectorAll('.board__list').forEach(list => { list.style.display = ''; });
    saveBoardsToLocalStorage();
    [
        { category: "toDo", cardsId: "board__cards--todo", emptyId: "noneCardTodo" },
        { category: "inProgress", cardsId: "board__cards--inprogress", emptyId: "noneCardInProgress" },
        { category: "feedback", cardsId: "board__cards--feedback", emptyId: "noneCardFeedback" },
        { category: "done", cardsId: "board__cards--done", emptyId: "noneCardDone" }
    ].forEach(renderCategoryContent);
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
    if (!query) {
        if (searchInput) {
            searchInput.setCustomValidity('Bitte gib einen Suchbegriff ein.');
            searchInput.reportValidity();
        }
        return;
    }
    if (searchInput) searchInput.setCustomValidity('');
    getBoardColumns().forEach(col => renderSearchResultColumn(col, query));
    updateTaskDraggableState();
    initializeTouchBoardDnD();
    initializeTaskMoveMenuCloseBehavior();
}

function getBoardColumns() {
    return [
        { category: 'toDo', cardsId: 'board__cards--todo', emptyId: 'noneCardTodo' },
        { category: 'inProgress', cardsId: 'board__cards--inprogress', emptyId: 'noneCardInProgress' },
        { category: 'feedback', cardsId: 'board__cards--feedback', emptyId: 'noneCardFeedback' },
        { category: 'done', cardsId: 'board__cards--done', emptyId: 'noneCardDone' },
    ];
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
    const boardsObject = todos.reduce((result, todo) => {
        const key = todo.firebaseKey || todo.id;
        result[key] = todo;
        return result;
    }, {});
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
        const task = todos[taskIndex];
        task.category = targetCategory;
        updateHTML();
        persistTaskCategoryToFirebase(task);
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
    const countEl = card.querySelector('.task__subtask-text');
    if (countEl) countEl.textContent = getSubtaskCountText(task);
    const barEl = card.querySelector('.task__progress-bar');
    if (!barEl) return;
    const total = subtasks.length, done = subtasks.filter(s => s.done).length;
    barEl.style.width = total > 0 ? `${Math.round((done / total) * 100)}%` : '0%';
    if (removeEmptyState && total === 0) barEl.style.width = '0%';
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

function drag(event) {
    if (!isBoardDragInteractionEnabled()) return event.preventDefault();
    const taskElement = event.target.closest(".task");
    if (!taskElement) return;
    currentDraggedElement = taskElement;
    event.dataTransfer.setData("text/plain", String(taskElement.id));
}

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
