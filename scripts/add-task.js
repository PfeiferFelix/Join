/**
 * Base URL for Firebase Realtime Database.
 * @constant {string}
 */
const BASE_URL = "https://join-5bd8d-default-rtdb.europe-west1.firebasedatabase.app/";
const ADD_TASK_DEFAULT_RETURN = "boards.html";

let contactsLS = importandFormatLocalStorageData("contacs");

const AVATAR_COLORS = [
    '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF', '#00BEE8',
    '#1FD7C1', '#FF745E', '#FFA35E', '#FC71FF', '#FFC701',
    '#0038FF', '#C3FF2B', '#FFE62B', '#FF4646', '#FFBB2B',
];
// Returns add-task query params for source/target handling.
function getAddTaskParams() {
    return new URLSearchParams(window.location.search);
}

// Returns the board return target after creating a task.
function getAddTaskReturnTarget() {
    return getAddTaskParams().get("returnTo") || ADD_TASK_DEFAULT_RETURN;
}

// Returns the preselected board category from the URL.
function getRequestedBoardCategory() {
    return getAddTaskParams().get("boardCategory") || "";
}

// Converts add-task category select value to board category key.
function mapFormCategoryToBoardCategory(value) {
    if (value === "user-story") return "inProgress";
    return "toDo";
}

// Converts board category key to display label.
function getBoardCategoryLabel(category) {
    if (category === "inProgress") return "User Story";
    if (category === "feedback") return "Awaiting Feedback";
    if (category === "done") return "Done";
    return "Technical Task";
}

// Returns board category using URL preference over form value.
function getBoardCategoryFromContext() {
    const fromUrl = getRequestedBoardCategory();
    if (fromUrl) return fromUrl;
    return mapFormCategoryToBoardCategory(document.getElementById("category").value);
}

// Returns selected contact names from assigned-to checkboxes.
function getSelectedContactNames() {
    return Array.from(document.querySelectorAll('.dropdown__checkbox:checked')).map((checkbox) => {
        const item = checkbox.closest('.dropdown__item');
        return item.querySelector('.dropdown__name').textContent;
    });
}

// Returns selected contacts in board-assigned format.
function getAssignedUsersForBoardTask() {
    const selectedNames = getSelectedContactNames();
    return contactsLS.filter(c => selectedNames.includes(c.name)).map((contact, index) => ({
        id: Number(contact.id) || index + 1,
        name: contact.name,
        abbreviation: contact.abbreviation || getInitials(contact.name || ""),
    }));
}

// Returns selected priority in board-compatible format.
function getBoardPriorityLabel() {
    const active = document.querySelector('.priority-buttons__btn--active');
    const value = active ? active.dataset.priority || "medium" : "medium";
    if (value === "urgent") return "Urgent";
    if (value === "low") return "Low";
    return "Medium";
}

// Returns entered subtasks in board-compatible format.
function getBoardSubtasks() {
    return Array.from(document.querySelectorAll('.subtask-list__text')).map((span) => ({
        title: span.textContent.replace('• ', '').trim(),
        done: false,
    }));
}

// Creates board task object in boards.js-compatible shape.
function buildBoardTask() {
    const category = getBoardCategoryFromContext();
    const subtasks = getBoardSubtasks();
    return {
        id: Date.now(),
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        dueDate: document.getElementById('due-date').value,
        priority: getBoardPriorityLabel(),
        category,
        selectedCategoryLabel: getBoardCategoryLabel(category),
        assignedTo: getAssignedUsersForBoardTask(),
        subtasks,
        subtask: subtasks[0] ? subtasks[0].title || '' : '',
    };
}

// Persists one task in local storage under boards key.
function saveBoardTaskToLocalStorage(task) {
    const boards = JSON.parse(localStorage.getItem("boards") || "{}");
    boards[task.id] = task;
    localStorage.setItem("boards", JSON.stringify(boards));
}

