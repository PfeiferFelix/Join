let boardsLS = importandFormatLocalStorageData("boards");

let todo = 0;
let done = 0;
let urgent = 0;
let tasksInBoard = 0;
let tasksInProgress = 0;
let awaitingFeedback = 0;

const currentDate = new Date();
const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

let nextUrgentDate;

const maxWidth = window.matchMedia("(max-width: 850px)");

/**
 * Initializes the summary page by updating the greeting, adding the user's name to the greeting, iterating through task data to calculate summary statistics, and setting those statistics in the summary display.
 */
function initSummary() {
    changeGreeting();
    addNameToGreeting();
    iteradeTasksData();
    setTasksDataInSummary();
    checkIfUserJustLoggedIn();
    addAnimationToMobileSummary(maxWidth);
}

/**
 * Adds the current user's name to the greeting if it is not "Gast". It updates the greeting message to include the user's name and adds a comma after the greeting.
 */
function addNameToGreeting() {
    const greetingRef = document.getElementById("js-greeting-morning");
    if (currentUserNameLS !== "Gast") {
        document.getElementById("js-greeting-name").innerHTML = currentUserNameLS;
        greetingRef.innerText += `,`;
    } else {
        greetingRef.innerText += `!`;
    }
}

/**
 * Iterates through the task data stored in local storage (boardsLS) and calculates summary statistics for the tasks. It counts the number of tasks in different states (to-do, done, in progress, awaiting feedback) and the number of urgent tasks. It also determines the nearest due date for any urgent tasks. The calculated statistics are then set in the summary display.
 */
function iteradeTasksData() {
    for (const element of boardsLS) {
        calcTasksDataSummary(element);
        getNearestDate(element.due_date);
    }
}

/**
 * Calculates summary statistics for a given task element. It updates the counts for different task states (to-do, done, in progress, awaiting feedback) and the number of urgent tasks. It also increments the total number of tasks in the board.
 * @param {Object} element - The task element to process.
 */
function calcTasksDataSummary(element) {
    switch (element.position) {
        case "todo":
            todo += 1;
            break;
        case "done":
            done += 1;
            break;
        case "in progress":
            tasksInProgress += 1;
            break;
        case "awaiting feedback":
            awaitingFeedback += 1;
            break;
    }
    if (element.priority === "urgent") urgent += 1;
    tasksInBoard += 1;
}

/**
 * Determines the nearest due date for any urgent tasks. It takes a due date as input, formats it, and compares it to the current date. If the due date is in the future and is earlier than the currently stored nearest urgent date, it updates the nearest urgent date.
 * @param {String} dueDate - The due date of a board
 */
function getNearestDate(dueDate) {
    if (dueDate) {
        const [year, month, day] = dueDate.split("-").map(Number);
        const dueDateFormatted = new Date(year, month - 1, day);

        if (dueDateFormatted > today && (!nextUrgentDate || dueDateFormatted < nextUrgentDate)) {
            nextUrgentDate = dueDateFormatted;
        }
    }
}

/**
 * Sets the calculated summary statistics in the summary display. It updates the text content of various elements in the summary page to reflect the counts of tasks in different states, the number of urgent tasks, and the nearest urgent due date.
 */
function setTasksDataInSummary() {
    const summaryFields = [
        ["js-to-do-count", todo],
        ["js-done-count", done],
        ["js-urgent-count", urgent],
        ["js-tasks-in-progress-count", tasksInProgress],
        ["js-awaiting-feedback", awaitingFeedback],
        ["js-tasks-in-board", tasksInBoard],
        [
            "js-deadline-date",
            nextUrgentDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
            }),
        ],
    ];

    for (const [id, value] of summaryFields) {
        document.getElementById(id).textContent = value;
    }
}

/**
 * Changes the greeting message based on the current time of day. It determines the appropriate greeting (e.g., "Guten Morgen", "Guten Mittag", etc.) based on the hour of the day and updates the text content of the greeting element accordingly.
 */
function changeGreeting() {
    let greetingString;
    let hour = currentDate.getHours();

    if (hour >= 5 && hour < 11) {
        greetingString = "Guten Morgen";
    } else if (hour >= 11 && hour < 14) {
        greetingString = "Guten Mittag";
    } else if (hour >= 14 && hour < 18) {
        greetingString = "Guten Nachmittag";
    } else if (hour >= 18 && hour < 22) {
        greetingString = "Guten Abend";
    } else {
        greetingString = "Erholsame Nacht";
    }

    document.getElementById("js-greeting-morning").textContent = greetingString;
}

/**
 * Animation that is added to the summary page when the user has just logged in and is accessing the summary page on a mobile device (max-width: 850px). It checks if the user just logged in and if the screen width matches the specified media query. If both conditions are met, it adds a CSS class to trigger the animation, waits for a specified duration, and then removes the animation class and resets the opacity of the welcoming element.
 * @param {MediaQueryList} maxWidth - A MediaQueryList object that represents the result of the media query for max-width: 850px. It is used to determine if the screen width matches the specified condition for applying the animation on mobile devices.
 */
async function addAnimationToMobileSummary(maxWidth) {
    if (!fromLogin) return;
    if (!maxWidth.matches) return;

    const welcomingRef = document.getElementById("js-welcoming");
    if (!welcomingRef) return;

    welcomingRef.classList.add("welcoming__animation-mobile");
    await timeDelay(1500);
    welcomingRef.classList.add("welcoming__fade-out");
    await timeDelay(500);
    welcomingRef.classList.remove("welcoming__animation-mobile");
    welcomingRef.classList.remove("welcoming__fade-out");
    fromLogin = false;
}

/**
 * Checks if the user has just logged in by looking for a specific flag in session storage. If the flag is found, it removes the flag from session storage and sets a variable (fromLogin) to true, indicating that the user has just logged in. This variable can then be used to trigger certain actions or animations on the summary page that should only occur immediately after a successful login.
 */
function checkIfUserJustLoggedIn() {
    if (sessionStorage.getItem("fromLogin") === "true") {
        sessionStorage.removeItem("fromLogin"); // Remove immediately so refresh won't trigger animation again
        fromLogin = true;
    }
}
