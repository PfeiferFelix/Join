
let contacts = [
    { id: 1, name: 'David G.', abbreviation: 'DG' },
    { id: 2, name: 'Anna S.', abbreviation: 'AS' },
    { id: 3, name: 'John D.', abbreviation: 'JD' },
];

let categories = ['Technical Task', 'User Story'];

let todos = [];

let currentDraggedElement;

function allowDrop(event) {
    event.preventDefault();
}
function drag(event) {
    const taskElement = event.target.closest('.task');
    if (!taskElement) return;
    currentDraggedElement = taskElement;
    event.dataTransfer.setData('text/plain', String(taskElement.id));

    function createSubtasks(subtaskValue) {
        if (!subtaskValue) {
            return [];
        }

        return [
            {
                title: subtaskValue,
                done: false,
            }
        ];
    }

    function getSubtaskSignature(todo) {
        if (Array.isArray(todo.subtasks)) {
            return todo.subtasks.map(subtask => subtask.title).join('|');
        }

        return todo.subtask || '';
    }

    function getSubtaskPreview(todo) {
        if (Array.isArray(todo.subtasks) && todo.subtasks.length > 0) {
            return todo.subtasks[0].title;
        }

        return todo.subtask || '';
    }

    function getSubtaskCountText(todo) {
        if (!Array.isArray(todo.subtasks) || todo.subtasks.length === 0) {
            return '0 / 0';
        }

        const completedSubtasks = todo.subtasks.filter(subtask => subtask.done).length;
        return `${completedSubtasks} / ${todo.subtasks.length}`;
    }
}
function moveTaskToCategory(taskId, targetCategory) {
    if (!targetCategory) return;
    const taskIndex = todos.findIndex(todo => todo.id == taskId);
    if (taskIndex !== -1) {
        todos[taskIndex].category = targetCategory;
        updateHTML();
    }
}
function drop(event) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain') || currentDraggedElement?.id;
    const dropZoneId = event.currentTarget.id;
    const categoryMap = {
        'board__list--todo': 'toDo',
        'board__list--inprogress': 'inProgress',
        'board__list--feedback': 'feedback',
        'board__list--done': 'done'
    };
    const targetCategory = categoryMap[dropZoneId];
    moveTaskToCategory(taskId, targetCategory);
}
function moveTo(event) {
    const targetCategory = event.currentTarget.dataset.category;
    moveTaskToCategory(event.target.id, targetCategory);
}

function updateHTML() {
    toDoContentToHTML();
    inProgressContentToHTML();
    feedbackContentToHTML();
    doneContentToHTML();
}
function inProgressContentToHTML() {
    const inProgressContainer = document.getElementById('board__cards--inprogress');
    inProgressContainer.innerHTML = '';
    for (let i = 0; i < todos.length; i++) {
        const todo = todos[i];
        if (todo.category === 'inProgress') {
            const todoHTML = generateTodoHTML(todo);
            inProgressContainer.innerHTML += todoHTML;
        }
    }
}
function feedbackContentToHTML() {
    const feedbackContainer = document.getElementById('board__cards--feedback');
    feedbackContainer.innerHTML = '';
    for (let i = 0; i < todos.length; i++) {
        const todo = todos[i];
        if (todo.category === 'feedback') {
            const todoHTML = generateTodoHTML(todo);
            feedbackContainer.innerHTML += todoHTML;
        }
    }
}
function doneContentToHTML() {
    const doneContainer = document.getElementById('board__cards--done');
    doneContainer.innerHTML = '';
    for (let i = 0; i < todos.length; i++) {
        const todo = todos[i];
        if (todo.category === 'done') {
            const todoHTML = generateTodoHTML(todo);
            doneContainer.innerHTML += todoHTML;
        }
    }
}



//DRAG AND DROP ENDE
function addTask(category) {
    const dialog = document.getElementById("addTaskDialog");
    dialog.dataset.category = category || '';
    renderDialogContent();
    dialog.showModal();
}
function addTaskToDo() {
    addTask('toDo');
}
function addTaskInProgress() {
    addTask('inProgress');
}
function addTaskFeedback() {
    addTask('feedback');
}
function addTaskDone() {
    addTask('done');
}

