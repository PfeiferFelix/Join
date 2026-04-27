let boardsLS = importandFormatLocalStorageData("boards");

let todo = 0;
let done = 0;
let urgent = 0;
let tasksInBoard = 0;
let tasksInProgress = 0;
let awaitingFeedback = 0;
let nextUrgentDate = "October 16, 2020"; // muss noch berechnet werden

// die bilder für die verschiedenen tasks müssen versetzt werden je nachdem wie die breite ist

function initSummary() {
    addNameToGoodMorning();
    calcTasksDataSummary();
    setTasksDataInSummary();
}

function toDoOpen() {}

function addNameToGoodMorning() {
    if (currentUserNameLS !== "Gast") {
        document.getElementById("js-greeting-name").innerHTML = currentUserNameLS;
        document.getElementById("js-greeting-morning").innerText += `,`;
    }
}

function calcTasksDataSummary() {
    for (element of boardsLS) {
        switch (element.position) {
            case "todo":
                todo += 1;
                break;
            case "done":
                done += 1;
                break;
            case "tasksInProgress":
                tasksInProgress += 1;
                break;
            case "awaitingFeedback":
                awaitingFeedback += 1;
                break;
        }
        tasksInBoard += 1;
    }
}

function setTasksDataInSummary() {
    document.getElementById("js-to-do-count").textContent = todo;
    document.getElementById("js-done-count").textContent = done;
    document.getElementById("js-urgent-count").textContent = urgent;
    document.getElementById("js-deadline-date").textContent = nextUrgentDate;
    document.getElementById("js-tasks-in-progress-count").textContent = tasksInProgress;
    document.getElementById("js-awaiting-feedback").textContent = awaitingFeedback;
    document.getElementById("js-tasks-in-board").textContent = tasksInBoard;
}
