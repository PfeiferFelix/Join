let boardsLS = getFormattedLocalStorageItems("boards");
let contactsLS = getFormattedLocalStorageItems("contacs");

let defaultContacts = [
    { id: 1, name: "David G.", abbreviation: "DG" },
    { id: 2, name: "Anna S.", abbreviation: "AS" },
    { id: 3, name: "John D.", abbreviation: "JD" },
    { id: 4, name: "Anton Mayer", abbreviation: "AM" },
    { id: 5, name: "Bene Mayer", abbreviation: "BM" },
    { id: 6, name: "Bernd Mayer", abbreviation: "BM" },
];

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

function getFormattedLocalStorageItems(key) {
    try {
        const items = importandFormatLocalStorageData(key);
        return Array.isArray(items) ? items : [];
    } catch {
        return [];
    }
}

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

function normalizeBoards(items) {
    if (!Array.isArray(items)) return [];

    return items
        .filter(Boolean)
        .map((board, index) => {
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
        })
        .filter(board => board.title);
}

function buildInitials(name) {
    return (name || '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join('');
}

function saveBoardsToLocalStorage() {
    const boardsObject = todos.reduce((result, todo) => {
        result[todo.id] = todo;
        return result;
    }, {});

    localStorage.setItem("boards", JSON.stringify(boardsObject));
}

function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    const taskElement = event.target.closest(".task");
    if (!taskElement) return;
    currentDraggedElement = taskElement;
    event.dataTransfer.setData("text/plain", String(taskElement.id));
}

function handleTaskClick(event, taskId) {
    if (suppressNextTaskClick) {
        suppressNextTaskClick = false;
        event.preventDefault();
        event.stopPropagation();
        return;
    }

    toDoCardShow(taskId);
}

function isTouchBoardDnDEnabled() {
    return false;
}

function openTaskMovePanel(event, taskId) {
    event.preventDefault();
    event.stopPropagation();
    const panel = document.getElementById(`task-move-panel-${taskId}`);
    const toggleButton = document.getElementById(`task-move-btn-${taskId}`);
    if (!panel) return;

    closeAllTaskMovePanels();
    panel.removeAttribute('hidden');
    panel.classList.add('task-move-panel--open');
    if (toggleButton) {
        toggleButton.classList.add('task__moveto-btn--open');
        toggleButton.setAttribute('aria-expanded', 'true');
    }
}

function closeTaskMovePanel(event, taskId) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const panel = document.getElementById(`task-move-panel-${taskId}`);
    const toggleButton = document.getElementById(`task-move-btn-${taskId}`);
    if (!panel) return;

    panel.classList.remove('task-move-panel--open');
    if (toggleButton) {
        toggleButton.classList.remove('task__moveto-btn--open');
        toggleButton.setAttribute('aria-expanded', 'false');
    }
    setTimeout(() => {
        panel.setAttribute('hidden', '');
    }, 200);
}

function closeAllTaskMovePanels() {
    document.querySelectorAll('.task-move-panel--open').forEach(panel => {
        const taskId = panel.id.replace('task-move-panel-', '');
        closeTaskMovePanel(null, taskId);
    });
}

function moveTaskFromMenu(event, taskId, targetCategory) {
    event.preventDefault();
    event.stopPropagation();
    moveTaskToCategory(taskId, targetCategory);
    closeTaskMovePanel(null, taskId);
}

function getNextBoardCategory(category) {
    const currentIndex = BOARD_CATEGORY_FLOW.indexOf(category);
    if (currentIndex === -1) {
        return BOARD_CATEGORY_FLOW[0];
    }

    const nextIndex = (currentIndex + 1) % BOARD_CATEGORY_FLOW.length;
    return BOARD_CATEGORY_FLOW[nextIndex];
}

function getBoardColumnLabel(category) {
    if (category === 'toDo') return 'To Do';
    if (category === 'inProgress') return 'In Progress';
    if (category === 'feedback') return 'Awaiting Feedback';
    if (category === 'done') return 'Done';
    return 'Next Step';
}

function getMoveDirectionArrow(currentCategory, targetCategory) {
    if (!targetCategory) return '→';

    const currentIndex = BOARD_CATEGORY_FLOW.indexOf(currentCategory);
    const targetIndex = BOARD_CATEGORY_FLOW.indexOf(targetCategory);

    if (currentIndex === -1 || targetIndex === -1) return '→';
    if (targetIndex > currentIndex) return '↓';
    if (targetIndex < currentIndex) return '↑';
    return '→';
}

