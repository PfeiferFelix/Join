/**
 * Base URL for Firebase Realtime Database.
 * @constant {string}
 */
const BASE_URL = "https://join-5bd8d-default-rtdb.europe-west1.firebasedatabase.app/";

let contactsLS = importandFormatLocalStorageData("contacs");



/**
 * Initialize add task page functionality.
 * @returns {void}
 */
function initAddTask() {
    setActivePriority();
    setMinDueDate();
    handleFormSubmit();
    addUserToTask();
    setupDropdownEvents();
}

/**
 * Attach the dropdown event listeners for search and toggle actions.
 * @returns {void}
 */
function setupDropdownEvents() {
    document.getElementById('assigned-to-search').addEventListener('focus', toggleDropdown);
    document.getElementById('assigned-to-search').addEventListener('input', filterDropdown);
    document.getElementById('assigned-to-arrow').addEventListener('click', toggleDropdown);
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
        await uploadTask();
        showToast();
        form.reset();
        setTimeout(() => {
            window.location.href = "boards.html";
        }, 2000);
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
}

/**
 * Render contacts in the "Assigned to" dropdown.
 * @returns {void}
 */
function addUserToTask() {
    const list = document.getElementById('assigned-to-list');
    contactsLS.forEach(contact => {
        const initials = getInitials(contact.name);
        const color = getAvatarColor(contact.name);
        const li = document.createElement('li');
        li.classList.add('dropdown__item');
        li.innerHTML = getDropdownItemTemplate(initials, color, contact.name, contact.email);
        li.querySelector('.dropdown__checkbox').addEventListener('change', () => {
            updateSelectedAvatars();
        });
        list.appendChild(li);
    });
}

/**
 * Return initials for a name string.
 * @param {string} name - The full name of the contact.
 * @returns {string} The generated initials.
 */
/**
 * Return initials for a name string.
 * @param {string} name - The full name of the contact.
 * @returns {string} The generated initials.
 */
function getInitials(name) {
    return name.split(' ')
        .map(word => word[0].toUpperCase())
        .join('');
}

/**
 * Choose an avatar color based on the contact name.
 * @param {string} name - The full name of the contact.
 * @returns {string} The selected color code.
 */
function getAvatarColor(name) {
    const colors = ['#ff5733', '#33ff57', '#3357ff', '#ff33a8', '#ffa833', '#a833ff'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
}

/**
 * Toggle the visibility of the assigned contacts dropdown.
 * @returns {void}
 */
function toggleDropdown() {
    const list = document.getElementById('assigned-to-list');
    list.classList.toggle('dropdown__list--visible');
}

/**
 * Filter dropdown items by the search input.
 * @returns {void}
 */
function filterDropdown() {
    const search = document.getElementById('assigned-to-search').value.toLowerCase();
    const items = document.querySelectorAll('.dropdown__item');
    items.forEach(item => {
        const name = item.querySelector('.dropdown__name').textContent.toLowerCase();
        item.style.display = name.includes(search) ? 'flex' : 'none';
    });
}

/**
 * Update the selected avatars display for checked contacts.
 * @returns {void}
 */
function updateSelectedAvatars() {
    const container = document.getElementById('selected-avatars');
    container.innerHTML = '';
    document.querySelectorAll('.dropdown__checkbox:checked').forEach(checkbox => {
        const item = checkbox.closest('.dropdown__item');
        const initials = item.querySelector('.dropdown__avatar').textContent;
        const color = item.querySelector('.dropdown__avatar').style.backgroundColor;
        container.innerHTML += getSelectedAvatarTemplate(initials, color);
    });
}

/**
 * POST data to Firebase Realtime Database.
 * @param {string} path - The subpath under the database URL.
 * @param {Object} data - The payload to send.
 * @returns {Promise<any>} The JSON response.
 */
async function postData(path, data) {
    const response = await fetch(BASE_URL + path + ".json", {
        method: "POST",
        body: JSON.stringify(data)
    });
    return await response.json();
}

/**
 * Collect task form data and upload it.
 * @returns {Promise<void>}
 */
async function uploadTask() {
    const taskData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        due_date: document.getElementById('due-date').value,
        category: document.getElementById('category').value,
        sub_task: document.getElementById('subtask').value,
        position: "todo",
        priority: document.querySelector('.priority-buttons__btn--active') ? document.querySelector('.priority-buttons__btn--active').dataset.priority || "medium" : "medium",
        assigned_to: Array.from(document.querySelectorAll('.dropdown__checkbox:checked'))
            .map(checkbox => {
                const item = checkbox.closest('.dropdown__item');
                return item.querySelector('.dropdown__name').textContent;
            })
    };
    await postData("boards", taskData);
}