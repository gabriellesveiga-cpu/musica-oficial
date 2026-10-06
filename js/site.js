// ==========================================================
// FIREBASE
// ==========================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


// ==========================================================
// CONFIGURAÇÃO DO FIREBASE
// ==========================================================

const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_AUTH_DOMAIN",
    projectId: "SEU_PROJECT_ID",
    storageBucket: "SEU_STORAGE_BUCKET",
    messagingSenderId: "SEU_MESSAGING_SENDER_ID",
    appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


// ==========================================================
// ELEMENTOS
// ==========================================================

const campoBusca = document.getElementById("busca");
const botaoBusca = document.getElementById("buscar");
const resultadosPesquisa = document.getElementById("resultadosPesquisa");
const listaMusicas = document.getElementById("musicas");
const listaRecomendacoes = document.getElementById("listaRecomendacoes");


// ==========================================================
// VARIÁVEIS
// ==========================================================

let todasAsMusicas = [];
let resultadosAtuais = [];
let filaAtual = [];
let indiceAtual = -1;

let estaEmPlaylist = false;
let playlistAtual = null;

let modoAleatorio = false;
let modoRepetir = false;


// ==========================================================
// NORMALIZAR TEXTO
// ==========================================================

function normalizarTexto(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}


// ==========================================================
// CARREGAR MÚSICAS
// ==========================================================

async function carregarMusicas() {
    try {
        const resposta = await fetch("../Dados/playlists.json");

        if (!resposta.ok) {
            throw new Error(
                "Não foi possível carregar playlists.json"
            );
        }

        const dados = await resposta.json();

        if (Array.isArray(dados)) {
            todasAsMusicas = dados;
        } else if (Array.isArray(dados.musicas)) {
            todasAsMusicas = dados.musicas;
        } else {
            todasAsMusicas = [];
        }

        console.log(
            "Músicas carregadas:",
            todasAsMusicas.length
        );

        mostrarMusicas(todasAsMusicas);
        mostrarFeitoParaVoce();
        mostrarHistorico();

    } catch (erro) {
        console.error(
            "Erro ao carregar músicas:",
            erro
        );
    }
}


// ==========================================================
// MOSTRAR MÚSICAS PRINCIPAIS
// ==========================================================

function mostrarMusicas(lista) {

    if (!listaMusicas) {
        return;
    }

    listaMusicas.innerHTML = "";

    if (!Array.isArray(lista) || lista.length === 0) {
        listaMusicas.innerHTML = `
            <p class="sem-musicas">
                Nenhuma música encontrada.
            </p>
        `;
        return;
    }

    lista.forEach((musica) => {

        const card = document.createElement("div");

        card.className = "card-musica";

        const capa =
            musica.capa ||
            musica.cover ||
            "../logo.png";

        const nome =
            musica.nome ||
            musica.name ||
            "Música sem nome";

        const artista =
            musica.artista ||
            musica.artist ||
            "Artista desconhecido";

        card.innerHTML = `
            <img
                class="capa-musica"
                src="${capa}"
                alt="${nome}"
            >

            <div class="info-musica">
                <strong>${nome}</strong>
                <span>${artista}</span>
            </div>
        `;

        card.addEventListener("click", () => {
            selecionarMusica(musica);
        });

        listaMusicas.appendChild(card);
    });
}


// ==========================================================
// PESQUISA DE MÚSICAS
// ==========================================================

function pesquisarMusicas() {

    if (!campoBusca) {
        return;
    }

    const texto = normalizarTexto(
        campoBusca.value
    );

    if (!texto) {

        resultadosAtuais = [];

        esconderResultadosPesquisa();

        mostrarMusicas(todasAsMusicas);

        return;
    }

    const palavras = texto
        .split(/\s+/)
        .filter(Boolean);

    resultadosAtuais = todasAsMusicas.filter((musica) => {

        const nome = normalizarTexto(
            musica.nome ||
            musica.name ||
            ""
        );

        const artista = normalizarTexto(
            musica.artista ||
            musica.artist ||
            ""
        );

        const album = normalizarTexto(
            musica.album ||
            ""
        );

        const textoCompleto =
            `${nome} ${artista} ${album}`;

        return palavras.every((palavra) =>
            textoCompleto.includes(palavra)
        );
    });

    mostrarResultadosPesquisa(resultadosAtuais);
}


