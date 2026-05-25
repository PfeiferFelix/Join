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
 * Resets the toggle button visual state for a closed panel.
 * @param {HTMLElement|null} toggleButton
 */
function resetMoveToggleButtonState(toggleButton) {
    if (!toggleButton) return;
    toggleButton.classList.remove('task__moveto-btn--open');
    toggleButton.setAttribute('aria-expanded', 'false');
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
    resetMoveToggleButtonState(toggleButton);
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
 * @returns {string|null}
 */
function getNextBoardCategory(category) {
    if (category === 'done') return null;
    const currentIndex = BOARD_CATEGORY_FLOW.indexOf(category);
    if (currentIndex === -1) return BOARD_CATEGORY_FLOW[0];
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
 * Document click handler that closes move panels on outside clicks.
 * @param {MouseEvent} event
 */
function handleTaskMoveMenuOutsideClick(event) {
    if (event.target.closest('.task-move-panel')) return;
    if (event.target.closest('.task__moveto-btn')) return;
    closeAllTaskMovePanels();
}

/**
 * Binds global click handling to close move panels when clicking outside.
 */
function initializeTaskMoveMenuCloseBehavior() {
    if (taskMoveMenuCloseListenerBound) return;
    document.addEventListener('click', handleTaskMoveMenuOutsideClick);
    taskMoveMenuCloseListenerBound = true;
}
