/**
 * Generates the HTML template for the sidebar navigation, including the logo, navigation. links and legal inforamtions.
 * @returns {string}
 */
function getSidebarTemplate() {
    return `<img class="sidebar__logo" src="assets/logos/logo.svg" alt="" />
                <nav class="sidebar__nav">
                    <ul class="sidebar__nav-list">
                        <li class="sidebar__list-item">
                            <a id="js-sidebar-summary" class="sidebar__nav-link" href="summary.html">
                                <img class="sidebar__nav-img" src="assets/sidebar/inactive/summary.svg" alt="" /> 
                                <span>Summary</span>
                            </a>
                        </li>
                        <li class="sidebar__list-item">
                            <a id="js-sidebar-add-task" class="sidebar__nav-link" href="add-task.html">
                                <img class="sidebar__nav-img" src="assets/sidebar/inactive/add-task.svg" alt="" />
                                <span>Add Task</span>
                            </a>
                        </li>
                        <li class="sidebar__list-item">
                            <a id="js-sidebar-boards" class="sidebar__nav-link" href="boards.html">
                                <img class="sidebar__nav-img" src="assets/sidebar/inactive/boards.svg" alt="" /> 
                                <span>Boards</span>
                            </a>
                        </li>
                        <li class="sidebar__list-item">
                            <a id="js-sidebar-contacts" class="sidebar__nav-link" href="contacts.html">
                                <img class="sidebar__nav-img" src="assets/sidebar/inactive/contacts.svg" alt="" /> 
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


/**
 * Generates the HTML template for the sidebar navigation when the user is not logged in.
 * @returns {string}
 */
function getSidebarNotLoggedInTemplate() {
    return `<img class="sidebar__logo" src="assets/logos/logo.svg" alt="" />
                <nav class="sidebar__nav">
                    <ul class="sidebar__nav-list">
                        <li class="sidebar__list-item">
                            <a class="sidebar__nav-link sidebar__login-link" href="login.html">
                                <img class="sidebar__nav-img" src="assets/Login/Login.png" alt="" />
                                <span>Login</span>
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


/**
 * Generates the HTML template for the header section.
 * @returns {string}
 */
function getHeaderTemplate() {
    return `<div class="header__content">
                <img class="header__mobile-logo" src="assets/logos/logo-mobile.svg" alt="" />
                <h3 class="header__headline3 fs-medium-regular">Kanban Project Management Tool</h3>
                <div id="js-header-user-interaction-container" class="header__user-interaction-container">
                    <a onclick="goToHelp()"><img class="header__help-icon" src="assets/header/help.svg" alt="Help" /></a>
                    <button id="js-user-menu-button" onclick="toggleUserMenu()" class="header__user-button"></button>
                    <div id="js-header-user-menu" class="header__user-menu"></div>
                </div>
            </div>`;
}


/** * Generates the HTML template for the user avatar in the header, which is a circle with the user's initials.
 * @returns {string}
 */
function getHeaderCircleUserTemplate() {
    return `
        <svg width="50" height="50" viewBox="0 0 80 80" aria-hidden="true">
            <circle class="header__circle" cx="40" cy="40" r="38" stroke="#555" stroke-width="4" fill="white" />
            <text id="js-header-user-initials" x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="28" font-family="Inter, sans-serif" fill="#4a90e2" font-weight="700"></text>
        </svg>
    `;
}


/**
 * Generates the HTML template for the user menu in the header.
 * @returns {string}
 */
function getHeaderUserMenuTemplate() {
    return `
        <ul id="js-header-user-menu-list" class="header__user-list fs-small-regular fc-lightgrey">
            <li><a class="header__user-link" href="legal-notice.html">Legal Notice</a></li>
            <li><a class="header__user-link" href="privacy-policy.html">Privacy Policy</a></li>
            <li><a class="header__user-link" href="login.html">Log Out</a></li>
        </ul>
    `;
}


/** * Generates the HTML template for the "Help" item in the user menu of the header.
 * @returns {string}
 */
function getHeaderUserMenuHelpTemplate() {
    return `<li id="js-header-user-menu-help"><a class="header__user-link" href="help.html">Help</a></li>`;
}


/** * Generates the HTML template for the user avatar in the header, which is a circle with the user's initials.
 * @returns {string}
 */
function getHeaderCircleUserTemplate() {
    return `
        <svg width="50" height="50" viewBox="0 0 80 80" aria-hidden="true">
            <circle class="header__circle" cx="40" cy="40" r="38" stroke="#555" stroke-width="4" fill="white" />
            <text id="js-header-user-initials" x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="28" font-family="Inter, sans-serif" fill="#4a90e2" font-weight="700"></text>
        </svg>
    `;
}


/** * Generates the HTML template for the user menu in the header.
 * @returns {string}
 */
function getHeaderUserMenuTemplate() {
    return `
        <ul id="js-header-user-menu-list" class="header__user-list fs-small-regular fc-lightgrey">
            <li><a class="header__user-link" href="legal-notice.html">Legal Notice</a></li>
            <li><a class="header__user-link" href="privacy-policy.html">Privacy Policy</a></li>
            <li><a class="header__user-link" href="login.html" onclick="logout()">Log Out</a></li>
        </ul>
    `;
}


/** * Generates the HTML template for the "Help" item in the user menu of the header.
 * @returns {string}
 */
function getHeaderUserMenuHelpTemplate() {
    return `<li id="js-header-user-menu-help"><a class="header__user-link" href="help.html">Help</a></li>`;
}


/**
 * Generates the HTML template for a single contact item in the sidebar list.
 * @param {*} contact
 * @param {*} isActiveClass
 * @param {*} avatarColor
 * @returns {string}
 */
function getContactItemTemplate(contact, isActiveClass, avatarColor) {
    return `<div class="contact-item ${isActiveClass}" data-firebase-key="${contact.firebaseKey}" onclick="showContactDetail('${contact.firebaseKey}')">
                <div class="contact-item__avatar" style="background-color: ${avatarColor}">${getInitials(contact.name)}</div>
                <div class="contact-item__info">
                    <span class="contact-item__name">${contact.name}</span>
                    <span class="contact-item__mail">${contact.email}</span>
                </div>
            </div>`;
}


/**
 * Generates the HTML template for a contact group in the sidebar list.
 * @param {string} letter
 * @param {string} itemsHtml
 * @returns {string}
 */
function getContactGroupTemplate(letter, itemsHtml) {
    return `<div class="contact-group">
                <div class="contact-group__header">
                    <span class="contact-group__letter">${letter}</span>
                    <hr class="contact-group__divider" />
                </div>
                <div class="contact-group__items">${itemsHtml}</div>
            </div>`;
}


/** * Generates the HTML template for the contact card in the detail view, including the avatar, name and action buttons.
 * @param {*} contact
 * @param {*} avatarColor
 * @returns {string}
 */
function getContactCardTemplate(contact, avatarColor) {
    return `<div class="contact-card">
                <div class="contact-card__avatar" style="background-color: ${avatarColor}">${getInitials(contact.name)}</div>
                <div class="contact-card__user-info">
                    <h2 class="contact-card__name">${contact.name}</h2>
                    <div class="contact-card__btn-container">
                        <button class="contact-card__btn" onclick="openEditContactDialog('${contact.firebaseKey}')"><img src="assets/Boards/edit.png" alt="" />Edit</button>
                        <button class="contact-card__btn" onclick="confirmDeleteContact('${contact.firebaseKey}')"><img src="assets/Boards/delete.png" alt="" />Delete</button>
                    </div>
                </div>
            </div>`;
}


/** * Generates the HTML template for the contact information section in the contact detail view, including email and phone number.
 * @param {*} contact
 * @returns {string}
 */
function getContactInfoTemplate(contact) {
    return `<div class="contact-card__info">
                <h3>Contact Information</h3>
                <div class="contact-card__information">
                    <span><strong>Email</strong></span>
                    <a href="mailto:${contact.email}">${contact.email}</a>
                </div>
                <div class="contact-card__information">
                    <span><strong>Phone</strong></span>
                    <a href="tel:${contact.phone}">${contact.phone}</a>
                </div>
            </div>`;
}


/**
 * Generates the HTML template for an item in the dropdown menu.
 * @param {string} initials
 * @param {string} color
 * @param {string} name
 * @param {string} email
 * @returns {string}
 */
function getDropdownItemTemplate(initials, color, name, email) {
    return `
        <div class="dropdown__avatar" style="background-color: ${color}">${initials}</div>
        <span class="dropdown__name">${name}</span>
        <input type="checkbox" class="dropdown__checkbox" value="${email}" />
    `;
}


/** * Generates the HTML template for the selected avatar in the dropdown menu, which is a circle with the user's initials.
 * @param {string} initials
 * @param {string} color
 * @returns {string}
 */
function getSelectedAvatarTemplate(initials, color) {
    return `<div class="dropdown__avatar" style="background-color: ${color}">${initials}</div>`;
}


/** * Generates the HTML template for a subtask item in the subtask list, including the subtask text and action buttons.
 * @param {string} value
 * @returns {string}
 */
function getSubtaskItemTemplate(value) {
    return `
        <span class="subtask-list__text">${value}</span>
        <div class="subtask-list__actions">
            <button type="button" class="subtask-list__btn subtask-list__btn--edit">✏️</button>
            <button type="button" class="subtask-list__btn subtask-list__btn--delete">🗑️</button>
        </div>
    `;
}
