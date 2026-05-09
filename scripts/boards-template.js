// Returns the HTML template for the task detail dialog.
function getShowTaskTemplate(taskView) {
    return `
    <header class="addTaskDialog__header">
        <h3 class="category__header ${taskView.headerClass}" id="categoryHeader">${taskView.fixedHeaderLabel}</h3>
        <button onclick="closeDialog()" class="addTaskDialog__close-btn" aria-label="Close dialog">×</button>
    </header>
    <section class="editTaskDialog__content editTaskDialog__content--show">
        <h2 class="headline__task-show" id="headline${taskView.id}">${taskView.title}</h2>
        <p class="category__description" id="description${taskView.id}">${taskView.description}</p>
        <div class="task-meta-block">
            <div class="task-meta-row">
                <span class="task-meta-label">Due date:</span>
                <span class="task-meta-value" id="dueDate${taskView.id}">${taskView.dueDate}</span>
            </div>
            <div class="task-meta-row">
                <span class="task-meta-label">Priority:</span>
                <span class="task-meta-value priority-label priority-label--${taskView.iconClass}">${taskView.priorityLabel} <span class="priority-buttons__icon priority-buttons__icon--${taskView.iconClass}">${taskView.priorityIcon}</span></span>
            </div>
            <div class="UserList">
                <span class="task-meta-label-users">Assigned To:</span>
                <span class="task-meta-value">
                    <div class="assigned-users-list">
                        ${taskView.assignedUsersHTML}
                    </div>
                </span>
            </div>
        </div>
        <div class="subtask-container">
            <span class="task-meta-label">Subtasks:</span>
            <ul class="subtask-list-task">
                ${taskView.subtasksHTML || ''}
            </ul>
        </div>
    </section>
    <footer class="editTaskDialog__footer-show">
        <button class="editTaskDialog__delete-btn" type="button" onclick="deleteTask(${taskView.id})">Delete &#128465;</button>
        <button class="editTaskDialog__edit-btn" type="button" onclick="editTask(${taskView.id})">Edit &#9998;</button>
    </footer>
    `;
}

// Returns the HTML template for the editable task dialog.
function getEditTaskFormTemplate(taskView) {
    return `
    <header class="editTaskDialog__header">
        <button onclick="closeDialog()" class="addTaskDialog__close-btn" aria-label="Close dialog">×</button>
    </header>
    <label class="editTaskDialog__label" for="edit-title">Title</label>
    <input class="editTaskDialog__input" type="text" id="edit-title" value="${taskView.title}" required>
    <form class="edit-task-form" id="edit-task-form">
        <section class="editTaskDialog__content editTaskDialog__content--form">
            <label class="task-form__label" for="edit-description">Description</label>
            <textarea class="task-form__textarea" id="edit-description" placeholder="Description">${taskView.description}</textarea>
            <label class="task-form__label" for="edit-due-date">Due date</label>
            <input class="task-form__input-date" id="edit-due-date" type="date" value="${taskView.dueDate}" required>
            <span class="task-form__label">Priority</span>
            <div class="priority-buttons">
                <button id="edit-priority-urgent" type="button" class="priority-btn-color-none btnHover ${taskView.priority === 'Urgent' ? 'priority-buttons__btn--urgent' : ''}" onclick="setEditPriority('Urgent')">
                    Urgent <span class="priority-buttons__icon priority-buttons__icon--up">⟪</span>
                </button>
                <button id="edit-priority-medium" type="button" class="priority-btn-color-none btnHover ${taskView.priority === 'Medium' ? 'priority-buttons__btn--medium' : ''}" onclick="setEditPriority('Medium')">
                    Medium <span class="priority-buttons__icon priority-buttons__icon--medium">‖</span>
                </button>
                <button id="edit-priority-low" type="button" class="priority-btn-color-none btnHover ${taskView.priority === 'Low' ? 'priority-buttons__btn--low' : ''}" onclick="setEditPriority('Low')">
                    Low <span class="priority-buttons__icon priority-buttons__icon--down">⟪</span>
                </button>
            </div>
            <label class="task-form__label" for="edit-assigned-to-multiselect">Assigned to</label>
            <div class="multiselect" id="edit-assigned-to-multiselect">
                <div class="selectBox" id="edit-assigned-to-trigger" role="button" tabindex="0" aria-expanded="false" aria-controls="edit-assigned-to-checkboxes">
                    <select class="task-form__select" aria-hidden="true" tabindex="-1">
                        <option id="edit-assigned-to-summary">Select contacts to assign</option>
                    </select>
                    <div class="overSelect"></div>
                </div>
                <div id="edit-assigned-to-checkboxes" class="multiselect__checkboxes" hidden></div>
                <div class="assigned-users-list-edit" id="edit-assigned-to-selected-avatars">
                    ${taskView.assignedUsersHTML}
                </div>
            </div>
            <div class="subtask-container">
                <label class="task-form__label" for="new-subtask-input">Subtasks</label>
                <div class="subtask-input">
                    <input class="task-form__input-edit" type="text" id="new-subtask-input" placeholder="Add new subtask" onkeydown="handleNewSubtaskInputKey(event, ${taskView.id})" oninput="this.closest('.subtask-input').querySelector('.subtask-item__actions').classList.toggle('subtask-item__actions--active', this.value.trim().length > 0)">
                    <input type="hidden" id="edit-subtasks-data" value='${JSON.stringify(taskView.subtasks || [])}'>
                    <div class="subtask-item__actions">
                        <button type="button" class="edit-subtask-btn" onclick="addNewSubtask(${taskView.id})" aria-label="Add subtask">&#10003;</button>
                        <span class="subtask-input__separator" aria-hidden="true"></span>
                        <button type="button" class="clear-subtasks-btn" onclick="clearSubtasks(${taskView.id})" aria-label="Clear subtasks">&#10008;</button>
                    </div>
                </div>
                <ul class="subtask-list-task subtask-list">
                    ${(taskView.subtasks || []).map((subtask, index) => getEditableSubtaskItemTemplate(subtask.title, taskView.id, index)).join('')}
                </ul>
            </div>
        </section>
        <footer class="editTaskDialog__footer-edit">
            <button class="editTaskDialog__save-btn" type="submit" form="edit-task-form">OK &#10003;</button>
        </footer>
    </form>`;
}

