const stati = ["todo", "doing", "done"];

function leggiProgetti() {
    return JSON.parse(localStorage.getItem("progetti")) || [];
}

function salvaProgetti(progetti) {
    localStorage.setItem("progetti", JSON.stringify(progetti));
}

function paginaProgetti() {
    const form = document.getElementById("form-progetto");
    const contenitore = document.getElementById("progetti");

    function mostra() {
        contenitore.innerHTML = "";
        leggiProgetti().forEach(function (progetto) {
            const link = document.createElement("a");
            link.className = "progetto";
            link.href = "board.html?id=" + progetto.id;
            link.innerHTML = "<h3></h3><p></p><p></p>";
            link.children[0].textContent = progetto.nome;
            link.children[1].textContent = progetto.descrizione;
            link.children[2].textContent = progetto.attivita.length + " attività";
            contenitore.appendChild(link);
        });
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const progetti = leggiProgetti();
        progetti.push({
            id: Date.now(),
            nome: form.nome.value,
            descrizione: form.descrizione.value,
            attivita: []
        });
        salvaProgetti(progetti);
        form.reset();
        mostra();
    });

    mostra();
}

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

    document.getElementById("nome-progetto").textContent = progetto.nome;

    const finestra = document.getElementById("finestra-attivita");
    const form = document.getElementById("form-nuova");

    document.getElementById("apri-finestra").addEventListener("click", function () {
        form.reset();
        finestra.showModal();
    });

    document.getElementById("annulla").addEventListener("click", function () {
        finestra.close();
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        progetto.attivita.push({
            id: Date.now(),
            titolo: form.titolo.value,
            descrizione: form.descrizione.value,
            categoria: form.categoria.value,
            professionista: form.professionista.value,
            persona: form.persona.value,
            durata: form.durata.value,
            stato: "todo"
        });
        salva();
        finestra.close();
        mostra();
    });

    document.querySelectorAll(".lista").forEach(function (lista) {
        lista.addEventListener("dragover", function (e) {
            e.preventDefault();
        });
        lista.addEventListener("drop", function (e) {
            e.preventDefault();
            const attivita = trova(e.dataTransfer.getData("text/plain"));
            if (attivita) {
                attivita.stato = lista.parentElement.id;
                salva();
                mostra();
            }
        });
    });

    function salva() {
        salvaProgetti(progetti);
    }

    function trova(idAttivita) {
        return progetto.attivita.find(function (a) {
            return a.id == idAttivita;
        });
    }

    function sposta(attivita, direzione) {
        const posizione = stati.indexOf(attivita.stato) + direzione;
        if (posizione >= 0 && posizione < stati.length) {
            attivita.stato = stati[posizione];
            salva();
            mostra();
        }
    }

    function creaCard(attivita) {
        const card = document.createElement("article");
        card.className = "card";
        card.draggable = true;

        card.innerHTML =
            "<h3></h3>" +
            "<p class='categoria'></p>" +
            "<p class='descrizione'></p>" +
            "<ul class='dettagli'><li></li><li></li><li></li></ul>" +
            "<div class='azioni'></div>";

        card.querySelector("h3").textContent = attivita.titolo;
        card.querySelector(".categoria").textContent = attivita.categoria;
        card.querySelector(".descrizione").textContent = attivita.descrizione;

        const voci = card.querySelectorAll("li");
        voci[0].textContent = "Professionista: " + attivita.professionista;
        voci[1].textContent = "Persona: " + attivita.persona;
        voci[2].textContent = "Durata: " + attivita.durata + " ore";

        const azioni = card.querySelector(".azioni");
        const posizione = stati.indexOf(attivita.stato);

        if (posizione > 0) {
            const sinistra = document.createElement("button");
            sinistra.className = "sposta-sinistra";
            sinistra.innerHTML = "&larr; Sposta a sinistra";
            sinistra.addEventListener("click", function (e) {
                e.stopPropagation();
                sposta(attivita, -1);
            });
            azioni.appendChild(sinistra);
        }

        if (posizione < stati.length - 1) {
            const destra = document.createElement("button");
            destra.className = "sposta-destra";
            destra.innerHTML = "Sposta a destra &rarr;";
            destra.addEventListener("click", function (e) {
                e.stopPropagation();
                sposta(attivita, 1);
            });
            azioni.appendChild(destra);
        }

        const elimina = document.createElement("button");
        elimina.className = "elimina";
        elimina.textContent = "Elimina";
        elimina.addEventListener("click", function (e) {
            e.stopPropagation();
            progetto.attivita = progetto.attivita.filter(function (a) {
                return a.id != attivita.id;
            });
            salva();
            mostra();
        });
        azioni.appendChild(elimina);

        card.addEventListener("click", function () {
            card.classList.toggle("aperta");
        });

        card.addEventListener("dragstart", function (e) {
            e.dataTransfer.setData("text/plain", attivita.id);
        });

        return card;
    }

    function mostra() {
        stati.forEach(function (stato) {
            const colonna = document.getElementById(stato);
            const lista = colonna.querySelector(".lista");
            const attivita = progetto.attivita.filter(function (a) {
                return a.stato === stato;
            });
            lista.innerHTML = "";
            attivita.forEach(function (a) {
                lista.appendChild(creaCard(a));
            });
            colonna.querySelector(".contatore").textContent = attivita.length;
        });
    }

    mostra();
}

document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("form-progetto")) {
        paginaProgetti();
    }
    if (document.getElementById("board")) {
        paginaBoard();
    }
});
