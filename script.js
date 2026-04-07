let todos = [
    {
        'id': 0,
        'title': 'To Do',
        'category': 'toDo',
        'description': 'todo'
    },
    {
        'id': 1,
        'title': 'In Progress',
        'category': 'inProgress',
        'description': 'todo'
    },
    {
        'id': 2,
        'title': 'Done',
        'category': 'done',
        'description': 'todo'
    },
    {
        'id': 3,
        'title': 'Awaiting Feedback',
        'category': 'awaitingFeedback',
        'description': 'todo'
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

//dragandDrop//