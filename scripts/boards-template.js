function getShowTaskTemplate(taskView) {
    return `<header class="addTaskDialog__header">
                <h3 class="category__header ${taskView.headerClass}" id="categoryHeader">${taskView.fixedHeaderLabel}</h3>
            <button onclick="closeDialog()" class="addTaskDialog__close-btn" aria-label="Close dialog">×</button>
        </header>
        <section class="editTaskDialog__content editTaskDialog__content--show">
            <h4 class="headline__task-show" id="headline${taskView.id}">${taskView.title}</h4>
            <p class="category__description" id="description${taskView.id}">${taskView.description}</p>
            <div class="task-meta-row">
                <span class="due-date" id="dueDate${taskView.id}"><p>Due date:</p> ${taskView.dueDate}</span>
                <span class="priority" id="priorityLevel"><p>Priority:</p>
                    <span class="priority-label">${taskView.priorityLabel}</span>
                    <span class="priority-buttons__icon priority-buttons__icon--${taskView.iconClass}">${taskView.priorityIcon}</span>
                </span>
            </div>

            <div class="user__profile-show" id="users">
                <h5 class="headline__task-showcard">Assigned To:</h5>
                <div class="assigned-users-list">
                    ${taskView.assignedUsersHTML}
                </div>
            </div>
            <div class="subtask-container">
                <h5 class="headline__task-showcard">Subtasks:</h5>
                <ul class="subtask-list-task">
                    ${(taskView.subtasks || []).map((subtask, index) => `
                        <li class="subtask-item-show ${subtask.done ? 'subtask-item-show--done' : ''}" data-subtask-index="${index}">
                            <label class="subtask-item-show__label">
                                <input type="checkbox" class="subtask-item-show__checkbox" ${subtask.done ? 'checked' : ''} onchange="toggleSubtask(${taskView.id}, ${index})">
                                ${subtask.title}
                            </label>
                        </li>`).join('')}
                </ul>
            </div>
        </section>
        <footer class="editTaskDialog__footer-show">
            <button class="editTaskDialog__delete-btn" type="button" onclick="deleteTask(${taskView.id})">Delete &#128465;</button>
            <button class="editTaskDialog__edit-btn" type="button" onclick="editTask(${taskView.id})">Edit &#9998;</button>
        </footer>`;
}

