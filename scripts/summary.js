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

/**
 * Initializes the summary page and fills all summary counters.
 */
function initSummary() {
    changeGreeting();
    addNameToGreeting();
    iteradeTasksData();
    setDate();
    setTasksDataInSummary();
    checkIfUserJustLoggedIn();
    addAnimationToMobileSummary(mobileQuery);
}

/**
 * Adds the current user's name to the greeting when the user is not a guest.
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
 * Loops through all stored tasks and updates the summary counters.
 */
function iteradeTasksData() {
    for (const element of boardsLS) {
        calcTasksDataSummary(element);
        getNearestDate(element.due_date);
    }
}

/**
 * Updates the summary counters for a single task.
 * @param {object} element - The task to evaluate.
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
 * Stores the earliest upcoming due date from urgent tasks.
 * @param {string} dueDate - Due date in YYYY-MM-DD format.
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
 * Formats the next urgent date for display or falls back to a placeholder.
 */
function setDate() {
    if (!nextUrgentDate) {
        nextUrgentDate = "unavailable";
    } else {
        nextUrgentDate = nextUrgentDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    }
}

/**
 * Writes the calculated summary values into the dashboard.
 */
function setTasksDataInSummary() {
    const summaryFields = [
        ["js-to-do-count", todo],
        ["js-done-count", done],
        ["js-urgent-count", urgent],
        ["js-tasks-in-progress-count", tasksInProgress],
        ["js-awaiting-feedback", awaitingFeedback],
        ["js-tasks-in-board", tasksInBoard],
        ["js-deadline-date", nextUrgentDate],
    ];

    for (const [id, value] of summaryFields) {
        document.getElementById(id).textContent = value;
    }
}

/**
 * Sets the greeting text based on the current hour.
 */
function changeGreeting() {
    let greetingString;
    let hour = currentDate.getHours();

    if (hour >= 5 && hour < 11) {
        greetingString = "Good morning";
    } else if (hour >= 11 && hour < 17) {
        greetingString = "Good afternoon";
    } else {
        greetingString = "Good evening";
    }

    document.getElementById("js-greeting-morning").textContent = greetingString;
}

/**
 * Plays the mobile welcome animation right after login.
 * @param {MediaQueryList} mobileQuery - Media query used to detect mobile layouts.
 */
async function addAnimationToMobileSummary(mobileQuery) {
    if (!fromLogin) return;
    if (!mobileQuery.matches) return;

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
 * Detects whether the user has just logged in and resets the session flag.
 */
function checkIfUserJustLoggedIn() {
    if (sessionStorage.getItem("fromLogin") === "true") {
        sessionStorage.removeItem("fromLogin"); // Remove immediately so refresh will not trigger the animation again.
        fromLogin = true;
    }
}