function moveTaskToNextCategory(event, taskId) {
    event.preventDefault();
    event.stopPropagation();

    const task = todos.find(todo => todo.id == taskId);
    if (!task) return;

    const nextCategory = getNextBoardCategory(task.category);
    if (!nextCategory) return;

    moveTaskToCategory(taskId, nextCategory);
    closeTaskMovePanel(null, taskId);
}

function openTaskReviewDialogFromMenu(event, taskId) {
    event.preventDefault();
    event.stopPropagation();
    closeTaskMovePanel(null, taskId);
    toDoCardShow(taskId);
}

function initializeTaskMoveMenuCloseBehavior() {
    if (taskMoveMenuCloseListenerBound) return;

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.task-move-panel') && !event.target.closest('.task__moveto-btn')) {
            closeAllTaskMovePanels();
        }
    });

    taskMoveMenuCloseListenerBound = true;
}

function clearTouchDropHighlights() {
    document.querySelectorAll('.board__list--touch-target').forEach(list => {
        list.classList.remove('board__list--touch-target');
    });
}

function getTouchDropZone(clientX, clientY) {
    const element = document.elementFromPoint(clientX, clientY);
    const list = element?.closest('.board__list');
    if (!list) return null;

    return BOARD_DROP_ZONE_CATEGORY_MAP[list.id] ? list : null;
}

function finishTouchDrag(targetList = null) {
    if (!activeTouchDrag) return;

    const { taskElement, taskId, moved } = activeTouchDrag;
    taskElement.classList.remove('task--touch-dragging');

    if (moved) {
        suppressNextTaskClick = true;
        const targetCategory = targetList ? BOARD_DROP_ZONE_CATEGORY_MAP[targetList.id] : null;
        if (targetCategory) {
            moveTaskToCategory(taskId, targetCategory);
        }
    }

    clearTouchDropHighlights();
    activeTouchDrag = null;
}

function handleTaskTouchStart(event) {
    if (!isTouchBoardDnDEnabled() || event.touches.length !== 1) return;

    const taskElement = event.currentTarget;
    const touch = event.touches[0];
    if (!taskElement || !touch) return;

    activeTouchDrag = {
        taskElement,
        taskId: taskElement.id,
        startX: touch.clientX,
        startY: touch.clientY,
        moved: false,
        currentDropZone: null,
    };
}

function handleTaskTouchMove(event) {
    if (!activeTouchDrag || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - activeTouchDrag.startX);
    const deltaY = Math.abs(touch.clientY - activeTouchDrag.startY);

    if (!activeTouchDrag.moved && deltaX < 10 && deltaY < 10) {
        return;
    }

    activeTouchDrag.moved = true;
    event.preventDefault();
    activeTouchDrag.taskElement.classList.add('task--touch-dragging');

    const nextDropZone = getTouchDropZone(touch.clientX, touch.clientY);
    if (activeTouchDrag.currentDropZone !== nextDropZone) {
        clearTouchDropHighlights();
        if (nextDropZone) {
            nextDropZone.classList.add('board__list--touch-target');
        }
        activeTouchDrag.currentDropZone = nextDropZone;
    }
}

function handleTaskTouchEnd() {
    finishTouchDrag(activeTouchDrag?.currentDropZone || null);
}

function initializeTouchBoardDnD() {
    document.querySelectorAll('.task').forEach(task => {
        if (task.dataset.touchDndBound === 'true') return;

        task.addEventListener('touchstart', handleTaskTouchStart, { passive: true });
        task.addEventListener('touchmove', handleTaskTouchMove, { passive: false });
        task.addEventListener('touchend', handleTaskTouchEnd);
        task.addEventListener('touchcancel', handleTaskTouchEnd);
        task.dataset.touchDndBound = 'true';
    });
}

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

function getSubtaskCountText(todo) {
    const count = getLimitedSubtasks(todo?.subtasks).length;
    return `${count} / 2`;
}

function updateNewSubtaskInputVisibility(list, subtasks = []) {
    const inputWrapper = list?.querySelector('.subtask-input');
    if (!inputWrapper) return;

    inputWrapper.hidden = getLimitedSubtasks(subtasks).length >= 2;
}

