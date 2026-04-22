let boardsLS = importandFormatLocalStorageData("boards");

function initSummary() {
    addNameToGoodMorning();
    /*     reduceFontSiceIfToBig(); */
}

function toDoOpen() {}

function addNameToGoodMorning() {
    if (currentUserNameLS !== "Gast") {
        document.getElementById("js-greeting-name").innerHTML = currentUserNameLS;
        document.getElementById("js-greeting-morning").innerText += `,`;
    }
}

/* function reduceFontSiceIfToBig() {
    const nameArray = currentUserName.split(" ");
    for (const namePart of nameArray) {
        if (namePart.length > 6) {
            document.getElementById("text-size-reduce").style.fontSize = "60%";
            break;
        }
    }
} */