// ==========================================================
// MOSTRAR RESULTADOS DA PESQUISA
// ==========================================================

function mostrarResultadosPesquisa(lista) {

    if (!resultadosPesquisa) {
        return;
    }

    resultadosPesquisa.innerHTML = "";

    if (!Array.isArray(lista) || lista.length === 0) {

        resultadosPesquisa.innerHTML = `
            <div class="resultado-vazio">
                Nenhuma música encontrada.
            </div>
        `;

        resultadosPesquisa.classList.add("ativo");

        return;
    }

    lista.forEach((musica) => {

        const item = document.createElement("div");

        item.className = "resultado-pesquisa";

        const capa =
            musica.capa ||
            musica.cover ||
            "../logo.png";

        const nome =
            musica.nome ||
            musica.name ||
            "Música";

        const artista =
            musica.artista ||
            musica.artist ||
            "Artista";

        item.innerHTML = `
            <img
                src="${capa}"
                alt="${nome}"
            >

            <div class="resultado-info">
                <strong>${nome}</strong>
                <span>${artista}</span>
            </div>
        `;

        item.addEventListener("click", () => {

            selecionarMusica(musica);

            esconderResultadosPesquisa();

            if (campoBusca) {
                campoBusca.value = "";
            }

        });

        resultadosPesquisa.appendChild(item);
    });

    resultadosPesquisa.classList.add("ativo");
}


// ==========================================================
// ESCONDER RESULTADOS DA PESQUISA
// ==========================================================

function esconderResultadosPesquisa() {

    if (!resultadosPesquisa) {
        return;
    }

    resultadosPesquisa.innerHTML = "";

    resultadosPesquisa.classList.remove("ativo");
}


// ==========================================================
// EVENTOS DA PESQUISA
// ==========================================================

if (campoBusca) {

    campoBusca.addEventListener(
        "input",
        () => {
            pesquisarMusicas();
        }
    );

    campoBusca.addEventListener(
        "keydown",
        (evento) => {

            if (evento.key === "Enter") {

                evento.preventDefault();

                pesquisarMusicas();
            }

            if (evento.key === "Escape") {

                campoBusca.value = "";

                esconderResultadosPesquisa();

                mostrarMusicas(todasAsMusicas);
            }
        }
    );
}


if (botaoBusca) {

    botaoBusca.addEventListener(
        "click",
        () => {
            pesquisarMusicas();
        }
    );
}


// ==========================================================
// CLICAR FORA DA PESQUISA
// ==========================================================

document.addEventListener(
    "click",
    (evento) => {

        const areaPesquisa =
            document.getElementById("pesquisar");

        if (
            areaPesquisa &&
            !areaPesquisa.contains(evento.target)
        ) {
            esconderResultadosPesquisa();
        }
    }
);


// ==========================================================
// PLAYER
// ==========================================================

const audio =
    document.getElementById("audio");

const botaoPlay =
    document.getElementById("play");

const botaoAnterior =
    document.getElementById("anterior");

const botaoProxima =
    document.getElementById("proxima");

const botaoAleatorio =
    document.getElementById("aletorio");

const botaoRepetir =
    document.getElementById("repetir");

const barraProgresso =
    document.getElementById("barraProgresso");

const tempoAtual =
    document.getElementById("tempoAtual");

const duracao =
    document.getElementById("duracao");

const capaMusica =
    document.getElementById("capaMusica");

const nomeMusica =
    document.getElementById("nomeMusica");

