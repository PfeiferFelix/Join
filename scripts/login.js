/** Firebase project credentials and settings. */
const firebaseConfig = {
    apiKey: "AIzaSyDqKUIXrAGfDTsbymcVdJ2w5ATaApioOv8",
    authDomain: "join-5bd8d.firebaseapp.com",
    databaseURL:
        "https://join-5bd8d-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "join-5bd8d",
    storageBucket: "join-5bd8d.firebasestorage.app",
    messagingSenderId: "404471964373",
    appId: "1:404471964373:web:584fe9ea95cd3476aab85c",
};


/** Initializes Firebase and sets up the Realtime Database reference. */
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
document.body.style.visibility = "visible";


/**
 * Plays the intro logo animation, then reveals the rest of the page.
 */
function playIntroAnimation() {
    try {
        const body = document.body;
        const introLogo = document.querySelector(".logo-intro");
        if (!introLogo) return;

        body.classList.add("intro-active");

        const reveal = () => {
            body.classList.remove("intro-active");
            introLogo.removeEventListener("animationend", onEnd);
        };
        const onEnd = (event) => {
            if (event.animationName === "logoFly") reveal();
        };

        introLogo.addEventListener("animationend", onEnd);
        // Fallback, falls animationend nicht feuert
        setTimeout(reveal, 2100);
    } catch (error) {
        console.error("Intro-Animation fehlgeschlagen:", error);
        document.body.classList.remove("intro-active");
    }
}
playIntroAnimation();


/**
 * Validates the format of an email address.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
    return /^[^\s@]+@[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)+$/.test(email);
}


/**
 * Shows a toast message for 2 seconds, then calls callback if provided.
 * @param {string} message
 * @param {Function} callback
 */
function showToast(message, callback) {
    let toast = document.getElementById("joinToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "joinToast";
        toast.className = "toast";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("toast--visible");
    setTimeout(function () {
        toast.classList.remove("toast--visible");
        if (callback) setTimeout(callback, 300);
    }, 2000);
}


/**
 * Marks an input field as invalid and shows an error message.
 * @param {string} inputId
 * @param {string} errorId
 * @param {string} message
 */
function showFieldError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const wrapper = input ? input.closest(".input__wrapper") : null;
    const errorElement = document.getElementById(errorId);
    if (wrapper) wrapper.classList.add("input--error");
    if (errorElement) errorElement.textContent = message;
}


/** Removes all error states and messages from input fields. */
function clearAllErrors() {
    const errorWrappers = document.querySelectorAll(".input__wrapper.input--error");
    errorWrappers.forEach(function (wrapper) {
        wrapper.classList.remove("input--error");
    });
    const errorTexts = document.querySelectorAll(".error__text");
    errorTexts.forEach(function (errorText) {
        errorText.textContent = '';
    });
}


/**
 * Validates the email format for login.
 * @param {string} email
 * @returns {boolean}
 */
function validateLoginEmail(email) {
    if (!isValidEmail(email)) {
        showFieldError("email", "emailError", "Please enter a valid email address.");
        return false;
    }
    return true;
}


/** Reads email and password from the form, validates them, and triggers the login flow. */
function loginUser() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value.trim();
    clearAllErrors();
    if (!validateLoginEmail(email)) return;
    if (!password) {
        showFieldError("password", "passwordError", "Please enter your password.");
        return;
    }
    db.ref("users").once("value", function (snapshot) {
        const loginSuccess = checkIfUserExistsForLogin(snapshot, email, password);
        if (loginSuccess) {
            loadDataToLocalStorage();
        } else {
            checkLoginResults(false);
        }
    });
}


/**
 * Checks credentials against the DB snapshot and stores the user in localStorage.
 * @param {object} snapshot
 * @param {string} email
 * @param {string} password
 * @returns {boolean}
 */
function checkIfUserExistsForLogin(snapshot, email, password) {
    let loginSuccess = false;
    snapshot.forEach(function (userSnapshot) {
        const userData = userSnapshot.val();
        if (userData.email == email && userData.password == password) {
            loginSuccess = true;
            localStorage.setItem("currentUserName", userData.name);
            localStorage.setItem("currentUserEmail", userData.email);
        }
    });
    return loginSuccess;
}


/**
 * Redirects to summary on success, or shows field errors on failure.
 * @param {boolean} loginSuccess
 */
function checkLoginResults(loginSuccess) {
    if (loginSuccess === true) {
        sessionStorage.setItem("fromLogin", "true");
        window.location.href = "summary.html";
    } else {
        showFieldError("email", "emailError", "Invalid email or password.");
        showFieldError("password", "passwordError", "Invalid email or password.");
    }
}


/** Loads boards and contacts from DB into localStorage, then triggers login redirect. */
function loadDataToLocalStorage() {
    db.ref("/").once("value", function (snapshot) {
        const allData = snapshot.val();
        localStorage.setItem("boards", JSON.stringify(allData.boards));
        localStorage.setItem("contacts", JSON.stringify(allData.contacts));
        checkLoginResults(true);
    });
}


