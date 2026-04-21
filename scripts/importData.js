let currentUserName = localStorage.getItem("currentUserName");
let currentUserEmail = localStorage.getItem("currentUserEmail");
let boards = importandFormatLocalStorageData("boards");
let contacts = importandFormatLocalStorageData("contacs");

/**
 * Reads a JSON object from local storage by key and returns its values as an array.
 * @param {string} key - Local storage key that contains a JSON-serialized object.
 * @returns {Array} Array of first-level values from the stored object.
 */
function importandFormatLocalStorageData(key) {
    return Object.values(JSON.parse(localStorage.getItem(key)));
}