const artistaMusica =
    document.getElementById("artista");


// ==========================================================
// PREPARAR FILA
// ==========================================================

function prepararFilaNormal() {

    filaAtual = [...todasAsMusicas];

    indiceAtual = -1;
}


// ==========================================================
// COMPARAR MÚSICAS
// ==========================================================

function mesmaMusica(a, b) {

    if (!a || !b) {
        return false;
    }

    if (a.spotifyId && b.spotifyId) {
        return a.spotifyId === b.spotifyId;
    }

    if (a.id && b.id) {
        return a.id === b.id;
    }

    return (
        normalizarTexto(
            a.nome || a.name
        ) ===
        normalizarTexto(
            b.nome || b.name
        )
        &&
        normalizarTexto(
            a.artista || a.artist
        ) ===
        normalizarTexto(
            b.artista || b.artist
        )
    );
}


// ==========================================================
// SELECIONAR MÚSICA
// ==========================================================

function selecionarMusica(
    musica,
    fila = null,
    playlist = false
) {

    if (!musica) {
        return;
    }

    if (Array.isArray(fila)) {

        filaAtual = [...fila];

    } else if (
        !playlist &&
        !mesmaMusica(
            filaAtual[indiceAtual],
            musica
        )
    ) {

        prepararFilaNormal();
    }

    estaEmPlaylist = playlist;

    if (playlist) {
        playlistAtual = fila;
    }

    const indice =
        filaAtual.findIndex(
            (item) =>
                mesmaMusica(item, musica)
        );

    if (indice >= 0) {

        indiceAtual = indice;

    } else {

        filaAtual.push(musica);

        indiceAtual =
            filaAtual.length - 1;
    }

    tocarMusicaAtual(true);
}


// ==========================================================
// TOCAR MÚSICA ATUAL
// ==========================================================

function tocarMusicaAtual(iniciar = true) {

    if (
        !audio ||
        !filaAtual.length ||
        indiceAtual < 0 ||
        !filaAtual[indiceAtual]
    ) {
        return;
    }

    const musica =
        filaAtual[indiceAtual];

    const nome =
        musica.nome ||
        musica.name ||
        "Música";

    const artista =
        musica.artista ||
        musica.artist ||
        "Artista";

    const capa =
        musica.capa ||
        musica.cover ||
        "../logo.png";

    const caminho =
        musica.caminho ||
        musica.arquivo ||
        musica.src ||
        musica.audio ||
        "";

    if (nomeMusica) {
        nomeMusica.textContent = nome;
    }

    if (artistaMusica) {
        artistaMusica.textContent = artista;
    }

    if (capaMusica) {
        capaMusica.src = capa;
    }

    if (!caminho) {

        console.warn(
            "A música não possui caminho de áudio:",
            musica
        );

        return;
    }

    let caminhoAudio = caminho;

    if (
        !caminhoAudio.startsWith("../") &&
        !caminhoAudio.startsWith("http://") &&
        !caminhoAudio.startsWith("https://")
    ) {
        caminhoAudio = "../" + caminhoAudio;
    }

    audio.src = caminhoAudio;

    audio.load();

    if (iniciar) {

        audio.play()
            .then(() => {

                atualizarBotaoPlay();

                registrarReproducao(musica);

            })
            .catch((erro) => {

                console.error(
                    "Erro ao reproduzir:",
                    erro
                );

                atualizarBotaoPlay();
            });

    } else {

        atualizarBotaoPlay();
    }
}


// ==========================================================
// HISTÓRICO
// ==========================================================

function obterHistorico() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "historicoMusicas"
            )
        ) || [];

    } catch {

        return [];
    }
}


