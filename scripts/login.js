// Firebase-API-Key und Konfiguration
const firebaseConfig = {
    apiKey: "AIzaSyDqKUIXrAGfDTsbymcVdJ2w5ATaApioOv8",
    authDomain: "join-5bd8d.firebaseapp.com",
    databaseURL: "https://join-5bd8d-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "join-5bd8d",
    storageBucket: "join-5bd8d.firebasestorage.app",
    messagingSenderId: "404471964373",
    appId: "1:404471964373:web:584fe9ea95cd3476aab85c"
};

firebase.initializeApp(firebaseConfig); // Firebase initialisieren
const db = firebase.database(); // Zugriff auf die Realtime Database

// Login
function loginUser() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    db.ref("users").once("value", function (snapshot) {
        let loginSuccess = false;
        snapshot.forEach(function (userSnapshot) {
            const userData = userSnapshot.val();
            if (userData.email == email && userData.password == password) {
                loginSuccess = true;
                localStorage.setItem("currentUserName", userData.name);
                localStorage.setItem("currentUserEmail", userData.email);
            }
        })
        if (loginSuccess) {
            loadDataToLocalStorage();
        } else {
            checkLoginResults(false);
        }
    });
}

function checkLoginResults(loginSuccess) {
    if (loginSuccess === true) {
        window.location.href = "summary.html";
    } else {
        alert("Email oder Password sind Falsch");
    }
}

// Daten in Local Storage laden
    function loadDataToLocalStorage() {
    db.ref("/").once("value", function(snapshot) {
        const allData = snapshot.val();
        localStorage.setItem("boards", JSON.stringify(allData.boards));
        localStorage.setItem("contacs", JSON.stringify(allData.contacs));
        checkLoginResults(true);
    });
}


// Gast Login
function guestLogin(){
    localStorage.setItem("currentUserName", "Gast");
    localStorage.setItem("currentUserEmail", "Gast@Gast.com");
    loadDataToLocalStorage();
}




// Registrierung
function registerUser() {
    const password = document.getElementById("password").value;
    const passwordconfirm = document.getElementById("passwordconfirm").value;
    if (password !== passwordconfirm) { //Überprüfen, ob Passwort und Passwortbestätigung übereinstimmen
        alert("Passwort stimmt nicht überein!"); //Wenn nicht, Fehlermeldung anzeigen und Funktion verlassen
        return;
    }
    checkIfUserExists()
}


function checkIfUserExists() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value; // E-Mail und Passwort aus den Eingabefeldern holen
    db.ref("users").once("value", function (snapshot) { //Alle Benutzer unter "users" in der Datenbank abrufen
        let userExists = false; //Login standardmäßig auf false setzen
        snapshot.forEach(function (userSnapshot) { //snapshot durchläuft alle Benutzer
            const userData = userSnapshot.val(); //Daten in userData speichern
            if (userData.email === email) { //Überprüfen, ob E-Mail und Passwort übereinstimmen
                userExists = true; //Wenn ja, Login auf true setzen  
            }
        })
        if (userExists === true){ //Wenn User bereits existiert, Fehlermeldung anzeigen sonst weiter zur function saveUser()
            alert("Benutzer existiert bereits!")
        }else {
    saveUser(name, email, password);   
    }
    });
}

//Safe User
function saveUser(name, email, password){
db.ref("users").push({ //Neuen Benutzer unter "users" in der Datenbank anlegen
            name: name,
            email: email,
            password: password,
        }).then(function () { //.then bedeutet das gewartet wird, bis der Benutzer erfolgreich angelegt wurde, bevor die nächste Aktion ausgeführt wird
            alert("Registrierung Erfolgreich!"); //Erfolgsmeldung anzeigen
            window.location.href = "login.html"; //Benutzer weiterleiten zu login.html
        }).catch(function (error) { //Wenn Fehler auftritt, Fehlermeldung anzeigen
            alert("Fehler bei der Registrierung!");
        });
}