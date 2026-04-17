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
    const email = document.getElementById("email").value; // E-Mail und Passwort aus den Eingabefeldern holen
    const password = document.getElementById("password").value;
    db.ref("users").once("value", function (snapshot) { //Alle Benutzer unter "users" in der Datenbank abrufen
        let loginSuccess = false; //Login standardmäßig auf false setzen
        snapshot.forEach(function (userSnapshot) { //snapshot durchläuft durchläuft alle Benutzer
            const userData = userSnapshot.val(); //Daten in userData speichern
            if (userData.email == email && userData.password == password) { //Überprüfen, ob E-Mail und Passwort übereinstimmen
                loginSuccess = true; //Wenn ja, Login auf true setzen
            }
        })
        checkLoginResults(loginSuccess); //Ergebnis der Login-Überprüfung an Funktion checkLoginResults übergeben
    });
}

function checkLoginResults(loginSuccess) {
    if (loginSuccess === true) { //Wenn Login erfolgreich, Benutzer weiterleiten zu Summary.html
        window.location.href = "summary.html";
    } else {
        alert("Email oder Password sind Falsch"); //Wenn Login nicht erfolgreich, Fehlermeldung anzeigen
    }
}

// Registrierung

function registerUser() {
    const name = document.getElementById("name").value; //Name, E-Mail, Passwort und Passwortbestätigung aus den Eingabefeldern holen
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const passwordconfirm = document.getElementById("passwordconfirm").value;
    if (password !== passwordconfirm) { //Überprüfen, ob Passwort und Passwortbestätigung übereinstimmen
        alert("Passwort stimmt nicht überein!"); //Wenn nicht, Fehlermeldung anzeigen und Funktion verlassen
        return;
    } else {
        db.ref("users").push({ //Wenn ja, neuen Benutzer unter "users" in der Datenbank anlegen
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
}