function registrarReproducao(musica) {

    if (!musica) {
        return;
    }

    let historico =
        obterHistorico();

    const id =
        musica.spotifyId ||
        musica.id ||
        `${musica.nome || musica.name}-${musica.artista || musica.artist}`;

    const existente =
        historico.find(
            (item) => item.id === id
        );

    if (existente) {

        existente.quantidade =
            (existente.quantidade || 0) + 1;

    } else {

        historico.push({

            id: id,

            nome:
                musica.nome ||
                musica.name ||
                "Música",

            artista:
                musica.artista ||
                musica.artist ||
                "Artista",

            capa:
                musica.capa ||
                musica.cover ||
                "../logo.png",

            quantidade: 1
        });
    }

    localStorage.setItem(
        "historicoMusicas",
        JSON.stringify(historico)
    );

    mostrarHistorico();
}


// ==========================================================
// MOSTRAR HISTÓRICO
// ==========================================================

function mostrarHistorico() {

    const container =
        document.getElementById(
            "historicoMusicas"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const historico =
        obterHistorico()
            .sort(
                (a, b) =>
                    (b.quantidade || 0) -
                    (a.quantidade || 0)
            )
            .slice(0, 8);

    historico.forEach(
        (itemHistorico) => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "item-historico";

            item.innerHTML = `
                <img
                    src="${itemHistorico.capa || "../logo.png"}"
                    alt="${itemHistorico.nome}"
                >
            `;

            item.title =
                `${itemHistorico.nome} - ${itemHistorico.artista}`;

            item.addEventListener(
                "click",
                () => {

                    const musica =
                        todasAsMusicas.find(
                            (musica) =>
                                mesmaMusica(
                                    musica,
                                    itemHistorico
                                )
                        );

                    if (musica) {
                        selecionarMusica(musica);
                    }
                }
            );

            container.appendChild(item);
        }
    );
}


// ==========================================================
// PRÓXIMA MÚSICA
// ==========================================================

function proximaMusica() {

    if (!filaAtual.length) {
        return;
    }

    if (modoAleatorio) {

        escolherMusicaAleatoria();

        return;
    }

    if (
        indiceAtual <
        filaAtual.length - 1
    ) {

        indiceAtual++;

    } else {

        indiceAtual = 0;
    }

    tocarMusicaAtual(true);
}


// ==========================================================
// ALEATÓRIO
// ==========================================================

function escolherMusicaAleatoria() {

    if (!filaAtual.length) {
        return;
    }

    if (filaAtual.length === 1) {

        indiceAtual = 0;

    } else {

        let novoIndice;

        do {

            novoIndice =
                Math.floor(
                    Math.random() *
                    filaAtual.length
                );

        } while (
            novoIndice === indiceAtual
        );

        indiceAtual = novoIndice;
    }

    tocarMusicaAtual(true);
}


// ==========================================================
// ANTERIOR
// ==========================================================

function musicaAnterior() {

    if (!filaAtual.length) {
        return;
    }

    if (indiceAtual > 0) {

        indiceAtual--;

    } else {

        indiceAtual =
            filaAtual.length - 1;
    }

    tocarMusicaAtual(true);
}


// ==========================================================
// PLAY / PAUSE
// ==========================================================

function alternarPlayPause() {

    if (!audio) {
        return;
    }

    if (!audio.src) {

        if (
            !filaAtual.length &&
            todasAsMusicas.length
        ) {

            prepararFilaNormal();

            indiceAtual = 0;

            tocarMusicaAtual(true);
        }

        return;
    }

    if (audio.paused) {

        audio.play()
            .catch((erro) => {

                console.error(
                    "Erro no play:",
                    erro
                );
            });

    } else {

        audio.pause();
    }
}


// ==========================================================
// ATUALIZAR BOTÃO PLAY
// ==========================================================

function atualizarBotaoPlay() {

    if (!botaoPlay || !audio) {
        return;
    }

    if (audio.paused) {

        botaoPlay.classList.remove(
            "tocando"
        );

        botaoPlay.setAttribute(
            "title",
            "Reproduzir"
        );

        botaoPlay.setAttribute(
            "aria-label",
            "Reproduzir"
        );

    } else {

        botaoPlay.classList.add(
            "tocando"
        );

        botaoPlay.setAttribute(
            "title",
            "Pausar"
        );

        botaoPlay.setAttribute(
            "aria-label",
            "Pausar"
        );
    }
}


