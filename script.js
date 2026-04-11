/**
 * Initializes the user button by calling the addUserButton function when the page loads.
 */
function init() {
    addSummarySidebar();
    addSummaryHeader();
    addUserButton();
    addUserMenu();
    highlightActivePage();
    document.body.style.visibility = "visible";
}

/**
 * Injects the prepared sidebar template on the summary page.
 */
function addSummarySidebar() {
    const sidebar = document.getElementById("js-sidebar");
    sidebar.innerHTML = getSidebarTemplate();
}

/**
 * Injects the prepared header template on the summary page.
 */
function addSummaryHeader() {
    const header = document.getElementById("js-header");
    header.innerHTML = getHeaderTemplate();
}

/**
 * Adds the user button to the header using the getCircleUserTemplate function.
 */
function addUserButton() {
    const userButton = document.getElementById("js-user-menu-button");
    userButton.innerHTML = getCircleUserTemplate("DG");
}

/**
 * Adds the user menu to the header using the getUserMenuTemplate function.
 */
function addUserMenu() {
    const userMenu = document.getElementById("js-header-user-menu");
    userMenu.innerHTML = getUserMenuTemplate();
}

/**
 * Toggles the visibility of the user menu when the user button is clicked.
 */
function toggleUserMenu() {
    const userMenu = document.getElementById("js-header-user-menu");
    userMenu.style.display = userMenu.style.display === "block" ? "none" : "block";
}

/**
 * Highlights the active sidebar entry for the current page and disables its link.
 */
function highlightActivePage() {
    // Get the current file name without the .html extension.
    const currentPage = window.location.pathname.split("/").pop().replace(".html", "");

    // Find the sidebar element whose id matches the current page.
    const activeElement = document.getElementById(`js-sidebar-${currentPage}`);

    // Stop if no matching sidebar element exists.
    if (!activeElement) {
        return;
    }

    // Check whether the active element belongs to a regular sidebar list item.
    const activeListItem = activeElement.closest(".sidebar__list-item");

    // Find the link element so it can be disabled on the active page.
    const activeLink = activeElement.closest("a");

    // Add the active class to the list item when it exists.
    if (activeListItem) {
        activeListItem.classList.add("sidebar__link--active");
    } else {
        // Otherwise, add the active class directly to the element itself.
        activeElement.classList.add("sidebar__link--active");
    }

    // Remove the link target and mark the current page for accessibility.
    if (activeLink) {
        activeLink.removeAttribute("href");
    }
}
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