function getAssignedUserWithNameTemplate(user, index) {
    const abbreviation = user?.abbreviation || '';
    const userName = user?.name || abbreviation || 'Unknown User';
    const colorIndex = (index % 5) + 1;

    return `
        <div class="assigned-user-row">
            <svg class="assigned-user-avatar assigned-user-avatar--${colorIndex}" width="40" height="40" viewBox="0 0 80 80" aria-hidden="true">
                <circle class="header__circle" cx="40" cy="40" r="38" stroke="#ffffff" stroke-width="4" />
                <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="28" font-family="Inter, sans-serif" fill="#fff" font-weight="700">${abbreviation}</text>
            </svg>
            <span class="assigned-user-name">${userName}</span>
        </div>
    `;
}

function renderEditSubtaskItems(list, subtasks, taskId) {
    list.querySelectorAll('.subtask-item').forEach(item => item.remove());
    const container = list.querySelector('.subtask-container__list');
    if (!container) return;

    container.insertAdjacentHTML('afterbegin', subtasks.map((subtask, index) => `
        <li class="subtask-item" data-subtask-index="${index}">
            <span class="subtask-item__title">${subtask.title}</span>
            <div class="subtask-item__actions">
                <button type="button" class="edit-subtask-btn" onclick="editSubtaskItem(${taskId}, ${index})">&#9998;</button>
                <button type="button" class="clear-subtasks-btn" onclick="deleteSubtaskItem(${taskId}, ${index})">&#128465;</button>
            </div>
        </li>
    `).join(''));

    updateNewSubtaskInputVisibility(list, subtasks);
}

function handleNewSubtaskInputKey(event, taskId) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addNewSubtask(taskId);
}

function addNewSubtask(taskId) {
    const dialog = document.getElementById('editTaskDialog');
    if (!dialog) return;

    const input = dialog.querySelector('#new-subtask-input');
    const hiddenInput = dialog.querySelector('#edit-subtasks-data');
    const list = dialog.querySelector('.subtask-list');
    if (!input || !hiddenInput || !list) return;

    const title = input.value.trim();
    if (!title) return;

    const currentSubtasks = getLimitedSubtasks(JSON.parse(hiddenInput.value || '[]'));
    if (currentSubtasks.length >= 2) {
        input.value = '';
        updateNewSubtaskInputVisibility(list, currentSubtasks);
        return;
    }

    const updatedSubtasks = getLimitedSubtasks([...currentSubtasks, { title, done: false }]);
    hiddenInput.value = JSON.stringify(updatedSubtasks);
    renderEditSubtaskItems(list, updatedSubtasks, taskId);
    input.value = '';

    const task = todos.find(t => t.id == taskId);
    if (!task) return;

    task.subtasks = updatedSubtasks;
    task.subtask = updatedSubtasks[0]?.title || '';
    updateHTML();
}

function editSubtaskItem(taskId, index) {
    const item = document.querySelector(`[data-subtask-index="${index}"]`);
    if (!item) return;
    const titleSpan = item.querySelector('.subtask-item__title');
    const currentTitle = titleSpan?.textContent.trim() || '';
    titleSpan.outerHTML = `<input type="text" class="task-form__input subtask-item__input" value="${currentTitle}" onkeydown="saveSubtaskItem(event, ${taskId}, ${index})">`;
    const editBtn = item.querySelector('.edit-subtask-btn');
    editBtn.innerHTML = '&#10003;';
    editBtn.setAttribute('onclick', `saveSubtaskItem(null, ${taskId}, ${index})`);
    item.querySelector('.subtask-item__input')?.focus();
}

function saveSubtaskItem(event, taskId, index) {
    if (event && event.key !== 'Enter') return;
    if (event) event.preventDefault();
    const task = todos.find(t => t.id == taskId);
    if (!task) return;
    const item = document.querySelector(`[data-subtask-index="${index}"]`);
    const input = item?.querySelector('.subtask-item__input');
    const newTitle = input?.value.trim();
    if (!newTitle) return;
    const subtasks = getLimitedSubtasks(task.subtasks);
    subtasks[index].title = newTitle;
    task.subtasks = subtasks;
    const hiddenInput = document.querySelector('#edit-subtasks-data');
    if (hiddenInput) hiddenInput.value = JSON.stringify(subtasks);
    saveBoardsToLocalStorage();
    const list = document.querySelector('.subtask-list');
    if (list) renderEditSubtaskItems(list, subtasks, taskId);
}

