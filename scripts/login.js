/**
 * Firebase configuration object containing the necessary credentials and settings to connect to the Firebase project.
 * This includes the API key, authentication domain, database URL, project ID, storage bucket, messaging sender ID, and app ID.
 */
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


/**
 * Initializes the Firebase application with the provided configuration and sets up a reference to the Realtime Database.
 * This allows the application to interact with the Firebase services, such as authentication and database operations.
 * @param {object} firebaseConfig - The configuration object containing the Firebase project credentials and settings.
 * @returns {object} - A reference to the initialized Firebase application and the Realtime Database.
 */
firebase.initializeApp(firebaseConfig);
const db = firebase.database();


/**Sets the visibility of the body element to visible.*/
document.body.style.visibility = "visible";

/**
 * Plays the intro logo animation: hides all page content except the flying logo,
 * then reveals the rest once the animation finishes.
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
 * This function handles the user login process. It retrieves the email and password from the input fields, then queries the Firebase Realtime Database for all users under the "users" node.
 * It checks if any user in the database has a matching email and password. If a match is found, it sets the current user's name and email in local storage and calls the loadDataToLocalStorage function to load the necessary data for the user.
 * If no match is found, it calls the checkLoginResults function with a false value to indicate an unsuccessful login attempt, which will display an error message to the user.
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


/**
 * This function displays a toast message on the screen with the provided message. 
 * It creates a toast element if it doesn't already exist, sets its text content to the provided message, and makes it visible for a short duration (2 seconds) before hiding it again. 
 * If a callback function is provided, it will be called after the toast is hidden.
 * @param {*} message 
 * @param {*} callback 
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
 * This function displays an error message for a specific input field. It takes the input field's ID, the error element's ID, and the error message as parameters.
 * It adds an error class to the input field's wrapper to visually indicate the error and sets the text content of the error element to the provided message.
 * @param {*} inputId 
 * @param {*} errorId 
 * @param {*} message 
 */
function showFieldError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const wrapper = input ? input.closest(".input__wrapper") : null;
    const errorElement = document.getElementById(errorId);
    if (wrapper) wrapper.classList.add("input--error");
    if (errorElement) errorElement.textContent = message;
}


/**
 * This function clears all error messages and removes error classes from input fields.
 * It selects all elements with the class "input__wrapper" that also have the class "input--error" and removes the "input--error" class from them.
 * It also selects all elements with the class "error__text" and clears their text content.
 */
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
 * This function validates the email input for the login process. It checks if the provided email is in a valid format using the isValidEmail function.
 * If the email is not valid, it calls the showFieldError function to display an error message for the email input field and returns false. If the email is valid, it returns true.
 * @param {*} email 
 * @returns 
 */
function validateLoginEmail(email) {
    if (!isValidEmail(email)) {
        showFieldError("email", "emailError", "Bitte gib eine gültige E-Mail-Adresse ein.");
        return false;
    }
    return true;
}


function loginUser() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    clearAllErrors();
    if (!validateLoginEmail(email)) return;
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
 * This function checks if a user with the provided email and password exists in the Firebase Realtime Database.
 * @param {object} snapshot - The snapshot of the Firebase Realtime Database.
 * @param {string} email - The email of the user to check.
 * @param {string} password - The password of the user to check.
 * @returns {boolean} - A boolean value indicating whether the user exists.
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
 * This function checks the result of the login attempt. If the login was successful (login Success is ture), it redirects to the summary page.
 * If the login was unsuccessful (login Success is false), it display an error massage using the SweetAlert library,
 * indicating that the email or password is incorrect.
 * @param {boolean} loginSuccess - A boolean value indicating whether the login attempt was successful or not.
 */
function checkLoginResults(loginSuccess) {
    if (loginSuccess === true) {
        sessionStorage.setItem("fromLogin", "true");
        window.location.href = "summary.html";
    } else {
        showFieldError("email", "emailError", "E-Mail oder Passwort ist falsch.");
        showFieldError("password", "passwordError", "E-Mail oder Passwort ist falsch.");
    }
}


/**
 * This function loads data from the Firebase Realtime Database to the local storage of the browser.
 * It retrieves the data from the root of the database, extracts the "boards" and "contacts" data, and stores them in local storage as JSON strings.
 * After successfully loading the data, it calls the checkLoginResults function with a true value to indicate a successful login and data loading process.
 * This allows the application to have access to the necessary data for the user after logging in, and ensures that the user is redirected to the appropriate page.
 * @param {object} snapshot - The snapshot of the Firebase Realtime Database.
 */
