/**
 * Indicates whether touch drag-and-drop is enabled for the board.
 * @returns {boolean}
 */
function isTouchBoardDnDEnabled() {
    if (window.innerWidth < BOARD_TOUCH_DND_MIN_WIDTH) return false;
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasCoarsePointer = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    return hasTouchSupport || hasCoarsePointer;
}

/**
 * Removes touch drop target highlight classes from all board lists.
 */
function clearTouchDropHighlights() {
    document.querySelectorAll('.board__list--touch-target').forEach(list => {
        list.classList.remove('board__list--touch-target');
    });
}

/**
 * Returns the board drop zone element at a given touch point.
 * @param {number} clientX
 * @param {number} clientY
 * @returns {Element|null}
 */
function getTouchDropZone(clientX, clientY) {
    const element = document.elementFromPoint(clientX, clientY);
    const list = element?.closest('.board__list');
    if (!list) return null;
    return BOARD_DROP_ZONE_CATEGORY_MAP[list.id] ? list : null;
}

/**
 * Finalizes a touch drag operation and applies the move if needed.
 * @param {Element|null} targetList
 */
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

/**
 * Starts touch drag tracking for a task card.
 * @param {TouchEvent} event
 */
function handleTaskTouchStart(event) {
    if (!isTouchBoardDnDEnabled() || event.touches.length !== 1) return;
    const taskElement = event.currentTarget;
    const touch = event.touches[0];
    if (!taskElement || !touch) return;
    activeTouchDrag = {
        taskElement, taskId: taskElement.id,
        startX: touch.clientX, startY: touch.clientY,
        moved: false, currentDropZone: null,
    };
}

/**
 * Updates the highlighted drop zone during a touch drag.
 * @param {number} clientX
 * @param {number} clientY
 */
function updateTouchDropZone(clientX, clientY) {
    const nextDropZone = getTouchDropZone(clientX, clientY);
    if (activeTouchDrag.currentDropZone === nextDropZone) return;
    clearTouchDropHighlights();
    if (nextDropZone) nextDropZone.classList.add('board__list--touch-target');
    activeTouchDrag.currentDropZone = nextDropZone;
}

/**
 * Updates touch drag movement and drop target highlight.
 * @param {TouchEvent} event
 */
function handleTaskTouchMove(event) {
    if (!activeTouchDrag || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - activeTouchDrag.startX);
    const deltaY = Math.abs(touch.clientY - activeTouchDrag.startY);
    if (!activeTouchDrag.moved && deltaX < 10 && deltaY < 10) return;
    activeTouchDrag.moved = true;
    if (event.cancelable) event.preventDefault();
    activeTouchDrag.taskElement.classList.add('task--touch-dragging');
    updateTouchDropZone(touch.clientX, touch.clientY);
}

/**
 * Ends touch dragging and commits potential drop.
 */
function handleTaskTouchEnd() {
    finishTouchDrag(activeTouchDrag?.currentDropZone || null);
}

/**
 * Binds touch drag listeners to a single task card.
 * @param {HTMLElement} task
 */
function bindTouchDndToTask(task) {
    if (task.dataset.touchDndBound === 'true') return;
    task.addEventListener('touchstart', handleTaskTouchStart, { passive: false });
    task.addEventListener('touchmove', handleTaskTouchMove, { passive: false });
    task.addEventListener('touchend', handleTaskTouchEnd);
    task.addEventListener('touchcancel', handleTaskTouchEnd);
    task.dataset.touchDndBound = 'true';
}

/**
 * Binds touch drag listeners to all task cards on the board.
 */
function initializeTouchBoardDnD() {
    document.querySelectorAll('.task').forEach(bindTouchDndToTask);
}
