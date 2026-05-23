let currentDraggedElement;
let currentDropPlaceholder = null;
let currentDraggedSize = null;

/**
 * Returns whether drag interactions are enabled for the current viewport.
 * @returns {boolean}
 */
function isBoardDragInteractionEnabled() {
    return window.innerWidth >= BOARD_TOUCH_DND_MIN_WIDTH;
}

/**
 * Locks the dragged card to its current pixel size so layout shifts don't resize it.
 * @param {HTMLElement} task
 */
function lockDraggedCardSize(task) {
    const rect = task.getBoundingClientRect();
    currentDraggedSize = { width: rect.width, height: rect.height };
    task.style.width = rect.width + 'px';
    task.style.height = rect.height + 'px';
    task.style.flex = '0 0 auto';
}

/**
 * Restores the original inline styles after a drag ends.
 * @param {HTMLElement} task
 */
function unlockDraggedCardSize(task) {
    task.style.width = '';
    task.style.height = '';
    task.style.flex = '';
    currentDraggedSize = null;
}

/**
 * Binds drag start and end event handlers to a task card.
 * @param {HTMLElement} task
 */
function bindTaskDragEvents(task) {
    if (task.dataset.dragBound) return;
    task.addEventListener('dragstart', (event) => {
        lockDraggedCardSize(task);
        task.classList.add('task--dragging');
        if (typeof event.dataTransfer.setDragImage === 'function') {
            event.dataTransfer.setDragImage(task, 20, 20);
        }
    });
    task.addEventListener('dragend', () => {
        task.classList.remove('task--dragging');
        unlockDraggedCardSize(task);
    });
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
 * Lazily creates and returns the drop position placeholder element.
 * @returns {HTMLElement}
 */
function ensureDropPlaceholder() {
    if (!currentDropPlaceholder) {
        currentDropPlaceholder = document.createElement('div');
        currentDropPlaceholder.className = 'task-drop-placeholder';
    }
    return currentDropPlaceholder;
}

/**
 * Removes the drop placeholder from the DOM.
 */
function removeDropPlaceholder() {
    if (currentDropPlaceholder?.parentNode) {
        currentDropPlaceholder.parentNode.removeChild(currentDropPlaceholder);
    }
}

/**
 * Sizes the placeholder to match the size frozen at dragstart.
 * @param {HTMLElement} placeholder
 */
function sizePlaceholderToDraggedCard(placeholder) {
    if (!currentDraggedSize) return;
    placeholder.style.width = currentDraggedSize.width + 'px';
    placeholder.style.height = currentDraggedSize.height + 'px';
    placeholder.style.flex = '0 0 auto';
}

/**
 * Inserts the placeholder at the end of the target column, sized like the dragged card.
 * @param {HTMLElement} boardList
 */
function updateDropPlaceholder(boardList) {
    const cardsContainer = boardList.querySelector('.board__cards');
    if (!cardsContainer) return;
    const placeholder = ensureDropPlaceholder();
    sizePlaceholderToDraggedCard(placeholder);
    cardsContainer.appendChild(placeholder);
    cardsContainer.style.display = '';
    const emptyEl = boardList.querySelector('.board__nonecard');
    if (emptyEl) emptyEl.style.display = 'none';
}

/**
 * Handles dragleave on a board list, removing the placeholder when truly leaving.
 * @param {HTMLElement} list
 * @param {DragEvent} event
 */
function handleBoardListDragLeave(list, event) {
    if (event.relatedTarget && list.contains(event.relatedTarget)) return;
    removeDropPlaceholder();
}

/**
 * Binds drop placeholder events to a single board list.
 * @param {HTMLElement} list
 */
function bindBoardListDropHighlight(list) {
    if (list.dataset.dropHighlightBound === 'true') return;
    list.addEventListener('dragleave', (event) => handleBoardListDragLeave(list, event));
    list.addEventListener('drop', removeDropPlaceholder);
    list.dataset.dropHighlightBound = 'true';
}

/**
 * Binds drop highlight handlers to all board lists.
 */
function initializeBoardDropHighlights() {
    document.querySelectorAll('.board__list').forEach(bindBoardListDropHighlight);
    document.addEventListener('dragend', removeDropPlaceholder);
    initializeBoardDragAutoScroll();
}

/**
 * Scrolls the window vertically when the cursor is near the top/bottom edge.
 * @param {number} clientY
 * @param {number} vh
 */
function autoScrollVertically(clientY, vh) {
    const EDGE = 80, SPEED = 18;
    if (clientY < EDGE) window.scrollBy(0, -SPEED);
    else if (clientY > vh - EDGE) window.scrollBy(0, SPEED);
}

/**
 * Scrolls the horizontal board container when the cursor is near the side edge.
 * @param {number} clientX
 * @param {number} vw
 */
function autoScrollHorizontally(clientX, vw) {
    const EDGE = 80, SPEED = 18;
    const c = document.querySelector('.board__lists');
    if (!c || c.scrollWidth <= c.clientWidth) return;
    if (clientX < EDGE) c.scrollBy(-SPEED, 0);
    else if (clientX > vw - EDGE) c.scrollBy(SPEED, 0);
}

/**
 * Dragover handler that triggers viewport edge auto-scrolling.
 * @param {DragEvent} event
 */
function handleBoardDragAutoScroll(event) {
    if (!isBoardDragInteractionEnabled()) return;
    autoScrollVertically(event.clientY, window.innerHeight);
    autoScrollHorizontally(event.clientX, window.innerWidth);
}

/**
 * Binds a single global dragover listener for edge auto-scrolling.
 */
function initializeBoardDragAutoScroll() {
    if (window.__boardDragAutoScrollBound) return;
    window.__boardDragAutoScrollBound = true;
    document.addEventListener('dragover', handleBoardDragAutoScroll);
}

/**
 * Enables dropping on a board column when drag interactions are active.
 * @param {DragEvent} event
 */
function allowDrop(event) {
    if (!isBoardDragInteractionEnabled()) return;
    event.preventDefault();
    updateDropPlaceholder(event.currentTarget);
}

/**
 * Handles task drop events and moves tasks to the end of the target category.
 * @param {DragEvent} event
 */
function drop(event) {
    if (!isBoardDragInteractionEnabled()) return;
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain") || currentDraggedElement?.id;
    const targetCategory = BOARD_DROP_ZONE_CATEGORY_MAP[event.currentTarget.id];
    removeDropPlaceholder();
    moveTaskToCategory(taskId, targetCategory);
}

/**
 * Moves a task to a category (appended at the end) and persists the change.
 * @param {string|number} taskId
 * @param {string} targetCategory
 */
function moveTaskToCategory(taskId, targetCategory) {
    if (!targetCategory) return;
    const fromIndex = todos.findIndex((todo) => todo.id == taskId);
    if (fromIndex === -1) return;
    const [task] = todos.splice(fromIndex, 1);
    task.category = targetCategory;
    task.position = mapCategoryToSummaryPosition(targetCategory);
    todos.push(task);
    updateHTML();
    persistTaskCategoryToFirebase(task);
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
        taskElement,
        taskId: taskElement.id,
        startX: touch.clientX,
        startY: touch.clientY,
        moved: false,
        currentDropZone: null,
    };
}

