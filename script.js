/**
 * Initialize function
 */
function init() {
    addSidebar();
    addHeader();
    addUserButton();
    addUserMenu();
    addHelpToUserMenu(850);
    highlightActivePage();
    document.body.style.visibility = "visible";
}

/**
 * Injects the prepared sidebar template on the summary page.
 */
function addSidebar() {
    const sidebar = document.getElementById("js-sidebar");
    sidebar.innerHTML = getSidebarTemplate();
}

/**
 * Injects the prepared header template on the summary page.
 */
function addHeader() {
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
 * Highlights the active page in the sidebar by comparing the current URL with the href attributes of the sidebar links. It also changes the icon of the active link to its active version.
 */
function highlightActivePage() {
    const sidebarLinks = document.querySelectorAll("a[id^='js-sidebar-']"); // Select all sidebar links with IDs starting with "js-sidebar-"
    const currentPage = window.location.pathname.split("/").pop().split(".")[0];
    const activeLink = Array.from(sidebarLinks).find((link) => link.id.replace("js-sidebar-", "") === currentPage);

    if (!activeLink) return;

    activeLink.removeAttribute("href");
    activeLink.classList.add("sidebar__link--active");
    const icon = activeLink.querySelector("img.sidebar__nav-img");
    if (icon) {
        icon.src = `assets/icons/sidebar/active/${currentPage}-active.svg`;
    }
}

/**
 * Navigates to the help page and passes the current page URL as a parameter to allow going back to the previous page from the help page. It uses encodeURIComponent to ensure that the URL is properly formatted when passed as a parameter.
 */
function goToHelp() {
    const from = window.location.href; // Save current page URL
    window.location.href = "help.html?from=" + encodeURIComponent(from); // Navigate to help page and add current page URL as a parameter to go back later. Use encodeURIComponent to ensure the URL is properly formatted.
}

/**
 * Navigates back to the previous page. It first checks if there is a "from" parameter in the URL, which contains the URL of the previous page. If it exists, it navigates back to that URL. If not, it uses the browser's history to go back to the previous page.
 */
function goBack() {
    const params = new URLSearchParams(window.location.search); // Get URL parameters. A parameter always follows after a "?" in the URL, so we use window.location.search to get the part of the URL that contains the parameters.
    const from = params.get("from"); // Get the "from" parameter which contains the URL of the previous page.
    if (from) {
        window.location.href = from; // Navigate back to the previous page
    } else {
        window.history.back(); // If no "from" parameter is found, use the browser's history to go back
    }
}

/**
 * Adds the help link to the user menu when the window is resized and the width is below the specified maximum width for mobile devices.
 */
window.addEventListener("resize", () => {
    addHelpToUserMenu(850);
});

/**
 * Adds the help link to the user menu when the window is resized and the width is below the specified maximum width for mobile devices.
 * @param {number} maxWidthMobile - The maximum width for mobile devices.
 */
function addHelpToUserMenu(maxWidthMobile) {
    const userMenu = document.getElementById("js-header-user-menu-list");
    const existingHelpTag = document.getElementById("js-header-user-menu-help");

    if (window.innerWidth <= maxWidthMobile) {
        if (!existingHelpTag) {
            userMenu.innerHTML = getUserMenuHelpTemplate() + userMenu.innerHTML;
        }
    } else if (existingHelpTag) {
        existingHelpTag.remove();
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

const currentUser = sessionStorage.getItem("currentUserName");
console.log("Eingeloggt als:", currentUser);