// Returns the HTML template for the add-task dialog.
function getaddTaskTemplateDialog() {
    return `<header class="addTaskDialog__header">
                        <h2 class="addTaskDialog__title">Add Task</h2>
                        <button onclick="closeDialog()" class="addTaskDialog__close-btn" aria-label="Close dialog">×</button>
                    </header>
                    <form class="task-form" id="add-task-form">
                        <div class="task-form__body">
                            <div class="task-form__col task-form__col--left">
                                <label class="task-form__label" for="title"> Title <span class="task-form__required">*</span> </label>
                                <input class="input__dialogAddTask" type="text" id="title" placeholder="Enter a title" required="">
                                <input type="hidden" id="todo-id" value="${Date.now()}">

                                <label class="task-form__label" for="description">Description</label>
                                <textarea class="task-form__textarea" id="description" placeholder="Enter a Description"></textarea>

                                <label class="task-form__label" for="due-date"> Due date <span class="task-form__required">*</span> </label>
                                <input class="task-form__inputDate" type="date" id="due-date" lang="en" required="" min="${new Date().toISOString().split('T')[0]}">
                            </div>

                            <div class="task-form__separator"></div>

                            <div class="task-form__col task-form__col--right">
                                <span class="task-form__label">Priority</span>
                                <div class="priority-buttons">
                                    <button id="priority-urgent" type="button" class="priority-btn-color-none priority-buttons__btn--urgent btnHover">Urgent
                                    <span class="priority-buttons__icon priority-buttons__icon--up"> ⟪</span>
                                    </button>
                                    <button id="priority-medium" type="button" class="priority-btn-color-none priority-buttons__btn--medium btnHover">Medium 
                                    <span class="priority-buttons__icon priority-buttons__icon--medium"> ‖</span>
                                    </button>
                                    <button id="priority-low" type="button" class="priority-btn-color-none priority-buttons__btn--low btnHover">Low 
                                    <span class="priority-buttons__icon priority-buttons__icon--down"> ⟪
                                    </span></button>
                                </div>

                                <label class="task-form__label" for="assigned-to-trigger">Assigned to</label>
                                <div class="multiselect" id="assigned-to-multiselect">
                                        <div class="selectBox" id="assigned-to-trigger" role="button" tabindex="0" aria-expanded="false" aria-controls="assigned-to-checkboxes">
                                                <select class="task-form__select" aria-hidden="true" tabindex="-1">
                                                        <option id="assigned-to-summary">Select contacts to assign</option>
                                                </select>
                                                <div class="overSelect"></div>
                                        </div>
                                        <div id="assigned-to-checkboxes" class="multiselect__checkboxes" hidden></div>
                                        <div class="assigned-users-list-addTask" id="assigned-to-selected-avatars"></div>
                                </div>

                                <label class="task-form__label" for="category-trigger"> Category <span class="task-form__required">*</span> </label>
                                <div class="category-custom-select" id="category-wrapper">
                                    <div class="category-custom-select__trigger" id="category-trigger" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="false">
                                        <span id="category-label">Select task category</span>
                                        <span class="category-custom-select__arrow">&#9660;</span>
                                    </div>
                                    <div class="category-custom-select__options" id="category-options" hidden role="listbox">
                                        <div class="category-custom-select__option" data-value="Technical Task" data-color-key="TechnicalTask" role="option">Technical Task</div>
                                        <div class="category-custom-select__option" data-value="User Story" data-color-key="UserStory" role="option">User Story</div>
                                    </div>
                                    <input type="hidden" id="category" name="category" value="">
                                </div>
                                <div class="subtask-container">
                                    <label class="task-form__label" for="subtask-input">Subtasks</label>
                                    <div class="subtask-input" id="add-subtask-input-wrapper">
                                        <input class="task-form__inputAddTask" type="text" id="subtask-input" placeholder="Add new subtask">
                                        <div class="subtask-item__actions" id="add-subtask-actions">
                                            <button type="button" class="edit-subtask-btn" id="add-subtask-confirm" aria-label="Add subtask">&#10003;</button>
                                            <span class="subtask-input__separator" aria-hidden="true"></span>
                                            <button type="button" class="clear-subtasks-btn" id="add-subtask-clear" aria-label="Clear subtask input">&#10008;</button>
                                        </div>
                                    </div>
                                    <ul class="subtask-container__list" id="add-subtasks-list"></ul>
                                    <input type="hidden" id="add-subtasks-data" value="[]">
                                </div>
                            <p class="task-form__required-note--mobile"><span class="task-form__required">*</span> This field is required</p>
                                </div>  
                        </div>
                    </form>
                <footer class="task-form__footer">
                    <p class="task-form__required-note"><span class="task-form__required">*</span> This field is required</p>
                    <div class="task-form__actions">
                        <button id="cancel-btn" class="cancel-btn" type="reset" form="add-task-form">Cancel <p class="cancel-btn__icon">&#215;</p></button>
                        <button id="create-task-btn" class="create-task-btn" type="submit" form="add-task-form">Create Task &#10003;</button>
                    </div>
                </footer>
                <div id="add-task-success" class="add-task-success" hidden aria-live="polite">
                    <div class="add-task-success__content">
                        <span>Task added to Board</span>
                        <img src="assets/icons/sidebar/inactive/boards.svg" alt="" />
                    </div>
                </div>`;
}

