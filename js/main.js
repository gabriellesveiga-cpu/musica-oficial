
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


            window.location.href = "spotfy.html";


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


// ==========================================
// VERIFICA SE ESTÁ NA PÁGINA DE ARTISTAS
// ==========================================

if (artistas.length > 0) {


    // ------------------------------------------
    // ARTISTAS JÁ SALVOS
    // ------------------------------------------

    artistas.forEach(artista => {

        const nome = artista.dataset.name;


        if (artistasSelecionados.includes(nome)) {

            artista.classList.add("selecionado");


            const botao =
                artista.querySelector(".bnt-adc");


            if (botao) {
                botao.textContent = "Selecionado";
            }

        }

    });


    // ------------------------------------------
    // CONTADOR
    // ------------------------------------------

    function atualizarContador() {

        if (!contador) return;


        contador.textContent =
            `${artistasSelecionados.length} Artista${artistasSelecionados.length !== 1 ? "s" : ""} selecionado${artistasSelecionados.length !== 1 ? "s" : ""}`;

    }


    atualizarContador();


    // ------------------------------------------
    // SELECIONAR / REMOVER ARTISTA
    // ------------------------------------------

    artistas.forEach(artista => {

        const botao =
            artista.querySelector(".bnt-adc");


        if (!botao) return;


        botao.addEventListener("click", () => {

            const nome = artista.dataset.name;


            if (artistasSelecionados.includes(nome)) {

                // REMOVE

                artistasSelecionados =
                    artistasSelecionados.filter(
                        artista =>
                            artista !== nome
                    );


                artista.classList.remove(
                    "selecionado"
                );


                botao.textContent =
                    "Adicionar";


            } else {

                // ADICIONA

                artistasSelecionados.push(nome);


                artista.classList.add(
                    "selecionado"
                );


                botao.textContent =
                    "Selecionado";

            }


            // Guarda

            localStorage.setItem(
                "artistasSelecionados",
                JSON.stringify(
                    artistasSelecionados
                )
            );


            atualizarContador();

        });

    });


    // ------------------------------------------
    // BOTÃO CONTINUAR
    // ------------------------------------------

    if (continuar) {

        continuar.addEventListener(
            "click",
            () => {

                if (
                    artistasSelecionados.length < 3
                ) {

                    alert(
                        "Escolha pelo menos 3 artistas para continuar!"
                    );

                    return;

                }


                localStorage.setItem(
                    "artistasSelecionados",
                    JSON.stringify(
                        artistasSelecionados
                    )
                );


                window.location.href =
                    "spotfy.html";

            }
        );

    }

}


// ==========================================
// PESQUISA DE MÚSICAS
// ==========================================

// Essa parte só funciona se existir
// a página principal do Spotfy.

const campoBusca =
    document.querySelector(
        "header #busca"
    );

const botaoBusca =
    document.querySelector(
        "header #buscar"
    );

const listaMusicas =
    document.getElementById("musicas");


let todasAsMusicas = [];

let resultadosPesquisa = [];


// ==========================================
// CARREGAR MÚSICAS DO JSON
// ==========================================

async function carregarMusicas() {

    // Se não estiver na página principal,
    // não faz nada.

    if (!listaMusicas) return;


    try {

        const resposta =
            await fetch(
                "./Dados/playlists.json"
            );


        if (!resposta.ok) {

            throw new Error(
                "Não foi possível carregar as músicas."
            );

        }


        todasAsMusicas =
            await resposta.json();


        console.log(
            "Músicas carregadas:",
            todasAsMusicas
        );


        mostrarMusicas(
            todasAsMusicas
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar músicas:",
            erro
        );

    }

}


// ==========================================
// NORMALIZAR TEXTO
// ==========================================

function normalizarTexto(texto) {

    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        );

}


// ==========================================
// PESQUISAR MÚSICAS
// ==========================================

function pesquisarMusicas(texto) {

    const busca =
        normalizarTexto(
            texto.trim()
        );


    // Se estiver vazio,
    // mostra todas novamente.

    if (!busca) {

        resultadosPesquisa =
            todasAsMusicas;


        mostrarSugestoes([]);


        mostrarMusicas(
            todasAsMusicas
        );


        return;

    }


    // Procura em:
    // nome
    // artista
    // álbum

    resultadosPesquisa =
        todasAsMusicas.filter(musica => {

            const nome =
                normalizarTexto(
                    musica.nome || ""
                );


            const artista =
                normalizarTexto(
                    musica.artista || ""
                );


            const album =
                normalizarTexto(
                    musica.album || ""
                );


            return (
                nome.includes(busca) ||
                artista.includes(busca) ||
                album.includes(busca)
            );

        });


    // Mostra até 8 sugestões

    mostrarSugestoes(
        resultadosPesquisa.slice(0, 8)
    );


    // Mostra os resultados

    mostrarMusicas(
        resultadosPesquisa
    );

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


    musicas.forEach(musica => {

        const card =
            document.createElement("div");


        card.className =
            "card-musica";


        card.innerHTML = `

            <img
                src="${musica.capa || ""}"
                alt="Capa da música"
                class="capa-musica"
            >

            <div class="info-musica">

                <h4>
                    ${musica.nome || "Sem nome"}
                </h4>

                <p>
                    ${musica.artista || "Artista desconhecido"}
                </p>

            </div>

        `;


        // Quando clicar na música

        card.addEventListener(
            "click",
            () => {

                selecionarMusica(
                    musica
                );

            }
        );


        listaMusicas.appendChild(
            card
        );

    });

}


// ==========================================
// SUGESTÕES DA PESQUISA
// ==========================================

