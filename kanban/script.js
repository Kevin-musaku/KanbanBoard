const stati = ["todo", "doing", "done"];

const professioni = [
    "Sviluppatore frontend",
    "Sviluppatore backend",
    "Sviluppatore full stack",
    "Database administrator",
    "Sistemista",
    "Specialista di rete",
    "Esperto di sicurezza",
    "Designer UI/UX",
    "Tester",
    "Project manager"
];

/* ---------- Tema chiaro / scuro ---------- */

// Lo script è caricato nel <head>: applico subito il tema salvato,
// così la pagina non lampeggia di bianco prima di diventare scura.
if (localStorage.getItem("tema") === "scuro") {
    document.documentElement.dataset.tema = "scuro";
}

function preparaTema() {
    const pulsante = document.querySelector(".cambia-tema");
    const radice = document.documentElement;

    function aggiornaTesto() {
        pulsante.textContent = radice.dataset.tema === "scuro" ? "Tema chiaro" : "Tema scuro";
    }

    pulsante.addEventListener("click", function () {
        if (radice.dataset.tema === "scuro") {
            delete radice.dataset.tema;
            localStorage.setItem("tema", "chiaro");
        } else {
            radice.dataset.tema = "scuro";
            localStorage.setItem("tema", "scuro");
        }
        aggiornaTesto();
    });

    aggiornaTesto();
}

/* ---------- Lettura e salvataggio dei dati ---------- */

function leggiProgetti() {
    const progetti = JSON.parse(localStorage.getItem("progetti")) || [];

    // Le versioni precedenti salvavano i partecipanti come semplici nomi:
    // li trasformo in oggetti { nome, ruolo }.
    progetti.forEach(function (progetto) {
        progetto.partecipanti = (progetto.partecipanti || []).map(function (p) {
            return typeof p === "string" ? { nome: p, ruolo: "" } : p;
        });
    });

    return progetti;
}

function salvaProgetti(progetti) {
    localStorage.setItem("progetti", JSON.stringify(progetti));
}

/* ---------- Funzioni di supporto ---------- */

// Riempie una <select> con una prima voce vuota seguita dall'elenco di voci
function riempiSelect(select, voci, primaVoce) {
    select.innerHTML = "";

    const vuota = document.createElement("option");
    vuota.value = "";
    vuota.textContent = primaVoce;
    select.appendChild(vuota);

    voci.forEach(function (voce) {
        const opzione = document.createElement("option");
        opzione.value = voce;
        opzione.textContent = voce;
        select.appendChild(opzione);
    });
}

// Mostra i partecipanti come etichette, con la × per rimuoverli
function mostraChips(lista, partecipanti, rimuovi) {
    lista.innerHTML = "";
    partecipanti.forEach(function (partecipante, indice) {
        const chip = document.createElement("li");
        chip.textContent = partecipante.nome;
        if (partecipante.ruolo) {
            chip.textContent += " · " + partecipante.ruolo;
        }

        const x = document.createElement("button");
        x.type = "button";
        x.className = "rimuovi";
        x.title = "Rimuovi";
        x.innerHTML = "&times;";
        x.addEventListener("click", function () {
            rimuovi(indice);
        });
        chip.appendChild(x);

        lista.appendChild(chip);
    });
}

function oreTotali(elenco) {
    return elenco.reduce(function (totale, attivita) {
        return totale + Number(attivita.durata);
    }, 0);
}

// Data di oggi nel formato AAAA-MM-GG, lo stesso usato da <input type="date">
function oggi() {
    const data = new Date();
    data.setMinutes(data.getMinutes() - data.getTimezoneOffset());
    return data.toISOString().slice(0, 10);
}

// Da "2026-10-28" a "28/10/2026"
function formattaScadenza(scadenza) {
    return scadenza.split("-").reverse().join("/");
}

/* ---------- Pagina dei progetti (index.html) ---------- */

