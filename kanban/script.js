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
// Lo script è caricato nel <head>: applico subito il tema salvato,
// così la pagina non lampeggia di bianco prima di diventare scura.
if (localStorage.getItem("tema") === "scuro") {
    document.documentElement.dataset.tema = "scuro";
}

function preparaTema() {
    const pulsante = document.querySelector(".cambia-tema");
    const radice = document.documentElement;
    const aggiornaTesto = () => {
        pulsante.textContent = radice.dataset.tema === "scuro" ? "Tema chiaro" : "Tema scuro";
    };

    pulsante.addEventListener("click", () => {
        const scuro = radice.dataset.tema !== "scuro";
        if (scuro) {
            radice.dataset.tema = "scuro";
        } else {
            delete radice.dataset.tema;
        }
        localStorage.setItem("tema", scuro ? "scuro" : "chiaro");
        aggiornaTesto();
    });

    aggiornaTesto();
}

function leggiProgetti() {
    const progetti = JSON.parse(localStorage.getItem("progetti")) || [];

    // Le versioni precedenti salvavano i partecipanti come semplici nomi:
    // li trasformo in oggetti { nome, ruolo }.
    progetti.forEach(progetto => {
        progetto.partecipanti = (progetto.partecipanti || []).map(p =>
            typeof p === "string" ? { nome: p, ruolo: "" } : p
        );
    });

    return progetti;
}

function salvaProgetti(progetti) {
    localStorage.setItem("progetti", JSON.stringify(progetti));
}

// Crea un elemento con classe e testo
function crea(tag, classe = "", testo = "") {
    const elemento = document.createElement(tag);
    elemento.className = classe;
    elemento.textContent = testo;
    return elemento;
}

// Riempie una <select> con una prima voce vuota seguita dall'elenco di voci
function riempiSelect(select, voci, primaVoce) {
    select.replaceChildren(new Option(primaVoce, ""), ...voci.map(voce => new Option(voce, voce)));
}

// Mostra i partecipanti come etichette, con la × per rimuoverli
function mostraChips(lista, partecipanti, rimuovi) {
    lista.replaceChildren(...partecipanti.map((p, indice) => {
        const chip = crea("li", "", p.ruolo ? `${p.nome} · ${p.ruolo}` : p.nome);
        const x = crea("button", "rimuovi");
        x.type = "button";
        x.title = "Rimuovi";
        x.innerHTML = "&times;";
        x.addEventListener("click", () => rimuovi(indice));
        chip.append(x);
        return chip;
    }));
}

// Aggiunge un partecipante all'elenco se il nome è nuovo; dice se l'ha aggiunto
function aggiungiPartecipante(elenco, nome, ruolo) {
    nome = nome.trim();
    if (!nome || elenco.some(p => p.nome === nome)) {
        return false;
    }
    elenco.push({ nome, ruolo });
    return true;
}

const oreTotali = elenco => elenco.reduce((totale, a) => totale + Number(a.durata), 0);

// Data nel formato AAAA-MM-GG, lo stesso usato da <input type="date">
function formatoData(anno, mese, giorno) {
    const due = n => String(n).padStart(2, "0");
    return `${anno}-${due(mese + 1)}-${due(giorno)}`;
}

const oggi = () => {
    const d = new Date();
    return formatoData(d.getFullYear(), d.getMonth(), d.getDate());
};

// Da "2026-10-28" a "28/10/2026"
const formattaScadenza = scadenza => scadenza.split("-").reverse().join("/");