function deleteSubtaskItem(taskId, index) {
    const task = todos.find(t => t.id == taskId);
    if (!task) return;
    const subtasks = getLimitedSubtasks(task.subtasks);
    subtasks.splice(index, 1);
    task.subtasks = subtasks;
    const hiddenInput = document.querySelector('#edit-subtasks-data');
    if (hiddenInput) hiddenInput.value = JSON.stringify(subtasks);
    saveBoardsToLocalStorage();
    const list = document.querySelector('.subtask-list');
    if (list) renderEditSubtaskItems(list, subtasks, taskId);
}

function editSubtask(taskId) {
    const dialog = document.getElementById('editTaskDialog');
    if (!dialog) return;

    const button = dialog.querySelector('.edit-subtask-btn');
    const list = dialog.querySelector('.subtask-list');
    const hiddenInput = dialog.querySelector('#edit-subtasks-data');
    if (!button || !list || !hiddenInput) return;

    const isSaveMode = button.dataset.mode === 'save';
    const savedSubtasks = getLimitedSubtasks(JSON.parse(hiddenInput.value || '[]'));

    if (!isSaveMode) {
        const currentTitle = savedSubtasks[0]?.title || '';
        const currentDone = Boolean(savedSubtasks[0]?.done);
        list.querySelectorAll('.subtask-item').forEach(item => item.remove());
        button.insertAdjacentHTML('beforebegin', `<li class="subtask-item"><input class="task-form__input" id="edit-subtask-input" type="text" value="${currentTitle}"></li>`);
        button.innerHTML = '&#10003;';
        button.dataset.mode = 'save';
        hiddenInput.value = JSON.stringify([{ title: currentTitle, done: currentDone }]);
        return;
    }

    const editedValue = dialog.querySelector('#edit-subtask-input')?.value.trim() || '';
    const doneState = Boolean(savedSubtasks[0]?.done);
    const updatedSubtasks = getLimitedSubtasks(editedValue ? [{ title: editedValue, done: doneState }] : []);

    hiddenInput.value = JSON.stringify(updatedSubtasks);
    renderEditSubtaskItems(list, updatedSubtasks);
    button.innerHTML = '&#9998;';
    button.dataset.mode = 'edit';

    const task = todos.find(t => t.id == taskId);
    if (!task) return;

    task.subtasks = updatedSubtasks;
    task.subtask = updatedSubtasks[0]?.title || '';
    updateHTML();
}

function clearSubtasks(taskId) {
    const dialog = document.getElementById('editTaskDialog');
    const input = dialog?.querySelector('#new-subtask-input');
    if (!input) return;

    input.value = '';
    input.focus();
}

function toggleAllSubtasks(checkbox) {
    const dialog = document.getElementById('editTaskDialog');
    const taskId = Number(dialog?.dataset?.taskId);
    const task = todos.find(t => t.id == taskId);
    if (!task) return;

    const subtasks = getLimitedSubtasks(task.subtasks).map(subtask => ({
        ...subtask,
        done: Boolean(checkbox?.checked),
    }));

    task.subtasks = subtasks;
    saveBoardsToLocalStorage();
    updateHTML();
}

function toggleSubtask(taskId, index) {
    const task = todos.find(t => t.id == taskId);
    if (!task) return;
    const subtasks = getLimitedSubtasks(task.subtasks);
    if (!subtasks[index]) return;
    subtasks[index].done = !subtasks[index].done;
    task.subtasks = subtasks;
    saveBoardsToLocalStorage();
    const masterCheckbox = document.getElementById('selectSubtasks');
    if (masterCheckbox) {
        masterCheckbox.checked = subtasks.every(s => s.done);
    }
}

function moveTaskToCategory(taskId, targetCategory) {
    if (!targetCategory) return;
    const taskIndex = todos.findIndex((todo) => todo.id == taskId);
    if (taskIndex !== -1) {
        todos[taskIndex].category = targetCategory;
        updateHTML();
    }
}

function drop(event) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain") || currentDraggedElement?.id;
    const dropZoneId = event.currentTarget.id;
    const targetCategory = BOARD_DROP_ZONE_CATEGORY_MAP[dropZoneId];
    moveTaskToCategory(taskId, targetCategory);
}

function moveTo(event) {
    const targetCategory = event.currentTarget.dataset.category;
    moveTaskToCategory(event.target.id, targetCategory);
}

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