function paginaProgetti() {
    const form = document.getElementById("form-progetto");
    const contenitore = document.getElementById("progetti");
    const campoPartecipante = document.getElementById("nuovo-partecipante");
    const sceltaRuolo = document.getElementById("ruolo-partecipante");
    const listaPartecipanti = document.getElementById("lista-partecipanti");
    let partecipanti = [];

    riempiSelect(sceltaRuolo, professioni, "Ruolo (facoltativo)");

    function mostraPartecipanti() {
        mostraChips(listaPartecipanti, partecipanti, function (indice) {
            partecipanti.splice(indice, 1);
            mostraPartecipanti();
        });
    }

    function aggiungiPartecipante() {
        const nome = campoPartecipante.value.trim();
        const giaPresente = partecipanti.some(function (p) {
            return p.nome === nome;
        });
        if (nome && !giaPresente) {
            partecipanti.push({ nome: nome, ruolo: sceltaRuolo.value });
            mostraPartecipanti();
        }
        campoPartecipante.value = "";
        sceltaRuolo.value = "";
        campoPartecipante.focus();
    }

    document.getElementById("aggiungi-partecipante").addEventListener("click", aggiungiPartecipante);

    campoPartecipante.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            aggiungiPartecipante();
        }
    });

    function mostra() {
        contenitore.innerHTML = "";
        leggiProgetti().forEach(function (progetto) {
            const totale = progetto.attivita.length;
            const fatte = progetto.attivita.filter(function (a) {
                return a.stato === "done";
            }).length;
            const percentuale = totale ? Math.round(fatte / totale * 100) : 0;
            const persone = progetto.partecipanti.length;

            const link = document.createElement("a");
            link.className = "progetto";
            link.href = "board.html?id=" + progetto.id;
            link.innerHTML =
                "<h3></h3>" +
                "<p class='descrizione'></p>" +
                "<div class='progresso'><div class='barra'></div></div>" +
                "<p class='info'></p>";

            link.querySelector("h3").textContent = progetto.nome;
            link.querySelector(".descrizione").textContent = progetto.descrizione;
            link.querySelector(".barra").style.width = percentuale + "%";
            link.querySelector(".info").textContent =
                totale + " attività · " +
                persone + (persone === 1 ? " partecipante" : " partecipanti") + " · " +
                percentuale + "% completato";

            contenitore.appendChild(link);
        });
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        // Se è rimasto un nome scritto ma non aggiunto, lo includo
        if (campoPartecipante.value.trim()) {
            aggiungiPartecipante();
        }

        const progetti = leggiProgetti();
        progetti.push({
            id: Date.now(),
            nome: form.nome.value,
            descrizione: form.descrizione.value,
            partecipanti: partecipanti,
            attivita: []
        });
        salvaProgetti(progetti);

        form.reset();
        partecipanti = [];
        mostraPartecipanti();
        mostra();
    });

    mostra();
}

/* ---------- Pagina della board (board.html) ---------- */

