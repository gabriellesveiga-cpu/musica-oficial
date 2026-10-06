import requests
import json
import os
import re
import time
import unicodedata
from difflib import SequenceMatcher

# ==========================================
# CONFIGURAÇÕES
# ==========================================

PASTA_MUSICAS = "Músicas"
ARQUIVO_JSON = "Dados/playlists.json"
ARQUIVO_RESULTADOS = "Dados/resultados-musicas.json"

# Quantos resultados queremos analisar por música
LIMITE_RESULTADOS = 10

# Pausa entre pesquisas para não fazer muitas
# requisições de uma vez
TEMPO_ENTRE_BUSCAS = 1


# ==========================================
# FUNÇÕES DE LIMPEZA
# ==========================================

def remover_acentos(texto):
    texto = unicodedata.normalize("NFD", texto)
    return "".join(
        caractere
        for caractere in texto
        if unicodedata.category(caractere) != "Mn"
    )


def limpar_nome(nome):
    """
    Limpa o nome do arquivo para melhorar a pesquisa.
    """

    nome = os.path.splitext(nome)[0]

    # Troca alguns separadores por espaços
    nome = nome.replace("_", " ")
    nome = nome.replace("-", " ")

    # Remove caracteres especiais
    nome = re.sub(r"[()\[\]{}]", " ", nome)

    # Remove emojis e símbolos muito estranhos
    nome = re.sub(
        r"[^\w\sÀ-ÿ]",
        " ",
        nome,
        flags=re.UNICODE
    )

    # Espaços duplicados
    nome = re.sub(r"\s+", " ", nome)

    return nome.strip()


def normalizar(texto):
    """
    Deixa os textos mais fáceis de comparar.
    """

    if not texto:
        return ""

    texto = remover_acentos(texto)
    texto = texto.lower()

    texto = re.sub(r"[^a-z0-9\s]", " ", texto)
    texto = re.sub(r"\s+", " ", texto)

    return texto.strip()


def semelhanca(a, b):
    """
    Calcula semelhança entre dois textos.
    """

    a = normalizar(a)
    b = normalizar(b)

    if not a or not b:
        return 0

    return SequenceMatcher(None, a, b).ratio()


# ==========================================
# TERMOS QUE NORMALMENTE NÃO FAZEM PARTE
# DO NOME PRINCIPAL DA MÚSICA
# ==========================================

PALAVRAS_EXTRAS = [
    "official",
    "official video",
    "official audio",
    "clipe",
    "video",
    "visualizer",
    "lyrics",
    "lyric",
    "slowed",
    "sped up",
    "remix",
    "remix oficial",
    "instrumental",
    "karaoke",
    "cover",
    "live",
    "prod",
    "produção",
    "tiktok",
    "funk",
]


def remover_extras(nome):
    """
    Tenta retirar partes muito comuns de nomes de arquivos
    que podem atrapalhar a busca.
    """

    resultado = nome

    resultado_lower = normalizar(resultado)

    for palavra in PALAVRAS_EXTRAS:

        posicao = resultado_lower.find(
            normalizar(palavra)
        )

        if posicao != -1:
            resultado = resultado[:posicao]

            resultado_lower = normalizar(resultado)

    return resultado.strip()


# ==========================================
# BUSCA NO ITUNES
# ==========================================

def pesquisar_itunes(nome):
    print()
    print("=" * 60)
    print("🔎 Procurando:", nome)
    print("=" * 60)

    url = "https://itunes.apple.com/search"

    params = {
        "term": nome,
        "media": "music",
        "entity": "song",
        "limit": LIMITE_RESULTADOS
    }

    try:

        resposta = requests.get(
            url,
            params=params,
            timeout=15
        )

        if resposta.status_code != 200:
            print(
                "❌ API retornou:",
                resposta.status_code
            )

            return []

        dados = resposta.json()

        resultados = dados.get(
            "results",
            []
        )

        if not resultados:
            print("❌ Nenhum resultado encontrado.")
            return []

        print(
            f"📋 {len(resultados)} resultados encontrados."
        )

        return resultados

    except Exception as erro:

        print("❌ Erro na pesquisa:")
        print(erro)

        return []


# ==========================================
# CALCULAR PONTUAÇÃO
# ==========================================

def calcular_pontuacao(nome_arquivo, resultado):

    titulo = resultado.get(
        "trackName",
        ""
    )

    artista = resultado.get(
        "artistName",
        ""
    )

    album = resultado.get(
        "collectionName",
        ""
    )

    nome_normalizado = normalizar(
        nome_arquivo
    )

    titulo_normalizado = normalizar(
        titulo
    )

    # --------------------------------------
    # COMPARAÇÃO DO TÍTULO
    # --------------------------------------

    pontuacao_titulo = semelhanca(
        nome_arquivo,
        titulo
    )

    # --------------------------------------
    # COMPARAÇÃO REMOVENDO EXTRAS
    # --------------------------------------

    nome_limpo = remover_extras(
        nome_arquivo
    )

    pontuacao_limpa = semelhanca(
        nome_limpo,
        titulo
    )

    # Pegamos a melhor das duas
    pontuacao = max(
        pontuacao_titulo,
        pontuacao_limpa
    )

    # --------------------------------------
    # BÔNUS PARA NOME EXATO
    # --------------------------------------

    if nome_normalizado == titulo_normalizado:
        pontuacao += 0.30

    # --------------------------------------
    # LIMITAR A 1
    # --------------------------------------

    if pontuacao > 1:
        pontuacao = 1

    return round(
        pontuacao,
        3
    )


