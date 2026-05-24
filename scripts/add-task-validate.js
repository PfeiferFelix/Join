function getTodayString() {
    return new Date().toISOString().split("T")[0];
}

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

function validateCategory() {
    if (!document.getElementById('category-selected').dataset.value) {
        document.getElementById('category-error').textContent = 'This field is required*';
        document.getElementById('category-trigger').style.borderColor = 'red';
        return false;
    }
    return true;
}

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