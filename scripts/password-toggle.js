/**
 * Initializes the .has-value state on every password input wrapper on the page.
 */
function initializePasswordToggles() {
    const inputs = document.querySelectorAll('.input__wrapper input[type="password"], .input__wrapper input[data-pw="1"]');
    inputs.forEach((input) => bindPasswordInputState(input));
}


/**
 * Binds input listener that toggles the .has-value class on the wrapper.
 * @param {HTMLInputElement} input
 */
function bindPasswordInputState(input) {
    const wrapper = input.closest('.input__wrapper');
    if (!wrapper) return;
    input.dataset.pw = '1';
    updatePasswordHasValue(input, wrapper);
    input.addEventListener('input', () => updatePasswordHasValue(input, wrapper));
}


/**
 * Adds or removes the has-value class depending on input content.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} wrapper
 */
function updatePasswordHasValue(input, wrapper) {
    if (input.value.length > 0) wrapper.classList.add('has-value');
    else {
        wrapper.classList.remove('has-value');
        wrapper.classList.remove('is-visible');
        resetToggleButton(wrapper);
    }
}


/**
 * Resets the toggle button aria state and the input type to password.
 * @param {HTMLElement} wrapper
 */
function resetToggleButton(wrapper) {
    const btn = wrapper.querySelector('.input__icon-btn');
    const input = wrapper.querySelector('input');
    if (btn) {
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', 'Show password');
    }
    if (input) input.type = 'password';
}


/**
 * Toggles visibility of the password in the given input on icon-button click.
 * @param {string} inputId
 * @param {HTMLButtonElement} btn
 */
function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input || !input.value) return;
    const wrapper = input.closest('.input__wrapper');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    wrapper.classList.toggle('is-visible', show);
    btn.setAttribute('aria-pressed', String(show));
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
}


document.addEventListener('DOMContentLoaded', initializePasswordToggles);