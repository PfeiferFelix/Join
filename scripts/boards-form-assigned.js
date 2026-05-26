// boards-form-assigned.js
// Contains all assigned-to multiselect logic for add/edit task dialogs.

/**
 * Initializes the assigned-to multiselect dropdown inside the dialog.
 * @param {HTMLElement} dialog - The dialog hosting the multiselect.
 * @param {object} [config] - Optional config overrides; see getAssignedToConfig.
 */
function setupAssignedToMultiselect(dialog, config = {}) {
    const cfg = getAssignedToConfig(config);
    const trigger = dialog.querySelector(`#${cfg.triggerId}`);
    const checkboxContainer = dialog.querySelector(`#${cfg.checkboxContainerId}`);
    const summary = dialog.querySelector(`#${cfg.summaryId}`);
    const searchInput = dialog.querySelector(`#${cfg.searchInputId}`);
    const selectedAvatarsContainer = dialog.querySelector(`#${cfg.selectedAvatarsId}`);
    if (!trigger || !checkboxContainer || !summary) return;
    renderAssignedToOptions(checkboxContainer, cfg.optionIdPrefix, cfg.preselectedIds);
    checkboxContainer.removeAttribute('hidden');
    bindAssignedToDropdownEvents(dialog, cfg, trigger, checkboxContainer, summary, selectedAvatarsContainer, searchInput);
    closeAssignedToDropdown(trigger, checkboxContainer);
    setAssignedToSummary(summary, checkboxContainer, selectedAvatarsContainer, cfg, searchInput);
}

/**
 * Merges user-provided config with default assigned-to multiselect IDs and options.
 * @param {object} [config] - Caller overrides.
 * @returns {object} Resolved assigned-to config.
 */
function getAssignedToConfig(config = {}) {
    return {
        triggerId: 'assigned-to-trigger',
        searchInputId: 'assigned-to-search',
        checkboxContainerId: 'assigned-to-checkboxes',
        summaryId: 'assigned-to-summary',
        wrapperId: 'assigned-to-multiselect',
        optionIdPrefix: 'assigned-to',
        selectedAvatarsId: 'assigned-to-selected-avatars',
        preselectedIds: [],
        avatarsOnly: false,
        ...config
    };
}

/**
 * Renders the assigned-to checkbox options into the container.
 * @param {HTMLElement} container - Container element for the options.
 * @param {string} optionIdPrefix - ID prefix used for the rendered options.
 * @param {number[]} preselectedIds - Contact IDs that should be checked by default.
 */
function renderAssignedToOptions(container, optionIdPrefix, preselectedIds) {
    container.innerHTML = contacts.map((contact, index) => {
        const initials = buildInitials(contact.name || '');
        return getAssignedToOptionTemplate(contact, optionIdPrefix, preselectedIds, initials, getAvatarFillColor(index));
    }).join('');
}

// ...restliche assigned-to Hilfsfunktionen (Dropdown, Filter, Events, Summary, etc.) aus boards-form.js hierher verschieben...

// Exportiere Funktionen für Nutzung in boards-form.js (wenn Module genutzt werden)
// export { setupAssignedToMultiselect, getAssignedToConfig, renderAssignedToOptions /*, ... */ };