/**
 * Updates touch drag movement and drop target highlight.
 * @param {TouchEvent} event
 */
function handleTaskTouchMove(event) {
    if (!activeTouchDrag || event.touches.length !== 1) return;
    const touch = event.touches[0], deltaX = Math.abs(touch.clientX - activeTouchDrag.startX), deltaY = Math.abs(touch.clientY - activeTouchDrag.startY);
    if (!activeTouchDrag.moved && deltaX < 10 && deltaY < 10) return;
    activeTouchDrag.moved = true;
    if (event.cancelable) event.preventDefault();
    activeTouchDrag.taskElement.classList.add('task--touch-dragging');
    const nextDropZone = getTouchDropZone(touch.clientX, touch.clientY);
    if (activeTouchDrag.currentDropZone === nextDropZone) return;
    clearTouchDropHighlights();
    if (nextDropZone) nextDropZone.classList.add('board__list--touch-target');
    activeTouchDrag.currentDropZone = nextDropZone;
}

/**
 * Ends touch dragging and commits potential drop.
 */
function handleTaskTouchEnd() {
    finishTouchDrag(activeTouchDrag?.currentDropZone || null);
}

/**
 * Binds touch drag listeners to all task cards on the board.
 */
function initializeTouchBoardDnD() {
    document.querySelectorAll('.task').forEach(task => {
        if (task.dataset.touchDndBound === 'true') return;

        task.addEventListener('touchstart', handleTaskTouchStart, { passive: false });
        task.addEventListener('touchmove', handleTaskTouchMove, { passive: false });
        task.addEventListener('touchend', handleTaskTouchEnd);
        task.addEventListener('touchcancel', handleTaskTouchEnd);
        task.dataset.touchDndBound = 'true';
    });
}

/**
 * Sets the open state of the move panel toggle button.
 * @param {HTMLElement} button
 * @param {boolean} isOpen
 */
function updateMovePanelToggleButton(button, isOpen) {
    if (!button) return;
    if (isOpen) {
        button.classList.add('task__moveto-btn--open');
        button.setAttribute('aria-expanded', 'true');
    } else {
        button.classList.remove('task__moveto-btn--open');
        button.setAttribute('aria-expanded', 'false');
    }
}

/**
 * Opens the move panel for a specific task.
 * @param {Event} event
 * @param {string|number} taskId
 */