// ==========================================================
// EVENTOS DO PLAYER
// ==========================================================

if (botaoPlay) {

    botaoPlay.addEventListener(
        "click",
        alternarPlayPause
    );
}

if (botaoAnterior) {

    botaoAnterior.addEventListener(
        "click",
        musicaAnterior
    );
}

if (botaoProxima) {

    botaoProxima.addEventListener(
        "click",
        proximaMusica
    );
}

if (botaoAleatorio) {

    botaoAleatorio.addEventListener(
        "click",
        () => {

            modoAleatorio =
                !modoAleatorio;

            botaoAleatorio.classList.toggle(
                "ativo",
                modoAleatorio
            );
        }
    );
}

if (botaoRepetir) {

    botaoRepetir.addEventListener(
        "click",
        () => {

            modoRepetir =
                !modoRepetir;

            botaoRepetir.classList.toggle(
                "ativo",
                modoRepetir
            );
        }
    );
}


// ==========================================================
// EVENTOS DO ÁUDIO
// ==========================================================

if (audio) {

    audio.addEventListener(
        "play",
        () => {
            atualizarBotaoPlay();
        }
    );

    audio.addEventListener(
        "pause",
        () => {
            atualizarBotaoPlay();
        }
    );

    audio.addEventListener(
        "ended",
        () => {

            if (modoRepetir) {

                audio.currentTime = 0;

                audio.play();

            } else {

                proximaMusica();
            }
        }
    );

    audio.addEventListener(
        "timeupdate",
        () => {

            if (!audio.duration) {
                return;
            }

            const porcentagem =
                (
                    audio.currentTime /
                    audio.duration
                ) * 100;

            if (barraProgresso) {

                barraProgresso.value =
                    porcentagem;
            }

            if (tempoAtual) {

                tempoAtual.textContent =
                    formatarTempo(
                        audio.currentTime
                    );
            }
        }
    );

    audio.addEventListener(
        "loadedmetadata",
        () => {

            if (duracao) {

                duracao.textContent =
                    formatarTempo(
                        audio.duration
                    );
            }
        }
    );
}


// ==========================================================
// BARRA DE PROGRESSO
// ==========================================================

if (barraProgresso) {

    barraProgresso.addEventListener(
        "input",
        () => {

            if (
                !audio ||
                !audio.duration
            ) {
                return;
            }

            audio.currentTime =
                (
                    Number(
                        barraProgresso.value
                    ) / 100
                ) *
                audio.duration;
        }
    );
}


// ==========================================================
// FORMATAR TEMPO
// ==========================================================

function formatarTempo(segundos) {

    if (
        !segundos ||
        Number.isNaN(segundos)
    ) {
        return "0:00";
    }

    const minutos =
        Math.floor(
            segundos / 60
        );

    const segundosRestantes =
        Math.floor(
            segundos % 60
        );

    return `${minutos}:${String(
        segundosRestantes
    ).padStart(2, "0")}`;
}


// ==========================================================
// FEITO PARA VOCÊ
// ==========================================================

