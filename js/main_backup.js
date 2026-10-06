// ==========================================
// FIREBASE
// ==========================================

import { auth } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


// ==========================================
// CADASTRO
// ==========================================

const botaoCadastrar = document.getElementById("cadastrar");

if (botaoCadastrar) {

    botaoCadastrar.addEventListener("click", async () => {

        const nome = document
            .getElementById("nameCadastro")
            .value
            .trim();

        const email = document
            .getElementById("emailCadastro")
            .value
            .trim();

        const senha = document
            .getElementById("passwordCadastro")
            .value;

        const confirmarSenha = document
            .getElementById("passwordConfirmar")
            .value;


        if (nome === "") {
            alert("Digite seu nome de usuário.");
            return;
        }


        if (email === "") {
            alert("Digite seu email.");
            return;
        }


        if (senha === "") {
            alert("Digite uma senha.");
            return;
        }


        if (senha !== confirmarSenha) {
            alert("As senhas não são iguais.");
            return;
        }


        if (senha.length < 6) {
            alert("A senha precisa ter pelo menos 6 caracteres.");
            return;
        }


        try {

            const resultado =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    senha
                );


            const usuario = resultado.user;


            await updateProfile(usuario, {
                displayName: nome
            });


            console.log(
                "Usuário cadastrado:",
                usuario
            );


            alert("Cadastro realizado com sucesso!");


            // Vai para artistas.html
            window.location.href = "artistas.html";


        } catch (erro) {

            console.error(erro);


            if (erro.code === "auth/email-already-in-use") {

                alert("Este email já está cadastrado.");

            }

            else if (erro.code === "auth/invalid-email") {

                alert("Digite um email válido.");

            }

            else if (erro.code === "auth/weak-password") {

                alert("A senha precisa ter pelo menos 6 caracteres.");

            }

            else {

                alert(
                    "Erro ao cadastrar: " +
                    erro.message
                );

            }

        }

    });

}



// ==========================================
// LOGIN
// ==========================================

const botaoLogin = document.getElementById("login");

if (botaoLogin) {

    botaoLogin.addEventListener("click", async () => {

        const email = document
            .getElementById("emailLogin")
            .value
            .trim();

        const senha = document
            .getElementById("passwordLogin")
            .value;


        if (email === "") {

            alert("Digite seu email.");

            return;
        }


        if (senha === "") {

            alert("Digite sua senha.");

            return;
        }


        try {

            console.log("Tentando fazer login...");


            const resultado =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    senha
                );


            const usuario = resultado.user;


            console.log(
                "Login realizado!",
                usuario
            );


            alert("Login realizado com sucesso!");


            // =================================
            // VAI PARA ARTISTAS
            // =================================

            window.location.href = "artistas.html";


        } catch (erro) {

            console.error(
                "Erro no login:",
                erro
            );


            if (
                erro.code === "auth/invalid-credential" ||
                erro.code === "auth/wrong-password" ||
                erro.code === "auth/user-not-found"
            ) {

                alert(
                    "Email ou senha incorretos."
                );

            }

            else if (
                erro.code === "auth/invalid-email"
            ) {

                alert(
                    "Digite um email válido."
                );

            }

            else {

                alert(
                    "Erro ao fazer login: " +
                    erro.message
                );

            }

        }

    });

}



// ==========================================
// VERIFICAR USUÁRIO LOGADO
// ==========================================

onAuthStateChanged(auth, (usuario) => {

    if (usuario) {

        console.log(
            "Usuário conectado:"
        );

        console.log(
            "UID:",
            usuario.uid
        );

        console.log(
            "Nome:",
            usuario.displayName
        );

        console.log(
            "Email:",
            usuario.email
        );

    }

});

// ==========================================
// ARTISTAS
// ==========================================

const artistas = document.querySelectorAll(".artista");
const contador = document.getElementById("selecionados");
const continuar = document.getElementById("continue");

let artistasSelecionados = JSON.parse(
    localStorage.getItem("artistasSelecionados")
) || [];


// Verifica os artistas que já estavam salvos
artistas.forEach(artista => {

    const nome = artista.dataset.name;

    if (artistasSelecionados.includes(nome)) {
        artista.classList.add("selecionado");

        const botao = artista.querySelector(".bnt-adc");
        botao.textContent = "Selecionado";
    }
});


// Atualiza o contador
function atualizarContador() {

    contador.textContent =
        `${artistasSelecionados.length} Artista${artistasSelecionados.length !== 1 ? "s" : ""} selecionado${artistasSelecionados.length !== 1 ? "s" : ""}`;
}

atualizarContador();


// Selecionar / remover artista
artistas.forEach(artista => {

    const botao = artista.querySelector(".bnt-adc");

    botao.addEventListener("click", () => {

        const nome = artista.dataset.name;

        if (artistasSelecionados.includes(nome)) {

            // Remove
            artistasSelecionados =
                artistasSelecionados.filter(artista => artista !== nome);

            artista.classList.remove("selecionado");

            botao.textContent = "Adicionar";

        } else {

            // Adiciona
            artistasSelecionados.push(nome);

            artista.classList.add("selecionado");

            botao.textContent = "Selecionado";
        }

        // Guarda os artistas
        localStorage.setItem(
            "artistasSelecionados",
            JSON.stringify(artistasSelecionados)
        );

        atualizarContador();
    });
});


// Botão continuar
continuar.addEventListener("click", () => {

    if (artistasSelecionados.length < 3) {

        alert("Escolha pelo menos 3 artistas para continuar!");

        return;
    }

    // Garante que está salvo
    localStorage.setItem(
        "artistasSelecionados",
        JSON.stringify(artistasSelecionados)
    );

    // Vai para a próxima página
    window.location.href = "spotfy.html";
});


