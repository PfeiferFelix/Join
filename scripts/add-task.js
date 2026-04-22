let contactsLS = importandFormatLocalStorageData("contacs");

document.addEventListener("DOMContentLoaded", () => {
    // Ensure the DOM is fully loaded before running the script
    setActivePriority();
    setMinDueDate();
    handleFormSubmit();
});

function setActivePriority() {
    // Add click event listeners to priority buttons and toggle active class
    document.querySelectorAll(".priority-buttons__btn").forEach((btn) => {
        // Select all priority buttons and iterate over them to add event listeners
        btn.addEventListener("click", () => {
            // When a button is clicked, remove the active class from all buttons and add it to the clicked button
            document
                .querySelectorAll(".priority-buttons__btn") // Select all priority buttons again to remove the active class from all of them
                .forEach((buttons) => buttons.classList.remove("priority-buttons__btn--active")); // Remove the active class from all buttons and add it to the clicked button
            btn.classList.add("priority-buttons__btn--active"); // Add the active class to the clicked button to visually indicate that it is selected
        });
    });
}

function setMinDueDate() {
    // Set the minimum date for the due date input to today's date to prevent selecting past dates
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format and set it as the minimum value for the due date input field to prevent users from selecting a past date. Split('T')[0] is used to extract just the date part from the ISO string, ensuring that the time component is not included when setting the minimum date for the input field.
    document.getElementById("due-date").setAttribute("min", today); // Set the minimum date for the due date input field to today's date to ensure that users cannot select a past date for the task's due date
} // setAttribute is used to set the 'min' attribute of the input field with the id 'due-date' to the value of today's date, enforcing the restriction on date selection in the form

function showToast() {
    const toast = document.getElementById("add__task_toast");
    toast.classList.add("toast--visible");

    setTimeout(() => {
        // setTimeout function to hide the toast after 2 seconds by removing the visible class, allowing the user to see the confirmation message before it disappears
        toast.classList.remove("toast--visible");
    }, 2000);
}

function handleFormSubmit() {
    // Add event listeners to the submit and clear buttons to handle form submission and clearing of the form, respectively
    const form = document.querySelector(".task-form");
    const submitBtn = document.querySelector(".task-form__btn--submit");
    const clearBtn = document.querySelector(".task-form__btn--clear");

    submitBtn.addEventListener("click", () => handleSubmit(form)); // When the submit button is clicked, call the handleSubmit function, passing the form element as an argument to validate the form and show a toast message if the form is valid. If the form is valid, it will also reset the form and redirect the user to the boards page after a short delay.
    clearBtn.addEventListener("click", () => handleClear(form)); // When the clear button is clicked, call the handleClear function, passing the form element as an argument to reset the form and clear any error messages, allowing the user to start fresh with an empty form.
}

function handleSubmit(form) {
    // Handle form submission by validating the form, showing a toast message if valid, resetting the form, and redirecting to the boards page after a short delay
    clearErrors();
    if (validateForm()) {
        showToast();
        form.reset();
        setTimeout(() => {
            window.location.href = "boards.html";
        }, 2000); // Redirect to the boards page after a short delay to allow the user to see the toast message before navigating away from the form
    }
}

function handleClear(form) {
    form.reset(); // Reset the form to clear all input fields and selections, allowing the user to start fresh with an empty form.
    clearErrors();
}

function validateForm() {
    const requiredFields = document.querySelectorAll("[required]"); // Select all required fields in the form to validate that they are not empty before allowing form submission. This ensures that the user has filled out all necessary information before the form can be submitted successfully.
    let isValid = true;

    requiredFields.forEach((field) => {
        if (!field.value.trim()) {
            // Check if the field is empty or contains only whitespace. If it does, show an error message and set isValid to false to indicate that the form is not valid.
            showError(field);
            isValid = false; // Set isValid to false if any required field is empty, preventing form submission until all required fields are properly filled out by the user.
        }
    });

    return isValid;
}

function showError(field) {
    const error = document.getElementById(`${field.id}-error`); // Get the corresponding error message element for the field using its id and set the text content to display an error message indicating that the field is required. Additionally, change the border color of the input field to red to visually indicate that there is an error with that field.
    error.textContent = "This field is required*"; // Set the text content of the error message element to indicate that the field is required, providing feedback to the user about what needs to be corrected in the form.
    field.style.borderColor = "red"; // Change the border color of the input field to red to visually indicate that there is an error with that field, drawing the user's attention to the specific field that needs to be corrected in the form.
}

function clearErrors() {
    document.querySelectorAll(".task-form__error").forEach((e) => (e.textContent = "")); // Clear the text content of all error message elements to remove any displayed error messages from the form, allowing the user to see a clean form without any error indications after clearing or successfully submitting the form.
    document.querySelectorAll("[required]").forEach((field) => {
        // Reset the border color of all required fields to the default color to remove any red borders that were applied to indicate errors, providing a visual reset for the form after clearing or successfully submitting it.
        field.style.borderColor = "";
    });
}