function mostrarFeitoParaVoce() {

    if (!listaRecomendacoes) {
        return;
    }

    listaRecomendacoes.innerHTML = "";

    let artistasSelecionados = [];

    try {

        artistasSelecionados =
            JSON.parse(
                localStorage.getItem(
                    "artistasSelecionados"
                )
            ) || [];

    } catch {

        artistasSelecionados = [];
    }

    if (!Array.isArray(artistasSelecionados)) {
        artistasSelecionados = [];
    }

    const artistasNormalizados =
        artistasSelecionados.map(
            (artista) =>
                normalizarTexto(
                    typeof artista === "string"
                        ? artista
                        : artista.nome ||
                          artista.name ||
                          ""
                )
        );

    const recomendacoes =
        todasAsMusicas.filter(
            (musica) => {

                const artista =
                    normalizarTexto(
                        musica.artista ||
                        musica.artist ||
                        ""
                    );

                return artistasNormalizados.some(
                    (selecionado) =>
                        artista.includes(
                            selecionado
                        ) ||
                        selecionado.includes(
                            artista
                        )
                );
            }
        );

    recomendacoes.forEach(
        (musica) => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "card-musica";

            const capa =
                musica.capa ||
                musica.cover ||
                "../logo.png";

            const nome =
                musica.nome ||
                musica.name ||
                "Música";

            const artista =
                musica.artista ||
                musica.artist ||
                "Artista";

            card.innerHTML = `
                <img
                    class="capa-musica"
                    src="${capa}"
                    alt="${nome}"
                >

                <div class="info-musica">
                    <strong>${nome}</strong>
                    <span>${artista}</span>
                </div>
            `;

            card.addEventListener(
                "click",
                () => {
                    selecionarMusica(musica);
                }
            );

            listaRecomendacoes.appendChild(
                card
            );
        }
    );
}


// ==========================================================
// PLAYLISTS
// ==========================================================

const chavePlaylists = "playlists";


function obterPlaylists() {

    try {

        return JSON.parse(
            localStorage.getItem(
                chavePlaylists
            )
        ) || [];

    } catch {

        return [];
    }
}


function salvarPlaylists(playlists) {

    localStorage.setItem(
        chavePlaylists,
        JSON.stringify(playlists)
    );
}


// ==========================================================
// ELEMENTOS PLAYLIST
// ==========================================================

const btnCriarPlaylist =
    document.getElementById(
        "btnCriarPlaylist"
    );

const modalCriarPlaylist =
    document.getElementById(
        "modalCriarPlaylist"
    );

const fecharModal =
    document.getElementById(
        "fecharModal"
    );

const salvarPlaylist =
    document.getElementById(
        "salvarPlaylist"
    );

const nomePlaylist =
    document.getElementById(
        "nomePlaylist"
    );

const listaPlaylists =
    document.getElementById(
        "listaPlaylists"
    );

const modalPlaylist =
    document.getElementById(
        "modalPlaylist"
    );

const fecharPlaylist =
    document.getElementById(
        "fecharPlaylist"
    );

const conteudoPlaylist =
    document.getElementById(
        "conteudoPlaylist"
    );


// ==========================================================
// MOSTRAR PLAYLISTS
// ==========================================================

function mostrarPlaylists() {

    if (!listaPlaylists) {
        return;
    }

    listaPlaylists.innerHTML = "";

    const playlists =
        obterPlaylists();

    playlists.forEach(
        (playlist) => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "playlist-item";

            const musicas =
                playlist.musicas || [];

            const capas =
                musicas
                    .slice(0, 4)
                    .map(
                        (musica) =>
                            musica.capa
                    )
                    .filter(Boolean);

            let capa =
                playlist.capa ||
                "../logo.png";

            if (capas.length > 0) {
                capa = capas[0];
            }

            item.innerHTML = `
                <img
                    class="capa-playlist"
                    src="${capa}"
                    alt="${playlist.nome}"
                >

                <span>
                    ${playlist.nome}
                </span>
            `;

            item.addEventListener(
                "click",
                () => {
                    abrirPlaylist(playlist);
                }
            );

            listaPlaylists.appendChild(
                item
            );
        }
    );
}


// ==========================================================
// CRIAR PLAYLIST
// ==========================================================

if (btnCriarPlaylist) {

    btnCriarPlaylist.addEventListener(
        "click",
        () => {

            if (modalCriarPlaylist) {

                modalCriarPlaylist.style.display =
                    "flex";
            }

            if (nomePlaylist) {

                nomePlaylist.value = "";

                nomePlaylist.focus();
            }
        }
    );
}


