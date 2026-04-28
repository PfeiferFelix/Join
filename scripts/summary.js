let boardsLS = importandFormatLocalStorageData("boards");

let todo = 0;
let done = 0;
let urgent = 0;
let tasksInBoard = 0;
let tasksInProgress = 0;
let awaitingFeedback = 0;
let nextUrgentDate = "October 16, 2020"; // muss noch berechnet werden

let currentDate = new Date();

let day;
let month;
let year;

let hour;

let nearestDate;

// die bilder für die verschiedenen tasks müssen versetzt werden je nachdem wie die breite ist
// anpassen header weiter rechts abstand zu good morning passt nicht

function initSummary() {
    changeGreeting();
    addNameToGreeting();
    calcTasksDataSummary();
    setTasksDataInSummary();
}

function toDoOpen() {}

function addNameToGreeting() {
    if (currentUserNameLS !== "Gast") {
        document.getElementById("js-greeting-name").innerHTML = currentUserNameLS;
        document.getElementById("js-greeting-morning").innerText += `,`;
    }
}

//verkürzen
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

        if (element.priority === "urgent") urgent += 1;

        tasksInBoard += 1;
        if (element.due_date) {
            let dateObject = new Date(element.due_date);
            if (dateObject > currentDate && !nearestDate) {
                nearestDate = dateObject;
            }
            if (nearestDate > dateObject) {
                nearestDate = dateObject;
            }
        }
    }
    console.log(nearestDate);
}

function setTasksDataInSummary() {
    const summaryFields = [
        ["js-to-do-count", todo],
        ["js-done-count", done],
        ["js-urgent-count", urgent],
        ["js-tasks-in-progress-count", tasksInProgress],
        ["js-awaiting-feedback", awaitingFeedback],
        ["js-tasks-in-board", tasksInBoard],
    ];

    for (const [id, value] of summaryFields) {
        document.getElementById(id).textContent = value;
    }
}

function changeGreeting() {
    let greetingString;
    hour = currentDate.getHours();

    if (hour >= 5 && hour < 11) {
        greetingString = "Guten Morgen";
    } else if (hour >= 11 && hour < 14) {
        greetingString = "Guten Mittag";
    } else if (hour >= 14 && hour < 18) {
        greetingString = "Guten Nachmittag";
    } else if (hour >= 18 && hour < 22) {
        greetingString = "Guten Abend";
    } else {
        greetingString = "Gute späten Abend";
    }

    document.getElementById("js-greeting-morning").textContent = greetingString;
}
