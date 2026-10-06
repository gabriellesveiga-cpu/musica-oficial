const express = require("express");
const cors = require("cors");
const session = require("express-session");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

console.log("CLIENT ID:", process.env.SPOTIFY_CLIENT_ID);
console.log("REDIRECT:", process.env.SPOTIFY_REDIRECT_URI);


const app = express();

app.use(cors());
app.use(express.json());

app.use(
    session({
        secret: "clone-spotfy-segredo-local",
        resave: false,
        saveUninitialized: false
    })
);

// Página inicial
app.get("/", (req, res) => {
    res.send("Servidor do Clone-Spotfy funcionando!");
});

// Login com Spotify
app.get("/login", (req, res) => {

    const scope = "playlist-read-private playlist-read-collaborative";

    const params = new URLSearchParams({
        client_id: process.env.SPOTIFY_CLIENT_ID,
        response_type: "code",
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        scope: scope
    });

    const url =
        "https://accounts.spotify.com/authorize?" +
        params.toString();

console.log("REDIRECT:", process.env.SPOTIFY_REDIRECT_URI);

    res.redirect(url);
});

// Retorno do Spotify
app.get("/callback", async (req, res) => {

    const code = req.query.code;

    if (!code) {
        return res.status(400).send("Código de autorização não recebido.");
    }

    try {

        const resposta = await fetch(
            "https://accounts.spotify.com/api/token",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded",

                    "Authorization":
                        "Basic " +
                        Buffer.from(
                            process.env.SPOTIFY_CLIENT_ID +
                            ":" +
                            process.env.SPOTIFY_CLIENT_SECRET
                        ).toString("base64")
                },

                body: new URLSearchParams({
                    grant_type: "authorization_code",
                    code: code,
                    redirect_uri:
                        process.env.SPOTIFY_REDIRECT_URI
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            console.log(dados);

            return res.status(400).send(
                "Erro ao autorizar o Spotify."
            );
        }

        req.session.access_token = dados.access_token;
        req.session.refresh_token = dados.refresh_token;

        res.send(`
            <h1>Spotify conectado! 🎵</h1>
            <p>Agora sua conta do Spotify está conectada ao Clone-Spotfy.</p>
            <p>Você pode fechar esta página.</p>
        `);

    } catch (erro) {

        console.error(erro);

        res.status(500).send(
            "Erro ao conectar com o Spotify."
        );
    }
});

app.get("/minhas-playlists", async (req, res) => {

    const token = req.session.access_token;

    if (!token) {
        return res.status(401).json({
            erro: "Spotify não conectado."
        });
    }

    try {

        const resposta = await fetch(
            "https://api.spotify.com/v1/me/playlists",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            return res.status(resposta.status).json(dados);
        }

        res.json(dados);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao buscar playlists."
        });
    }
});

app.get("/playlist/:id", async (req, res) => {

    const token = req.session.access_token;

    if (!token) {
        return res.status(401).json({
            erro: "Spotify não conectado."
        });
    }

    try {

        const playlistId = req.params.id;

        const resposta = await fetch(
            `https://api.spotify.com/v1/playlists/${playlistId}/items`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const dados = await resposta.json();

        console.log("ITENS DA PLAYLIST:", JSON.stringify(dados.items, null, 2));

        if (!resposta.ok) {
            return res.status(resposta.status).json(dados);
        }

const musicas = dados.items
    .filter(item => item.item && item.item.type === "track")
    .map(item => ({
        nome: item.item.name,
        artista: item.item.artists
            .map(artista => artista.name)
            .join(", "),
        album: item.item.album?.name || "",
        capa: item.item.album?.images?.[0]?.url || ""
    }));

const arquivo = path.join(__dirname, "../Dados/playlists.json");

let musicasExistentes = [];

if (fs.existsSync(arquivo)) {
    try {
        const conteudo = fs.readFileSync(arquivo, "utf8");

        if (conteudo.trim()) {
            musicasExistentes = JSON.parse(conteudo);
        }
    } catch (erro) {
        console.log("Não foi possível ler o arquivo existente.");
    }
}

const todasAsMusicas = [
    ...musicasExistentes,
    ...musicas
];

fs.writeFileSync(
    arquivo,
    JSON.stringify(todasAsMusicas, null, 2),
    "utf8"
);

res.json({
    mensagem: "Playlist salva com sucesso!",
    quantidade: musicas.length,
    musicas: musicas
});

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao buscar playlist."
        });
    }
});

