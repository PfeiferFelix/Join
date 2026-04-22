function getEditTaskTemplate(task) {
    const fixedHeaderLabel = task.selectedCategoryLabel || categoryLabel(task.category);
    const headerClass = getCategoryHeaderClass(fixedHeaderLabel);
    const assignedUsersHTML = Array.isArray(task.assignedTo) ? task.assignedTo.map((user) => getCircleUserTemplate(user.abbreviation || "")).join("") : "";
    const subtaskCountText = getSubtaskCountText(task);
    const firstSubtask = Array.isArray(task.subtasks) && task.subtasks.length > 0 ? task.subtasks[0] : null;
    const priorityLabel = task.priority || "";
    const iconClass = getPriorityIconClass(priorityLabel);
    return `<header class="addTaskDialog__header">
            <button onclick="closeDialog()" class="addTaskDialog__close-btn" aria-label="Close dialog">×</button>
        </header>
        <section class="editTaskDialog__content">

            <h4 class="headline__task" id="headline${task.id}">${task.title}</h4>
            <p class="category__description" id="description${task.id}">${task.description || ""}</p>
            <span class="due-date" id="dueDate${task.id}">Due date: ${task.dueDate || ""}</span>
            <span class="priority" id="priorityLevel">Priority: <p class="priority-buttons__icon priority-buttons__icon--${iconClass}">${priorityLabel}</p></span>
            <div class="subtask-preview">
            <span class="subtask"></span>
            <p id="subtaskCount">${subtaskCountText}</p>
            </div>

            <div class="user__profile" id="users">
                <div>
                    <h5>Assigned To:</h5>
                    <div class="assigned-users-list">
                        ${assignedUsersHTML}
                    </div>
                </div>

            </div>

            <div class="subtasks-section">
                <h5>Subtasks:</h5>
                <ul class="subtasks-list">
                    <input type="checkbox" id="subtask1" name="subtask1" ${firstSubtask?.done ? "checked" : ""} disabled>
                    <label for="subtask1">${firstSubtask?.title || "No subtasks"}</label>
                </ul>
            </div>
        </section>
        <footer class="editTaskDialog__footer">
            <button class="editTaskDialog__delete-btn" type="button" onclick="deleteTask(${task.id})">Delete &#128465;</button>
            <button class="editTaskDialog__save-btn" type="button" onclick="editTask(${task.id})">Edit Task &#9998;</button>
        </footer>`;
}
function addEditSubtaskRow() {
    const list = document.getElementById("edit-subtasks-list");
    if (!list) return;

    if (list.querySelectorAll(".edit-subtask-row").length >= 2) return;

    list.insertAdjacentHTML(
        "beforeend",
        `
        <div class="edit-subtask-row">
            <input class="task-form__input edit-subtask-title" type="text" value="">
            <label class="task-form__label">
                <input class="edit-subtask-done" type="checkbox"> Done
            </label>
            <button type="button" class="editTaskDialog__delete-btn" onclick="removeEditSubtaskRow(this)">Remove</button>
        </div>
    `,
    );
}
function renderEditSubtasksRows(subtasks) {
    return subtasks
        .map(
            (subtask) => `
        <div class="edit-subtask-row">
            <input class="task-form__input edit-subtask-title" type="text" value="${subtask.title}">
            <label class="task-form__label">
                <input class="edit-subtask-done" type="checkbox" ${subtask.done ? "checked" : ""}> Done
            </label>
            <button type="button" class="editTaskDialog__delete-btn" onclick="removeEditSubtaskRow(this)">Remove</button>
        </div>
    `,
        )
        .join("");
}
function getEditTaskFormTemplate(task) {
    const fixedHeaderLabel = task.selectedCategoryLabel || categoryLabel(task.category);
    const editSubtasks = getEditableSubtasks(task);
    let headerClass = getCategoryHeaderClass(fixedHeaderLabel);
    const editSubtasksHTML = renderEditSubtasksRows(editSubtasks);
    const categoryOptions = ["Technical Task", "User Story"];
    const categoryOptionsHTML = categoryOptions
        .map((option) => {
            const selected = option === fixedHeaderLabel ? "selected" : "";
            return `<option value="${option}" ${selected}>${option}</option>`;
        })
        .join("");

    return `<header class="addTaskDialog__header">
            <h3 class="addTaskDialog__title ${headerClass}">${fixedHeaderLabel}</h3>
            <button onclick="closeDialog()" class="addTaskDialog__close-btn" aria-label="Close dialog">×</button>
        </header>
        <form class="edit-task-form">
            <section class="editTaskDialog__content">
                <label class="task-form__label" for="edit-title">Title</label>
                <input class="task-form__input" id="edit-title" type="text" value="${task.title}" required>

                <label class="task-form__label" for="edit-description">Description</label>
                <textarea class="task-form__textarea" id="edit-description">${task.description || ""}</textarea>

                <label class="task-form__label" for="edit-due-date">Due date</label>
                <input class="task-form__input" id="edit-due-date" type="date" value="${task.dueDate || ""}" required>

                <span class="task-form__label">Priority</span>
                <div class="priority-buttons">
                    <button
                        id="edit-priority-urgent"
                        type="button"
                        class="priority-btn-color-none ${task.priority === "Urgent" ? "priority-buttons__btn--urgent" : ""}"
                        onclick="setEditPriority('Urgent')"
                    >Urgent <span class="priority-buttons__icon priority-buttons__icon--up"> ⟪</span></button>
                    <button
                        id="edit-priority-medium"
                        type="button"
                        class="priority-btn-color-none ${task.priority === "Medium" ? "priority-buttons__btn--medium" : ""}"
                        onclick="setEditPriority('Medium')"
                    >Medium <span class="priority-buttons__icon priority-buttons__icon priority-buttons__icon--medium"> ‖</span></button>
                    <button
                        id="edit-priority-low"
                        type="button"
                        class="priority-btn-color-none ${task.priority === "Low" ? "priority-buttons__btn--low" : ""}"
                        onclick="setEditPriority('Low')"
                    >Low <span class="priority-buttons__icon priority-buttons__icon--down"> ⟪</span></button>
                </div>

                <label class="task-form__label" for="edit-category">Category</label>
                <select class="task-form__select" id="edit-category">
                    ${categoryOptionsHTML}
                </select>

                <label class="task-form__label">Subtasks</label>
                <div id="edit-subtasks-list">
                    ${editSubtasksHTML}
                </div>
                <button class="task-form__input" id="add-subtask-btn" type="button">+ Add Subtask</button>
            </section>
            <footer class="editTaskDialog__footer">
                <button class="editTaskDialog__save-btn" type="submit">OK &#10003;</button>
            </footer>
        </form>`;
}
function getTemplateDialog() {
    return `<header class="addTaskDialog__header">
                        <h2 class="addTaskDialog__title">Add Task</h2>
                        <button onclick="closeDialog()" class="addTaskDialog__close-btn" aria-label="Close dialog">×</button>
                    </header>
                    <form class="task-form">
                        <div class="task-form__body">
                            <div class="task-form__col task-form__col--left">
                                <label class="task-form__label" for="title"> Title <span class="task-form__required">*</span> </label>
                                <input class="input__dialog" type="text" id="title" placeholder="Enter a title" required="">
                                <input type="hidden" id="todo-id" value="${Date.now()}">

                                <label class="task-form__label" for="description">Description</label>
                                <textarea class="task-form__textarea" id="description" placeholder="Enter a Description"></textarea>

                                <label class="task-form__label" for="due-date"> Due date <span class="task-form__required">*</span> </label>
                                <input class="task-form__input" type="date" id="due-date" lang="en" required="" min="2026-04-12">
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
                                    <span class="priority-buttons__icon priority-buttons__icon--down"> ⟫
                                    </span></button>
                                </div>

                                <label class="task-form__label" for="assigned-to">Assigned to</label>
                                <select class="task-form__select" id="assigned-to">
                                    <option value="">Select contacts to assign</option>
                                </select>

                                <label class="task-form__label" for="category"> Category <span class="task-form__required">*</span> </label>
                                <select class="task-form__select" id="category" required="">
                                    <option value="">Select task category</option>
                                </select>

                                <label class="task-form__label" for="subtask">Subtask</label>
                                <div class="subtask-input">
                                    <input class="subtask-input__field" type="text" id="subtask" placeholder="Add new subtask">
                                </div>
                            </div>
                        </div>
                        <footer class="task-form__footer">
                            <p class="task-form__required-note"><span class="task-form__required">*</span> This field is required</p>
                            <div class="task-form__actions">
                                <button id="cancel-btn" class="cancel-btn" type="reset">Cancel &#215;</button>
                                <button id="create-task-btn" class="create-task-btn" type="submit">Create Task &#10003;</button>
                            </div>
                        </footer>
                    </form>
                    `;
}
function generateTodoHTML(todo) {
    const fixedHeaderLabel = todo.selectedCategoryLabel || categoryLabel(todo.category);
    const headerClass = getCategoryHeaderClass(fixedHeaderLabel);
    const priorityLabel = todo.priority || "Medium";
    const iconClass = getPriorityIconClass(priorityLabel);
    const assignedUsersHTML = Array.isArray(todo.assignedTo) ? todo.assignedTo.map((user) => getCircleUserTemplate(user.abbreviation || "")).join("") : "";
    const subtaskCountText = getSubtaskCountText(todo);

    return `<div class="task" id="${todo.id}" onclick="toDoCardShow(${todo.id})" draggable="true" ondragstart="drag(event)">
        <h3 class="category__header ${headerClass}" id="categoryHeader">${fixedHeaderLabel}</h3>
        <h4 class="headline__task" id="headline${todo.id}">${todo.title}</h4>
        <p class="category__description" id="description${todo.id}">${todo.description}</p>
        <div class="subtask-preview">
        <span class="subtask"></span>
        <p id="subtaskCount">${subtaskCountText}</p>
        </div>
        <div class="user__profile" id="users">
            <button onclick="toDoCardShow(${todo.id})">${assignedUsersHTML}</button>
            <p class="priority-buttons__icon priority-buttons__icon--${iconClass}" id="priorityLevel">${priorityLabel}</p>
        </div>
    </div>`;
}

function getCircleUserTemplate(userAbbreviation) {
    return `
        <svg width="50" height="50" viewBox="0 0 80 80" aria-hidden="true">
            <circle class="header__circle" cx="40" cy="40" r="38" stroke="#555" stroke-width="4" fill="white" />
            <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="28" font-family="Inter, sans-serif" fill="#4a90e2" font-weight="700">${userAbbreviation}</text>
        </svg>
    `;
}