function closeDialog() {
    const dialog = document.getElementById("addTaskDialog");
    dialog.close();
}
function categoryLabel(category) {
    if (category === 'toDo') return 'Technical Task';
    else if (category === 'inProgress') return 'User Story';
    else if (category === 'feedback') return 'Awaiting Feedback';
    else if (category === 'done') return 'Done';
    else return '';
}
function toDoContentToHTML() {
    const toDoContainer = document.getElementById('board__cards--todo');
    const noCardElement = document.getElementById('noneCardTodo');
    toDoContainer.innerHTML = '';
    for (let i = 0; i < todos.length; i++) {
        const todo = todos[i];
        if (todo.category === 'toDo') {
            const todoHTML = generateTodoHTML(todo);
            toDoContainer.innerHTML += todoHTML;
            noCardElement.style.display = 'none';
        } else if (todos.filter(todo => todo.category === 'toDo').length === 0) {
            noCardElement.style.display = 'flex';
        }
    }
}



function renderDialogContent() {
    const dialog = document.getElementById("addTaskDialog");
    dialog.innerHTML = getTemplateDialog();
    // Event-Listener für das Formular hinzufügen
    const form = dialog.querySelector('.task-form');
    if (form) {
        form.addEventListener('submit', handleCreateTask);
    }
    // Cancel-Button leert das Formular und schließt den Dialog
    const cancelBtn = dialog.querySelector('#cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            form.reset();
        });
    }

    // Kontakte in das Select einfügen
    const assignedToSelect = dialog.querySelector('#assigned-to');
    if (assignedToSelect) {
        assignedToSelect.innerHTML = '<option value="">Select contacts to assign</option>';
        contacts.forEach(contact => {
            assignedToSelect.innerHTML += `<option value="${contact.id}">${contact.name}</option>`;
        });
    }
    // Kategorien dynamisch einfügen
    const categorySelect = dialog.querySelector('#category');
    if (categorySelect) {
        categories.forEach(cat => {
            categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
    }

    // Prioritäts-Button-Listener setzen
    const priorityurgent = document.getElementById('priority-urgent');
    const priorityMedium = document.getElementById('priority-medium');
    const priorityLow = document.getElementById('priority-low');
    priorityurgent.classList.remove('priority-buttons__btn--urgent');
    priorityMedium.classList.remove('priority-buttons__btn--medium');
    priorityLow.classList.remove('priority-buttons__btn--low');
    if (priorityurgent) {

        priorityurgent.addEventListener('click', () => {
            priorityurgent.classList.toggle('priority-buttons__btn--urgent');
            priorityMedium.classList.remove('priority-buttons__btn--medium');
            priorityLow.classList.remove('priority-buttons__btn--low');
        });
    }
    if (priorityMedium) {

        priorityMedium.addEventListener('click', () => {
            priorityMedium.classList.toggle('priority-buttons__btn--medium');
            priorityurgent.classList.remove('priority-buttons__btn--urgent');
            priorityLow.classList.remove('priority-buttons__btn--low');
        });
    }
    if (priorityLow) {
        priorityLow.addEventListener('click', () => {
            priorityLow.classList.toggle('priority-buttons__btn--low');
            priorityurgent.classList.remove('priority-buttons__btn--urgent');
            priorityMedium.classList.remove('priority-buttons__btn--medium');
        });
    }
}


// Liest die Formulardaten aus und erstellt ein neues Todo
function handleCreateTask(event) {
    event.preventDefault();
    const dialog = document.getElementById("addTaskDialog");
    const title = dialog.querySelector('#title').value.trim();
    const description = dialog.querySelector('#description').value.trim();
    const dueDate = dialog.querySelector('#due-date').value;
    const priority = getSelectedPriority(dialog);
    const assignedToId = dialog.querySelector('#assigned-to').value;
    const assignedContact = contacts.find(c => c.id == assignedToId);
    const assignedTo = assignedContact ? [assignedContact] : [];
    const categoryValue = dialog.querySelector('#category').value;
    const selectedCategoryLabel = categoryValue || 'Technical Task';
    const presetCategory = dialog.dataset.category;
    // Wenn über Spalten-Button geöffnet, bleibt die Zielspalte fix.
    // Nur beim globalen "Add Task +" (ohne preset) wird aus dem Select gemappt.
    let category = 'toDo';
    if (presetCategory) {
        category = presetCategory;
    } else if (categoryValue === 'Technical Task') {
        category = 'toDo';
    } else if (categoryValue === 'User Story') {
        category = 'inProgress';
    }
    const subtask = dialog.querySelector('#subtask').value.trim();
    const subtasks = createSubtasks(subtask);
    // Neues Todo-Objekt
    const newTodo = {
        id: Date.now(),
        title,
        description,
        dueDate,
        priority,
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
        todo.category === newTodo.category &&
        getSubtaskSignature(todo) === getSubtaskSignature(newTodo)
    );

    if (existingTodo) {
        if (!Array.isArray(existingTodo.assignedTo)) {
            existingTodo.assignedTo = [];
        }

        if (assignedContact) {
            const alreadyAssigned = existingTodo.assignedTo.some(user => user.id === assignedContact.id);
            if (!alreadyAssigned) {
                existingTodo.assignedTo.push(assignedContact);
            }
        }
    } else {
        todos.push(newTodo);
    }

    updateHTML();
    closeDialog();
}

function getSelectedPriority(dialog) {
    const priorityUrgent = dialog.querySelector('#priority-urgent');
    const priorityMedium = dialog.querySelector('#priority-medium');
    const priorityLow = dialog.querySelector('#priority-low');
    if (!priorityUrgent || !priorityMedium || !priorityLow) {
        return 'None';
    }
    if (priorityUrgent.classList.contains('priority-buttons__btn--urgent')) {
        return 'Urgent';
    } else if (priorityMedium.classList.contains('priority-buttons__btn--medium')) {
        return 'Medium';
    } else if (priorityLow.classList.contains('priority-buttons__btn--low')) {
        return 'Low';
    } else {
        return 'None';
    }

}

function getCircleUserTemplate(userAbbreviation) {
    return `
        <svg width="50" height="50" viewBox="0 0 80 80" aria-hidden="true">
            <circle class="header__circle" cx="40" cy="40" r="38" stroke="#555" stroke-width="4" fill="white" />
            <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="28" font-family="Inter, sans-serif" fill="#4a90e2" font-weight="700">${userAbbreviation}</text>
        </svg>
    `;
}

function createSubtasks(subtaskValue) {
    if (!subtaskValue) {
        return [];
    }

    return [
        {
            title: subtaskValue,
            done: false,
        }
    ];
}

function getSubtaskSignature(todo) {
    if (Array.isArray(todo.subtasks)) {
        return todo.subtasks.map(subtask => subtask.title).join('|');
    }

    return todo.subtask || '';
}

function getSubtaskPreview(todo) {
    if (Array.isArray(todo.subtasks) && todo.subtasks.length > 0) {
        return todo.subtasks[0].title;
    }

    return todo.subtask || '';
}

function getSubtaskCountText(todo) {
    if (!Array.isArray(todo.subtasks) || todo.subtasks.length === 0) {
        return '0 / 0';
    }

    const completedSubtasks = todo.subtasks.filter(subtask => subtask.done).length;
    return `${completedSubtasks} / ${todo.subtasks.length}`;
}

function getCategoryHeaderClass(label) {
    if (label === 'User Story') return 'UserStory';
    if (label === 'Technical Task') return 'TechnicalTask';
    return '';
}

function generateTodoHTML(todo) {
    const fixedHeaderLabel = todo.selectedCategoryLabel || categoryLabel(todo.category);
    const headerClass = getCategoryHeaderClass(fixedHeaderLabel);
    const assignedUsersHTML = Array.isArray(todo.assignedTo)
        ? todo.assignedTo.map(user => getCircleUserTemplate(user.abbreviation || '')).join('')
        : '';
    const subtaskPreview = getSubtaskPreview(todo);
    const subtaskCountText = getSubtaskCountText(todo);

    return `<div class="task" id="${todo.id}" draggable="true" ondragstart="drag(event)">
        <h3 class="category__header ${headerClass}" id="categoryHeader">${fixedHeaderLabel}</h3>
        <h4 class="headline__task" id="headline${todo.id}">${todo.title}</h4>
        <p class="category__description" id="description${todo.id}">${todo.description}</p>
        <span class="due-date" id="dueDate${todo.id}">${todo.dueDate}</span>
        <span class="subtask">${subtaskPreview}</span>
        <p id="subtaskCount">${subtaskCountText}</p>
        <div class="user__profile" id="users">
            ${assignedUsersHTML}
            <p class="priority" id="priorityLevel">${todo.priority}</p>
        </div>
    </div>`;
};




function getTemplateDialog() {
    return `<header class="addTaskDialog__header">
                        <h2 class="addTaskDialog__title">Add Task</h2>
                        <button onclick="closeDialog()" class="addTaskDialog__close-btn" aria-label="Close dialog">×</button>
                    </header>
                    <form class="task-form">
                        <div class="task-form__body">
                            <div class="task-form__col task-form__col--left">
                                <label class="task-form__label" for="title"> Title <span class="task-form__required">*</span> </label>
                                <input class="task-form__input" type="text" id="title" placeholder="Enter a title" required="">
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
                                    <button id="priority-urgent" type="button" class="priority-btn-color-none priority-buttons__btn--urgent">Urgent <span class="priority-buttons__icon priority-buttons__icon--up"> ⟪</span></button>
                                    <button id="priority-medium" type="button" class="priority-btn-color-none priority-buttons__btn--medium">Medium <span class="priority-buttons__icon"> ‖</span></button>
                                    <button id="priority-low" type="button" class="priority-btn-color-none priority-buttons__btn--low">Low <span class="priority-buttons__icon priority-buttons__icon--down"> ⟪</span></button>
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

                                <div class="task-form__footer">
                                    <div class="task-form__actions">
                                        <button id="cancel-btn" class="" type="reset">Cancel X</button>
                                        <button id="create-task-btn" class="" type="submit">Create Task</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>`;
}

function editTask(taskId) {
    const task = todos.find(t => t.id == taskId);
    if (!task) return;
    const dialog = document.getElementById("editTaskDialog");
    dialog.dataset.taskId = taskId;
    dialog.innerHTML = getEditTaskTemplate(task);
    dialog.showModal();
}

function getEditTaskTemplate(task) {
    return `<header class="addTaskDialog__header">
            <h3 class="category__header ${headerClass}" id="categoryHeader">${fixedHeaderLabel}</h3>
            <button onclick="closeDialog()" class="addTaskDialog__close-btn" aria-label="Close dialog">×</button>
        </header>
        <section class="editTaskDialog__content">
            <h4 class="headline__task" id="headline${task.id}">${task.title}</h4>
            <p class="category__description" id="description${task.id}">${task.description}</p>
            <span class="due-date" id="dueDate${task.id}">${task.dueDate}</span>
            <p class="priority" id="priorityLevel">${task.priority}</p>
            <div class="user__profile" id="users">
            <h5>Assigned To:</h5>
            <list class="assigned-users-list">
                ${assignedUsersHTML}
            </list>
            </div>
            <div class="subtasks-section">
                <h5>Subtasks:</h5>
                <ul class="subtasks-list">
                    <input type="checkbox" id="subtask1" name="subtask1" ${task.subtasks[0]?.done ? 'checked' : ''}>
                    <label for="subtask1">${task.subtasks[0]?.title || 'No subtasks'}</label>
                </ul>
            </div>
        </section>
        <footer class="editTaskDialog__footer">
            <button class="editTaskDialog__delete-btn" type="button" onclick="deleteTask(${task.id})">Delete Task</button>
            <button class="editTaskDialog__save-btn" type="button" onclick="saveTask(${task.id})">Save Task</button>
        </footer>`;
}