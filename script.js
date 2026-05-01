let currentUserNameLS = localStorage.getItem("currentUserName");
let currentUserEmailLS = localStorage.getItem("currentUserEmail");
let fromLogin = false;

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
    addNameInitials();
    document.body.style.visibility = "visible";
}

/**
 * Reads a JSON object from local storage by key and returns its values as an array.
 * @param {string} key - Local storage key that contains a JSON-serialized object.
 * @returns {Array} Array of first-level values from the stored object.
 */
function importandFormatLocalStorageData(key) {
    return Object.values(JSON.parse(localStorage.getItem(key)));
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
 * Adds the user button to the header using the getHeaderCircleUserTemplate function.
 */
function addUserButton() {
    const userButton = document.getElementById("js-user-menu-button");
    userButton.innerHTML = getHeaderCircleUserTemplate();
}

/**
 * Adds the user menu to the header using the getHeaderUserMenuTemplate function.
 */
function addUserMenu() {
    const userMenu = document.getElementById("js-header-user-menu");
    userMenu.innerHTML = getHeaderUserMenuTemplate();
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
            userMenu.innerHTML = getHeaderUserMenuHelpTemplate() + userMenu.innerHTML;
        }
    } else if (existingHelpTag) {
        existingHelpTag.remove();
    }
}

/**
 *Returns the first character of the input text in uppercase.
 *@param {string} string - The input text.
 *@returns {string} The uppercase first character.
 */
function UpperCaseIntial(string) {
    return string.toUpperCase().charAt(0);
}

/**
 * Reads the current user name from session storage and displays the initials in the header.
 */
function addNameInitials() {
    let userNameArray = currentUserNameLS.split(" ");
    let userInitials;
    userInitials = UpperCaseIntial(userNameArray[0]);
    if (userNameArray.length > 1) {
        userInitials += UpperCaseIntial(userNameArray.at(-1));
    }

    document.getElementById("js-header-user-initials").textContent = userInitials;
}

/**
 * Delays the execution of code for a specified amount of time. It returns a Promise that resolves after the specified time has passed, allowing you to use it with async/await syntax to create a pause in the execution of your code.
 * @param {Number} time
 */
function timeDelay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
