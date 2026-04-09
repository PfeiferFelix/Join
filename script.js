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
