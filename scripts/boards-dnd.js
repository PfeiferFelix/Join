let currentDraggedElement;
let currentDropPlaceholder = null;
let currentDraggedSize = null;
let activeTouchDrag = null;

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
 * Handles dragstart for a single task card.
 * @param {HTMLElement} task
 * @param {DragEvent} event
 */
function handleTaskDragStart(task, event) {
    lockDraggedCardSize(task);
    task.classList.add('task--dragging');
    if (typeof event.dataTransfer.setDragImage === 'function') {
        event.dataTransfer.setDragImage(task, 20, 20);
    }
}

/**
 * Handles dragend for a single task card.
 * @param {HTMLElement} task
 */
function handleTaskDragEnd(task) {
    task.classList.remove('task--dragging');
    unlockDraggedCardSize(task);
}

/**
 * Binds drag start and end event handlers to a task card.
 * @param {HTMLElement} task
 */
function bindTaskDragEvents(task) {
    if (task.dataset.dragBound) return;
    task.addEventListener('dragstart', (event) => handleTaskDragStart(task, event));
    task.addEventListener('dragend', () => handleTaskDragEnd(task));
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
