/**
 * Initialize function
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
        activeLink.querySelector("img.sidebar__nav-img").src = `assets/icons/sidebar/active/${currentPage}-active.svg`;
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