function paginaBoard() {
    const id = new URLSearchParams(window.location.search).get("id");
    const progetti = leggiProgetti();
    const progetto = progetti.find(function (p) {
        return p.id == id;
    });

    if (!progetto) {
        window.location.href = "index.html";
        return;
    }

    const finestra = document.getElementById("finestra-attivita");
    const form = document.getElementById("form-nuova");
    const sceltaPersona = document.getElementById("persona");
    const sceltaProfessionista = document.getElementById("professionista");
    const formPartecipante = document.getElementById("form-partecipante");
    const campoCerca = document.getElementById("cerca");
    const filtroPersona = document.getElementById("filtro-persona");
    const ordinaPriorita = document.getElementById("ordina-priorita");

    // L'attività che si sta modificando, oppure null se se ne crea una nuova
    let attivitaInModifica = null;

    riempiSelect(sceltaProfessionista, professioni, "Seleziona...");
    riempiSelect(formPartecipante.ruolo, professioni, "Ruolo (facoltativo)");

    function salva() {
        salvaProgetti(progetti);
    }

    function trova(idAttivita) {
        return progetto.attivita.find(function (a) {
            return a.id == idAttivita;
        });
    }

    /* --- Intestazione: nome, modifica ed eliminazione del progetto --- */

    function mostraIntestazione() {
        document.title = progetto.nome + " - Kanban Board";
        document.getElementById("nome-progetto").textContent = progetto.nome;
        document.getElementById("descrizione-progetto").textContent = progetto.descrizione;
    }

    document.getElementById("modifica-progetto").addEventListener("click", function () {
        const nuovoNome = prompt("Nome del progetto", progetto.nome);
        if (nuovoNome === null || !nuovoNome.trim()) {
            return;
        }
        const nuovaDescrizione = prompt("Descrizione del progetto", progetto.descrizione);

        progetto.nome = nuovoNome.trim();
        if (nuovaDescrizione !== null) {
            progetto.descrizione = nuovaDescrizione;
        }
        salva();
        mostraIntestazione();
    });

    document.getElementById("elimina-progetto").addEventListener("click", function () {
        if (!confirm("Eliminare il progetto \"" + progetto.nome + "\" e tutte le sue attività?")) {
            return;
        }
        const rimanenti = progetti.filter(function (p) {
            return p !== progetto;
        });
        salvaProgetti(rimanenti);
        window.location.href = "index.html";
    });

    /* --- Partecipanti --- */

    function mostraPartecipanti() {
        mostraChips(document.getElementById("partecipanti-progetto"), progetto.partecipanti, rimuoviPartecipante);

        const nomi = progetto.partecipanti.map(function (p) {
            return p.nome;
        });

        riempiSelect(sceltaPersona, nomi,
            nomi.length ? "Seleziona..." : "Nessun partecipante: aggiungili in alto");

        // Ricostruisco il filtro mantenendo la persona scelta, se esiste ancora
        const filtroAttuale = filtroPersona.value;
        riempiSelect(filtroPersona, nomi, "Tutte le persone");
        filtroPersona.value = nomi.includes(filtroAttuale) ? filtroAttuale : "";
    }

    function rimuoviPartecipante(indice) {
        const nome = progetto.partecipanti[indice].nome;
        const assegnate = progetto.attivita.filter(function (a) {
            return a.persona === nome;
        });

        let messaggio = "Rimuovere " + nome + " dal progetto?";
        if (assegnate.length) {
            messaggio += "\nLe sue " + assegnate.length + " attività resteranno senza assegnatario.";
        }
        if (!confirm(messaggio)) {
            return;
        }

        assegnate.forEach(function (a) {
            a.persona = "";
        });
        progetto.partecipanti.splice(indice, 1);
        salva();
        mostraPartecipanti();
        mostra();
    }

    formPartecipante.addEventListener("submit", function (e) {
        e.preventDefault();
        const nome = formPartecipante.nome.value.trim();
        const giaPresente = progetto.partecipanti.some(function (p) {
            return p.nome === nome;
        });
        if (nome && !giaPresente) {
            progetto.partecipanti.push({ nome: nome, ruolo: formPartecipante.ruolo.value });
            salva();
            mostraPartecipanti();
            mostra();
        }
        formPartecipante.reset();
    });

    // Scegliendo una persona, propongo il suo ruolo come tipo di professionista
    sceltaPersona.addEventListener("change", function () {
        const partecipante = progetto.partecipanti.find(function (p) {
            return p.nome === sceltaPersona.value;
        });
        if (partecipante && partecipante.ruolo) {
            sceltaProfessionista.value = partecipante.ruolo;
        }
    });

    /* --- Finestra per creare o modificare un'attività --- */

    // Suggerisce le categorie già usate nel progetto
    function aggiornaCategorie() {
        const elenco = document.getElementById("elenco-categorie");
        elenco.innerHTML = "";
        const categorie = [];
        progetto.attivita.forEach(function (a) {
            if (!categorie.includes(a.categoria)) {
                categorie.push(a.categoria);
            }
        });
        categorie.forEach(function (categoria) {
            const opzione = document.createElement("option");
            opzione.value = categoria;
            elenco.appendChild(opzione);
        });
    }

    function apriFinestra(attivita) {
        attivitaInModifica = attivita || null;
        form.reset();
        aggiornaCategorie();

        document.getElementById("titolo-finestra").textContent = attivita ? "Modifica attività" : "Nuova attività";
        document.getElementById("conferma").textContent = attivita ? "Salva" : "Aggiungi";

        if (attivita) {
            form.titolo.value = attivita.titolo;
            form.descrizione.value = attivita.descrizione;
            form.categoria.value = attivita.categoria;
            form.persona.value = attivita.persona;
            form.professionista.value = attivita.professionista;
            form.durata.value = attivita.durata;
            form.priorita.value = attivita.priorita || "media";
            form.scadenza.value = attivita.scadenza || "";
        }

        finestra.showModal();
    }

    document.getElementById("apri-finestra").addEventListener("click", function () {
        apriFinestra();
    });

    document.getElementById("annulla").addEventListener("click", function () {
        finestra.close();
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const dati = {
            titolo: form.titolo.value,
            descrizione: form.descrizione.value,
            categoria: form.categoria.value.trim(),
            professionista: form.professionista.value,
            persona: form.persona.value,
            durata: form.durata.value,
            priorita: form.priorita.value,
            scadenza: form.scadenza.value
        };

        if (attivitaInModifica) {
            Object.assign(attivitaInModifica, dati);
        } else {
            dati.id = Date.now();
            dati.stato = "todo";
            progetto.attivita.push(dati);
        }

        salva();
        finestra.close();
        mostra();
    });

    /* --- Ricerca e filtro --- */

    campoCerca.addEventListener("input", mostra);
    filtroPersona.addEventListener("change", mostra);
    ordinaPriorita.addEventListener("change", mostra);

    /* --- Trascinamento delle card --- */

    document.querySelectorAll(".lista").forEach(function (lista) {
        lista.addEventListener("dragover", function (e) {
            e.preventDefault();
        });

        lista.addEventListener("drop", function (e) {
            e.preventDefault();
            const attivita = trova(e.dataTransfer.getData("text/plain"));
            const cardSotto = e.target.closest(".card");

            // Card lasciata su sé stessa: non cambia nulla
            if (!attivita || (cardSotto && cardSotto.dataset.id == attivita.id)) {
                return;
            }

            // Tolgo l'attività dalla sua posizione...
            progetto.attivita.splice(progetto.attivita.indexOf(attivita), 1);
            attivita.stato = lista.parentElement.id;

            // ...e la rimetto prima della card su cui è stata lasciata, oppure in fondo
            if (cardSotto) {
                const posizione = progetto.attivita.indexOf(trova(cardSotto.dataset.id));
                progetto.attivita.splice(posizione, 0, attivita);
            } else {
                progetto.attivita.push(attivita);
            }

            salva();
            mostra();
        });
    });

    function sposta(attivita, direzione) {
        const posizione = stati.indexOf(attivita.stato) + direzione;
        if (posizione >= 0 && posizione < stati.length) {
            attivita.stato = stati[posizione];
            salva();
            mostra();
        }
    }

    /* --- Card delle attività --- */

    function creaPulsante(testo, classe, azione) {
        const pulsante = document.createElement("button");
        pulsante.type = "button";
        pulsante.className = classe;
        pulsante.innerHTML = testo;
        pulsante.addEventListener("click", function (e) {
            e.stopPropagation();
            azione();
        });
        return pulsante;
    }

    function creaCard(attivita) {
        const priorita = attivita.priorita || "media";
        const scaduta = attivita.scadenza && attivita.scadenza < oggi() && attivita.stato !== "done";

        const card = document.createElement("article");
        card.className = "card priorita-" + priorita;
        if (scaduta) {
            card.classList.add("scaduta");
        }
        card.dataset.id = attivita.id;
        card.draggable = true;

        card.innerHTML =
            "<div class='testa'><span class='bollino'></span><h3></h3></div>" +
            "<p class='categoria'></p>" +
            "<p class='descrizione'></p>" +
            "<ul class='dettagli'></ul>" +
            "<div class='azioni'></div>";

        card.querySelector(".bollino").title = "Priorità " + priorita;
        card.querySelector("h3").textContent = attivita.titolo;
        card.querySelector(".categoria").textContent = attivita.categoria;
        card.querySelector(".descrizione").textContent = attivita.descrizione;

        const dettagli = card.querySelector(".dettagli");
        function aggiungiDettaglio(testo) {
            const voce = document.createElement("li");
            voce.textContent = testo;
            dettagli.appendChild(voce);
            return voce;
        }

        aggiungiDettaglio("Assegnata a: " + (attivita.persona || "nessuno"));
        aggiungiDettaglio("Professionista: " + attivita.professionista);
        aggiungiDettaglio("Durata: " + attivita.durata + " ore");
        if (attivita.scadenza) {
            const voce = aggiungiDettaglio("Scadenza: " + formattaScadenza(attivita.scadenza) + (scaduta ? " (scaduta)" : ""));
            if (scaduta) {
                voce.className = "testo-scaduto";
            }
        }
        // L'id è il momento di creazione (Date.now()), quindi lo uso come data
        aggiungiDettaglio("Creata il " + new Date(attivita.id).toLocaleDateString("it-IT"));

        const azioni = card.querySelector(".azioni");
        const posizione = stati.indexOf(attivita.stato);

        if (posizione > 0) {
            azioni.appendChild(creaPulsante("&larr; Sinistra", "sposta-sinistra", function () {
                sposta(attivita, -1);
            }));
        }
        if (posizione < stati.length - 1) {
            azioni.appendChild(creaPulsante("Destra &rarr;", "sposta-destra", function () {
                sposta(attivita, 1);
            }));
        }

        azioni.appendChild(creaPulsante("Modifica", "secondario", function () {
            apriFinestra(attivita);
        }));

        azioni.appendChild(creaPulsante("Elimina", "elimina", function () {
            if (!confirm("Eliminare l'attività \"" + attivita.titolo + "\"?")) {
                return;
            }
            progetto.attivita = progetto.attivita.filter(function (a) {
                return a.id != attivita.id;
            });
            salva();
            mostra();
        }));

        card.addEventListener("click", function () {
            card.classList.toggle("aperta");
        });

        card.addEventListener("dragstart", function (e) {
            e.dataTransfer.setData("text/plain", attivita.id);
        });

        return card;
    }

    /* --- Riepilogo delle ore per persona --- */

    function mostraRiepilogo() {
        const corpo = document.querySelector("#riepilogo tbody");
        corpo.innerHTML = "";

        // Tutti i partecipanti, più eventuali nomi presenti solo nelle attività
        // (compreso "" per le attività senza assegnatario)
        const persone = progetto.partecipanti.map(function (p) {
            return p.nome;
        });
        progetto.attivita.forEach(function (a) {
            if (!persone.includes(a.persona)) {
                persone.push(a.persona);
            }
        });

        persone.forEach(function (nome) {
            const sue = progetto.attivita.filter(function (a) {
                return a.persona === nome;
            });
            const completate = sue.filter(function (a) {
                return a.stato === "done";
            });

            const riga = corpo.insertRow();
            riga.insertCell().textContent = nome || "Non assegnate";
            riga.insertCell().textContent = sue.length;
            riga.insertCell().textContent = oreTotali(sue) + " h";
            riga.insertCell().textContent = oreTotali(completate) + " h";
        });

        document.getElementById("riepilogo").hidden = persone.length === 0;
    }

    /* --- Disegno della board --- */

    function mostra() {
        const testo = campoCerca.value.trim().toLowerCase();
        const persona = filtroPersona.value;

        const visibili = progetto.attivita.filter(function (a) {
            const titoloOk = a.titolo.toLowerCase().includes(testo);
            const personaOk = !persona || a.persona === persona;
            return titoloOk && personaOk;
        });

        // Ordinamento per priorità: assegno un peso a ogni priorità
        // e ordino le attività visibili dal peso più grande al più piccolo
        if (ordinaPriorita.value) {
            const pesi = { alta: 3, media: 2, bassa: 1 };
            const alta = ordinaPriorita.value === "alta";
            visibili.sort(function (a, b) {
                const pa = pesi[a.priorita || "media"];
                const pb = pesi[b.priorita || "media"];
                return alta ? pb - pa : pa - pb;
            });
        }

        stati.forEach(function (stato) {
            const colonna = document.getElementById(stato);
            const lista = colonna.querySelector(".lista");
            const attivita = visibili.filter(function (a) {
                return a.stato === stato;
            });

            lista.innerHTML = "";
            attivita.forEach(function (a) {
                lista.appendChild(creaCard(a));
            });
            colonna.querySelector(".contatore").textContent = attivita.length + " · " + oreTotali(attivita) + " h";
        });

        mostraRiepilogo();
    }

    mostraIntestazione();
    mostraPartecipanti();
    mostra();
}

document.addEventListener("DOMContentLoaded", function () {
    preparaTema();
    if (document.getElementById("form-progetto")) {
        paginaProgetti();
    }
    if (document.getElementById("board")) {
        paginaBoard();
    }
});