// Returns the HTML template for a board task card.
function generateTodoHTML(todoView) {
    return `<div class="task" id="${todoView.id}" onclick="handleTaskClick(event, ${todoView.id})" draggable="true" ondragstart="drag(event)">
        <div class="task__header">
            <h3 class="task__category-badge ${todoView.headerClass}">${todoView.fixedHeaderLabel}</h3>
            <button type="button" id="task-move-btn-${todoView.id}" class="task__moveto-btn" onclick="openTaskMovePanel(event, ${todoView.id})" title="Move task" aria-label="Move task" aria-expanded="false"><p class="ArrowDown">&#x279C;</p><p class="ArrowUp">&#x279C;</p></button>
            <nav class="task-move-panel" id="task-move-panel-${todoView.id}" aria-label="Move task to category" hidden>
                <div class="task-move-panel__body">
                    <h4 class="task-move-panel__body-title">Move To</h4>
                    <button type="button" class="task-move-panel__item" onclick="moveTaskToNextCategory(event, ${todoView.id})" ${todoView.nextMoveDisabled ? 'disabled' : ''}><span>${todoView.nextMoveArrow}</span> ${todoView.nextMoveLabel}</button>
                    <button type="button" class="task-move-panel__item" onclick="openTaskReviewDialogFromMenu(event, ${todoView.id})">Review</button>
                </div>
            </nav>
        </div>
        <h4 class="task__title" id="headline${todoView.id}">${todoView.title}</h4>
        <p class="task__description" id="description${todoView.id}">${todoView.description}</p>
        <div class="task__subtask-progress">
            <div class="task__progress-bar-container">
                <div class="task__progress-bar" style="width: ${todoView.subtaskPercent || 0}%"></div>
            </div>
            <p class="task__subtask-text">${todoView.subtaskCountText}</p>
        </div>
        <div class="task__footer">
            <div class="task__assigned-users" id="users">
                ${todoView.assignedUsersHTML}
            </div>
            <p class="task__priority-icon priority-buttons__icon priority-buttons__icon--${todoView.iconClass}" id="priorityLevel" title="${todoView.priorityLabel}" aria-label="Priority ${todoView.priorityLabel}">${todoView.priorityIcon}</p>
        </div>
    </div>`;
};