function buildTodoCardTemplateData(todo) {
    const fixedHeaderLabel = todo.selectedCategoryLabel || categoryLabel(todo.category);
    const priorityLabel = todo.priority || 'Medium';
    const iconClass = getPriorityIconClass(priorityLabel);
    const subtasks = getLimitedSubtasks(todo?.subtasks);
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
        assignedUsersHTML: Array.isArray(todo.assignedTo)
            ? todo.assignedTo.map((user, index) => getCircleUserTemplate(user.abbreviation || '', index)).join('')
            : '',
        subtaskCountText: getSubtaskCountText(todo),
        hasSubtasks,
        nextMoveArrow: getMoveDirectionArrow(todo.category, nextCategory),
        nextMoveLabel: `${getBoardColumnLabel(nextCategory)}`,
        nextMoveDisabled: false,
    };
}

function buildEditTaskFormTemplateData(task) {
    const fixedHeaderLabel = task.selectedCategoryLabel || categoryLabel(task.category);
    const categoryOptions = ['Technical Task', 'User Story'];
    const subtasks = getLimitedSubtasks(task.subtasks);

    return {
        id: task.id,
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate || '',
        priority: task.priority,
        assignedUsersHTML: Array.isArray(task.assignedTo)
            ? task.assignedTo.map((user, index) => getCircleUserTemplate(user.abbreviation || '', index)).join('')
            : '',
        editSubtasksHTML: subtasks.map((subtask, index) => `<li class="subtask-item" data-subtask-index="${index}">${subtask.title}</li>`).join(''),
        subtasksHTML: subtasks.map((subtask, index) => `<li class="subtask-item" data-subtask-index="${index}">${subtask.title}</li>`).join(''),
        subtasks,
        categoryOptionsHTML: categoryOptions.map(option => {
            const selected = option === fixedHeaderLabel ? 'selected' : '';
            return `<option value="${option}" ${selected}>${option}</option>`;
        }).join(''),
    };
}

function buildEditTaskDetailTemplateData(task) {
    const fixedHeaderLabel = task.selectedCategoryLabel || categoryLabel(task.category);
    const priorityLabel = task.priority || '';
    const iconClass = getPriorityIconClass(priorityLabel);
    const priorityIcon = iconClass === 'up' ? '⟪' : iconClass === 'down' ? '⟫' : '‖';
    const priorityText = priorityLabel === '⟪' ? 'Urgent'
        : priorityLabel === '‖' ? 'Medium'
            : priorityLabel === '⟫' ? 'Low'
                : (priorityLabel || 'Medium');
    const subtasks = getLimitedSubtasks(task.subtasks);
    const subtasksHTML = subtasks.map((subtask, index) => `<li class="subtask-item" data-subtask-index="${index}">${subtask.title}</li>`).join('');
    const allSubtasksDone = subtasks.length > 0 && subtasks.every(s => Boolean(s.done));

    return {
        id: task.id,
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate || '',
        fixedHeaderLabel,
        headerClass: getCategoryHeaderClass(fixedHeaderLabel),
        assignedUsersHTML: Array.isArray(task.assignedTo)
            ? task.assignedTo
                .map((user, index) => getAssignedUserWithNameTemplate(user, index))
                .join('')
            : '',
        subtaskCountText: getSubtaskCountText(task),
        firstSubtaskDone: Boolean(subtasks[0]?.done),
        firstSubtaskTitle: subtasks[0]?.title || '',
        subtasksListHTML: subtasksHTML,
        subtasksHTML,
        subtasks,
        allSubtasksDone,
        priorityLabel: priorityText,
        iconClass,
        priorityIcon,
    };
}

function updateHTML() {
    saveBoardsToLocalStorage();
    renderCategoryContent({ category: "toDo", cardsId: "board__cards--todo", emptyId: "noneCardTodo" });
    renderCategoryContent({ category: "inProgress", cardsId: "board__cards--inprogress", emptyId: "noneCardInProgress" });
    renderCategoryContent({ category: "feedback", cardsId: "board__cards--feedback", emptyId: "noneCardFeedback" });
    renderCategoryContent({ category: "done", cardsId: "board__cards--done", emptyId: "noneCardDone" });
    initializeTouchBoardDnD();
    initializeTaskMoveMenuCloseBehavior();
}

//DRAG AND DROP ENDE
function addTask(category) {
    const dialog = document.getElementById("addTaskDialog");
    dialog.dataset.category = category || "";
    renderDialogContent();
    dialog.showModal();
    document.body.style.overflow = 'hidden';
}
function addTaskToDo() {
    addTask("toDo");
}
function addTaskInProgress() {
    addTask("inProgress");
}
function addTaskFeedback() {
    addTask("feedback");
}
function addTaskDone() {
    addTask("done");
}

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
function categoryLabel(category) {
    if (category === "toDo") return "Technical Task";
    else if (category === "inProgress") return "User Story";
    else if (category === "feedback") return "Awaiting Feedback";
    else if (category === "done") return "Done";
    else return "";
}