// ==========================================
// PESQUISA
// ==========================================

// ==========================================
// PESQUISA DE MÚSICAS
// ==========================================

const campoBusca = document.querySelector("header #busca");
const botaoBusca = document.querySelector("header #buscar");
const listaMusicas = document.getElementById("musicas");

let todasAsMusicas = [];
let resultadosPesquisa = [];


// ==========================================
// CARREGAR MÚSICAS DO JSON
// ==========================================

async function carregarMusicas() {
    try {

        const resposta = await fetch("./Dados/playlists.json");

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar as músicas.");
        }

        todasAsMusicas = await resposta.json();

        console.log("Músicas carregadas:", todasAsMusicas);

        mostrarMusicas(todasAsMusicas);

    } catch (erro) {

        console.error("Erro ao carregar músicas:", erro);

    }
}


// ==========================================
// REMOVER ACENTOS E DEIXAR MINÚSCULO
// ==========================================

function normalizarTexto(texto) {

    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

}


// ==========================================
// PESQUISAR
// ==========================================

function pesquisarMusicas(texto) {

    const busca = normalizarTexto(texto.trim());

    if (!busca) {

        resultadosPesquisa = todasAsMusicas;

        mostrarSugestoes([]);

        mostrarMusicas(todasAsMusicas);

        return;

    }


    resultadosPesquisa = todasAsMusicas.filter(musica => {

        const nome = normalizarTexto(musica.nome || "");
        const artista = normalizarTexto(musica.artista || "");
        const album = normalizarTexto(musica.album || "");

        return (
            nome.includes(busca) ||
            artista.includes(busca) ||
            album.includes(busca)
        );

    });


    mostrarSugestoes(resultadosPesquisa.slice(0, 8));

    mostrarMusicas(resultadosPesquisa);

}


// ==========================================
// MOSTRAR MÚSICAS
// ==========================================

function mostrarMusicas(musicas) {

    if (!listaMusicas) return;

    listaMusicas.innerHTML = "";


    if (musicas.length === 0) {

        listaMusicas.innerHTML = `
            <p style="
                color:#aaa;
                padding:20px;
            ">
                Nenhuma música encontrada.
            </p>
        `;

        return;
    }


    musicas.forEach((musica, index) => {

        const card = document.createElement("div");

        card.className = "card-musica";


        card.innerHTML = `

            <img
                src="${musica.capa || ""}"
                alt="Capa da música"
                class="capa-musica"
            >

            <div class="info-musica">

                <h4>${musica.nome || "Sem nome"}</h4>

                <p>${musica.artista || "Artista desconhecido"}</p>

            </div>

        `;


        card.addEventListener("click", () => {

            selecionarMusica(musica);

        });


        listaMusicas.appendChild(card);

    });

}


// ==========================================
// SUGESTÕES DA PESQUISA
// ==========================================

function mostrarSugestoes(musicas) {

    let caixa = document.getElementById("resultadosPesquisa");


    if (!caixa) {

        caixa = document.createElement("div");

        caixa.id = "resultadosPesquisa";

        document.querySelector("header .pesquisar").appendChild(caixa);

    }


    caixa.innerHTML = "";


    if (musicas.length === 0) {

        caixa.style.display = "none";

        return;

    }


    caixa.style.display = "block";


    musicas.forEach(musica => {

        const item = document.createElement("div");

        item.className = "sugestao-musica";


        item.innerHTML = `

            <img
                src="${musica.capa || ""}"
                alt=""
            >

            <div>

                <strong>${musica.nome || "Sem nome"}</strong>

                <span>${musica.artista || "Artista desconhecido"}</span>

            </div>

        `;


        item.addEventListener("click", () => {

            campoBusca.value = musica.nome;

            selecionarMusica(musica);

            caixa.style.display = "none";

        });


        caixa.appendChild(item);

    });

}


// ==========================================
// SELECIONAR MÚSICA
// ==========================================

function selecionarMusica(musica) {

    console.log("Música selecionada:", musica);


    const capa = document.getElementById("capaMusica");
    const nome = document.getElementById("nomeMusica");
    const artista = document.getElementById("artista");
    const playlist = document.getElementById("playlists");


    if (capa) {
        capa.src = musica.capa || "";
    }


    if (nome) {
        nome.textContent = musica.nome || "";
    }


    if (artista) {
        artista.textContent = musica.artista || "";
    }


    if (playlist) {
        playlist.textContent = musica.album || "";
    }


    console.log("Player atualizado.");

}


// ==========================================
// DIGITAR NA PESQUISA
// ==========================================

if (campoBusca) {

    campoBusca.addEventListener("input", () => {

        pesquisarMusicas(campoBusca.value);

    });


    campoBusca.addEventListener("focus", () => {

        if (campoBusca.value.trim() !== "") {

            pesquisarMusicas(campoBusca.value);

        }

    });

}


// ==========================================
// BOTÃO PESQUISAR
// ==========================================

if (botaoBusca) {

    botaoBusca.addEventListener("click", () => {

        pesquisarMusicas(campoBusca.value);

    });

}


// ==========================================
// ESCONDER SUGESTÕES AO CLICAR FORA
// ==========================================

document.addEventListener("click", (evento) => {

    const pesquisa = document.querySelector("header .pesquisar");
    const caixa = document.getElementById("resultadosPesquisa");

    if (!pesquisa || !caixa) return;


    if (!pesquisa.contains(evento.target)) {

        caixa.style.display = "none";

    }

});


// ==========================================
// INICIAR
// ==========================================

carregarMusicas();