function getEditTaskFormTemplate(taskView) {
    return `<header class="editTaskDialog__header">
            <button onclick="closeDialog()" class="addTaskDialog__close-btn" aria-label="Close dialog">×</button>
        </header>
        <form class="edit-task-form" id="edit-task-form">
            <section class="editTaskDialog__content editTaskDialog__content--form">
                <label class="task-form__label" for="edit-title">Title</label>
                <input class="task-form__input-title" id="edit-title" type="text" value="${taskView.title}" required>

                <label class="task-form__label" for="edit-description">Description</label>
                <textarea class="task-form__textarea" id="edit-description">${taskView.description}</textarea>

                <label class="task-form__label" for="edit-due-date">Due date</label>
                <input class="task-form__input-date" id="edit-due-date" type="date" value="${taskView.dueDate}" required>

                <span class="task-form__label">Priority</span>
                <div class="priority-buttons">
                    <button
                        id="edit-priority-urgent"
                        type="button"
                        class="priority-btn-color-none btnHover ${taskView.priority === 'Urgent' ? 'priority-buttons__btn--urgent' : ''}"
                        onclick="setEditPriority('Urgent')"
                    >Urgent <span class="priority-buttons__icon priority-buttons__icon--up"> ⟪</span></button>
                    <button
                        id="edit-priority-medium"
                        type="button"
                        class="priority-btn-color-none btnHover ${taskView.priority === 'Medium' ? 'priority-buttons__btn--medium' : ''}"
                        onclick="setEditPriority('Medium')"
                    >Medium <span class="priority-buttons__icon priority-buttons__icon priority-buttons__icon--medium"> ‖</span></button>
                    <button
                        id="edit-priority-low"
                        type="button"
                        class="priority-btn-color-none btnHover ${taskView.priority === 'Low' ? 'priority-buttons__btn--low' : ''}"
                        onclick="setEditPriority('Low')"
                    ><p>Low</p> <span class="priority-buttons__icon priority-buttons__icon--down"> ⟪</span></button>
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
                    <div class="assigned-users-list-edit">
                    ${taskView.assignedUsersHTML}
                </div>
            </div>
            <div class="subtask-container">
                <h5>Subtasks:</h5>
                <ul class="subtask-list">
                    <div class="subtask-input">
                        <input class="task-form__input-edit" type="text" id="new-subtask-input" placeholder="Add new subtask" onkeydown="handleNewSubtaskInputKey(event, ${taskView.id})">
                        <button type="button" class="subtask-input__button" onclick="addNewSubtask(${taskView.id})" aria-label="Add subtask">&#10003;</button>
                        <button type="button" class="subtask-input__button" onclick="clearSubtasks(${taskView.id})" aria-label="Clear subtasks">	&#10008;</button>
                    </div>
                    <div id="edit-subtasks-container" class="subtask-container__list">
                    <input type="hidden" id="edit-subtasks-data" value='${JSON.stringify(taskView.subtasks)}'>
                    <div class="subtask-container__list">
                    ${(taskView.subtasks || []).map((subtask, index) => `<li class="subtask-item" data-subtask-index="${index}">
                        <span class="subtask-item__title">${subtask.title}</span>
                        <div class="subtask-item__actions">
                            <button type="button" class="edit-subtask-btn" onclick="editSubtaskItem(${taskView.id}, ${index})">&#9998;</button>
                            <button type="button" class="clear-subtasks-btn" onclick="deleteSubtaskItem(${taskView.id}, ${index})">&#10008;</button>
                        </div>
                    </li>`).join('')}
                    </div>
                    </div>
                </ul>
            </div>
                </div>
            </section>
        </form>
                    <footer class="editTaskDialog__footer-edit">
                <button class="editTaskDialog__save-btn" type="submit" form="edit-task-form">OK &#10003;</button>
            </footer>`;
}

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
                                </div>

                                <label class="task-form__label" for="category"> Category <span class="task-form__required">*</span> </label>
                                <select class="task-form__select" id="category" required="">
                                    <option value="">Select task category</option>
                                </select>
                                <div class="subtask-container">
                                    <label class="task-form__label" for="subtask-input">Subtasks</label>
                                    <input class="task-form__inputAddTask" type="text" id="subtask-input" placeholder="Add new subtask">
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
                </footer>`;
}

function generateTodoHTML(todoView) {
    return `          <div class="task" id="${todoView.id}" onclick="handleTaskClick(event, ${todoView.id})" draggable="true"
                                ondragstart="drag(event)">
                                <div class="task__drag-handle">
                                    <h3 class="category__header ${todoView.headerClass}" id="categoryHeader">${todoView.fixedHeaderLabel}</h3>
                                    <button type="button" id="task-move-btn-${todoView.id}" class="task__moveto-btn" onclick="openTaskMovePanel(event, ${todoView.id})" title="Move task" aria-label="Move task" aria-expanded="false"><p class="ArrowUp">&#10140;</p><p class="ArrowDown">&#10140;</p></button>
                                <nav class="task-move-panel" id="task-move-panel-${todoView.id}" aria-label="Move task to category" hidden>
                                    <div class="task-move-panel__body">
                                        <h4 class="task-move-panel__body-title">Move To</h4>
                                        <button type="button" class="task-move-panel__item" onclick="moveTaskToNextCategory(event, ${todoView.id})" ${todoView.nextMoveDisabled ? 'disabled' : ''}><span>${todoView.nextMoveArrow}</span> ${todoView.nextMoveLabel}</button>
                                        <button type="button" class="task-move-panel__item" onclick="openTaskReviewDialogFromMenu(event, ${todoView.id})">Review</button>
                                    </div>
                                </nav>
                                </div>

                                <h4 class="headline__task-card" id="headline${todoView.id}">${todoView.title}</h4>
                                <p class="category__description" id="description${todoView.id}">${todoView.description}</p>
                                <div class="subtask-preview">
                                    <span class="subtask ${todoView.hasSubtasks ? 'subtask--active' : ''}"></span>
                                    <p id="subtaskCount">${todoView.subtaskCountText}</p>
                                </div>
                                <div class="user__profile" id="users">
                                    <button onclick="handleTaskClick(event, ${todoView.id})">${todoView.assignedUsersHTML}</button>
                                    <p class="priority-buttons__icon priority-buttons__icon--${todoView.iconClass}"
                                        id="priorityLevel" title="${todoView.priorityLabel}" aria-label="Priority ${todoView.priorityLabel}">${todoView.priorityIcon}</p>
                                </div>
                            </div>`;
};

function getCircleUserTemplate(userAbbreviation, userIndex = 0) {
    return `
        <svg class="assigned-user-avatar assigned-user-avatar--${(userIndex % 5) + 1}" width="50" height="50" viewBox="0 0 80 80" aria-hidden="true">
            <circle class="header__circle" cx="40" cy="40" r="38" stroke="#ffffff" stroke-width="4" />
            <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="28" font-family="Inter, sans-serif" fill="#fff" font-weight="700">${userAbbreviation}</text>
        </svg>
    `;
}