// Returns the avatar badge template for an assigned user.
function getCircleUserTemplate(userAbbreviation, fill) {
    return `
        <svg class="assigned-user-avatar" width="50" height="50" viewBox="0 0 80 80" aria-hidden="true">
            <circle class="header__circle" cx="40" cy="40" r="38" fill="${fill}" stroke="#ffffff" stroke-width="4" />
            <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="28" font-family="Inter, sans-serif" fill="#fff" font-weight="700">${userAbbreviation}</text>
        </svg>
    `;
}

// Returns an inline edit input template for one subtask title.
function getSubtaskEditInputTemplate(currentTitle, taskId, index) {
    return `<input type="text" class="task-form__input subtask-item__input" value="${escapeHtmlAttribute(currentTitle)}" onkeydown="if(event.key==='Enter'){acceptSubtaskItem(${taskId}, ${index})}" onfocus="this.parentElement.classList.add('subtask-item--editing')" onblur="this.parentElement.classList.remove('subtask-item--editing')">`;
}

// Returns one editable subtask list-item template.
function getEditableSubtaskItemTemplate(subtaskTitle, taskId, index) {
    return `<li class="subtask-item" data-subtask-index="${index}">
        <span class="subtask-item__title">${escapeHtmlText(subtaskTitle)}</span>
        <div class="subtask-item__actions">
            <button type="button" class="edit-subtask-btn" onclick="editSubtaskItem(${taskId}, ${index})" title="Bearbeiten">&#9998;</button>
            <span class="subtask-item__separator"></span>
            <button type="button" class="clear-subtasks-btn" onclick="deleteSubtaskItem(${taskId}, ${index})" title="Löschen">&#128465;</button>
        </div>
    </li>`;
}

// Returns one display-only subtask list-item template for the task show dialog.
function getShowSubtaskItemTemplate(subtask, taskId, index) {
    return `<li class="subtask-item-show ${subtask.done ? 'subtask-item-show--done' : ''}" data-subtask-index="${index}">
        <label class="subtask-item-show__label">
            <input type="checkbox" class="subtask-item-show__checkbox" ${subtask.done ? 'checked' : ''} onchange="toggleSubtask(${taskId}, ${index})">
            ${escapeHtmlText(subtask.title)}
        </label>
    </li>`;
}

// Returns a display-only subtask title span template.
function getSubtaskTitleTemplate(title) {
    return `<span class="subtask-item__title">${escapeHtmlText(title)}</span>`;
}

// Builds the assigned-user row template with avatar and name.
function getAssignedUserWithNameTemplate(user, fill) {
    return [
        `<div class="assigned-user-row">`,
        `<svg class="assigned-user-avatar" width="40" height="40" viewBox="0 0 80 80" aria-hidden="true">`,
        `<circle class="header__circle" cx="40" cy="40" r="38" fill="${fill}" stroke="#ffffff" stroke-width="4" />`,
        `<text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="28" font-family="Inter, sans-serif" fill="#fff" font-weight="700">${user?.abbreviation || ''}</text>`,
        `</svg>`,
        `<span class="assigned-user-name">${user?.name || user?.abbreviation || 'Unknown User'}</span>`,
        `</div>`,
    ].join('');
}

