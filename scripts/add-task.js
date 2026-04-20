
document.addEventListener('DOMContentLoaded', () => {  // Ensure the DOM is fully loaded before running the script 
    setActivePriority();
    setMinDueDate();
    handleFormSubmit();
});

function setActivePriority() {      // Add click event listeners to priority buttons and toggle active class
    document.querySelectorAll('.priority-buttons__btn').forEach(btn => {  // Select all priority buttons and iterate over them to add event listeners
        btn.addEventListener('click', () => {                             // When a button is clicked, remove the active class from all buttons and add it to the clicked button
            document.querySelectorAll('.priority-buttons__btn')           // Select all priority buttons again to remove the active class from all of them
                .forEach(buttons => buttons.classList.remove('priority-buttons__btn--active'));  // Remove the active class from all buttons and add it to the clicked button
            btn.classList.add('priority-buttons__btn--active');           // Add the active class to the clicked button to visually indicate that it is selected
        });
    });
}

function setMinDueDate() {          // Set the minimum date for the due date input to today's date to prevent selecting past dates
    const today = new Date().toISOString().split('T')[0];       // Get today's date in YYYY-MM-DD format and set it as the minimum value for the due date input field to prevent users from selecting a past date. Split('T')[0] is used to extract just the date part from the ISO string, ensuring that the time component is not included when setting the minimum date for the input field.
    document.getElementById('due-date').setAttribute('min', today);  // Set the minimum date for the due date input field to today's date to ensure that users cannot select a past date for the task's due date
}                                                                   // setAttribute is used to set the 'min' attribute of the input field with the id 'due-date' to the value of today's date, enforcing the restriction on date selection in the form

function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('toast--visible');

    setTimeout(() => {          // setTimeout function to hide the toast after 2 seconds by removing the visible class, allowing the user to see the confirmation message before it disappears
        toast.classList.remove('toast--visible');
    }, 2000);
}

function handleFormSubmit() {
    const form = document.querySelector('.task-form');
    const submitBtn = document.querySelector('.task-form__btn--submit');
    const clearBtn = document.querySelector('.task-form__btn--clear');

    submitBtn.addEventListener('click', () => {
        clearErrors();

        const isValid = validateForm();

        if (isValid) {
            showToast();
            form.reset();
            setTimeout(() => {
                window.location.href = 'boards.html';
            }, 2000);
        }
    });

    clearBtn.addEventListener('click', () => {
        form.reset();
        clearErrors();
    });
}

function validateForm() {
    const requiredFields = document.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showError(field);
            isValid = false;
        }
    });

    return isValid;
}

function showError(field) {
    const error = document.createElement('span');
    error.classList.add('task-form__error');
    error.textContent = 'This field is required*';
    field.insertAdjacentElement('afterend', error);
    field.style.borderColor = 'red';
}

function clearErrors() {
    document.querySelectorAll('.task-form__error').forEach(e => e.remove());
    document.querySelectorAll('[required]').forEach(field => {
        field.style.borderColor = '';
    });
}