function openTaskMovePanel(event, taskId) {
    event.preventDefault();
    event.stopPropagation();
    const panel = document.getElementById(`task-move-panel-${taskId}`);
    const toggleButton = document.getElementById(`task-move-btn-${taskId}`);
    const task = panel?.closest('.task');
    if (!panel) return;
    closeAllTaskMovePanels();
    panel.removeAttribute('hidden');
    panel.classList.add('task-move-panel--open');
    if (task) task.classList.add('task--move-panel-open');
    ensureTaskMovePanelIsVisible(panel);
    updateMovePanelToggleButton(toggleButton, true);
}

/**
 * Scrolls the move panel into view within its scroll container.
 * @param {HTMLElement} scrollContainer
 * @param {HTMLElement} panel
 */
function scrollPanelIntoView(scrollContainer, panel) {
    const panelRect = panel.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    const visibleRightEdge = Math.min(containerRect.right, window.innerWidth) - 12;
    const hiddenRightWidth = panelRect.right - visibleRightEdge;
    if (hiddenRightWidth > 0) scrollContainer.scrollBy({ left: hiddenRightWidth + 12, behavior: 'smooth' });
}

/**
 * Scrolls the mobile task row so an opened move panel remains fully visible.
 * @param {HTMLElement} panel
 */
function ensureTaskMovePanelIsVisible(panel) {
    if (window.innerWidth > 1010) return;
    const scrollContainer = panel.closest('.board__cards');
    if (!scrollContainer) return;
    requestAnimationFrame(() => scrollPanelIntoView(scrollContainer, panel));
}

/**
 * Closes the move panel for a specific task.
 * @param {Event|null} event
 * @param {string|number} taskId
 */
function closeTaskMovePanel(event, taskId) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const panel = document.getElementById(`task-move-panel-${taskId}`);
    const toggleButton = document.getElementById(`task-move-btn-${taskId}`);
    const task = panel?.closest('.task');
    if (!panel) return;
    panel.classList.remove('task-move-panel--open');
    if (task) task.classList.remove('task--move-panel-open');
    if (toggleButton) { toggleButton.classList.remove('task__moveto-btn--open'); toggleButton.setAttribute('aria-expanded', 'false'); }
    setTimeout(() => panel.setAttribute('hidden', ''), 200);
}

/**
 * Closes all currently open task move panels.
 */
function closeAllTaskMovePanels() {
    document.querySelectorAll('.task-move-panel--open').forEach(panel => {
        const taskId = panel.id.replace('task-move-panel-', '');
        closeTaskMovePanel(null, taskId);
    });
}

/**
 * Moves a task to the next category in the board flow.
 * @param {Event} event
 * @param {string|number} taskId
 */
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

/**
 * Returns the next category key in board order.
 * @param {string} category
 * @returns {string}
 */
function getNextBoardCategory(category) {
    if (category === 'done') return null;
    const currentIndex = BOARD_CATEGORY_FLOW.indexOf(category);
    if (currentIndex === -1) {
        return BOARD_CATEGORY_FLOW[0];
    }

    const nextIndex = (currentIndex + 1) % BOARD_CATEGORY_FLOW.length;
    return BOARD_CATEGORY_FLOW[nextIndex];
}

/**
 * Converts a category key to its column label.
 * @param {string} category
 * @returns {string}
 */
function getBoardColumnLabel(category) {
    if (category === 'toDo') return 'To Do';
    if (category === 'inProgress') return 'In Progress';
    if (category === 'feedback') return 'Await Feedback';
    if (category === 'done') return 'Done';
    return 'Next Step';
}

/**
 * Returns an arrow indicating move direction between categories.
 * @param {string} currentCategory
 * @param {string} targetCategory
 * @returns {string}
 */
function getMoveDirectionArrow(currentCategory, targetCategory) {
    if (!targetCategory) return '→';

    const currentIndex = BOARD_CATEGORY_FLOW.indexOf(currentCategory);
    const targetIndex = BOARD_CATEGORY_FLOW.indexOf(targetCategory);

    if (currentIndex === -1 || targetIndex === -1) return '→';
    if (targetIndex > currentIndex) return '↓';
    if (targetIndex < currentIndex) return '↑';
    return '→';
}

/**
 * Opens task details from the move panel menu.
 * @param {Event} event
 * @param {string|number} taskId
 */
function openTaskReviewDialogFromMenu(event, taskId) {
    event.preventDefault();
    event.stopPropagation();
    closeTaskMovePanel(null, taskId);
    toDoCardShow(taskId);
}

/**
 * Binds global click handling to close move panels when clicking outside.
 */
function initializeTaskMoveMenuCloseBehavior() {
    if (taskMoveMenuCloseListenerBound) return;

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.task-move-panel') && !event.target.closest('.task__moveto-btn')) {
            closeAllTaskMovePanels();
        }
    });

    taskMoveMenuCloseListenerBound = true;
}