function renderDialogContent() {
    const dialog = document.getElementById("addTaskDialog");
    dialog.innerHTML = getaddTaskTemplateDialog();
    // Event-Listener für das Formular hinzufügen
    const form = dialog.querySelector(".task-form");
    if (form) {
        form.addEventListener("submit", handleCreateTask);
    }
    // Cancel-Button leert das Formular und schließt den Dialog
    const cancelBtn = dialog.querySelector("#cancel-btn");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            form.reset();
        });
    }

    setupAssignedToMultiselect(dialog);
    // Kategorien dynamisch einfügen
    const categorySelect = dialog.querySelector("#category");
    if (categorySelect) {
        categories.forEach((cat) => {
            categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
    }

    // Prioritäts-Button-Listener setzen
    const priorityurgent = document.getElementById("priority-urgent");
    const priorityMedium = document.getElementById("priority-medium");
    const priorityLow = document.getElementById("priority-low");
    priorityurgent.classList.remove("priority-buttons__btn--urgent");
    priorityMedium.classList.remove("priority-buttons__btn--medium");
    priorityLow.classList.remove("priority-buttons__btn--low");
    if (priorityurgent) {
        priorityurgent.addEventListener("click", () => {
            priorityurgent.classList.toggle("priority-buttons__btn--urgent");
            priorityMedium.classList.remove("priority-buttons__btn--medium");
            priorityLow.classList.remove("priority-buttons__btn--low");
        });
    }
    if (priorityMedium) {
        priorityMedium.addEventListener("click", () => {
            priorityMedium.classList.toggle("priority-buttons__btn--medium");
            priorityurgent.classList.remove("priority-buttons__btn--urgent");
            priorityLow.classList.remove("priority-buttons__btn--low");
        });
    }
    if (priorityLow) {
        priorityLow.addEventListener("click", () => {
            priorityLow.classList.toggle("priority-buttons__btn--low");
            priorityurgent.classList.remove("priority-buttons__btn--urgent");
            priorityMedium.classList.remove("priority-buttons__btn--medium");
        });
    }
}

function setupAssignedToMultiselect(dialog, config = {}) {
    const {
        triggerId = 'assigned-to-trigger',
        checkboxContainerId = 'assigned-to-checkboxes',
        summaryId = 'assigned-to-summary',
        wrapperId = 'assigned-to-multiselect',
        optionIdPrefix = 'assigned-to',
        preselectedIds = [],
    } = config;

    const trigger = dialog.querySelector(`#${triggerId}`);
    const checkboxContainer = dialog.querySelector(`#${checkboxContainerId}`);
    const summary = dialog.querySelector(`#${summaryId}`);
    if (!trigger || !checkboxContainer || !summary) return;

    checkboxContainer.innerHTML = contacts.map(contact => `
        <label for="${optionIdPrefix}-${contact.id}">
            <input type="checkbox" id="${optionIdPrefix}-${contact.id}" value="${contact.id}" ${preselectedIds.includes(contact.id) ? 'checked' : ''}> ${contact.name}
        </label>
    `).join('');

    const setSummary = () => {
        const selectedNames = Array.from(checkboxContainer.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.parentElement?.textContent?.trim())
            .filter(Boolean);
        summary.textContent = selectedNames.length > 0 ? selectedNames.join(', ') : 'Select contacts to assign';
    };

    checkboxContainer.removeAttribute('hidden');

    const openDropdown = () => {
        checkboxContainer.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
    };

    const closeDropdown = () => {
        checkboxContainer.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
    };

    const toggle = (event) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const isOpen = checkboxContainer.classList.contains('is-open');
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    };

    trigger.addEventListener('click', toggle);
    trigger.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            toggle(event);
        }
    });

    checkboxContainer.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    checkboxContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', setSummary);
    });

    dialog.addEventListener('click', (event) => {
        const wrapper = dialog.querySelector(`#${wrapperId}`);
        if (!wrapper) return;
        if (!wrapper.contains(event.target)) {
            closeDropdown();
        }
    });

    closeDropdown();
    setSummary();
}