if (fecharModal) {

    fecharModal.addEventListener(
        "click",
        () => {

            if (modalCriarPlaylist) {

                modalCriarPlaylist.style.display =
                    "none";
            }
        }
    );
}


if (salvarPlaylist) {

    salvarPlaylist.addEventListener(
        "click",
        () => {

            const nome =
                nomePlaylist
                    ? nomePlaylist.value.trim()
                    : "";

            if (!nome) {

                alert(
                    "Digite um nome para a playlist."
                );

                return;
            }

            const playlists =
                obterPlaylists();

            playlists.push({

                id:
                    Date.now().toString(),

                nome: nome,

                musicas: [],

                capa: "../logo.png"
            });

            salvarPlaylists(playlists);

            mostrarPlaylists();

            if (modalCriarPlaylist) {

                modalCriarPlaylist.style.display =
                    "none";
            }
        }
    );
}


// ==========================================================
// ABRIR PLAYLIST
// ==========================================================

function abrirPlaylist(playlist) {

    if (
        !modalPlaylist ||
        !conteudoPlaylist
    ) {
        return;
    }

    conteudoPlaylist.innerHTML = "";

    const titulo =
        document.createElement("h2");

    titulo.textContent =
        playlist.nome;

    conteudoPlaylist.appendChild(
        titulo
    );

    const musicas =
        playlist.musicas || [];

    if (!musicas.length) {

        const vazio =
            document.createElement("p");

        vazio.textContent =
            "Essa playlist ainda está vazia.";

        conteudoPlaylist.appendChild(
            vazio
        );

    } else {

        musicas.forEach(
            (musica) => {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "musica-playlist";

                item.innerHTML = `
                    <img
                        src="${musica.capa || musica.cover || "../logo.png"}"
                        alt="${musica.nome || musica.name || "Música"}"
                    >

                    <div>
                        <strong>
                            ${musica.nome || musica.name || "Música"}
                        </strong>

                        <span>
                            ${musica.artista || musica.artist || "Artista"}
                        </span>
                    </div>
                `;

                item.addEventListener(
                    "click",
                    () => {

                        selecionarMusica(
                            musica,
                            musicas,
                            true
                        );
                    }
                );

                conteudoPlaylist.appendChild(
                    item
                );
            }
        );
    }

    const adicionar =
        document.createElement(
            "button"
        );

    adicionar.textContent =
        "Adicionar músicas";

    adicionar.addEventListener(
        "click",
        () => {

            abrirSeletorDeMusicas(
                playlist
            );
        }
    );

    conteudoPlaylist.appendChild(
        adicionar
    );

    modalPlaylist.style.display =
        "flex";
}


// ==========================================================
// SELECIONAR MÚSICAS PARA PLAYLIST
// ==========================================================

