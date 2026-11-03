// Backup dei progetti: esportazione in un file JSON e ripristino da file.
// Questo file viene caricato solo da board.html, dopo script.js.

// Crea un file di testo e lo fa scaricare dal browser
function scaricaTesto(nomeFile, testo) {
    const file = new Blob([testo], { type: "application/json" });
    const indirizzo = URL.createObjectURL(file);

    const link = document.createElement("a");
    link.href = indirizzo;
    link.download = nomeFile;
    link.click();

    // L'indirizzo temporaneo non serve piu': libero la memoria
    URL.revokeObjectURL(indirizzo);
}

// Converte il testo di un file JSON nell'elenco dei progetti.
// Ritorna null se il contenuto non e' utilizzabile.
function leggiProgettiDaTesto(testo) {
    let dati;

    try {
        dati = JSON.parse(testo);
    } catch (errore) {
        return null; // il file non e' un JSON valido
    }

    if (!Array.isArray(dati)) {
        return null; // JSON valido, ma non e' un elenco
    }

    // Tengo solo i progetti con almeno un nome e un elenco di attivita'
    const validi = dati.filter(progetto =>
        progetto &&
        typeof progetto.nome === "string" &&
        Array.isArray(progetto.attivita)
    );

    return validi.length > 0 ? validi : null;
}

document.addEventListener("DOMContentLoaded", () => {
    const pulsanteEsporta = document.getElementById("esporta");
    const pulsanteImporta = document.getElementById("importa");
    const campoFile = document.getElementById("file-importa");

    // Se non siamo sulla pagina della board, non faccio niente
    if (!pulsanteEsporta || !pulsanteImporta || !campoFile) {
        return;
    }

    // --- Esporta: scarica i progetti salvati nel browser ---
    pulsanteEsporta.addEventListener("click", () => {
        const progetti = JSON.parse(localStorage.getItem("progetti")) || [];
        scaricaTesto("progetti-kanban.json", JSON.stringify(progetti, null, 2));
    });

    // --- Importa: il pulsante apre la scelta del file ---
    pulsanteImporta.addEventListener("click", () => {
        campoFile.click();
    });

    // --- Letto il file, se e' valido sostituisce i progetti ---
    campoFile.addEventListener("change", () => {
        const file = campoFile.files[0];

        if (!file) {
            return;
        }

        const lettore = new FileReader();

        lettore.addEventListener("load", () => {
            const progetti = leggiProgettiDaTesto(lettore.result);

            if (!progetti) {
                alert("Il file scelto non contiene progetti validi.");
                return;
            }

            localStorage.setItem("progetti", JSON.stringify(progetti));
            window.location.reload(); // ricostruisce la board con i dati importati
        });

        lettore.readAsText(file);

        // Permette di scegliere di nuovo lo stesso file
        campoFile.value = "";
    });
});