app.get("/buscar-musica", async (req, res) => {
    try {
        const nome = req.query.nome;

        if (!nome) {
            return res.status(400).json({
                erro: "Informe o nome da música."
            });
        }

        if (!req.session.access_token) {
            return res.status(401).json({
                erro: "Spotify não está conectado."
            });
        }

        const resposta = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(nome)}&type=track&limit=10&market=BR`,
            {
                headers: {
                    Authorization: `Bearer ${req.session.access_token}`
                }
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            return res.status(resposta.status).json(dados);
        }

        const resultados = dados.tracks.items.map(musica => ({
            nome: musica.name,

            artista: musica.artists
                .map(artista => artista.name)
                .join(", "),

            album: musica.album.name,

            capa: musica.album.images?.[0]?.url || "",

            spotifyUrl:
                musica.external_urls?.spotify || "",

            spotifyId: musica.id
        }));

        res.json(resultados);

    } catch (erro) {

        console.error("Erro ao buscar música:", erro);

        res.status(500).json({
            erro: "Erro ao consultar o Spotify."
        });
    }
});

// ==========================================
// ATUALIZAR DADOS DAS MÚSICAS PELO SPOTIFY
// ==========================================

app.get("/atualizar-musicas", async (req, res) => {
    try {
        const token = req.session.access_token;

        if (!token) {
            return res.status(401).json({
                erro: "Spotify não está conectado."
            });
        }

        const arquivo = path.join(
            __dirname,
            "../Dados/playlists.json"
        );

        if (!fs.existsSync(arquivo)) {
            return res.status(404).json({
                erro: "playlists.json não encontrado."
            });
        }

        const texto = fs
            .readFileSync(arquivo, "utf8")
            .replace(/^\uFEFF/, "");

        const musicas = JSON.parse(texto);

        let atualizadas = 0;
        let naoEncontradas = 0;

        for (const musica of musicas.filter(m => 
    m.arquivo.toLowerCase().includes("likejennie")
)) {

            try {
               const nomeArquivo = path
    .basename(musica.arquivo || "", path.extname(musica.arquivo || ""));

const nomeOriginal = nomeArquivo || musica.nome || "";

                if (!nomeOriginal.trim()) {
                    naoEncontradas++;
                    continue;
                }

                console.log("");
                console.log("🔎 Procurando:", nomeOriginal);
                console.log("📁 ARQUIVO:", musica.arquivo);
console.log("🔤 NOME USADO NA BUSCA:", nomeOriginal);

               let termoBusca = nomeOriginal;

if (
    normalizar(nomeOriginal) === "likejennie"
) {
    termoBusca = "like JENNIE";
}

const resposta = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(termoBusca)}&type=track&limit=10&market=BR`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const dados = await resposta.json();

                if (
                    !resposta.ok ||
                    !dados.tracks ||
                    !dados.tracks.items ||
                    dados.tracks.items.length === 0
                ) {
                    console.log("❌ Não encontrada:", nomeOriginal);
                    naoEncontradas++;
                    continue;
                }

               const resultados = dados.tracks.items;

               console.log("🔎 RESULTADOS ENCONTRADOS PELO SPOTIFY:");

for (const resultado of resultados) {
    console.log(
        "🎵",
        resultado.name,
        "—",
        resultado.artists.map(a => a.name).join(", ")
    );
}

// ==========================================
// COMPARAÇÃO MAIS SEGURA COM O SPOTIFY
// ==========================================

const normalizar = texto =>
    texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const nomeBusca = normalizar(nomeOriginal);

// Remove informações comuns de nomes de arquivos
const nomeLimpo = nomeBusca
    .replace(/\bmp3\b/g, "")
    .replace(/\b(audio|official|video|music|lyrics|lyric|visualizer)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

let melhorResultado = null;
let melhorPontuacao = 0;

for (const resultado of resultados) {

    const nomeSpotify = normalizar(resultado.name);

    let pontuacao = 0;

    // ==========================================
    // 1. NOME EXATAMENTE IGUAL
    // ==========================================

    if (nomeSpotify === nomeLimpo) {
        pontuacao += 100;
    }

    // ==========================================
    // 2. UM NOME CONTÉM O OUTRO
    // ==========================================

    if (
        nomeSpotify.includes(nomeLimpo) ||
        nomeLimpo.includes(nomeSpotify)
    ) {
        pontuacao += 40;
    }

    // ==========================================
    // 3. COMPARAÇÃO POR PALAVRAS
    // ==========================================

    const palavrasBusca = nomeLimpo
        .split(" ")
        .filter(palavra => palavra.length >= 3);

    const palavrasSpotify = nomeSpotify
        .split(" ")
        .filter(palavra => palavra.length >= 3);

    let palavrasIguais = 0;

    for (const palavra of palavrasBusca) {

        if (palavrasSpotify.includes(palavra)) {
            palavrasIguais++;
        }
    }

    if (palavrasBusca.length > 0) {

        const porcentagem =
            palavrasIguais / palavrasBusca.length;

        pontuacao += porcentagem * 40;
    }

    // ==========================================
    // 4. PENALIZA RESULTADOS MUITO DIFERENTES
    // ==========================================

    if (
        palavrasBusca.length >= 2 &&
        palavrasIguais === 0
    ) {
        pontuacao -= 50;
    }

    // ==========================================
    // 5. PRIORIDADE PARA ARTISTAS CONHECIDOS
    // ==========================================

    const artistas = resultado.artists
        .map(artista => normalizar(artista.name));

    // Se o nome original contém o nome de um artista
    // conhecido, damos uma pontuação extra.
    for (const artista of artistas) {

        if (
            artista &&
            nomeLimpo.includes(artista)
        ) {
            pontuacao += 30;
        }
    }

    console.log(
        `   → ${resultado.name} — ${resultado.artists.map(a => a.name).join(", ")} | ${pontuacao.toFixed(1)} pontos`
    );

    if (pontuacao > melhorPontuacao) {

        melhorPontuacao = pontuacao;
        melhorResultado = resultado;
    }
}

// ==========================================
// SÓ ACEITA RESULTADOS COM BOA CONFIANÇA
// ==========================================

if (
    !melhorResultado ||
    melhorPontuacao < 70
) {

    console.log(
        `⚠️ Correspondência insegura: ${nomeOriginal}`
    );

    console.log(
        `   Melhor resultado: ${
            melhorResultado
                ? melhorResultado.name
                : "nenhum"
        }`
    );

    console.log(
        `   Pontuação: ${melhorPontuacao.toFixed(1)}`
    );

    naoEncontradas++;
    continue;
}

                musica.artista = melhorResultado.artists
                    .map(artista => artista.name)
                    .join(", ");

                musica.album =
                    melhorResultado.album?.name || "";

                musica.capa =
                    melhorResultado.album?.images?.[0]?.url || "";

                musica.spotifyId =
                    melhorResultado.id;

                musica.spotifyUrl =
                    melhorResultado.external_urls?.spotify || "";

                atualizadas++;

                console.log(
                    `✅ ${nomeOriginal} → ${musica.nome} — ${musica.artista}`
                );

                await new Promise(resolve =>
                    setTimeout(resolve, 150)
                );

            } catch (erroMusica) {

                console.log(
                    `⚠️ Erro em ${musica.nome}:`,
                    erroMusica.message
                );

                naoEncontradas++;
            }
        }

        fs.writeFileSync(
            arquivo,
            JSON.stringify(musicas, null, 2),
            "utf8"
        );

        console.log("");
        console.log("==========================================");
        console.log("✅ ATUALIZAÇÃO CONCLUÍDA");
        console.log("==========================================");
        console.log("Total:", musicas.length);
        console.log("Atualizadas:", atualizadas);
        console.log("Não encontradas:", naoEncontradas);
        console.log("==========================================");

        res.json({
            sucesso: true,
            total: musicas.length,
            atualizadas: atualizadas,
            naoEncontradas: naoEncontradas
        });

    } catch (erro) {

        console.error(
            "❌ Erro ao atualizar músicas:",
            erro
        );

        res.status(500).json({
            erro: "Erro ao atualizar músicas.",
            detalhe: erro.message
        });
    }
});