function loadDataToLocalStorage() {
    db.ref("/").once("value", function (snapshot) {
        const allData = snapshot.val();
        localStorage.setItem("boards", JSON.stringify(allData.boards));
        localStorage.setItem("contacts", JSON.stringify(allData.contacts));
        checkLoginResults(true);
    });
}


/**
 * This function allows users to log in as a guest by setting predefined values for the current user's name and email in local storage.
 * @param {string} name - The name of the guest user to be set in local storage.
 * @param {string} email - The email of the guest user to be set in local storage.
 */
function guestLogin() {
    localStorage.setItem("currentUserName", "Gast");
    localStorage.setItem("currentUserEmail", "Gast@Gast.com");
    loadDataToLocalStorage();
}


/**
 * This function handles the user registration process. It retrieves the email, password, and password confirmation from the input fields, then validates the inputs using the validateInputs function.
 * @returns {boolean} - A boolean value indicating whether the registration process was successful or not.
 */
function registerUser() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const passwordconfirm = document.getElementById("passwordconfirm").value;

    if (!validateInputs(email, password, passwordconfirm)) return;
    checkIfUserExists();
}


/**
 * This function validates the user inputs for registration, including email format and password confirmation.
 * @param {string} email - The email entered by the user.
 * @param {string} password - The password entered by the user.
 * @param {string} passwordconfirm - The password confirmation entered by the user.
 * @returns {boolean} - A boolean value indicating whether the inputs are valid or not.
 */
function validateInputs(email, password, passwordconfirm) {
    clearAllErrors();
    if (!isValidEmail(email)) {
        showFieldError("email", "emailError", "Bitte gib eine gültige E-Mail-Adresse ein.");
        return false;
    }
    if (!checkPrivacy()) return false;
    const passwordError = document.getElementById("passwordError");
    const passwordconfirmWrapper = document.getElementById("passwordconfirmWrapper");
    const passwordsMatch = password === passwordconfirm;
    passwordconfirmWrapper.classList.toggle("input--error", !passwordsMatch);
    if (passwordError) passwordError.textContent = passwordsMatch ? '' : "Your passwords don't match. Please try again.";
    return passwordsMatch;
}


/**
 * This function checks if the user has accepted the privacy policy by checking the stat of a checkbox with the id "privacy".
 * If the checkbox is not checked, it displays an error massage using SewwtAlert.
 * @param {boolean} privacyChecked - A boolean value indicating whether the privacy policy checkbox is checked or not.
 * @returns {boolean} - A boolean value indicating whether the user has accepted the privacy policy or not.
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


/**
 * This function checks if a user with the provided email already exists in the Firebase Realtime Database.
 * It retrieves the name, email, and password from the input fields, then queries the database for all users under the "users" node.
 * It iterates through the users in the database and checks if any user has a matching email. If a match is found, it calls the userAlreadyExistsError function to display an error message.
 * If no match is found, it calls the saveUser function to save the new user's data to the database.
 * @param {string} name - The name of the user to check.
 * @param {string} email - The email of the user to check.
 * @param {string} password - The password of the user to check.
 */
function checkIfUserExists() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
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
 * This function iterates through the users in the Firebase Realtime Database snapshot and checks if any user has a matching email.
 * If a match is found, it sets the userExists variable to true. After iterating through all users, it returns the value of userExists, indicating whether a user with the provided email already exists in the database or not.
 * @param {object} snapshot - The snapshot of the Firebase Realtime Database.
 * @param {string} email - The email to check for.
 * @returns {boolean} - A boolean value indicating whether a user with the provided email already exists in the database or not.
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


/** * This function displays an error message using the SweetAlert library, indicating that a user with the provided email already exists in the database.
 */
function userAlreadyExistsError() {
    showFieldError("email", "emailError", "Diese E-Mail-Adresse ist bereits registriert.");
}


/**
 * This function saves a new user to the Realtime Database under the "users" node.
 * It takes the user's name, email, and password as parameters and pushes this data to the database.
 * If the user is successfully saved, it displays a success message.
 * If there is an error during the saving process, it catches the error and displays an error message.
 * @param {string} name - The name of the user to be saved.
 * @param {string} email - The email of the user to be saved.
 * @param {string} password - The password of the user to be saved.
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


/** * This function displays a success message using the SweetAlert library, indicating that the registration was successful.
 * After the user clicks the "OK" button on the alert, it redirects the user to the login page (index.html).
 */
function saveUserSuccess() {
    showToast("You Signed Up successfully", function () {
        window.location.href = "index.html";
    });
}


/** * This function displays an error message using the SweetAlert library, indicating that there was an error during the registration process.
 */
function saveUserError() {
    showFieldError("email", "emailError", "Fehler bei der Registrierung. Bitte versuche es erneut.");
}