// Applies optional URL presets to the add-task form.
function applyAddTaskContext() {
    const requested = getRequestedBoardCategory();
    const categorySelect = document.getElementById("category");
    if (!requested || !categorySelect) return;
    if (requested === "inProgress") categorySelect.value = "user-story";
    else categorySelect.value = "technical";
}


/**
 * Initialize add task page functionality.
 * @returns {void}
 */
function initAddTask() {
    setActivePriority();
    setMinDueDate();
    applyAddTaskContext();
    handleFormSubmit();
    addUserToTask();
    setupDropdownEvents();
    setupSubtaskEvents();
    setupCategoryDropdown();
}

/**
 * Set the default active priority button and attach click handlers.
 * @returns {void}
 */
function setActivePriority() {
    document.querySelector('.priority-buttons__btn--medium')
        .classList.add('priority-buttons__btn--active');

    document.querySelectorAll(".priority-buttons__btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".priority-buttons__btn")
                .forEach((buttons) => buttons.classList.remove("priority-buttons__btn--active"));
            btn.classList.add("priority-buttons__btn--active");
        });
    });
}

/**
 * Set the minimum allowed due date to today's date.
 * @returns {void}
 */
function setMinDueDate() {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("due-date").setAttribute("min", today);
}

/**
 * Show a temporary toast notification.
 * @returns {void}
 */
function showToast() {
    const toast = document.getElementById("add__task_toast");
    toast.classList.add('toast--visible');
    setTimeout(() => {
        toast.classList.remove('toast--visible');
    }, 2000);
}

/**
 * Register form submit and clear button listeners.
 * @returns {void}
 */
function handleFormSubmit() {
    const form = document.querySelector(".task-form");
    const submitBtn = document.querySelector(".task-form__btn--submit");
    const clearBtn = document.querySelector(".task-form__btn--clear");

    submitBtn.addEventListener("click", () => handleSubmit(form));
    clearBtn.addEventListener("click", () => handleClear(form));
}

/**
 * Process the form submission, validate input, upload the task, and redirect.
 * @param {HTMLFormElement} form - The task form element.
 * @returns {Promise<void>}
 */
async function handleSubmit(form) {
    clearErrors();
    if (validateForm()) {
        disableButtons(true);
        try {
            await uploadTask();
            saveBoardTaskToLocalStorage(buildBoardTask());
            showToast();
            form.reset();
            setTimeout(() => {
                window.location.href = getAddTaskReturnTarget();
            }, 2000);
        } catch (error) {
            console.error('Aufgabe konnte nicht gespeichert werden:', error);
            disableButtons(false);
            alert('Fehler beim Speichern der Aufgabe. Bitte versuche es erneut.');
        }
    }
}

/**
 * Clear the form and remove any validation errors.
 * @param {HTMLFormElement} form - The task form element.
 * @returns {void}
 */
function handleClear(form) {
    form.reset();
    clearErrors();
    clearSubtaskList();
    clearSelectedUsers();
}

/**
 * Validate that all required form fields are filled.
 * @returns {boolean} True when the form is valid.
 */
function validateForm() {
    const requiredFields = document.querySelectorAll("[required]");
    let isValid = true;

    requiredFields.forEach((field) => {
        if (!field.value.trim()) {
            showError(field);
            isValid = false;
        }
    });
    if (!document.getElementById('category-selected').dataset.value) {
        document.getElementById('category-error').textContent = 'This field is required*';
        document.getElementById('category-trigger').style.borderColor = 'red';
        isValid = false;
    }

    return isValid;
}

/**
 * Display an error message for a required field.
 * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} field - The form field with an error.
 * @returns {void}
 */
function showError(field) {
    const error = document.getElementById(`${field.id}-error`);
    error.textContent = "This field is required*";
    field.style.borderColor = "red";
}

/**
 * Clear all displayed form error messages.
 * @returns {void}
 */