// Liest die Formulardaten aus und erstellt ein neues Todo
function handleCreateTask(event) {
    event.preventDefault();
    const dialog = document.getElementById("addTaskDialog");
    const title = dialog.querySelector("#title").value.trim();
    const description = dialog.querySelector("#description").value.trim();
    const dueDate = dialog.querySelector("#due-date").value;
    const priority = getSelectedPriority(dialog);
    const assignedToCheckboxes = dialog.querySelectorAll('#assigned-to-checkboxes input[type="checkbox"]:checked');
    const selectedIds = Array.from(assignedToCheckboxes)
        .map(checkbox => Number(checkbox.value))
        .filter(id => Number.isFinite(id));
    const assignedTo = contacts.filter(contact => selectedIds.includes(contact.id));
    const categoryValue = dialog.querySelector('#category').value;
    const selectedCategoryLabel = categoryValue || 'Technical Task';
    const presetCategory = dialog.dataset.category;
    // Wenn über Spalten-Button geöffnet, bleibt die Zielspalte fix.
    // Nur beim globalen "Add Task +" (ohne preset) wird aus dem Select gemappt.
    let category = "toDo";
    if (presetCategory) {
        category = presetCategory;
    } else if (categoryValue === "Technical Task") {
        category = "toDo";
    } else if (categoryValue === "User Story") {
        category = "inProgress";
    }
    const subtaskInput = dialog.querySelector('#subtask-input')?.value || '';
    const subtasks = getLimitedSubtasks(subtaskInput);
    const subtask = subtasks[0]?.title || '';
    // Neues Todo-Objekt
    const newTodo = {
        id: Date.now(),
        title,
        description,
        dueDate,
        priority,
        priorityClass: getPriorityIconClass(priority),
        assignedTo,
        category,
        selectedCategoryLabel,
        subtasks,
        subtask,
    };

    const existingTodo = todos.find(todo =>
        todo.title === newTodo.title &&
        todo.description === newTodo.description &&
        todo.dueDate === newTodo.dueDate &&
        todo.priority === newTodo.priority &&
        todo.category === newTodo.category
    );

    if (existingTodo) {
        if (!Array.isArray(existingTodo.assignedTo)) {
            existingTodo.assignedTo = [];
        }

        assignedTo.forEach(contact => {
            const alreadyAssigned = existingTodo.assignedTo.some(user => user.id === contact.id);
            if (!alreadyAssigned) {
                existingTodo.assignedTo.push(contact);
            }
        });
    } else {
        todos.push(newTodo);
    }

    updateHTML();
    closeDialog();
}

function getSelectedPriority(dialog) {
    const priorityUrgent = dialog.querySelector("#priority-urgent");
    const priorityMedium = dialog.querySelector("#priority-medium");
    const priorityLow = dialog.querySelector("#priority-low");
    if (!priorityUrgent || !priorityMedium || !priorityLow) {
        return "None";
    }
    if (priorityUrgent.classList.contains("priority-buttons__btn--urgent")) {
        return "⟪";
    } else if (priorityMedium.classList.contains("priority-buttons__btn--medium")) {
        return "‖";
    } else if (priorityLow.classList.contains("priority-buttons__btn--low")) {
        return "⟫";
    } else {
        return "None";
    }
}

function getPriorityIconClass(priority) {
    if (priority === "Urgent" || priority === "⟪") return "up";
    if (priority === "Medium" || priority === "‖") return "medium";
    if (priority === "Low" || priority === "⟫") return "down";
    return "medium";
}

function getCategoryHeaderClass(label) {
    if (label === 'Technical Task') return 'TechnicalTask';
    if (label === 'User Story') return 'UserStory';
    return '';
}

function toDoCardShow(taskId) {
    const task = todos.find((t) => t.id == taskId);
    if (!task) return;
    const dialog = document.getElementById("editTaskDialog");
    dialog.dataset.taskId = taskId;
    dialog.innerHTML = getShowTaskTemplate(buildEditTaskDetailTemplateData(task));
    dialog.showModal();
    document.body.style.overflow = 'hidden';
}

