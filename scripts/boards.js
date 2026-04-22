let boardsLS = importandFormatLocalStorageData("boards");

let contacts = [
    { id: 1, name: "David G.", abbreviation: "DG" },
    { id: 2, name: "Anna S.", abbreviation: "AS" },
    { id: 3, name: "John D.", abbreviation: "JD" },
];

let categories = ["Technical Task", "User Story"];

let todos = [];

let currentDraggedElement;

function allowDrop(event) {
    event.preventDefault();
}
function drag(event) {
    const taskElement = event.target.closest(".task");
    if (!taskElement) return;
    currentDraggedElement = taskElement;
    event.dataTransfer.setData("text/plain", String(taskElement.id));
}
function createSubtasks(subtaskValue) {
    if (!subtaskValue) {
        return [];
    }

    return [
        {
            title: subtaskValue,
            done: false,
        },
    ];
}

function getSubtaskSignature(todo) {
    if (Array.isArray(todo.subtasks)) {
        return todo.subtasks.map((subtask) => subtask.title).join("|");
    }

    return todo.subtask || "";
}

function getSubtaskCountText(todo) {
    if (!Array.isArray(todo.subtasks) || todo.subtasks.length === 0) {
        return "0 / 2";
    }

    const currentSubtasks = todo.subtasks.filter((subtask) => subtask?.title?.trim()).length;
    return `${Math.min(currentSubtasks, 2)} / 2`;
}

function moveTaskToCategory(taskId, targetCategory) {
    if (!targetCategory) return;
    const taskIndex = todos.findIndex((todo) => todo.id == taskId);
    if (taskIndex !== -1) {
        todos[taskIndex].category = targetCategory;
        updateHTML();
    }
}
function drop(event) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain") || currentDraggedElement?.id;
    const dropZoneId = event.currentTarget.id;
    const categoryMap = {
        "board__list--todo": "toDo",
        "board__list--inprogress": "inProgress",
        "board__list--feedback": "feedback",
        "board__list--done": "done",
    };
    const targetCategory = categoryMap[dropZoneId];
    moveTaskToCategory(taskId, targetCategory);
}
function moveTo(event) {
    const targetCategory = event.currentTarget.dataset.category;
    moveTaskToCategory(event.target.id, targetCategory);
}

function renderCategoryContent({ category, cardsId, emptyId }) {
    const container = document.getElementById(cardsId);
    const noCardElement = document.getElementById(emptyId);
    if (!container || !noCardElement) return;

    const categoryTasks = todos.filter((todo) => todo.category === category);
    container.innerHTML = categoryTasks.map((todo) => generateTodoHTML(todo)).join("");
    noCardElement.style.display = categoryTasks.length === 0 ? "flex" : "none";
}

function updateHTML() {
    renderCategoryContent({ category: "toDo", cardsId: "board__cards--todo", emptyId: "noneCardTodo" });
    renderCategoryContent({ category: "inProgress", cardsId: "board__cards--inprogress", emptyId: "noneCardInProgress" });
    renderCategoryContent({ category: "feedback", cardsId: "board__cards--feedback", emptyId: "noneCardFeedback" });
    renderCategoryContent({ category: "done", cardsId: "board__cards--done", emptyId: "noneCardDone" });
}

//DRAG AND DROP ENDE
function addTask(category) {
    const dialog = document.getElementById("addTaskDialog");
    dialog.dataset.category = category || "";
    renderDialogContent();
    dialog.showModal();
}
function addTaskToDo() {
    addTask("toDo");
}
function addTaskInProgress() {
    addTask("inProgress");
}
function addTaskFeedback() {
    addTask("feedback");
}
function addTaskDone() {
    addTask("done");
}

function closeDialog() {
    const addTaskDialog = document.getElementById("addTaskDialog");
    const editTaskDialog = document.getElementById("editTaskDialog");

    if (addTaskDialog?.open) {
        addTaskDialog.close();
    }

    if (editTaskDialog?.open) {
        editTaskDialog.close();
    }
}
function categoryLabel(category) {
    if (category === "toDo") return "Technical Task";
    else if (category === "inProgress") return "User Story";
    else if (category === "feedback") return "Awaiting Feedback";
    else if (category === "done") return "Done";
    else return "";
}