function mostrarSugestoes(musicas) {

    if (!campoBusca) return;


    let caixa =
        document.getElementById(
            "resultadosPesquisa"
        );


    // Cria a caixa se ainda não existir

    if (!caixa) {

        caixa =
            document.createElement("div");


        caixa.id =
            "resultadosPesquisa";


        const pesquisa =
            document.querySelector(
                "header .pesquisar"
            );


        if (pesquisa) {

            pesquisa.appendChild(
                caixa
            );

        }

    }


    if (!caixa) return;


    caixa.innerHTML = "";


    if (musicas.length === 0) {

        caixa.style.display =
            "none";

        return;

    }


    caixa.style.display =
        "block";


    musicas.forEach(musica => {

        const item =
            document.createElement("div");


        item.className =
            "sugestao-musica";


        item.innerHTML = `

            <img
                src="${musica.capa || ""}"
                alt=""
            >

            <div>

                <strong>
                    ${musica.nome || "Sem nome"}
                </strong>

                <span>
                    ${musica.artista || "Artista desconhecido"}
                </span>

            </div>

        `;


        item.addEventListener(
            "click",
            () => {

                campoBusca.value =
                    musica.nome;


                selecionarMusica(
                    musica
                );


                caixa.style.display =
                    "none";

            }
        );


        caixa.appendChild(
            item
        );

    });

}


// ==========================================
// SELECIONAR MÚSICA
// ==========================================

function selecionarMusica(musica) {

    console.log("Música selecionada:", musica);


    const capa =
        document.getElementById("capaMusica");

    const nome =
        document.getElementById("nomeMusica");

    const artista =
        document.getElementById("artista");

    const playlist =
        document.getElementById("playlists");

    const audio =
        document.getElementById("audio");


    // ==========================================
    // ATUALIZA AS INFORMAÇÕES DO PLAYER
    // ==========================================

    if (capa) {

        capa.src =
            musica.capa || "";

    }


    if (nome) {

        nome.textContent =
            musica.nome || "";

    }


    if (artista) {

        artista.textContent =
            musica.artista || "";

    }


    if (playlist) {

        playlist.textContent =
            musica.album || "";

    }


    // ==========================================
    // TOCAR A MÚSICA
    // ==========================================

    if (audio && musica.arquivo) {

        audio.src =
            musica.arquivo;

        audio.load();


        audio.play()
            .then(() => {

                console.log(
                    "Música começou a tocar!"
                );

            })
            .catch(erro => {

                console.error(
                    "Não foi possível iniciar o áudio:",
                    erro
                );

            });

    }
    else {

        console.log(
            "Essa música ainda não possui arquivo de áudio."
        );

        alert(
            "Essa música ainda não possui um arquivo de áudio."
        );

    }

}

// ==========================================
// DIGITAR NA PESQUISA
// ==========================================

if (campoBusca) {

    campoBusca.addEventListener(
        "input",
        () => {

            pesquisarMusicas(
                campoBusca.value
            );

        }
    );


    campoBusca.addEventListener(
        "focus",
        () => {

            if (
                campoBusca.value.trim() !== ""
            ) {

                pesquisarMusicas(
                    campoBusca.value
                );

            }

        }
    );

}


// ==========================================
// BOTÃO PESQUISAR
// ==========================================

if (botaoBusca) {

    botaoBusca.addEventListener(
        "click",
        () => {

            if (!campoBusca) return;


            pesquisarMusicas(
                campoBusca.value
            );

        }
    );

}


// ==========================================
// ESCONDER SUGESTÕES
// ==========================================

document.addEventListener(
    "click",
    (evento) => {

        const pesquisa =
            document.querySelector(
                "header .pesquisar"
            );


        const caixa =
            document.getElementById(
                "resultadosPesquisa"
            );


        if (
            !pesquisa ||
            !caixa
        ) return;


        if (
            !pesquisa.contains(
                evento.target
            )
        ) {

            caixa.style.display =
                "none";

        }

    }
);


// ==========================================
// INICIAR PESQUISA
// ==========================================

carregarMusicas();


// Login
const botaoEntrar = document.getElementById("entrar");

botaoEntrar.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const senha = document.getElementById("password").value;

    if (email === "" || senha === "") {
        alert("Preencha o email e a senha!");
        return;
    }

    try {
        const usuario = await signInWithEmailAndPassword(
            auth,
            email,
            senha
        );

        console.log("Usuário entrou:", usuario.user);
        alert("Login realizado!");
        window.location.href = "./inicio.html";

    } catch (erro) {
        console.log(erro);

        if (erro.code === "auth/invalid-credential") {
            alert("Email ou senha incorretos.");
        } else {
            alert("Erro ao fazer login.");
        }
    }
});

// Cadastro

botaoCadastrar = document.getElementById("cadastrar");

botaoCadastrar.addEventListener("click", async () => {
    const nome = document.getElementById("nameCadastro").value;
    const email = document.getElementById("emailCadastro").value;
    const senha = document.getElementById("passwordCadastro").value;

    if (nome === "" || email === "" || senha === "") {
        alert("Preencha todos os campos!");
        return;
    }

    try {
        const usuario =
            await createUserWithEmailAndPassword(
                auth,
                email,
                senha
            );

        console.log(
            "Usuário criado:",
            usuario.user
        );

        alert("Conta criada com sucesso!");
        window.location.href = "./Artistas.html";

    } catch (erro) {
        console.log(erro);

        if (erro.code === "auth/email-already-in-use") {
            alert("Esse email já está cadastrado!");
        } 
        else if (erro.code === "auth/invalid-email") {
            alert("Digite um email válido!");
        }
        else if (erro.code === "auth/weak-password") {
            alert("A senha é muito fraca!");
        }
        else {
            alert("Erro ao criar a conta!");
        }
    }
});

