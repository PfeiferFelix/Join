/**
 * Initializes the user button by calling the addUserButton function when the page loads.
 */
function init() {
    addSidebar();
    addHeader();
    addUserButton();
    addUserMenu();
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
    const listItem = activeLink.closest(".sidebar__list-item");
    if (listItem) {
        /* listItem.classList.add("sidebar__link--active"); */ // workaround for add-task
        activeLink.querySelector("img.sidebar__nav-img").src = `assets/icons/sidebar/active/${currentPage}-active.svg`;
    }
}