function renderDialogContent() {
    const dialog = document.getElementById("addTaskDialog");
    dialog.innerHTML = getTemplateDialog();
    // Event-Listener für das Formular hinzufügen
    const form = dialog.querySelector(".task-form");
    if (form) {
        form.addEventListener("submit", handleCreateTask);
    }
    // Cancel-Button leert das Formular und schließt den Dialog
    const cancelBtn = dialog.querySelector("#cancel-btn");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            form.reset();
        });
    }

    // Kontakte in das Select einfügen
    const assignedToSelect = dialog.querySelector("#assigned-to");
    if (assignedToSelect) {
        assignedToSelect.innerHTML = '<option value="">Select contacts to assign</option>';
        contacts.forEach((contact) => {
            assignedToSelect.innerHTML += `<option value="${contact.id}">${contact.name}</option>`;
        });
    }
    // Kategorien dynamisch einfügen
    const categorySelect = dialog.querySelector("#category");
    if (categorySelect) {
        categories.forEach((cat) => {
            categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
    }

    // Prioritäts-Button-Listener setzen
    const priorityurgent = document.getElementById("priority-urgent");
    const priorityMedium = document.getElementById("priority-medium");
    const priorityLow = document.getElementById("priority-low");
    priorityurgent.classList.remove("priority-buttons__btn--urgent");
    priorityMedium.classList.remove("priority-buttons__btn--medium");
    priorityLow.classList.remove("priority-buttons__btn--low");
    if (priorityurgent) {
        priorityurgent.addEventListener("click", () => {
            priorityurgent.classList.toggle("priority-buttons__btn--urgent");
            priorityMedium.classList.remove("priority-buttons__btn--medium");
            priorityLow.classList.remove("priority-buttons__btn--low");
        });
    }
    if (priorityMedium) {
        priorityMedium.addEventListener("click", () => {
            priorityMedium.classList.toggle("priority-buttons__btn--medium");
            priorityurgent.classList.remove("priority-buttons__btn--urgent");
            priorityLow.classList.remove("priority-buttons__btn--low");
        });
    }
    if (priorityLow) {
        priorityLow.addEventListener("click", () => {
            priorityLow.classList.toggle("priority-buttons__btn--low");
            priorityurgent.classList.remove("priority-buttons__btn--urgent");
            priorityMedium.classList.remove("priority-buttons__btn--medium");
        });
    }
}

// Liest die Formulardaten aus und erstellt ein neues Todo
function handleCreateTask(event) {
    event.preventDefault();
    const dialog = document.getElementById("addTaskDialog");
    const title = dialog.querySelector("#title").value.trim();
    const description = dialog.querySelector("#description").value.trim();
    const dueDate = dialog.querySelector("#due-date").value;
    const priority = getSelectedPriority(dialog);
    const assignedToId = dialog.querySelector("#assigned-to").value;
    const assignedContact = contacts.find((c) => c.id == assignedToId);
    const assignedTo = assignedContact ? [assignedContact] : [];
    const categoryValue = dialog.querySelector("#category").value;
    const selectedCategoryLabel = categoryValue || "Technical Task";
    const presetCategory = dialog.dataset.category;
    // Wenn über Spalten-Button geöffnet, bleibt die Zielspalte fix.
    // Nur beim globalen "Add Task +" (ohne preset) wird aus dem Select gemappt.
    let category = "toDo";
    if (presetCategory) {
        category = presetCategory;
    } else if (categoryValue === "Technical Task") {
        category = "toDo";
    } else if (categoryValue === "User Story") {
        category = "inProgress";
    }
    const subtask = dialog.querySelector("#subtask").value.trim();
    const subtasks = createSubtasks(subtask);
    // Neues Todo-Objekt
    const newTodo = {
        id: Date.now(),
        title,
        description,
        dueDate,
        priority,
        priorityClass: getPriorityIconClass(priority),
        assignedTo,
        category,
        selectedCategoryLabel,
        subtasks,
        subtask,
    };

    const existingTodo = todos.find((todo) => todo.title === newTodo.title && todo.description === newTodo.description && todo.dueDate === newTodo.dueDate && todo.priority === newTodo.priority && todo.category === newTodo.category && getSubtaskSignature(todo) === getSubtaskSignature(newTodo));

    if (existingTodo) {
        if (!Array.isArray(existingTodo.assignedTo)) {
            existingTodo.assignedTo = [];
        }

        if (assignedContact) {
            const alreadyAssigned = existingTodo.assignedTo.some((user) => user.id === assignedContact.id);
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
    const priorityUrgent = dialog.querySelector("#priority-urgent");
    const priorityMedium = dialog.querySelector("#priority-medium");
    const priorityLow = dialog.querySelector("#priority-low");
    if (!priorityUrgent || !priorityMedium || !priorityLow) {
        return "None";
    }
    if (priorityUrgent.classList.contains("priority-buttons__btn--urgent")) {
        return "⟪";
    } else if (priorityMedium.classList.contains("priority-buttons__btn--medium")) {
        return "‖";
    } else if (priorityLow.classList.contains("priority-buttons__btn--low")) {
        return "⟫";
    } else {
        return "None";
    }
}

function getPriorityIconClass(priority) {
    if (priority === "Urgent" || priority === "⟪") return "up";
    if (priority === "Medium" || priority === "‖") return "medium";
    if (priority === "Low" || priority === "⟫") return "down";
    return "medium";
}

function createSubtasks(subtaskValue) {
    if (!subtaskValue) {
        return [];
    }
    return [
        {
            title: subtaskValue,
            done: false,
        },
    ];
}

function getSubtaskSignature(todo) {
    if (Array.isArray(todo.subtasks)) {
        return todo.subtasks.map((subtask) => subtask.title).join("|");
    }
    return todo.subtask || "";
}

function getSubtaskPreview(todo) {
    if (Array.isArray(todo.subtasks) && todo.subtasks.length > 0) {
        return todo.subtasks[0].title;
    }
    return todo.subtask || "";
}

function getSubtaskCountText(todo) {
    if (!Array.isArray(todo.subtasks) || todo.subtasks.length === 0) {
        return "0 / 2";
    }
    const currentSubtasks = todo.subtasks.filter((subtask) => subtask?.title?.trim()).length;
    return `${Math.min(currentSubtasks, 2)} / 2`;
}

function getCategoryHeaderClass(label) {
    if (label === "User Story") return "UserStory";
    if (label === "Technical Task") return "TechnicalTask";
    return "";
}

function toDoCardShow(taskId) {
    const task = todos.find((t) => t.id == taskId);
    if (!task) return;
    const dialog = document.getElementById("editTaskDialog");
    dialog.dataset.taskId = taskId;
    dialog.innerHTML = getEditTaskTemplate(task);
    dialog.showModal();
}

function editTask(taskId) {
    const task = todos.find((t) => t.id == taskId);
    if (!task) return;
    const dialog = document.getElementById("editTaskDialog");
    dialog.dataset.taskId = taskId;
    dialog.innerHTML = getEditTaskFormTemplate(task);

    const editForm = dialog.querySelector(".edit-task-form");
    if (editForm) {
        editForm.addEventListener("submit", handleEditTaskSave);
    }

    const addSubtaskBtn = dialog.querySelector("#add-subtask-btn");
    if (addSubtaskBtn) {
        addSubtaskBtn.addEventListener("click", addEditSubtaskRow);
    }

    if (!dialog.open) {
        dialog.showModal();
    }
}

function getEditableSubtasks(task) {
    if (Array.isArray(task.subtasks) && task.subtasks.length > 0) {
        return task.subtasks.slice(0, 2).map((subtask) => ({
            title: subtask.title || "",
            done: Boolean(subtask.done),
        }));
    }

    if (task.subtask) {
        return [{ title: task.subtask, done: false }];
    }

    return [{ title: "", done: false }];
}

function removeEditSubtaskRow(button) {
    const list = document.getElementById("edit-subtasks-list");
    if (!list) return;

    const row = button.closest(".edit-subtask-row");
    if (row) {
        row.remove();
    }

    if (!list.querySelector(".edit-subtask-row")) {
        addEditSubtaskRow();
    }
}

function collectEditedSubtasks(dialog) {
    const rows = dialog.querySelectorAll(".edit-subtask-row");
    const subtasks = [];

    rows.forEach((row) => {
        const title = row.querySelector(".edit-subtask-title")?.value.trim() || "";
        const done = row.querySelector(".edit-subtask-done")?.checked || false;

        if (title) {
            subtasks.push({ title, done });
        }
    });

    return subtasks.slice(0, 2);
}

function mapCategoryLabelToKey(label) {
    if (label === "Technical Task") return "toDo";
    if (label === "User Story") return "inProgress";
    if (label === "Awaiting Feedback") return "feedback";
    if (label === "Done") return "done";
    return "toDo";
}
function getSelectedEditPriority(dialog) {
    const priorityUrgent = dialog.querySelector("#edit-priority-urgent");
    const priorityMedium = dialog.querySelector("#edit-priority-medium");
    const priorityLow = dialog.querySelector("#edit-priority-low");
    if (!priorityUrgent || !priorityMedium || !priorityLow) {
        return "Medium";
    }

    if (priorityUrgent.classList.contains("priority-buttons__btn--urgent")) {
        return "Urgent";
    }

    if (priorityMedium.classList.contains("priority-buttons__btn--medium")) {
        return "Medium";
    }

    if (priorityLow.classList.contains("priority-buttons__btn--low")) {
        return "Low";
    }

    return "Medium";
}

function handleEditTaskSave(event) {
    event.preventDefault();

    const dialog = document.getElementById("editTaskDialog");
    const taskId = Number(dialog.dataset.taskId);
    const task = todos.find((t) => t.id == taskId);
    if (!task) return;

    const updatedTitle = dialog.querySelector("#edit-title")?.value.trim() || "";
    const updatedDescription = dialog.querySelector("#edit-description")?.value.trim() || "";
    const updatedDueDate = dialog.querySelector("#edit-due-date")?.value || "";
    const updatedPriority = getSelectedEditPriority(dialog);
    const updatedCategoryLabel = dialog.querySelector("#edit-category")?.value || "Technical Task";
    const updatedSubtasks = collectEditedSubtasks(dialog);

    task.title = updatedTitle;
    task.description = updatedDescription;
    task.dueDate = updatedDueDate;
    task.priority = updatedPriority;
    task.priorityClass = getPriorityIconClass(updatedPriority);
    task.selectedCategoryLabel = updatedCategoryLabel;
    task.category = mapCategoryLabelToKey(updatedCategoryLabel);
    task.subtasks = updatedSubtasks;
    task.subtask = updatedSubtasks[0]?.title || "";

    updateHTML();
    closeDialog();
}

function setEditPriority(priority) {
    const dialog = document.getElementById("editTaskDialog");
    if (!dialog) return;

    const urgentBtn = dialog.querySelector("#edit-priority-urgent");
    const mediumBtn = dialog.querySelector("#edit-priority-medium");
    const lowBtn = dialog.querySelector("#edit-priority-low");
    if (!urgentBtn || !mediumBtn || !lowBtn) return;

    urgentBtn.classList.remove("priority-buttons__btn--urgent");
    mediumBtn.classList.remove("priority-buttons__btn--medium");
    lowBtn.classList.remove("priority-buttons__btn--low");

    if (priority === "Urgent") {
        urgentBtn.classList.add("priority-buttons__btn--urgent");
    } else if (priority === "Medium") {
        mediumBtn.classList.add("priority-buttons__btn--medium");
    } else if (priority === "Low") {
        lowBtn.classList.add("priority-buttons__btn--low");
    }
}

function deleteTask(taskId) {
    const taskIndex = todos.findIndex((t) => t.id == taskId);
    if (taskIndex !== -1) {
        todos.splice(taskIndex, 1);
        updateHTML();
        closeDialog();
    }
}
