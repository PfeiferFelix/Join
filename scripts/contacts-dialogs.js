// --- Input Auto-Sizing ---

let _autoSizeCanvas = null;

/**
 * Returns the three edit-contact input elements, omitting any that are not in the DOM.
 * @returns {HTMLInputElement[]}
 */
function getEditContactInputs() {
    return ['editContactName', 'editContactEmail', 'editContactPhone']
        .map(function(id) { return document.getElementById(id); })
        .filter(Boolean);
}

/**
 * Returns a 2D canvas context backed by the shared off-screen canvas,
 * creating it on first use.
 * @returns {CanvasRenderingContext2D}
 */
function getAutoSizeContext() {
    if (!_autoSizeCanvas) _autoSizeCanvas = document.createElement('canvas');
    return _autoSizeCanvas.getContext('2d');
}

/**
 * Calculates the minimum pixel width needed to display the current value of one input.
 * Adds padding and icon-space offsets to the measured text width.
 * @param {CanvasRenderingContext2D} ctx - Canvas context used for font-aware measurement.
 * @param {HTMLInputElement} input - The input element to measure.
 * @returns {number} Required width in pixels.
 */
function measureInputMinWidth(ctx, input) {
    ctx.font = window.getComputedStyle(input).font;
    return Math.ceil(ctx.measureText(input.value).width) + 16 + 48 + 8;
}

/**
 * Computes the largest minimum width required across all supplied inputs.
 * Inputs with no value are skipped.
 * @param {HTMLInputElement[]} inputs
 * @returns {number} Maximum required width in pixels, or 0 if no input has a value.
 */
function computeMaxMinWidth(inputs) {
    const ctx = getAutoSizeContext();
    return inputs.reduce(function(max, input) {
        if (!input.value) return max;
        return Math.max(max, measureInputMinWidth(ctx, input));
    }, 0);
}

/**
 * Measures the required text width for each edit-contact input and applies the
 * same min-width to all three, so they always stay equal in length.
 * Uses a shared off-screen canvas for accurate font-aware measurement.
 */
function autoSizeEditContactInputs() {
    const inputs = getEditContactInputs();
    if (inputs.length === 0) return;
    const maxMinWidth = computeMaxMinWidth(inputs);
    const finalWidth = maxMinWidth > 0 ? maxMinWidth + 'px' : '';
    inputs.forEach(function(input) { input.style.minWidth = finalWidth; });
}


// --- Validation ---

/**
 * Returns true if the name contains only letters (incl. umlauts), spaces, hyphens
 * and apostrophes, and has at least 2 characters.
 * @param {string} name - The trimmed name value.
 * @returns {boolean}
 */
function isValidName(name) {
    return name.length >= 2 && /^[a-zA-ZÀ-ÖØ-öø-ÿ\s\-']+$/.test(name);
}

/**
 * Returns true if the email follows the pattern local@domain.tld,
 * where the local part starts with an alphanumeric character and the TLD has at least 2 chars.
 * @param {string} email - The trimmed email value.
 * @returns {boolean}
 */
function isValidEmail(email) {
    return /^[a-zA-Z0-9][a-zA-Z0-9._%+\-]*@[a-zA-Z0-9][a-zA-Z0-9.\-]*\.[a-zA-Z]{2,}$/.test(email);
}

/**
 * Returns true if the phone contains only allowed characters (+, digits, spaces,
 * hyphens, parentheses) and has at least 6 digits.
 * @param {string} phone - The trimmed phone value.
 * @returns {boolean}
 */
function isValidPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return /^\+?[\d\s\-\(\)]+$/.test(phone) && digits.length >= 6;
}

/**
 * Toggles the error border on the input wrapper and sets the error message text.
 * @param {string} wrapperId - ID of the .add-contact__input wrapper element.
 * @param {string} errorId - ID of the error span element.
 * @param {string} message - Error message to display, or empty string to clear.
 */
function setFieldError(wrapperId, errorId, message) {
    const wrapper = document.getElementById(wrapperId);
    const errorEl = document.getElementById(errorId);
    if (wrapper) wrapper.classList.toggle('add-contact__input--error', !!message);
    if (errorEl) errorEl.textContent = message || '';
}

/**
 * Clears all validation errors for the three fields of a contact form.
 * @param {string} prefix - Form prefix, either 'add' or 'edit'.
 */
