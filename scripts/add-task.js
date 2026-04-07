
document.addEventListener('DOMContentLoaded', () => {  // Ensure the DOM is fully loaded before running the script 
    setActivePriority();                            
    setMinDueDate();
});

function setActivePriority() {      // Add click event listeners to priority buttons and toggle active class
    document.querySelectorAll('.priority-buttons__btn').forEach(btn => {  // Select all priority buttons and iterate over them to add event listeners
        btn.addEventListener('click', () => {                             // When a button is clicked, remove the active class from all buttons and add it to the clicked button
            document.querySelectorAll('.priority-buttons__btn')           // Select all priority buttons again to remove the active class from all of them
                .forEach(b => b.classList.remove('priority-buttons__btn--active'));  // Remove the active class from all buttons and add it to the clicked button
            btn.classList.add('priority-buttons__btn--active');           // Add the active class to the clicked button to visually indicate that it is selected
        });
    });
}

function setMinDueDate() {          // Set the minimum date for the due date input to today's date to prevent selecting past dates
    const today = new Date().toISOString().split('T')[0];       // Get today's date in YYYY-MM-DD format and set it as the minimum value for the due date input field to prevent users from selecting a past date
    document.getElementById('due-date').setAttribute('min', today);  // Set the minimum date for the due date input field to today's date to ensure that users cannot select a past date for the task's due date
}