# ==========================================
# TRANSFORMAR RESULTADO
# ==========================================

def transformar_resultado(resultado, pontuacao):

    capa = resultado.get(
        "artworkUrl100",
        ""
    )

    # Tenta pegar uma capa maior
    if capa:
        capa = capa.replace(
            "100x100bb",
            "600x600bb"
        )

    return {
        "nome": resultado.get(
            "trackName",
            ""
        ),

        "artista": resultado.get(
            "artistName",
            ""
        ),

        "album": resultado.get(
            "collectionName",
            ""
        ),

        "capa": capa,

        "pontuacao": pontuacao,

        "trackId": resultado.get(
            "trackId",
            ""
        )
    }


# ==========================================
# CARREGAR PLAYLISTS.JSON
# ==========================================

try:

    with open(
        ARQUIVO_JSON,
        "r",
        encoding="utf-8-sig"
    ) as arquivo:

        musicas_json = json.load(
            arquivo
        )

except Exception as erro:

    print()
    print("❌ Não consegui abrir:")
    print(ARQUIVO_JSON)
    print()
    print(erro)

    exit()


# ==========================================
# PROCESSAMENTO
# ==========================================

resultados_finais = []

total = len(musicas_json)

print()
print("🎵 INICIANDO ANÁLISE")
print()
print("Total de músicas:", total)
print()


for numero, musica in enumerate(
    musicas_json,
    start=1
):

    arquivo_audio = musica.get(
        "arquivo",
        ""
    )

    nome_arquivo = os.path.basename(
        arquivo_audio
    )

    nome_musica = limpar_nome(
        nome_arquivo
    )

    print()
    print(
        f"🎧 [{numero}/{total}] {nome_musica}"
    )

    # --------------------------------------
    # PESQUISAR
    # --------------------------------------

    candidatos = pesquisar_itunes(
        nome_musica
    )

    if not candidatos:

        resultados_finais.append({

            "arquivo": arquivo_audio,

            "nome_arquivo": nome_musica,

            "status": "nao_encontrado",

            "melhor_resultado": None,

            "candidatos": []

        })

        time.sleep(
            TEMPO_ENTRE_BUSCAS
        )

        continue


    # --------------------------------------
    # CALCULAR PONTUAÇÕES
    # --------------------------------------

    candidatos_processados = []

    for candidato in candidatos:

        pontuacao = calcular_pontuacao(
            nome_musica,
            candidato
        )

        convertido = transformar_resultado(
            candidato,
            pontuacao
        )

        candidatos_processados.append(
            convertido
        )


    # --------------------------------------
    # ORDENAR
    # --------------------------------------

    candidatos_processados.sort(
        key=lambda x: x["pontuacao"],
        reverse=True
    )


    melhor = candidatos_processados[0]

    # --------------------------------------
    # DEFINIR STATUS
    # --------------------------------------

    pontuacao = melhor["pontuacao"]

    if pontuacao >= 0.90:

        status = "alta_confianca"

    elif pontuacao >= 0.70:

        status = "media_confianca"

    else:

        status = "baixa_confianca"


    # --------------------------------------
    # MOSTRAR RESULTADO
    # --------------------------------------

    print()
    print("🏆 MELHOR RESULTADO:")

    print(
        "   Música:",
        melhor["nome"]
    )

    print(
        "   Artista:",
        melhor["artista"]
    )

    print(
        "   Álbum:",
        melhor["album"]
    )

    print(
        "   Pontuação:",
        melhor["pontuacao"]
    )

    print(
        "   Status:",
        status
    )


    # --------------------------------------
    # GUARDAR
    # --------------------------------------

    resultados_finais.append({

        "arquivo": arquivo_audio,

        "nome_arquivo": nome_musica,

        "status": status,

        "melhor_resultado": melhor,

        "candidatos": candidatos_processados

    })


    # --------------------------------------
    # ESPERAR
    # --------------------------------------

    time.sleep(
        TEMPO_ENTRE_BUSCAS
    )


# ==========================================
# SALVAR RESULTADOS
# ==========================================

with open(
    ARQUIVO_RESULTADOS,
    "w",
    encoding="utf-8"
) as arquivo:

    json.dump(
        resultados_finais,
        arquivo,
        ensure_ascii=False,
        indent=2
    )


# ==========================================
# RESUMO
# ==========================================

alta = 0
media = 0
baixa = 0
nao_encontrada = 0


for resultado in resultados_finais:

    status = resultado["status"]

    if status == "alta_confianca":
        alta += 1

    elif status == "media_confianca":
        media += 1

    elif status == "baixa_confianca":
        baixa += 1

    elif status == "nao_encontrado":
        nao_encontrada += 1


print()
print()
print("=" * 60)
print("✅ ANÁLISE CONCLUÍDA")
print("=" * 60)

print()
print("🎵 Total:", total)
print("🟢 Alta confiança:", alta)
print("🟡 Média confiança:", media)
print("🔴 Baixa confiança:", baixa)
print("⚫ Não encontrada:", nao_encontrada)

print()
print(
    "📄 Resultado salvo em:"
)
print(
    ARQUIVO_RESULTADOS
)

print()
print(
    "⚠️ O playlists.json NÃO foi alterado."
)

print()