function clearContactFormErrors(prefix) {
    ['Name', 'Email', 'Phone'].forEach(function(field) {
        setFieldError(prefix + 'Contact' + field + 'Input', prefix + 'Contact' + field + 'Error', '');
    });
}

/**
 * Validates a single field, sets the appropriate error message and returns the result.
 * @param {string} prefix - Form prefix, either 'add' or 'edit'.
 * @param {string} field - Field name, one of 'Name', 'Email' or 'Phone'.
 * @param {string} value - The trimmed field value.
 * @param {Function} validatorFn - Returns true if the value passes validation.
 * @param {string} emptyMsg - Error shown when the value is empty.
 * @param {string} invalidMsg - Error shown when the value fails validation.
 * @returns {boolean} True if the field is valid.
 */
function validateField(prefix, field, value, validatorFn, emptyMsg, invalidMsg) {
    const wrapperId = prefix + 'Contact' + field + 'Input';
    const errorId = prefix + 'Contact' + field + 'Error';
    if (!value) { setFieldError(wrapperId, errorId, emptyMsg); return false; }
    if (!validatorFn(value)) { setFieldError(wrapperId, errorId, invalidMsg); return false; }
    setFieldError(wrapperId, errorId, '');
    return true;
}

/**
 * Validates the name field of the given contact form.
 * @param {string} prefix - Form prefix, either 'add' or 'edit'.
 * @returns {boolean} True if the name is valid.
 */
function validateNameField(prefix) {
    const value = document.getElementById(prefix + 'ContactName').value.trim();
    return validateField(prefix, 'Name', value, isValidName,
        'Please enter a name.',
        'Name may only contain letters, spaces, hyphens and apostrophes — no numbers.');
}

/**
 * Validates the email field of the given contact form.
 * @param {string} prefix - Form prefix, either 'add' or 'edit'.
 * @returns {boolean} True if the email is valid.
 */
function validateEmailField(prefix) {
    const value = document.getElementById(prefix + 'ContactEmail').value.trim();
    return validateField(prefix, 'Email', value, isValidEmail,
        'Please enter an email address.',
        'Please enter a valid email address (e.g. name@domain.com).');
}

/**
 * Validates the phone field of the given contact form.
 * @param {string} prefix - Form prefix, either 'add' or 'edit'.
 * @returns {boolean} True if the phone number is valid.
 */
function validatePhoneField(prefix) {
    const value = document.getElementById(prefix + 'ContactPhone').value.trim();
    return validateField(prefix, 'Phone', value, isValidPhone,
        'Please enter a phone number.',
        'Please enter a valid phone number (at least 6 digits).');
}

/**
 * Validates all three fields of the given contact form.
 * All fields are always checked so all errors are shown at once.
 * @param {string} prefix - Form prefix, either 'add' or 'edit'.
 * @returns {boolean} True if all fields are valid.
 */
function validateContactForm(prefix) {
    const nameOk = validateNameField(prefix);
    const emailOk = validateEmailField(prefix);
    const phoneOk = validatePhoneField(prefix);
    return nameOk && emailOk && phoneOk;
}


// --- Add Contact ---

/**
 * Opens the add contact dialog and resets the form and avatar preview.
 */
