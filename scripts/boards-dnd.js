// Indicates whether touch drag-and-drop is enabled.
function isTouchBoardDnDEnabled() {
    return false;
}

// Removes touch drop target highlight classes.
function clearTouchDropHighlights() {
    document.querySelectorAll('.board__list--touch-target').forEach(list => {
        list.classList.remove('board__list--touch-target');
    });
}

// Returns the board drop zone at a touch point.
function getTouchDropZone(clientX, clientY) {
    const element = document.elementFromPoint(clientX, clientY);
    const list = element?.closest('.board__list');
    if (!list) return null;

    return BOARD_DROP_ZONE_CATEGORY_MAP[list.id] ? list : null;
}

// Finalizes a touch drag operation and applies the move.
function finishTouchDrag(targetList = null) {
    if (!activeTouchDrag) return;
    const { taskElement, taskId, moved } = activeTouchDrag;
    taskElement.classList.remove('task--touch-dragging');
    if (moved) {
        suppressNextTaskClick = true;
        const targetCategory = targetList ? BOARD_DROP_ZONE_CATEGORY_MAP[targetList.id] : null;
        if (targetCategory) moveTaskToCategory(taskId, targetCategory);
    }
    clearTouchDropHighlights();
    activeTouchDrag = null;
}

// Starts touch drag tracking for a task card.
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

// Updates touch drag movement and drop target highlight.
function handleTaskTouchMove(event) {
    if (!activeTouchDrag || event.touches.length !== 1) return;
    const touch = event.touches[0], deltaX = Math.abs(touch.clientX - activeTouchDrag.startX), deltaY = Math.abs(touch.clientY - activeTouchDrag.startY);
    if (!activeTouchDrag.moved && deltaX < 10 && deltaY < 10) return;
    activeTouchDrag.moved = true;
    event.preventDefault();
    activeTouchDrag.taskElement.classList.add('task--touch-dragging');
    const nextDropZone = getTouchDropZone(touch.clientX, touch.clientY);
    if (activeTouchDrag.currentDropZone === nextDropZone) return;
    clearTouchDropHighlights();
    if (nextDropZone) nextDropZone.classList.add('board__list--touch-target');
    activeTouchDrag.currentDropZone = nextDropZone;
}

// Ends touch dragging and commits potential drop.
function handleTaskTouchEnd() {
    finishTouchDrag(activeTouchDrag?.currentDropZone || null);
}

// Binds touch drag listeners to all task cards.
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

// Opens the move panel for a specific task.
function openTaskMovePanel(event, taskId) {
    event.preventDefault();
    event.stopPropagation();
    const panel = document.getElementById(`task-move-panel-${taskId}`);
    const toggleButton = document.getElementById(`task-move-btn-${taskId}`);
    if (!panel) return;
    closeAllTaskMovePanels();
    panel.removeAttribute('hidden');
    panel.classList.add('task-move-panel--open');
    if (!toggleButton) return;
    toggleButton.classList.add('task__moveto-btn--open');
    toggleButton.setAttribute('aria-expanded', 'true');
}

// Closes the move panel for a specific task.
function closeTaskMovePanel(event, taskId) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const panel = document.getElementById(`task-move-panel-${taskId}`);
    const toggleButton = document.getElementById(`task-move-btn-${taskId}`);
    if (!panel) return;
    panel.classList.remove('task-move-panel--open');
    if (toggleButton) { toggleButton.classList.remove('task__moveto-btn--open'); toggleButton.setAttribute('aria-expanded', 'false'); }
    setTimeout(() => panel.setAttribute('hidden', ''), 200);
}

// Closes all currently open task move panels.
function closeAllTaskMovePanels() {
    document.querySelectorAll('.task-move-panel--open').forEach(panel => {
        const taskId = panel.id.replace('task-move-panel-', '');
        closeTaskMovePanel(null, taskId);
    });
}

// Moves a task to the next category in the board flow.
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

// Returns the next category key in board order.
function getNextBoardCategory(category) {
    const currentIndex = BOARD_CATEGORY_FLOW.indexOf(category);
    if (currentIndex === -1) {
        return BOARD_CATEGORY_FLOW[0];
    }

    const nextIndex = (currentIndex + 1) % BOARD_CATEGORY_FLOW.length;
    return BOARD_CATEGORY_FLOW[nextIndex];
}

// Converts a category key to its column label.
function getBoardColumnLabel(category) {
    if (category === 'toDo') return 'To Do';
    if (category === 'inProgress') return 'In Progress';
    if (category === 'feedback') return 'Awaiting Feedback';
    if (category === 'done') return 'Done';
    return 'Next Step';
}

// Returns an arrow indicating move direction between categories.
function getMoveDirectionArrow(currentCategory, targetCategory) {
    if (!targetCategory) return '→';

    const currentIndex = BOARD_CATEGORY_FLOW.indexOf(currentCategory);
    const targetIndex = BOARD_CATEGORY_FLOW.indexOf(targetCategory);

    if (currentIndex === -1 || targetIndex === -1) return '→';
    if (targetIndex > currentIndex) return '↓';
    if (targetIndex < currentIndex) return '↑';
    return '→';
}

// Opens task details from the move panel menu.
function openTaskReviewDialogFromMenu(event, taskId) {
    event.preventDefault();
    event.stopPropagation();
    closeTaskMovePanel(null, taskId);
    toDoCardShow(taskId);
}

// Binds global click handling to close move panels.
function initializeTaskMoveMenuCloseBehavior() {
    if (taskMoveMenuCloseListenerBound) return;

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.task-move-panel') && !event.target.closest('.task__moveto-btn')) {
            closeAllTaskMovePanels();
        }
    });

    taskMoveMenuCloseListenerBound = true;
}