function clearErrors() {
    document.querySelectorAll(".task-form__error").forEach((e) => {
        e.textContent = "";
    });
    document.querySelectorAll("[required]").forEach((field) => {
        field.style.borderColor = "";
    });
    document.getElementById('category-trigger').style.borderColor = '';
}


/**
 * Return initials for a name string.
 * @param {string} name - The full name of the contact.
 * @returns {string} The generated initials.
 */
function getInitials(name) {
    if (!name) return '';
    return name.split(' ')
        .filter(word => word.length > 0)
        .map(word => word[0].toUpperCase())
        .join('');
}

/**
 * Choose an avatar color based on the contact email.
 * @param {string} email - The email of the contact.
 * @returns {string} The selected color code.
 */
function getAvatarColor(email) {
    let sum = 0;
    for (let index = 0; index < email.length; index++) {
        sum += email.charCodeAt(index);
    }
    return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}





/**
 * POST data to Firebase Realtime Database.
 * @param {string} path - The subpath under the database URL.
 * @param {Object} data - The payload to send.
 * @returns {Promise<any>} The JSON response.
 */
async function postData(path, data) {
    console.log('postData aufgerufen:', path, data);
    const response = await fetch(BASE_URL + path + ".json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`Firebase POST fehlgeschlagen: HTTP ${response.status}`);
    return await response.json();
}

/**
 * Collect task form data and upload it.
 * @returns {Promise<void>}
 */
async function uploadTask() {
    const boardCategory = getBoardCategoryFromContext();
    const selectedNames = getSelectedContactNames();
    const taskData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        due_date: document.getElementById('due-date').value,
        category: document.getElementById('category-selected').dataset.value || '',
        sub_task: Array.from(document.querySelectorAll('.subtask-list__text'))
            .map(span => span.textContent.replace('• ', '').trim()),
        position: boardCategory,
        priority: document.querySelector('.priority-buttons__btn--active') ? document.querySelector('.priority-buttons__btn--active').dataset.priority || "medium" : "medium",
        assigned_to: selectedNames,
    };
    await postData("boards", taskData);
}





/**
 * Enable or disable the form action buttons.
 * @param {boolean} disabled - True to disable, false to enable.
 * @returns {void}
 */
function disableButtons(disabled) {
    document.querySelector('.task-form__btn--submit').disabled = disabled;
    document.querySelector('.task-form__btn--clear').disabled = disabled;
}

/**
 * Setup subtask input event listeners.
 * @returns {void}
 */
function setupSubtaskEvents() {
    const input = document.getElementById('subtask');
    const clearBtn = document.getElementById('subtask-clear');
    const confirmBtn = document.getElementById('subtask-confirm');

    input.addEventListener('input', toggleSubtaskButtons);
    input.addEventListener('keydown', handleSubtaskEnter);
    clearBtn.addEventListener('click', clearSubtaskInput);
    confirmBtn.addEventListener('click', addSubtask);
}

function setupCategoryDropdown() {
    document.getElementById('category-trigger').addEventListener('click', toggleCategoryDropdown);
    document.getElementById('category-list').querySelectorAll('.dropdown__item--simple').forEach(item => {
        item.addEventListener('click', () => selectCategory(item));
    });
    document.addEventListener('click', closeCategoryOnOutsideClick);
}

function toggleCategoryDropdown() {
    document.getElementById('category-list').classList.toggle('dropdown__list--visible');
}

function selectCategory(item) {
    document.getElementById('category-selected').textContent = item.textContent;
    document.getElementById('category-selected').dataset.value = item.dataset.value;
    document.getElementById('category-list').classList.remove('dropdown__list--visible');
}

function closeCategoryOnOutsideClick(event) {
    const dropdown = document.getElementById('category-dropdown');
    if (!dropdown.contains(event.target)) {
        document.getElementById('category-list').classList.remove('dropdown__list--visible');
    }
}