function openAddContactDialog() {
    document.getElementById('addContactForm').reset();
    resetAddContactAvatar();
    clearContactFormErrors('add');
    document.getElementById('addContactOverlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}


/**
 * Closes the add contact dialog and restores page scrolling.
 */
function closeAddContactDialog() {
    document.getElementById('addContactOverlay').style.display = 'none';
    document.body.style.overflow = '';
}


/**
 * Resets the avatar in the add dialog to the default placeholder icon.
 */
function resetAddContactAvatar() {
    const avatar = document.getElementById('addContactAvatar');
    avatar.classList.add('add-contact__avatar--placeholder');
    avatar.innerHTML = getAvatarPlaceholderTemplate();
    avatar.style.backgroundColor = '';
}


/**
 * Updates the avatar preview in the add dialog based on the current name input value.
 */
function updateAddContactAvatarPreview() {
    const name = document.getElementById('addContactName').value.trim();
    const avatar = document.getElementById('addContactAvatar');
    if (name.length > 0) {
        avatar.classList.remove('add-contact__avatar--placeholder');
        avatar.innerHTML = getInitials(name);
        avatar.style.backgroundColor = '#29ABE2';
    } else {
        resetAddContactAvatar();
    }
}


/**
 * Called after Firebase has saved the new contact.
 * Updates local storage, re-renders the list, and shows the new contact's detail view.
 * @param {string} key - The Firebase key assigned to the new contact.
 * @param {{ name: string, email: string, phone: string }} contact - The newly created contact data.
 */
function onContactAdded(key, contact) {
    setInLocalStorage(key, contact);
    loadContactsFromLocalStorage();
    renderContacts();
    closeAddContactDialog();
    showContactDetail(key);
    showSuccessToast('Contact successfully created');
}


/**
 * Reads the add contact form and pushes the new contact to Firebase.
 * @param {Event} event - The form submit event.
 */
function handleAddContactSubmit(event) {
    event.preventDefault();
    if (!validateContactForm('add')) return;
    const newContact = {
        name: toTitleCase(document.getElementById('addContactName').value),
        email: document.getElementById('addContactEmail').value.trim(),
        phone: document.getElementById('addContactPhone').value.trim(),
    };
    db.ref('contacts').push(newContact)
        .then(function(snapshot) { onContactAdded(snapshot.key, newContact); })
        .catch(showFirebaseError);
}


// --- Edit Contact ---

/**
 * Populates the avatar in the edit dialog with the contact's initials and avatar color.
 * @param {{ name: string, email: string }} contact - The contact whose avatar to display.
 */
function setEditContactAvatar(contact) {
    const avatar = document.getElementById('editContactAvatar');
    avatar.textContent = getInitials(contact.name);
    avatar.style.backgroundColor = getAvatarColor(contact.email);
}


/**
 * Opens the edit dialog and pre-fills all fields with the contact's current data.
 * @param {string} key - The Firebase key of the contact to edit.
 */
function openEditContactDialog(key) {
    const contact = contactsList.find(function(c) { return c.firebaseKey === key; });
    if (!contact) return;
    document.getElementById('editContactFirebaseKey').value = key;
    document.getElementById('editContactName').value = contact.name;
    document.getElementById('editContactEmail').value = contact.email;
    document.getElementById('editContactPhone').value = contact.phone;
    setEditContactAvatar(contact);
    clearContactFormErrors('edit');
    document.getElementById('editContactOverlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    setTimeout(autoSizeEditContactInputs, 0);
}


/**
 * Closes the edit contact dialog and restores page scrolling.
 */
function closeEditContactDialog() {
    document.getElementById('editContactOverlay').style.display = 'none';
    document.body.style.overflow = '';
}


/**
 * Called after Firebase has saved the updated contact data.
 * Updates local storage, re-renders the list, and refreshes the detail view.
 * @param {string} key - The Firebase key of the edited contact.
 * @param {{ name: string, email: string, phone: string }} contact - The updated contact data.
 */
function onContactEdited(key, contact) {
    setInLocalStorage(key, contact);
    loadContactsFromLocalStorage();
    renderContacts();
    closeEditContactDialog();
    showContactDetail(key);
}


/**
 * Reads the edit form and saves the updated contact data to Firebase.
 * @param {Event} event - The form submit event.
 */
function handleEditContactSubmit(event) {
    event.preventDefault();
    if (!validateContactForm('edit')) return;
    const key = document.getElementById('editContactFirebaseKey').value;
    const updated = {
        name: toTitleCase(document.getElementById('editContactName').value),
        email: document.getElementById('editContactEmail').value.trim(),
        phone: document.getElementById('editContactPhone').value.trim(),
    };
    db.ref('contacts/' + key).update(updated)
        .then(function() { onContactEdited(key, updated); })
        .catch(showFirebaseError);
}


// --- Delete Contact ---

/**
 * Shows a SweetAlert confirmation dialog and deletes the contact if confirmed.
 * @param {string} key - The Firebase key of the contact to delete.
 */
function confirmDeleteContact(key) {
    const contact = contactsList.find(function(c) { return c.firebaseKey === key; });
    const name = contact ? contact.name : 'this contact';
    Swal.fire({
        title: 'Delete contact?',
        text: 'Do you really want to delete "' + name + '"?',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete',
        cancelButtonText: 'Cancel',
        buttonsStyling: false,
        customClass: deleteDialogClasses,
    }).then(function(result) { if (result.isConfirmed) deleteContact(key); });
}


/**
 * Called after Firebase has deleted the contact.
 * Removes it from local storage, re-renders the list, and clears the detail view.
 * @param {string} key - The Firebase key of the deleted contact.
 */
function onContactDeleted(key) {
    removeFromLocalStorage(key);
    loadContactsFromLocalStorage();
    renderContacts();
    closeEditContactDialog();
    clearContactDetail();
}


/**
 * Deletes a contact from Firebase by its key.
 * @param {string} key - The Firebase key of the contact to delete.
 */
function deleteContact(key) {
    db.ref('contacts/' + key).remove()
        .then(function() { onContactDeleted(key); })
        .catch(showFirebaseError);
}


// --- Mobile Action Menu ---

/**
 * Opens the edit dialog for the currently active contact from the mobile action menu.
 */
function openEditFromMenu() {
    closeContactActionMenu();
    openEditContactDialog(currentActiveFirebaseKey);
}


/**
 * Triggers the delete confirmation for the currently active contact from the mobile action menu.
 */
function deleteFromMenu() {
    closeContactActionMenu();
    confirmDeleteContact(currentActiveFirebaseKey);
}


/**
 * Toggles the visibility of the mobile action menu popup.
 * @param {Event} event - The click event (propagation is stopped to prevent immediate close).
 */
function toggleContactActionMenu(event) {
    event.stopPropagation();
    document.getElementById('contactActionPopup').classList.toggle('contact-action-menu__popup--visible');
}


/**
 * Hides the mobile action menu popup.
 */
function closeContactActionMenu() {
    document.getElementById('contactActionPopup').classList.remove('contact-action-menu__popup--visible');
}


// --- Event Listeners ---

/**
 * Reads the Firebase key from the edit dialog and triggers the delete confirmation.
 */
function onDeleteFromEditDialog() {
    const key = document.getElementById('editContactFirebaseKey').value;
    confirmDeleteContact(key);
}


/**
 * Attaches all event listeners for the add contact dialog.
 */
function setupAddDialogListeners() {
    document.getElementById('closeAddContactBtn').addEventListener('click', closeAddContactDialog);
    document.getElementById('cancelAddContactBtn').addEventListener('click', closeAddContactDialog);
    document.getElementById('addContactForm').addEventListener('submit', handleAddContactSubmit);
    document.getElementById('addContactName').addEventListener('input', updateAddContactAvatarPreview);
    document.getElementById('addContactOverlay').addEventListener('click', function(event) {
        if (event.target.id === 'addContactOverlay') closeAddContactDialog();
    });
}


/**
 * Attaches all event listeners for the edit contact dialog.
 */
function setupEditDialogListeners() {
    document.getElementById('closeEditContactBtn').addEventListener('click', closeEditContactDialog);
    document.getElementById('editContactForm').addEventListener('submit', handleEditContactSubmit);
    document.getElementById('deleteContactFromEditBtn').addEventListener('click', onDeleteFromEditDialog);
    document.getElementById('editContactOverlay').addEventListener('click', function(event) {
        if (event.target.id === 'editContactOverlay') closeEditContactDialog();
    });
    ['editContactName', 'editContactEmail', 'editContactPhone'].forEach(function(id) {
        document.getElementById(id).addEventListener('input', autoSizeEditContactInputs);
    });
}


/**
 * Attaches all event listeners for mobile-specific UI elements (FAB, action menu, outside-click).
 */
function setupMobileListeners() {
    document.getElementById('addContactFab').addEventListener('click', openAddContactDialog);
    document.getElementById('contactActionBtn').addEventListener('click', toggleContactActionMenu);
    document.addEventListener('click', function(event) {
        const menu = document.getElementById('contactActionMenu');
        if (!menu.contains(event.target)) closeContactActionMenu();
    });
}


/**
 * Sets up all event listeners for the contacts page.
 */
function setupEventListeners() {
    document.getElementById('addNewContact').addEventListener('click', openAddContactDialog);
    document.getElementById('contactsBackBtn').addEventListener('click', closeContactDetailOnMobile);
    setupAddDialogListeners();
    setupEditDialogListeners();
    setupMobileListeners();
}
