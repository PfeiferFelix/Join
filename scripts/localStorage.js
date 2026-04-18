function saveToLocalStorage(key, value) {
    //mit localStorage.setItem('key','value') abspeichern [untersuchen webseite -> application zu finden]
    //wenn man ohne die Funktion strinigy speichern würde, würde es zwar auch als String abgespeichert werden aber die
    //Struktur geht verloren und man wüsste nicht mehr was es vorher war. Mit stringify wird es mit Strukur in einen String gewandelt
    //Somit kann man später auf die einzelnen Elemente zugreifen
    localStorage.setItem(key, JSON.stringify(value));
}

function getFromLocalStorage(key) {
    //Hier genau daselbe. Damit man wieder einen Array hat,
    //muss man es mit einer JSON-methode von dem JSON-Format wieder in
    //in ein normales Array umwandeln, sonst hätte man es wieder ohne Struktur
    let MY_DATA_STORAGE = JSON.parse(localStorage.getItem(key));
    //Fals nichts im local storage sein sollte, würde es ohne den Befehl einen fehler geben
    //Da es bei leeren Storage null zurückgeben würde und die length-methode kann nicht auf null angewendet
    //werden die in einer anderen funktion vorhanden ist
    if (MY_DATA_STORAGE) {
        return MY_DATA_STORAGE;
    }
}