function editTask(taskId) {
    const task = todos.find((t) => t.id == taskId);
    if (!task) return;
    const dialog = document.getElementById("editTaskDialog");
    dialog.dataset.taskId = taskId;
    dialog.innerHTML = getEditTaskFormTemplate(buildEditTaskFormTemplateData(task));
    const subtaskList = dialog.querySelector('.subtask-list');
    if (subtaskList) {
        updateNewSubtaskInputVisibility(subtaskList, task.subtasks || []);
    }

    setupAssignedToMultiselect(dialog, {
        triggerId: 'edit-assigned-to-trigger',
        checkboxContainerId: 'edit-assigned-to-checkboxes',
        summaryId: 'edit-assigned-to-summary',
        wrapperId: 'edit-assigned-to-multiselect',
        optionIdPrefix: 'edit-assigned-to',
        preselectedIds: Array.isArray(task.assignedTo) ? task.assignedTo.map(user => user.id) : [],
    });

    const editForm = dialog.querySelector('.edit-task-form');
    if (editForm) {
        editForm.addEventListener("submit", handleEditTaskSave);
    }

    if (!dialog.open) {
        dialog.showModal();
    }
}

function mapCategoryLabelToKey(label) {
    if (label === "Technical Task") return "toDo";
    if (label === "User Story") return "inProgress";
    if (label === "Awaiting Feedback") return "feedback";
    if (label === "Done") return "done";
    return "toDo";
}
function getSelectedEditPriority(dialog) {
    const priorityUrgent = dialog.querySelector("#edit-priority-urgent");
    const priorityMedium = dialog.querySelector("#edit-priority-medium");
    const priorityLow = dialog.querySelector("#edit-priority-low");
    if (!priorityUrgent || !priorityMedium || !priorityLow) {
        return "Medium";
    }

    if (priorityUrgent.classList.contains("priority-buttons__btn--urgent")) {
        return "Urgent";
    }

    if (priorityMedium.classList.contains("priority-buttons__btn--medium")) {
        return "Medium";
    }

    if (priorityLow.classList.contains("priority-buttons__btn--low")) {
        return "Low";
    }

    return "Medium";
}

function handleEditTaskSave(event) {
    event.preventDefault();

    const dialog = document.getElementById("editTaskDialog");
    const taskId = Number(dialog.dataset.taskId);
    const task = todos.find((t) => t.id == taskId);
    if (!task) return;

    const updatedTitle = dialog.querySelector("#edit-title")?.value.trim() || "";
    const updatedDescription = dialog.querySelector("#edit-description")?.value.trim() || "";
    const updatedDueDate = dialog.querySelector("#edit-due-date")?.value || "";
    const updatedPriority = getSelectedEditPriority(dialog);
    const updatedCategoryLabel = dialog.querySelector('#edit-category')?.value || 'Technical Task';
    const updatedAssignedIds = Array.from(dialog.querySelectorAll('#edit-assigned-to-checkboxes input[type="checkbox"]:checked'))
        .map(checkbox => Number(checkbox.value))
        .filter(id => Number.isFinite(id));
    const updatedSubtasks = getLimitedSubtasks(JSON.parse(dialog.querySelector('#edit-subtasks-data')?.value || '[]'));

    task.title = updatedTitle;
    task.description = updatedDescription;
    task.dueDate = updatedDueDate;
    task.priority = updatedPriority;
    task.priorityClass = getPriorityIconClass(updatedPriority);
    task.selectedCategoryLabel = updatedCategoryLabel;
    task.category = mapCategoryLabelToKey(updatedCategoryLabel);
    task.assignedTo = contacts.filter(contact => updatedAssignedIds.includes(contact.id));
    task.subtasks = updatedSubtasks;
    task.subtask = updatedSubtasks[0]?.title || "";

    updateHTML();
    closeDialog();
    toDoCardShow(taskId);
}

function setEditPriority(priority) {
    const dialog = document.getElementById("editTaskDialog");
    if (!dialog) return;

    const urgentBtn = dialog.querySelector("#edit-priority-urgent");
    const mediumBtn = dialog.querySelector("#edit-priority-medium");
    const lowBtn = dialog.querySelector("#edit-priority-low");
    if (!urgentBtn || !mediumBtn || !lowBtn) return;

    urgentBtn.classList.remove("priority-buttons__btn--urgent");
    mediumBtn.classList.remove("priority-buttons__btn--medium");
    lowBtn.classList.remove("priority-buttons__btn--low");

    if (priority === "Urgent") {
        urgentBtn.classList.add("priority-buttons__btn--urgent");
    } else if (priority === "Medium") {
        mediumBtn.classList.add("priority-buttons__btn--medium");
    } else if (priority === "Low") {
        lowBtn.classList.add("priority-buttons__btn--low");
    }
}

function deleteTask(taskId) {
    const taskIndex = todos.findIndex((t) => t.id == taskId);
    if (taskIndex !== -1) {
        todos.splice(taskIndex, 1);
        updateHTML();
        closeDialog();
    }
}