function paginaProgetti() {
    const form = document.getElementById("form-progetto");
    const campoPartecipante = document.getElementById("nuovo-partecipante");
    const sceltaRuolo = document.getElementById("ruolo-partecipante");
    let partecipanti = [];

    riempiSelect(sceltaRuolo, professioni, "Ruolo (facoltativo)");

    function mostraPartecipanti() {
        mostraChips(document.getElementById("lista-partecipanti"), partecipanti, indice => {
            partecipanti.splice(indice, 1);
            mostraPartecipanti();
        });
    }

    function aggiungi() {
        if (aggiungiPartecipante(partecipanti, campoPartecipante.value, sceltaRuolo.value)) {
            mostraPartecipanti();
        }
        campoPartecipante.value = "";
        sceltaRuolo.value = "";
        campoPartecipante.focus();
    }

    document.getElementById("aggiungi-partecipante").addEventListener("click", aggiungi);

    campoPartecipante.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            aggiungi();
        }
    });

    function mostra() {
        document.getElementById("progetti").replaceChildren(...leggiProgetti().map(progetto => {
            const totale = progetto.attivita.length;
            const fatte = progetto.attivita.filter(a => a.stato === "done").length;
            const percentuale = totale ? Math.round(fatte / totale * 100) : 0;
            const persone = progetto.partecipanti.length;

            const link = crea("a", "progetto");
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
                `${totale} attività · ${persone} ${persone === 1 ? "partecipante" : "partecipanti"} · ${percentuale}% completato`;
            return link;
        }));
    }

    form.addEventListener("submit", e => {
        e.preventDefault();

        // Se è rimasto un nome scritto ma non aggiunto, lo includo
        if (campoPartecipante.value.trim()) {
            aggiungi();
        }

        const progetti = leggiProgetti();
        progetti.push({
            id: Date.now(),
            nome: form.nome.value,
            descrizione: form.descrizione.value,
            partecipanti,
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

function paginaBoard() {
    const id = new URLSearchParams(window.location.search).get("id");
    const progetti = leggiProgetti();
    const progetto = progetti.find(p => p.id == id);

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

    // L'attività che si sta modificando, oppure null se se ne crea una nuova
    let attivitaInModifica = null;
    // Primo giorno del mese mostrato nel calendario
    const mese = new Date();
    mese.setDate(1);

    riempiSelect(sceltaProfessionista, professioni, "Seleziona...");
    riempiSelect(formPartecipante.ruolo, professioni, "Ruolo (facoltativo)");

    const salva = () => salvaProgetti(progetti);
    const trova = idAttivita => progetto.attivita.find(a => a.id == idAttivita);

    //Intestazione: nome, modifica ed eliminazione del progetto

    function mostraIntestazione() {
        document.title = progetto.nome + " - Kanban Board";
        document.getElementById("nome-progetto").textContent = progetto.nome;
        document.getElementById("descrizione-progetto").textContent = progetto.descrizione;
    }

    document.getElementById("modifica-progetto").addEventListener("click", () => {
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

    document.getElementById("elimina-progetto").addEventListener("click", () => {
        if (confirm(`Eliminare il progetto "${progetto.nome}" e tutte le sue attività?`)) {
            salvaProgetti(progetti.filter(p => p !== progetto));
            window.location.href = "index.html";
        }
    });

    function mostraPartecipanti() {
        mostraChips(document.getElementById("partecipanti-progetto"), progetto.partecipanti, rimuoviPartecipante);

        const nomi = progetto.partecipanti.map(p => p.nome);
        riempiSelect(sceltaPersona, nomi,
            nomi.length ? "Seleziona..." : "Nessun partecipante: aggiungili in alto");

        // Ricostruisco il filtro mantenendo la persona scelta, se esiste ancora
        const filtroAttuale = filtroPersona.value;
        riempiSelect(filtroPersona, nomi, "Tutte le persone");
        filtroPersona.value = nomi.includes(filtroAttuale) ? filtroAttuale : "";
    }

    function rimuoviPartecipante(indice) {
        const nome = progetto.partecipanti[indice].nome;
        const assegnate = progetto.attivita.filter(a => a.persona === nome);

        let messaggio = `Rimuovere ${nome} dal progetto?`;
        if (assegnate.length) {
            messaggio += `\nLe sue ${assegnate.length} attività resteranno senza assegnatario.`;
        }
        if (!confirm(messaggio)) {
            return;
        }

        assegnate.forEach(a => {
            a.persona = "";
        });
        progetto.partecipanti.splice(indice, 1);
        salva();
        mostraPartecipanti();
        mostra();
    }

    formPartecipante.addEventListener("submit", e => {
        e.preventDefault();
        if (aggiungiPartecipante(progetto.partecipanti, formPartecipante.nome.value, formPartecipante.ruolo.value)) {
            salva();
            mostraPartecipanti();
            mostra();
        }
        formPartecipante.reset();
    });

    // Scegliendo una persona, propongo il suo ruolo come tipo di professionista
    sceltaPersona.addEventListener("change", () => {
        const partecipante = progetto.partecipanti.find(p => p.nome === sceltaPersona.value);
        if (partecipante && partecipante.ruolo) {
            sceltaProfessionista.value = partecipante.ruolo;
        }
    });

    function apriFinestra(attivita = null) {
        attivitaInModifica = attivita;
        form.reset();

        // Suggerisce le categorie già usate nel progetto
        const categorie = new Set(progetto.attivita.map(a => a.categoria));
        document.getElementById("elenco-categorie").replaceChildren(...[...categorie].map(c => new Option(c)));

        document.getElementById("titolo-finestra").textContent = attivita ? "Modifica attività" : "Nuova attività";
        document.getElementById("conferma").textContent = attivita ? "Salva" : "Aggiungi";

        if (attivita) {
            ["titolo", "descrizione", "categoria", "persona", "professionista", "durata"].forEach(campo => {
                form[campo].value = attivita[campo];
            });
            form.priorita.value = attivita.priorita || "media";
            form.scadenza.value = attivita.scadenza || "";
        }

        finestra.showModal();
    }

    document.getElementById("apri-finestra").addEventListener("click", () => apriFinestra());
    document.getElementById("annulla").addEventListener("click", () => finestra.close());

    form.addEventListener("submit", e => {
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
            progetto.attivita.push({ ...dati, id: Date.now(), stato: "todo" });
        }

        salva();
        finestra.close();
        mostra();
    });

    campoCerca.addEventListener("input", mostra);
    filtroPersona.addEventListener("change", mostra);

    document.querySelectorAll(".lista").forEach(lista => {
        lista.addEventListener("dragover", e => e.preventDefault());

        lista.addEventListener("drop", e => {
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
                progetto.attivita.splice(progetto.attivita.indexOf(trova(cardSotto.dataset.id)), 0, attivita);
            } else {
                progetto.attivita.push(attivita);
            }

            salva();
            mostra();
        });
    });

    function sposta(attivita, direzione) {
        attivita.stato = stati[stati.indexOf(attivita.stato) + direzione];
        salva();
        mostra();
    }

    function creaPulsante(testo, classe, azione) {
        const pulsante = crea("button", classe);
        pulsante.type = "button";
        pulsante.innerHTML = testo;
        pulsante.addEventListener("click", e => {
            e.stopPropagation();
            azione();
        });
        return pulsante;
    }

    function creaCard(attivita) {
        const priorita = attivita.priorita || "media";
        const scaduta = attivita.scadenza && attivita.scadenza < oggi() && attivita.stato !== "done";

        const card = crea("article", "card priorita-" + priorita);
        card.classList.toggle("scaduta", Boolean(scaduta));
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

        // L'id è il momento di creazione (Date.now()), quindi lo uso come data
        const dettagli = [
            ["Assegnata a: " + (attivita.persona || "nessuno")],
            ["Professionista: " + attivita.professionista],
            ["Durata: " + attivita.durata + " ore"]
        ];
        if (attivita.scadenza) {
            dettagli.push(["Scadenza: " + formattaScadenza(attivita.scadenza) + (scaduta ? " (scaduta)" : ""),
                scaduta ? "testo-scaduto" : ""]);
        }
        dettagli.push(["Creata il " + new Date(attivita.id).toLocaleDateString("it-IT")]);
        card.querySelector(".dettagli").replaceChildren(...dettagli.map(([testo, classe]) => crea("li", classe, testo)));

        const posizione = stati.indexOf(attivita.stato);
        const azioni = card.querySelector(".azioni");

        if (posizione > 0) {
            azioni.append(creaPulsante("&larr; Sinistra", "sposta-sinistra", () => sposta(attivita, -1)));
        }
        if (posizione < stati.length - 1) {
            azioni.append(creaPulsante("Destra &rarr;", "sposta-destra", () => sposta(attivita, 1)));
        }
        azioni.append(
            creaPulsante("Modifica", "secondario", () => apriFinestra(attivita)),
            creaPulsante("Elimina", "elimina", () => {
                if (confirm(`Eliminare l'attività "${attivita.titolo}"?`)) {
                    progetto.attivita = progetto.attivita.filter(a => a.id != attivita.id);
                    salva();
                    mostra();
                }
            })
        );

        card.addEventListener("click", () => card.classList.toggle("aperta"));
        card.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", attivita.id));

        return card;
    }

    function mostraRiepilogo() {
        // Tutti i partecipanti, più eventuali nomi presenti solo nelle attività
        // (compreso "" per le attività senza assegnatario)
        const persone = [...new Set([...progetto.partecipanti.map(p => p.nome), ...progetto.attivita.map(a => a.persona)])];

        document.querySelector("#riepilogo tbody").replaceChildren(...persone.map(nome => {
            const sue = progetto.attivita.filter(a => a.persona === nome);
            const completate = sue.filter(a => a.stato === "done");

            const riga = document.createElement("tr");
            [nome || "Non assegnate", sue.length, oreTotali(sue) + " h", oreTotali(completate) + " h"]
                .forEach(valore => riga.append(crea("td", "", valore)));
            return riga;
        }));

        document.getElementById("riepilogo").hidden = persone.length === 0;
    }

    function mostraCalendario(attivita) {
        const anno = mese.getFullYear();
        const numeroMese = mese.getMonth();
        const giorniDelMese = new Date(anno, numeroMese + 1, 0).getDate();
        const celle = [];

        document.getElementById("titolo-mese").textContent =
            mese.toLocaleDateString("it-IT", { month: "long", year: "numeric" });

        // Il calendario parte dal lunedì: lascio vuote le celle prima del primo giorno
        for (let i = 0; i < (mese.getDay() + 6) % 7; i++) {
            celle.push(crea("div", "giorno vuoto"));
        }

        for (let giorno = 1; giorno <= giorniDelMese; giorno++) {
            const data = formatoData(anno, numeroMese, giorno);
            const cella = crea("div", data === oggi() ? "giorno oggi" : "giorno");
            cella.append(crea("span", "numero", giorno));

            attivita.filter(a => a.scadenza === data).forEach(a => {
                const voce = crea("button", "voce priorita-" + (a.priorita || "media"), a.titolo);
                voce.type = "button";
                voce.title = a.titolo;
                voce.classList.toggle("fatta", a.stato === "done");
                voce.addEventListener("click", () => apriFinestra(a));
                cella.append(voce);
            });

            celle.push(cella);
        }

        document.getElementById("giorni").replaceChildren(...celle);
    }

    document.getElementById("mese-precedente").addEventListener("click", () => {
        mese.setMonth(mese.getMonth() - 1);
        mostra();
    });

    document.getElementById("mese-successivo").addEventListener("click", () => {
        mese.setMonth(mese.getMonth() + 1);
        mostra();
    });

    function mostra() {
        const testo = campoCerca.value.trim().toLowerCase();
        const persona = filtroPersona.value;

        const visibili = progetto.attivita.filter(a =>
            a.titolo.toLowerCase().includes(testo) && (!persona || a.persona === persona)
        );

        stati.forEach(stato => {
            const colonna = document.getElementById(stato);
            const attivita = visibili.filter(a => a.stato === stato);

            colonna.querySelector(".lista").replaceChildren(...attivita.map(creaCard));
            colonna.querySelector(".contatore").textContent = `${attivita.length} · ${oreTotali(attivita)} h`;
        });

        mostraRiepilogo();
        mostraCalendario(visibili);
    }

    mostraIntestazione();
    mostraPartecipanti();
    mostra();
}
    
/*DOMContentLoader è un evento che il browser lancia sul document 
  quando ha finito di leggere l’HTML e ha costruito il DOM, cioè l’albero di tutti gli elementi della pagina*/
document.addEventListener("DOMContentLoaded", () => {
    preparaTema();
    if (document.getElementById("form-progetto")) {
        paginaProgetti();
    }
    if (document.getElementById("board")) {
        paginaBoard();
    }
});
