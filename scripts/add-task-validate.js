/**
 * Get today's date string in YYYY-MM-DD format.
 * @returns {string} Today's date in ISO YYYY-MM-DD format.
 */
function getTodayString() {
    return new Date().toISOString().split("T")[0];
}


/**
 * Validate all form fields that have the `required` attribute.
 * Marks empty required fields with an error indicator.
 * @returns {boolean} `true` when all required fields contain non-whitespace text.
 */
function validateRequiredFields() {
    let isValid = true;
    document.querySelectorAll("[required]").forEach((field) => {
        if (!field.value.trim()) {
            showError(field);
            isValid = false;
        }
    });
    return isValid;
}

/**
 * Validate that a category has been selected in the UI.
 * @returns {boolean} `true` when a category is selected, otherwise `false`.
 */
function validateCategory() {
    if (!document.getElementById('category-selected').dataset.value) {
        document.getElementById('category-error').textContent = 'This field is required*';
        document.getElementById('category-trigger').style.borderColor = 'red';
        return false;
    }
    return true;
}

/**
 * Validate the due date input is not earlier than today.
 * @returns {boolean} `true` when the due date is today or in the future.
 */
function validateDueDate() {
    const dueDateInput = document.getElementById('due-date');
    if (dueDateInput.value < getTodayString()) {
        showError(dueDateInput);
        document.getElementById('due-date-error').textContent = 'Please enter a valid future date*';
        return false;
    }
    return true;
}

/**
 * Validate that all required form fields are filled.
 * @returns {boolean} True when the form is valid.
 */
function validateForm() {
    const isFieldsValid = validateRequiredFields();
    const isCategoryValid = validateCategory();
    const isDueDateValid = validateDueDate();
    return isFieldsValid && isCategoryValid && isDueDateValid;
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