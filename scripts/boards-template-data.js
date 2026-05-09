// Returns the avatar fill color from AVATAR_COLORS for a given index.
function getAvatarFillColor(index) {
    const colors = typeof AVATAR_COLORS !== 'undefined' ? AVATAR_COLORS : [
        '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF', '#00BEE8',
        '#1FD7C1', '#FF745E', '#FFA35E', '#FC71FF', '#FFC701',
        '#0038FF', '#C3FF2B', '#FFE62B', '#FF4646', '#FFBB2B',
    ];
    return colors[index % colors.length];
}

// Builds reusable task display labels and icon symbols.
function getPriorityView(priority) {
    const iconClass = getPriorityIconClass(priority || '');
    const priorityLabel = priority || '';
    const text = priorityLabel === '⟪' ? 'Urgent' : priorityLabel === '‖' ? 'Medium' : priorityLabel === '⟫' ? 'Low' : (priorityLabel || 'Medium');
    const icon = iconClass === 'up' ? '⟪' : iconClass === 'down' ? '⟫' : '‖';
    return { text, iconClass, icon };
}

// Returns assigned users as show-dialog row HTML.
function getShowAssignedUsersHTML(task) {
    const users = Array.isArray(task.assignedTo) ? task.assignedTo : [];
    return users.map((user, index) => {
        const fill = getAvatarFillColor(index);
        return getAssignedUserWithNameTemplate(user, fill);
    }).join('');
}

// Returns subtasks as show-dialog list HTML.
function getShowSubtasksHTML(task) {
    const subtasks = getLimitedSubtasks(task.subtasks);
    return subtasks.map((subtask, index) => getShowSubtaskItemTemplate(subtask, task.id, index)).join('');
}

// Builds HTML strings for assigned users and subtasks in the show dialog.
function buildShowTaskHTML(task) {
    return {
        assignedUsersHTML: getShowAssignedUsersHTML(task),
        subtasksHTML: getShowSubtasksHTML(task),
    };
}

// Builds view data for the task detail dialog.
function buildShowTaskViewData(task) {
    const fixedHeaderLabel = task.selectedCategoryLabel || categoryLabel(task.category);
    const { text, iconClass, icon } = getPriorityView(task.priority);
    const { assignedUsersHTML, subtasksHTML } = buildShowTaskHTML(task);
    return { id: task.id, title: task.title, description: task.description || '', dueDate: task.dueDate || '', fixedHeaderLabel,
        headerClass: getCategoryHeaderClass(fixedHeaderLabel), priorityLabel: text, iconClass, priorityIcon: icon,
        assignedUsersHTML, subtasksHTML };
}

// Builds subtask-related data for a task card.
function buildTodoCardSubtaskData(todo) {
    const subtasks = getLimitedSubtasks(todo?.subtasks);
    const doneCount = subtasks.filter(subtask => Boolean(subtask.done)).length;
    const hasSubtasks = subtasks.length > 0;
    const subtaskPercent = hasSubtasks ? Math.round((doneCount / subtasks.length) * 100) : 0;
    return { subtasks, doneCount, hasSubtasks, subtaskPercent };
}

// Builds assigned users HTML for a board task card.
function getTodoAssignedUsersHTML(todo) {
    if (!Array.isArray(todo.assignedTo)) return '';
    return todo.assignedTo.map((user, index) => {
        const fill = getAvatarFillColor(index);
        return getCircleUserTemplate(user.abbreviation || '', fill);
    }).join('');
}

// Builds template data used to render a task card.
function buildTodoCardTemplateData(todo) {
    const fixedHeaderLabel = todo.selectedCategoryLabel || categoryLabel(todo.category);
    const { iconClass, icon } = getPriorityView(todo.priority || 'Medium');
    const { subtasks, doneCount, hasSubtasks, subtaskPercent } = buildTodoCardSubtaskData(todo);
    const nextCategory = getNextBoardCategory(todo.category);
    return { id: todo.id, title: todo.title, description: todo.description || '', fixedHeaderLabel,
        headerClass: getCategoryHeaderClass(fixedHeaderLabel), priorityLabel: todo.priority || 'Medium', iconClass, priorityIcon: icon,
        assignedUsersHTML: getTodoAssignedUsersHTML(todo), subtaskCountText: getSubtaskCountText(todo), subtaskPercent,
        hasSubtasks, hasCheckedSubtasks: doneCount > 0, allSubtasksDone: hasSubtasks && doneCount === subtasks.length,
        nextMoveArrow: getMoveDirectionArrow(todo.category, nextCategory), nextMoveLabel: getBoardColumnLabel(nextCategory), nextMoveDisabled: false };
}

// Builds assigned users HTML for task detail/edit sections.
function getDetailAssignedUsersHTML(task) {
    if (!Array.isArray(task.assignedTo)) return '';
    return task.assignedTo.map((user, index) => {
        const fill = getAvatarFillColor(index);
        return `<div class="assigned-user-row">${getCircleUserTemplate(user.abbreviation || '', fill)}<span class="assigned-user-name">${user.name || ''}</span></div>`;
    }).join('');
}

// Builds subtasks list item HTML for detail/edit sections.
function getDetailSubtasksHTML(subtasks) {
    return subtasks.map((subtask, index) => `<li class="subtask-item" data-subtask-index="${index}">${subtask.title}</li>`).join('');
}

// Builds options HTML for editable task categories.
function getCategoryOptionsHTML(fixedHeaderLabel) {
    return ['Technical Task', 'User Story'].map(option => `<option value="${option}" ${option === fixedHeaderLabel ? 'selected' : ''}>${option}</option>`).join('');
}

// Builds template data for the editable task form view.
function buildEditTaskFormTemplateData(task) {
    const fixedHeaderLabel = task.selectedCategoryLabel || categoryLabel(task.category);
    const subtasks = getLimitedSubtasks(task.subtasks);
    const subtasksHTML = getDetailSubtasksHTML(subtasks);
    return { id: task.id, title: task.title, description: task.description || '', dueDate: task.dueDate || '', fixedHeaderLabel,
        headerClass: getCategoryHeaderClass(fixedHeaderLabel), priority: task.priority, assignedUsersHTML: getDetailAssignedUsersHTML(task),
        editSubtasksHTML: subtasksHTML, subtasksHTML, subtasks, categoryOptionsHTML: getCategoryOptionsHTML(fixedHeaderLabel) };
}
