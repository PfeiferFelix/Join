const BASE_URL = "https://join-5bd8d-default-rtdb.europe-west1.firebasedatabase.app/";

let contactsLS = importandFormatLocalStorageData("contacs");



function initAddTask() {
    setActivePriority();
    setMinDueDate();
    handleFormSubmit();
    addUserToTask();
    setupDropdownEvents();
}

function setupDropdownEvents() {
    document.getElementById('assigned-to-search').addEventListener('focus', toggleDropdown);
    document.getElementById('assigned-to-search').addEventListener('input', filterDropdown);
    document.getElementById('assigned-to-arrow').addEventListener('click', toggleDropdown);
}


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

// Set the minimum date for the due date input to today's date to prevent selecting past dates
function setMinDueDate() {
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format and set it as the minimum value for the due date input field to prevent users from selecting a past date. Split('T')[0] is used to extract just the date part from the ISO string, ensuring that the time component is not included when setting the minimum date for the input field.
    document.getElementById("due-date").setAttribute("min", today); // Set the minimum date for the due date input field to today's date to ensure that users cannot select a past date for the task's due date
} // setAttribute is used to set the 'min' attribute of the input field with the id 'due-date' to the value of today's date, enforcing the restriction on date selection in the form

function showToast() {
    const toast = document.getElementById("add__task_toast");
    toast.classList.add('toast--visible');
    setTimeout(() => {
        toast.classList.remove('toast--visible');
    }, 2000);
}

// Add event listeners to the submit and clear buttons to handle form submission and clearing of the form, respectively
function handleFormSubmit() {
    const form = document.querySelector(".task-form");
    const submitBtn = document.querySelector(".task-form__btn--submit");
    const clearBtn = document.querySelector(".task-form__btn--clear");

    submitBtn.addEventListener("click", () => handleSubmit(form)); // When the submit button is clicked, call the handleSubmit function, passing the form element as an argument to validate the form and show a toast message if the form is valid. If the form is valid, it will also reset the form and redirect the user to the boards page after a short delay.
    clearBtn.addEventListener("click", () => handleClear(form)); // When the clear button is clicked, call the handleClear function, passing the form element as an argument to reset the form and clear any error messages, allowing the user to start fresh with an empty form.
}

// Handle form submission by validating the form, showing a toast message if valid, resetting the form, and redirecting to the boards page after a short delay
async function handleSubmit(form) {
    clearErrors();
    if (validateForm()) {
        await uploadTask();
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

    // Check if the field is empty or contains only whitespace. If it does, show an error message and set isValid to false to indicate that the form is not valid.
    requiredFields.forEach((field) => {
        if (!field.value.trim()) {
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

function addUserToTask() { // Populate the "Assigned to" dropdown with contacts from local storage by creating list items for each contact, including their initials, name, and email, and adding event listeners to update the selected avatars when a contact is selected or deselected. This function dynamically generates the dropdown options based on the contacts stored in local storage, allowing users to easily assign tasks to their contacts by selecting them from the dropdown menu.
    const list = document.getElementById('assigned-to-list');
    contactsLS.forEach(contact => { // Iterate over each contact in the contactsLS array to create a dropdown item for each contact, including their initials, name, and email, and add it to the dropdown list. This allows users to see all available contacts in the dropdown menu and select them for task assignment.
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

function getInitials(name) {
    return name.split(' ')
        .map(word => word[0].toUpperCase()) // .map is used to iterate over each word in the name, extract the first character of each word, and convert it to uppercase to create the initials for the contact's avatar in the dropdown menu.
        .join(''); // .join('') is used to concatenate the array of initials into a single string without any spaces, resulting in the final initials that will be displayed in the avatar for each contact in the dropdown menu.
}

function getAvatarColor(name) {
    const colors = ['#ff5733', '#33ff57', '#3357ff', '#ff33a8', '#ffa833', '#a833ff'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
}

function toggleDropdown() {
    const list = document.getElementById('assigned-to-list');
    list.classList.toggle('dropdown__list--visible');
}

function filterDropdown() {
    const search = document.getElementById('assigned-to-search').value.toLowerCase();
    const items = document.querySelectorAll('.dropdown__item');
    items.forEach(item => {
        const name = item.querySelector('.dropdown__name').textContent.toLowerCase();
        item.style.display = name.includes(search) ? 'flex' : 'none'; // Filter the dropdown items based on the search input by checking if the contact's name includes the search term, and toggle the display of each item accordingly to show only the matching contacts in the dropdown menu as the user types in the search field.
    }); // ? is a ternary operator used to set the display style of each dropdown item to 'flex' if the contact's name includes the search term, or 'none' if it does not, effectively showing or hiding the items in the dropdown menu based on the user's search input. This allows for a dynamic and responsive filtering of the contacts in the dropdown menu as the user types.
} // : is used to specify the alternative value ('none') for the display style when the contact's name does not include the search term, ensuring that non-matching items are hidden from view in the dropdown menu.

function updateSelectedAvatars() {
    const container = document.getElementById('selected-avatars');
    container.innerHTML = '';
    document.querySelectorAll('.dropdown__checkbox:checked').forEach(checkbox => { // Update the selected avatars in the container based on the checked checkboxes in the dropdown menu by extracting the initials and color from the corresponding dropdown item and adding the selected avatar template to the container for each selected contact. This function ensures that the selected avatars are displayed in the container as users select or deselect contacts from the dropdown menu, providing a visual representation of the assigned contacts for the task.
        const item = checkbox.closest('.dropdown__item'); // .closest is used to find the closest ancestor element with the class 'dropdown__item' for each checked checkbox, allowing us to access the relevant information (initials and color) for the selected contact from the corresponding dropdown item in order to update the selected avatars in the container.
        const initials = item.querySelector('.dropdown__avatar').textContent;
        const color = item.querySelector('.dropdown__avatar').style.backgroundColor; // .style.backgroundColor is used to retrieve the background color of the avatar element for the selected contact from the dropdown item, allowing us to use that color when generating the selected avatar template to maintain visual consistency between the dropdown and the selected avatars displayed in the container.
        container.innerHTML += getSelectedAvatarTemplate(initials, color); // (initials, color) is used to pass the extracted initials and color for each selected contact to the getSelectedAvatarTemplate function, which generates the HTML template for the selected avatar that will be added to the container, ensuring that the selected avatars are displayed with the correct initials and colors based on the user's selections in the dropdown menu.
    });
}

async function postData(path, data) {
    const response = await fetch(BASE_URL + path + ".json", {
        method: "POST",
        body: JSON.stringify(data)
    });
    return await response.json();
}

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
    console.log(taskData);
}