// ==========================================
// ANÁLISE FINAL DOS CANDIDATOS DO SPOTIFY
// ==========================================

app.get("/analisar-final", async (req, res) => {
    try {

        const fs = require("fs");
        const path = require("path");

        const arquivo = path.join(
            __dirname,
            "../Dados/candidatos-spotify.json"
        );

        const saida = path.join(
            __dirname,
            "../Dados/analise-final-spotify.json"
        );

        // Ler arquivo
        const texto = fs
            .readFileSync(arquivo, "utf8")
            .replace(/^\uFEFF/, "");

        const dados = JSON.parse(texto);

        // Normalizar texto
        function normalizar(texto) {
            return String(texto || "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9\s]/g, " ")
                .replace(/\s+/g, " ")
                .trim();
        }

        // Palavras que não ajudam a identificar a música
        const palavrasIgnorar = new Set([
            "official",
            "officialvideo",
            "officialmusicvideo",
            "clipe",
            "video",
            "visualizer",
            "audio",
            "music",
            "oficial",
            "prod",
            "dj"
        ]);

        function palavrasImportantes(texto) {
            return normalizar(texto)
                .split(" ")
                .filter(palavra =>
                    palavra.length >= 3 &&
                    !palavrasIgnorar.has(palavra)
                );
        }

        const resultados = [];

        for (const item of dados) {

            const nomeOriginal =
                item.nome_original || "";

            const palavrasBusca =
                palavrasImportantes(nomeOriginal);

            const candidatosAnalisados =
                (item.candidatos || []).map(candidato => {

                    const nomeSpotify =
                        candidato.nome || "";

                    const palavrasSpotify =
                        palavrasImportantes(nomeSpotify);

                    let pontuacao = 0;

                    const originalNormalizado =
                        normalizar(nomeOriginal);

                    const spotifyNormalizado =
                        normalizar(nomeSpotify);

                    // ==================================
                    // NOME EXATAMENTE IGUAL
                    // ==================================

                    if (
                        originalNormalizado ===
                        spotifyNormalizado
                    ) {
                        pontuacao += 100;
                    }

                    // ==================================
                    // UM NOME CONTÉM O OUTRO
                    // ==================================

                    if (
                        spotifyNormalizado.includes(
                            originalNormalizado
                        )
                    ) {
                        pontuacao += 50;
                    }

                    if (
                        originalNormalizado.includes(
                            spotifyNormalizado
                        )
                    ) {
                        pontuacao += 40;
                    }

                    // ==================================
                    // PALAVRAS EM COMUM
                    // ==================================

                    let palavrasIguais = 0;

                    for (const palavra of palavrasBusca) {

                        if (
                            palavrasSpotify.includes(
                                palavra
                            )
                        ) {
                            palavrasIguais++;
                        }
                    }

                    pontuacao +=
                        palavrasIguais * 15;

                    // ==================================
                    // PORCENTAGEM DE PALAVRAS
                    // ==================================

                    if (palavrasBusca.length > 0) {

                        const porcentagem =
                            palavrasIguais /
                            palavrasBusca.length;

                        pontuacao +=
                            Math.round(
                                porcentagem * 40
                            );
                    }

                    // ==================================
                    // PENALIZA TÍTULOS MUITO DIFERENTES
                    // ==================================

                    if (
                        palavrasIguais === 0
                    ) {
                        pontuacao -= 80;
                    }

                    // ==================================
                    // RESULTADO
                    // ==================================

                    return {
                        ...candidato,
                        pontuacao
                    };
                });

            // Ordenar do melhor para o pior
            candidatosAnalisados.sort(
                (a, b) =>
                    b.pontuacao -
                    a.pontuacao
            );

            const melhor =
                candidatosAnalisados[0] || null;

            let confianca = "baixa";

            if (melhor) {

                if (
                    melhor.pontuacao >= 100
                ) {
                    confianca = "alta";

                } else if (
                    melhor.pontuacao >= 60
                ) {
                    confianca = "media";
                }
            }

            resultados.push({

                arquivo:
                    item.arquivo || "",

                nome_original:
                    nomeOriginal,

                melhor_resultado:
                    melhor,

                confianca:
                    confianca,

                candidatos:
                    candidatosAnalisados

            });

            console.log(
                `${nomeOriginal} → ` +
                `${melhor?.nome || "NENHUM"} ` +
                `— ${melhor?.artista || ""} ` +
                `(${melhor?.pontuacao || 0} pontos)`
            );
        }

        // ==========================================
        // SALVAR
        // ==========================================

        fs.writeFileSync(
            saida,
            JSON.stringify(
                resultados,
                null,
                2
            ),
            "utf8"
        );

        // ==========================================
        // ESTATÍSTICAS
        // ==========================================

        const alta =
            resultados.filter(
                r => r.confianca === "alta"
            ).length;

        const media =
            resultados.filter(
                r => r.confianca === "media"
            ).length;

        const baixa =
            resultados.filter(
                r => r.confianca === "baixa"
            ).length;

        console.log("");
        console.log(
            "=========================================="
        );
        console.log(
            "✅ ANÁLISE FINAL CONCLUÍDA"
        );
        console.log(
            "=========================================="
        );
        console.log(
            "Total:",
            resultados.length
        );
        console.log(
            "🟢 Alta confiança:",
            alta
        );
        console.log(
            "🟡 Média confiança:",
            media
        );
        console.log(
            "🔴 Baixa confiança:",
            baixa
        );
        console.log(
            "Arquivo:",
            "Dados/analise-final-spotify.json"
        );

        res.json({
            sucesso: true,
            total: resultados.length,
            alta: alta,
            media: media,
            baixa: baixa,
            arquivo:
                "Dados/analise-final-spotify.json"
        });

    } catch (erro) {

        console.error(
            "Erro na análise final:",
            erro
        );

        res.status(500).json({
            erro:
                "Erro na análise final.",
            detalhe:
                erro.message
        });
    }
});

app.listen(3000, () => {
    console.log(
        "Servidor funcionando em http://localhost:3000"
    );
});

