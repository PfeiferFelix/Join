function getCircleUserTemplate(nameAbbreviation = "DG") {
    return `
        <svg width="50" height="50" viewBox="0 0 80 80" aria-hidden="true">
            <circle class="header__circle" cx="40" cy="40" r="38" stroke="#555" stroke-width="4" fill="white" />
            <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="28" font-family="Inter, sans-serif" fill="#4a90e2" font-weight="700">${nameAbbreviation}</text>
        </svg>
    `;
}

function getUserMenuTemplate() {
    return `
        <ul class="header__user-list fs-small-regular fc-lightgrey">
            <li><a href="legal-notice.html">Legal Notice</a></li>
            <li><a href="privacy-policy.html">Privacy Policy</a></li>
            <li><a href="login.html">Log Out</a></li>
        </ul>
    `;
}

function getSidebarTemplate() {
    return `<img class="sidebar__logo" src="assets/logos/logo.svg" alt="" />
                <nav class="sidebar__nav">
                    <ul class="sidebar__nav-list">
                        <li class="sidebar__list-item">
                            <a id="js-sidebar-summary" class="sidebar__nav-link" href="summary.html">
                                <img class="sidebar__nav-img" src="assets/icons/sidebar/inactive/summary.svg" alt="" /> 
                                <span>Summary</span>
                            </a>
                        </li>
                        <li class="sidebar__list-item">
                            <a id="js-sidebar-add-task" class="sidebar__nav-link" href="add-task.html">
                                <img class="sidebar__nav-img" src="assets/icons/sidebar/inactive/add-task.svg" alt="" />
                                <span>Add Task</span>
                            </a>
                        </li>
                        <li class="sidebar__list-item">
                            <a id="js-sidebar-boards" class="sidebar__nav-link" href="boards.html">
                                <img class="sidebar__nav-img" src="assets/icons/sidebar/inactive/boards.svg" alt="" /> 
                                <span>Boards</span>
                            </a>
                        </li>
                        <li class="sidebar__list-item">
                            <a id="js-sidebar-contacts" class="sidebar__nav-link" href="contacts.html">
                                <img class="sidebar__nav-img" src="assets/icons/sidebar/inactive/contacts.svg" alt="" /> 
                                <span>Contacts</span>
                            </a>
                        </li>
                    </ul>
                </nav>

                <footer class="sidebar__legal-information">
                    <ul class="sidebar__legal-information-list">
                        <li>
                            <a id="js-sidebar-privacy-policy" class="sidebar__legal-information-link" href="privacy-policy.html">Privacy Policy</a>
                        </li>
                        <li>
                            <a id="js-sidebar-legal-notice" class="sidebar__legal-information-link" href="legal-notice.html">Legal Notice</a>
                        </li>
                    </ul>
                </footer>`;
}

function getHeaderTemplate() {
    return `<h3 class="header__headline3 fs-medium-regular">Kanban Project Management Tool</h3>
            <div class="header__user-interaction-container">
                <a onclick="goToHelp()"><img class="header__help-icon" src="assets/icons/header/help.svg" alt="Help" /></a>
                <button id="js-user-menu-button" onclick="toggleUserMenu()" class="header__user-button"></button>
                <div id="js-header-user-menu" class="header__user-menu"></div>
            </div>`;
}
