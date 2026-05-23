/**
 * Render contacts in the "Assigned to" dropdown.
 * @returns {void}
 */
function addUserToTask() {
    const list = document.getElementById('assigned-to-list');
    addTaskContactsLS.forEach(contact => {
        const li = createContactListItem(contact);
        list.appendChild(li);
    });
}


/**
 * Create a list item element for a contact in the dropdown.
 * @param {Object} contact - The contact object with name and email.
 * @returns {HTMLLIElement} The created list item element.
 */
function createContactListItem(contact) {
    const initials = getInitials(contact.name);
    const color = getAvatarColor(contact.email);
    const li = document.createElement('li');
    li.classList.add('dropdown__item');
    li.innerHTML = getDropdownItemTemplate(initials, color, contact.name, contact.email);
    const checkbox = li.querySelector('.dropdown__checkbox');
    checkbox.addEventListener('change', () => updateSelectedAvatars());
    li.addEventListener('click', (e) => {
        if (e.target !== checkbox) {
            checkbox.checked = !checkbox.checked;
            updateSelectedAvatars();
        }
    });
    return li;
}


/**
 * Toggle the visibility of the assigned contacts dropdown.
 * @returns {void}
 */
function toggleDropdown() {
    const list = document.getElementById('assigned-to-list');
    list.classList.toggle('dropdown__list--visible');
}


/**
 * Filter dropdown items by the search input.
 * @returns {void}
 */
function filterDropdown() {
    const search = document.getElementById('assigned-to-search').value.toLowerCase();
    const list = document.getElementById('assigned-to-list');
    list.classList.add('dropdown__list--visible');
    const items = list.querySelectorAll('.dropdown__item');
    items.forEach(item => {
        const nameEl = item.querySelector('.dropdown__name');
        if (!nameEl) return;
        const name = nameEl.textContent.toLowerCase();
        item.style.display = name.includes(search) ? 'flex' : 'none';
    });
}


/**
 * Update the selected avatars display for checked contacts.
 * @returns {void}
 */
function updateSelectedAvatars() {
    const container = document.getElementById('selected-avatars');
    container.innerHTML = '';
    const checked = Array.from(document.querySelectorAll('.dropdown__checkbox:checked'));
    const maxVisible = 4;
    checked.slice(0, maxVisible).forEach(checkbox => {
        const item = checkbox.closest('.dropdown__item');
        const initials = item.querySelector('.dropdown__avatar').textContent;
        const color = item.querySelector('.dropdown__avatar').style.backgroundColor;
        container.innerHTML += getSelectedAvatarTemplate(initials, color);
    });
    if (checked.length > maxVisible) {
        const remaining = checked.length - maxVisible;
        container.innerHTML += `<div class="dropdown__avatar-more">+${remaining}</div>`;
    }
}


/**
 * Close the dropdown menu when clicking outside of it.
 * @param {Event} event - The click event object.
 * @returns {void}
 */
function closeDropdownOnOutsideClick(event) {
    const dropdown = document.getElementById('assigned-to-dropdown');
    if (!dropdown.contains(event.target)) {
        document.getElementById('assigned-to-list')
            .classList.remove('dropdown__list--visible');
    }
}


/**
 * Setup dropdown event listeners including outside click handling.
 * @returns {void}
 */
function setupDropdownEvents() {
    document.getElementById('assigned-to-search')
        .addEventListener('focus', toggleDropdown);
    document.getElementById('assigned-to-arrow')
        .addEventListener('click', toggleDropdown);
    document.getElementById('assigned-to-search')
        .addEventListener('input', filterDropdown);

    document.addEventListener('click', closeDropdownOnOutsideClick);
}


/**
 * Clear the selected users avatars and uncheck checkboxes.
 * @returns {void}
 */
function clearSelectedUsers() {
    document.getElementById('selected-avatars').innerHTML = '';
    document.querySelectorAll('.dropdown__checkbox').forEach(cb => cb.checked = false);
}

/**
 * Toggle visibility of the category dropdown list.
 * @returns {void}
 */
function toggleCategoryDropdown() {
    document.getElementById('category-list').classList.toggle('dropdown__list--visible');
}


/**
 * Select a category from the dropdown and update the UI state.
 * @param {HTMLElement} item - The clicked dropdown item element.
 * @returns {void}
 */
function selectCategory(item) {
    document.getElementById('category-selected').textContent = item.textContent;
    document.getElementById('category-selected').dataset.value = item.dataset.value;
    document.getElementById('category-list').classList.remove('dropdown__list--visible');
}


/**
 * Close the category dropdown when clicking outside of it.
 * @param {MouseEvent} event - The click event.
 * @returns {void}
 */
function closeCategoryOnOutsideClick(event) {
    const dropdown = document.getElementById('category-dropdown');
    if (!dropdown.contains(event.target)) {
        document.getElementById('category-list').classList.remove('dropdown__list--visible');
    }
}

/**
 * Initialize event handlers for the category dropdown in the form.
 * @returns {void}
 */
function setupCategoryDropdown() {
    document.getElementById('category-trigger').addEventListener('click', toggleCategoryDropdown);
    document.getElementById('category-list').querySelectorAll('.dropdown__item--simple').forEach(item => {
        item.addEventListener('click', () => selectCategory(item));
    });
    document.addEventListener('click', closeCategoryOnOutsideClick);
}