/** Logs in as guest with fixed credentials. */
function guestLogin() {
    localStorage.setItem("currentUserName", "Gast");
    localStorage.setItem("currentUserEmail", "Gast@Gast.com");
    loadDataToLocalStorage();
}


/** Validates registration inputs and triggers the user-exists check. */
function registerUser() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value.trim();
    const passwordconfirm = document.getElementById("passwordconfirm").value.trim();

    if (!validateInputs(email, password, passwordconfirm)) return;
    checkIfUserExists();
}


/**
 * Validates that the name field is not empty and contains letters.
 * @returns {boolean}
 */
function validateName() {
    const name = document.getElementById("name").value.trim();
    if (!name) {
        showFieldError("name", "nameError", "Please enter your name.");
        return false;
    }
    if (!/[a-zA-ZÀ-ÿ]/.test(name)) {
        showFieldError("name", "nameError", "Your name must contain letters.");
        return false;
    }
    return true;
}


/**
 * Toggles the password-confirm error state based on whether passwords match.
 * @param {boolean} passwordsMatch
 */
function applyPasswordMatchError(passwordsMatch) {
    const passwordError = document.getElementById("passwordError");
    const passwordconfirmWrapper = document.getElementById("passwordconfirmWrapper");
    passwordconfirmWrapper.classList.toggle("input--error", !passwordsMatch);
    if (passwordError) passwordError.textContent = passwordsMatch ? '' : "Your passwords don't match. Please try again.";
}


/**
 * Validates that password is non-empty and matches the confirmation.
 * @param {string} password
 * @param {string} passwordconfirm
 * @returns {boolean}
 */
function validatePasswordMatch(password, passwordconfirm) {
    if (!password.trim()) {
        showFieldError("password", "passwordFieldError", "Please enter a password.");
        return false;
    }
    const passwordsMatch = password.trim() === passwordconfirm.trim();
    applyPasswordMatchError(passwordsMatch);
    return passwordsMatch;
}


/**
 * Validates all registration inputs (name, email, privacy, passwords).
 * @param {string} email
 * @param {string} password
 * @param {string} passwordconfirm
 * @returns {boolean}
 */
function validateInputs(email, password, passwordconfirm) {
    clearAllErrors();
    if (!validateName()) return false;
    if (!isValidEmail(email)) {
        showFieldError("email", "emailError", "Please enter a valid email address.");
        return false;
    }
    if (!checkPrivacy()) return false;
    return validatePasswordMatch(password, passwordconfirm);
}


/**
 * Checks the privacy checkbox and shows an error if unchecked.
 * @returns {boolean}
 */
function checkPrivacy() {
    const privacy = document.getElementById("privacy");
    if (!privacy.checked) {
        const privacyError = document.getElementById("privacyError");
        if (privacyError) privacyError.textContent = "Please accept the Privacy Policy.";
        return false;
    }
    return true;
}


/** Queries DB for an existing user with the same email; saves or shows error. */
function checkIfUserExists() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value.trim();
    db.ref("users").once("value", function (snapshot) {
        const userExists = findExistingUser(snapshot, email);
        if (userExists === true) {
            userAlreadyExistsError();
        } else {
            saveUser(name, email, password);
        }
    });
}


/**
 * Returns true if any user in the snapshot has the given email.
 * @param {object} snapshot
 * @param {string} email
 * @returns {boolean}
 */
function findExistingUser(snapshot, email) {
    let userExists = false;
    snapshot.forEach(function (userSnapshot) {
        const userData = userSnapshot.val();
        if (userData.email === email) {
            userExists = true;
        }
    });
    return userExists;
}


/** Shows an error indicating the email is already registered. */
function userAlreadyExistsError() {
    showFieldError("email", "emailError", "This email address is already registered.");
}


/**
 * Pushes a new user object to the DB.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 */
function saveUser(name, email, password) {
    db.ref("users")
        .push({
            name: name,
            email: email,
            password: password,
        })
        .then(saveUserSuccess)
        .catch(saveUserError);
}


/** Shows a success toast and redirects to the login page. */
function saveUserSuccess() {
    showToast("You Signed Up successfully", function () {
        window.location.href = "index.html";
    });
}


/** Shows an error if saving the new user to the DB failed. */
function saveUserError() {
    showFieldError("email", "emailError", "Error during registration. Please try again.");
}


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
    else { wrapper.classList.remove('has-value'); wrapper.classList.remove('is-visible'); resetToggleButton(wrapper); }
}


/**
 * Resets the toggle button aria state and the input type to password.
 * @param {HTMLElement} wrapper
 */
function resetToggleButton(wrapper) {
    const btn = wrapper.querySelector('.input__icon-btn');
    const input = wrapper.querySelector('input');
    if (btn) { btn.setAttribute('aria-pressed', 'false'); btn.setAttribute('aria-label', 'Show password'); }
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

