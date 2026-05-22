/**
 * Add the current subtask input value to the subtask list.
 * @returns {void}
 */
function addSubtask() {
    const input = document.getElementById('subtask');
    const value = input.value.trim();
    if (!value) return;
    const li = document.createElement('li');
    li.classList.add('subtask-list__item');
    li.innerHTML = getSubtaskItemTemplate(value);
    li.querySelector('.subtask-list__btn--delete').addEventListener('click', () => onSubtaskDelete(li));
    li.querySelector('.subtask-list__btn--edit').addEventListener('click', () => editSubtask(li, value));
    document.getElementById('subtask-list').appendChild(li);
    clearSubtaskInput();
}


/**
 * Enable editing mode for a subtask item.
 * @param {HTMLLIElement} li - The list item to edit.
 * @param {string} value - The current text value.
 * @returns {void}
 */
function editSubtask(li, value) {
    const span = li.querySelector('.subtask-list__text');
    const input = document.createElement('input');
    input.value = value;
    input.classList.add('subtask-list__edit-input');
    span.replaceWith(input);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    const actions = li.querySelector('.subtask-list__actions');
    actions.innerHTML = getSubtaskEditActionsTemplate();
    actions.querySelector('.subtask-list__btn--delete').addEventListener('click', () => li.remove());
    actions.querySelector('.subtask-list__btn--edit').addEventListener('click', () => confirmEditSubtask(li, input));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirmEditSubtask(li, input);
    });
}


/**
 * Confirm and save the edited subtask.
 * @param {HTMLLIElement} li - The list item being edited.
 * @param {HTMLInputElement} input - The input element with new value.
 * @returns {void}
 */
function confirmEditSubtask(li, input) {
    const span = document.createElement('span');
    span.classList.add('subtask-list__text');
    span.textContent = input.value.trim();
    input.replaceWith(span);
    const actions = li.querySelector('.subtask-list__actions');
    actions.innerHTML = getSubtaskNormalActionsTemplate();
    actions.querySelector('.subtask-list__btn--delete').addEventListener('click', () => onSubtaskDelete(li));
    actions.querySelector('.subtask-list__btn--edit').addEventListener('click', () => editSubtask(li, span.textContent));
}


/**
 * Handle deletion of a subtask item.
 * @param {HTMLLIElement} li - The list item to remove.
 * @returns {void}
 */
function onSubtaskDelete(li) {
    li.remove();
}


/**
 * Clear the subtask input field and hide the action buttons.
 * @returns {void}
 */
function clearSubtaskInput() {
    const input = document.getElementById('subtask');
    input.value = '';
    input.placeholder = 'Add new subtask';
    input.closest('.subtask-input').classList.remove('subtask-input--active');
}

/**
 * Show or hide subtask buttons based on input value.
 * @returns {void}
 */
function toggleSubtaskButtons() {
    const input = document.getElementById('subtask');
    const wrapper = input.closest('.subtask-input');
    wrapper.classList.toggle('subtask-input--active', input.value.trim().length > 0);
}


/**
 * Add subtask on Enter key press without submitting the form.
 * @param {KeyboardEvent} e - The keyboard event.
 * @returns {void}
 */
function handleSubtaskEnter(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addSubtask();
    }
}


/**
 * Clear the subtask list.
 * @returns {void}
 */
function clearSubtaskList() {
    document.getElementById('subtask-list').innerHTML = '';
}

/**
 * Setup subtask input event listeners.
 * @returns {void}
 */
function setupSubtaskEvents() {
    const input = document.getElementById('subtask');
    const clearBtn = document.getElementById('subtask-clear');
    const confirmBtn = document.getElementById('subtask-confirm');

    input.addEventListener('input', toggleSubtaskButtons);
    input.addEventListener('keydown', handleSubtaskEnter);
    clearBtn.addEventListener('click', clearSubtaskInput);
    confirmBtn.addEventListener('click', addSubtask);
}