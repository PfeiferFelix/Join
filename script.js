let todos = [
    {
        'id': 0,
        'title': 'Einkaufen',
        'category': 'toDo',
        'description': 'Bananas, Milk, Bread'
    },
    {
        'id': 1,
        'title': 'Aufräumen',
        'category': 'inProgress',
        'description': 'Wohnzimmer und Küche aufräumen'
    },
    {
        'id': 2,
        'title': 'Auto waschen',
        'category': 'done',
        'description': 'Auto innen und außen reinigen'
    },
    {
        'id': 3,
        'title': 'Feedback abwarten',
        'category': 'awaitingFeedback',
        'description': 'Warten auf Rückmeldung von Max Mustermann bezüglich des Projekts'
    }
];
let currentDraggedElement;

function updateHTML() {
    const categories = ['toDo', 'inProgress', 'awaitingFeedback', 'done'];
    categories.forEach(cat => {
        document.getElementById(cat).innerHTML = '';
    });
    todos.forEach(element => {
        document.getElementById(element.category).innerHTML += generateTodoHTML(element);
    });
}

function startDragging(id) {
    currentDraggedElement = id;
}

function allowDrop(ev) {
    ev.preventDefault();
}

function moveTo(category) {
    todos[currentDraggedElement]['category'] = category;
    updateHTML();
}

function highlight(id) {
    document.getElementById(id).classList.add('drag-area-highlight');
}

function removeHighlight(id) {
    document.getElementById(id).classList.remove('drag-area-highlight');
}
//DRAG AND DROP ENDE

function getSubtaskBarHTML(element) {
    const progressText = getSubtaskProgressText(element);
    return `<div class="subtask-progress">${progressText}</div>`;
}


function getSubtaskProgressText(element) {
    const progress = getSubtaskStats(element);
    if (progress.total === 0) {
        return '';
    }
    return `${progress.done}/${progress.total} Subtasks`;
}

function getSubtaskStats(element) {
    if (!element.subtasks || !Array.isArray(element.subtasks) || element.subtasks.length === 0) {
        return { done: 0, total: 0 };
    }
    const total = element.subtasks.length;
    const done = element.subtasks.filter(s => s.done).length;
    return { done, total };
}