function abrirSeletorDeMusicas(playlist) {

    if (!conteudoPlaylist) {
        return;
    }

    conteudoPlaylist.innerHTML = `
        <h2>
            Adicionar músicas
        </h2>
    `;

    todasAsMusicas.forEach(
        (musica) => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "musica-playlist";

            const jaExiste =
                (playlist.musicas || [])
                    .some(
                        (item) =>
                            mesmaMusica(
                                item,
                                musica
                            )
                    );

            item.innerHTML = `
                <img
                    src="${musica.capa || musica.cover || "../logo.png"}"
                    alt="${musica.nome || musica.name || "Música"}"
                >

                <div>
                    <strong>
                        ${musica.nome || musica.name || "Música"}
                    </strong>

                    <span>
                        ${musica.artista || musica.artist || "Artista"}
                    </span>
                </div>

                <button>
                    ${
                        jaExiste
                            ? "Remover"
                            : "Adicionar"
                    }
                </button>
            `;

            const botao =
                item.querySelector(
                    "button"
                );

            botao.addEventListener(
                "click",
                (evento) => {

                    evento.stopPropagation();

                    const playlists =
                        obterPlaylists();

                    const atual =
                        playlists.find(
                            (p) =>
                                p.id ===
                                playlist.id
                        );

                    if (!atual) {
                        return;
                    }

                    atual.musicas =
                        atual.musicas || [];

                    const indice =
                        atual.musicas.findIndex(
                            (m) =>
                                mesmaMusica(
                                    m,
                                    musica
                                )
                        );

                    if (indice >= 0) {

                        atual.musicas.splice(
                            indice,
                            1
                        );

                        botao.textContent =
                            "Adicionar";

                    } else {

                        atual.musicas.push(
                            musica
                        );

                        botao.textContent =
                            "Remover";
                    }

                    if (
                        atual.musicas.length
                    ) {

                        atual.capa =
                            atual.musicas[0].capa ||
                            atual.musicas[0].cover ||
                            "../logo.png";

                    } else {

                        atual.capa =
                            "../logo.png";
                    }

                    salvarPlaylists(
                        playlists
                    );

                    mostrarPlaylists();
                }
            );

            conteudoPlaylist.appendChild(
                item
            );
        }
    );
}


// ==========================================================
// FECHAR PLAYLIST
// ==========================================================

if (fecharPlaylist) {

    fecharPlaylist.addEventListener(
        "click",
        () => {

            if (modalPlaylist) {

                modalPlaylist.style.display =
                    "none";
            }
        }
    );
}


// ==========================================================
// LOGIN
// ==========================================================

const botaoLogin =
    document.getElementById(
        "login"
    );

if (botaoLogin) {

    botaoLogin.addEventListener(
        "click",
        async () => {

            const email =
                document.getElementById(
                    "emailLogin"
                )?.value.trim();

            const senha =
                document.getElementById(
                    "passwordLogin"
                )?.value;

            if (!email || !senha) {

                alert(
                    "Preencha email e senha."
                );

                return;
            }

            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    senha
                );

                window.location.href =
                    "artistas.html";

            } catch (erro) {

                console.error(erro);

                alert(
                    "Não foi possível fazer login."
                );
            }
        }
    );
}


// ==========================================================
// CADASTRO
// ==========================================================

const botaoCadastrar =
    document.getElementById(
        "cadastrar"
    );

if (botaoCadastrar) {

    botaoCadastrar.addEventListener(
        "click",
        async () => {

            const nome =
                document.getElementById(
                    "nameCadastro"
                )?.value.trim();

            const email =
                document.getElementById(
                    "emailCadastro"
                )?.value.trim();

            const senha =
                document.getElementById(
                    "passwordCadastro"
                )?.value;

            const confirmar =
                document.getElementById(
                    "passwordConfirmar"
                )?.value;

            if (
                !nome ||
                !email ||
                !senha ||
                !confirmar
            ) {

                alert(
                    "Preencha todos os campos."
                );

                return;
            }

            if (senha !== confirmar) {

                alert(
                    "As senhas não são iguais."
                );

                return;
            }

            try {

                const credencial =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        senha
                    );

                await updateProfile(
                    credencial.user,
                    {
                        displayName: nome
                    }
                );

                alert(
                    "Cadastro realizado com sucesso!"
                );

                window.location.href =
                    "artistas.html";

            } catch (erro) {

                console.error(
                    "Erro no cadastro:",
                    erro
                );

                alert(
                    "Erro ao criar a conta."
                );
            }
        }
    );
}


// ==========================================================
// ESTADO DO USUÁRIO
// ==========================================================

onAuthStateChanged(
    auth,
    (usuario) => {

        if (usuario) {

            console.log(
                "Usuário conectado:",
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

        } else {

            console.log(
                "Nenhum usuário conectado."
            );
        }
    }
);


// ==========================================================
// INICIALIZAÇÃO
// ==========================================================

carregarMusicas();
mostrarPlaylists();
mostrarHistorico();